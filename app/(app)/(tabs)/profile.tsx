import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useAuth } from "../../../context/Auth";
import {useUserRuns} from "../../../hooks/useUserRuns";
import RunCard from "../../../components/RunCard";
import { computePace } from "../../../utils/runUtils";

export default function ProfileScreen() {
    const { profile, signOut } = useAuth();
    const { runs, loading, error } = useUserRuns(profile?.id);

    const totalDistance = runs.reduce((sum, r) => sum + r.distance, 0).toFixed(2);
    const bestPace = runs.length === 0 ? '--' : runs.reduce((best,r) => {
        const pace = computePace(r.duration, r.distance);
        if (best === '--') return pace;
        const toSecs = (p: string) => {
            const [min, sec] = p.replace('/km', '').split(':').map(Number);
            return min * 60 + sec;
        }
        return toSecs(pace) < toSecs(best) ? pace : best;
    }, '--');

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (e) {
            console.error("Failed to sign out:", e);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Avatar */}
            <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarIcon}>👤</Text>
                </View>
            </View>

            {/* User Info */}
            <Text style={styles.name}>{profile?.name ?? 'Runner'}</Text>
            <Text style={styles.bio}>{profile?.bio ?? 'No bio yet'}</Text>

            {/* Achievements */}
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.achievementsRow}>
                <View style={styles.achievementCard}>
                    <Text style={styles.achievementValue}>{runs.length}</Text>
                    <Text style={styles.achievementLabel}>Runs{'\n'}Logged</Text>
                </View>
                <View style={styles.achievementCard}>
                    <Text style={styles.achievementValue}>{totalDistance}km</Text>
                    <Text style={styles.achievementLabel}>Ran</Text>
                </View>
                <View style={styles.achievementCard}>
                    <Text style={styles.achievementValue}>{bestPace}</Text>
                    <Text style={styles.achievementLabel}>Fastest{'\n'}Pace</Text>
                </View>
            </View>

            {/* Recent Runs */}
            <Text style={styles.sectionTitle}>Recent Runs</Text>

            {loading ? (
                <ActivityIndicator color="#5F19FF" style={{ marginTop: 20 }} />
            ) : error ? (
                <Text style={styles.errorText}>Error fetching runs: {error}</Text>
            ) : runs.length === 0 ? (
                <Text style={styles.emptyText}>No runs yet. Start logging your runs!</Text>
            ) : (
                runs.slice(0, 3).map((item) => (
                    <RunCard
                        key={item.id}
                        run={item}
                        userName={profile?.name ?? 'Runner'}
                        avatarUrl={profile?.avatarUrl ?? null}
                    />
                ))
            )}

            {/* Sign Out */}
            <Pressable style={styles.button} onPress={handleSignOut}>
                <Text style={styles.buttonText}>Log Out</Text>
            </Pressable>


        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        backgroundColor: '#ffffff',
    },
    content: {
        padding: 20,
        paddingTop: 65,
        paddingBottom: 20,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 5,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E8824A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarIcon: {
        fontSize: 40,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000000',
    },
    bio: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666666',
        marginTop: 4,
        marginBottom: 24,
        paddingHorizontal: 32,
        fontStyle: 'italic',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        fontStyle: 'italic',
        color: '#000000',
        marginBottom: 12,
        paddingHorizontal: 24,
    },
    achievementsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    achievementCard: {
        flex: 1,
        backgroundColor: '#84FF8D',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4DBF4D',
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: 1,
    },
    achievementValue: {
        fontSize: 18,
        fontWeight: 'bold',
        fontStyle: 'italic',
        color: '#000000',
        textAlign: 'center',
    },
    achievementLabel: {
        fontSize: 16,
        fontStyle: 'italic',
        color: '#000000',
        textAlign: 'center',
        marginTop: 4,
    },
    emptyText: {
        color: '#888888',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 20,
        fontSize: 16,
        paddingHorizontal: 24,
    },
    errorText: {
        color: '#FF4444',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 20,
        fontSize: 16,
        paddingHorizontal: 24,
    },
    button: { 
        marginTop: 40, 
        padding: 12, 
        backgroundColor: "#6C2BFF", 
        borderRadius: 8 
    },
    buttonText: {
         color: "#fff", 
         fontWeight: "bold",
         fontSize: 16,
         textAlign: "center" 
        }
});