import { View, Text, StyleSheet } from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { Run } from '../types';
import { computePace } from '../utils/runUtils';

interface RunCardProps {
    run: Run;
    userName: string;
    avatarUrl: string | null;
}

// Converts firestore timestamp to readable date string
const formatDate = (timestamp: Timestamp | null | undefined): string => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function RunCard({ run, userName, _avatarUrl }: RunCardProps) {
    const pace = computePace(run.duration, run.distance);
    const date = formatDate(run.createdAt);

    return (
        <View style={styles.card}>
            {/* Avatar */}
            <View style={styles.avatar}>
                <Text style={styles.avatarIcon}>👤</Text>
            </View>

            {/* Run Details */}
            <View style={styles.details}>

                {/* Row 1: Title + Type Badge */}
                <View style={styles.row}>
                    <Text style={styles.title} numberOfLines={1}>{run.title}</Text>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{run.type}</Text>
                    </View>
                </View>

                {/* Row 2: Distance, Duration, Pace */}
                <Text style={styles.stats}>
                    {run.distance}km · {run.duration} · {pace}
                </Text>

                {/* Row 3: Username, Date */}
                <Text style={styles.meta}>
                    {userName} · {date}
                </Text>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#81818130',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        gap: 12,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FF8538',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarIcon: {
        fontSize: 32,
    },
    details: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        flexShrink: 1,
    },
    typeBadge: {
        backgroundColor: '#FF8538',
        borderRadius: 1,
        borderWidth: 0.5,
        borderColor: '#2C2C2C',
        paddingHorizontal: 6,
        paddingVertical: 1,
    },
    typeBadgeText: {
        color: '#000000',
        paddingHorizontal: 6,
        paddingVertical: 2,
        fontSize: 15,
        fontWeight: '600',
    },
    stats: {
        fontSize: 16,
        color: '#000000',
        width: '100%',
    },
    meta: {
        fontSize: 14,
        color: '#000000',
        width: '100%',
    },
});