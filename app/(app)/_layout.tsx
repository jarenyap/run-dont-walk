import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../context/Auth";
import { View } from "react-native";
import { colors } from "../../theme";

export default function AppLayout() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bgPrimary }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentBlue, opacity: 0.6 }} />
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
                    presentation: "modal",
                    title: "Log Run",
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
                    headerStyle: { backgroundColor: colors.bgSurface },
                    headerTitleStyle: { fontWeight: "700", color: colors.textPrimary },
                    headerTintColor: colors.textPrimary,
                }}
            />
        </Stack>
    );
}