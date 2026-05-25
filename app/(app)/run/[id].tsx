import { View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    title: {
        fontSize: 28,
        fontWeight: 'bold'
    },
    subtitle: {
        fontSize: 22,
        fontWeight: '600'
    },
});

export default function RunDetailScreen() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={styles.title}> Run Detail Screen</Text>
            <Text style={styles.subtitle}> Coming Soon! Stay Tuned! :)</Text>
        </View>
    );
}