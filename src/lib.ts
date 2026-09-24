import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import productsJson from "./data/products.json";

export type Product = (typeof productsJson)[number] & { specs: Record<string, string> };
export const products = productsJson as Product[];
export const productById = new Map(products.map((p) => [p.id, p]));
export const categories = [...new Set(products.map((p) => p.category))];

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
