import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const C = {
  green: "#00C170",
  text: "#1A1D23",
  sub: "#8A94A6",
  border: "#F0F2F7",
  bg: "#F5F7FC",
  card: "#FFFFFF",
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.card }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginTop: 8,
              marginBottom: 28,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                backgroundColor: C.green,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 22 }}>🧾</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: C.text }}>
              SnapBudget
            </Text>
          </View>

          {/* Heading */}
          <Text
            style={{
              fontSize: 26,
              fontWeight: "700",
              color: C.text,
              lineHeight: 34,
              marginBottom: 6,
            }}
          >
            {"Track every rupee,\neffortlessly. 💸"}
          </Text>
          <Text style={{ fontSize: 14, color: C.sub, marginBottom: 32 }}>
            Sign in to your account below
          </Text>

          {/* Email input */}
          <View
            style={{
              height: 50,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: C.border,
              paddingHorizontal: 14,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
              backgroundColor: C.card,
            }}
          >
            <TextInput
              style={{ flex: 1, fontSize: 14, color: C.text }}
              placeholder="Email address"
              placeholderTextColor={C.sub}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password input */}
          <View
            style={{
              height: 50,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: C.border,
              paddingHorizontal: 14,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 18,
              backgroundColor: C.card,
            }}
          >
            <TextInput
              style={{ flex: 1, fontSize: 14, color: C.text }}
              placeholder="Password"
              placeholderTextColor={C.sub}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Sign in button */}
          <TouchableOpacity
            style={{
              height: 50,
              backgroundColor: C.green,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
            onPress={() => router.replace("/(tabs)")}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
              Sign in
            </Text>
          </TouchableOpacity>

          {/* OR divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
            <Text style={{ fontSize: 12, color: C.sub }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
          </View>

          {/* Google button */}
          <TouchableOpacity
            style={{
              height: 50,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: C.card,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 18 }}>🔵</Text>
            <Text style={{ fontSize: 14, color: C.text, fontWeight: "500" }}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          {/* Footer */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 4,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontSize: 13, color: C.sub }}>No account?</Text>
            <TouchableOpacity>
              <Text style={{ fontSize: 13, color: C.green, fontWeight: "600" }}>
                Sign up free
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
