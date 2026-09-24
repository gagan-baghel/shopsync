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
const staticProducts = productsJson as Product[];
export const categories = [...new Set(staticProducts.map((p) => p.category))];

/** Static catalog + supplier-added products (live from Convex), newest additions first. */
export function useProducts() {
  const added = useQuery(api.products.list);
  return useMemo(() => {
    const extra: Product[] = (added ?? []).map((d) => ({
      id: d._id,
      name: d.name,
      category: d.category,
      price: d.price,
      image: d.image,
      description: d.description,
      specs: {},
    }));
    const list = [...extra, ...staticProducts];
    return { list, byId: new Map(list.map((p) => [p.id, p])), loading: added === undefined };
  }, [added]);
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
