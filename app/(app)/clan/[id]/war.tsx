import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CaretLeftIcon, MagnifyingGlassIcon, SwordIcon, TrophyIcon } from "phosphor-react-native";
import { useAuth } from "../../../../context/Auth";
import {
  subscribeToClan,
  deriveClanRole,
  getClanPermissions,
  searchPublicClansByName,
  getClanById,
} from "../../../../services/clanService";
import {
  subscribeToClanWar,
  getClanWar,
  challengeClan,
  acceptChallenge,
  declineChallenge,
  cancelChallenge,
  getPastWars,
  getWarTopContributors,
  checkAndCompleteWar,
  ClanWarWithId,
  WarContributor,
} from "../../../../services/clanWarService";
import WarScoreboardCard from "../../../../components/WarScoreboardCard";
import type { Clan } from "../../../../types";

export default function ClanWarScreen() {
  const insets = useSafeAreaInsets();
  const { id, warId } = useLocalSearchParams<{ id: string; warId?: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();

  // clan state
  const [clan, setClan] = useState<Clan | null>(null);

  // war state
  const [war, setWar] = useState<ClanWarWithId | null>(null);
  const [pastWars, setPastWars] = useState<ClanWarWithId[]>([]);
  const [clan1Contributors, setClan1Contributors] = useState<WarContributor[]>([]);
  const [clan2Contributors, setClan2Contributors] = useState<WarContributor[]>([]);
  const [loading, setLoading] = useState(true);

  // challenge modal state
  const [challengeModalVisible, setChallengeModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Clan[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyClans, setBusyClans] = useState<Set<string>>(new Set());
  const [challenging, setChallenging] = useState<string | null>(null);

  // handlers state
  const [handlingWar, setHandlingWar] = useState(false); // accept/decline loading

  // real-time clan listener
  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToClan(id, setClan);
    return unsub;
  }, [id]);

  useEffect(() => {
    const targetWarId = warId || clan?.currentWarId;
    if (!targetWarId) {
      setWar(null);
      if (id && !warId) {
        getPastWars(id).then(setPastWars);
      }
      setLoading(false);
      return;
    }
    const unsub = subscribeToClanWar(targetWarId, async (w) => {
      if (w && w.status === "active") {
        await checkAndCompleteWar(w.id);
      }
      setWar(w);
      setLoading(false);
    });
    return unsub;
  }, [clan?.currentWarId, id, warId]);

  // top contributors
  useEffect(() => {
    if (!war || war.status !== "active" || !id) return;
    const opponentId = war.clan1Id === id ? war.clan2Id : war.clan1Id;
    const myMemberIds = clan?.memberIds ?? [];
    const startDate = war.startedAt?.toDate?.() ?? new Date();
    const endDate = war.endsAt?.toDate?.() ?? new Date();
    const isClan1 = war.clan1Id === id;

    getClanById(opponentId).then((oppClan) => {
      const oppMemberIds = oppClan?.memberIds ?? [];
      getWarTopContributors(startDate, endDate, war.clan1Name,
        isClan1 ? myMemberIds : oppMemberIds).then(setClan1Contributors);
      getWarTopContributors(startDate, endDate, war.clan2Name,
        isClan1 ? oppMemberIds : myMemberIds).then(setClan2Contributors);
    });
  }, [war, id, clan?.memberIds]);

  // challenge clan search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchPublicClansByName(searchTerm.trim().toLowerCase());
        const filtered = results.filter(
          (c) => c.id !== id && !(profile?.clanIds ?? []).includes(c.id)
        );
        setSearchResults(filtered);
        const busy = new Set<string>();
        await Promise.all(
          filtered.map(async (c) => {
            if (!c.currentWarId) return;
            try {
              const w = await getClanWar(c.currentWarId);
              if (w && (w.status === "active" || w.status === "pending")) {
                busy.add(c.id);
              }
            } catch {}
          })
        );
        setBusyClans(busy);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, id, profile?.clanIds]);

  // permissions
  const myRole = clan && user ? deriveClanRole(clan, user.uid) : null;
  const permissions = getClanPermissions(myRole);
  const canManageWar = permissions.canStartWar; // Leader or Co-Leader

  const myClanIsClan1 = id === war?.clan1Id;
  const isTargetClan = id === war?.clan2Id && war?.status === "pending";

  const handleChallenge = async (targetClan: Clan) => {
    if (!id || !user) return;
    setChallenging(targetClan.id);
    try {
      await challengeClan(
        id,
        clan?.name ?? "Your Clan",
        targetClan.id,
        targetClan.name,
        user.uid
      );
      setChallengeModalVisible(false);
      setSearchTerm("");
      Alert.alert("Challenge Sent", `War challenge sent to ${targetClan.name}!`);
    } catch (e: any) {
      console.error("Failed to challenge clan:", e);
      Alert.alert("Error", e?.message || "Could not send challenge. Please try again.");
    } finally {
      setChallenging(null);
    }
  };

  const handleAccept = async () => {
    if (!war) return;
    setHandlingWar(true);
    try {
      await acceptChallenge(war.id);
    } catch (e) {
      console.error("Failed to accept war:", e);
    } finally {
      setHandlingWar(false);
    }
  };

  const handleDecline = async () => {
    if (!war) return;
    setHandlingWar(true);
    try {
      await declineChallenge(war.id, war.clan1Id, war.clan2Id);
    } catch (e) {
      console.error("Failed to decline war:", e);
    } finally {
      setHandlingWar(false);
    }
  };

  const handleCancel = async () => {
    if (!war) return;
    Alert.alert("Cancel Challenge", "Are you sure you want to cancel this challenge?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelChallenge(war.id, war.clan1Id, war.clan2Id);
          } catch (e) {
            console.error("Failed to cancel challenge:", e);
          }
        },
      },
    ]);
  };

  // loading
  if (loading || !clan) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} color="#FF6B35" />
      </View>
    );
  }

  if (war && war.status === "active") {
    return (
      <ActiveWarView
        war={war}
        myClanIsClan1={myClanIsClan1}
        clan1Contributors={clan1Contributors}
        clan2Contributors={clan2Contributors}
        insets={insets}
        onBack={() => router.back()}
      />
    );
  }

  if (war && war.status === "pending") {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <CaretLeftIcon size={20} color="#1A1A1A" weight="bold" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Clan War</Text>
          <View style={{ width: 20 }} />
        </View>

        <View style={styles.pendingCard}>
          <TrophyIcon size={48} color="#FF6B35" weight="fill" />
          <Text style={styles.pendingTitle}>
            {war.clan1Name} vs {war.clan2Name}
          </Text>
          <Text style={styles.pendingSubtext}>
            {isTargetClan
              ? `${war.clan1Name} has challenged your clan! Accept or decline.`
              : `Challenge sent to ${war.clan2Name}. Waiting for their response...`}
          </Text>

          {isTargetClan && canManageWar && (
            <View style={styles.challengeActions}>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={handleAccept}
                disabled={handlingWar}
              >
                {handlingWar ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.acceptBtnText}>Accept Challenge</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={handleDecline}
                disabled={handlingWar}
              >
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}

          {myClanIsClan1 && canManageWar && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancel Challenge</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (war && war.status === "completed") {
    const won = war.winnerId === id;
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <CaretLeftIcon size={20} color="#1A1A1A" weight="bold" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>War Results</Text>
          <View style={{ width: 20 }} />
        </View>

        <View style={styles.completedCard}>
          <Text style={styles.completedEmoji}>{won ? "🏆" : "💪"}</Text>
          <Text style={styles.completedTitle}>
            {won ? "Victory!" : "Good effort!"}
          </Text>
          <Text style={styles.completedScore}>
            {war.clan1Name} {war.clan1Distance} km — {war.clan2Distance} km {war.clan2Name}
          </Text>
          <Text style={styles.completedWinner}>
            Winner: {war.winnerId === war.clan1Id ? war.clan1Name : war.clan2Name}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <CaretLeftIcon size={20} color="#1A1A1A" weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clan War</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.emptyStateContainer}>
        <TrophyIcon size={64} color="#D1D1D6" weight="fill" />
        <Text style={styles.emptyTitle}>No Active War</Text>
        <Text style={styles.emptySubtext}>
          Challenge another clan to a 2-week distance race!
        </Text>

        {canManageWar && (
          <TouchableOpacity
            style={styles.challengeBtn}
            onPress={() => {
              setSearchTerm("");
              setSearchResults([]);
              setChallengeModalVisible(true);
            }}
          >
            <SwordIcon size={20} color="#FFF" weight="fill" />
            <Text style={styles.challengeBtnText}>Challenge a Clan</Text>
          </TouchableOpacity>
        )}

        {pastWars.length > 0 && (
          <View style={styles.pastWarsSection}>
            <Text style={styles.sectionTitle}>Past Wars</Text>
            {pastWars.map((pw) => {
              const won = pw.winnerId === id;
              const isTie = pw.winnerId === null;
              const myName = clan?.name ?? "";
              const opponentName = pw.clan1Id === id ? pw.clan2Name : pw.clan1Name;
              const myScore = pw.clan1Id === id ? pw.clan1Distance : pw.clan2Distance;
              const oppScore = pw.clan1Id === id ? pw.clan2Distance : pw.clan1Distance;
              return (
                <TouchableOpacity
                  key={pw.id}
                  style={[
                    styles.pastWarRow,
                    { backgroundColor: won ? "#34C75915" : isTie ? "#F5F5F0" : "#FF3B3015" },
                  ]}
                  onPress={() => router.push(`/clan/${id}/war?warId=${pw.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.pastWarInfo}>
                    <Text style={styles.pastWarResult}>
                      {myName} vs {opponentName}
                    </Text>
                    <Text style={styles.pastWarScore}>
                      {myScore} km — {oppScore} km
                    </Text>
                  </View>
                  <View style={[styles.pastWarBadge, { backgroundColor: won ? "#34C759" : isTie ? "#8E8E93" : "#FF3B30" }]}>
                    <Text style={styles.pastWarBadgeText}>{won ? "W" : isTie ? "T" : "L"}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={challengeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setChallengeModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setChallengeModalVisible(false)}
          >
            <View style={styles.modalSheet}>
              <View style={styles.dragHandle} />
              <Text style={styles.modalTitle}>Challenge a Clan</Text>
              <View style={styles.searchBar}>
                <MagnifyingGlassIcon size={16} color="#8E8E93" />
                <TextInput
                  style={styles.searchInput}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  placeholder="Search clans..."
                  placeholderTextColor="#8E8E93"
                  autoFocus
                />
              </View>
              {searching ? (
                <ActivityIndicator style={{ marginTop: 20 }} color="#FF6B35" />
              ) : (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.searchResultRow}>
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultName}>{item.name}</Text>
                        <Text style={styles.searchResultMembers}>
                          {item.memberIds.length} members
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.challengeSmallBtn,
                          (challenging !== null || busyClans.has(item.id)) && styles.challengeSmallBtnDisabled,
                        ]}
                        onPress={() => {
                          if (busyClans.has(item.id)) {
                            Alert.alert("Clan is busy", `${item.name} is currently in a clan war. Try again later.`);
                            return;
                          }
                          handleChallenge(item);
                        }}
                        disabled={challenging !== null}
                      >
                        {busyClans.has(item.id) ? (
                          <Text style={styles.challengeSmallBtnText}>In a war</Text>
                        ) : challenging === item.id ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <Text style={styles.challengeSmallBtnText}>Challenge</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                  ListEmptyComponent={
                    searchTerm.trim() ? (
                      <Text style={styles.noResults}>No clans found</Text>
                    ) : null
                  }
                />
              )}
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function ActiveWarView({
  war,
  myClanIsClan1,
  clan1Contributors,
  clan2Contributors,
  insets,
  onBack,
}: {
  war: ClanWarWithId;
  myClanIsClan1: boolean;
  clan1Contributors: WarContributor[];
  clan2Contributors: WarContributor[];
  insets: { top: number };
  onBack: () => void;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const endMs = war.endsAt?.toMillis?.() ?? war.endsAt?.getTime?.() ?? 0;
  const remaining = Math.max(0, endMs - now);
  const isExpired = remaining <= 0;
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  const myName = myClanIsClan1 ? war.clan1Name : war.clan2Name;
  const myDistance = myClanIsClan1 ? war.clan1Distance : war.clan2Distance;
  const oppName = myClanIsClan1 ? war.clan2Name : war.clan1Name;
  const oppDistance = myClanIsClan1 ? war.clan2Distance : war.clan1Distance;
  const myContributors = myClanIsClan1 ? clan1Contributors : clan2Contributors;
  const oppContributors = myClanIsClan1 ? clan2Contributors : clan1Contributors;

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack}>
          <CaretLeftIcon size={20} color="#1A1A1A" weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clan War</Text>
        <View style={{ width: 20 }} />
      </View>

      <WarScoreboardCard
        clan1Name={myName}
        clan2Name={oppName}
        clan1Distance={myDistance}
        clan2Distance={oppDistance}
        isClan1={true}
      />

      <View style={styles.countdownBanner}>
        {isExpired ? (
          <Text style={styles.countdownBannerText}>War has ended</Text>
        ) : (
          <Text style={styles.countdownBannerText}>
            {days}d {String(hours).padStart(2, "0")}h {String(minutes).padStart(2, "0")}m {String(seconds).padStart(2, "0")}s
          </Text>
        )}
        <Text style={styles.countdownBannerLabel}>remaining</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Contributors</Text>
        <View style={styles.columnsRow}>
          <View style={[styles.column, { borderRightWidth: 1, borderRightColor: "#F2F2F7" }]}>
            <Text style={[styles.columnHeader, { color: "#FF6B35" }]}>{myName}</Text>
            {myContributors.length === 0 ? (
              <Text style={styles.emptyColumn}>No runs yet</Text>
            ) : (
              myContributors.map((c, i) => (
                <View key={c.uid} style={styles.contributorMini}>
                  <Text style={styles.medal}>{["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contributorName} numberOfLines={1}>{c.name}</Text>
                  </View>
                  <Text style={styles.contributorMiniDistance}>{c.distanceKm} km</Text>
                </View>
              ))
            )}
          </View>
          <View style={styles.column}>
            <Text style={[styles.columnHeader, { color: "#0A84FF" }]}>{oppName}</Text>
            {oppContributors.length === 0 ? (
              <Text style={styles.emptyColumn}>No runs yet</Text>
            ) : (
              oppContributors.map((c, i) => (
                <View key={c.uid} style={styles.contributorMini}>
                  <Text style={styles.medal}>{["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contributorName} numberOfLines={1}>{c.name}</Text>
                  </View>
                  <Text style={styles.contributorMiniDistance}>{c.distanceKm} km</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>

      <View style={styles.motivationCard}>
        <Text style={styles.motivationText}>
          Every run you log during the war adds to your clan's total
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: { color: "#1A1A1A", fontSize: 17, fontWeight: "600" },
  countdownChip: {
    backgroundColor: "#FF6B3522",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  countdownText: { color: "#FF6B35", fontSize: 12, fontWeight: "600" },
  countdownBanner: {
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#F5F5F0",
    borderRadius: 12,
    padding: 16,
  },
  countdownBannerText: {
    color: "#1A1A1A",
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  countdownBannerLabel: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { color: "#1A1A1A", fontSize: 17, fontWeight: "600", marginBottom: 12 },
  emptyText: { color: "#8E8E93", fontSize: 14, marginTop: 8 },
  contributorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
    gap: 12,
  },
  medal: { fontSize: 18, width: 28, textAlign: "center" },
  contributorName: { flex: 1, color: "#1A1A1A", fontSize: 15, fontWeight: "500" },
  contributorClan: { color: "#8E8E93", fontSize: 12, marginTop: 1 },
  contributorDistance: { color: "#FF6B35", fontSize: 15, fontWeight: "700" },
  columnsRow: { flexDirection: "row" },
  column: { flex: 1, paddingHorizontal: 10, paddingVertical: 4 },
  columnHeader: { fontSize: 13, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  emptyColumn: { color: "#8E8E93", fontSize: 12, textAlign: "center", paddingVertical: 12 },
  contributorMini: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 6,
  },
  contributorMiniDistance: { color: "#8E8E93", fontSize: 12, fontWeight: "600" },

  motivationCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    backgroundColor: "#F5F5F0",
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  motivationText: { flex: 1, color: "#8E8E93", fontSize: 13, fontWeight: "500" },

  emptyStateContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: { color: "#1A1A1A", fontSize: 20, fontWeight: "700", marginTop: 16 },
  emptySubtext: { color: "#8E8E93", fontSize: 14, textAlign: "center", marginTop: 8, marginBottom: 24 },
  challengeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FF6B35",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  challengeBtnText: { color: "#FFF", fontWeight: "600", fontSize: 15 },

  pastWarsSection: { width: "100%", marginTop: 32 },
  pastWarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#F5F5F0",
    borderRadius: 10,
    overflow: "hidden",
  },
  pastWarBar: { width: 4, height: "100%", minHeight: 48 },
  pastWarInfo: { padding: 12, flex: 1 },
  pastWarResult: { color: "#1A1A1A", fontSize: 14, fontWeight: "600" },
  pastWarScore: { color: "#8E8E93", fontSize: 13, marginTop: 2 },
  pastWarBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  pastWarBadgeText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },

  pendingCard: {
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 40,
    backgroundColor: "#F5F5F0",
    borderRadius: 16,
    padding: 32,
  },
  pendingTitle: { color: "#1A1A1A", fontSize: 20, fontWeight: "700", marginTop: 16 },
  pendingSubtext: { color: "#8E8E93", fontSize: 14, textAlign: "center", marginTop: 8, marginBottom: 24 },
  challengeActions: { flexDirection: "row", gap: 12, width: "100%" },
  acceptBtn: {
    flex: 1,
    backgroundColor: "#FF6B35",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  acceptBtnText: { color: "#FFF", fontWeight: "600", fontSize: 15 },
  declineBtn: {
    flex: 1,
    backgroundColor: "#F5F5F0",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  declineBtnText: { color: "#FF3B30", fontWeight: "600", fontSize: 15 },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
  },
  cancelBtnText: { color: "#8E8E93", fontSize: 14, fontWeight: "500" },

  completedCard: {
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 40,
    backgroundColor: "#F5F5F0",
    borderRadius: 16,
    padding: 32,
  },
  completedEmoji: { fontSize: 48 },
  completedTitle: { color: "#1A1A1A", fontSize: 20, fontWeight: "700", marginTop: 12 },
  completedScore: { color: "#8E8E93", fontSize: 14, textAlign: "center", marginTop: 8 },
  completedWinner: { color: "#FF6B35", fontSize: 15, fontWeight: "600", marginTop: 12 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    maxHeight: "70%",
  },
  dragHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D1D6",
    marginBottom: 16,
  },
  modalTitle: { color: "#1A1A1A", fontSize: 17, fontWeight: "700", marginBottom: 16 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: { flex: 1, color: "#1A1A1A", fontSize: 15, paddingVertical: 12 },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  searchResultInfo: { flex: 1 },
  searchResultName: { color: "#1A1A1A", fontSize: 15, fontWeight: "600" },
  searchResultMembers: { color: "#8E8E93", fontSize: 13, marginTop: 2 },
  challengeSmallBtn: {
    backgroundColor: "#FF6B35",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 80,
    alignItems: "center",
  },
  challengeSmallBtnDisabled: { backgroundColor: "#D1D1D6" },
  challengeSmallBtnText: { color: "#FFF", fontWeight: "600", fontSize: 13 },
  noResults: { color: "#8E8E93", textAlign: "center", marginTop: 20, fontSize: 14 },
});
