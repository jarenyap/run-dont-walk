import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal, Image, TextInput } from "react-native";
import { useAuth } from "../../../context/Auth";
import {useUserRuns} from "../../../hooks/useUserRuns";
import RunCard from "../../../components/RunCard";
import { computePace } from "../../../utils/runUtils";
import * as ImagePicker from "expo-image-picker";
import { uploadAvatar, updateUserProfile } from "../../../services/userService";

export default function ProfileScreen() {
    const { profile, signOut } = useAuth();
    const { runs, loading, error } = useUserRuns(profile?.id);

    const [EditModeVisibility, setEditModeVisibility] = useState(false);
    const [editName, setEditName] = useState(profile?.name || "");
    const [editBio, setEditBio] = useState(profile?.bio || "");
    const [imageURI, setImageURI] = useState<string | null>(profile?.avatarUrl || null);
    const [isSaving, setIsSaving] = useState(false);

    const totalDistance = runs.reduce((sum, r) => sum + r.distance, 0).toFixed(2);
    const bestPace = runs.length === 0 ? '--' : runs.reduce((best,r) => {
        const pace = computePace(r.duration, r.distance);
        if (best === '--') return pace;
        const toSecs = (p: string) => {
            const [min, sec] = p.replace('/km', '').split(':').map(Number);
            return min * 60 + sec;
        }
        return toSecs(pace) < toSecs(best) ? pace : best;
    }, '--');

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
        setEditModeVisibility(true);
     }

    const selectImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status != "granted") {
            Alert.alert("Permission Needed", 
                "Please enable camera roll permissions in your device settings.");
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
        if (!profile) return;
        const trimmed = editName.trim();
        if (!trimmed) {
            return Alert.alert("Invalid Name", "Name cannot be empty.");
        }

        setIsSaving(true);
        try {
            let finalAvatar = profile.avatarUrl;
            if (imageURI && imageURI != profile.avatarUrl) {
                finalAvatar = await uploadAvatar(profile.id, imageURI);
            }
            await updateUserProfile(profile.id, {
                name: trimmed,
                bio: editBio.trim(),
                avatarUrl: finalAvatar ?? undefined
            });
            setEditModeVisibility(false);
        } catch (e) {
            Alert.alert("Error", "Failed to save changes.");
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Edit Button */}
            <View style={styles.headerRow}>
                <Pressable onPress={openEditMode} style={styles.editButton}>
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                </Pressable>
            </View>

            {/* Avatar */}
            <View style={styles.avatarContainer}>
                {profile?.avatarUrl ? (
                    <Image source={{ uri: profile.avatarUrl }}
                    style={styles.avatar} />
                ) : (
                    <View style={styles.avatar}>
                        <Text style={styles.avatarIcon}>👤</Text>
                    </View>
                )}
            </View>

            {/* User Info */}
            <Text style={styles.name}>{profile?.name || "Runner"}</Text>
            <Text style={styles.bio}>{profile?.bio || "Add a bio!"}</Text>

            {/* Achievements */}
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.achievementsRow}>
                <View style={styles.achievementCard}>
                    <Text style={styles.achievementValue}>{runs.length}</Text>
                    <Text style={styles.achievementLabel}>Runs{'\n'}Logged</Text>
                </View>
                <View style={styles.achievementCard}>
                    <Text style={styles.achievementValue}>{totalDistance}km</Text>
                    <Text style={styles.achievementLabel}>Ran</Text>
                </View>
                <View style={styles.achievementCard}>
                    <Text style={styles.achievementValue}>{bestPace}</Text>
                    <Text style={styles.achievementLabel}>Fastest{'\n'}Pace</Text>
                </View>
            </View>

            {/* Recent Runs */}
            <Text style={styles.sectionTitle}>Recent Runs</Text>

            {loading ? (
                <ActivityIndicator color="#5F19FF" style={{ marginTop: 20 }} />
            ) : error ? (
                <Text style={styles.errorText}>Error fetching runs: {error}</Text>
            ) : runs.length === 0 ? (
                <Text style={styles.emptyText}>No runs yet. Start logging your runs!</Text>
            ) : (
                runs.slice(0, 3).map((item) => (
                    <RunCard
                        key={item.id}
                        run={item}
                        userName={profile?.name ?? "Runner"}
                        avatarUrl={imageURI || profile?.avatarUrl || null}
                    />
                ))
            )}

            {/* Sign Out */}
            <Pressable style={styles.button} onPress={handleSignOut}>
                <Text style={styles.buttonText}>Log Out</Text>
            </Pressable>

            {/* Edit Profile Modal */}
            <Modal visible={EditModeVisibility} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Edit Profile</Text>
                    <Pressable onPress={selectImage} style={styles.imagePickerButton}>
                        {imageURI || profile?.avatarUrl ? (
                            <Image
                                source={{ uri: imageURI || profile?.avatarUrl || "" }}
                                style={styles.modalAvatarImage}
                            />
                        ) : (
                            <View style={styles.modalAvatarPlaceholder}>
                                <Text style={styles.avatarIcon}>👤</Text>
                            </View>
                        )}
                        <Text style={styles.changeAvatarText}>Change Photo 📷</Text>
                    </Pressable>
                    <Text style={styles.label}>Display Name</Text>
                    <TextInput
                        style={styles.input}
                        value={editName}
                        onChangeText={setEditName}
                    />
                    <Text style={styles.label}>Bio</Text>
                    <TextInput
                        style={[styles.input, styles.bioInput]}
                        value={editBio}
                        onChangeText={setEditBio}
                        placeholder="Tell us about yourself..."
                        placeholderTextColor="#999"
                        multiline
                    />
                    <View style={styles.modalActions}>
                        <Pressable style={styles.cancelButton} onPress={() => setEditModeVisibility(false)}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                        <Pressable style={styles.saveButton} onPress={handleSaveChanges} disabled={isSaving}>
                            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
                        </Pressable>
                    </View>
                </View>
            </Modal>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        backgroundColor: "#ffffff",
    },
    content: {
        padding: 20,
        paddingTop: 65,
        paddingBottom: 20,
    },
    avatarContainer: {
        alignItems: "center",
        marginBottom: 5,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#E8824A",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarIcon: {
        fontSize: 40,
    },
    name: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        color: "#000000",
    },
    bio: {
        fontSize: 16,
        textAlign: "center",
        color: "#666666",
        marginTop: 4,
        marginBottom: 24,
        paddingHorizontal: 32,
        fontStyle: "italic",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "600",
        fontStyle: "italic",
        color: "#000000",
        marginBottom: 12,
        paddingHorizontal: 24,
    },
    achievementsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    achievementCard: {
        flex: 1,
        backgroundColor: "#84FF8D",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#4DBF4D",
        padding: 12,
        alignItems: "center",
        justifyContent: "center",
        aspectRatio: 1,
    },
    achievementValue: {
        fontSize: 18,
        fontWeight: "bold",
        fontStyle: "italic",
        color: "#000000",
        textAlign: "center",
    },
    achievementLabel: {
        fontSize: 16,
        fontStyle: "italic",
        color: "#000000",
        textAlign: "center",
        marginTop: 4,
    },
    emptyText: {
        color: "#888888",
        textAlign: "center",
        marginTop: 20,
        marginBottom: 20,
        fontSize: 16,
        paddingHorizontal: 24,
    },
    errorText: {
        color: "#FF4444",
        textAlign: "center",
        marginTop: 20,
        marginBottom: 20,
        fontSize: 16,
        paddingHorizontal: 24,
    },
    button: { 
        marginTop: 40, 
        padding: 12, 
        backgroundColor: "#6C2BFF", 
        borderRadius: 8 
    },
    buttonText: {
         color: "#fff", 
         fontWeight: "bold",
         fontSize: 16,
         textAlign: "center" 
    },
    headerRow: {
        width: "100%",
        alignItems: "flex-end",
        marginBottom: 10,
    },
    editButton: {
        padding: 8
    },
    editButtonText: {
        color: "#5F19FF",
        fontWeight: "bold",
        fontSize: 16,
    },
    modalContainer: {
        flex: 1,
        padding: 24,
        backgroundColor: "#fff",
        paddingTop: 50
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 32,
        textAlign: "center"
    },
    imagePickerButton: {
        alignSelf: "center",
        marginBottom: 32
    },
    modalAvatarPlaceholder: {
        width: 100, 
        height: 100, 
        borderRadius: 50, 
        marginBottom: 12, 
        backgroundColor: "#E8824A",
        justifyContent: "center",
        alignItems: "center"
    },
    modalAvatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 12,
    },
    changeAvatarText: {
        color: "#5F19FF",
        fontWeight: "600",
        marginTop: 8
    },
    label: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 8
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
        fontSize: 16
    },
    bioInput: {
        height: 80,
        textAlignVertical: "top"
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        alignItems: "center",
        marginRight: 8,
        backgroundColor: "#eee",
        borderRadius: 8
    },
    cancelButtonText: {
        color: "#333",
        fontWeight: "bold"
    },
    saveButton: {
        flex: 1,
        padding: 16,
        alignItems: "center",
        marginLeft: 8,
        backgroundColor: "#5F19FF",
        borderRadius: 8
    },
    saveButtonText: {
        color: "#fff",
        fontWeight: "bold"
    },
});