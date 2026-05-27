import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../context/Auth";
import { getAuthErrorMessage } from "../utils/authErrors";

export default function SignUp() {
    const { signUp } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");

    const validatePassword = (pwd: string) => {
        if (pwd.length < 6) {
            return "Password must be at least 6 characters.";
        }
        if (!/[A-Z]/.test(pwd)) {
            return "Password must contain at least one uppercase letter.";
        }
        if (!/[0-9]/.test(pwd)) {
            return "Password must contain at least one number.";
        }
        if (!/[!@#$%^&*]/.test(pwd)) {
            return "Password must contain a special character (!@#$%^&*).";
        }
        return null;
    };

    const handleSignUp = async () => {
        const pwdError = validatePassword(pass);
        if (pwdError) {
            Alert.alert("Invalid Password", pwdError);
            return;
        }
        try {
            await signUp(name.trim(), email.trim(), pass);
            router.replace("/(app)/(tab)/feed");
        } catch (e: any) {
            Alert.alert("Sign Up Failed", getAuthErrorMessage(e.code));
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create your Account</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Username"
                autoCapitalize="words"
            />

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

            <Pressable style={styles.button} onPress={handleSignUp}>
                <Text style={styles.buttonText}>Sign Up</Text>
            </Pressable>

            <Pressable onPress={() => router.replace("/sign-in")} style={styles.linkButton}>
                <Text style={styles.linkText}>Already have an account? Sign In</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f5f5f5" },
    title: { fontSize: 28, fontWeight: "bold", marginBottom: 32, textAlign: "center" },
    input: { borderWidth: 1, borderColor: "#ddd", padding: 16, marginBottom: 16, borderRadius: 8, backgroundColor: "#fff" },                                                                                                                                                                                                                                                            
    button: { backgroundColor: "#6C2BFF", padding: 16, borderRadius: 8, alignItems: "center", marginTop: 8 },
    buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    linkButton: { marginTop: 16, alignItems: "center"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   },
    linkText: { color: "#6C2BFF" }
});