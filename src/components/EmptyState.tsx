import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
};

export function EmptyState({ icon, title, subtitle, action }: Props) {
  return (
    <View style={s.wrap}>
      <View style={s.iconWrap}>
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>
      <Text style={s.title}>{title}</Text>
      {subtitle && <Text style={s.sub}>{subtitle}</Text>}
      {action && (
        <Pressable style={s.btn} onPress={action.onPress}>
          <Text style={s.btnText}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 8 },
  iconWrap: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primarySoft,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, textAlign: "center" },
  sub: { fontSize: 14, color: colors.muted, textAlign: "center", maxWidth: 280 },
  btn: { marginTop: 12, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: "#fff", fontWeight: "600" },
});
