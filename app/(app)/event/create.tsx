import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Timestamp } from "firebase/firestore";
import { MapPinIcon, MinusIcon, PlusIcon } from "phosphor-react-native";
import { useAuth } from "../../../context/Auth";
import { createEvent } from "../../../services/eventService";
import type { EventDifficulty } from "../../../types/index";

const DIFFICULTIES: EventDifficulty[] = ["easy", "moderate", "hard"];

export default function CreateEventScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, profile } = useAuth();
    const [title, setTitle] = useState("");
    const [location, setLocation] = useState("");
    const [scheduledAt, setScheduledAt] = useState(new Date(Date.now() + 60 * 60 * 1000));
    const [picked, setPicked] = useState(false);
    const [distance, setDistance] = useState("");
    const [maxParticipants, setMaxParticipants] = useState(15);
    const [difficulty, setDifficulty] = useState<EventDifficulty>("moderate");
    const [submitting, setSubmitting] = useState(false);
    
const isValid =
    title.trim() !== "" &&
    location.trim() !== "" &&
    distance.trim() !== "" &&
    !isNaN(Number(distance)) &&
    Number(distance) > 0;

    const creatingEvent = async () => {
        if (!user || !profile || !isValid) return;
        setSubmitting(true);
        try {
            await createEvent(user.uid, profile.name, profile.avatarUrl, {
            title: title.trim(),
            location: location.trim(),
            distance: Number(distance),
            difficulty,
            scheduledAt: Timestamp.fromDate(scheduledAt),
            maxParticipants,
        });
        router.back();
        } catch (e) {
            Alert.alert("Error", "Could not create event. Please try again later.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { paddingTop: insets.top + 8 }]} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.cancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create event</Text>
                <TouchableOpacity
                    style={[styles.createButton, !isValid && styles.createButtonDisabled]}
                    onPress={creatingEvent}
                    disabled={!isValid || submitting}
                >
                {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.createButtonText}>Create event</Text>}
                </TouchableOpacity>
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Event title</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Enter event title"
                    placeholderTextColor="#8E8E93"
                    maxLength={60}
                />
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Starting location</Text>
                <View style={styles.locationRow}>
                    <MapPinIcon size={16} color="#8E8E93" />
                    <TextInput
                        style={styles.locationRowText}
                        value={location}
                        onChangeText={setLocation}
                        placeholder="Enter starting location"
                        placeholderTextColor="#8E8E93"
                    />
                </View>
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Date & time</Text>
                <TouchableOpacity style={styles.input} onPress={() => setPicked(true)}>
                    <Text style={{ color: "#1A1A1A" }}>
                        {scheduledAt.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                    </Text>
                </TouchableOpacity>
                {picked && (
                    <View style={styles.pickerWrapper}>
                        <DateTimePicker
                            value={scheduledAt}
                            mode="datetime"
                            minimumDate={new Date()}
                            onChange={(event, date) => {
                                setPicked(false);
                                if (date) setScheduledAt(date);
                            }}
                        />
                    </View>
                )}
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Distance (km)</Text>
                <TextInput
                    style={styles.field}
                    value={distance}
                    onChangeText={(text) => {
                        const num = text.replace(/[^0-9.]/g, "");
                        setDistance(num);
                    }}
                    placeholder="Enter distance in km"
                    placeholderTextColor="#8E8E93"
                    keyboardType="decimal-pad"
                />
            </View>

            <View style={styles.stepperField}>
                <Text style={styles.label}>Max participants</Text>
                <View style={styles.stepper}>
                    <TouchableOpacity onPress={() => setMaxParticipants((prev) => Math.max(0, prev - 1))}>
                        <MinusIcon size={16} color="#8E8E93" />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{maxParticipants === 0 ? "No limit" : maxParticipants}</Text>
                    <TouchableOpacity onPress={() => setMaxParticipants((prev) => prev + 1)}>
                        <PlusIcon size={16} color="#FF6B35" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Difficulty</Text>
                <View style={styles.difficultyRow}>
                    {DIFFICULTIES.map((diff) => (
                        <TouchableOpacity key={diff} style={[styles.difficultyCard, difficulty === diff && styles.difficultyCardSelected]} onPress={() => setDifficulty(diff)}>
                            <Text style={[styles.difficultyCardText, difficulty === diff && styles.difficultyCardTextSelected]}>{diff[0].toUpperCase() + diff.slice(1)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF"
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 40
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 16
    },
    cancelButton: {
        color: "#8E8E93",
        fontSize: 16
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1A1A1A"
    },
    createButton: {
        backgroundColor: "#FF6B35",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        minWidth: 64,
        alignItems: "center"
    },
    createButtonDisabled: {
        backgroundColor: "#D1D1D6"
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF"
    },
    pickerWrapper: {
        marginTop: 12,
        backgroundColor: "#FFFFFF"
    },
    field: {
        marginBottom: 20
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#8E8E93",
        marginBottom: 8
    },
    input: {
        fontSize: 16,
        color: "#1A1A1A",   
        backgroundColor: "#F5F5F0",
        padding: 14,
        borderRadius: 12,
        borderColor: "#E0E0DC"
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#F5F5F0",
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E0E0DC"
    },
    locationRowText: {
        flex: 1,
        fontSize: 16,
        color: "#1A1A1A",
        paddingVertical: 14
    },
    stepperField: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20
    },
    stepper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        backgroundColor: "#F5F5F0",
        borderWidth: 1,
        borderColor: "#E0E0DC",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10
    },
    stepperValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1A1A1A",
        minWidth: 56,
        textAlign: "center"
    },
    difficultyRow: {
        flexDirection: "row",
        gap: 8
    },
    difficultyCard: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E0E0DC",
        backgroundColor: "#F5F5F0"
    },
    difficultyCardSelected: {
        backgroundColor: "#FF6B3522",
        borderColor: "#FF6B35"
    },
    difficultyCardText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#8E8E93"
    },
    difficultyCardTextSelected: {
        color: "#B8460F"
    }
});