import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Heart, ChatTeardrop } from "phosphor-react-native";
import UserAvatar from "./UserAvatar";
import RunTypeBadge from "./RunTypeBadge";
import { Run } from "../types/index";
import { formatRelativeTime } from "../utils/time";
import { useAuth } from "../context/Auth";
import { toggleLike } from "../services/likeService";
import { colors, spacing, radius, typography, runTypeColors } from "../theme";

type Props = { run: Run };

export default function FeedCard({ run }: Props) {
  const { user, profile } = useAuth();
  const isMine = user?.uid === run.userId;
  const displayAvatar = isMine
    ? (profile?.avatarUrl ?? null)
    : (run.authorAvatarUrl ?? null);
  const displayName = isMine
    ? profile?.name || user?.displayName || "Runner"
    : run.authorName || "Unknown";
  const [liked, setLiked] = useState(() =>
    (run.likes ?? []).includes(user?.uid ?? "")
  );
  const [pressing, setPressing] = useState(false);

  const accent = runTypeColors[run.type] || colors.accentBlue;

  const handleLike = async () => {
    if (!user?.uid) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    try {
      await toggleLike(run.id, user.uid, wasLiked);
    } catch {
      setLiked(wasLiked);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, pressing && styles.cardPressed]}
      onPress={() => router.push(`/run/${run.id}`)}
      onPressIn={() => setPressing(true)}
      onPressOut={() => setPressing(false)}
      activeOpacity={1}
    >
      <View style={styles.header}>
        <UserAvatar uri={displayAvatar} name={displayName} size={36} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.timestamp}>
            {formatRelativeTime(run.createdAt)}
          </Text>
        </View>
        <RunTypeBadge type={run.type} />
      </View>

      <Text style={[styles.distance, { color: accent }]}>
        {run.distance.toFixed(2)} km
      </Text>

      <Text style={styles.duration}>{run.duration}</Text>

      {run.title ? <Text style={styles.title}>{run.title}</Text> : null}

      {run.notes ? (
        <Text style={styles.notes} numberOfLines={2} ellipsizeMode="tail">
          {run.notes}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={(e) => {
            e.stopPropagation();
            handleLike();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Heart
            size={18}
            color={liked ? colors.accentCoral : colors.textTertiary}
            weight={liked ? "fill" : "regular"}
          />
          <Text
            style={[
              styles.actionLabel,
              liked && { color: colors.accentCoral },
            ]}
          >
            {run.likes?.length ?? 0}
          </Text>
        </TouchableOpacity>

        <View style={styles.actionBtn}>
          <ChatTeardrop size={18} color={colors.textTertiary} />
          <Text style={styles.actionLabel}>{run.commentCount ?? 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  timestamp: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    marginTop: 1,
  },
  distance: {
    fontSize: typography.displayHero.fontSize,
    fontWeight: typography.displayHero.fontWeight,
    marginBottom: 2,
  },
  duration: {
    color: colors.textSecondary,
    fontSize: typography.displayMedium.fontSize,
    fontWeight: typography.displayMedium.fontWeight,
    marginBottom: spacing.sm,
    fontVariant: ["tabular-nums"],
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  notes: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: "500",
  },
});
