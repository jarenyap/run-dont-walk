import { View, Text, StyleSheet } from "react-native";
import { CalendarBlank } from "phosphor-react-native";
import { colors, spacing, typography } from "../../../theme";

export default function EventsScreen() {
  return (
    <View style={styles.container}>
      <CalendarBlank size={48} color={colors.textTertiary} weight="light" />
      <Text style={styles.title}>Events</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bgPrimary,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
});
