import { View, Image, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

type Props = {
  uri: string | null;
  size?: number;
  name?: string;
  borderColor?: string;
  shape?: "circle" | "rounded";
};

const FALLBACK_COLORS = [
  colors.accentBlue,
  colors.accentVolt,
  colors.accentCoral,
  colors.accentAmber,
];

function pickColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

export default function UserAvatar({
  uri,
  size = 40,
  name,
  borderColor,
  shape = "circle",
}: Props) {
  const initials = name
    ? name
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const fallbackBg = name ? pickColor(name) : colors.textTertiary;
  const border = borderColor ?? "transparent";
  const br = shape === "rounded" ? size * 0.2 : size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: br,
            borderWidth: 2,
            borderColor: border,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: br,
          backgroundColor: fallbackBg,
          borderWidth: 2,
          borderColor: border,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.bgInput,
  },
  fallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
