import { v, ConvexError } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { userFromToken } from "./auth";

/** The stock row for a product id (seeded `key` or supplier-added `_id`). */
export const inventoryRow = (ctx: QueryCtx, productId: string) =>
  ctx.db.query("inventory").withIndex("by_product", (q) => q.eq("productId", productId)).unique();

export const list = query({
  args: {},
  handler: (ctx) => ctx.db.query("inventory").collect(),
});

/** In-stock toggle. Stock counts are edited with the rest of the product in `products.update`. */
export const setInStock = mutation({
  args: { token: v.string(), productId: v.string(), inStock: v.boolean() },
  handler: async (ctx, { token, productId, inStock }) => {
    const user = await userFromToken(ctx, token);
    if (user.role !== "supplier") throw new ConvexError("Suppliers only");
    const row = await inventoryRow(ctx, productId);
    if (!row) throw new ConvexError("Unknown product");
    await ctx.db.patch(row._id, { inStock });
  },
});
