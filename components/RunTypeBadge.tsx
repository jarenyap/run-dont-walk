import { View, Text, StyleSheet } from "react-native";
import { RunType } from "../types/index";

const BADGE_COLOURS: Record<RunType, string> = {
    easy: "#34C759",
    tempo: "#0A84FF",
    long: "#FF6B35",
    race: "#FF3B30",
};

type Props = { type: RunType };

export default function RunTypeBadge({ type }: Props) {
    return (
        <View style={[styles.badge, { backgroundColor: BADGE_COLOURS[type] }]}>
            <Text style={styles.label}>{type}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 99,
        alignSelf: "flex-start",
        marginTop: 2,
    },
    label: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "600",
    }
});