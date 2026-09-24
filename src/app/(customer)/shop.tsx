import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { memo, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { ProductImage } from "@/components/ProductImage";
import { categories, money, Product, useDebounced, useInventory, useProducts } from "@/lib";
import { useStore } from "@/store";
import { colors, shadow } from "@/theme";

const ProductCard = memo(function ProductCard({ p, available, stock }: { p: Product; available: boolean; stock?: number }) {
  const add = useStore((s) => s.addToCart);
  const inCart = useStore((s) => s.cart[p.id] ?? 0);
  const canAdd = available && (stock === undefined || inCart < stock);
  return (
    <Pressable style={s.card} onPress={() => router.push(`/product/${p.id}`)}>
      <View>
        <ProductImage uri={p.image} style={s.img} />
        {!available && (
          <View style={s.oos}>
            <Text style={s.oosText}>Out of stock</Text>
          </View>
        )}
      </View>
      <View style={s.info}>
        <Text style={s.cat}>{p.category}</Text>
        <Text style={s.name} numberOfLines={2}>{p.name}</Text>
        <View style={s.bottom}>
          <View>
            <Text style={s.price}>{money(p.price)}</Text>
            <Text style={s.rating}>{p.rating ? `★ ${p.rating}` : "New"}</Text>
          </View>
          <Pressable
            disabled={!canAdd}
            onPress={() => {
              add(p.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            }}
            style={[s.add, !canAdd && { backgroundColor: colors.border }]}
            hitSlop={6}
            accessibilityLabel={`Add ${p.name} to cart`}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});

export default function Shop() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const q = useDebounced(query.trim().toLowerCase(), 300);
  const inventory = useInventory();
  const products = useProducts();

  const data = useMemo(
    () =>
      products.list.filter(
        (p) =>
          (!category || p.category === category) &&
          (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)),
      ),
    [q, category, products],
  );

  return (
    <View style={s.flex}>
      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={s.search}
          placeholder="Search products"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {!!query && (
          <Pressable onPress={() => setQuery("")} hitSlop={10} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {[null, ...categories].map((c) => {
            const active = c === category;
            return (
              <Pressable key={c ?? "all"} onPress={() => setCategory(c)} style={[s.chip, active && s.chipActive]}>
                <Text style={[s.chipText, active && s.chipTextActive]}>{c ?? "All"}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <FlashList
        data={data}
        maintainVisibleContentPosition={{ disabled: true }} // new products are prepended; show them, don't anchor
        numColumns={2}
        keyExtractor={(p) => p.id}
        contentContainerStyle={s.list}
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => (
          <ProductCard p={item} available={inventory?.get(item.id)?.inStock ?? true} stock={inventory?.get(item.id)?.stock} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No products found"
            subtitle={`Nothing matches "${query}"${category ? ` in ${category}` : ""}. Try another search or category.`}
            action={{ label: "Clear filters", onPress: () => { setQuery(""); setCategory(null); } }}
          />
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8, margin: 16, marginBottom: 8, paddingHorizontal: 14,
    height: 46, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  search: { flex: 1, fontSize: 15, color: colors.text, height: "100%" },
  chips: { paddingHorizontal: 16, gap: 8, paddingVertical: 6 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.text },
  chipTextActive: { color: "#fff" },
  list: { paddingHorizontal: 10, paddingBottom: 24, paddingTop: 4 },
  card: { flex: 1, margin: 6, backgroundColor: colors.card, borderRadius: 16, overflow: "hidden", ...shadow },
  img: { width: "100%", aspectRatio: 1, backgroundColor: colors.border },
  oos: {
    ...StyleSheet.absoluteFill, backgroundColor: "rgba(15,23,42,0.45)", alignItems: "center", justifyContent: "center",
  },
  oosText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  info: { padding: 10, gap: 2 },
  cat: { fontSize: 11, color: colors.muted, fontWeight: "600", textTransform: "uppercase" },
  name: { fontSize: 14, fontWeight: "600", color: colors.text, minHeight: 36 },
  bottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 4 },
  price: { fontSize: 16, fontWeight: "800", color: colors.text },
  rating: { fontSize: 11, color: colors.warning, fontWeight: "700" },
  add: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
