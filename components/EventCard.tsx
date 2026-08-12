import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MapPinIcon, DotsThreeVerticalIcon } from "phosphor-react-native";
import UserAvatar from "./UserAvatar";
import { Event } from "../types/index";
import { colors, spacing, radius, typography } from "../theme";

const DIFFICULTY: Record<Event["difficulty"], { bg: string; text: string }> = {
    easy: { bg: "#88BB0022", text: colors.accentVolt },
    moderate: { bg: "#D4952B22", text: colors.accentAmber },
    hard: { bg: "#E62E5022", text: colors.accentCoral },
};

interface EventCardProps {
    event: Event;
    rsvped: boolean;
    full: boolean;
    past: boolean;
    canManage: boolean;
    isCreator: boolean;
    onToggleRSVP: () => void;
    onManage?: () => void;
}

export default function EventCard({
    event,
    rsvped,
    full,
    past,
    canManage,
    isCreator,
    onToggleRSVP,
    onManage,
}: EventCardProps) {
    const difficulty = DIFFICULTY[event.difficulty];
    const scheduled = event.scheduledAt.toDate();

    const pillDisabled = past || (full && !rsvped) || isCreator;

    return (
        <View style={s.card}>
            {/* host row */}
            <View style={s.hostRow}>
                <UserAvatar
                    uri={event.creatorAvatarUrl}
                    size={20}
                    name={event.creatorName}
                />
                <Text style={s.hostText}>
                    Hosted by{" "}
                    <Text style={s.hostName}>
                        {isCreator ? "You" : event.creatorName}
                    </Text>
                </Text>
                {canManage && onManage && (
                    <TouchableOpacity
                        style={s.manageButton}
                        onPress={onManage}
                    >
                        <DotsThreeVerticalIcon
                            size={16}
                            color={colors.textTertiary}
                            weight="bold"
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* body */}
            <View style={s.body}>
                {/* date badge */}
                <View style={s.dateBadge}>
                    <Text style={s.month}>
                        {scheduled.toLocaleString("en-GB", { month: "short" })}
                    </Text>
                    <Text style={s.day}>{scheduled.getDate()}</Text>
                </View>

                <View style={s.info}>
                    {/* title + difficulty */}
                    <View style={s.titleRow}>
                        <Text style={s.title} numberOfLines={1}>
                            {event.title}
                        </Text>
                        <View
                            style={[
                                s.difficultyBadge,
                                { backgroundColor: difficulty.bg },
                            ]}
                        >
                            <Text
                                style={[
                                    s.difficultyText,
                                    { color: difficulty.text },
                                ]}
                            >
                                {event.difficulty[0].toUpperCase() +
                                    event.difficulty.slice(1)}
                            </Text>
                        </View>
                    </View>

                    {/* location / time / distance */}
                    <View style={s.dataRow}>
                        <MapPinIcon size={12} color={colors.textTertiary} />
                        <Text style={s.dataText}>
                            {event.location} |{" "}
                            {scheduled.toLocaleString("en-GB", {
                                hour: "numeric",
                                minute: "2-digit",
                            })}{" "}
                            | {event.distance}km
                        </Text>
                    </View>

                    {/* footer: RSVP count + pill */}
                    <View style={s.footerRow}>
                        <Text style={s.rsvpCount}>
                            {event.rsvpIds.length}
                            {event.maxParticipants > 0
                                ? `/${event.maxParticipants}`
                                : ""}{" "}
                            going
                        </Text>
                        <TouchableOpacity
                            style={[
                                s.pill,
                                rsvped && s.pillActive,
                                pillDisabled && s.pillDisabled,
                            ]}
                            onPress={onToggleRSVP}
                            disabled={pillDisabled}
                        >
                            <Text
                                style={[
                                    s.pillText,
                                    rsvped && s.pillTextActive,
                                    pillDisabled && s.pillTextDisabled,
                                ]}
                            >
                                {isCreator
                                    ? "Hosting"
                                    : past
                                    ? event.completedAt
                                        ? "Completed"
                                        : "Ended"
                                    : rsvped
                                    ? "Going"
                                    : full
                                    ? "Full"
                                    : "I'm in!"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    card: {
        backgroundColor: colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },

    /* host */
    hostRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 10,
    },
    hostText: {
        fontSize: typography.caption.fontSize,
        color: colors.textSecondary,
        flex: 1,
    },
    hostName: {
        color: colors.textPrimary,
        fontWeight: "600",
    },
    manageButton: {
        padding: 4,
    },

    /* body */
    body: {
        flexDirection: "row",
        gap: 10,
    },

    /* date badge */
    dateBadge: {
        width: 48,
        height: 48,
        borderRadius: radius.sm,
        backgroundColor: colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        alignItems: "center",
        justifyContent: "center",
    },
    month: {
        fontSize: typography.badge.fontSize,
        color: colors.accentBlue,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    day: {
        fontSize: 15,
        color: colors.textPrimary,
        fontWeight: "600",
    },

    /* info */
    info: {
        flex: 1,
        minWidth: 0,
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 6,
    },
    title: {
        fontSize: typography.body.fontSize,
        fontWeight: "600",
        color: colors.textPrimary,
        flexShrink: 1,
    },
    difficultyBadge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: radius.full,
    },
    difficultyText: {
        fontSize: typography.badge.fontSize,
        fontWeight: "600",
    },

    /* data */
    dataRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
    },
    dataText: {
        fontSize: typography.caption.fontSize,
        color: colors.textSecondary,
    },

    /* footer */
    footerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
    },
    rsvpCount: {
        fontSize: typography.caption.fontSize,
        color: colors.textSecondary,
    },

    /* RSVP pill */
    pill: {
        borderWidth: 1.5,
        borderColor: colors.accentBlue,
        borderRadius: radius.full,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    pillActive: {
        backgroundColor: colors.accentBlue,
    },
    pillDisabled: {
        borderColor: colors.borderSubtle,
        backgroundColor: "transparent",
    },
    pillText: {
        fontSize: typography.caption.fontSize,
        fontWeight: "600",
        color: colors.accentBlue,
    },
    pillTextActive: {
        color: "#FFFFFF",
    },
    pillTextDisabled: {
        color: colors.textTertiary,
    },
});
