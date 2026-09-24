import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { userFromToken } from "./auth";

export const list = query({
  args: {},
  handler: (ctx) => ctx.db.query("inventory").collect(),
});

export const update = mutation({
  args: {
    token: v.string(),
    productId: v.string(),
    stock: v.optional(v.number()),
    inStock: v.optional(v.boolean()),
  },
  handler: async (ctx, { token, productId, stock, inStock }) => {
    const user = await userFromToken(ctx, token);
    if (user.role !== "supplier") throw new ConvexError("Suppliers only");
    const row = await ctx.db
      .query("inventory")
      .withIndex("by_product", (q) => q.eq("productId", productId))
      .unique();
    if (!row) throw new ConvexError("Unknown product");
    const patch: { stock?: number; inStock?: boolean } = {};
    if (stock !== undefined) {
      if (!Number.isFinite(stock)) throw new ConvexError("Invalid stock");
      patch.stock = Math.max(0, Math.min(99999, Math.round(stock)));
      if (patch.stock === 0) patch.inStock = false;
      else if (row.stock === 0) patch.inStock = true; // restocked
    }
    if (inStock !== undefined) patch.inStock = inStock;
    await ctx.db.patch(row._id, patch);
  },
});
