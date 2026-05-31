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
  dark:    "#0F1117",
  green:   "#1D9E75",
  greenBg: "#E6F4EE",
  text:    "#0F1117",
  sub:     "#94A3B8",
  border:  "#E8EDF2",
  surface: "#F8F9FA",
  card:    "#FFFFFF",
};

export default function LoginScreen() {
  const [email, setEmail]       = useState("");
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
              marginBottom: 32,
            }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                backgroundColor: C.dark,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: C.dark,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 22 }}>🧾</Text>
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>
                SnapBudget
              </Text>
              <Text style={{ fontSize: 11, color: C.sub }}>Personal finance</Text>
            </View>
          </View>

          {/* Heading */}
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: C.text,
              lineHeight: 36,
              marginBottom: 6,
            }}
          >
            {"Track every rupee,\neffortlessly."}
          </Text>
          <Text style={{ fontSize: 14, color: C.sub, marginBottom: 36 }}>
            Sign in to your account below
          </Text>

          {/* Email */}
          <View
            style={{
              height: 52,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: C.border,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
              backgroundColor: C.surface,
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

          {/* Password */}
          <View
            style={{
              height: 52,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: C.border,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
              backgroundColor: C.surface,
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

          {/* Sign in */}
          <TouchableOpacity
            style={{
              height: 52,
              backgroundColor: C.green,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              shadowColor: C.green,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 6,
            }}
            onPress={() => router.replace("/(tabs)")}
            activeOpacity={0.85}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
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

          {/* Google */}
          <TouchableOpacity
            style={{
              height: 52,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: C.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              backgroundColor: C.surface,
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
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontSize: 13, color: C.sub }}>No account?</Text>
            <TouchableOpacity>
              <Text style={{ fontSize: 13, color: C.green, fontWeight: "700" }}>
                Sign up free
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
