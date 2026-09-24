import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import productsJson from "./data/products.json";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  rating?: number; // absent for supplier-added products
  image?: string;
  description: string;
  specs: Record<string, string>;
};
// Category list is fixed; the products themselves live in Convex (seeded from products.json).
export const categories = [...new Set((productsJson as { category: string }[]).map((p) => p.category))];

/** Every product, live from Convex (supplier adds/edits/deletes show up instantly). */
export function useProducts() {
  const docs = useQuery(api.products.list);
  return useMemo(() => {
    const list: Product[] = (docs ?? []).map((d) => ({
      id: d.key ?? d._id,
      name: d.name,
      category: d.category,
      price: d.price,
      rating: d.rating,
      image: d.image,
      description: d.description,
      specs: d.specs ?? {},
    }));
    return { list, byId: new Map(list.map((p) => [p.id, p])), loading: docs === undefined };
  }, [docs]);
}

export const money = (n: number) => `$${n.toFixed(2)}`;

export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Live stock levels from Convex, keyed by productId. `undefined` while loading. */
export function useInventory() {
  const rows = useQuery(api.inventory.list);
  return useMemo(() => rows && new Map(rows.map((r) => [r.productId, r])), [rows]);
}
