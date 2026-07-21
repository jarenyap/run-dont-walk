import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/Auth";
import { createClan } from "../../../services/clanService";

export default function CreateClanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    setSubmitting(true);
    try {
      const clanId = await createClan(user.uid, name.trim(), description.trim(), isPrivate);
      router.replace(`/clan/${clanId}`);
    } catch (e) {
      Alert.alert("Error", "Could not create clan. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelBtn}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Clan</Text>
        <TouchableOpacity
          style={[styles.createBtn, !name.trim() && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={!name.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.createBtnText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Clan Name</Text>
          <Text style={styles.counter}>{name.length}/40</Text>
        </View>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(t) => setName(t.slice(0, 40))}
          placeholder="e.g. Kent Ridge Runners"
          placeholderTextColor="#8E8E93"
          maxLength={40}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="What's your clan about?"
          placeholderTextColor="#8E8E93"
          multiline
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Visibility</Text>
        <View style={styles.visibilityRow}>
          <TouchableOpacity
            style={[styles.visCard, !isPrivate && styles.visCardSelected]}
            onPress={() => setIsPrivate(false)}
          >
            <Text style={styles.visIcon}>🌐</Text>
            <Text style={styles.visLabel}>Public</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.visCard, isPrivate && styles.visCardSelected]}
            onPress={() => setIsPrivate(true)}
          >
            <Text style={styles.visIcon}>🔒</Text>
            <Text style={styles.visLabel}>Private</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
  },
  cancelBtn: { color: "#8E8E93", fontSize: 15 },
  headerTitle: { color: "#1A1A1A", fontSize: 17, fontWeight: "600" },
  createBtn: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 64,
    alignItems: "center",
  },
  createBtnDisabled: { backgroundColor: "#D1D1D6" },
  createBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  field: { marginBottom: 20 },
  labelRow: { flexDirection: "row", justifyContent: "space-between" },
  label: { color: "#8E8E93", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  counter: { color: "#8E8E93", fontSize: 12 },
  input: {
    backgroundColor: "#F5F5F0",
    borderRadius: 12,
    padding: 14,
    color: "#1A1A1A",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E0E0DC",
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  visibilityRow: { flexDirection: "row", gap: 12 },
  visCard: {
    flex: 1,
    backgroundColor: "#F5F5F0",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0DC",
  },
  visCardSelected: { borderColor: "#FF6B35", backgroundColor: "#FF6B3522" },
  visIcon: { fontSize: 24, marginBottom: 6 },
  visLabel: { color: "#1A1A1A", fontSize: 14, fontWeight: "600" },
});