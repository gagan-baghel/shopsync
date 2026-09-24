import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";
import { Donut } from "@/components/Donut";
import { api } from "../../../convex/_generated/api";
import { baseline, categoryShare, lastYear, monthlyRevenue as staticRevenue } from "@/data/analytics";
import { money } from "@/lib";
import { useStore } from "@/store";
import { colors, shadow } from "@/theme";

const k = (v: number) => `$${(v / 1000).toFixed(0)}k`;

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<"line" | "bar">("line");
  const token = useStore((s) => s.session?.token ?? "");
  const live = useQuery(api.orders.summary, { token });

  // Static history + live orders: new purchases raise revenue, order count and this month's point.
  const liveRevenue = live?.revenue ?? 0;
  const liveOrders = live?.count ?? 0;
  const revenue = baseline.revenue + liveRevenue;
  const orders = baseline.orders + liveOrders;
  const monthlyRevenue = staticRevenue.map((d, i) => ({ ...d, value: d.value + (live?.byMonth?.[i] ?? 0) }));
  // Grow the y-axis for big live months (the chart library won't); multiples of 12k keep 4 even sections.
  const chartMax = Math.ceil(Math.max(48000, ...monthlyRevenue.map((d) => d.value)) / 12000) * 12000;
  const pct = (now: number, then: number) => {
    const d = (now / then - 1) * 100;
    return `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`;
  };
  const kpis = [
    { label: "Revenue (YTD)", value: `$${Math.round(revenue).toLocaleString("en-US")}`, delta: pct(revenue, lastYear.revenue), icon: "cash-outline" },
    { label: "Orders", value: orders.toLocaleString("en-US"), delta: pct(orders, lastYear.orders), icon: "receipt-outline" },
    { label: "Avg. order", value: money(revenue / orders), delta: pct(revenue / orders, lastYear.revenue / lastYear.orders), icon: "trending-up-outline" },
    { label: "Returns", value: "2.4%", delta: "-0.6%", icon: "return-down-back-outline" },
  ] as const;
  const chartWidth = Math.min(width, 640) - 32 - 32 - 40; // screen - page padding - card padding - y-axis
  const spacing = (chartWidth - 24) / (monthlyRevenue.length - 1);
  const barSlot = (chartWidth - 20) / monthlyRevenue.length;
  const top = [...categoryShare].sort((a, b) => b.value - a.value)[0];

  return (
    <ScrollView contentContainerStyle={s.page}>
      <View style={s.kpis}>
        {kpis.map((x) => (
          <View key={x.label} style={s.kpi}>
            <Ionicons name={x.icon} size={18} color={colors.supplier} />
            <Text style={s.kpiValue}>{x.value}</Text>
            <Text style={s.kpiLabel}>{x.label}</Text>
            <Text style={[s.delta, { color: colors.success }]}>{x.delta} vs last yr</Text>
          </View>
        ))}
      </View>

      <View style={s.card}>
        <View style={s.cardHead}>
          <Text style={s.h2}>Recent orders</Text>
          <Text style={s.muted}>{liveOrders} live · {money(liveRevenue)}</Text>
        </View>
        {!live?.recent.length ? (
          <Text style={s.muted}>No orders yet. Purchases from the customer app appear here instantly.</Text>
        ) : (
          live.recent.map((o) => (
            <View key={o.id} style={s.orderRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.orderTitle} numberOfLines={1}>
                  {o.first}
                  {o.more > 0 ? ` +${o.more} more` : ""}
                </Text>
                <Text style={s.muted}>
                  {o.customer} · {o.units} item{o.units > 1 ? "s" : ""} ·{" "}
                  {new Date(o.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
              <Text style={s.orderTotal}>{money(o.total)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={s.card}>
        <View style={s.cardHead}>
          <View>
            <Text style={s.h2}>Revenue trend</Text>
            <Text style={s.muted}>Monthly, 2026</Text>
          </View>
          <View style={s.seg}>
            {(["line", "bar"] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[s.segBtn, mode === m && s.segActive]}
                accessibilityRole="button"
                accessibilityLabel={m === "line" ? "Show line chart" : "Show bar chart"}
                accessibilityState={{ selected: mode === m }}
              >
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
            // Built-in dots attach press handlers that leak responder props on web; the pointer marks the active point instead.
            hideDataPoints
            noOfSections={4}
            maxValue={chartMax}
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
            barWidth={barSlot * 0.6}
            spacing={barSlot * 0.4}
            initialSpacing={8}
            endSpacing={0}
            barBorderTopLeftRadius={4}
            barBorderTopRightRadius={4}
            noOfSections={4}
            maxValue={chartMax}
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
          <Donut data={categoryShare}>
            <Text style={s.centerValue}>{top.value}%</Text>
            <Text style={s.centerLabel}>{top.label}</Text>
          </Donut>
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
  orderRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  orderTitle: { fontSize: 14, fontWeight: "600", color: colors.text },
  orderTotal: { fontSize: 15, fontWeight: "800", color: colors.supplier },
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
