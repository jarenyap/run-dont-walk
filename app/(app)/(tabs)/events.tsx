import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
    Modal, ScrollView, Animated,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PlusIcon } from "phosphor-react-native";
import { useAuth } from "../../../context/Auth";
import { useEvents } from "../../../hooks/useEvents";
import {
    rsvpEvent, cancelRsvp, deleteEvent, eventCompleted,
    rsvped, eventFull, canManage,
} from "../../../services/eventService";
import EventCard from "../../../components/EventCard";
import type { Event, Region } from "../../../types/index";
import { colors, spacing, radius, typography } from "../../../theme";

const REGIONS = ["All", "Central", "North", "South", "East", "West"] as const;

/* ── shimmer skeleton placeholder ── */
function SkeletonCard() {
    const pulse = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [pulse]);

    const opacity = pulse;
    return (
        <Animated.View style={[s.skeletonCard, { opacity }]}>
            <View style={s.skelTopRow}>
                <View style={[s.skelCircle, { width: 20, height: 20, borderRadius: 10 }]} />
                <View style={[s.skelBar, { width: 120, height: 11 }]} />
            </View>
            <View style={s.skelBody}>
                <View style={[s.skelBox, { width: 48, height: 48 }]} />
                <View style={{ flex: 1, gap: 8 }}>
                    <View style={[s.skelBar, { width: "70%" as any, height: 13 }]} />
                    <View style={[s.skelBar, { width: "90%" as any, height: 11 }]} />
                    <View style={[s.skelBar, { width: 60, height: 28, borderRadius: 99 }]} />
                </View>
            </View>
        </Animated.View>
    );
}

/* ── loading grid ── */
function SkeletonList() {
    return (
        <View style={s.listContent}>
            {[0, 1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
            ))}
        </View>
    );
}

