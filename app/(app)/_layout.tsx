import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../context/Auth";
import { ActivityIndicator, View } from "react-native";

export default function AppLayout() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#636611" />
            </View>
        );
    }

    if (!user) {
        return <Redirect href="/sign-in" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}