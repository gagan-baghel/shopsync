import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { maybeUser, userFromToken } from "./auth";
import { shippingFor } from "../src/shared";
import { inventoryRow } from "./inventory";
import { getProduct } from "./products";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Customer checkout: prices come from the database (never the client), stock is checked and deducted atomically. */
export const place = mutation({
  args: { token: v.string(), items: v.array(v.object({ productId: v.string(), qty: v.number() })) },
  handler: async (ctx, { token, items }) => {
    const user = await userFromToken(ctx, token);
    if (user.role !== "customer") throw new ConvexError("Only customers can place orders.");
    if (items.length === 0) throw new ConvexError("Your cart is empty.");
    if (items.length > 50) throw new ConvexError("Too many different items in one order (max 50).");
    if (new Set(items.map((i) => i.productId)).size !== items.length) throw new ConvexError("Duplicate items in order.");

    const lines = [];
    for (const { productId, qty } of items) {
      if (!Number.isInteger(qty) || qty < 1 || qty > 999) throw new ConvexError("Invalid quantity.");
      const product = await getProduct(ctx, productId);
      if (!product) throw new ConvexError("A product in your cart is no longer available.");
      const inv = await inventoryRow(ctx, productId);
      if (!inv || !inv.inStock || inv.stock < qty)
        throw new ConvexError(`Only ${inv?.inStock ? inv.stock : 0} of "${product.name}" left.`);
      lines.push({ inv, line: { productId, name: product.name, price: product.price, qty, category: product.category } });
    }

    // All checks passed — the mutation is a single transaction, so deductions and the order land together.
    for (const { inv, line } of lines) {
      const stock = inv.stock - line.qty;
      await ctx.db.patch(inv._id, { stock, inStock: stock > 0 && inv.inStock });
    }
    const subtotal = round2(lines.reduce((a, { line }) => a + line.price * line.qty, 0));
    const shipping = shippingFor(subtotal);
    const total = round2(subtotal + shipping);
    await ctx.db.insert("orders", { customerId: user._id, items: lines.map((l) => l.line), subtotal, shipping, total });
    return { total };
  },
});

/** Supplier dashboard: live order totals + the latest orders. */
export const summary = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await maybeUser(ctx, token);
    if (!user || user.role !== "supplier") return null;
    // ponytail: scans all orders; add a running-totals doc if order volume grows large
    const orders = await ctx.db.query("orders").order("desc").collect();
    const revenue = round2(orders.reduce((a, o) => a + o.subtotal, 0));
    const recent = await Promise.all(
      orders.slice(0, 5).map(async (o) => ({
        id: o._id,
        at: o._creationTime,
        total: o.total,
        units: o.items.reduce((a, i) => a + i.qty, 0),
        first: o.items[0]?.name ?? "",
        more: o.items.length - 1,
        customer: (await ctx.db.get(o.customerId))?.name ?? "Customer",
      })),
    );
    // Live revenue per calendar month of the current year, so each order lands on the month it was placed.
    const year = new Date().getFullYear();
    const byMonth = Array<number>(12).fill(0);
    for (const o of orders) {
      const d = new Date(o._creationTime);
      if (d.getFullYear() === year) byMonth[d.getMonth()] = round2(byMonth[d.getMonth()] + o.subtotal);
    }
    // Live revenue per category, for the dashboard donut.
    const byCategory: Record<string, number> = {};
    for (const o of orders)
      for (const i of o.items)
        if (i.category) byCategory[i.category] = round2((byCategory[i.category] ?? 0) + i.price * i.qty);
    return { count: orders.length, revenue, byMonth, byCategory, recent };
  },
});
