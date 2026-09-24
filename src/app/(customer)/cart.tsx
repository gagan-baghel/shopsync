import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, FlatList, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { SwipeableRow } from "@/components/SwipeableRow";
import { money, productById } from "@/lib";
import { useStore } from "@/store";
import { colors, shadow } from "@/theme";

const SHIPPING_FREE_OVER = 100;

export default function Cart() {
  const cart = useStore((s) => s.cart);
  const setQty = useStore((s) => s.setQty);
  const clearCart = useStore((s) => s.clearCart);
  const items = Object.entries(cart).flatMap(([id, qty]) => {
    const p = productById.get(id);
    return p ? [{ p, qty }] : [];
  });

  if (!items.length)
    return (
      <EmptyState
        icon="bag-outline"
        title="Your cart is empty"
        subtitle="Items you add will show up here. Swipe left on an item to remove it."
        action={{ label: "Start shopping", onPress: () => router.navigate("/shop") }}
      />
    );

  const subtotal = items.reduce((a, { p, qty }) => a + p.price * qty, 0);
  const shipping = subtotal >= SHIPPING_FREE_OVER ? 0 : 6.99;

  const checkout = () => {
    const msg = `Order placed for ${money(subtotal + shipping)} (demo).`;
    if (Platform.OS === "web") window.alert(msg);
    else Alert.alert("Thank you!", msg);
    clearCart();
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
              <Image source={{ uri: p.image }} style={s.img} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.name} numberOfLines={2}>{p.name}</Text>
                <Text style={s.price}>{money(p.price)}</Text>
              </View>
              <View style={s.qty}>
                <Pressable style={s.qtyBtn} onPress={() => setQty(p.id, qty - 1)} accessibilityLabel="Decrease quantity">
                  <Ionicons name={qty === 1 ? "trash-outline" : "remove"} size={16} color={colors.text} />
                </Pressable>
                <Text style={s.qtyText}>{qty}</Text>
                <Pressable style={s.qtyBtn} onPress={() => setQty(p.id, qty + 1)} accessibilityLabel="Increase quantity">
                  <Ionicons name="add" size={16} color={colors.text} />
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
        <Pressable style={s.btn} onPress={checkout}>
          <Text style={s.btnText}>Checkout</Text>
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
