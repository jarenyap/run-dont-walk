import { Tabs, router } from "expo-router";
import { HouseIcon, SneakerMoveIcon, CastleTurretIcon, CalendarBlankIcon, UserCircleIcon } from 'phosphor-react-native';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#5F19FF',
            tabBarInactiveTintColor: '#8E8E93',
            tabBarStyle: { backgroundColor: '#F9F9F9' },
        }}
        >
        <Tabs.Screen
            name="home-feed"
            options={{
                title: "Walk Don't Run",
                tabBarLabel: "Home",
                headerTitleStyle: { fontWeight: "700", fontSize: 20},
                headerStyle: { backgroundColor: "#F2F2F7" },
                headerShadowVisible: false,
                tabBarIcon: ({ color }) => <HouseIcon color={color} size={24} />,
            }}
        />
        <Tabs.Screen
            name="events"
            options={{
                title: "Events",
                headerShown: false,
                tabBarIcon: ({ color }) => <CalendarBlankIcon color={color} size={24} />,
            }}
        />
        <Tabs.Screen
            name="log-run-dummy"
            options={{
                title: "Log Run",
                headerShown: false,
                tabBarIcon: ({ color }) => <SneakerMoveIcon color={color} size={24} />,
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
                title: "Clan",
                headerShown: false,
                tabBarIcon: ({ color }) => <CastleTurretIcon color={color} size={24} />,
            }}
        />
        <Tabs.Screen
            name="profile"
            options={{
                title: "Profile",
                headerShown: false,
                tabBarIcon: ({ color }) => <UserCircleIcon color={color} size={24} />,
            }}
        />
    </Tabs>
    );
}