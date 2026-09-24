import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

type Slice = { value: number; color: string };

/** Donut from stroked circle arcs; each slice is a dash offset along the same ring. */
export function Donut({ data, radius = 78, thickness = 26, children }: {
  data: Slice[]; radius?: number; thickness?: number; children?: ReactNode;
}) {
  const r = radius - thickness / 2;
  const circumference = 2 * Math.PI * r;
  const total = data.reduce((a, d) => a + d.value, 0);
  const lengths = data.map((d) => (d.value / total) * circumference);
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0));

  return (
    <Animated.View entering={ZoomIn.duration(500)} style={{ width: radius * 2, height: radius * 2 }}>
      {/* Rotate so the first slice starts at 12 o'clock. */}
      <Svg width={radius * 2} height={radius * 2} style={{ transform: [{ rotate: "-90deg" }] }}>
        {data.map((d, i) => (
            <Circle
              key={i}
              cx={radius}
              cy={radius}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(0, lengths[i] - 2)} ${circumference}`} // 2px gap between slices
              strokeDashoffset={-starts[i]}
            />
        ))}
      </Svg>
      <View style={[StyleSheet.absoluteFill, s.center]}>{children}</View>
    </Animated.View>
  );
}

const s = StyleSheet.create({ center: { alignItems: "center", justifyContent: "center" } });
