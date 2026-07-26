import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { PlusIcon, MagnifyingGlassIcon, XIcon } from "phosphor-react-native";
import { useAuth } from "../../../context/Auth";
import { getUserClans, discoverPublicClans, searchAllClansByName, deriveClanRole } from "../../../services/clanService";
import ClanCard from "../../../components/ClanCard";
import type { Clan, ClanRole } from "../../../types/index";

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
      setSearchResults(results.filter((clan) => !myClanIdsSet.has(clan.id)));
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
  const listData = isSearching ? searchResults : tab === "my" ? myClans : discoverClans;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Clans</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleToggleSearch}>
            {searchVisible ? (
              <XIcon size={20} color="#1A1A1A" weight="bold" />
            ) : (
              <MagnifyingGlassIcon size={20} color="#1A1A1A" weight="bold" />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push("/clan/create")}>
            <PlusIcon size={20} color="#FFFFFF" weight="bold" />
          </TouchableOpacity>
        </View>
      </View>

      {searchVisible && (
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search public clans by name..."
            placeholderTextColor="#8E8E93"
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
            <Text style={[styles.segmentText, tab === "my" && styles.segmentTextActive]}>
              My Clans
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, tab === "discover" && styles.segmentActive]}
            onPress={() => setTab("discover")}
          >
            <Text style={[styles.segmentText, tab === "discover" && styles.segmentTextActive]}>
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
          !isSearching ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
        }
        renderItem={({ item }) => (
          <ClanCard
            clan={item}
            role={!isSearching && tab === "my" ? getRoleForClan(item) : null}
            onPress={() => router.push(`/clan/${item.id}`)}
          />
        )}
        ListHeaderComponent={
          isSearching && searching ? (
            <ActivityIndicator style={{ marginTop: 20 }} color="#FF6B35" />
          ) : null
        }
        ListEmptyComponent={
          isSearching && !searching ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>No clans found for "{searchTerm}"</Text>
              <Text style={styles.emptySubtext}>Try a different name.</Text>
            </View>
          ) : !isSearching && !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏕️</Text>
              <Text style={styles.emptyTitle}>
                {tab === "my" ? "You're not in any clans yet" : "No public clans found"}
              </Text>
              <Text style={styles.emptySubtext}>
                {tab === "my"
                  ? "Create one or find one to join!"
                  : "Check back later or create your own."}
              </Text>
              {tab === "my" && (
                <TouchableOpacity style={styles.emptyCta} onPress={() => router.push("/clan/create")}>
                  <Text style={styles.emptyCtaText}>Create a Clan</Text>
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
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: "700", color: "#1A1A1A" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBarContainer: { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput: {
    backgroundColor: "#F2F2F7",
    color: "#000000",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  segmented: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "#F5F5F0",
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  segment: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  segmentActive: { backgroundColor: "#FF6B35" },
  segmentText: { color: "#8E8E93", fontSize: 14, fontWeight: "600" },
  segmentTextActive: { color: "#FFFFFF" },
  listContent: { paddingBottom: 24 },
  emptyState: { alignItems: "center", marginTop: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: "#1A1A1A", fontSize: 17, fontWeight: "600", textAlign: "center" },
  emptySubtext: { color: "#8E8E93", fontSize: 14, textAlign: "center", marginTop: 6, marginBottom: 20 },
  emptyCta: { backgroundColor: "#FF6B35", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyCtaText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
});