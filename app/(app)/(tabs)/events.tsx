import { View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold'
    },
    subtitle: {
        fontSize: 22,
        fontWeight: '600'
    },
});

export default function EventsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}> Events Screen</Text>
            <Text style={styles.subtitle}> Coming Soon! Stay Tuned! :)</Text>
        </View>
    );
}