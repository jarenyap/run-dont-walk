import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router }  from 'expo-router';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#5F19FF',
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 22,
        fontWeight: '600',
    },
});

export default function LogRun() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Log a Run</Text>
            <Text style={styles.subtitle}>Coming Soon! Stay Tuned! :)</Text>
            <Pressable style={styles.button} onPress={() => router.back()}>
                <Text style={styles.buttonText}>Go Back</Text>
            </Pressable>
        </View>
    );
}