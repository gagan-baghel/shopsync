import { v, ConvexError } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";

export async function hash(password: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

// ponytail: unsalted SHA-256 is fine for seeded demo accounts; use a real auth provider (Convex Auth / Clerk) for production.
export async function userFromToken(ctx: QueryCtx, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();
  const user = session && (await ctx.db.get(session.userId));
  if (!user) throw new ConvexError("Session expired. Please sign in again.");
  return user;
}

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal("customer"), v.literal("supplier")),
  },
  handler: async (ctx, { email, password, role }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email.trim().toLowerCase()))
      .unique();
    if (!user || user.passwordHash !== (await hash(password)))
      throw new ConvexError("Invalid email or password.");
    if (user.role !== role)
      throw new ConvexError(`This is a ${user.role} account. Switch the role above.`);
    const token = crypto.randomUUID();
    await ctx.db.insert("sessions", { userId: user._id, token });
    return { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const s = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (s) await ctx.db.delete(s._id);
  },
});

export const me = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const u = await userFromToken(ctx, token).catch(() => null);
    return u && { id: u._id, name: u.name, email: u.email, role: u.role };
  },
});
