import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useState } from "react";
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { errorMessage, notify } from "@/lib";
import { useStore } from "@/store";
import { colors } from "@/theme";
import { EmptyState } from "./EmptyState";

const time = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/**
 * Realtime thread backed by a Convex reactive query: new messages from either side appear instantly.
 * Customers pass no customerId (their own thread); suppliers pass the customer they're replying to.
 * Inverted list = newest at the bottom and auto-pinned there as messages arrive.
 */
export function ChatThread({ customerId }: { customerId?: Id<"users"> }) {
  const session = useStore((s) => s.session);
  const headerHeight = useHeaderHeight();
  const messages = useQuery(api.chat.list, session ? { token: session.token, customerId } : "skip");
  const send = useMutation(api.chat.send);
  const [text, setText] = useState("");
  if (!session) return null; // signing out: the role guard is about to unmount this screen
  const accent = session.user.role === "supplier" ? colors.supplier : colors.primary;

  const onSend = () => {
    const body = text.trim();
    if (!body) return;
    setText("");
    send({ token: session.token, body, customerId }).catch((e) => {
      setText((t) => t || body); // restore the draft unless the user already typed something new
      notify("Message not sent", errorMessage(e));
    });
  };

  const renderItem = ({ item }: { item: Doc<"messages"> }) => {
    const mine = item.senderId === session.user.id;
    return (
      <Animated.View entering={FadeInDown.duration(220)} style={[s.row, mine ? s.right : s.left]}>
        <View style={[s.bubble, mine ? [s.mine, { backgroundColor: accent }] : s.theirs]}>
          {!mine && <Text style={s.sender}>{item.senderRole === "supplier" ? "Supplier" : "Customer"}</Text>}
          <Text style={[s.body, mine && { color: "#fff" }]}>{item.body}</Text>
          <Text style={[s.time, mine && { color: "rgba(255,255,255,0.75)" }]}>{time(item._creationTime)}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      // Edge-to-edge Android no longer resizes the window for the IME, so padding works on both platforms.
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
    >
      {messages === undefined ? (
        <ActivityIndicator style={s.flex} color={accent} />
      ) : messages.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No messages yet"
          subtitle={session.user.role === "customer" ? "Ask our supplier team anything about your order." : "Say hello to this customer."}
        />
      ) : (
        <FlatList
          inverted
          data={messages}
          keyExtractor={(m) => m._id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        />
      )}
      <View style={s.composer}>
        <TextInput
          style={s.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message…"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={2000}
          onSubmitEditing={onSend}
          submitBehavior="submit"
          returnKeyType="send"
        />
        <Pressable
          onPress={onSend}
          disabled={!text.trim()}
          style={[s.send, { backgroundColor: text.trim() ? accent : colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 12, gap: 6 },
  row: { flexDirection: "row" },
  right: { justifyContent: "flex-end" },
  left: { justifyContent: "flex-start" },
  bubble: { maxWidth: "80%", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  mine: { borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  sender: { fontSize: 11, fontWeight: "700", color: colors.muted, marginBottom: 2 },
  body: { fontSize: 15, color: colors.text, lineHeight: 20 },
  time: { fontSize: 10, color: colors.muted, alignSelf: "flex-end", marginTop: 2 },
  composer: {
    flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 10,
    backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
  },
  input: {
    flex: 1, minHeight: 42, maxHeight: 120, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 11,
    borderRadius: 21, backgroundColor: colors.bg, fontSize: 15, color: colors.text,
  },
  send: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});
