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
import { Globe, LockSimple, Camera } from "phosphor-react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../../context/Auth";
import { createClan, uploadClanBanner } from "../../../services/clanService";
import UserAvatar from "../../../components/UserAvatar";
import { colors, spacing, radius } from "../../../theme";

export default function CreateClanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickBanner = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Please enable camera roll permissions."
      );
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
    }
  };

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    setSubmitting(true);
    try {
      const clanId = await createClan(
        user.uid,
        name.trim(),
        description.trim(),
        isPrivate
      );

      if (bannerUri) {
        const url = await uploadClanBanner(clanId, bannerUri);
        const { updateClanDetails } = await import(
          "../../../services/clanService"
        );
        await updateClanDetails(clanId, { bannerUrl: url });
      }

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

      <TouchableOpacity style={styles.bannerArea} onPress={pickBanner}>
        <UserAvatar
          uri={bannerUri}
          name={name || "?"}
          size={80}
          shape="rounded"
        />
        <View style={styles.bannerHint}>
          <Camera size={16} color={colors.accentBlue} />
          <Text style={styles.bannerHintText}>
            {bannerUri ? "Change banner" : "Add clan banner"}
          </Text>
        </View>
      </TouchableOpacity>

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
          placeholderTextColor={colors.textTertiary}
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
          placeholderTextColor={colors.textTertiary}
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
            <Globe
              size={24}
              color={!isPrivate ? colors.accentBlue : colors.textTertiary}
            />
            <Text style={styles.visLabel}>Public</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.visCard, isPrivate && styles.visCardSelected]}
            onPress={() => setIsPrivate(true)}
          >
            <LockSimple
              size={24}
              color={isPrivate ? colors.accentBlue : colors.textTertiary}
            />
            <Text style={styles.visLabel}>Private</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacing.md,
  },
  cancelBtn: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "600",
  },
  createBtn: {
    backgroundColor: colors.accentBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    minWidth: 64,
    alignItems: "center",
  },
  createBtnDisabled: {
    backgroundColor: colors.bgInput,
  },
  createBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  bannerArea: {
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  bannerHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bannerHintText: {
    color: colors.accentBlue,
    fontSize: 13,
    fontWeight: "500",
  },
  field: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  counter: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  visibilityRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  visCard: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.borderDefault,
    gap: spacing.sm,
  },
  visCardSelected: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.bgSurface,
  },
  visLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});
