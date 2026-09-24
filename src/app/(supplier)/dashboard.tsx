import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import { categoryShare, kpis, monthlyRevenue } from "@/data/analytics";
import { colors, shadow } from "@/theme";

const k = (v: number) => `$${(v / 1000).toFixed(0)}k`;

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<"line" | "bar">("line");
  const chartWidth = Math.min(width, 640) - 32 - 32 - 40; // screen - page padding - card padding - y-axis
  const spacing = (chartWidth - 24) / (monthlyRevenue.length - 1);
  const top = [...categoryShare].sort((a, b) => b.value - a.value)[0];

  return (
    <ScrollView contentContainerStyle={s.page}>
      <View style={s.kpis}>
        {kpis.map((x) => (
          <View key={x.label} style={s.kpi}>
            <Ionicons name={x.icon} size={18} color={colors.supplier} />
            <Text style={s.kpiValue}>{x.value}</Text>
            <Text style={s.kpiLabel}>{x.label}</Text>
            <Text style={[s.delta, { color: x.up ? colors.success : colors.danger }]}>{x.delta} vs last yr</Text>
          </View>
        ))}
      </View>

      <View style={s.card}>
        <View style={s.cardHead}>
          <View>
            <Text style={s.h2}>Revenue trend</Text>
            <Text style={s.muted}>Monthly, 2026</Text>
          </View>
          <View style={s.seg}>
            {(["line", "bar"] as const).map((m) => (
              <Pressable key={m} onPress={() => setMode(m)} style={[s.segBtn, mode === m && s.segActive]}>
                <Ionicons
                  name={m === "line" ? "analytics-outline" : "bar-chart-outline"}
                  size={16}
                  color={mode === m ? "#fff" : colors.muted}
                />
              </Pressable>
            ))}
          </View>
        </View>
        {mode === "line" ? (
          <LineChart
            key="line"
            areaChart
            curved
            isAnimated
            animationDuration={900}
            data={monthlyRevenue}
            width={chartWidth}
            height={200}
            spacing={spacing}
            initialSpacing={8}
            endSpacing={16}
            color={colors.supplier}
            thickness={3}
            startFillColor={colors.supplier}
            endFillColor={colors.supplier}
            startOpacity={0.3}
            endOpacity={0.02}
            hideDataPoints={false}
            dataPointsColor={colors.supplier}
            dataPointsRadius={3}
            noOfSections={4}
            maxValue={48000}
            yAxisLabelWidth={40}
            formatYLabel={(v) => k(Number(v))}
            yAxisTextStyle={s.axis}
            xAxisLabelTextStyle={s.axis}
            rulesColor={colors.border}
            rulesType="solid"
            yAxisColor="transparent"
            xAxisColor={colors.border}
            pointerConfig={{
              pointerStripColor: colors.supplier,
              pointerColor: colors.supplier,
              radius: 5,
              pointerLabelWidth: 90,
              pointerLabelHeight: 36,
              activatePointersOnLongPress: false,
              autoAdjustPointerLabelPosition: true,
              pointerLabelComponent: (items: { value: number; label: string }[]) => (
                <View style={s.tooltip}>
                  <Text style={s.tooltipText}>{items[0].label}: ${items[0].value.toLocaleString()}</Text>
                </View>
              ),
            }}
          />
        ) : (
          <BarChart
            key="bar"
            isAnimated
            data={monthlyRevenue.map((d, i) => ({
              ...d,
              frontColor: i === monthlyRevenue.length - 1 ? colors.supplier : "#5EEAD4",
            }))}
            width={chartWidth}
            height={200}
            barWidth={Math.max(8, spacing * 0.55)}
            spacing={spacing * 0.45}
            initialSpacing={6}
            barBorderTopLeftRadius={4}
            barBorderTopRightRadius={4}
            noOfSections={4}
            maxValue={48000}
            yAxisLabelWidth={40}
            formatYLabel={(v) => k(Number(v))}
            yAxisTextStyle={s.axis}
            xAxisLabelTextStyle={s.axis}
            rulesColor={colors.border}
            rulesType="solid"
            yAxisColor="transparent"
            xAxisColor={colors.border}
          />
        )}
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Sales by category</Text>
        <Text style={s.muted}>Share of revenue</Text>
        <View style={s.pieRow}>
          <PieChart
            donut
            isAnimated
            data={categoryShare.map((c) => ({ value: c.value, color: c.color }))}
            radius={78}
            innerRadius={52}
            innerCircleColor={colors.card}
            centerLabelComponent={() => (
              <View style={{ alignItems: "center" }}>
                <Text style={s.centerValue}>{top.value}%</Text>
                <Text style={s.centerLabel}>{top.label}</Text>
              </View>
            )}
          />
          <View style={s.legend}>
            {categoryShare.map((c) => (
              <View key={c.label} style={s.legendRow}>
                <View style={[s.dot, { backgroundColor: c.color }]} />
                <Text style={s.legendLabel}>{c.label}</Text>
                <Text style={s.legendValue}>{c.value}%</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, gap: 16, maxWidth: 640, width: "100%", alignSelf: "center" },
  kpis: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  kpi: { flexGrow: 1, flexBasis: "45%", backgroundColor: colors.card, borderRadius: 16, padding: 14, gap: 2, ...shadow },
  kpiValue: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 6 },
  kpiLabel: { fontSize: 12, color: colors.muted },
  delta: { fontSize: 12, fontWeight: "700", marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, overflow: "hidden", ...shadow },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  h2: { fontSize: 17, fontWeight: "700", color: colors.text },
  muted: { fontSize: 12, color: colors.muted },
  seg: { flexDirection: "row", backgroundColor: colors.bg, borderRadius: 10, padding: 3 },
  segBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  segActive: { backgroundColor: colors.supplier },
  axis: { color: colors.muted, fontSize: 10 },
  tooltip: { backgroundColor: colors.text, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  tooltipText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  pieRow: { flexDirection: "row", alignItems: "center", gap: 20, marginTop: 12, flexWrap: "wrap", justifyContent: "center" },
  centerValue: { fontSize: 20, fontWeight: "800", color: colors.text },
  centerLabel: { fontSize: 11, color: colors.muted },
  legend: { flex: 1, minWidth: 140, gap: 8 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, color: colors.text, fontSize: 13 },
  legendValue: { color: colors.text, fontWeight: "700", fontSize: 13 },
});
