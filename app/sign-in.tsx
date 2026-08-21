import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../context/Auth";
import { getAuthErrorMessage } from "../utils/authErrors";
import { colors, spacing, radius, typography } from "../theme";

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
      <Text style={styles.brand}>Run Don't Walk</Text>

      <Text style={styles.title}>Sign in</Text>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={colors.textTertiary}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        value={pass}
        onChangeText={setPass}
        placeholder="Password"
        placeholderTextColor={colors.textTertiary}
        secureTextEntry
      />

      <Pressable style={styles.button} onPress={handleSignIn}>
        <Text style={styles.buttonText}>Sign In</Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace("/sign-up")}
        style={styles.linkButton}
      >
        <Text style={styles.linkText}>
          Don't have an account?{" "}
          <Text style={{ color: colors.accentBlue, fontWeight: "600" }}>
            Sign up
          </Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.bgPrimary,
  },
  brand: {
    fontSize: typography.displayMedium.fontSize,
    fontWeight: typography.displayMedium.fontWeight,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.displayLarge.fontSize,
    fontWeight: typography.displayLarge.fontWeight,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.sm,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.accentBlue,
    padding: spacing.md,
    borderRadius: radius.sm,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
  linkButton: {
    marginTop: spacing.lg,
    alignItems: "center",
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
  },
});
