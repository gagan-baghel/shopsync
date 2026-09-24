import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../../convex/_generated/api";
import { useStore } from "@/store";
import { colors } from "@/theme";

/** Role pill + Logout. Clearing the session lets the root guard route back to the login / role picker. */
export function HeaderActions() {
  const session = useStore((s) => s.session);
  const setSession = useStore((s) => s.setSession);
  const logout = useMutation(api.auth.logout);
  if (!session) return null;
  const supplier = session.user.role === "supplier";

  const onLogout = () => {
    logout({ token: session.token }).catch(() => {});
    setSession(null);
  };

  return (
    <View style={s.row}>
      <View style={[s.pill, { backgroundColor: supplier ? colors.supplierSoft : colors.primarySoft }]}>
        <Text style={[s.pillText, { color: supplier ? colors.supplier : colors.primary }]}>
          {supplier ? "Supplier" : "Customer"}
        </Text>
      </View>
      <Pressable
        onPress={onLogout}
        hitSlop={10}
        style={s.btn}
        accessibilityRole="button"
        accessibilityLabel="Logout"
      >
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={[s.btnText, { color: colors.danger }]}>Logout</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginRight: 12 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: "700" },
  btn: {
    flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  btnText: { fontSize: 12, fontWeight: "600", color: colors.text },
});
