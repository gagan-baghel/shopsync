import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { userFromToken } from "./auth";
import catalog from "../src/data/products.json";

const CATEGORIES = new Set(catalog.map((p) => p.category));

/** Supplier-added products, newest first. Public, like the static catalog. */
export const list = query({
  args: {},
  handler: (ctx) => ctx.db.query("products").order("desc").collect(), // ponytail: fine for a demo catalog; paginate past ~1k products
});

export const create = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    category: v.string(),
    price: v.number(),
    stock: v.number(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await userFromToken(ctx, args.token);
    if (user.role !== "supplier") throw new ConvexError("Suppliers only");

    const name = args.name.trim();
    if (name.length < 2 || name.length > 80) throw new ConvexError("Name must be 2–80 characters.");
    if (!CATEGORIES.has(args.category)) throw new ConvexError("Pick a valid category.");
    const price = Math.round(args.price * 100) / 100;
    if (!Number.isFinite(price) || price < 0.01 || price > 100000)
      throw new ConvexError("Price must be between 0.01 and 100,000.");
    if (!Number.isInteger(args.stock) || args.stock < 0 || args.stock > 99999)
      throw new ConvexError("Stock must be a whole number from 0 to 99,999.");
    const image = args.image?.trim() || undefined;
    if (image && (image.length > 2048 || !/^https:\/\/\S+$/.test(image))) throw new ConvexError("Image must be an https:// link.");

    const id = await ctx.db.insert("products", {
      name,
      category: args.category,
      price,
      description: (args.description ?? "").trim().slice(0, 500),
      image,
      createdBy: user._id,
    });
    await ctx.db.insert("inventory", { productId: id, stock: args.stock, inStock: args.stock > 0 });
    return id;
  },
});
