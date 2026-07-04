import { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { UIText } from "@/components/ui/UIText";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";

export default function LoginScreen() {
  const { isDark } = useTheme();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  const inputBg        = isDark ? '#09090b' : '#ffffff';
  const inputBorder    = isDark ? '#27272a' : '#e4e4e7';
  const inputText      = isDark ? '#fafafa' : '#09090b';
  const placeholderClr = isDark ? '#71717a' : '#a1a1aa';

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center">
            {/* Brand */}
            <View className="items-center mb-12">
              <UIText size="xl" variant="heading" className="text-center">SnapBudget</UIText>
              <UIText size="sm" variant="muted" className="text-center mt-1">
                Personal finance, made simple
              </UIText>
            </View>

            {/* Email */}
            <TextInput
              style={{
                height: 44,
                borderWidth: 1,
                borderColor: inputBorder,
                borderRadius: 8,
                paddingHorizontal: 12,
                backgroundColor: inputBg,
                color: inputText,
                fontSize: 15,
              }}
              placeholder="Email address"
              placeholderTextColor={placeholderClr}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {/* Password */}
            <TextInput
              style={{
                height: 44,
                borderWidth: 1,
                borderColor: inputBorder,
                borderRadius: 8,
                paddingHorizontal: 12,
                backgroundColor: inputBg,
                color: inputText,
                fontSize: 15,
                marginTop: 8,
              }}
              placeholder="Password"
              placeholderTextColor={placeholderClr}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* Sign in */}
            <Button
              label="Sign in"
              variant="default"
              className="mt-4 w-full"
              onPress={() => router.replace("/(tabs)")}
            />

            {/* OR */}
            <View className="flex-row items-center gap-3 my-5">
              <Separator className="flex-1" />
              <UIText size="sm" variant="muted">or</UIText>
              <Separator className="flex-1" />
            </View>

            {/* Google */}
            <Button label="Continue with Google" variant="outline" className="w-full" />
          </View>

          {/* Footer */}
          <View className="flex-row justify-center items-center gap-1 py-6">
            <UIText size="sm" variant="muted">Don't have an account?</UIText>
            <TouchableOpacity activeOpacity={0.7}>
              <UIText size="sm" variant="heading"> Sign up</UIText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
