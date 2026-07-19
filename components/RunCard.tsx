import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { Timestamp } from "firebase/firestore";
import { Run } from "../types";
import { computePace } from "../utils/runUtils";
import { CheckCircle, CircleIcon } from "phosphor-react-native";

interface RunCardProps {
    run: Run;
    userName: string;
    avatarUrl: string | null;
    selectable? : boolean;
    selected? : boolean;
    toggleSelect? : () => void;
}

// Converts firestore timestamp to readable date string
const formatDate = (timestamp: Timestamp | null | undefined): string => {
    if (!timestamp) return "";
    return timestamp.toDate().toLocaleString("en-SG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function RunCard({ run, userName, avatarUrl, selectable = false, selected = false, toggleSelect }: RunCardProps) {
    const pace = computePace(run.duration, run.distance);
    const date = formatDate(run.createdAt);

    const cardContent = (
        <View style={[styles.card, selectable && selected && styles.cardSelected]}>
            {/* Selection Indicator */}
            {selectable && (
                <View style={styles.selectionIndicator}>
                    {selected ? (
                        <CheckCircle size={24} color="#5F19FF" weight="fill"/>
                    ) : (
                        <CircleIcon size={24} color="#B0B0B0" />
                    )}
                </View>
            )}

            {/* Avatar */}
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} 
                    style={styles.avatar} />
                ) : (
                <View style={styles.avatar}>
                    <Text style={styles.avatarIcon}>👤</Text>
                </View>
                )}

            {/* Run Details */}
            <View style={styles.details}>

                {/* Row 1: Title + Type Badge */}
                <View style={styles.row}>
                    <Text style={styles.title} numberOfLines={1}>{run.title}</Text>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{run.type}</Text>
                    </View>
                </View>

                {/* Row 2: Distance, Duration, Pace */}
                <Text style={styles.stats}>
                    {run.distance}km · {run.duration} · {pace}
                </Text>

                {/* Row 3: Username, Date */}
                <Text style={styles.meta}>
                    {userName} · {date}
                </Text>

            </View>
        </View>
    );

    if (!selectable) {
        return cardContent;
    }
    return (
        <Pressable onPress={toggleSelect} hitSlop={4}>
            {cardContent}
        </Pressable>    
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#81818130",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        gap: 12,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#FF8538",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarIcon: {
        fontSize: 32,
    },
    details: {
        flex: 1,
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 4,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000",
        flexShrink: 1,
    },
    typeBadge: {
        backgroundColor: "#FF8538",
        borderRadius: 1,
        borderWidth: 0.5,
        borderColor: "#2C2C2C",
        paddingHorizontal: 6,
        paddingVertical: 1,
    },
    typeBadgeText: {
        color: "#000000",
        paddingHorizontal: 6,
        paddingVertical: 2,
        fontSize: 15,
        fontWeight: "600",
    },
    stats: {
        fontSize: 16,
        color: "#000000",
        width: "100%",
    },
    meta: {
        fontSize: 14,
        color: "#000000",
        width: "100%",
    },
    cardSelected: {
        borderWidth: 2,
        borderColor: "#5F19FF",
        backgroundColor: "#F5F2FF",
    },
    selectionIndicator: {
        justifyContent: "center",
        alignItems: "center",
    }
});