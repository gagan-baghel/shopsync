// Plain constants shared by the app and the Convex backend (no React Native imports here).
import catalog from "./data/products.json";

export const CATEGORIES = [...new Set(catalog.map((p) => p.category))];

export const MAX_STOCK = 99999;

export const FREE_SHIPPING_OVER = 100;
export const SHIPPING_FEE = 6.99;
export const shippingFor = (subtotal: number) => (subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE);

// Demo accounts: seeded by convex/seed.ts and offered on the login screen.
export const TEST_PASSWORD = "Test@123";
export const TEST_ACCOUNTS = [
  { email: "customer@test.com", name: "Alex Customer", role: "customer" },
  { email: "customer2@test.com", name: "Sam Shopper", role: "customer" },
  { email: "supplier@test.com", name: "Jordan Supplier", role: "supplier" },
] as const;
