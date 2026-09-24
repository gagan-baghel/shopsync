import { internalMutation } from "./_generated/server";
import { hash } from "./auth";
import products from "../src/data/products.json";
import { TEST_ACCOUNTS, TEST_PASSWORD } from "../src/shared";

// Idempotent: `npx convex run seed:run`
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const passwordHash = await hash(TEST_PASSWORD);
    for (const a of TEST_ACCOUNTS) {
      const exists = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", a.email))
        .unique();
      if (!exists) await ctx.db.insert("users", { ...a, passwordHash });
    }
    // Catalog lives in Convex so suppliers can edit/delete it; keep the static ids ("p1"…) stable.
    // Insert in reverse so the newest-first list shows p1 first.
    for (const p of [...products].reverse()) {
      const exists = await ctx.db
        .query("products")
        .withIndex("by_key", (q) => q.eq("key", p.id))
        .unique();
      if (!exists) {
        const { id, ...fields } = p;
        await ctx.db.insert("products", { key: id, ...fields });
      }
    }
    for (const [i, p] of products.entries()) {
      const exists = await ctx.db
        .query("inventory")
        .withIndex("by_product", (q) => q.eq("productId", p.id))
        .unique();
      if (!exists)
        await ctx.db.insert("inventory", {
          productId: p.id,
          stock: i % 7 === 3 ? 0 : 10 + ((i * 37) % 90),
          inStock: i % 7 !== 3,
        });
    }
    return "seeded";
  },
});
