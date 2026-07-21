import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { GearSixIcon, CaretLeftIcon } from "phosphor-react-native";
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
  getJoinRequests,
} from "../../../../services/clanService";
import type { Clan } from "../../../../types/index";

export default function ClanHomeScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [clan, setClan] = useState<Clan | null>(null);
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToClan(id, setClan);
    return unsub;
  }, [id]);

  // Check for existing pending join requests when clan loads
  useEffect(() => {
    if (!id || !user) return;
    getJoinRequests(id).then((requests) => {
      if (requests.some((r) => r.userId === user.uid)) {
        setHasRequested(true);
      }
    }).catch(() => {});
  }, [id, user]);

  // Track hasRequested when clan data or role changes (must be before early return)
  useEffect(() => {
    if (!clan || !user) return;
    const currentRole = deriveClanRole(clan, user.uid);
    if (currentRole !== null) {
      setHasRequested(false);
    } else if (id) {
      getJoinRequests(id).then((requests) => {
        setHasRequested(requests.some((r) => r.userId === user.uid));
      }).catch(() => {});
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
        <View style={styles.banner} />
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 8 }]}
          onPress={() => router.back()}
        >
          <CaretLeftIcon size={20} color="#FFFFFF" weight="bold" />
        </TouchableOpacity>
        {permissions.canEditClan && (
          <TouchableOpacity
            style={[styles.settingsBtn, { top: insets.top + 8 }]}
            onPress={() => router.push(`/clan/${clan.id}/settings`)}
          >
            <GearSixIcon size={20} color="#FFFFFF" weight="fill" />
          </TouchableOpacity>
        )}
        <View style={styles.avatarWrap}>
          <UserAvatar uri={clan.bannerUrl} size={72} name={clan.name} />
        </View>
      </View>

      <View style={styles.identityBlock}>
        <Text style={styles.clanName}>{clan.name}</Text>
        {clan.description ? <Text style={styles.tagline}>"{clan.description}"</Text> : null}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <Text style={styles.statNum}>{clan.memberIds.length}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statNum}>{clan.currentWarId ? "Active" : "None"}</Text>
          <Text style={styles.statLabel}>Clan War</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statNum}>{clan.isPrivate ? "Private" : "Public"}</Text>
          <Text style={styles.statLabel}>Visibility</Text>
        </View>
      </View>

      {role === null && (
        <View style={styles.joinSection}>
          <Text style={styles.joinHeading}>
            {clan.isPrivate ? "Request to join this clan" : "Join this clan"}
          </Text>
          <Text style={styles.joinSubtext}>
            {clan.isPrivate
              ? "Your request will be reviewed by the clan leadership."
              : "Join instantly and start participating in events and wars."}
          </Text>
          <TouchableOpacity
            style={[styles.joinBtn, (joining || hasRequested) && styles.joinBtnDisabled]}
            onPress={handleJoinClan}
            disabled={joining || hasRequested}
          >
            {joining ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
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
        <Text style={styles.viewAll}>View all &gt;</Text>
      </TouchableOpacity>

      <View style={styles.announcementSection}>
        <Text style={styles.sectionTitle}>Announcements</Text>
        {clan.announcement ? (
          <View style={styles.announcementCard}>
            <Text style={styles.announcementAuthor}>{clan.announcement.authorName}</Text>
            <Text style={styles.announcementText}>{clan.announcement.text}</Text>
          </View>
        ) : (
          <Text style={styles.emptyAnnouncement}>No announcements yet</Text>
        )}
        {permissions.canPostAnnouncement && (
          <TouchableOpacity style={styles.postBtn} onPress={handleOpenAnnouncementModal}>
            <Text style={styles.postBtnText}>
              {clan.announcement ? "Edit announcement" : "+ Post announcement"}
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
              placeholder="Share an update with your clan..."
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={4}
              maxLength={280}
              autoFocus
            />
            <Text style={styles.modalCounter}>{announcementText.length}/280</Text>
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
                  (!announcementText.trim() || posting) && styles.modalPostBtnDisabled,
                ]}
                onPress={handlePostAnnouncement}
                disabled={!announcementText.trim() || posting}
              >
                {posting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
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
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingText: { color: "#8E8E93", textAlign: "center", marginTop: 60 },
  bannerWrap: { position: "relative" },
  banner: { width: "100%", height: 160, backgroundColor: "#F5F5F0" },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#00000066",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsBtn: {
    position: "absolute",
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#00000066",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: { position: "absolute", bottom: -32, left: 16 },
  identityBlock: { paddingTop: 44, paddingHorizontal: 16 },
  clanName: { color: "#1A1A1A", fontSize: 24, fontWeight: "700" },
  tagline: { color: "#8E8E93", fontSize: 14, fontStyle: "italic", marginTop: 4 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#F5F5F0",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
  },
  statCol: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: "#E0E0DC" },
  statNum: { color: "#1A1A1A", fontSize: 18, fontWeight: "700" },
  statLabel: { color: "#8E8E93", fontSize: 12, marginTop: 4 },
  membersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: { color: "#1A1A1A", fontSize: 17, fontWeight: "600" },
  viewAll: { color: "#8E8E93", fontSize: 13 },
  announcementSection: { paddingHorizontal: 16, marginTop: 24, marginBottom: 32 },
  announcementCard: { backgroundColor: "#F5F5F0", borderRadius: 12, padding: 16, marginTop: 12 },
  announcementAuthor: { color: "#8E8E93", fontSize: 12, marginBottom: 4 },
  announcementText: { color: "#1A1A1A", fontSize: 14 },
  emptyAnnouncement: { color: "#8E8E93", fontSize: 14, marginTop: 12 },
  postBtn: {
    marginTop: 12,
    backgroundColor: "#FF6B35",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  postBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "#00000066", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: { color: "#1A1A1A", fontSize: 17, fontWeight: "700", marginBottom: 16 },
  modalInput: {
    backgroundColor: "#F5F5F0",
    borderRadius: 12,
    padding: 14,
    color: "#1A1A1A",
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E0E0DC",
  },
  modalCounter: { color: "#8E8E93", fontSize: 12, textAlign: "right", marginTop: 6 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 16 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#F5F5F0",
  },
  modalCancelText: { color: "#8E8E93", fontWeight: "600", fontSize: 15 },
  modalPostBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#FF6B35",
  },
  modalPostBtnDisabled: { backgroundColor: "#D1D1D6" },
  modalPostText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  joinSection: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: "#F5F5F0",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  joinHeading: { color: "#1A1A1A", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  joinSubtext: { color: "#8E8E93", fontSize: 14, textAlign: "center", marginBottom: 16 },
  joinBtn: {
    backgroundColor: "#FF6B35",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: "center",
    minWidth: 160,
  },
  joinBtnDisabled: { backgroundColor: "#D1D1D6" },
  joinBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  leaveBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#F5F5F0",
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  leaveBtnText: { color: "#FF3B30", fontWeight: "600", fontSize: 15 },
});