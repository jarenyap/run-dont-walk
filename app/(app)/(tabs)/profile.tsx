import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useAuth } from "../../../context/Auth";
import { useUserRuns } from "../../../hooks/useUserRuns";
import RunCard from "../../../components/RunCard";
import UserAvatar from "../../../components/UserAvatar";
import { computePace } from "../../../utils/runUtils";
import * as ImagePicker from "expo-image-picker";
import { uploadAvatar, updateUserProfile } from "../../../services/userService";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import { validateEmail, validatePassword } from "../../../utils/validation";
import StatsDashboard from "../../../components/StatsDashboard";
import { Key, CloudArrowDown, X, Camera } from "phosphor-react-native";
import { exportCSV } from "../../../services/exportService";
import { useModalAction } from "../../../hooks/useModalAction";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius, typography } from "../../../theme";

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const { runs, loading, error } = useUserRuns(profile?.id);
  const insets = useSafeAreaInsets();

  const [EditModeVisibility, setEditModeVisibility] = useState(false);
  const [editName, setEditName] = useState(profile?.name || "");
  const [editBio, setEditBio] = useState(profile?.bio || "");
  const [imageURI, setImageURI] = useState<string | null>(
    profile?.avatarUrl || null
  );
  const [emailEdit, setEmailEdit] = useState(profile?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"none" | "history" | "stats">(
    "history"
  );
  const [exportVisible, setExportVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const bannerAnimation = useRef(new Animated.Value(-80)).current;
  const { close, modalProperty } = useModalAction();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRuns, setSelectedRuns] = useState<Set<string>>(new Set());

  const totalDistance = runs
    .reduce((sum, r) => sum + r.distance, 0)
    .toFixed(2);
  const bestPace =
    runs.length === 0
      ? "--"
      : runs.reduce((best, r) => {
          const pace = computePace(r.duration, r.distance);
          if (best === "--") return pace;
          const toSecs = (p: string) => {
            const [min, sec] = p.replace("/km", "").split(":").map(Number);
            return min * 60 + sec;
          };
          return toSecs(pace) < toSecs(best) ? pace : best;
        }, "--");

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Failed to sign out:", e);
    }
  };

  const openEditMode = () => {
    setEditName(profile?.name ?? "");
    setEditBio(profile?.bio ?? "");
    setImageURI(profile?.avatarUrl ?? null);
    setEmailEdit(profile?.email || "");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setEditModeVisibility(true);
  };

  const selectImage = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Please enable camera roll permissions in your device settings."
      );
    }

    let res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
    });

    if (!res.canceled) {
      setImageURI(res.assets[0].uri);
    }
  };

  const handleSaveChanges = async () => {
    if (!profile || !auth.currentUser) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      return Alert.alert("Invalid Name", "Name cannot be empty.");
    }
    const trimmedEmail = emailEdit.trim();
    const changingEmail = trimmedEmail !== profile.email;
    const changingPass = newPassword.length > 0;

    if (changingEmail && !validateEmail(trimmedEmail)) {
      return Alert.alert("Invalid Email", "Please enter a valid email address.");
    }
    if (changingPass) {
      const pwdError = validatePassword(newPassword);
      if (pwdError) {
        return Alert.alert("Invalid Password", pwdError);
      }
      if (newPassword !== confirmPassword) {
        return Alert.alert(
          "Password Mismatch",
          "New passwords do not match."
        );
      }
    }

    setIsSaving(true);
    try {
      if (changingEmail || changingPass) {
        if (!oldPassword) {
          setIsSaving(false);
          return Alert.alert(
            "Authentication Required",
            "Please enter your current password to change email or password."
          );
        }
        const credential = EmailAuthProvider.credential(
          profile.email,
          oldPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
        if (changingEmail) {
          await updateEmail(auth.currentUser, trimmedEmail);
        }
        if (changingPass) {
          await updatePassword(auth.currentUser, newPassword);
        }
      }
      let finalAvatar = profile.avatarUrl;
      if (imageURI && imageURI != profile.avatarUrl) {
        finalAvatar = await uploadAvatar(profile.id, imageURI);
      }
      await updateUserProfile(profile.id, {
        name: trimmed,
        bio: editBio.trim(),
        avatarUrl: finalAvatar ?? undefined,
        ...(changingEmail && { email: trimmedEmail }),
      });
      setEditModeVisibility(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Success!", "Profile updated successfully.");
    } catch (e: any) {
      console.error(e);
      if (
        e.code === "auth/wrong-password" ||
        e.code === "auth/invalid-credential"
      ) {
        Alert.alert("Error", "Password incorrect.");
      } else {
        Alert.alert("Error", "Failed to update profile. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!exportError) return;
    Animated.timing(bannerAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => dismissError(), 4000);
    return () => clearTimeout(timer);
  }, [exportError]);

  const dismissError = () => {
    Animated.timing(bannerAnimation, {
      toValue: -80,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setExportError(null));
  };

  const handleExportPress = () => {
    if (selectionMode) {
      if (selectedRuns.size === 0) return;
      exportRuns();
    } else {
      setExportVisible(true);
    }
  };

  const exportRuns = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const runsToExport = selectionMode
        ? runs.filter((r) => selectedRuns.has(r.id))
        : runs;
      await exportCSV(runsToExport);
      if (selectionMode) {
        outSelectionMode();
      }
    } catch (e) {
      console.error("Export failed: ", e);
      setExportError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportConfirm = () => close(exportRuns, setExportVisible);

  const toggleRunSelection = (id: string) => {
    setSelectedRuns((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    setSelectedRuns((prev) => {
      const valid = new Set(runs.map((r) => r.id));
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [runs]);

  const inSelectionMode = () => {
    setSelectionMode(true);
    setSelectedRuns(new Set());
  };

  const outSelectionMode = () => {
    setSelectionMode(false);
    setSelectedRuns(new Set());
  };

  const selectAllRuns = () => {
    setSelectedRuns(new Set(runs.map((r) => r.id)));
  };

  const clearSelection = () => {
    setSelectedRuns(new Set());
  };

  return (
    <View style={styles.screen}>
      {exportError && (
        <Animated.View
          style={[
            styles.errorMessage,
            { transform: [{ translateY: bannerAnimation }] },
          ]}
        >
          <Text style={styles.errorMessageText}>{exportError}</Text>
          <Pressable onPress={dismissError} hitSlop={8}>
            <X size={16} color="#fff" weight="bold" />
          </Pressable>
        </Animated.View>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={openEditMode} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>
        </View>

        <View style={styles.avatarContainer}>
          <UserAvatar
            uri={profile?.avatarUrl ?? null}
            name={profile?.name ?? ""}
            size={80}
            borderColor={colors.accentBlue}
          />
        </View>

        <Text style={styles.name}>{profile?.name || "Runner"}</Text>
        <Text style={styles.bio}>{profile?.bio || ""}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{runs.length}</Text>
            <Text style={styles.statLabel}>Runs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalDistance}</Text>
            <Text style={styles.statLabel}>Total km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{bestPace}</Text>
            <Text style={styles.statLabel}>Best pace</Text>
          </View>
        </View>

        <View style={styles.toggleContainer}>
          <Pressable
            style={[
              styles.toggleButton,
              activeTab === "history" && styles.activeButton,
            ]}
            onPress={() => setActiveTab("history")}
          >
            <Text
              style={[
                styles.toggleText,
                activeTab === "history" && styles.activeText,
              ]}
            >
              Run History
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.toggleButton,
              activeTab === "stats" && styles.activeButton,
            ]}
            onPress={() => setActiveTab("stats")}
          >
            <Text
              style={[
                styles.toggleText,
                activeTab === "stats" && styles.activeText,
              ]}
            >
              Statistics
            </Text>
          </Pressable>
        </View>

        {activeTab === "stats" && <StatsDashboard runs={runs} />}

        {activeTab === "history" && (
          <View>
            {selectionMode && (
              <View style={styles.selectionTools}>
                <Text style={styles.selectionCount}>
                  {selectedRuns.size} selected
                </Text>
                <View style={styles.selectionActions}>
                  <Pressable
                    onPress={
                      selectedRuns.size === runs.length
                        ? clearSelection
                        : selectAllRuns
                    }
                  >
                    <Text style={styles.selectAll}>
                      {selectedRuns.size === runs.length
                        ? "Clear"
                        : "Select All"}
                    </Text>
                  </Pressable>
                  <Pressable onPress={outSelectionMode}>
                    <Text style={styles.cancelSelection}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            )}
            {loading ? (
              <View style={styles.loadingWrap}>
                <View style={styles.loadingDot} />
              </View>
            ) : error ? (
              <Text style={styles.errorText}>Error loading runs: {error}</Text>
            ) : runs.length === 0 ? (
              <Text style={styles.emptyText}>
                No runs yet. Start logging your runs.
              </Text>
            ) : (
              runs.map((item) => (
                <RunCard
                  key={item.id}
                  run={item}
                  userName={profile?.name ?? "Runner"}
                  avatarUrl={imageURI || profile?.avatarUrl || null}
                  selectable={selectionMode}
                  selected={selectedRuns.has(item.id)}
                  toggleSelect={() => toggleRunSelection(item.id)}
                />
              ))
            )}

            {runs.length > 0 && (
              <Pressable
                style={styles.exportCard}
                onPress={handleExportPress}
                disabled={
                  exporting ||
                  (selectionMode && selectedRuns.size === 0)
                }
              >
                <CloudArrowDown
                  size={24}
                  color={colors.accentBlue}
                  weight="bold"
                />
                <View style={styles.exportCardText}>
                  <Text style={styles.exportCardTitle}>
                    {selectionMode
                      ? "Export Selected Runs"
                      : "Export Run Data"}
                  </Text>
                  <Text style={styles.exportCardsubtext}>
                    {selectionMode
                      ? `Download ${selectedRuns.size} run${
                          selectedRuns.size !== 1 ? "s" : ""
                        } as CSV`
                      : `Download all ${runs.length} runs as CSV`}
                  </Text>
                </View>
                {exporting ? (
                  <Text style={styles.exportButton}>Exporting…</Text>
                ) : (
                  <Text style={styles.exportButton}>Export</Text>
                )}
              </Pressable>
            )}
          </View>
        )}

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <Modal
          visible={EditModeVisibility}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colors.bgPrimary }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView
              style={{ backgroundColor: colors.bgPrimary }}
              contentContainerStyle={styles.modalContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>Edit Profile</Text>

              <Pressable onPress={selectImage} style={styles.imagePickerButton}>
                <UserAvatar
                  uri={imageURI || profile?.avatarUrl || null}
                  name={profile?.name ?? ""}
                  size={96}
                  borderColor={colors.accentBlue}
                />
                <View style={styles.changeAvatarRow}>
                  <Camera size={16} color={colors.accentBlue} />
                  <Text style={styles.changeAvatarText}>Change photo</Text>
                </View>
              </Pressable>

              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell us about yourself"
                placeholderTextColor={colors.textTertiary}
                multiline
              />

              <View style={styles.modalDivider} />

              <Text style={styles.modalSectionTitle}>
                Account Settings
              </Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={emailEdit}
                onChangeText={setEmailEdit}
                placeholder="Email"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Current Password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
              />

              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New Password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
              />

              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm New Password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
              />

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditName(profile?.name ?? "");
                    setEditBio(profile?.bio ?? "");
                    setImageURI(profile?.avatarUrl ?? null);
                    setEmailEdit(profile?.email || "");
                    setOldPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setEditModeVisibility(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.saveButton}
                  onPress={handleSaveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Text style={styles.saveButtonText}>Saving…</Text>
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>

        <Modal
          visible={exportVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setExportVisible(false)}
          {...modalProperty}
        >
          <Pressable
            style={styles.sheetOverlay}
            onPress={() => setExportVisible(false)}
          >
            <View style={styles.sheetContainer}>
              <Pressable
                style={styles.sheetOption}
                onPress={handleExportConfirm}
              >
                <Text style={styles.sheetOptionText}>Export All Runs</Text>
              </Pressable>
              <Pressable
                style={styles.sheetOption}
                onPress={() => {
                  setExportVisible(false);
                  inSelectionMode();
                }}
              >
                <Text style={styles.sheetOptionText}>
                  Select Runs to Export
                </Text>
              </Pressable>
              <Pressable
                style={styles.sheetCancel}
                onPress={() => setExportVisible(false)}
              >
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  errorMessage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: colors.accentCoral,
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorMessageText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    marginRight: spacing.md,
  },
  headerRow: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: spacing.sm,
  },
  editButton: {
    padding: spacing.sm,
  },
  editButtonText: {
    color: colors.accentBlue,
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  name: {
    fontSize: typography.displayMedium.fontSize,
    fontWeight: typography.displayMedium.fontWeight,
    textAlign: "center",
    color: colors.textPrimary,
  },
  bio: {
    fontSize: typography.body.fontSize,
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    lineHeight: typography.body.lineHeight,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.badge.fontSize,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.borderSubtle,
  },
  toggleContainer: {
    flexDirection: "row",
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.bgInput,
    padding: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.sm - 1,
  },
  activeButton: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  toggleText: {
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  activeText: {
    color: colors.textPrimary,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    fontSize: typography.body.fontSize,
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    color: colors.accentCoral,
    textAlign: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    fontSize: typography.body.fontSize,
    paddingHorizontal: spacing.lg,
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentBlue,
    opacity: 0.6,
  },
  signOutButton: {
    marginTop: spacing.xl,
    padding: spacing.md,
    alignItems: "center",
  },
  signOutText: {
    color: colors.textTertiary,
    fontSize: typography.body.fontSize,
    fontWeight: "500",
  },
  exportCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  exportCardText: {
    flex: 1,
  },
  exportCardTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  exportCardsubtext: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  exportButton: {
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    color: colors.accentBlue,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: colors.bgPrimary,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.sm,
    paddingBottom: spacing.xl,
  },
  sheetOption: {
    padding: spacing.md + 2,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  sheetOptionText: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.accentBlue,
  },
  sheetCancel: {
    padding: spacing.md + 2,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  sheetCancelText: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  selectionTools: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  selectionCount: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  selectAll: {
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    color: colors.accentBlue,
  },
  selectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cancelSelection: {
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  modalContainer: {
    padding: spacing.lg,
    paddingTop: 50,
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: typography.displayMedium.fontSize,
    fontWeight: typography.displayMedium.fontWeight,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  modalSectionTitle: {
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  imagePickerButton: {
    alignSelf: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  changeAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  changeAvatarText: {
    color: colors.accentBlue,
    fontWeight: "600",
    fontSize: typography.caption.fontSize,
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.lg,
  },
  label: {
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.lg,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
  },
  bioInput: {
    height: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    alignItems: "center",
    marginRight: spacing.sm,
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
  saveButton: {
    flex: 1,
    padding: spacing.md,
    alignItems: "center",
    marginLeft: spacing.sm,
    backgroundColor: colors.accentBlue,
    borderRadius: radius.sm,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
});
