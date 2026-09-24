import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import { Product, products, useInventory } from "@/lib";
import { useStore } from "@/store";
import { colors, shadow } from "@/theme";

const LOW = 15;

export default function Inventory() {
  const token = useStore((s) => s.session?.token ?? "");
  const inventory = useInventory();
  const update = useMutation(api.inventory.update).withOptimisticUpdate((store, args) => {
    const rows = store.getQuery(api.inventory.list, {});
    if (!rows) return;
    store.setQuery(
      api.inventory.list,
      {},
      rows.map((r) =>
        r.productId !== args.productId
          ? r
          : {
              ...r,
              ...(args.stock !== undefined && { stock: args.stock, inStock: args.stock > 0 && (r.inStock || r.stock === 0) }),
              ...(args.inStock !== undefined && { inStock: args.inStock }),
            },
      ),
    );
  });
  const [editing, setEditing] = useState<Product | null>(null);
  const save = (args: { productId: string; stock?: number; inStock?: boolean }) => {
    update({ token, ...args }).catch((e) =>
      Alert.alert("Update failed", e instanceof ConvexError ? String(e.data) : "Check your connection and try again."),
    );
  };

  if (!inventory) return <ActivityIndicator style={{ flex: 1 }} color={colors.supplier} />;

  const rows = [...inventory.values()];
  const inStock = rows.filter((r) => r.inStock).length;
  const low = rows.filter((r) => r.inStock && r.stock < LOW).length;

  return (
    <View style={{ flex: 1 }}>
      <View style={s.stats}>
        <Stat label="In stock" value={inStock} color={colors.success} />
        <Stat label="Out of stock" value={rows.length - inStock} color={colors.danger} />
        <Stat label="Low stock" value={low} color={colors.warning} />
      </View>
      <FlashList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        extraData={inventory}
        renderItem={({ item: p }) => {
          const inv = inventory.get(p.id);
          const stock = inv?.stock ?? 0;
          const on = inv?.inStock ?? false;
          return (
            <Pressable style={s.row} onPress={() => setEditing(p)}>
              <Image source={{ uri: p.image }} style={s.img} />
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>{p.name}</Text>
                <Text style={[s.count, stock < LOW && { color: stock === 0 ? colors.danger : colors.warning }]}>
                  {stock} units · <Text style={s.edit}>Edit</Text>
                </Text>
              </View>
              <Switch
                value={on}
                onValueChange={(v) => save({ productId: p.id, inStock: v })}
                trackColor={{ true: colors.supplier, false: colors.border }}
                thumbColor="#fff"
                accessibilityLabel={`${p.name} in stock`}
              />
            </Pressable>
          );
        }}
      />
      <StockSheet
        key={editing?.id ?? "closed"} // remount per product so the input starts at its current stock
        product={editing}
        current={editing ? (inventory.get(editing.id)?.stock ?? 0) : 0}
        onClose={() => setEditing(null)}
        onSave={(stock) => {
          if (editing) save({ productId: editing.id, stock });
          setEditing(null);
        }}
      />
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function StockSheet({
  product, current, onClose, onSave,
}: { product: Product | null; current: number; onClose: () => void; onSave: (n: number) => void }) {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(String(current));
  const n = Math.max(0, parseInt(value, 10) || 0);
  const bump = (d: number) => setValue(String(Math.max(0, n + d)));

  return (
    <Modal
      visible={!!product}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior="padding">
        <View style={[s.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>Update stock</Text>
          <Text style={s.sheetSub} numberOfLines={1}>{product?.name}</Text>
          <View style={s.stepper}>
            {[-10, -1].map((d) => (
              <Pressable key={d} style={s.step} onPress={() => bump(d)}>
                <Text style={s.stepText}>{d}</Text>
              </Pressable>
            ))}
            <TextInput
              style={s.stockInput}
              value={value}
              onChangeText={(t) => setValue(t.replace(/[^0-9]/g, "").slice(0, 5))}
              keyboardType="number-pad"
              selectTextOnFocus
            />
            {[1, 10].map((d) => (
              <Pressable key={d} style={s.step} onPress={() => bump(d)}>
                <Text style={s.stepText}>+{d}</Text>
              </Pressable>
            ))}
          </View>
          {n === 0 && (
            <Text style={s.warn}>
              <Ionicons name="warning-outline" size={13} /> Setting stock to 0 marks the item out of stock.
            </Text>
          )}
          <View style={s.actions}>
            <Pressable style={[s.action, s.cancel]} onPress={onClose}>
              <Text style={[s.actionText, { color: colors.text }]}>Cancel</Text>
            </Pressable>
            <Pressable style={[s.action, { backgroundColor: colors.supplier }]} onPress={() => onSave(n)}>
              <Text style={s.actionText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  stats: { flexDirection: "row", gap: 10, padding: 16 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 12, alignItems: "center", ...shadow },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, color: colors.muted, fontWeight: "600" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 12, marginBottom: 10,
    backgroundColor: colors.card, borderRadius: 14, ...shadow,
  },
  img: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.border },
  name: { fontSize: 14, fontWeight: "600", color: colors.text },
  count: { fontSize: 13, color: colors.muted, marginTop: 2 },
  edit: { color: colors.supplier, fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)" },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 4 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: "center", marginBottom: 12 },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
  sheetSub: { color: colors.muted, marginBottom: 16 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
  step: { flex: 1, height: 48, borderRadius: 12, backgroundColor: colors.supplierSoft, alignItems: "center", justifyContent: "center" },
  stepText: { color: colors.supplier, fontWeight: "800", fontSize: 15 },
  stockInput: {
    width: 96, height: 48, borderRadius: 12, borderWidth: 2, borderColor: colors.supplier, textAlign: "center",
    fontSize: 20, fontWeight: "800", color: colors.text,
  },
  warn: { color: colors.warning, fontSize: 12, marginTop: 10 },
  actions: { flexDirection: "row", gap: 12, marginTop: 20 },
  action: { flex: 1, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cancel: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
