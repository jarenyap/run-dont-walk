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
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CaretLeft,
  MagnifyingGlass,
  Sword,
  Trophy,
  Medal,
} from "phosphor-react-native";
import { useAuth } from "../../../../context/Auth";
import {
  subscribeToClan,
  deriveClanRole,
  getClanPermissions,
  searchAllClansByName,
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
import { colors, spacing, radius, typography } from "../../../../theme";

export default function ClanWarScreen() {
  const insets = useSafeAreaInsets();
  const { id, warId } = useLocalSearchParams<{ id: string; warId?: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();

  const [clan, setClan] = useState<Clan | null>(null);
  const [war, setWar] = useState<ClanWarWithId | null>(null);
  const [pastWars, setPastWars] = useState<ClanWarWithId[]>([]);
  const [clan1Contributors, setClan1Contributors] = useState<WarContributor[]>([]);
  const [clan2Contributors, setClan2Contributors] = useState<WarContributor[]>([]);
  const [loading, setLoading] = useState(true);

  const [challengeModalVisible, setChallengeModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Clan[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyClans, setBusyClans] = useState<Set<string>>(new Set());
  const [challenging, setChallenging] = useState<string | null>(null);
  const [handlingWar, setHandlingWar] = useState(false);

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

  useEffect(() => {
    if (!war || war.status !== "active" || !id) return;
    const opponentId = war.clan1Id === id ? war.clan2Id : war.clan1Id;
    const myMemberIds = clan?.memberIds ?? [];
    const startDate = war.startedAt?.toDate?.() ?? new Date();
    const endDate = war.endsAt?.toDate?.() ?? new Date();
    const isClan1 = war.clan1Id === id;

    getClanById(opponentId).then((oppClan) => {
      const oppMemberIds = oppClan?.memberIds ?? [];
      getWarTopContributors(
        startDate,
        endDate,
        war.clan1Name,
        isClan1 ? myMemberIds : oppMemberIds
      ).then(setClan1Contributors);
      getWarTopContributors(
        startDate,
        endDate,
        war.clan2Name,
        isClan1 ? oppMemberIds : myMemberIds
      ).then(setClan2Contributors);
    });
  }, [war, id, clan?.memberIds]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchAllClansByName(searchTerm.trim().toLowerCase());
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

  const myRole = clan && user ? deriveClanRole(clan, user.uid) : null;
  const permissions = getClanPermissions(myRole);
  const canManageWar = permissions.canStartWar;

  const myClanIsClan1 = id === war?.clan1Id;
  const isTargetClan = id === war?.clan2Id && war?.status === "pending";

  const handleChallenge = async (targetClan: Clan) => {
    if (!id || !user) return;
    setChallenging(targetClan.id);
    try {
      await challengeClan(id, clan?.name ?? "Your Clan", targetClan.id, targetClan.name, user.uid);
      setChallengeModalVisible(false);
      setSearchTerm("");
      Alert.alert("Challenge Sent", `War challenge sent to ${targetClan.name}!`);
    } catch (e: any) {
      console.error("Failed to challenge clan:", e);
      Alert.alert("Error", e?.message || "Could not send challenge.");
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
    Alert.alert("Cancel Challenge", "Are you sure?", [
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

  if (loading || !clan) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.loadingDot} />
        </View>
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
      <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <CaretLeft size={20} color={colors.textPrimary} weight="bold" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Clan War</Text>
          <View style={{ width: 20 }} />
        </View>

        <View style={styles.pendingCard}>
          <Sword size={48} color={colors.accentBlue} weight="fill" />
          <Text style={styles.pendingTitle}>
            {war.clan1Name} vs {war.clan2Name}
          </Text>
          <Text style={styles.pendingSubtext}>
            {isTargetClan
              ? `${war.clan1Name} has challenged your clan. Accept or decline.`
              : `Challenge sent to ${war.clan2Name}. Waiting for their response.`}
          </Text>

          {isTargetClan && canManageWar && (
            <View style={styles.challengeActions}>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={handleAccept}
                disabled={handlingWar}
              >
                {handlingWar ? (
                  <Text style={styles.acceptBtnText}>Accepting…</Text>
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
      <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <CaretLeft size={20} color={colors.textPrimary} weight="bold" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>War Results</Text>
          <View style={{ width: 20 }} />
        </View>

        <View style={styles.completedCard}>
          {won ? (
            <Trophy size={48} color={colors.accentAmber} weight="fill" />
          ) : (
            <Medal size={48} color={colors.textTertiary} weight="fill" />
          )}
          <Text style={styles.completedTitle}>
            {won ? "Victory" : "Good effort"}
          </Text>
          <Text style={styles.completedScore}>
            {war.clan1Name} {war.clan1Distance} km — {war.clan2Distance} km{" "}
            {war.clan2Name}
          </Text>
          <Text style={styles.completedWinner}>
            Winner:{" "}
            {war.winnerId === war.clan1Id ? war.clan1Name : war.clan2Name}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <CaretLeft size={20} color={colors.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clan War</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.emptyStateContainer}>
        <Trophy size={64} color={colors.textTertiary} weight="light" />
        <Text style={styles.emptyTitle}>No Active War</Text>
        <Text style={styles.emptySubtext}>
          Challenge another clan to a distance race.
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
            <Sword size={20} color="#FFF" weight="fill" />
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
                  style={styles.pastWarRow}
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
                  <View
                    style={[
                      styles.pastWarBadge,
                      {
                        backgroundColor: won
                          ? colors.accentVolt
                          : isTie
                          ? colors.textTertiary
                          : colors.accentCoral,
                      },
                    ]}
                  >
                    <Text style={styles.pastWarBadgeText}>
                      {won ? "W" : isTie ? "T" : "L"}
                    </Text>
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
                <MagnifyingGlass size={16} color={colors.textTertiary} />
                <TextInput
                  style={styles.searchInput}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  placeholder="Search clans"
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                />
              </View>
              {searching ? (
                <View style={styles.searchingWrap}>
                  <View style={styles.loadingDot} />
                </View>
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
                          (challenging !== null || busyClans.has(item.id)) &&
                            styles.challengeSmallBtnDisabled,
                        ]}
                        onPress={() => {
                          if (busyClans.has(item.id)) {
                            Alert.alert(
                              "Clan is busy",
                              `${item.name} is currently in a clan war.`
                            );
                            return;
                          }
                          handleChallenge(item);
                        }}
                        disabled={challenging !== null}
                      >
                        {busyClans.has(item.id) ? (
                          <Text style={styles.challengeSmallBtnText}>In a war</Text>
                        ) : challenging === item.id ? (
                          <Text style={styles.challengeSmallBtnText}>Challenging…</Text>
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
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={onBack}>
          <CaretLeft size={20} color={colors.textPrimary} weight="bold" />
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
            {days}d {String(hours).padStart(2, "0")}h{" "}
            {String(minutes).padStart(2, "0")}m{" "}
            {String(seconds).padStart(2, "0")}s
          </Text>
        )}
        <Text style={styles.countdownBannerLabel}>remaining</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Contributors</Text>
        <View style={styles.columnsRow}>
          <View
            style={[
              styles.column,
              { borderRightWidth: 1, borderRightColor: colors.borderSubtle },
            ]}
          >
            <Text style={[styles.columnHeader, { color: colors.accentBlue }]}>
              {myName}
            </Text>
            {myContributors.length === 0 ? (
              <Text style={styles.emptyColumn}>No runs yet</Text>
            ) : (
              myContributors.map((c, i) => (
                <View key={c.uid} style={styles.contributorMini}>
                  <Text style={styles.medal}>
                    {i === 0 ? "1." : i === 1 ? "2." : i === 2 ? "3." : `${i + 1}.`}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contributorName} numberOfLines={1}>
                      {c.name}
                    </Text>
                  </View>
                  <Text style={styles.contributorMiniDistance}>
                    {c.distanceKm} km
                  </Text>
                </View>
              ))
            )}
          </View>
          <View style={styles.column}>
            <Text style={[styles.columnHeader, { color: colors.accentCoral }]}>
              {oppName}
            </Text>
            {oppContributors.length === 0 ? (
              <Text style={styles.emptyColumn}>No runs yet</Text>
            ) : (
              oppContributors.map((c, i) => (
                <View key={c.uid} style={styles.contributorMini}>
                  <Text style={styles.medal}>
                    {i === 0 ? "1." : i === 1 ? "2." : i === 2 ? "3." : `${i + 1}.`}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contributorName} numberOfLines={1}>
                      {c.name}
                    </Text>
                  </View>
                  <Text style={styles.contributorMiniDistance}>
                    {c.distanceKm} km
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>

      <View style={styles.motivationCard}>
        <Text style={styles.motivationText}>
          Every run you log during the war adds to your clan's total.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentBlue,
    opacity: 0.6,
  },
  searchingWrap: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  countdownBanner: {
    alignItems: "center",
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing.md,
  },
  countdownBannerText: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  countdownBannerLabel: {
    color: colors.textSecondary,
    fontSize: typography.badge.fontSize,
    marginTop: spacing.xs,
    textTransform: "uppercase",
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    marginBottom: spacing.md,
  },
  columnsRow: { flexDirection: "row" },
  column: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
  },
  columnHeader: {
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptyColumn: {
    color: colors.textSecondary,
    fontSize: typography.badge.fontSize,
    textAlign: "center",
    paddingVertical: spacing.md,
  },
  contributorMini: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 6,
  },
  medal: {
    fontSize: typography.badge.fontSize,
    width: 22,
    textAlign: "center",
    color: colors.textSecondary,
    fontWeight: "600",
  },
  contributorName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.caption.fontSize,
    fontWeight: "500",
  },
  contributorMiniDistance: {
    color: colors.textSecondary,
    fontSize: typography.badge.fontSize,
    fontWeight: "600",
  },
  motivationCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing.md,
  },
  motivationText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: "500",
    textAlign: "center",
  },
  emptyStateContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    marginTop: spacing.md,
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  challengeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.accentBlue,
    borderRadius: radius.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  challengeBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
  pastWarsSection: {
    width: "100%",
    marginTop: spacing.xl,
  },
  pastWarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    overflow: "hidden",
  },
  pastWarInfo: { padding: spacing.md, flex: 1 },
  pastWarResult: {
    color: colors.textPrimary,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
  },
  pastWarScore: {
    color: colors.textSecondary,
    fontSize: typography.badge.fontSize,
    marginTop: 2,
  },
  pastWarBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  pastWarBadgeText: {
    color: "#FFFFFF",
    fontSize: typography.caption.fontSize,
    fontWeight: "800",
  },
  pendingCard: {
    alignItems: "center",
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing.xl,
  },
  pendingTitle: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    marginTop: spacing.md,
  },
  pendingSubtext: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  challengeActions: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.accentBlue,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: "center",
  },
  acceptBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
  declineBtn: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.accentCoral,
  },
  declineBtnText: {
    color: colors.accentCoral,
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
  cancelBtn: {
    marginTop: spacing.md,
    paddingVertical: 12,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: "500",
  },
  completedCard: {
    alignItems: "center",
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing.xl,
  },
  completedTitle: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    marginTop: spacing.md,
  },
  completedScore: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  completedWinner: {
    color: colors.accentAmber,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.bgPrimary,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: "70%",
  },
  dragHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderDefault,
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    paddingVertical: 12,
  },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  searchResultInfo: { flex: 1 },
  searchResultName: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
  searchResultMembers: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  challengeSmallBtn: {
    backgroundColor: colors.accentBlue,
    borderRadius: radius.sm - 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 80,
    alignItems: "center",
  },
  challengeSmallBtnDisabled: {
    backgroundColor: colors.bgInput,
  },
  challengeSmallBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: typography.caption.fontSize,
  },
  noResults: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.lg,
    fontSize: typography.caption.fontSize,
  },
});
