import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CaretLeftIcon, DotsThreeVerticalIcon } from "phosphor-react-native";
import { colors } from "../../../../theme";
import { useAuth } from "../../../../context/Auth";
import UserAvatar from "../../../../components/UserAvatar";
import {
  getClanById,
  deriveClanRole,
  getClanPermissions,
  acceptJoinRequest,
  declineJoinRequest,
  removeMember,
  promoteToModerator,
  demoteModerator,
  promoteToCoLeader,
  demoteCoLeader,
  demoteCoLeaderToModerator,
  transferLeadership,
  subscribeToClan,
  subscribeToJoinRequests,
} from "../../../../services/clanService";
import { getUserProfiles } from "../../../../services/userService";
import type { Clan, ClanJoinRequest, ClanRole, UserProfile } from "../../../../types/index";

const ROLE_COLORS: Record<ClanRole, string> = {
  Leader: "#D4952B",
  "Co-Leader": "#003153",
  Moderator: "#88BB00",
  Member: "#9E9E9E",
};

interface MemberRow {
  uid: string;
  role: ClanRole;
  profile: UserProfile | null;
}

export default function ClanMembersScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [clan, setClan] = useState<Clan | null>(null);
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [requests, setRequests] = useState<ClanJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);

  // Real-time clan listener
  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToClan(id, setClan);
    return unsub;
  }, [id]);

  // Real-time join requests listener
  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToJoinRequests(id, (reqs) => {
      setRequests(reqs);
    });
    return unsub;
  }, [id]);

  // Derive rows whenever clan data changes
  const buildRows = useCallback(async (c: Clan) => {
    const profiles = await getUserProfiles(c.memberIds);
    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    setRows(
      c.memberIds.map((uid) => ({
        uid,
        role: deriveClanRole(c, uid) as ClanRole,
        profile: profileMap.get(uid) ?? null,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (clan) {
      buildRows(clan);
    }
  }, [clan, buildRows]);

  const handleAccept = async (req: ClanJoinRequest) => {
    if (!id) return;
    await acceptJoinRequest(req.id, id, req.userId);
  };

  const handleDecline = async (req: ClanJoinRequest) => {
    await declineJoinRequest(req.id);
  };

  const handleRemove = (memberId: string, memberRole: ClanRole) => {
    if (!id || memberRole === "Leader") return;
    Alert.alert("Remove Member", "Remove this member from the clan?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await removeMember(id, memberId);
        },
      },
    ]);
  };

  const handlePromote = async (member: MemberRow) => {
    if (!id) return;
    try {
      if (member.role === "Member") {
        await promoteToModerator(id, member.uid);
      } else if (member.role === "Moderator") {
        await promoteToCoLeader(id, member.uid);
      }
      setSelectedMember(null);
    } catch (e) {
      console.error("Failed to promote member:", e);
    }
  };

  const handleDemote = async (member: MemberRow) => {
    if (!id) return;
    try {
      if (member.role === "Co-Leader") {
        await demoteCoLeader(id, member.uid);
      } else if (member.role === "Moderator") {
        await demoteModerator(id, member.uid);
      }
      setSelectedMember(null);
    } catch (e) {
      console.error("Failed to demote member:", e);
    }
  };

  const handleDemoteToMember = async (member: MemberRow) => {
    if (!id) return;
    try {
      await demoteCoLeader(id, member.uid);
      setSelectedMember(null);
    } catch (e) {
      console.error("Failed to demote member:", e);
    }
  };

  const handleTransferLeadership = (member: MemberRow) => {
    if (!id || !user) return;
    Alert.alert(
      "Transfer Leadership",
      `Are you sure you want to transfer clan leadership to ${member.profile?.name ?? member.uid}?\n\nYou will become a Co-Leader.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Transfer",
          style: "destructive",
          onPress: async () => {
            try {
              await transferLeadership(id, user.uid, member.uid);
              setSelectedMember(null);
            } catch (e) {
              console.error("Failed to transfer leadership:", e);
            }
          },
        },
      ]
    );
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

  const myRole = user ? deriveClanRole(clan, user.uid) : null;
  const canRemove = getClanPermissions(myRole).canRemoveMember;
  const canPromote = getClanPermissions(myRole).canPromoteDemote;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <CaretLeftIcon size={20} color="#1A1A1A" weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Members ({clan.memberIds.length})</Text>
        <View style={{ width: 20 }} />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const displayName =
            item.uid === user?.uid ? "You" : item.profile?.name ?? "Unknown Runner";
          return (
            <TouchableOpacity
              style={styles.row}
              onLongPress={() => canRemove && handleRemove(item.uid, item.role)}
            >
              <UserAvatar uri={item.profile?.avatarUrl ?? null} size={40} name={displayName} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{displayName}</Text>
                <View
                  style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[item.role] + "22" }]}
                >
                  <Text style={[styles.roleText, { color: ROLE_COLORS[item.role] }]}>
                    {item.role}
                  </Text>
                </View>
              </View>
              {canPromote && item.role !== "Leader" && (
                <TouchableOpacity onPress={() => setSelectedMember(item)}>
                  <DotsThreeVerticalIcon size={20} color="#8E8E93" weight="bold" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          requests.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>PENDING REQUESTS</Text>
              {requests.map((req) => (
                <View key={req.id} style={styles.requestRow}>
                  <UserAvatar uri={req.userAvatarUrl} size={40} name={req.userName} />
                  <Text style={styles.rowName}>{req.userName}</Text>
                  <View style={styles.requestActions}>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(req)}>
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDecline(req)}>
                      <View style={styles.declineBtn}>
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          ) : null
        }
      />

      {selectedMember && (
        <Modal
          visible={!!selectedMember}
          animationType="fade"
          transparent
          onRequestClose={() => setSelectedMember(null)}
        >
          <TouchableOpacity
            style={styles.actionSheetOverlay}
            activeOpacity={1}
            onPress={() => setSelectedMember(null)}
          >
            <View style={styles.actionSheetCard}>
              <Text style={styles.actionSheetTitle}>
                {selectedMember.profile?.name ?? selectedMember.uid}
              </Text>

              {selectedMember.role === "Member" && (
                <TouchableOpacity
                  style={styles.actionSheetOption}
                  onPress={() => handlePromote(selectedMember)}
                >
                  <Text style={styles.actionSheetOptionText}>Promote to Moderator</Text>
                </TouchableOpacity>
              )}

              {selectedMember.role === "Member" && myRole === "Leader" && (
                <TouchableOpacity
                  style={styles.actionSheetOption}
                  onPress={() => {
                    if (!id) return;
                    promoteToCoLeader(id, selectedMember.uid);
                    setSelectedMember(null);
                  }}
                >
                  <Text style={styles.actionSheetOptionText}>Promote to Co-Leader</Text>
                </TouchableOpacity>
              )}

              {selectedMember.role === "Moderator" && myRole === "Leader" && (
                <TouchableOpacity
                  style={styles.actionSheetOption}
                  onPress={() => handlePromote(selectedMember)}
                >
                  <Text style={styles.actionSheetOptionText}>Promote to Co-Leader</Text>
                </TouchableOpacity>
              )}

              {selectedMember.role === "Moderator" && (
                <TouchableOpacity
                  style={styles.actionSheetOption}
                  onPress={() => handleDemote(selectedMember)}
                >
                  <Text style={[styles.actionSheetOptionText, { color: "#FF3B30" }]}>
                    Demote to Member
                  </Text>
                </TouchableOpacity>
              )}

              {selectedMember.role === "Co-Leader" && myRole === "Leader" && (
                <TouchableOpacity
                  style={styles.actionSheetOption}
                  onPress={() => {
                    if (!id) return;
                    demoteCoLeaderToModerator(id, selectedMember.uid);
                    setSelectedMember(null);
                  }}
                >
                  <Text style={[styles.actionSheetOptionText, { color: "#FF3B30" }]}>
                    Demote to Moderator
                  </Text>
                </TouchableOpacity>
              )}

              {selectedMember.role === "Co-Leader" && myRole === "Leader" && (
                <TouchableOpacity
                  style={styles.actionSheetOption}
                  onPress={() => handleDemoteToMember(selectedMember)}
                >
                  <Text style={[styles.actionSheetOptionText, { color: "#FF3B30" }]}>
                    Demote to Member
                  </Text>
                </TouchableOpacity>
              )}

              {myRole === "Leader" && selectedMember.role !== "Leader" && (
                <TouchableOpacity
                  style={styles.actionSheetOption}
                  onPress={() => handleTransferLeadership(selectedMember)}
                >
                  <Text style={[styles.actionSheetOptionText, { color: colors.accentAmber }]}>
                    Transfer Leadership
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionSheetOption, styles.actionSheetCancel]}
                onPress={() => setSelectedMember(null)}
              >
                <Text style={styles.actionSheetCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#003153", opacity: 0.6 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: { color: "#111110", fontSize: 17, fontWeight: "600" },
  listContent: { paddingHorizontal: 16 },
  sectionLabel: {
    color: "#9E9E9E",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  rowInfo: { flex: 1 },
  rowName: { color: "#111110", fontSize: 15, fontWeight: "500" },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    marginTop: 4,
  },
  roleText: { fontSize: 11, fontWeight: "600" },
  requestRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  requestActions: { flexDirection: "row", gap: 12, marginLeft: "auto" },
  acceptBtn: { backgroundColor: "#003153", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  acceptBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  declineBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  declineBtnText: { color: "#E62E50", fontSize: 13, fontWeight: "500", textDecorationLine: "underline" },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  actionSheetCard: {
    backgroundColor: "#FAF8F5",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
  actionSheetTitle: {
    color: "#111110",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  actionSheetOption: {
    paddingVertical: 14,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0EEE9",
  },
  actionSheetOptionText: { color: "#003153", fontSize: 17, fontWeight: "400" },
  actionSheetCancel: { marginTop: 8 },
  actionSheetCancelText: { color: "#E62E50", fontSize: 17, fontWeight: "600" },
});