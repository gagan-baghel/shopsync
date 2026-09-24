import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Id } from "../convex/_generated/dataModel";

export type Role = "customer" | "supplier";
export type User = { id: Id<"users">; name: string; email: string; role: Role };
export type Session = { token: string; user: User };

type State = {
  session: Session | null;
  cart: Record<string, number>; // productId -> qty
  setSession: (s: Session | null) => void;
  addToCart: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
};

export const useStore = create<State>()(
  persist(
    (set) => ({
      session: null,
      cart: {},
      setSession: (session) => set({ session, cart: {} }),
      addToCart: (id) => set((s) => ({ cart: { ...s.cart, [id]: (s.cart[id] ?? 0) + 1 } })),
      setQty: (id, qty) =>
        set((s) => {
          const cart = { ...s.cart };
          if (qty > 0) cart[id] = qty;
          else delete cart[id];
          return { cart };
        }),
      clearCart: () => set({ cart: {} }),
    }),
    { name: "shopsync-store", storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export const useCartCount = () =>
  useStore((s) => Object.values(s.cart).reduce((a, b) => a + b, 0));

/** True once AsyncStorage has been read; subscribes without a gap, so the event can't be missed. */
export const useHydrated = () =>
  useSyncExternalStore(
    (onChange) => useStore.persist.onFinishHydration(onChange),
    () => useStore.persist.hasHydrated(),
  );
