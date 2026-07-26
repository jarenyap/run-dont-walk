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
import { validatePassword, validateEmail } from "../utils/validation";
import { getAuthErrorMessage } from "../utils/authErrors";
import { colors, spacing, radius, typography } from "../theme";

export default function SignUp() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const handleSignUp = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Missing name", "Please enter your name.");
      return;
    }
    const trimmedEmail = email.trim();
    if (!validateEmail(trimmedEmail)) {
      Alert.alert(
        "Invalid email",
        "Please enter a valid email address."
      );
      return;
    }
    const passwordError = validatePassword(pass);
    if (passwordError) {
      Alert.alert("Invalid password", passwordError);
      return;
    }
    try {
      await signUp(trimmedName, trimmedEmail, pass);
      router.replace("/(app)/(tabs)/home-feed");
    } catch (e: any) {
      Alert.alert("Sign up failed", getAuthErrorMessage(e.code));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Walk Don't Run</Text>

      <Text style={styles.title}>Create account</Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Name"
        placeholderTextColor={colors.textTertiary}
        autoCapitalize="words"
      />

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

      <Pressable style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace("/sign-in")}
        style={styles.linkButton}
      >
        <Text style={styles.linkText}>
          Already have an account?{" "}
          <Text style={{ color: colors.accentBlue, fontWeight: "600" }}>
            Sign in
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
