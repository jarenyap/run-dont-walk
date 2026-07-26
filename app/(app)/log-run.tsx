import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { RunType, NewRun } from "../../types/index";
import { logRun } from "../../services/runService";
import { useAuth } from "../../context/Auth";
import { colors, spacing, radius, typography, runTypeColors } from "../../theme";

const WORKOUT_TYPES: { label: string; value: RunType }[] = [
  { label: "Easy", value: "easy" },
  { label: "Tempo", value: "tempo" },
  { label: "Long", value: "long" },
  { label: "Race", value: "race" },
];

export default function LogRun() {
  const [title, setTitle] = useState("");
  const [distance, setDistance] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [selectedType, setSelectedType] = useState<RunType>("easy");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();

  const isValid =
    title.trim() !== "" &&
    distance.trim() !== "" &&
    !isNaN(Number(distance)) &&
    Number(distance) > 0;

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Not Authenticated", "Please log in to log a run.");
      return;
    }
    if (!profile) {
      Alert.alert(
        "Profile Unavailable",
        "Your profile is still loading. Please try again."
      );
      return;
    }
    if (!isValid) {
      Alert.alert(
        "Invalid Input",
        "Please enter a valid distance in kilometers."
      );
      return;
    }
    setLoading(true);
    try {
      const newRun: NewRun = {
        userId: user.uid,
        authorName: profile.name,
        authorAvatarUrl: profile.avatarUrl,
        title: title.trim(),
        distance: Number(distance),
        duration: `${hours || "0"}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`,
        type: selectedType,
        notes: notes.trim(),
      };
      await logRun(newRun);
      router.back();
    } catch (e) {
      Alert.alert("Error", "Could not save run. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Morning Run"
          placeholderTextColor={colors.textTertiary}
          returnKeyType="next"
        />

        <Text style={styles.label}>Distance (km)</Text>
        <View style={styles.distanceRow}>
          <TextInput
            style={[styles.input, styles.distanceInput]}
            value={distance}
            onChangeText={(text) => {
              const sanitised =
                text.match(/^\d*\.?\d{0,2}/)?.[0] ?? "";
              setDistance(sanitised);
            }}
            placeholder="e.g. 5.67"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            returnKeyType="next"
          />
          <Text style={styles.kmLabel}>km</Text>
        </View>

        <Text style={styles.label}>Duration</Text>
        <View style={styles.durationRow}>
          <TextInput
            style={[styles.input, styles.durationInput]}
            value={hours}
            onChangeText={setHours}
            placeholder="Hrs"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            maxLength={2}
          />
          <Text style={styles.durationSeparator}>:</Text>
          <TextInput
            style={[styles.input, styles.durationInput]}
            value={minutes}
            onChangeText={(text) => {
              const num = text.replace(/[^0-9]/g, "");
              if (num === "" || Number(num) <= 59) setMinutes(num);
            }}
            placeholder="Min"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            maxLength={2}
          />
          <Text style={styles.durationSeparator}>:</Text>
          <TextInput
            style={[styles.input, styles.durationInput]}
            value={seconds}
            onChangeText={(text) => {
              const num = text.replace(/[^0-9]/g, "");
              if (num === "" || Number(num) <= 59) setSeconds(num);
            }}
            placeholder="Sec"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>

        <Text style={styles.label}>Run Type</Text>
        <View style={styles.typeRow}>
          {WORKOUT_TYPES.map((type) => {
            const isSelected = selectedType === type.value;
            const accent = runTypeColors[type.value] || colors.accentBlue;
            return (
              <Pressable
                key={type.value}
                style={[
                  styles.typeChip,
                  isSelected && {
                    backgroundColor: accent,
                    borderColor: accent,
                  },
                ]}
                onPress={() => setSelectedType(type.value)}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    isSelected && styles.typeChipTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="How'd it feel?"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Pressable
          style={[
            styles.button,
            (!isValid || loading) && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log Run</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  label: {
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  distanceInput: {
    flex: 1,
  },
  kmLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  durationInput: {
    flex: 1,
    textAlign: "center",
  },
  durationSeparator: {
    fontSize: typography.title.fontSize,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  typeChip: {
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  typeChipText: {
    fontSize: typography.body.fontSize,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  typeChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  notesInput: {
    height: 100,
  },
  button: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.accentBlue,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
});
