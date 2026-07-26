import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { Heart, ChatTeardrop } from "phosphor-react-native";
import { db } from "../../../firebaseConfig";
import { useAuth } from "../../../context/Auth";
import {
  addComment,
  subscribeToComments,
} from "../../../services/commentService";
import { toggleLike } from "../../../services/likeService";
import type { Comment, Run } from "../../../types";
import { computePace } from "../../../utils/runUtils";
import UserAvatar from "../../../components/UserAvatar";
import RunTypeBadge from "../../../components/RunTypeBadge";
import { colors, spacing, radius, typography } from "../../../theme";

function getRelativeTime(dateValue: any): string {
  const date =
    typeof dateValue?.toDate === "function"
      ? dateValue.toDate()
      : new Date(dateValue);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
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

    const authorName =
      (user as any)?.displayName ||
      (user as any)?.name ||
      (user as any)?.email ||
      "You";
    const authorAvatarURL = (user as any)?.photoUrl || null;

    setSending(true);
    try {
      await addComment(
        run.id,
        user.uid,
        authorName,
        authorAvatarURL,
        commentText
      );
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
        <View style={styles.loadingDot} />
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
                <UserAvatar
                  uri={run.authorAvatarUrl}
                  name={run.authorName}
                  size={40}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.displayName}>
                    {run.authorName}
                  </Text>
                  <Text style={styles.timestamp}>
                    {getRelativeTime(run.createdAt)}
                  </Text>
                </View>
              </View>
              <RunTypeBadge type={run.type} />
            </View>

            <Text style={styles.distance}>
              {run.distance.toFixed(2)} km
            </Text>
            <Text style={styles.duration}>{run.duration}</Text>
            {!!pace && pace !== "--" && (
              <Text style={styles.pace}>{pace}</Text>
            )}

            {!!run.notes && (
              <Text style={styles.notes}>{run.notes}</Text>
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleToggleLike}
                disabled={likeLoading}
              >
                {likeLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.accentCoral}
                  />
                ) : (
                  <Heart
                    size={18}
                    color={
                      isLiked
                        ? colors.accentCoral
                        : colors.textTertiary
                    }
                    weight={isLiked ? "fill" : "regular"}
                  />
                )}
                <Text
                  style={[
                    styles.actionText,
                    isLiked && { color: colors.accentCoral },
                  ]}
                >
                  {run.likes?.length ?? 0}
                </Text>
              </TouchableOpacity>

              <View style={styles.actionButton}>
                <ChatTeardrop
                  size={18}
                  color={colors.textTertiary}
                />
                <Text style={styles.actionText}>
                  {comments.length}
                </Text>
              </View>
            </View>

            <Text style={styles.commentsTitle}>Comments</Text>
          </View>
        }
        renderItem={({ item }: { item: Comment }) => (
          <View style={styles.commentRow}>
            <UserAvatar
              uri={item.authorAvatarUrl}
              name={item.authorName}
              size={32}
            />
            <View style={styles.commentBubble}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>
                  {item.authorName}
                </Text>
                <Text style={styles.commentTime}>
                  {getRelativeTime(item.createdAt)}
                </Text>
              </View>
              <Text style={styles.commentText}>{item.text}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyComments}>
            <Text style={styles.emptyCommentsText}>
              No comments yet.
            </Text>
          </View>
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Add a comment"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          editable={!sending}
          onSubmitEditing={handleSendComment}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !commentText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSendComment}
          disabled={sending || !commentText.trim()}
        >
          <Text style={styles.sendButtonText}>
            {sending ? "..." : "Send"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentBlue,
    opacity: 0.6,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
  },
  listContent: {
    padding: spacing.md,
  },
  headerCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  displayName: {
    color: colors.textPrimary,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  timestamp: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  distance: {
    color: colors.textPrimary,
    fontSize: typography.displayHero.fontSize,
    fontWeight: typography.displayHero.fontWeight,
  },
  duration: {
    color: colors.textSecondary,
    fontSize: typography.displayMedium.fontSize,
    fontWeight: typography.displayMedium.fontWeight,
  },
  pace: {
    color: colors.accentBlue,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
  notes: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: "500",
  },
  commentsTitle: {
    color: colors.textTertiary,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    textTransform: "uppercase",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: spacing.md,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 10,
  },
  commentAuthor: {
    color: colors.textPrimary,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    flex: 1,
  },
  commentTime: {
    color: colors.textSecondary,
    fontSize: typography.badge.fontSize,
  },
  commentText: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  emptyComments: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  emptyCommentsText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: spacing.md,
    paddingBottom: Platform.OS === "ios" ? spacing.lg : spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
    backgroundColor: colors.bgSecondary,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgInput,
    color: colors.textPrimary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: colors.accentBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
  },
});
