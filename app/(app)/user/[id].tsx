import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAuth } from "../../../context/Auth";
import { followUser, unfollowUser } from "../../../services/followService";
import { UserProfile, Run } from "../../../types/index";
import UserAvatar from "../../../components/UserAvatar";
import RunTypeBadge from "../../../components/RunTypeBadge";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretLeft } from "phosphor-react-native";
import { colors, spacing, radius, typography } from "../../../theme";

export default function OtherUserProfileScreen() {
  const { id: targetId } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (targetId && user && targetId === user.uid) {
      router.replace("/(tabs)/profile");
    }
  }, [targetId, user]);

  useEffect(() => {
    if (!targetId) return;
    const unsub = onSnapshot(doc(db, "users", targetId), (snap) => {
      if (snap.exists()) {
        setTargetProfile(snap.data() as UserProfile);
      }
      setLoadingProfile(false);
    });
    return unsub;
  }, [targetId]);

  useEffect(() => {
    if (!targetId) return;
    const q = query(
      collection(db, "runs"),
      where("userId", "==", targetId),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      setRuns(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Run))
      );
    });
    return unsub;
  }, [targetId]);

  useEffect(() => {
    if (profile?.followingIds && targetId) {
      setIsFollowing(profile.followingIds.includes(targetId));
    }
  }, [profile?.followingIds, targetId]);

  async function handleFollowToggle() {
    if (!user || !targetId || !targetProfile) return;
    if (isFollowing) {
      Alert.alert(
        `Unfollow ${targetProfile.name}?`,
        "You'll stop seeing their runs in your feed.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unfollow",
            style: "destructive",
            onPress: async () => {
              setIsFollowing(false);
              await unfollowUser(user.uid, targetId);
            },
          },
        ]
      );
    } else {
      setIsFollowing(true);
      await followUser(user.uid, targetId);
    }
  }

  if (loadingProfile) {
    return (
      <View style={styles.centered}>
        <View style={styles.loadingDot} />
      </View>
    );
  }

  if (!targetProfile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>User not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backButton, { top: insets.top + spacing.sm }]}
      >
        <CaretLeft size={22} color={colors.textPrimary} weight="bold" />
      </TouchableOpacity>

      <View style={styles.avatarSection}>
        <UserAvatar
          uri={targetProfile.avatarUrl}
          name={targetProfile.name}
          size={88}
        />
      </View>

      <Text style={styles.name}>{targetProfile.name}</Text>

      {targetProfile.bio ? (
        <Text style={styles.bio}>{targetProfile.bio}</Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.followButton,
          isFollowing && styles.followingButton,
        ]}
        onPress={handleFollowToggle}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.followButtonText,
            isFollowing && styles.followingButtonText,
          ]}
        >
          {isFollowing ? "Following" : "Follow"}
        </Text>
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {targetProfile.followersCount ?? 0}
          </Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {targetProfile.followingIds?.length ?? 0}
          </Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {targetProfile.clanIds?.length ?? 0}
          </Text>
          <Text style={styles.statLabel}>Clans</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {targetProfile.totalDistance?.toFixed(1) ?? 0} km
          </Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Runs</Text>
      {runs.length === 0 ? (
        <Text style={styles.emptyRuns}>No runs logged yet.</Text>
      ) : (
        runs.map((run) => (
          <View key={run.id} style={styles.runRow}>
            <View style={styles.runRowLeft}>
              <Text style={styles.runTitle}>{run.title}</Text>
              <Text style={styles.runStats}>
                {run.distance} km · {run.duration}
              </Text>
            </View>
            <RunTypeBadge type={run.type} />
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    paddingTop: 100,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentBlue,
    opacity: 0.6,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
  },
  backButton: {
    position: "absolute",
    left: spacing.md,
    zIndex: 10,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.full,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  avatarSection: {
    marginBottom: spacing.md,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.displayMedium.fontSize,
    fontWeight: typography.displayMedium.fontWeight,
    marginBottom: spacing.xs,
  },
  bio: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  followButton: {
    backgroundColor: colors.accentBlue,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  followingButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.textTertiary,
  },
  followButtonText: {
    color: "#FFFFFF",
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
  followingButtonText: {
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    width: "90%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.badge.fontSize,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.borderSubtle,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    alignSelf: "flex-start",
    marginLeft: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyRuns: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    textAlign: "center",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  runRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    width: "90%",
  },
  runRowLeft: {
    flex: 1,
    gap: 4,
  },
  runTitle: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
  runStats: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
  },
});
