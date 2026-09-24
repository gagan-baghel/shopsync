import { ConvexProvider, ConvexReactClient, useQuery } from "convex/react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { useHydrated, useStore } from "@/store";
import { colors } from "@/theme";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) throw new Error("EXPO_PUBLIC_CONVEX_URL is not set. Run `npx convex dev` or set it in eas.json.");
const convex = new ConvexReactClient(convexUrl, { unsavedChangesWarning: false });

/** Drops a persisted session the server no longer recognises (e.g. logged out elsewhere). */
function SessionCheck({ token }: { token: string }) {
  const me = useQuery(api.auth.me, { token });
  const setSession = useStore((s) => s.setSession);
  useEffect(() => {
    if (me === null) setSession(null);
  }, [me, setSession]);
  return null;
}

function RootStack() {
  const hydrated = useHydrated();
  const session = useStore((s) => s.session);
  if (!hydrated)
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  const role = session?.user.role;

  return (
    <>
      {session && <SessionCheck token={session.token} />}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="index" />
        </Stack.Protected>
        <Stack.Protected guard={role === "customer"}>
          <Stack.Screen name="(customer)" />
        </Stack.Protected>
        <Stack.Protected guard={role === "supplier"}>
          <Stack.Screen name="(supplier)" />
          <Stack.Screen name="chat/[customerId]" options={{ headerShown: true, title: "Chat" }} />
        </Stack.Protected>
        {/* Must stay after the role groups: after login the router lands on the first allowed screen. */}
        <Stack.Protected guard={!!session}>
          {/* Shared by both roles: customers shop from it, suppliers review listings. */}
          <Stack.Screen
            name="product/[id]"
            options={{ headerShown: true, title: "", headerBackButtonDisplayMode: "minimal" }}
          />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConvexProvider client={convex}>
          <StatusBar style="dark" />
          <RootStack />
        </ConvexProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
