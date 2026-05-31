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
import Svg, { Path } from "react-native-svg";
import { router } from "expo-router";

const C = {
  dark:        "#0F1117",
  darkCard:    "#1E293B",
  darkBorder:  "#334155",
  green:       "#1D9E75",
  greenBg:     "#E6F4EE",
  text:        "#FFFFFF",
  sub:         "#94A3B8",
};

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.dark }} edges={["top"]}>
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
              gap: 12,
              marginTop: 8,
              marginBottom: 40,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                backgroundColor: C.green,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: C.green,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text style={{ fontSize: 24 }}>🧾</Text>
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
              fontSize: 32,
              fontWeight: "700",
              color: C.text,
              lineHeight: 40,
              marginBottom: 8,
            }}
          >
            {"Your money,\nfinally clear."}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: C.sub,
              lineHeight: 22,
              marginBottom: 40,
            }}
          >
            {"Snap receipts. Track budgets.\nKnow exactly where it all goes."}
          </Text>

          {/* Email */}
          <View
            style={{
              height: 52,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: C.darkBorder,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
              backgroundColor: C.darkCard,
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
              borderColor: C.darkBorder,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
              backgroundColor: C.darkCard,
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
              marginBottom: 20,
              shadowColor: C.green,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
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
              marginBottom: 20,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: C.darkBorder }} />
            <Text style={{ fontSize: 12, color: C.sub }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: C.darkBorder }} />
          </View>

          {/* Google */}
          <TouchableOpacity
            style={{
              height: 52,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: C.darkBorder,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              backgroundColor: C.darkCard,
            }}
            activeOpacity={0.8}
          >
            <GoogleLogo size={20} />
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
            <Text style={{ fontSize: 13, color: C.sub }}>Don't have an account?</Text>
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
