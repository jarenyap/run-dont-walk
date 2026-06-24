import React, { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { router, Stack } from "expo-router";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../context/Auth";
import { followUser, unfollowUser } from "../../services/followService";
import { UserProfile } from "../../types/index";
import UserAvatar from "../../components/UserAvatar";

export default function SearchScreen() {
    const { user, profile } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);

    // local set of IDs user is following, so follow/following button updates immediately 
    const [followingSet, setFollowingSet] = useState<Set<string>>(
        new Set(profile?.followingIds ?? [])
    );

    useEffect(() => {
        setFollowingSet(new Set(profile?.followingIds ?? []));
    }, [profile?.followingIds]);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setResults([]);
            return;
        }
        const timer = setTimeout(() => {
            runSearch(searchTerm.trim().toLowerCase());
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    async function runSearch(term: string) {
        setLoading(true);
        try {
            const q = query(
                collection(db, "users"),
                where("nameLower", ">=", term),
                where("nameLower", "<=", term + "\uf8ff"),
                limit(20)
            );
            const snap = await getDocs(q);
            const users = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as UserProfile))
                .filter(u => u.id !== user?.uid);
            setResults(users);
        } finally {
            setLoading(false);
        }
    }

    async function handleFollowToggle(targetId: string, targetName: string) {
        if (!user) return;
        const isFollowing = followingSet.has(targetId);

        if (isFollowing) {
            Alert.alert(`Unfollow ${targetName}?`, "You'll stop seeing their runs in your feed.",
                [{ text: "Cancel", style: "cancel" },
                    {text: "Unfollow", style: "destructive", onPress: async() => {
                        setFollowingSet(prev => {
                            const next = new Set(prev);
                            next.delete(targetId);
                            return next;
                        });
                        await unfollowUser(user.uid, targetId);
                    }},
                ]
            );
        } else {
            setFollowingSet(prev => new Set (prev).add(targetId));
            await followUser(user.uid, targetId);
        }
    }

    return (
        <>
            <Stack.Screen options={{
                title: "Find Runners",
                headerTitleAlign: "center",
                headerTitleStyle: { fontWeight: "700" },
                headerStyle: { backgroundColor: "#F2F2F7" },
                headerShadowVisible: false,
            }} />

            <View style={styles.searchBarContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Search by name..."
                    placeholderTextColor="#8E8E93"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    autoFocus
                    autoCapitalize="none"
                    clearButtonMode="while-editing"
                />
            </View>

            <FlatList
                data={results}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View>
                        {loading && (<ActivityIndicator color="#FF6B35" style={{ marginTop: 16}} />)}
                        {!loading && searchTerm.trim() !== "" && results.length === 0 && (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No runners found for "{searchTerm}"</Text>
                                <Text style={styles.emptySubText}>Try a different name.</Text>
                            </View>
                        )}
                    </View>
                }
                renderItem={({ item}) => {
                    const isFollowing = followingSet.has(item.id);
                    return (
                        <TouchableOpacity
                            style={styles.row}
                            onPress={() => router.push(`/user/${item.id}`)}
                            activeOpacity={0.7}
                        >
                            <UserAvatar uri={item.avatarUrl} size={44} />
                            <View style={styles.rowInfo}>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.meta}>
                                    {item.followersCount ?? 0} followers
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.followButton, isFollowing && styles.followingButton]}
                                onPress={e => {
                                    e.stopPropagation?.();
                                    handleFollowToggle(item.id, item.name);
                                }}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right:8 }}
                            >
                                <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                                    {isFollowing ? "Following" : "Follow"}
                                </Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    );
                }}
            />
        </>
    );
}

const styles = StyleSheet.create({
    searchBarContainer: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    listContent: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingBottom: 32,
        flexGrow: 1,
    },
    listHeader: {
        paddingTop: 16,
        paddingBottom: 8,
    },
    input: {
        backgroundColor: "#F2F2F7",
        color: "#000000",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 8,
    },
    emptyState: {
        alignItems: "center",
        marginTop: 40,
    },
    emptyText: {
        color: "#000000",
        fontSize: 15,
        fontWeight: "600",
    },
    emptySubText: {
        color: "#8E8E93",
        fontSize: 14,
        marginTop: 4,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5EA",
    },
    rowInfo: {
        flex: 1,
        marginLeft: 12,
    },
    name: {
        color: "#000000",
        fontSize: 14,
        fontWeight: "600",
    },
    meta: {
        color: "#8E8E93",
        fontSize: 12,
        marginTop: 2,
    },
    followButton: {
        backgroundColor: "#FF6B35",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 7,
        minWidth: 80,
        alignItems: "center",
    },
    followingButton: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "#8E8E93",
    },
    followButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "600",
    },
    followingButtonText: {
        color: "#8E8E93",
    },
});