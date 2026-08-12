import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { UsersThree } from "phosphor-react-native";
import { colors, spacing } from "../theme";

export default function EmptyFeed() {
  return (
    <View style={styles.container}>
      <UsersThree size={48} color={colors.textTertiary} weight="light" />

      <View style={styles.textGroup}>
        <Text style={styles.title}>Your feed is empty</Text>
        <Text style={styles.body}>
          Follow other runners to see their activity here.
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => router.push("/(app)/search")}
        style={styles.cta}
        activeOpacity={0.7}
      >
        <Text style={styles.ctaLabel}>Find runners</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.lg,
  },
  textGroup: {
    alignItems: "center",
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "600",
  },
  body: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 260,
  },
  cta: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    backgroundColor: colors.accentBlue,
    borderRadius: 8,
  },
  ctaLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
