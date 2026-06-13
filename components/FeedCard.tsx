import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import UserAvatar from "./UserAvatar";
import RunTypeBadge from "./RunTypeBadge";
import { Run } from "../types/index";
import {formatRelativeTime} from "../utils/time";

type Props = { run: Run };

export default function FeedCard({ run }: Props) {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/run/${run.id}`)}
            activeOpacity={0.8}
        >
            <View style={styles.header}>
                <UserAvatar uri={run.authorAvatarUrl} size={40} name={run.authorName} />
                <View style={styles.headerText}>
                    <Text style={styles.name}>{run.authorName}</Text>
                    <RunTypeBadge type={run.type} />
                </View>
                <Text style={styles.timestamp}>{formatRelativeTime(run.createdAt)}</Text>
            </View>

            {run.title ? <Text style={styles.title}>{run.title}</Text> : null}
            
            <View style={styles.stats}>
                <Text style={styles.distance}>{run.distance.toFixed(2)} km</Text>
                <Text style={styles.duration}>{run.duration}</Text>
            </View>

            {run.notes ? (
                <Text style={styles.notes} numberOfLines={2}>{run.notes}</Text>
            ) : null}

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionLabel}>♡  {run.likes?.length ?? 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionLabel}>💬  {run.commentCount ?? 0}</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F5F5F0",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  headerText: { flex: 1, marginLeft: 10 },
  name: { color: "#1A1A1A", fontSize: 14, fontWeight: "600" },
  timestamp: { color: "#8E8E93", fontSize: 12 },
  title: {
    color: "#1A1A1A",
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 6,
  },
  stats: { 
    flexDirection: "row", 
    alignItems: "baseline", 
    gap: 12, 
    marginBottom: 6 
  },
  distance: {
    color: "#1A1A1A", 
    fontSize: 20, 
    fontWeight: "700" 
    },
  duration: {
    color: "#6D6D6D",
    fontSize: 16 
  },
  notes: {
    color: "#6D6D6D",
    fontStyle: "italic",
    fontSize: 14,
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0DC",
  },
  actionButton: {
    flexDirection: "row", 
    alignItems: "center"
  },
  actionLabel: {
    color: "#1A1A1A",
    fontSize: 14,
  },
});