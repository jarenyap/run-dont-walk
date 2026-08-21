import { useEffect, useState } from "react";
import {
  FlatList,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Stack, router } from "expo-router";
import { MagnifyingGlass } from "phosphor-react-native";
import { useAuth } from "../../../context/Auth";
import { subscribeFeed } from "../../../services/feedService";
import FeedCard from "../../../components/FeedCard";
import EmptyFeed from "../../../components/EmptyFeed";
import { Run } from "../../../types/index";
import { colors, spacing } from "../../../theme";

export default function HomeFeedScreen() {
  const { profile } = useAuth();
  const [feedPosts, setFeedPosts] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setFeedPosts([]);
      setLoading(false);
      return;
    }
    const followingIds = profile?.followingIds ?? [];
    const unsubscribe = subscribeFeed(
      profile.id,
      followingIds,
      (runs) => {
        setFeedPosts(runs);
        setLoading(false);
      },
      (err) => {
        console.error("Feed listener error:", err);
        setFeedPosts([]);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [profile?.followingIds, profile?.id]);

  const searchButton = (
    <TouchableOpacity
      onPress={() => router.push("/(app)/search")}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={{ marginRight: spacing.md }}
    >
      <MagnifyingGlass size={22} color={colors.accentBlue} weight="bold" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Run Don't Walk",
            headerTitleStyle: {
              fontWeight: "800",
              fontSize: 20,
              color: colors.textPrimary,
            },
            headerStyle: { backgroundColor: colors.bgPrimary },
            headerShadowVisible: false,
            headerRight: () => searchButton,
          }}
        />
        <View style={[styles.centered, { backgroundColor: colors.bgPrimary }]}>
          <View style={styles.loadingPulse} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Run Don't Walk",
          headerTitleStyle: {
            fontWeight: "800",
            fontSize: 20,
            color: colors.textPrimary,
          },
          headerStyle: { backgroundColor: colors.bgPrimary },
          headerShadowVisible: false,
          headerRight: () => searchButton,
        }}
      />
      <FlatList
        data={feedPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedCard run={item} />}
        ListEmptyComponent={<EmptyFeed />}
        contentContainerStyle={
          feedPosts.length === 0 ? styles.centered : styles.list
        }
        style={{ backgroundColor: colors.bgPrimary }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  loadingPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentBlue,
    opacity: 0.6,
  },
});
