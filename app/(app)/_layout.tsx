import { Stack } from "expo-router";


export default function AppLayout() {
    // TODO: add auth guard here once AuthContext is ready
    // const { user, loading } = useAuth();
    // if (loading) { return <ActivityIndicator />; }
    // if (!user) { return <Redirect href="/sign-in" />; }

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
        </Stack>
    );
}