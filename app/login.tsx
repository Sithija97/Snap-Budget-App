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
import { Colors } from "@/constants/theme";

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
    <SafeAreaView className="flex-1 bg-brand-black" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View className="flex-row items-center gap-3 mt-2 mb-10">
            <View
              className="w-[52px] h-[52px] bg-brand-green rounded-2xl items-center justify-center"
              style={{
                shadowColor: Colors.green,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text className="text-2xl">🧾</Text>
            </View>
            <View>
              <Text className="text-[18px] font-bold text-white">SnapBudget</Text>
              <Text className="text-[11px] text-brand-muted">Personal finance</Text>
            </View>
          </View>

          {/* Heading */}
          <Text className="text-[32px] font-bold text-white leading-10 mb-2">
            {"Your money,\nfinally clear."}
          </Text>
          <Text className="text-[14px] text-brand-muted leading-[22px] mb-10">
            {"Snap receipts. Track budgets.\nKnow exactly where it all goes."}
          </Text>

          {/* Email */}
          <View className="h-[52px] rounded-[14px] border border-[#334155] px-4 flex-row items-center mb-3 bg-[#1E293B]">
            <TextInput
              className="flex-1 text-[14px] text-white"
              placeholder="Email address"
              placeholderTextColor={Colors.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password */}
          <View className="h-[52px] rounded-[14px] border border-[#334155] px-4 flex-row items-center mb-5 bg-[#1E293B]">
            <TextInput
              className="flex-1 text-[14px] text-white"
              placeholder="Password"
              placeholderTextColor={Colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Sign in */}
          <TouchableOpacity
            className="h-[52px] bg-brand-green rounded-[14px] items-center justify-center mb-5"
            style={{
              shadowColor: Colors.green,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 6,
            }}
            onPress={() => router.replace("/(tabs)")}
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-[15px]">Sign in</Text>
          </TouchableOpacity>

          {/* OR divider */}
          <View className="flex-row items-center gap-3 mb-5">
            <View className="flex-1 h-px bg-[#334155]" />
            <Text className="text-[12px] text-brand-muted">or</Text>
            <View className="flex-1 h-px bg-[#334155]" />
          </View>

          {/* Google */}
          <TouchableOpacity
            className="h-[52px] rounded-[14px] border border-[#334155] flex-row items-center justify-center gap-2.5 bg-[#1E293B]"
            activeOpacity={0.8}
          >
            <GoogleLogo size={20} />
            <Text className="text-[14px] text-white font-medium">Continue with Google</Text>
          </TouchableOpacity>

          <View className="flex-1" />

          {/* Footer */}
          <View className="flex-row justify-center gap-1 py-2.5">
            <Text className="text-[13px] text-brand-muted">Don't have an account?</Text>
            <TouchableOpacity>
              <Text className="text-[13px] text-brand-green font-bold">Sign up free</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
