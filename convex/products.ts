import { v, ConvexError } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";
import { userFromToken } from "./auth";
import catalog from "../src/data/products.json";

const CATEGORIES = new Set(catalog.map((p) => p.category));

const fields = {
  name: v.string(),
  category: v.string(),
  price: v.number(),
  stock: v.number(),
  description: v.optional(v.string()),
  image: v.optional(v.string()),
};

/** All products (seeded catalog + supplier-added), newest first. Public. */
export const list = query({
  args: {},
  // ponytail: fine for a demo catalog; paginate past ~1k products
  handler: (ctx) => ctx.db.query("products").order("desc").collect(),
});

async function requireSupplier(ctx: MutationCtx, token: string) {
  const user = await userFromToken(ctx, token);
  if (user.role !== "supplier") throw new ConvexError("Suppliers only");
  return user;
}

function validate(a: { name: string; category: string; price: number; stock: number; description?: string; image?: string }) {
  const name = a.name.trim();
  if (name.length < 2 || name.length > 80) throw new ConvexError("Name must be 2–80 characters.");
  if (!CATEGORIES.has(a.category)) throw new ConvexError("Pick a valid category.");
  const price = Math.round(a.price * 100) / 100;
  if (!Number.isFinite(price) || price < 0.01 || price > 100000)
    throw new ConvexError("Price must be between 0.01 and 100,000.");
  if (!Number.isInteger(a.stock) || a.stock < 0 || a.stock > 99999)
    throw new ConvexError("Stock must be a whole number from 0 to 99,999.");
  const image = a.image?.trim() || undefined;
  if (image && (image.length > 2048 || !/^https:\/\/\S+$/.test(image)))
    throw new ConvexError("Image must be an https:// link.");
  return { name, category: a.category, price, image, description: (a.description ?? "").trim().slice(0, 500) };
}

/** Products are addressed by `key` (seeded) or their `_id` (supplier-added) — the same id inventory and carts use. */
async function findProduct(ctx: MutationCtx, id: string) {
  const byKey = await ctx.db.query("products").withIndex("by_key", (q) => q.eq("key", id)).unique();
  if (byKey) return byKey;
  const docId = ctx.db.normalizeId("products", id);
  const doc = docId && (await ctx.db.get(docId));
  if (!doc) throw new ConvexError("Product not found.");
  return doc;
}

const inventoryRow = (ctx: MutationCtx, productId: string) =>
  ctx.db.query("inventory").withIndex("by_product", (q) => q.eq("productId", productId)).unique();

export const create = mutation({
  args: { token: v.string(), ...fields },
  handler: async (ctx, { token, stock, ...rest }) => {
    const user = await requireSupplier(ctx, token);
    const data = validate({ ...rest, stock });
    const id = await ctx.db.insert("products", { ...data, createdBy: user._id });
    await ctx.db.insert("inventory", { productId: id, stock, inStock: stock > 0 });
    return id;
  },
});

export const update = mutation({
  args: { token: v.string(), id: v.string(), ...fields },
  handler: async (ctx, { token, id, stock, ...rest }) => {
    await requireSupplier(ctx, token);
    const data = validate({ ...rest, stock });
    const product = await findProduct(ctx, id);
    await ctx.db.patch(product._id, data);
    const inv = await inventoryRow(ctx, id);
    // 0 → out of stock; restocking from 0 → back in stock; otherwise keep the supplier's toggle
    const inStock = stock === 0 ? false : inv && inv.stock === 0 ? true : (inv?.inStock ?? true);
    if (inv) await ctx.db.patch(inv._id, { stock, inStock });
    else await ctx.db.insert("inventory", { productId: id, stock, inStock });
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.string() },
  handler: async (ctx, { token, id }) => {
    await requireSupplier(ctx, token);
    const product = await findProduct(ctx, id);
    await ctx.db.delete(product._id);
    const inv = await inventoryRow(ctx, id);
    if (inv) await ctx.db.delete(inv._id);
  },
});
