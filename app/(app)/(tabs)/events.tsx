import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal } from "react-native";
import React, { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PlusIcon } from "phosphor-react-native";
import { useAuth } from "../../../context/Auth";
import { useEvents } from "../../../hooks/useEvents";
import { rsvpEvent, cancelRsvp, deleteEvent, eventCompleted, rsvped, eventFull, canManage } from "../../../services/eventService";
import EventCard from "../../../components/EventCard";
import type { Event } from "../../../types/index";

export default function EventsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, profile } = useAuth();
    const [mode, setMode] = useState<"rsvped" | "discover">("rsvped");
    const [period, setPeriod] = useState<"upcoming" | "past">("upcoming");
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const { loading, error, upcomingEvents, pastEvents } = useEvents(user?.uid, profile?.followingIds ?? [], mode);
    const ls = period === "upcoming" ? upcomingEvents : pastEvents;

    const toggleRSVP = async (event: Event) => {
        if (!user) return;
        try {
            rsvped(event, user.uid) ? await cancelRsvp(event.id, user.uid) 
            : await rsvpEvent(event.id, user.uid);
        } catch (e) {
            Alert.alert("Could not RSVP:", e instanceof Error ? e.message : "Please try again later.");
        }
    };

    const toggleDelete = (event: Event) => {
        setSelectedEvent(null);
        Alert.alert("Delete Event", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive",
                onPress: async () => {
                    try {
                        await deleteEvent(event, user!.uid);
                    } catch (e) {
                        Alert.alert("Error", "Could not delete event.");
                        throw e;
                    }
                }
            },
        ]);
    };

    const toggleComplete = (event: Event) => {
        setSelectedEvent(null);
        Alert.alert("Mark as Completed", "This event will move to Past and can no longer be joined.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Complete",
                onPress: async () => {
                    try {
                        await eventCompleted(event, user!.uid);
                    } catch (e) {
                        Alert.alert("Could not complete event:", e instanceof Error ? e.message : "Please try again later.");
                        throw e;
                    }
                },
            },
        ]);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Events</Text>
                    <Text style={styles.subtitle}>
                        {mode === "discover" ? "From runners you follow" : "Events you're attending"}
                    </Text>
                </View>
                <TouchableOpacity style={styles.createButton} onPress={() => router.push("/event/create")}>
                    <PlusIcon size={18} color="#FFFFFF" weight="bold" />
                </TouchableOpacity>
            </View>

            <View style={styles.segmented}>
                {(["discover", "rsvped"] as const).map((m) => (
                    <TouchableOpacity
                        key={m}
                        style={[styles.segment, mode === m && styles.segmentActive]}
                        onPress={() => setMode(m)}
                    >
                        <Text style={[styles.segmentText, mode === m && styles.activeSegmentText]}>
                            {m === "discover" ? "Discover" : "Going"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.periodRow}>
                {(["upcoming", "past"] as const).map((p) => (
                    <TouchableOpacity key={p} onPress={() => setPeriod(p)}>
                        <Text style={[styles.periodText, period === p && styles.activePeriodText]}>
                            {p === "upcoming" ? "Upcoming" : "Past"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color="#FF6B35" />
            ) : (
                <FlatList
                    data={ls}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <EventCard
                            event={item}
                            rsvped={user ? rsvped(item, user.uid) : false}
                            full={eventFull(item)}
                            past={period === "past"}
                            isCreator={item.creatorId === user?.uid}
                            canManage={user ? canManage(item, user.uid) : false}
                            onToggleRSVP={() => toggleRSVP(item)}
                            onManage={period === "past" ? () => setSelectedEvent(item) : undefined}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>
                                {mode === "rsvped" ? "No events found" : "No events to discover"}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {mode === "rsvped" ? "No runs upcoming!" : "Follow more runners or create your own run!"}
                            </Text>
                        </View>
                    }
                />
            )}
            {error && <Text style={styles.errorText}>Error: {error}</Text>}

            {selectedEvent && (
                <Modal
                    visible transparent animationType="fade" onRequestClose={() => setSelectedEvent(null)}>
                        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setSelectedEvent(null)}>
                            <View style={styles.sheetCard}>
                                {!selectedEvent.completedAt && (
                                    <TouchableOpacity style={styles.sheetOption} onPress={() => toggleComplete(selectedEvent)}>
                                        <Text style={styles.sheetOptionText}>Mark as completed</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={styles.sheetOption} onPress={() => toggleDelete(selectedEvent)}>
                                    <Text style={[styles.sheetOptionText, { color: "#FF3B30" }]}>Delete Event</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.sheetOption, styles.sheetCancel]} onPress={() => setSelectedEvent(null)}>
                                    <Text style={styles.sheetCancelText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Modal>
                )}
            </View>
        );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF"
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    subtitle: {
        fontSize: 12,
        fontWeight: "700",
        color: "#1A1A1A"
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    createButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#5F19FF",
        alignItems: "center",
        justifyContent: "center",
    },
    segmented: {
        flexDirection: "row",
        marginHorizontal: 16,
        backgroundColor: "#F5F5F0",
        borderRadius: 10,
        padding: 4,
        marginBottom: 10
    },
    segment: {
        flex: 1,
        paddingVertical: 8,
        alignItems: "center",
        borderRadius: 8
    },
    segmentActive: {
        backgroundColor: "#FF6B35",
    },
    segmentText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#8E8E93"
    },
    activeSegmentText: {
        color: "#FFFFFF"
    },
    periodRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 8,
        paddingHorizontal: 16,
        marginBottom: 8
    },
    periodText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#8E8E93",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 99
    },
    activePeriodText: {
        backgroundColor: "#FF6B3522",
        color: "#B8460F"
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24
    },
    emptyState: {
        alignItems: "center",
        marginTop: 60,
        paddingHorizontal: 32
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1A1A1A",
        textAlign: "center"
    },
    emptySubtitle: {
        fontSize: 12,
        color: "#8E8E93",
        textAlign: "center",
        marginTop: 6
    },
    errorText: {
        fontSize: 12,
        color: "#FF3B30",
        textAlign: "center",
        marginBottom: 8
    },
    sheetOverlay: {
        flex: 1,
        backgroundColor: "#00000066",
        justifyContent: "flex-end"
    },
    sheetCard: {
        backgroundColor: "#FFFFFF",
        padding: 20,
        paddingBottom: 32,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20
    },
    sheetOption: {
        paddingVertical: 14,
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#F2F2F7"
    },
    sheetOptionText: {
        fontSize: 16,
        color: "#0A84FF"
    },
    sheetCancel: {
        marginTop: 8
    },
    sheetCancelText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FF3B30"
    }
});