import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { UsersThree } from "phosphor-react-native";
import UserAvatar from "./UserAvatar";
import type { Clan, ClanRole } from "../types/index";
import { colors, spacing, radius, typography } from "../theme";

const ROLE_COLORS: Record<ClanRole, string> = {
  Leader: colors.accentAmber,
  "Co-Leader": colors.accentBlue,
  Moderator: colors.accentVolt,
  Member: colors.textTertiary,
};

interface ClanCardProps {
  clan: Clan;
  role?: ClanRole | null;
  onPress: () => void;
}

export default function ClanCard({ clan, role, onPress }: ClanCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <UserAvatar uri={clan.bannerUrl} name={clan.name} size={48} shape="rounded" />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {clan.name}
        </Text>
        <View style={styles.metaRow}>
          <UsersThree size={14} color={colors.textSecondary} weight="fill" />
          <Text style={styles.memberCount}>
            {clan.memberIds.length} members
          </Text>
          {clan.currentWarId && (
            <View style={styles.warDot} />
          )}
        </View>
      </View>

      {role && (
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: ROLE_COLORS[role] + "22" },
          ]}
        >
          <Text style={[styles.roleText, { color: ROLE_COLORS[role] }]}>
            {role}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  info: { flex: 1 },
  name: {
    color: colors.textPrimary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  memberCount: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
  },
  warDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentCoral,
    marginLeft: 2,
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  roleText: {
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
  },
});
