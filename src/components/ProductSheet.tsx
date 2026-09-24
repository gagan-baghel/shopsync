import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { ReactNode, useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { categories, Product } from "@/lib";
import { useStore } from "@/store";
import { colors } from "@/theme";

const EMPTY = { name: "", price: "", stock: "10", category: categories[0], image: "", description: "" };

const fromProduct = (p: Product, stock: number) => ({
  name: p.name,
  price: String(p.price),
  stock: String(stock),
  category: p.category,
  image: p.image ?? "",
  description: p.description,
});

const confirmDelete = (name: string, onYes: () => void) => {
  const msg = `Delete "${name}"? Customers will no longer see it.`;
  if (Platform.OS === "web") {
    if (window.confirm(msg)) onYes();
  } else {
    Alert.alert("Delete product", msg, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onYes },
    ]);
  }
};

/**
 * Supplier form to add a product, or (with `product`) edit every field and delete it.
 * Remount per product (`key`) so the fields start from its current values. The server re-validates everything.
 */
export function ProductSheet({ visible, onClose, product, stock = 0 }: {
  visible: boolean;
  onClose: () => void;
  product?: Product | null;
  stock?: number;
}) {
  const insets = useSafeAreaInsets();
  const token = useStore((s) => s.session?.token ?? "");
  const create = useMutation(api.products.create);
  const update = useMutation(api.products.update);
  const remove = useMutation(api.products.remove);
  const editing = !!product;
  const [form, setForm] = useState(() => (product ? fromProduct(product, stock) : EMPTY));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof EMPTY) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const reset = () => {
    setForm(EMPTY);
    setError(null);
    onClose();
  };
  const close = () => {
    if (!saving) reset(); // don't drop the form mid-save
  };

  const submit = async () => {
    if (saving) return;
    const price = Number(form.price.replace(",", "."));
    const stock = Number(form.stock);
    if (form.name.trim().length < 2) return setError("Enter a product name.");
    if (!Number.isFinite(price) || price <= 0) return setError("Enter a price above 0.");
    if (form.stock === "" || !Number.isInteger(stock) || stock < 0) return setError("Stock must be a whole number.");
    setSaving(true);
    setError(null);
    try {
      const fields = { token, name: form.name, category: form.category, price, stock, image: form.image, description: form.description };
      if (product) await update({ id: product.id, ...fields });
      else await create(fields);
      reset();
    } catch (e) {
      setError(e instanceof ConvexError ? String(e.data) : "Couldn't save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () =>
    product &&
    confirmDelete(product.name, async () => {
      setSaving(true);
      try {
        await remove({ token, id: product.id });
        setSaving(false);
        reset();
      } catch (e) {
        setSaving(false);
        setError(e instanceof ConvexError ? String(e.data) : "Couldn't delete. Check your connection and try again.");
      }
    });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={s.backdrop} onPress={close} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior="padding" style={{ flexShrink: 1 }}>
        <View style={[s.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <View style={s.handle} />
          <Text style={s.title}>{editing ? "Edit product" : "Add product"}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 460, flexShrink: 1 }} contentContainerStyle={{ gap: 4 }}>
            <Field label="Name">
              <TextInput style={s.input} value={form.name} onChangeText={set("name")} placeholder="e.g. Wireless Mouse" placeholderTextColor={colors.muted} maxLength={80} />
            </Field>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Field label="Price ($)" flex>
                <TextInput style={s.input} value={form.price} onChangeText={set("price")} placeholder="29.99" placeholderTextColor={colors.muted} keyboardType="decimal-pad" />
              </Field>
              <Field label="Stock" flex>
                <TextInput style={s.input} value={form.stock} onChangeText={(t) => set("stock")(t.replace(/[^0-9]/g, "").slice(0, 5))} keyboardType="number-pad" />
              </Field>
            </View>
            <Field label="Category">
              <View style={s.chips}>
                {categories.map((c) => (
                  <Pressable key={c} onPress={() => set("category")(c)} style={[s.chip, form.category === c && s.chipOn]}>
                    <Text style={[s.chipText, form.category === c && { color: "#fff" }]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </Field>
            <Field label="Image URL (optional)">
              <TextInput style={s.input} value={form.image} onChangeText={set("image")} placeholder="https://…" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
            </Field>
            <Field label="Description (optional)">
              <TextInput style={[s.input, { height: 80, paddingTop: 10, textAlignVertical: "top" }]} value={form.description} onChangeText={set("description")} multiline maxLength={500} placeholder="What makes it great?" placeholderTextColor={colors.muted} />
            </Field>
          </ScrollView>
          {error && <Text style={s.error}>{error}</Text>}
          <View style={s.actions}>
            {editing ? (
              <Pressable style={[s.action, s.delete]} onPress={onDelete} disabled={saving} accessibilityLabel="Delete product">
                <Text style={[s.actionText, { color: colors.danger }]}>Delete</Text>
              </Pressable>
            ) : (
              <Pressable style={[s.action, s.cancel]} onPress={close}>
                <Text style={[s.actionText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
            )}
            <Pressable style={[s.action, { backgroundColor: colors.supplier }]} onPress={submit} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.actionText}>{editing ? "Update" : "Add product"}</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, children, flex }: { label: string; children: ReactNode; flex?: boolean }) {
  return (
    <View style={[{ marginTop: 8 }, flex && { flex: 1 }]}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)" },
  sheet: { flexShrink: 1, backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: "center", marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 4 },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6 },
  input: {
    height: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12,
    fontSize: 15, color: colors.text, backgroundColor: colors.bg,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.supplier, borderColor: colors.supplier },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.text },
  error: { color: colors.danger, fontSize: 13, marginTop: 10 },
  actions: { flexDirection: "row", gap: 12, marginTop: 16 },
  action: { flex: 1, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cancel: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  delete: { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
