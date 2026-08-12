import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { GearSix, CaretLeft, Sword, Envelope } from "phosphor-react-native";
import { useAuth } from "../../../../context/Auth";
import UserAvatar from "../../../../components/UserAvatar";
import {
  subscribeToClan,
  deriveClanRole,
  getClanPermissions,
  postAnnouncement,
  joinPublicClan,
  requestToJoinClan,
  leaveClan,
  hasPendingJoinRequest,
} from "../../../../services/clanService";
import {
  subscribeToClanWar,
  getPastWars,
} from "../../../../services/clanWarService";
import type { ClanWarWithId } from "../../../../services/clanWarService";
import type { Clan } from "../../../../types/index";
import { colors, spacing, radius, typography } from "../../../../theme";

export default function ClanHomeScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [clan, setClan] = useState<Clan | null>(null);
  const [war, setWar] = useState<ClanWarWithId | null>(null);
  const [pastWars, setPastWars] = useState<ClanWarWithId[]>([]);
  const [announcementModalVisible, setAnnouncementModalVisible] =
    useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToClan(id, setClan);
    return unsub;
  }, [id]);

  useEffect(() => {
    if (!clan?.currentWarId) {
      setWar(null);
      return;
    }
    const unsub = subscribeToClanWar(clan.currentWarId, setWar);
    return unsub;
  }, [clan?.currentWarId]);

  useEffect(() => {
    if (!id) return;
    getPastWars(id).then(setPastWars);
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;
    hasPendingJoinRequest(id, user.uid).then(setHasRequested);
  }, [id, user]);

  useEffect(() => {
    if (!clan || !user) return;
    const currentRole = deriveClanRole(clan, user.uid);
    if (currentRole !== null) {
      setHasRequested(false);
    } else if (id) {
      hasPendingJoinRequest(id, user.uid).then(setHasRequested);
    }
  }, [clan, id, user]);

  if (!clan) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading clan...</Text>
      </View>
    );
  }

  const role = user ? deriveClanRole(clan, user.uid) : null;
  const permissions = getClanPermissions(role);
  const canManageWar = permissions.canStartWar;

  const handleOpenAnnouncementModal = () => {
    setAnnouncementText(clan.announcement?.text ?? "");
    setAnnouncementModalVisible(true);
  };

  const handlePostAnnouncement = async () => {
    if (!id || !announcementText.trim() || !profile) return;
    setPosting(true);
    try {
      await postAnnouncement(id, profile.name, announcementText.trim());
      setAnnouncementModalVisible(false);
      setAnnouncementText("");
    } catch (e) {
      console.error("Failed to post announcement:", e);
    } finally {
      setPosting(false);
    }
  };

  const handleJoinClan = async () => {
    if (!id || !user || !profile) return;
    setJoining(true);
    try {
      if (clan.isPrivate) {
        await requestToJoinClan(id, user.uid, profile.name, profile.avatarUrl);
        setHasRequested(true);
      } else {
        await joinPublicClan(id, user.uid);
      }
    } catch (e) {
      console.error("Failed to join clan:", e);
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveClan = () => {
    if (!id || !user) return;
    Alert.alert("Leave Clan", "Are you sure you want to leave this clan?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            await leaveClan(id, user.uid);
            router.replace("/(app)/(tabs)/clan");
          } catch (e) {
            console.error("Failed to leave clan:", e);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.bannerWrap}>
        <View style={styles.banner}>
          <View style={styles.bannerMark}>
            <UserAvatar
              uri={clan.bannerUrl}
              name={clan.name}
              size={72}
              shape="rounded"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + spacing.sm }]}
          onPress={() => router.back()}
        >
          <CaretLeft size={20} color={colors.textPrimary} weight="bold" />
        </TouchableOpacity>

        {permissions.canEditClan && (
          <TouchableOpacity
            style={[styles.settingsBtn, { top: insets.top + spacing.sm }]}
            onPress={() => router.push(`/clan/${clan.id}/settings`)}
          >
            <GearSix size={20} color={colors.textPrimary} weight="fill" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.identityBlock}>
        <Text style={styles.clanName}>{clan.name}</Text>
        {clan.description ? (
          <Text style={styles.tagline}>{clan.description}</Text>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <Text style={styles.statNum}>{clan.memberIds.length}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statNum}>
            {war?.status === "active"
              ? "Active"
              : war?.status === "pending"
              ? "Pending"
              : "None"}
          </Text>
          <Text style={styles.statLabel}>Clan War</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statNum}>
            {clan.isPrivate ? "Private" : "Public"}
          </Text>
          <Text style={styles.statLabel}>Visibility</Text>
        </View>
      </View>

      {war &&
        (war.status === "active" || war.status === "pending") &&
        role !== null && (
          <TouchableOpacity
            style={styles.warBanner}
            onPress={() => router.push(`/clan/${clan.id}/war`)}
            activeOpacity={0.8}
          >
            <Sword size={18} color="#FFFFFF" />
            <Text style={styles.warBannerText}>
              {war.status === "active"
                ? "Clan War active — View scoreboard"
                : "Pending war challenge — View details"}
            </Text>
            <Text style={styles.warBannerArrow}>&rsaquo;</Text>
          </TouchableOpacity>
        )}

      {role === null && (
        <View style={styles.joinSection}>
          <Text style={styles.joinHeading}>
            {clan.isPrivate
              ? "Request to join this clan"
              : "Join this clan"}
          </Text>
          <Text style={styles.joinSubtext}>
            {clan.isPrivate
              ? "Your request will be reviewed by the clan leadership."
              : "Join instantly and start participating in events and wars."}
          </Text>
          <TouchableOpacity
            style={[
              styles.joinBtn,
              (joining || hasRequested) && styles.joinBtnDisabled,
            ]}
            onPress={handleJoinClan}
            disabled={joining || hasRequested}
          >
            {joining ? (
              <Text style={styles.joinBtnText}>Joining…</Text>
            ) : (
              <Text style={styles.joinBtnText}>
                {hasRequested
                  ? "Request Pending"
                  : clan.isPrivate
                  ? "Request to Join"
                  : "Join Clan"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.membersRow}
        onPress={() => router.push(`/clan/${clan.id}/members`)}
      >
        <Text style={styles.sectionTitle}>Members</Text>
        <Text style={styles.viewAll}>View all</Text>
      </TouchableOpacity>

      <View style={styles.announcementSection}>
        <Text style={styles.sectionTitle}>Announcements</Text>
        {clan.announcement ? (
          <View style={styles.announcementCard}>
            <Text style={styles.announcementAuthor}>
              {clan.announcement.authorName}
            </Text>
            <Text style={styles.announcementText}>
              {clan.announcement.text}
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyAnnouncement}>
            No announcements yet
          </Text>
        )}
        {permissions.canPostAnnouncement && (
          <TouchableOpacity
            style={styles.postBtn}
            onPress={handleOpenAnnouncementModal}
          >
            <Text style={styles.postBtnText}>
              {clan.announcement
                ? "Edit announcement"
                : "Post announcement"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {role !== null && role !== "Leader" && clan.leaderId !== user?.uid && (
        <TouchableOpacity
          style={styles.leaveBtn}
          onPress={handleLeaveClan}
        >
          <Text style={styles.leaveBtnText}>Leave Clan</Text>
        </TouchableOpacity>
      )}

      {role !== null && (
        <View style={styles.pastWarsSection}>
          <Text style={styles.sectionTitle}>War History</Text>
          {canManageWar && (
            <TouchableOpacity
              style={[
                styles.startWarBtn,
                clan?.currentWarId && styles.startWarBtnDisabled,
              ]}
              onPress={() => router.push(`/clan/${clan?.id}/war`)}
              disabled={!!clan?.currentWarId}
            >
              <Text style={styles.startWarBtnText}>
                {clan?.currentWarId
                  ? "War in progress"
                  : "Start a Clan War"}
              </Text>
            </TouchableOpacity>
          )}
          {pastWars.length === 0 ? (
            <Text style={styles.emptyAnnouncement}>No past wars</Text>
          ) : (
            pastWars.map((pw) => {
              const won = pw.winnerId === clan?.id;
              const isTie = pw.winnerId === null;
              const myName = clan?.name ?? "";
              const opponentName =
                pw.clan1Id === id ? pw.clan2Name : pw.clan1Name;
              const myScore =
                pw.clan1Id === id
                  ? pw.clan1Distance
                  : pw.clan2Distance;
              const oppScore =
                pw.clan1Id === id
                  ? pw.clan2Distance
                  : pw.clan1Distance;
              return (
                <TouchableOpacity
                  key={pw.id}
                  style={styles.pastWarRow}
                  onPress={() =>
                    router.push(`/clan/${id}/war?warId=${pw.id}`)
                  }
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
            })
          )}
        </View>
      )}

      <Modal
        visible={announcementModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAnnouncementModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Post Announcement</Text>
              <TextInput
                style={styles.modalInput}
                value={announcementText}
                onChangeText={setAnnouncementText}
                placeholder="Share an update with your clan"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                maxLength={280}
                autoFocus
              />
              <Text style={styles.modalCounter}>
                {announcementText.length}/280
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setAnnouncementModalVisible(false)}
                  disabled={posting}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalPostBtn,
                    (!announcementText.trim() || posting) &&
                      styles.modalPostBtnDisabled,
                  ]}
                  onPress={handlePostAnnouncement}
                  disabled={!announcementText.trim() || posting}
                >
                  {posting ? (
                    <Text style={styles.modalPostText}>Posting…</Text>
                  ) : (
                    <Text style={styles.modalPostText}>Post</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  loadingText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 60,
  },
  bannerWrap: { position: "relative" },
  banner: {
    width: "100%",
    height: 180,
    backgroundColor: colors.bgSecondary,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: spacing.xl,
  },
  bannerMark: {
    marginBottom: -spacing.md,
  },
  backBtn: {
    position: "absolute",
    left: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bgSurface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  settingsBtn: {
    position: "absolute",
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bgSurface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  identityBlock: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  clanName: {
    color: colors.textPrimary,
    fontSize: typography.displayLarge.fontSize,
    fontWeight: typography.displayLarge.fontWeight,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    marginTop: spacing.xs,
    textAlign: "center",
    lineHeight: typography.body.lineHeight,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  statCol: { flex: 1, alignItems: "center" },
  statDivider: {
    width: 1,
    backgroundColor: colors.borderSubtle,
  },
  statNum: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.badge.fontSize,
    marginTop: spacing.xs,
  },
  membersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  viewAll: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
  },
  announcementSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  announcementCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  announcementAuthor: {
    color: colors.textSecondary,
    fontSize: typography.badge.fontSize,
    marginBottom: spacing.xs,
  },
  announcementText: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
  },
  emptyAnnouncement: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    marginTop: spacing.md,
  },
  postBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.accentBlue,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: "center",
  },
  postBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: typography.caption.fontSize,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.bgPrimary,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalCounter: {
    color: colors.textSecondary,
    fontSize: typography.badge.fontSize,
    textAlign: "right",
    marginTop: 6,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: "center",
    backgroundColor: colors.bgInput,
  },
  modalCancelText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
  modalPostBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: "center",
    backgroundColor: colors.accentBlue,
  },
  modalPostBtnDisabled: {
    backgroundColor: colors.bgInput,
  },
  modalPostText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
  joinSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing.lg,
    alignItems: "center",
  },
  joinHeading: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  joinSubtext: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  joinBtn: {
    backgroundColor: colors.accentBlue,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    minWidth: 160,
  },
  joinBtnDisabled: {
    backgroundColor: colors.bgInput,
  },
  joinBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
  leaveBtn: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.sm,
    alignItems: "center",
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.accentCoral,
  },
  leaveBtnText: {
    color: colors.accentCoral,
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
  warBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.accentBlue,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  warBannerText: {
    color: "#FFFFFF",
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    flex: 1,
  },
  warBannerArrow: {
    color: "#FFFFFF",
    fontSize: typography.title.fontSize,
    fontWeight: "700",
  },
  pastWarsSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
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
  pastWarInfo: {
    padding: spacing.md,
    flex: 1,
  },
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
  startWarBtn: {
    backgroundColor: colors.accentBlue,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  startWarBtnDisabled: {
    backgroundColor: colors.bgInput,
  },
  startWarBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
});
