import { v, ConvexError } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { maybeUser, userFromToken } from "./auth";

// Customers may only touch their own thread; suppliers may touch any existing customer's.
async function threadFor(ctx: QueryCtx, user: Doc<"users">, customerId?: string) {
  if (user.role === "customer") return user._id;
  const id = customerId ? ctx.db.normalizeId("users", customerId) : null;
  const customer = id && (await ctx.db.get(id));
  if (!customer || customer.role !== "customer") throw new ConvexError("Unknown customer");
  return customer._id;
}

export const list = query({
  args: { token: v.string(), customerId: v.optional(v.string()) },
  handler: async (ctx, { token, customerId }) => {
    const user = await maybeUser(ctx, token);
    if (!user) return []; // stale session: SessionCheck will sign the client out
    const thread = await threadFor(ctx, user, customerId).catch(() => null);
    if (!thread) return []; // e.g. malformed deep link — render an empty thread, don't crash
    return ctx.db
      .query("messages")
      .withIndex("by_customer", (q) => q.eq("customerId", thread))
      .order("desc")
      .take(200);
  },
});

export const send = mutation({
  args: { token: v.string(), body: v.string(), customerId: v.optional(v.string()) },
  handler: async (ctx, { token, body, customerId }) => {
    const user = await userFromToken(ctx, token);
    const text = body.trim().slice(0, 2000);
    if (!text) return;
    await ctx.db.insert("messages", {
      customerId: await threadFor(ctx, user, customerId),
      senderId: user._id,
      senderRole: user.role,
      body: text,
    });
  },
});

// Supplier inbox: every customer with their latest message.
export const threads = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await maybeUser(ctx, token);
    if (!user) return [];
    if (user.role !== "supplier") throw new ConvexError("Suppliers only");
    const customers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "customer"))
      .take(500);
    const rows = await Promise.all(
      customers.map(async (c) => ({
        customerId: c._id,
        name: c.name,
        email: c.email,
        last: await ctx.db
          .query("messages")
          .withIndex("by_customer", (q) => q.eq("customerId", c._id))
          .order("desc")
          .first(),
      })),
    );
    return rows.sort((a, b) => (b.last?._creationTime ?? 0) - (a.last?._creationTime ?? 0));
  },
});
