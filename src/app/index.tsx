import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { Role, useStore } from "@/store";
import { colors, shadow } from "@/theme";

// Seeded by convex/seed.ts — shown here for one-tap demo sign-in.
const TEST_ACCOUNTS: Record<Role, { email: string; password: string }> = {
  customer: { email: "customer@test.com", password: "Test@123" },
  supplier: { email: "supplier@test.com", password: "Test@123" },
};

const ROLES: { role: Role; title: string; desc: string; icon: keyof typeof Ionicons.glyphMap; color: string; soft: string }[] = [
  { role: "customer", title: "Customer", desc: "Browse, cart & chat", icon: "bag-handle", color: colors.primary, soft: colors.primarySoft },
  { role: "supplier", title: "Supplier", desc: "Analytics & inventory", icon: "storefront", color: colors.supplier, soft: colors.supplierSoft },
];

export default function Login() {
  const setSession = useStore((s) => s.setSession);
  const login = useMutation(api.auth.login);
  const [role, setRole] = useState<Role>("customer");
  const [email, setEmail] = useState(TEST_ACCOUNTS.customer.email);
  const [password, setPassword] = useState(TEST_ACCOUNTS.customer.password);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const accent = role === "supplier" ? colors.supplier : colors.primary;

  const pickRole = (r: Role) => {
    setRole(r);
    setEmail(TEST_ACCOUNTS[r].email);
    setPassword(TEST_ACCOUNTS[r].password);
    setError(null);
  };

  const onSubmit = async () => {
    if (!email.trim() || !password) return setError("Enter your email and password.");
    setLoading(true);
    setError(null);
    try {
      setSession(await login({ email, password, role }));
    } catch (e) {
      setError(e instanceof ConvexError ? String(e.data) : "Can't reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={[s.logo, { backgroundColor: accent }]}>
            <Ionicons name="cube" size={32} color="#fff" />
          </View>
          <Text style={s.h1}>ShopSync</Text>
          <Text style={s.sub}>Sign in to continue</Text>

          <Text style={s.label}>I am a</Text>
          <View style={s.roles}>
            {ROLES.map((r) => {
              const active = r.role === role;
              return (
                <Pressable
                  key={r.role}
                  onPress={() => pickRole(r.role)}
                  style={[s.roleCard, active && { borderColor: r.color, backgroundColor: r.soft }]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons name={r.icon} size={26} color={active ? r.color : colors.muted} />
                  <Text style={[s.roleTitle, active && { color: r.color }]}>{r.title}</Text>
                  <Text style={s.roleDesc}>{r.desc}</Text>
                  {active && <Ionicons name="checkmark-circle" size={18} color={r.color} style={s.check} />}
                </Pressable>
              );
            })}
          </View>

          <Text style={s.label}>Email</Text>
          <View style={s.field}>
            <Ionicons name="mail-outline" size={18} color={colors.muted} />
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
            />
          </View>

          <Text style={s.label}>Password</Text>
          <View style={s.field}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              onSubmitEditing={onSubmit}
              returnKeyType="go"
            />
            <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={10} accessibilityLabel="Toggle password visibility">
              <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={18} color={colors.muted} />
            </Pressable>
          </View>

          {error && <Text style={s.error}>{error}</Text>}

          <Pressable style={[s.btn, { backgroundColor: accent }]} onPress={onSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign in as {role === "customer" ? "Customer" : "Supplier"}</Text>}
          </Pressable>

          <View style={s.testBox}>
            <Text style={s.testTitle}>Test accounts (password: Test@123)</Text>
            <Text style={s.testLine}>Customer · customer@test.com</Text>
            <Text style={s.testLine}>Customer · customer2@test.com</Text>
            <Text style={s.testLine}>Supplier · supplier@test.com</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingTop: 32, maxWidth: 480, width: "100%", alignSelf: "center" },
  logo: { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  h1: { fontSize: 28, fontWeight: "800", color: colors.text, textAlign: "center", marginTop: 12 },
  sub: { fontSize: 15, color: colors.muted, textAlign: "center", marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginTop: 16, marginBottom: 8 },
  roles: { flexDirection: "row", gap: 12 },
  roleCard: {
    flex: 1, padding: 14, borderRadius: 16, borderWidth: 2, borderColor: colors.border,
    backgroundColor: colors.card, gap: 4, ...shadow,
  },
  roleTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 4 },
  roleDesc: { fontSize: 12, color: colors.muted },
  check: { position: "absolute", top: 10, right: 10 },
  field: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, height: 50,
  },
  input: { flex: 1, fontSize: 15, color: colors.text, height: "100%" },
  error: { color: colors.danger, marginTop: 12, fontSize: 13 },
  btn: { marginTop: 24, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  testBox: {
    marginTop: 24, padding: 14, borderRadius: 12, borderWidth: 1, borderStyle: "dashed",
    borderColor: colors.border, backgroundColor: colors.card, gap: 4,
  },
  testTitle: { fontSize: 12, fontWeight: "700", color: colors.text, marginBottom: 2 },
  testLine: { fontSize: 12, color: colors.muted },
});
