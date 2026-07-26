import { View, Text, StyleSheet, Pressable } from "react-native";
import { Timestamp } from "firebase/firestore";
import { CheckCircle, CircleIcon } from "phosphor-react-native";
import { Run } from "../types";
import { computePace } from "../utils/runUtils";
import UserAvatar from "./UserAvatar";
import RunTypeBadge from "./RunTypeBadge";
import { colors, spacing, radius, typography } from "../theme";

interface RunCardProps {
  run: Run;
  userName: string;
  avatarUrl: string | null;
  selectable?: boolean;
  selected?: boolean;
  toggleSelect?: () => void;
}

const formatDate = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return "";
  return timestamp.toDate().toLocaleString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function RunCard({
  run,
  userName,
  avatarUrl,
  selectable = false,
  selected = false,
  toggleSelect,
}: RunCardProps) {
  const pace = computePace(run.duration, run.distance);
  const date = formatDate(run.createdAt);

  const cardContent = (
    <View style={[styles.card, selectable && selected && styles.cardSelected]}>
      {selectable && (
        <View style={styles.selectionIndicator}>
          {selected ? (
            <CheckCircle size={22} color={colors.accentBlue} weight="fill" />
          ) : (
            <CircleIcon size={22} color={colors.textTertiary} />
          )}
        </View>
      )}

      <UserAvatar uri={avatarUrl} size={40} name={userName} />

      <View style={styles.details}>
        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={1}>
            {run.title}
          </Text>
          <RunTypeBadge type={run.type} />
        </View>

        <Text style={styles.stats}>
          {run.distance}km · {run.duration} · {pace}
        </Text>

        <Text style={styles.meta}>
          {userName} · {date}
        </Text>
      </View>
    </View>
  );

  if (!selectable) {
    return cardContent;
  }

  return (
    <Pressable onPress={toggleSelect} hitSlop={4}>
      {cardContent}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  details: {
    flex: 1,
    gap: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.textPrimary,
    flexShrink: 1,
  },
  stats: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  meta: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.accentBlue,
    backgroundColor: colors.bgSurfaceElevated,
  },
  selectionIndicator: {
    justifyContent: "center",
    alignItems: "center",
  },
});
