import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MapPinIcon, DotsThreeVerticalIcon } from "phosphor-react-native";
import UserAvatar from "./UserAvatar";
import { Event } from "../types/index";

const DIFFICULTY_COLORS: Record<Event["difficulty"],  { bg: string; text: string }> = {
  easy: { bg: "#E8F7EC", text: "#1E8A3C" },
  moderate: { bg: "#FFF1E0", text: "#B8630A" },
  hard: { bg: "#FEE2E2", text: "#991B1B" },
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
    event, rsvped, full, past, canManage, isCreator, onToggleRSVP, onManage
}: EventCardProps) {
    const difficulty = DIFFICULTY_COLORS[event.difficulty];
    const scheduled = event.scheduledAt.toDate();

    return (
        <View style={styles.card}>
            <View style={styles.hostRow}>
                <UserAvatar uri={event.creatorAvatarUrl} size={20} name={event.creatorName} />
                <Text style={styles.hostText}>
                    Hosted by <Text style={styles.hostName}>{isCreator ? "You" : event.creatorName}</Text>
                </Text>
                {canManage && onManage && (
                    <TouchableOpacity style={styles.manageButton} onPress={onManage}>
                        <DotsThreeVerticalIcon size={16} color="#8E8E93" weight="bold" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.body}>
                <View style={styles.dataBadge}>
                    <Text style={styles.month}>{scheduled.toLocaleString("en-GB", { month: "short" })}</Text>
                    <Text style={styles.day}>{scheduled.getDate()}</Text>
                </View>

                <View style={styles.info}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title} numberOfLines={1}>
                            {event.title}
                        </Text>
                        <View style={[styles.difficultyBadge, { backgroundColor: difficulty.bg }]}>
                            <Text style={[styles.difficultyText, { color: difficulty.text }]}>
                                {event.difficulty[0].toUpperCase() + event.difficulty.slice(1)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.dataRow}>
                        <MapPinIcon size={12} color="#8E8E93" />
                        <Text style={styles.dataText}>
                            {event.location} | {scheduled.toLocaleString("en-GB", { hour: "numeric", minute: "2-digit" })} | {event.distance}km
                        </Text>
                    </View>

                    <View style={styles.footerRow}>
                        <Text style={styles.rsvpedCount}>
                            {event.rsvpIds.length}{event.maxParticipants > 0 ? `/${event.maxParticipants}` : ""} going
                        </Text>
                        <TouchableOpacity style={[
                            styles.rsvpTablet,
                            rsvped && styles.rsvpedTabletGoing,
                            (past || (full && !rsvped) || isCreator) && styles.rsvpedTabletDisabled,
                        ]}
                        onPress={onToggleRSVP}
                        disabled={past || (full && !rsvped) || isCreator}
                        >
                            <Text style={[styles.rsvpText, rsvped && styles.rsvpTextGoing]}>
                                {isCreator ? "Hosting"
                                    : past
                                    ? (event.completedAt ? "Completed" : "Ended")
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

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#F5F5F0",
        borderWidth: 1,
        borderColor: "#E0E0DC",
        borderRadius: 12,
        padding: 12,
        marginBottom: 10
    },
    hostRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 10,
    },
    hostText: {
        fontSize: 11,
        color: "#8E8E93",
        flex: 1,
    },
    hostName: {
        color: "#1A1A1A",
        fontWeight: "600",
    },
    manageButton: {
        padding: 4,
    },
    body: {
        flexDirection: "row",
        gap: 10
    },
    dataBadge: {
        width: 42,
        height: 42,
        borderRadius: 10,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E0E0DC",
        alignItems: "center",
        justifyContent: "center"
    },
    month: {
        fontSize: 9,
        color: "#FF6B35",
        fontWeight: "600",
        textTransform: "uppercase"
    },
    day: {
        fontSize: 15,
        color: "#1A1A1A",
        fontWeight: "600"
    },
    info: {
        flex: 1,
        minWidth: 0
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 6
    },
    title: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1A1A1A",
        flexShrink: 1
    },
    difficultyBadge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 99,
    },
    difficultyText: {
        fontSize: 10,
        fontWeight: "600"
    },
    dataRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4
    },
    dataText: {
        fontSize: 11,
        color: "#8E8E93"
    },
    footerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10
    },
    rsvpedCount: {
        fontSize: 11,
        color: "#8E8E93"
    },
    rsvpTablet: {
        borderWidth: 1,
        borderColor: "#FF6B35",
        borderRadius: 99,
        paddingHorizontal: 12,
        paddingVertical: 12
    },
    rsvpedTabletGoing: {
        backgroundColor: "#FF6B35"
    },
    rsvpedTabletDisabled: {
        borderColor: "#D1D1D6",
        backgroundColor: "#FF6B35",
    },
    rsvpText: {
        color: "#FFFFFF"
    },
    rsvpTextGoing: {
        color: "#FFFFFF"
    }
});
