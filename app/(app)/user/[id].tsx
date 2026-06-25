import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { doc, onSnapshot, collection, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAuth } from "../../../context/Auth";
import { followUser, unfollowUser } from "../../../services/followService";
import { UserProfile, Run } from "../../../types/index";
import UserAvatar from "../../../components/UserAvatar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OtherUserProfileScreen() {
    const { id: targetId } = useLocalSearchParams<{ id: string }>();
    const { user, profile } = useAuth();
    const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
    const [runs, setRuns] = useState<Run[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (targetId && user && targetId === user.uid) {
            router.replace("/(tabs)/profile");
        }
    }, [targetId, user]);

    useEffect(() => {
        if (!targetId) return;
        const unsub = onSnapshot(doc(db, "users", targetId), snap => {
            if (snap.exists()) {
                setTargetProfile(snap.data() as UserProfile);
            }
            setLoadingProfile(false);
        });
        return unsub;
    }, [targetId]);

    useEffect(() => {
        if (!targetId) return;
        const q = query(
            collection(db, "runs"),
            where("userId", "==", targetId),
            orderBy("createdAt", "desc"),
            limit(20)
        );
        const unsub = onSnapshot(q, snap => {
            setRuns(snap.docs.map(d => ({ id: d.id, ... d.data() } as Run)));
        });
        return unsub;
    }, [targetId]);

    useEffect(() => {
        if (profile?.followingIds && targetId) {
            setIsFollowing(profile.followingIds.includes(targetId));
        }
    }, [profile?.followingIds, targetId]);

    async function handleFollowToggle() {
        if (!user || !targetId || !targetProfile) return;
        if (isFollowing) {
            Alert.alert(
                `Unfollow ${targetProfile.name}?`, "You'll stop seeing their runs in your feed.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Unfollow", style: "destructive", onPress: async () => {
                        setIsFollowing(false);
                        await unfollowUser(user.uid, targetId);
                    }},
                ]
            );
        } else {
            setIsFollowing(true);
            await followUser(user.uid, targetId);
        }
    }

    if (loadingProfile) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color="#FF6B35" size="large" />
            </View>
        );
    }

    if (!targetProfile) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>User not found.</Text>
            </View>
        );
    }
    
    return (
        <>
                <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Floating back button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { top: insets.top + 8 }]}
                >
                    <Text style={styles.backButtonText}>‹</Text>
                </TouchableOpacity>

                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <UserAvatar uri={targetProfile.avatarUrl} size={88} />
                </View>

                {/* Username */}
                <Text style={styles.name}>{targetProfile.name}</Text>

                {/* Bio */}
                {targetProfile.bio ? (
                    <Text style={styles.bio}>{targetProfile.bio}</Text>
                ) : null}

                {/* Follow Button */}
                <TouchableOpacity
                    style={[styles.followButton, isFollowing && styles.followingButton]}
                    onPress={handleFollowToggle}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                        {isFollowing ? "Following" : "Follow"}
                    </Text>
                </TouchableOpacity>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{targetProfile.followersCount ?? 0}</Text>
                        <Text style={styles.statLabel}>Followers</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{targetProfile.followingIds?.length ?? 0}</Text>
                        <Text style={styles.statLabel}>Following</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{targetProfile.clanIds?.length ?? 0}</Text>
                        <Text style={styles.statLabel}>Clans</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{targetProfile.totalDistance?.toFixed(1) ?? 0} km</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                </View>

                {/* Recent Runs */}
                    <Text style={styles.sectionTitle}>Recent Runs</Text>
                    {runs.length === 0 ? (
                        <>
                            <Text style={styles.emptyRuns}>No runs logged yet.</Text>
                            <Text style={styles.emptyRuns}>Every journey starts with a single step! 👟</Text>
                        </>
                    ) : (
                        <>
                            {runs.map(run => (
                                <View key={run.id} style={styles.runRow}>
                                    <View style={styles.runRowLeft}>
                                        <Text style={styles.runTitle}>{run.title}</Text>
                                        <Text style={styles.runStats}>
                                            {run.distance} km · {run.duration}
                                        </Text>
                                    </View>
                                    <View style={styles.runTypeBadge}>
                                        <Text style={styles.runTypeBadgeText}>{run.type}</Text>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F2F2F7",
    },
    content: {
        paddingTop: 120,
        paddingBottom: 40,
        alignItems: "center",
    },
    backButton: {
        position: "absolute",
        left: 16,
        zIndex: 10,
        backgroundColor: "rgba(255, 255, 255, 0.80)",
        borderRadius: 50,
        width: 50,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    backButtonText: {
        fontSize: 40,
        color: "#000000",
        lineHeight: 42,
        marginLeft: -2,
    },
    centered: {
        flex: 1,
        backgroundColor: "#F2F2F7",
        justifyContent: "center",
        alignItems: "center",
    },
    errorText: {
        color: "#8E8E93",
        fontSize: 16,
    },
    avatarSection: {
        marginBottom: 12,
    },
    name: {
        color: "#000000",
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 6,
    },
    bio: {
        color: "#8E8E93",
        fontSize: 14,
        textAlign: "center",
        paddingHorizontal: 32,
        marginBottom: 16,
    },
    followButton: {
        backgroundColor: "#FF6B35",
        borderRadius: 8,
        paddingHorizontal: 48,
        paddingVertical: 10,
        marginBottom: 24,
        alignItems: "center",
    },
    followingButton: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "#8E8E93",
    },
    followButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
    followingButtonText: {
        color: "#8E8E93",
    },

    // Stats row — all 5 stats in a horizontal strip
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 8,
        marginHorizontal: 16,
        marginBottom: 28,
        width: "90%",
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statNumber: {
        color: "#000000",
        fontSize: 17,
        fontWeight: "700",
    },
    statLabel: {
        color: "#8E8E93",
        fontSize: 11,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: "#E5E5EA",
    },

    // Recent runs section
    sectionTitle: {
        color: "#000000",
        fontSize: 16,
        fontWeight: "700",
        alignSelf: "flex-start",
        marginLeft: 16,
        marginBottom: 10,
    },
    emptyRuns: {
        color: "#8E8E93",
        fontSize: 14,
        textAlign: "center",
        marginTop: 20,
        paddingHorizontal: 24,
    },
    runRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 14,
        marginHorizontal: 16,
        marginBottom: 10,
        width: "90%",
    },
    runRowLeft: {
        flex: 1,
        gap: 4,
    },
    runTitle: {
        color: "#000000",
        fontSize: 15,
        fontWeight: "600",
    },
    runStats: {
        color: "#8E8E93",
        fontSize: 13,
    },
    runTypeBadge: {
        backgroundColor: "#FF6B35",
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginLeft: 10,
    },
    runTypeBadgeText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "600",
    },
});