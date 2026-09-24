import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming,
} from "react-native-reanimated";
import { useCartCount } from "@/store";
import { colors } from "@/theme";

/** Cart icon whose badge pops + wiggles every time the count goes up. */
export function CartBadge({ color = colors.text, size = 24 }: { color?: string; size?: number }) {
  const count = useCartCount();
  const prev = useRef(count);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (count > prev.current) {
      scale.set(withSequence(withSpring(1.6, { damping: 6, stiffness: 400 }), withSpring(1)));
      rotate.set(
        withSequence(withTiming(-12, { duration: 60 }), withTiming(12, { duration: 90 }), withTiming(0, { duration: 60 })),
      );
    }
    prev.current = count;
  }, [count, scale, rotate]);

  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));

  return (
    <Animated.View style={[{ width: size, height: size }, iconStyle]}>
      <Ionicons name="bag-handle-outline" size={size} color={color} />
      {count > 0 && (
        <Animated.View style={[s.badge, badgeStyle]}>
          <Text style={s.text}>{count > 99 ? "99+" : count}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  badge: {
    position: "absolute", top: -6, right: -10, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: colors.danger, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  text: { color: "#fff", fontSize: 10, fontWeight: "800" },
});
