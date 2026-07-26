import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, radius, typography } from "../theme";

interface WarScoreboardCardProps {
  clan1Name: string;
  clan2Name: string;
  clan1Distance: number;
  clan2Distance: number;
  isClan1: boolean;
}

export default function WarScoreboardCard({
  clan1Name,
  clan2Name,
  clan1Distance,
  clan2Distance,
  isClan1,
}: WarScoreboardCardProps) {
  const total = clan1Distance + clan2Distance || 1;
  const clan1Percent = (clan1Distance / total) * 100;
  const clan2Percent = (clan2Distance / total) * 100;

  const myColor = colors.accentBlue;
  const opponentColor = colors.accentCoral;

  return (
    <View style={styles.card}>
      <View style={styles.scoreRow}>
        <View style={styles.clanBlock}>
          <Text
            style={[
              styles.score,
              { color: isClan1 ? myColor : opponentColor },
            ]}
          >
            {clan1Distance.toFixed(1)}
          </Text>
          <Text style={styles.label}>km</Text>
          <Text style={styles.clanName} numberOfLines={1}>
            {clan1Name}
          </Text>
        </View>

        <View style={styles.vsBadge}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <View style={styles.clanBlock}>
          <Text
            style={[
              styles.score,
              { color: isClan1 ? opponentColor : myColor },
            ]}
          >
            {clan2Distance.toFixed(1)}
          </Text>
          <Text style={styles.label}>km</Text>
          <Text style={styles.clanName} numberOfLines={1}>
            {clan2Name}
          </Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${clan1Percent}%`,
              backgroundColor: isClan1 ? myColor : opponentColor,
            },
          ]}
        />
        <View
          style={[
            styles.progressFill,
            {
              width: `${clan2Percent}%`,
              backgroundColor: isClan1 ? opponentColor : myColor,
            },
          ]}
        />
        <View style={styles.midMarker} />
      </View>

      <View style={styles.percentRow}>
        <Text style={[styles.percent, { color: isClan1 ? myColor : opponentColor }]}>
          {clan1Percent.toFixed(0)}%
        </Text>
        <Text style={[styles.percent, { color: isClan1 ? opponentColor : myColor }]}>
          {clan2Percent.toFixed(0)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  clanBlock: {
    alignItems: "center",
    flex: 1,
  },
  score: {
    fontSize: typography.displayHero.fontSize,
    fontWeight: typography.displayHero.fontWeight,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    marginTop: -4,
    marginBottom: spacing.sm,
  },
  clanName: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    textAlign: "center",
  },
  vsBadge: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginTop: spacing.sm,
    marginHorizontal: spacing.sm,
  },
  vsText: {
    color: colors.textSecondary,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
  },
  progressBar: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: colors.bgInput,
    position: "relative",
  },
  progressFill: {
    height: "100%",
  },
  midMarker: {
    position: "absolute",
    left: "50%",
    width: 2,
    height: "100%",
    backgroundColor: colors.bgPrimary,
    transform: [{ translateX: -1 }],
  },
  percentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  percent: {
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
  },
});
