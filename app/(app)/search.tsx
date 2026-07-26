import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { router, Stack } from "expo-router";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../context/Auth";
import { followUser, unfollowUser } from "../../services/followService";
import { UserProfile } from "../../types/index";
import UserAvatar from "../../components/UserAvatar";
import { colors, spacing, radius, typography } from "../../theme";

export default function SearchScreen() {
  const { user, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const [followingSet, setFollowingSet] = useState<Set<string>>(
    new Set(profile?.followingIds ?? [])
  );

  useEffect(() => {
    setFollowingSet(new Set(profile?.followingIds ?? []));
  }, [profile?.followingIds]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      runSearch(searchTerm.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  async function runSearch(term: string) {
    setLoading(true);
    try {
      const q = query(
        collection(db, "users"),
        where("nameLower", ">=", term),
        where("nameLower", "<=", term + "\uf8ff"),
        limit(20)
      );
      const snap = await getDocs(q);
      const users = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as UserProfile))
        .filter((u) => u.id !== user?.uid);
      setResults(users);
    } finally {
      setLoading(false);
    }
  }

  async function handleFollowToggle(targetId: string, targetName: string) {
    if (!user) return;
    const isFollowing = followingSet.has(targetId);

    if (isFollowing) {
      Alert.alert(
        `Unfollow ${targetName}?`,
        "You'll stop seeing their runs in your feed.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unfollow",
            style: "destructive",
            onPress: async () => {
              setFollowingSet((prev) => {
                const next = new Set(prev);
                next.delete(targetId);
                return next;
              });
              await unfollowUser(user.uid, targetId);
            },
          },
        ]
      );
    } else {
      setFollowingSet((prev) => new Set(prev).add(targetId));
      await followUser(user.uid, targetId);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Find Runners",
          headerTitleStyle: {
            fontWeight: "600",
            color: colors.textPrimary,
          },
          headerStyle: { backgroundColor: colors.bgPrimary },
          headerShadowVisible: false,
        }}
      />

      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search by name"
          placeholderTextColor={colors.textTertiary}
          value={searchTerm}
          onChangeText={setSearchTerm}
          autoFocus
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {loading && (
              <View style={styles.loadingWrap}>
                <View style={styles.loadingDot} />
              </View>
            )}
            {!loading &&
              searchTerm.trim() !== "" &&
              results.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    No runners found for "{searchTerm}"
                  </Text>
                  <Text style={styles.emptySubText}>
                    Try a different name.
                  </Text>
                </View>
              )}
          </View>
        }
        renderItem={({ item }) => {
          const isFollowing = followingSet.has(item.id);
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/user/${item.id}`)}
              activeOpacity={0.7}
            >
              <UserAvatar uri={item.avatarUrl} size={44} name={item.name} />
              <View style={styles.rowInfo}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.followersCount ?? 0} followers
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton,
                ]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleFollowToggle(item.id, item.name);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
            </TouchableOpacity>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  searchBarContainer: {
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  listContent: {
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  input: {
    backgroundColor: colors.bgInput,
    color: colors.textPrimary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: typography.body.fontSize,
    marginBottom: spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
  emptySubText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    marginTop: spacing.xs,
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentBlue,
    opacity: 0.6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  rowInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: colors.accentBlue,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    minWidth: 80,
    alignItems: "center",
  },
  followingButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.textTertiary,
  },
  followButtonText: {
    color: "#FFFFFF",
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
  },
  followingButtonText: {
    color: colors.textSecondary,
  },
});
