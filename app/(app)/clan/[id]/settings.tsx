import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CaretLeftIcon, Camera } from "phosphor-react-native";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../../../theme";
import { useAuth } from "../../../../context/Auth";
import {
  getClanById,
  updateClanDetails,
  disbandClan,
  deriveClanRole,
  getClanPermissions,
  uploadClanBanner,
} from "../../../../services/clanService";
import UserAvatar from "../../../../components/UserAvatar";
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
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [bannerDirty, setBannerDirty] = useState(false);
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

  const pickBanner = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Needed", "Please enable camera roll permissions.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!res.canceled) {
      setBannerUri(res.assets[0].uri);
      setBannerDirty(true);
    }
  };

  const handleSave = async () => {
    if (!id) return;

    const updates: Record<string, any> = { name, description, isPrivate };

    if (bannerDirty && bannerUri && id) {
      try {
        const url = await uploadClanBanner(id, bannerUri);
        updates.bannerUrl = url;
      } catch (e) {
        console.error("Failed to upload banner:", e);
      }
    }

    await updateClanDetails(id, updates);
    setDirty(false);
    setBannerDirty(false);
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
  const perms = getClanPermissions(role);
  const canDisband = perms.canDisbandClan;
  const canEditClan = perms.canEditClan;

  const isSaveVisible = dirty || bannerDirty;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <CaretLeftIcon size={20} color="#1A1A1A" weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clan Settings</Text>
        <View style={{ width: 20 }} />
      </View>

      {canEditClan && (
        <TouchableOpacity style={styles.bannerSection} onPress={pickBanner}>
          <UserAvatar
            uri={bannerUri ?? clan.bannerUrl}
            name={clan.name}
            size={72}
            shape="rounded"
          />
          <View style={styles.bannerHint}>
            <Camera size={16} color={colors.accentBlue} />
            <Text style={styles.bannerHintText}>
              {bannerUri || clan.bannerUrl ? "Change banner" : "Add banner"}
            </Text>
          </View>
        </TouchableOpacity>
      )}

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
          trackColor={{ false: colors.borderDefault, true: "#003153" }}
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

      {isSaveVisible && (
        <TouchableOpacity style={styles.saveBar} onPress={handleSave}>
          <Text style={styles.saveBarText}>Save Changes</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5", paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
  },
  headerTitle: { color: "#111110", fontSize: 17, fontWeight: "600" },
  bannerSection: {
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  bannerHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bannerHintText: {
    color: "#003153",
    fontSize: 13,
    fontWeight: "500",
  },
  field: { marginBottom: 20 },
  label: { color: "#9E9E9E", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  input: {
    backgroundColor: "#F0EDE8",
    borderRadius: 12,
    padding: 14,
    color: "#111110",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E8E5E0",
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  dangerZone: { marginTop: 12 },
  dangerLabel: { color: "#E62E50", fontSize: 11, fontWeight: "600", marginBottom: 12 },
  disbandBtn: { marginTop: 12, paddingVertical: 12 },
  disbandText: { color: "#E62E50", fontSize: 15, fontWeight: "600" },
  saveBar: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#003153",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBarText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
});
