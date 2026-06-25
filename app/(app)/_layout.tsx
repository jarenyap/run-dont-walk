import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../context/Auth";
import { ActivityIndicator, View } from "react-native";

export default function AppLayout() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    if (!user) {
        return <Redirect href="/sign-in" />;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="log-run"
                options={{
                    presentation: 'modal',
                    title: 'Log Run',
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="search"
                options={{
                    headerShown: true,
                    headerBackButtonDisplayMode: "minimal",
                 }}
            />
            <Stack.Screen
                name="user/[id]"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="run/[id]"
                options={{
                    title: "Run Details",
                    headerShown: true,
                    headerBackButtonDisplayMode: "minimal",
                    headerStyle: { backgroundColor: "#fff" },
                    headerTitleStyle: { fontWeight: "700", color: "#1A1A1A" },
                    headerTintColor: "#1A1A1A",
                }}
            />
        </Stack>
    );
}