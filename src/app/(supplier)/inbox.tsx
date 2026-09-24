import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import { EmptyState } from "@/components/EmptyState";
import { useStore } from "@/store";
import { colors, shadow } from "@/theme";

export default function Inbox() {
  const token = useStore((s) => s.session?.token ?? "");
  const threads = useQuery(api.chat.threads, { token });

  if (!threads) return <ActivityIndicator style={{ flex: 1 }} color={colors.supplier} />;
  return (
    <FlatList
      data={threads}
      keyExtractor={(t) => t.customerId}
      contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
      ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title="No customers yet" />}
      renderItem={({ item: t }) => (
        <Pressable
          style={s.row}
          accessibilityRole="button"
          accessibilityLabel={`Chat with ${t.name}`}
          onPress={() => router.push({ pathname: "/chat/[customerId]", params: { customerId: t.customerId, name: t.name } })}
        >
          <View style={s.avatar}>
            <Text style={s.avatarText}>{t.name[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{t.name}</Text>
            <Text style={s.last} numberOfLines={1}>
              {t.last ? `${t.last.senderRole === "supplier" ? "You: " : ""}${t.last.body}` : t.email}
            </Text>
          </View>
          {t.last?.senderRole === "customer" && <View style={s.unread} />}
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      )}
    />
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: colors.card, borderRadius: 14, ...shadow },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.primary, fontWeight: "800", fontSize: 18 },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  last: { fontSize: 13, color: colors.muted, marginTop: 2 },
  unread: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.supplier },
});
