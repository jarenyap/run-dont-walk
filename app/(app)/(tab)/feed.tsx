import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../../../context/Auth";

export default function Feed() {
    const { profile, signOut } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome back, {profile?.name || "Runner"}!</Text>

            <Text>Total distance: {profile?.totalDistance || 0} km</Text>

            <Pressable style={styles.button} onPress={signOut}>
                <Text style={styles.buttonText}>Log Out</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
    button: { marginTop: 40, padding: 12, backgroundColor: "#6C2BFF", borderRadius: 8 },
    buttonText: { color: "#fff", fontWeight: "bold" }
});