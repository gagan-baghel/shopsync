import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("customer"), v.literal("supplier")),
    passwordHash: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
  }).index("by_token", ["token"]),

  // One support thread per customer; supplier sees all threads.
  messages: defineTable({
    customerId: v.id("users"),
    senderId: v.id("users"),
    senderRole: v.union(v.literal("customer"), v.literal("supplier")),
    body: v.string(),
  }).index("by_customer", ["customerId"]),

  // Products added by suppliers at runtime (the base catalog ships as static JSON in the app).
  products: defineTable({
    key: v.optional(v.string()), // stable id for seeded catalog items ("p1"…); new products use their _id
    name: v.string(),
    category: v.string(),
    price: v.number(),
    description: v.string(),
    image: v.optional(v.string()),
    rating: v.optional(v.number()),
    specs: v.optional(v.record(v.string(), v.string())),
    createdBy: v.optional(v.id("users")),
  }).index("by_key", ["key"]),

  inventory: defineTable({
    productId: v.string(),
    stock: v.number(),
    inStock: v.boolean(),
  }).index("by_product", ["productId"]),
});
