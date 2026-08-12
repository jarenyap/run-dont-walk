import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Run } from "../types";
import { aggregateDistance, aggregateRunTypes } from "../services/statsService";
import { colors, spacing, radius, typography, runTypeColors } from "../theme";

interface StatsDashboardProps {
  runs: Run[];
}

const ALL_RUN_TYPES = ["easy", "tempo", "long", "race"] as const;

export default function StatsDashboard({ runs }: StatsDashboardProps) {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");

  const distance = useMemo(
    () => aggregateDistance(runs, period),
    [runs, period]
  );
  const { runType, totalRuns } = useMemo(
    () => aggregateRunTypes(runs, period),
    [runs, period]
  );

  const maxDist = Math.max(...distance.map((d) => d.distance), 1);

  const typeMap = new Map(runType.map((rt) => [rt.type, rt]));
  const fullTypes = ALL_RUN_TYPES.map((type) => {
    const data = typeMap.get(type);
    return { type, count: data?.count ?? 0, percentage: data?.percentage ?? 0 };
  });

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Distance</Text>
        <View style={styles.toggle}>
          <TouchableOpacity
            onPress={() => setPeriod("weekly")}
            style={[styles.toggleBtn, period === "weekly" && styles.toggleActive]}
          >
            <Text
              style={[styles.toggleText, period === "weekly" && styles.toggleActiveText]}
            >
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPeriod("monthly")}
            style={[styles.toggleBtn, period === "monthly" && styles.toggleActive]}
          >
            <Text
              style={[styles.toggleText, period === "monthly" && styles.toggleActiveText]}
            >
              Month
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {distance.length > 0 ? (
        <View style={styles.chartCard}>
          <View style={styles.barContainer}>
            {distance.map((d, i) => {
              const pct = Math.min(Math.max((d.distance / maxDist) * 100, 3), 100);
              return (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barValue}>
                    {d.distance.toFixed(1)}
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${pct}%`,
                        backgroundColor: colors.accentBlue,
                      },
                    ]}
                  />
                  <Text style={styles.barLabel} numberOfLines={1}>
                    {d.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.chartCard}>
          <Text style={styles.emptyText}>
            Start logging to see distance data.
          </Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Run types</Text>
        <Text style={styles.totalRuns}>{totalRuns} runs</Text>
      </View>

      <View style={styles.chartCard}>
        {totalRuns > 0 ? (
          fullTypes.map((rt) => (
            <View key={rt.type} style={styles.typeRow}>
              <View style={styles.typeLabel}>
                <View
                  style={[
                    styles.typeDot,
                    {
                      backgroundColor:
                        runTypeColors[rt.type] || colors.accentBlue,
                    },
                  ]}
                />
                <Text style={styles.typeName}>{rt.type}</Text>
              </View>
              <Text style={styles.typeCount}>{rt.count}</Text>
              <View style={styles.typeBarTrack}>
                <View
                  style={[
                    styles.typeBarFill,
                    {
                      width: rt.count > 0 ? `${Math.max(rt.percentage, 8)}%` : "0%",
                      backgroundColor:
                        runTypeColors[rt.type] || colors.accentBlue,
                    },
                  ]}
                />
              </View>
              <Text style={styles.typePct}>{rt.percentage}%</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            Start logging to see run type data.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
  },
  totalRuns: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    padding: 2,
  },
  toggleBtn: {
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm - 2,
  },
  toggleActive: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  toggleText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  toggleActiveText: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  chartCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  barContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 140,
    paddingTop: 18,
    gap: 4,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
    gap: 4,
  },
  barValue: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  bar: {
    width: "100%",
    maxWidth: 40,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: "500",
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 8,
  },
  typeLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    width: 68,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeName: {
    color: colors.textPrimary,
    fontSize: typography.caption.fontSize,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  typeCount: {
    color: colors.textPrimary,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    width: 20,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  typeBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bgInput,
    overflow: "hidden",
  },
  typeBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  typePct: {
    color: colors.textSecondary,
    fontSize: typography.badge.fontSize,
    fontWeight: "600",
    width: 34,
    textAlign: "right",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
});
