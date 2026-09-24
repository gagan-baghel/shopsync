import { internalMutation } from "./_generated/server";
import { hash } from "./auth";
import products from "../src/data/products.json";

// Test accounts — also listed on the login screen.
const ACCOUNTS = [
  { email: "customer@test.com", name: "Alex Customer", role: "customer" as const },
  { email: "customer2@test.com", name: "Sam Shopper", role: "customer" as const },
  { email: "supplier@test.com", name: "Jordan Supplier", role: "supplier" as const },
];
export const TEST_PASSWORD = "Test@123";

// Idempotent: `npx convex run seed:run`
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const passwordHash = await hash(TEST_PASSWORD);
    for (const a of ACCOUNTS) {
      const exists = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", a.email))
        .unique();
      if (!exists) await ctx.db.insert("users", { ...a, passwordHash });
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
