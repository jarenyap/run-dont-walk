import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

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

export default function SearchScreen() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={styles.title}> Search Screen</Text>
            <Text style={styles.subtitle}> Coming Soon! Stay Tuned! :)</Text>
            <TouchableOpacity onPress={() => router.push("/(app)/home-feed")}>
                <Text style={{ color: "#FF6B35", marginTop: 20, fontSize: 16 }}>Back to Home</Text>
            </TouchableOpacity>
         </View>
    );
}