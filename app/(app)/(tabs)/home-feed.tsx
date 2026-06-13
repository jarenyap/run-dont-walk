import { useEffect, useState } from "react";
import { FlatList, View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useAuth } from "../../../context/Auth";
import { subscribeFeed } from "../../../services/feedService";
import FeedCard from "../../../components/FeedCard";
import EmptyFeed from "../../../components/EmptyFeed";
import { Run } from "../../../types/index";

export default function HomeFeedScreen() {
    const { profile } = useAuth();
    const [feedPosts, setFeedPosts] = useState<Run[]>([]);
    const [loading, setLoading]= useState(true);

    useEffect(() => {
        if (!profile) {
            setFeedPosts([]);
            setLoading(false);
            return;
        }
        const followingIds = profile?.followingIds ?? [];
        const unsubscribe = subscribeFeed(profile.id, followingIds, (runs) => {
            setFeedPosts(runs);
            setLoading(false);
        },
        (err) => {
            console.error("Feed listner error:", err);
            setFeedPosts([]);
            setLoading(false);
        });
        return unsubscribe;
    }, [profile?.followingIds, profile?.id]);

    if (loading) {
        return (
            <>
                <Stack.Screen options={{                              
                    title: "Walk Don't Run",
                    headerLargeTitle: true,
                    headerTitleStyle: { fontWeight: "700" },
                    headerStyle: { backgroundColor: "#F2F2F7" },
                    headerShadowVisible: false,
        }} />
        <View style={styles.centered}>
          <ActivityIndicator color="#FF8538" size="large" />
        </View>
      </>
    );
  }

    return (
        <>
            <Stack.Screen options={{                              
                title: "Walk Don't Run",
                headerLargeTitle: true,
                headerTitleStyle: { fontWeight: "700" },
                headerStyle: { backgroundColor: "#F2F2F7" },
                    headerShadowVisible: false,
            }} />
            <FlatList
                data={feedPosts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <FeedCard run={item} />}
                ListEmptyComponent={<EmptyFeed />}
                contentContainerStyle={
                    feedPosts.length === 0 ? styles.centered : styles.list
                }
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
        paddingTop: 16,
        paddingBottom: 8,
    }
});