import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { colors } from "@/theme";

/** Swipe left past 35% of the width (or fling) to delete; row slides out, then collapses. Runs on the UI thread. */
export function SwipeableRow({ children, onDelete }: { children: ReactNode; onDelete: () => void }) {
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const height = useSharedValue(0); // last measured height
  const collapse = useSharedValue(1); // 1 = auto height; animates to 0 on delete

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      x.value = Math.min(0, e.translationX);
    })
    .onEnd((e) => {
      if (x.value < -width * 0.35 || e.velocityX < -900) {
        x.value = withTiming(-width, { duration: 180 }, () => {
          collapse.value = withTiming(0, { duration: 180 }, (done) => {
            if (done) scheduleOnRN(onDelete);
          });
        });
      } else {
        x.value = withSpring(0, { damping: 18 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const wrapStyle = useAnimatedStyle(() =>
    collapse.value === 1 ? {} : { height: height.value * collapse.value, opacity: collapse.value > 0 ? 1 : 0 },
  );
  const bgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, -60], [0, 1], "clamp"),
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(x.value, [-40, -width * 0.35], [0.6, 1.2], "clamp") }],
  }));

  return (
    <Animated.View
      style={[s.wrap, wrapStyle]}
      onLayout={(e) => {
        if (collapse.get() === 1) height.set(e.nativeEvent.layout.height); // track text-size / width changes
      }}
    >
      <Animated.View style={[s.bg, bgStyle]}>
        <Animated.View style={iconStyle}>
          <Ionicons name="trash" size={24} color="#fff" />
        </Animated.View>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { overflow: "hidden" },
  bg: {
    ...StyleSheet.absoluteFill, backgroundColor: colors.danger, borderRadius: 16,
    marginVertical: 6, marginHorizontal: 16, alignItems: "flex-end", justifyContent: "center", paddingRight: 24,
  },
});

