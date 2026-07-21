import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { UsersThreeIcon } from "phosphor-react-native";
import UserAvatar from "./UserAvatar";
import type { Clan, ClanRole } from "../types/index";

const ROLE_COLORS: Record<ClanRole, string> = {
  Leader: "#FF6B35",
  "Co-Leader": "#0A84FF",
  Moderator: "#34C759",
  Member: "#8E8E93",
};

interface ClanCardProps {
  clan: Clan;
  role?: ClanRole | null;
  onPress: () => void;
}

export default function ClanCard({ clan, role, onPress }: ClanCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <UserAvatar uri={clan.bannerUrl} size={48} name={clan.name} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {clan.name}
        </Text>
        <View style={styles.metaRow}>
          <UsersThreeIcon size={14} color="#8E8E93" weight="fill" />
          <Text style={styles.memberCount}>{clan.memberIds.length} members</Text>
          {clan.currentWarId && <View style={styles.warDot} />}
        </View>
      </View>
      {role && (
        <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[role] + "22" }]}>
          <Text style={[styles.roleText, { color: ROLE_COLORS[role] }]}>{role}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F0",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  info: { flex: 1 },
  name: { color: "#1A1A1A", fontSize: 15, fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 },
  memberCount: { color: "#8E8E93", fontSize: 13 },
  warDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B30", marginLeft: 4 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  roleText: { fontSize: 11, fontWeight: "600" },
});