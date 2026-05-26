import { Tabs, router } from "expo-router";
import { HouseIcon, SneakerMoveIcon, CastleTurretIcon, CalendarBlankIcon, UserCircleIcon } from 'phosphor-react-native';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#5F19FF',
            tabBarInactiveTintColor: '#8E8E93',
            tabBarStyle: { backgroundColor: '#F9F9F9' },
            headerShown: false,
        }}
        >
        <Tabs.Screen
            name="home-feed"
            options={{
                title: "Home",
                tabBarIcon: ({ color }) => <HouseIcon color={color} size={24} />,
            }}
        />
        <Tabs.Screen
            name="events"
            options={{
                title: "Events",
                tabBarIcon: ({ color }) => <CalendarBlankIcon color={color} size={24} />,
            }}
        />
        <Tabs.Screen
            name="log-run-dummy"
            options={{
                title: "Log Run",
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
                tabBarIcon: ({ color }) => <CastleTurretIcon color={color} size={24} />,
            }}
        />
        <Tabs.Screen
            name="profile"
            options={{
                title: "Profile",
                tabBarIcon: ({ color }) => <UserCircleIcon color={color} size={24} />,
            }}
        />
    </Tabs>
    );
}