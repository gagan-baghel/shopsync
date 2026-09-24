import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { userFromToken } from "./auth";

// Customers may only touch their own thread; suppliers may touch any.
function threadFor(user: { _id: Id<"users">; role: string }, customerId?: Id<"users">) {
  if (user.role === "customer") return user._id;
  if (!customerId) throw new ConvexError("customerId required");
  return customerId;
}

export const list = query({
  args: { token: v.string(), customerId: v.optional(v.id("users")) },
  handler: async (ctx, { token, customerId }) => {
    const user = await userFromToken(ctx, token);
    return ctx.db
      .query("messages")
      .withIndex("by_customer", (q) => q.eq("customerId", threadFor(user, customerId)))
      .order("desc")
      .take(200);
  },
});

export const send = mutation({
  args: { token: v.string(), body: v.string(), customerId: v.optional(v.id("users")) },
  handler: async (ctx, { token, body, customerId }) => {
    const user = await userFromToken(ctx, token);
    const text = body.trim().slice(0, 2000);
    if (!text) return;
    await ctx.db.insert("messages", {
      customerId: threadFor(user, customerId),
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
    const user = await userFromToken(ctx, token);
    if (user.role !== "supplier") throw new ConvexError("Suppliers only");
    const customers = await ctx.db.query("users").collect();
    const rows = await Promise.all(
      customers
        .filter((c) => c.role === "customer")
        .map(async (c) => ({
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
