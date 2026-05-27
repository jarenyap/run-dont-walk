import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../context/Auth";

export default function Index() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#6366f1"/>
            </View>
        );
    }

    if (user) {
        return <Redirect href="/(app)/(tab)/feed" />;
    }

    return <Redirect href="/sign-in" />;
}