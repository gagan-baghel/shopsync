import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { SwipeableRow } from "@/components/SwipeableRow";
import { ProductImage } from "@/components/ProductImage";
import { money, useInventory, useProducts } from "@/lib";
import { useStore } from "@/store";
import { colors, shadow } from "@/theme";

const SHIPPING_FREE_OVER = 100;

export default function Cart() {
  const cart = useStore((s) => s.cart);
  const setQty = useStore((s) => s.setQty);
  const clearCart = useStore((s) => s.clearCart);
  const inventory = useInventory();
  const token = useStore((s) => s.session?.token ?? "");
  const placeOrder = useMutation(api.orders.place);
  const [placing, setPlacing] = useState(false);
  const products = useProducts();
  // A supplier may delete a product that's sitting in the cart; drop it so totals and the badge stay honest.
  useEffect(() => {
    if (!products.loading) Object.keys(cart).forEach((id) => !products.byId.has(id) && setQty(id, 0));
  }, [products, cart, setQty]);
  const items = Object.entries(cart).flatMap(([id, qty]) => {
    const p = products.byId.get(id);
    return p ? [{ p, qty }] : [];
  });

  if (products.loading && items.length < Object.keys(cart).length) return <ActivityIndicator style={s.flex} color={colors.primary} />;
  if (!items.length)
    return (
      <EmptyState
        icon="bag-outline"
        title="Your cart is empty"
        subtitle="Items you add will show up here. Swipe left on an item to remove it."
        action={{ label: "Start shopping", onPress: () => router.navigate("/shop") }}
      />
    );

  // Stock can change live while items sit in the cart.
  const problem = (id: string, qty: number) => {
    const inv = inventory?.get(id);
    if (!inv) return null;
    if (!inv.inStock || inv.stock === 0) return "Out of stock";
    return qty > inv.stock ? `Only ${inv.stock} left` : null;
  };
  const blocked = items.some(({ p, qty }) => problem(p.id, qty));
  const subtotal = items.reduce((a, { p, qty }) => a + p.price * qty, 0);
  const shipping = subtotal >= SHIPPING_FREE_OVER ? 0 : 6.99;

  const notify = (title: string, msg: string) =>
    Platform.OS === "web" ? window.alert(`${title}\n${msg}`) : Alert.alert(title, msg);

  const checkout = async () => {
    if (placing) return;
    setPlacing(true);
    try {
      const { total } = await placeOrder({ token, items: items.map(({ p, qty }) => ({ productId: p.id, qty })) });
      clearCart();
      notify("Order placed!", `Thank you! We charged ${money(total)}.`);
    } catch (e) {
      notify("Couldn't place order", e instanceof ConvexError ? String(e.data) : "Check your connection and try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <View style={s.flex}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.p.id}
        contentContainerStyle={{ paddingVertical: 10 }}
        ListHeaderComponent={<Text style={s.hint}>← Swipe left on an item to remove it</Text>}
        renderItem={({ item: { p, qty } }) => (
          <SwipeableRow onDelete={() => setQty(p.id, 0)}>
            <View style={s.row}>
              <ProductImage uri={p.image} style={s.img} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.name} numberOfLines={2}>{p.name}</Text>
                <Text style={s.price}>{money(p.price)}</Text>
                {problem(p.id, qty) && <Text style={s.problem}>{problem(p.id, qty)}</Text>}
              </View>
              <View style={s.qty}>
                <Pressable style={s.qtyBtn} onPress={() => setQty(p.id, qty - 1)} accessibilityLabel="Decrease quantity">
                  <Ionicons name={qty === 1 ? "trash-outline" : "remove"} size={16} color={colors.text} />
                </Pressable>
                <Text style={s.qtyText}>{qty}</Text>
                <Pressable
                  style={s.qtyBtn}
                  onPress={() => setQty(p.id, qty + 1)}
                  disabled={qty >= (inventory?.get(p.id)?.stock ?? Infinity)}
                  accessibilityLabel="Increase quantity"
                >
                  <Ionicons name="add" size={16} color={qty >= (inventory?.get(p.id)?.stock ?? Infinity) ? colors.border : colors.text} />
                </Pressable>
              </View>
            </View>
          </SwipeableRow>
        )}
      />
      <View style={s.summary}>
        <Line label="Subtotal" value={money(subtotal)} />
        <Line label="Shipping" value={shipping ? money(shipping) : "Free"} />
        <Line label="Total" value={money(subtotal + shipping)} bold />
        <Pressable style={[s.btn, blocked && { backgroundColor: colors.border }]} onPress={checkout} disabled={blocked || placing}>
          {placing ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{blocked ? "Fix unavailable items" : "Checkout"}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={s.line}>
      <Text style={[s.lineLabel, bold && s.bold]}>{label}</Text>
      <Text style={[s.lineValue, bold && s.bold]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  hint: { textAlign: "center", color: colors.muted, fontSize: 12, marginBottom: 4 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 12, marginHorizontal: 16, marginVertical: 6,
    backgroundColor: colors.card, borderRadius: 16, ...shadow,
  },
  img: { width: 64, height: 64, borderRadius: 12, backgroundColor: colors.border },
  name: { fontSize: 14, fontWeight: "600", color: colors.text },
  price: { fontSize: 15, fontWeight: "800", color: colors.primary },
  problem: { fontSize: 12, fontWeight: "700", color: colors.danger },
  qty: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.bg, borderRadius: 10, padding: 4 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  qtyText: { minWidth: 18, textAlign: "center", fontWeight: "700", color: colors.text },
  summary: { backgroundColor: colors.card, padding: 16, gap: 6, borderTopWidth: 1, borderTopColor: colors.border },
  line: { flexDirection: "row", justifyContent: "space-between" },
  lineLabel: { color: colors.muted, fontSize: 14 },
  lineValue: { color: colors.text, fontSize: 14 },
  bold: { fontWeight: "800", fontSize: 17, color: colors.text },
  btn: { marginTop: 8, height: 50, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
