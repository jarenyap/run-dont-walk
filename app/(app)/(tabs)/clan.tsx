import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Plus, MagnifyingGlass, X, CastleTurret } from "phosphor-react-native";
import { useAuth } from "../../../context/Auth";
import {
  getUserClans,
  discoverPublicClans,
  searchAllClansByName,
  deriveClanRole,
} from "../../../services/clanService";
import ClanCard from "../../../components/ClanCard";
import type { Clan, ClanRole } from "../../../types/index";
import { colors, spacing, radius, typography } from "../../../theme";

export default function ClanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<"my" | "discover">("my");
  const [myClans, setMyClans] = useState<Clan[]>([]);
  const [discoverClans, setDiscoverClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Clan[]>([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    const clanIds = profile?.clanIds ?? [];
    const [mine, discover] = await Promise.all([
      getUserClans(clanIds),
      discoverPublicClans(),
    ]);
    setMyClans(mine);
    const myClanIdsSet = new Set(clanIds);
    setDiscoverClans(discover.filter((clan) => !myClanIdsSet.has(clan.id)));
  }, [profile]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) load();
    }, [load, loading])
  );

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      runSearch(searchTerm.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const runSearch = async (term: string) => {
    setSearching(true);
    try {
      const results = await searchAllClansByName(term);
      const myClanIdsSet = new Set(profile?.clanIds ?? []);
      setSearchResults(
        results.filter((clan) => !myClanIdsSet.has(clan.id))
      );
    } finally {
      setSearching(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleToggleSearch = () => {
    if (searchVisible) {
      setSearchTerm("");
      setSearchResults([]);
    }
    setSearchVisible(!searchVisible);
  };

  const getRoleForClan = (clan: Clan): ClanRole | null =>
    user ? deriveClanRole(clan, user.uid) : null;

  const isSearching = searchVisible && searchTerm.trim() !== "";
  const listData = isSearching
    ? searchResults
    : tab === "my"
    ? myClans
    : discoverClans;

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + spacing.sm }]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Clans</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleToggleSearch}>
            {searchVisible ? (
              <X size={20} color={colors.textPrimary} weight="bold" />
            ) : (
              <MagnifyingGlass
                size={20}
                color={colors.textPrimary}
                weight="bold"
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push("/clan/create")}
          >
            <Plus size={20} color="#FFFFFF" weight="bold" />
          </TouchableOpacity>
        </View>
      </View>

      {searchVisible && (
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search public clans by name"
            placeholderTextColor={colors.textTertiary}
            autoFocus
          />
        </View>
      )}

      {!isSearching && (
        <View style={styles.segmented}>
          <TouchableOpacity
            style={[styles.segment, tab === "my" && styles.segmentActive]}
            onPress={() => setTab("my")}
          >
            <Text
              style={[
                styles.segmentText,
                tab === "my" && styles.segmentTextActive,
              ]}
            >
              My Clans
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segment,
              tab === "discover" && styles.segmentActive,
            ]}
            onPress={() => setTab("discover")}
          >
            <Text
              style={[
                styles.segmentText,
                tab === "discover" && styles.segmentTextActive,
              ]}
            >
              Discover
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          !isSearching ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accentBlue}
            />
          ) : undefined
        }
        renderItem={({ item }) => (
          <ClanCard
            clan={item}
            role={
              !isSearching && tab === "my" ? getRoleForClan(item) : null
            }
            onPress={() => router.push(`/clan/${item.id}`)}
          />
        )}
        ListHeaderComponent={
          isSearching && searching ? (
            <View style={styles.searchingIndicator}>
              <View style={styles.searchingDot} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          isSearching && !searching ? (
            <View style={styles.emptyState}>
              <MagnifyingGlass
                size={48}
                color={colors.textTertiary}
                weight="light"
              />
              <Text style={styles.emptyTitle}>
                No clans found for "{searchTerm}"
              </Text>
              <Text style={styles.emptySubtext}>
                Try a different name.
              </Text>
            </View>
          ) : !isSearching && !loading ? (
            <View style={styles.emptyState}>
              <CastleTurret
                size={48}
                color={colors.textTertiary}
                weight="light"
              />
              <Text style={styles.emptyTitle}>
                {tab === "my"
                  ? "You're not in any clans yet"
                  : "No public clans found"}
              </Text>
              <Text style={styles.emptySubtext}>
                {tab === "my"
                  ? "Create one or discover a clan to join."
                  : "Check back later or create your own."}
              </Text>
              {tab === "my" && (
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={() => router.push("/clan/create")}
                >
                  <Text style={styles.emptyCtaText}>Create a clan</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.displayMedium.fontSize,
    fontWeight: typography.displayMedium.fontWeight,
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.bgInput,
    alignItems: "center",
    justifyContent: "center",
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.accentBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBarContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.bgInput,
    color: colors.textPrimary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: typography.body.fontSize,
  },
  segmented: {
    flexDirection: "row",
    marginHorizontal: spacing.md,
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    padding: 3,
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: radius.sm - 1,
  },
  segmentActive: {
    backgroundColor: colors.accentBlue,
  },
  segmentText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  searchingIndicator: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  searchingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentBlue,
    opacity: 0.6,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    textAlign: "center",
    marginTop: spacing.sm,
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  emptyCta: {
    backgroundColor: colors.accentBlue,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  emptyCtaText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
});
