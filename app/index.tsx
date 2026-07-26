import { Redirect } from "expo-router";
import { View } from "react-native";
import { useAuth } from "../context/Auth";
import { colors } from "../theme";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.bgPrimary,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.accentBlue,
            opacity: 0.6,
          }}
        />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(app)/(tabs)/home-feed" />;
  }

  return <Redirect href="/sign-in" />;
}
