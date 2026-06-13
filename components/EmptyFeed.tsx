import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function EmptyFeed() {
    return (
        <View style={styles.container}>
            <Text style={styles.emoji}>🏃</Text>
            <Text style={styles.title}>Your feed is empty</Text>
            <Text style={styles.body}>
                Follow some runners to see their activity here!
            </Text>
            <TouchableOpacity onPress={() => router.push("/(app)/search")}>
                <Text style={styles.cta}>Find Runners →</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { color: "#000000", fontSize: 18, fontWeight: "600", marginBottom: 8 },
  body: {
    color: "#8E8E93",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  cta: { color: "#FF6B35", fontSize: 16, fontWeight: "600" },
});