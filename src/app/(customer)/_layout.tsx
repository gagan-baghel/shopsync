import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { CartBadge } from "@/components/CartBadge";
import { HeaderActions } from "@/components/HeaderActions";
import { colors } from "@/theme";

export default function CustomerTabs() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerRight: () => <HeaderActions />,
        headerTitleStyle: { fontWeight: "800" },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="shop"
        options={{ title: "Shop", tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="cart"
        options={{ title: "Cart", tabBarIcon: ({ color, size }) => <CartBadge color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="support"
        options={{ title: "Support", tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
