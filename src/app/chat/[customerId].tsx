import { Stack, useLocalSearchParams } from "expo-router";
import type { Id } from "../../../convex/_generated/dataModel";
import { ChatThread } from "@/components/ChatThread";

export default function SupplierChat() {
  const { customerId, name } = useLocalSearchParams<{ customerId: Id<"users">; name?: string }>();
  return (
    <>
      <Stack.Screen options={{ title: name ?? "Chat" }} />
      <ChatThread customerId={customerId} />
    </>
  );
}
