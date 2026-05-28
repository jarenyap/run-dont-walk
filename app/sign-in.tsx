import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../context/Auth";
import { getAuthErrorMessage } from "../utils/authErrors";

export default function SignIn() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");

    const handleSignIn = async () => {
        try {
            await signIn(email.trim(), pass);
            router.replace("/(app)/(tabs)/home-feed");
        } catch (e: any) {
            Alert.alert("Sign In Failed", getAuthErrorMessage(e.code));
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sign In</Text>
            <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                value={pass}
                onChangeText={setPass}
                placeholder="Password"
                secureTextEntry
            />

            <Pressable style={styles.button} onPress={handleSignIn}>
                <Text style={styles.buttonText}>Sign In</Text>
            </Pressable>
            
            <Pressable onPress={() => router.replace("/sign-up")} style={styles.linkButton}>
                <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        justifyContent: "center", 
        padding: 24, 
        backgroundColor: "#f5f5f5" 
    },
    title: { 
        fontSize: 28, 
        fontWeight: "bold", 
        marginBottom: 32, 
        textAlign: "center" 
    },
    input: { 
        borderWidth: 1, 
        borderColor: "#ddd", 
        padding: 16, 
        marginBottom: 16, 
        borderRadius: 8, 
        backgroundColor: "#fff" 
    },
    button: { 
        backgroundColor: "#6C2BFF", 
        padding: 16, 
        borderRadius: 8, 
        alignItems: "center", 
        marginTop: 8 
    },
    buttonText: { 
        color: "#fff", 
        fontWeight: "bold", 
        fontSize: 16 
    },
    linkButton: { 
        marginTop: 16, 
        alignItems: "center"
    },
    linkText: { 
        color: "#6C2BFF" 
    }
});