export default function EventsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();

    const [mode, setMode] = useState<"rsvped" | "all">("all");
    const [period, setPeriod] = useState<"upcoming" | "past">("upcoming");
    const [region, setRegion] = useState<Region | "All">("All");
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const { loading, error, upcomingEvents, pastEvents } =
        useEvents(user?.uid, mode, region);
    const ls = period === "upcoming" ? upcomingEvents : pastEvents;

    const toggleRSVP = async (event: Event) => {
        if (!user) return;
        try {
            rsvped(event, user.uid)
                ? await cancelRsvp(event.id, user.uid)
                : await rsvpEvent(event.id, user.uid);
        } catch (e) {
            Alert.alert(
                "Could not RSVP",
                e instanceof Error ? e.message : "Please try again later."
            );
        }
    };

    const toggleDelete = (event: Event) => {
        setSelectedEvent(null);
        Alert.alert("Delete Event", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteEvent(event, user!.uid);
                    } catch (_e) {
                        Alert.alert("Error", "Could not delete event.");
                    }
                },
            },
        ]);
    };

    const toggleComplete = (event: Event) => {
        setSelectedEvent(null);
        Alert.alert(
            "Mark as Completed",
            "This event will move to Past and can no longer be joined.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Complete",
                    onPress: async () => {
                        try {
                            await eventCompleted(event, user!.uid);
                        } catch (e) {
                            Alert.alert(
                                "Could not complete event",
                                e instanceof Error
                                    ? e.message
                                    : "Please try again later."
                            );
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={[s.container, { paddingTop: insets.top + spacing.sm }]}>
            {/* ── header ── */}
            <View style={s.header}>
                <View>
                    <Text style={s.title}>Events</Text>
                    <Text style={s.subtitle}>
                        {mode === "all"
                            ? "Explore upcoming runs"
                            : "Events you're attending"}
                    </Text>
                </View>
                <TouchableOpacity
                    style={s.createButton}
                    onPress={() => router.push("/event/create")}
                >
                    <PlusIcon size={18} color="#FFFFFF" weight="bold" />
                </TouchableOpacity>
            </View>

            {/* ── region chips ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.regionRow}
            >
                {REGIONS.map((r) => (
                    <TouchableOpacity
                        key={r}
                        style={[
                            s.regionChip,
                            region === r && s.regionChipActive,
                        ]}
                        onPress={() => setRegion(r)}
                    >
                        <Text
                            style={[
                                s.regionChipText,
                                region === r && s.regionChipTextActive,
                            ]}
                        >
                            {r}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* ── segmented: All Events / Going ── */}
            <View style={s.segmented}>
                {(["all", "rsvped"] as const).map((m) => (
                    <TouchableOpacity
                        key={m}
                        style={[s.segment, mode === m && s.segmentActive]}
                        onPress={() => setMode(m)}
                    >
                        <Text
                            style={[
                                s.segmentText,
                                mode === m && s.segmentTextActive,
                            ]}
                        >
                            {m === "all" ? "All Events" : "Going"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── period toggle ── */}
            <View style={s.periodRow}>
                {(["upcoming", "past"] as const).map((p) => (
                    <TouchableOpacity key={p} onPress={() => setPeriod(p)}>
                        <Text
                            style={[
                                s.periodText,
                                period === p && s.periodTextActive,
                            ]}
                        >
                            {p === "upcoming" ? "Upcoming" : "Past"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── list / loading / empty ── */}
            {loading ? (
                <SkeletonList />
            ) : (
                <FlatList
                    data={ls}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={s.listContent}
                    renderItem={({ item }) => (
                        <EventCard
                            event={item}
                            rsvped={user ? rsvped(item, user.uid) : false}
                            full={eventFull(item)}
                            past={period === "past"}
                            isCreator={item.creatorId === user?.uid}
                            canManage={
                                user ? canManage(item, user.uid) : false
                            }
                            onToggleRSVP={() => toggleRSVP(item)}
                            onManage={
                                period === "past"
                                    ? () => setSelectedEvent(item)
                                    : undefined
                            }
                        />
                    )}
                    ListEmptyComponent={
                        <View style={s.emptyState}>
                            <Text style={s.emptyTitle}>
                                {mode === "rsvped"
                                    ? "No events found"
                                    : "No upcoming events"}
                            </Text>
                            <Text style={s.emptySubtitle}>
                                {mode === "rsvped"
                                    ? "You haven't RSVPed to any events yet."
                                    : "Create a run event to get started!"}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* ── error banner ── */}
            {error && <Text style={s.errorText}>{error}</Text>}

            {/* ── manage bottom sheet ── */}
            {selectedEvent && (
                <Modal
                    visible
                    transparent
                    animationType="fade"
                    onRequestClose={() => setSelectedEvent(null)}
                >
                    <TouchableOpacity
                        style={s.sheetOverlay}
                        activeOpacity={1}
                        onPress={() => setSelectedEvent(null)}
                    >
                        <View style={s.sheetCard}>
                            {/* drag handle */}
                            <View style={s.sheetHandle} />

                            {!selectedEvent.completedAt && (
                                <TouchableOpacity
                                    style={s.sheetOption}
                                    onPress={() =>
                                        toggleComplete(selectedEvent)
                                    }
                                >
                                    <Text style={s.sheetOptionText}>
                                        Mark as completed
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={s.sheetOption}
                                onPress={() => toggleDelete(selectedEvent)}
                            >
                                <Text style={s.sheetDeleteText}>
                                    Delete Event
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.sheetOption, s.sheetCancel]}
                                onPress={() => setSelectedEvent(null)}
                            >
                                <Text style={s.sheetCancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}
        </View>
    );
}

/* ── styles ── */
const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
    },

    /* header */
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
    },
    title: {
        fontSize: typography.displayMedium.fontSize,
        fontWeight: typography.displayMedium.fontWeight as any,
        color: colors.textPrimary,
    },
    subtitle: {
        fontSize: typography.caption.fontSize,
        fontWeight: "500",
        color: colors.textSecondary,
    },
    createButton: {
        width: 44,
        height: 44,
        borderRadius: radius.full,
        backgroundColor: colors.accentBlue,
        alignItems: "center",
        justifyContent: "center",
    },

    /* region chips */
    regionRow: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
        gap: spacing.xs,
    },
    regionChip: {
        backgroundColor: colors.bgInput,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: radius.full,
    },
    regionChipActive: {
        backgroundColor: colors.accentBlue,
    },
    regionChipText: {
        fontSize: typography.caption.fontSize,
        fontWeight: "600",
        color: colors.textSecondary,
    },
    regionChipTextActive: {
        color: "#FFFFFF",
    },

    /* segmented control */
    segmented: {
        flexDirection: "row",
        marginHorizontal: spacing.md,
        backgroundColor: colors.bgInput,
        borderRadius: radius.sm,
        padding: 3,
        marginBottom: spacing.sm,
    },
    segment: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: "center",
        borderRadius: radius.sm - 1,
    },
    segmentActive: {
        backgroundColor: colors.accentBlue,
    },
    segmentText: {
        color: colors.textSecondary,
        fontSize: typography.caption.fontSize,
        fontWeight: "600",
    },
    segmentTextActive: {
        color: "#FFFFFF",
    },

    /* period toggle */
    periodRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.xs,
    },
    periodText: {
        fontSize: typography.caption.fontSize,
        fontWeight: "600",
        color: colors.textSecondary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.full,
    },
    periodTextActive: {
        backgroundColor: colors.accentBlue,
        color: "#FFFFFF",
    },

    /* list */
    listContent: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
    },

    /* skeleton */
    skeletonCard: {
        backgroundColor: colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    skelTopRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 10,
    },
    skelBody: {
        flexDirection: "row",
        gap: 10,
    },
    skelCircle: {
        backgroundColor: colors.borderDefault,
    },
    skelBox: {
        backgroundColor: colors.borderDefault,
    },
    skelBar: {
        backgroundColor: colors.borderDefault,
        borderRadius: 4,
    },

    /* empty */
    emptyState: {
        alignItems: "center",
        marginTop: 60,
        paddingHorizontal: spacing.xl,
        gap: spacing.sm,
    },
    emptyTitle: {
        fontSize: typography.body.fontSize,
        fontWeight: "600",
        color: colors.textPrimary,
        textAlign: "center",
    },
    emptySubtitle: {
        fontSize: typography.caption.fontSize,
        color: colors.textSecondary,
        textAlign: "center",
    },

    /* error */
    errorText: {
        fontSize: typography.caption.fontSize,
        color: colors.accentCoral,
        textAlign: "center",
        marginBottom: spacing.xs,
    },

    /* bottom sheet */
    sheetOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "flex-end",
    },
    sheetCard: {
        backgroundColor: colors.bgSurface,
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xl,
    },
    sheetHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.borderDefault,
        alignSelf: "center",
        marginBottom: spacing.sm,
    },
    sheetOption: {
        paddingVertical: 14,
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: colors.borderSubtle,
    },
    sheetOptionText: {
        fontSize: typography.body.fontSize,
        color: colors.accentBlue,
    },
    sheetDeleteText: {
        fontSize: typography.body.fontSize,
        color: colors.accentCoral,
    },
    sheetCancel: {
        marginTop: spacing.sm,
    },
    sheetCancelText: {
        fontSize: typography.body.fontSize,
        fontWeight: "600",
        color: colors.textTertiary,
    },
});
