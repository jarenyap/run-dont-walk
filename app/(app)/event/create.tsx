import React, { useState } from "react";
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    Alert, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Timestamp } from "firebase/firestore";
import { MapPinIcon, MinusIcon, PlusIcon } from "phosphor-react-native";
import { useAuth } from "../../../context/Auth";
import { createEvent } from "../../../services/eventService";
import type { EventDifficulty, Region } from "../../../types/index";
import { colors, spacing, radius, typography } from "../../../theme";

const DIFFICULTIES: EventDifficulty[] = ["easy", "moderate", "hard"];
const REGIONS: Region[] = ["Central", "North", "South", "East", "West"];

export default function CreateEventScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, profile } = useAuth();

    const [title, setTitle] = useState("");
    const [location, setLocation] = useState("");
    const [scheduledAt, setScheduledAt] = useState(
        new Date(Date.now() + 60 * 60 * 1000)
    );
    const [picked, setPicked] = useState(false);
    const [distance, setDistance] = useState("");
    const [maxParticipants, setMaxParticipants] = useState(15);
    const [difficulty, setDifficulty] = useState<EventDifficulty>("moderate");
    const [region, setRegion] = useState<Region | null>(null);
    const [description, setDescription] = useState("");
    const [routeDescription, setRouteDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const isValid =
        title.trim() !== "" &&
        location.trim() !== "" &&
        distance.trim() !== "" &&
        !isNaN(Number(distance)) &&
        Number(distance) > 0 &&
        region !== null;

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
                region: region!,
                description: description.trim() || null,
                routeDescription: routeDescription.trim() || null,
                organizerClanId: null,
            });
            router.back();
        } catch (_e) {
            Alert.alert(
                "Error",
                "Could not create event. Please try again later."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                style={[
                    s.container,
                    { paddingTop: insets.top + spacing.sm },
                ]}
                contentContainerStyle={s.content}
                keyboardShouldPersistTaps="handled"
            >
                {/* header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={s.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Create Run Event</Text>
                    <TouchableOpacity
                        style={[
                            s.headerCreate,
                            !isValid && s.headerCreateDisabled,
                        ]}
                        onPress={creatingEvent}
                        disabled={!isValid || submitting}
                    >
                        <Text
                            style={[
                                s.headerCreateText,
                                !isValid && s.headerCreateTextDisabled,
                            ]}
                        >
                            Create
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* title */}
                <View style={s.field}>
                    <Text style={s.label}>Event title</Text>
                    <TextInput
                        style={s.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Enter event title"
                        placeholderTextColor={colors.textTertiary}
                        maxLength={60}
                    />
                </View>

                {/* location */}
                <View style={s.field}>
                    <Text style={s.label}>Starting location</Text>
                    <View style={s.locationRow}>
                        <MapPinIcon
                            size={16}
                            color={colors.textTertiary}
                        />
                        <TextInput
                            style={s.locationInput}
                            value={location}
                            onChangeText={setLocation}
                            placeholder="Enter starting location"
                            placeholderTextColor={colors.textTertiary}
                        />
                    </View>
                </View>

                {/* date & time */}
                <View style={s.field}>
                    <Text style={s.label}>Date & time</Text>
                    <TouchableOpacity
                        style={s.input}
                        onPress={() => setPicked(true)}
                    >
                        <Text style={s.inputText}>
                            {scheduledAt.toLocaleString("en-GB", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                hour: "numeric",
                                minute: "2-digit",
                            })}
                        </Text>
                    </TouchableOpacity>
                    {picked && (
                        <View style={s.pickerWrapper}>
                            <DateTimePicker
                                value={scheduledAt}
                                mode="datetime"
                                minimumDate={new Date()}
                                onChange={(_event, date) => {
                                    setPicked(false);
                                    if (date) setScheduledAt(date);
                                }}
                            />
                        </View>
                    )}
                </View>

                {/* distance */}
                <View style={s.field}>
                    <Text style={s.label}>Distance (km)</Text>
                    <TextInput
                        style={s.input}
                        value={distance}
                        onChangeText={(text) =>
                            setDistance(text.replace(/[^0-9.]/g, ""))
                        }
                        placeholder="Enter distance in km"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="decimal-pad"
                    />
                </View>

                {/* max participants stepper */}
                <View style={s.stepperField}>
                    <Text style={s.label}>Max participants</Text>
                    <View style={s.stepper}>
                        <TouchableOpacity
                            onPress={() =>
                                setMaxParticipants((prev) =>
                                    Math.max(0, prev - 1)
                                )
                            }
                        >
                            <MinusIcon
                                size={16}
                                color={colors.textTertiary}
                            />
                        </TouchableOpacity>
                        <Text style={s.stepperValue}>
                            {maxParticipants === 0
                                ? "No limit"
                                : maxParticipants}
                        </Text>
                        <TouchableOpacity
                            onPress={() =>
                                setMaxParticipants((prev) => prev + 1)
                            }
                        >
                            <PlusIcon
                                size={16}
                                color={colors.accentBlue}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* region */}
                <View style={s.field}>
                    <Text style={s.label}>Region</Text>
                    <View style={s.regionRow}>
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
                                        region === r &&
                                            s.regionChipTextActive,
                                    ]}
                                >
                                    {r}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* difficulty */}
                <View style={s.field}>
                    <Text style={s.label}>Difficulty</Text>
                    <View style={s.difficultyRow}>
                        {DIFFICULTIES.map((d) => (
                            <TouchableOpacity
                                key={d}
                                style={[
                                    s.difficultyCard,
                                    difficulty === d &&
                                        s.difficultyCardActive,
                                ]}
                                onPress={() => setDifficulty(d)}
                            >
                                <Text
                                    style={[
                                        s.difficultyText,
                                        difficulty === d &&
                                            s.difficultyTextActive,
                                    ]}
                                >
                                    {d[0].toUpperCase() + d.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* description */}
                <View style={s.field}>
                    <Text style={s.label}>Description (optional)</Text>
                    <TextInput
                        style={[s.input, s.textarea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Describe the route, pace, or vibe"
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </View>

                {/* route description */}
                <View style={[s.field, { marginBottom: spacing.xl }]}>
                    <Text style={s.label}>
                        Route directions (optional)
                    </Text>
                    <View style={s.locationRow}>
                        <MapPinIcon
                            size={16}
                            color={colors.textTertiary}
                        />
                        <TextInput
                            style={s.locationInput}
                            value={routeDescription}
                            onChangeText={setRouteDescription}
                            placeholder="e.g. Meet at MRT Exit A, run around the reservoir"
                            placeholderTextColor={colors.textTertiary}
                        />
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
    },
    content: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing["2xl"],
    },

    /* header */
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: spacing.md,
    },
    cancelText: {
        fontSize: typography.body.fontSize,
        color: colors.accentBlue,
    },
    headerTitle: {
        fontSize: typography.title.fontSize,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    headerCreate: {
        backgroundColor: colors.accentBlue,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: radius.sm,
        alignItems: "center",
        minWidth: 64,
    },
    headerCreateDisabled: {
        backgroundColor: colors.borderDefault,
    },
    headerCreateText: {
        fontSize: typography.body.fontSize,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    headerCreateTextDisabled: {
        color: colors.textTertiary,
    },

    /* fields */
    field: {
        marginBottom: 20,
    },
    label: {
        fontSize: typography.caption.fontSize,
        fontWeight: "600",
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    input: {
        fontSize: typography.body.fontSize,
        color: colors.textPrimary,
        backgroundColor: colors.bgInput,
        padding: 14,
        borderRadius: radius.sm,
        borderColor: colors.borderDefault,
        borderWidth: 1,
    },
    inputText: {
        fontSize: typography.body.fontSize,
        color: colors.textPrimary,
    },
    textarea: {
        minHeight: 80,
        paddingTop: 14,
    },

    /* location */
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        backgroundColor: colors.bgInput,
        paddingHorizontal: 14,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderDefault,
    },
    locationInput: {
        flex: 1,
        fontSize: typography.body.fontSize,
        color: colors.textPrimary,
        paddingVertical: 14,
    },

    /* picker */
    pickerWrapper: {
        marginTop: 12,
        backgroundColor: colors.bgSurface,
    },

    /* stepper */
    stepperField: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },
    stepper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.xs,
        backgroundColor: colors.bgInput,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        borderRadius: radius.sm,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    stepperValue: {
        fontSize: typography.body.fontSize,
        fontWeight: "600",
        color: colors.textPrimary,
        minWidth: 56,
        textAlign: "center",
    },

    /* region */
    regionRow: {
        flexDirection: "row",
        gap: spacing.xs,
    },
    regionChip: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 10,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        backgroundColor: colors.bgInput,
    },
    regionChipActive: {
        backgroundColor: colors.accentBlue,
        borderColor: colors.accentBlue,
    },
    regionChipText: {
        fontSize: typography.caption.fontSize,
        fontWeight: "600",
        color: colors.textSecondary,
    },
    regionChipTextActive: {
        color: "#FFFFFF",
    },

    /* difficulty */
    difficultyRow: {
        flexDirection: "row",
        gap: spacing.xs,
    },
    difficultyCard: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 12,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        backgroundColor: colors.bgInput,
    },
    difficultyCardActive: {
        backgroundColor: colors.accentBlue,
        borderColor: colors.accentBlue,
    },
    difficultyText: {
        fontSize: typography.body.fontSize,
        fontWeight: "600",
        color: colors.textSecondary,
    },
    difficultyTextActive: {
        color: "#FFFFFF",
    },
});
