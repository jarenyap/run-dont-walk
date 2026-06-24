import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet,
     Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAuth } from "../../../context/Auth";
import { addComment, subscribeToComments } from "../../../services/commentService";
import { toggleLike } from "../../../services/likeService";
import type { Comment, Run } from "../../../types";
import { computePace } from "../../../utils/runUtils";

function getRelativeTime(dateValue: any): string {
    const date = typeof dateValue?.toDate === "function" ? dateValue.toDate() : new Date(dateValue);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

function getRunTypeColor(type: Run["type"]) {
    switch (type) {
        case "easy":   return "#34C759";
        case "tempo":  return "#0A84FF";
        case "long":   return "#FF6B35";
        case "race":   return "#FF3B30";
        default:       return "#8E8E93";
    }
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
    const initial = useMemo(() => name?.trim()?.charAt(0)?.toUpperCase() || "?", [name]);
    return (
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initial}</Text>
        </View>
    );
}

export default function RunDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const [run, setRun] = useState<Run | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);

    useEffect(() => {
        if (!id) return;
        const unsubscribeRun = onSnapshot(doc(db, "runs", id), (snapshot) => {
            if (snapshot.exists()) {
                setRun({ id: snapshot.id, ...snapshot.data() } as Run);
            } else {
                setRun(null);
            }
            setLoading(false);
        });
        return unsubscribeRun;
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const unsubscribeComments = subscribeToComments(id, setComments);
        return unsubscribeComments;
    }, [id]);

    const isLiked = !!user?.uid && !!run?.likes?.includes(user.uid);

    const handleToggleLike = async () => {
        if (!user?.uid || !run || likeLoading) return;
        setLikeLoading(true);
        try {
            await toggleLike(run.id, user.uid, isLiked);
        } catch (error) {
            console.error("Failed to toggle like:", error);
        } finally {
            setLikeLoading(false);
        }
    };

    const handleSendComment = async () => {
        if (!user?.uid || !run || sending) return;
        if (!commentText.trim()) return;

        const authorName = (user as any)?.displayName || (user as any)?.name || (user as any)?.email || "You";
        const authorAvatarURL = (user as any)?.photoUrl || null;

        setSending(true);
        try {
            await addComment(run.id, user.uid, authorName, authorAvatarURL, commentText);
            setCommentText("");
        } catch (error) {
            console.error("Failed to add comment:", error);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#FF6B35" />
            </View>
        );
    }

    if (!run) {
        return (
            <View style={styles.centered}>
                <Text style={styles.emptyText}>Run not found.</Text>
            </View>
        );
    }
    const pace = computePace(run.duration, run.distance);

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={90}
        >
            <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.headerCard}>
                        <View style={styles.topRow}>
                            <View style={styles.userRow}>
                                <Avatar name={run.authorName} size={44} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.displayName}>{run.authorName}</Text>
                                    <Text style={styles.timestamp}>{getRelativeTime(run.createdAt)}</Text>
                                </View>
                            </View>
                            <View style={[styles.badge, { backgroundColor: getRunTypeColor(run.type) + "22" }]}>
                                <Text style={[styles.badgeText, { color: getRunTypeColor(run.type) }]}>
                                    {run.type.toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.metricsRow}>
                            <Text style={styles.distance}>{run.distance.toFixed(2)} km</Text>
                            <Text style={styles.duration}>{run.duration}</Text>
                            {!!pace && pace !== "--" && <Text style={styles.pace}>{pace}</Text>}
                        </View>

                        {!!run.notes && <Text style={styles.notes}>{run.notes}</Text>}

                        <View style={styles.actionsRow}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleToggleLike}
                                disabled={likeLoading}
                            >
                                {likeLoading ? (
                                    <ActivityIndicator size="small" color="#FF6B35" />
                                ) : (
                                    <Text style={[styles.actionIcon, isLiked && styles.likedIcon]}>
                                        {isLiked ? "❤️" : "♡"}
                                    </Text>
                                )}
                                <Text style={styles.actionText}>{run.likes?.length ?? 0}</Text>
                            </TouchableOpacity>

                            <View style={styles.actionButton}>
                                <Text style={styles.actionIcon}>💬</Text>
                                <Text style={styles.actionText}>{comments.length}</Text>
                            </View>
                        </View>

                        <Text style={styles.commentsTitle}>COMMENTS</Text>
                    </View>
                }
                renderItem={({ item }: { item: Comment }) => (
                    <View style={styles.commentRow}>
                        <Avatar name={item.authorName} size={32} />
                        <View style={styles.commentBubble}>
                            <View style={styles.commentHeader}>
                                <Text style={styles.commentAuthor}>{item.authorName}</Text>
                                <Text style={styles.commentTime}>{getRelativeTime(item.createdAt)}</Text>
                            </View>
                            <Text style={styles.commentText}>{item.text}</Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyComments}>
                        <Text style={styles.emptyCommentsText}>No comments yet. Start the conversation!</Text>
                    </View>
                }
            />

            <View style={styles.inputBar}>
                <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Add a comment..."
                    placeholderTextColor="#8E8E93"
                    style={styles.input}
                    editable={!sending}
                    onSubmitEditing={handleSendComment}
                    returnKeyType="send"
                />
                <TouchableOpacity
                    style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
                    onPress={handleSendComment}
                    disabled={sending || !commentText.trim()}
                >
                    <Text style={styles.sendButtonText}>{sending ? "..." : "Send"}</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    centered: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#1A1A1A',
        fontSize: 16,
    },
    listContent: {
        padding: 16,
        paddingTop: 16,
        paddingBottom: 140,
    },
    headerCard: {
        backgroundColor: '#F5F5F0',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E0DC',
        marginBottom: 16,
        gap: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    avatar: {
        backgroundColor: '#E0E0DC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#1A1A1A',
        fontWeight: '700',
    },
    displayName: {
        color: '#1A1A1A',
        fontSize: 15,
        fontWeight: '600',
    },
    timestamp: {
        color: '#8E8E93',
        fontSize: 12,
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    metricsRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        gap: 12,
    },
    distance: {
        color: '#1A1A1A',
        fontSize: 24,
        fontWeight: '700',
    },
    duration: {
        color: '#6D6D6D',
        fontSize: 16,
    },
    pace: {
        color: '#FF6B35',
        fontSize: 16,
        fontWeight: '600',
    },
    notes: {
        color: '#6D6D6D',
        fontStyle: 'italic',
        fontSize: 14,
        lineHeight: 21,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        paddingTop: 8,
        paddingBottom: 4,
        borderTopWidth: 1,
        borderTopColor: '#E0E0DC',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionIcon: {
        color: '#1A1A1A',
        fontSize: 18,
    },
    likedIcon: {
        color: '#FF6B35',
    },
    actionText: {
        color: '#6D6D6D',
        fontSize: 14,
        fontWeight: '500',
    },
    commentsTitle: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    commentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 12,
    },
    commentBubble: {
        flex: 1,
        backgroundColor: '#F5F5F0',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E0E0DC',
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
        gap: 10,
    },
    commentAuthor: {
        color: '#1A1A1A',
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
    commentTime: {
        color: '#8E8E93',
        fontSize: 11,
    },
    commentText: {
        color: '#6D6D6D',
        fontSize: 14,
        lineHeight: 20,
    },
    emptyComments: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    emptyCommentsText: {
        color: '#8E8E93',
        fontSize: 14,
    },
    inputBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        paddingHorizontal: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0DC',
        backgroundColor: '#F2F2F7',
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F5F0',
        color: '#1A1A1A',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E0E0DC',
    },
    sendButton: {
        backgroundColor: '#FF6B35',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
});