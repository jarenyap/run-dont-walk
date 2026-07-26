import { View, Text, StyleSheet } from "react-native";
import { RunType } from "../types/index";
import { runTypeColors, typography } from "../theme";

type Props = { type: RunType };

export default function RunTypeBadge({ type }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: runTypeColors[type] }]}>
      <Text style={styles.label}>{type}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
    alignSelf: "flex-start",
  },
  label: {
    color: "#FFFFFF",
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
  },
});
