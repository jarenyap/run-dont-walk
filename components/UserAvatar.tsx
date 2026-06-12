import { View, Image, Text, StyleSheet } from "react-native";

type Props = {
    uri: string | null;
    size?: number;
    name?: string;
};

export default function UserAvatar({ uri, size = 40, name }: Props) {
    const initials = name
        ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "?";

    if (uri) {
        return (
            <Image
                source={{ uri }}
                style={[styles.avatar, {width: size, height: size, borderRadius: size / 2}]}
            />
        );
    }

    return (
        <View style={[styles.fallback, {width: size, height: size, borderRadius: size / 2}]}>
            <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    avatar: { backgroundColor: "#2C2C2E" },
    fallback: {
        backgroundColor: "#FF6B35",
        justifyContent: "center",
        alignItems: "center",
    },
    initials: { color: "#FFFFFF", fontWeight: "600" },
});