import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Switch, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CaretLeftIcon } from "phosphor-react-native";
import { useAuth } from "../../../../context/Auth";
import {
  getClanById,
  updateClanDetails,
  disbandClan,
  deriveClanRole,
  getClanPermissions,
} from "../../../../services/clanService";
import type { Clan } from "../../../../types/index";

export default function ClanSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [clan, setClan] = useState<Clan | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  useEffect(() => {
    if (!id) return;
    getClanById(id).then((c) => {
      if (!c) return;
      setClan(c);
      setName(c.name);
      setDescription(c.description);
      setIsPrivate(c.isPrivate);
    });
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    await updateClanDetails(id, { name, description, isPrivate });
    setDirty(false);
    router.back();
  };

  const handleDisband = () => {
    if (!clan || confirmName !== clan.name) {
      Alert.alert("Name mismatch", "Type the exact clan name to confirm.");
      return;
    }
    Alert.alert("Disband Clan", "This action cannot be undone. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disband",
        style: "destructive",
        onPress: async () => {
          await disbandClan(id!);
          router.replace("/(app)/(tabs)/clan");
        },
      },
    ]);
  };

  if (!clan) return null;

  const role = user ? deriveClanRole(clan, user.uid) : null;
  const canDisband = getClanPermissions(role).canDisbandClan;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <CaretLeftIcon size={20} color="#1A1A1A" weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clan Settings</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(t) => {
            setName(t);
            setDirty(true);
          }}
          placeholderTextColor="#8E8E93"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={(t) => {
            setDescription(t);
            setDirty(true);
          }}
          multiline
          placeholderTextColor="#8E8E93"
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Private clan</Text>
        <Switch
          value={isPrivate}
          onValueChange={(v) => {
            setIsPrivate(v);
            setDirty(true);
          }}
          trackColor={{ false: "#D1D1D6", true: "#FF6B35" }}
        />
      </View>

      {canDisband && (
        <View style={styles.dangerZone}>
          <Text style={styles.dangerLabel}>DANGER ZONE</Text>
          <TextInput
            style={styles.input}
            value={confirmName}
            onChangeText={setConfirmName}
            placeholder={`Type "${clan.name}" to confirm`}
            placeholderTextColor="#8E8E93"
          />
          <TouchableOpacity style={styles.disbandBtn} onPress={handleDisband}>
            <Text style={styles.disbandText}>Disband Clan</Text>
          </TouchableOpacity>
        </View>
      )}

      {dirty && (
        <TouchableOpacity style={styles.saveBar} onPress={handleSave}>
          <Text style={styles.saveBarText}>Save Changes</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
  },
  headerTitle: { color: "#1A1A1A", fontSize: 17, fontWeight: "600" },
  field: { marginBottom: 20 },
  label: { color: "#8E8E93", fontSize: 13, fontWeight: "600", marginBottom: 8 },
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  dangerZone: { marginTop: 12 },
  dangerLabel: { color: "#FF3B30", fontSize: 11, fontWeight: "600", marginBottom: 12 },
  disbandBtn: { marginTop: 12, paddingVertical: 12 },
  disbandText: { color: "#FF3B30", fontSize: 15, fontWeight: "600" },
  saveBar: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#FF6B35",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBarText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
});