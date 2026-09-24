import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { HeaderActions } from "@/components/HeaderActions";
import { colors } from "@/theme";

export default function SupplierTabs() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.supplier,
        headerRight: () => <HeaderActions />,
        headerTitleStyle: { fontWeight: "800" },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: "Analytics", tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="inventory"
        options={{ title: "Inventory", tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="inbox"
        options={{ title: "Support", tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
