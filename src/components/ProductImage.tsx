import { Ionicons } from "@expo/vector-icons";
import { Image, ImageStyle, StyleProp, View } from "react-native";
import { colors } from "@/theme";

/** Product photo, or a neutral placeholder for supplier-added products without one. */
export function ProductImage({ uri, style }: { uri?: string; style: StyleProp<ImageStyle> }) {
  if (uri) return <Image source={{ uri }} style={style} />;
  return (
    <View style={[style as object, { alignItems: "center", justifyContent: "center", backgroundColor: colors.primarySoft }]}>
      <Ionicons name="cube-outline" size={32} color={colors.primary} />
    </View>
  );
}
