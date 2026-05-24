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
import { Receipt, Globe } from "lucide-react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-brand-black">
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
          <View className="w-13 h-13 bg-brand-green rounded-2xl items-center justify-center mt-4">
            {/* <Receipt size={28} color="#fff" /> */}
          </View>

          {/* Title */}
          <Text className="text-white text-3xl font-medium leading-tight mt-6">
            {"Budget smarter,\nnot harder."}
          </Text>
          <Text className="text-brand-muted text-sm mt-3">
            {"Snap receipts. Track budgets.\nKnow exactly where it all goes."}
          </Text>

          <View className="mt-8 gap-3">
            {/* Email input */}
            <TextInput
              className="h-12 rounded-xl px-4 text-white text-sm bg-[#1e293b] border border-[#334155]"
              placeholder="Email address"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {/* Password input */}
            <TextInput
              className="h-12 rounded-xl px-4 text-white text-sm bg-[#1e293b] border border-[#334155]"
              placeholder="Password"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* Sign in button */}
            <TouchableOpacity
              className="h-12 bg-brand-green rounded-xl items-center justify-center mt-1"
              onPress={() => router.replace("/(tabs)")}
              activeOpacity={0.8}
            >
              <Text className="text-white font-medium text-sm">Sign in</Text>
            </TouchableOpacity>

            {/* OR divider */}
            <View className="flex-row items-center gap-3 my-1">
              <View className="flex-1 h-px bg-[#334155]" />
              <Text className="text-brand-muted text-xs">or</Text>
              <View className="flex-1 h-px bg-[#334155]" />
            </View>

            {/* Google button */}
            <TouchableOpacity
              className="h-12 rounded-xl flex-row items-center justify-center gap-2 bg-[#1e293b] border border-[#334155]"
              activeOpacity={0.8}
            >
              <Globe size={18} color="#94A3B8" />
              <Text className="text-brand-muted text-sm">
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-1" />

          {/* Footer */}
          <View className="flex-row items-center justify-center gap-1 pb-2">
            <Text className="text-brand-muted text-xs">
              Don&apos;t have an account?
            </Text>
            <TouchableOpacity>
              <Text className="text-brand-green text-xs">Sign up free</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
