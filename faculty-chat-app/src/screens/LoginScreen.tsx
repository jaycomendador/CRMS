import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Dimensions,
} from "react-native";
import { useAuth } from "../context/AuthContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function LoginScreen() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo & Branding */}
        <View style={styles.brandSection}>
          <View style={styles.logoRing}>
            <Text style={styles.logoIcon}>🏛️</Text>
          </View>
          <Text style={styles.appName}>CRMS Faculty</Text>
          <Text style={styles.tagline}>Classroom & Resource Management System</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Faculty Sign In</Text>
          <Text style={styles.cardSub}>
            Use your CRMS credentials to access the chat portal.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="your.email@school.edu"
            placeholderTextColor="#8899aa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#8899aa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In →</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            Contact your campus administrator if you have trouble logging in.
          </Text>
        </View>

        <Text style={styles.version}>CRMS Faculty Chat v1.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const PURPLE = "#6C47FF";
const DARK_BG = "#0d0f1c";
const CARD_BG = "#161929";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",   // ← vertically centers all content
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },

  // Branding block
  brandSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PURPLE + "33",
    borderWidth: 2,
    borderColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoIcon: {
    fontSize: 36,
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 12,
    color: "#8899bb",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 17,
  },

  // Card
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 26,
    borderWidth: 1,
    borderColor: "#ffffff15",
    shadowColor: PURPLE,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: "#8899aa",
    marginBottom: 20,
    lineHeight: 18,
  },

  // Error
  errorBox: {
    backgroundColor: "#ff4d6d22",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#ff4d6d55",
  },
  errorText: {
    color: "#ff4d6d",
    fontSize: 13,
  },

  // Form
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#aab4cc",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: "#1e2235",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffffff18",
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 16,
  },
  loginBtn: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
    shadowColor: PURPLE,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  hint: {
    textAlign: "center",
    color: "#55667788",
    fontSize: 12,
    marginTop: 16,
    lineHeight: 17,
  },

  // Footer
  version: {
    marginTop: 28,
    color: "#ffffff22",
    fontSize: 11,
  },
});
