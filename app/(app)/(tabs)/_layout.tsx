import { Tabs, router } from "expo-router";
import {
  House,
  SneakerMove,
  CastleTurret,
  CalendarBlank,
  UserCircle,
} from "phosphor-react-native";
import { colors } from "../../../theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accentBlue,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.bgSecondary,
          borderTopColor: colors.borderDefault,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="home-feed"
        options={{
          title: "Walk Don't Run",
          tabBarLabel: "Home",
          headerTitleStyle: {
            fontWeight: "800",
            fontSize: 20,
            color: colors.textPrimary,
          },
          headerStyle: { backgroundColor: colors.bgPrimary },
          headerShadowVisible: false,
          tabBarIcon: ({ color }) => (
            <House color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <CalendarBlank color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="log-run-dummy"
        options={{
          title: "Log Run",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SneakerMove color={color} size={24} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push("/(app)/log-run");
          },
        }}
      />
      <Tabs.Screen
        name="clan"
        options={{
          title: "Clans",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <CastleTurret color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <UserCircle color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
