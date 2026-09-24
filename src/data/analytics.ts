// Static supplier figures for the dashboard.
export const monthlyRevenue = [
  { label: "Jan", value: 18400 }, { label: "Feb", value: 21200 }, { label: "Mar", value: 19800 },
  { label: "Apr", value: 24600 }, { label: "May", value: 27100 }, { label: "Jun", value: 25300 },
  { label: "Jul", value: 29800 }, { label: "Aug", value: 33400 }, { label: "Sep", value: 31900 },
  { label: "Oct", value: 36200 }, { label: "Nov", value: 41800 }, { label: "Dec", value: 47300 },
];

export const categoryShare = [
  { label: "Electronics", value: 42, color: "#4F46E5" },
  { label: "Fashion", value: 23, color: "#0D9488" },
  { label: "Home", value: 16, color: "#F59E0B" },
  { label: "Beauty", value: 11, color: "#EC4899" },
  { label: "Sports", value: 8, color: "#64748B" },
];

// Historical (static) figures; live orders from Convex are added on top in the dashboard.
export const baseline = { revenue: 356800, orders: 4812 };
// Same period last year — year-over-year deltas are computed live against these.
export const lastYear = { revenue: 301860, orders: 4390 };
