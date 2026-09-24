import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CartBadge } from "@/components/CartBadge";
import { EmptyState } from "@/components/EmptyState";
import { ProductImage } from "@/components/ProductImage";
import { money, useInventory, useProducts } from "@/lib";
import { useStore } from "@/store";
import { colors } from "@/theme";

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const products = useProducts();
  const p = products.byId.get(id);
  const supplier = useStore((s) => s.session?.user.role === "supplier");
  const inventory = useInventory();
  const add = useStore((s) => s.addToCart);
  const inCart = useStore((s) => s.cart[id] ?? 0);
  const insets = useSafeAreaInsets();
  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(addedTimer.current), []);
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  if (!p && products.loading) return <ActivityIndicator style={s.flex} color={colors.primary} />;
  if (!p) return <EmptyState icon="alert-circle-outline" title="Product not found" action={{ label: "Go back", onPress: router.back }} />;

  const stock = inventory?.get(p.id);
  const available = stock?.inStock ?? true;
  const maxedOut = !!stock && inCart >= stock.stock;

  const onAdd = () => {
    add(p.id);
    btnScale.set(withSequence(withSpring(0.92, { damping: 8, stiffness: 500 }), withSpring(1)));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setJustAdded(true);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <View style={s.flex}>
      <Stack.Screen
        options={{
          title: p.name,
          headerRight: () =>
            supplier ? null : (
            <Pressable onPress={() => router.navigate("/cart")} hitSlop={10} accessibilityLabel="Open cart" style={{ marginRight: 8 }}>
              <CartBadge />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <ProductImage uri={p.image} style={s.img} />
        <View style={s.body}>
          <Text style={s.cat}>{p.category}</Text>
          <Text style={s.name}>{p.name}</Text>
          <View style={s.row}>
            <Text style={s.price}>{money(p.price)}</Text>
            <View style={[s.stock, { backgroundColor: available ? "#DCFCE7" : "#FEE2E2" }]}>
              <Text style={{ color: available ? colors.success : colors.danger, fontWeight: "700", fontSize: 12 }}>
                {available ? `In stock${stock ? ` · ${stock.stock} left` : ""}` : "Out of stock"}
              </Text>
            </View>
          </View>
          <Text style={s.rating}>{p.rating ? `★ ${p.rating} rating` : "New arrival"}</Text>
          {!!p.description && <Text style={s.desc}>{p.description}</Text>}

          <Text style={s.h2}>Specifications</Text>
          <View style={s.specs}>
            {Object.entries({ Category: p.category, ...p.specs, ...(supplier && stock ? { "Units in stock": String(stock.stock) } : {}) }).map(
              ([k, v], i) => (
                <View key={k} style={[s.specRow, i > 0 && s.specBorder]}>
                  <Text style={s.specKey}>{k}</Text>
                  <Text style={s.specVal}>{v}</Text>
                </View>
              ),
            )}
          </View>
        </View>
      </ScrollView>

      {!supplier && (
      <View style={[s.footer, { paddingBottom: 12 + insets.bottom }]}>
        {inCart > 0 && <Text style={s.inCart}>{inCart} in cart</Text>}
        <Animated.View style={[{ flex: 1 }, btnStyle]}>
          <Pressable
            onPress={onAdd}
            disabled={!available || maxedOut}
            style={[s.btn, { backgroundColor: !available || maxedOut ? colors.border : justAdded ? colors.success : colors.primary }]}
          >
            <Ionicons name={justAdded ? "checkmark" : "bag-add-outline"} size={20} color="#fff" />
            <Text style={s.btnText}>{!available ? "Unavailable" : justAdded ? "Added!" : maxedOut ? "Max in cart" : "Add to Cart"}</Text>
          </Pressable>
        </Animated.View>
      </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  img: { width: "100%", aspectRatio: 1.2, backgroundColor: colors.border },
  body: { padding: 20, gap: 6 },
  cat: { fontSize: 12, color: colors.muted, fontWeight: "700", textTransform: "uppercase" },
  name: { fontSize: 24, fontWeight: "800", color: colors.text },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  price: { fontSize: 26, fontWeight: "800", color: colors.primary },
  stock: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  rating: { color: colors.warning, fontWeight: "700" },
  desc: { fontSize: 15, color: colors.muted, lineHeight: 22, marginTop: 8 },
  h2: { fontSize: 17, fontWeight: "700", color: colors.text, marginTop: 20, marginBottom: 6 },
  specs: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  specRow: { flexDirection: "row", justifyContent: "space-between", padding: 14 },
  specBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  specKey: { color: colors.muted, fontSize: 14 },
  specVal: { color: colors.text, fontSize: 14, fontWeight: "600" },
  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
  },
  inCart: { color: colors.muted, fontWeight: "600" },
  btn: { height: 52, borderRadius: 14, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
