import { useCallback, useState } from "react";
import {
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignIn, useSignUp, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useTheme } from "@/context/ThemeContext";
import { UIText } from "@/components/ui/UIText";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import { Chip } from "@/components/ui/Chip";

// Required once per app for the OAuth browser popup to close itself properly
WebBrowser.maybeCompleteAuthSession();

type Mode = "signIn" | "signUp" | "verify";

function clerkErrorMessage(err: any, fallback: string): string {
  return err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? fallback;
}

export default function LoginScreen() {
  const { isDark } = useTheme();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const inputBg        = isDark ? '#09090b' : '#ffffff';
  const inputBorder    = isDark ? '#27272a' : '#e4e4e7';
  const inputText      = isDark ? '#fafafa' : '#09090b';
  const placeholderClr = isDark ? '#71717a' : '#a1a1aa';

  const inputStyle = {
    height: 44,
    borderWidth: 1,
    borderColor: inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: inputBg,
    color: inputText,
    fontSize: 15,
  } as const;

  const switchMode = (next: Mode) => {
    setMode(next);
    setCode("");
  };

  const handleSignIn = useCallback(async () => {
    if (!signInLoaded || submitting) return;
    setSubmitting(true);
    try {
      const attempt = await signIn.create({ identifier: email, password });
      if (attempt.status === "complete") {
        await setActiveSignIn({ session: attempt.createdSessionId });
        return;
      }
      // e.g. 2FA or other additional factors — not implemented in this build
      Alert.alert("Additional verification required", "This account needs a sign-in method not yet supported here.");
    } catch (err: any) {
      Alert.alert("Sign in failed", clerkErrorMessage(err, "Please check your email and password."));
    } finally {
      setSubmitting(false);
    }
  }, [signIn, email, password, signInLoaded, submitting, setActiveSignIn]);

  const handleSignUp = useCallback(async () => {
    if (!signUpLoaded || submitting) return;
    setSubmitting(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      switchMode("verify");
    } catch (err: any) {
      const exists = err?.errors?.some((e: any) => e.code === "form_identifier_exists");
      if (exists) {
        Alert.alert("Account already exists", "Sign in instead.");
        switchMode("signIn");
      } else {
        Alert.alert("Sign up failed", clerkErrorMessage(err, "Please try again."));
      }
    } finally {
      setSubmitting(false);
    }
  }, [signUp, email, password, signUpLoaded, submitting]);

  const handleVerifyCode = useCallback(async () => {
    if (!signUpLoaded || submitting) return;
    setSubmitting(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (attempt.status === "complete") {
        await setActiveSignUp({ session: attempt.createdSessionId });
        return;
      }
      Alert.alert("Verification incomplete", "Please try the code again.");
    } catch (err: any) {
      Alert.alert("Invalid code", clerkErrorMessage(err, "Please check the code and try again."));
    } finally {
      setSubmitting(false);
    }
  }, [signUp, code, signUpLoaded, submitting, setActiveSignUp]);

  const handleResendCode = useCallback(async () => {
    if (!signUpLoaded) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      Alert.alert("Code sent", `We've sent a new code to ${email}.`);
    } catch (err: any) {
      Alert.alert("Couldn't resend code", clerkErrorMessage(err, "Please try again."));
    }
  }, [signUp, signUpLoaded, email]);

  const handleGoogleAuth = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/(tabs)"),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err: any) {
      Alert.alert("Google sign-in failed", err?.message ?? "Please try again.");
    }
  }, [startOAuthFlow]);

  const canSubmitCredentials = email.trim().length > 0 && password.length > 0 && !submitting;
  const canSubmitCode = code.trim().length > 0 && !submitting;

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
            <View className="items-center mb-8">
              <UIText size="xl" variant="heading" className="text-center">SnapBudget</UIText>
              <UIText size="sm" variant="muted" className="text-center mt-1">
                Personal finance, made simple
              </UIText>
            </View>

            {mode !== "verify" && (
              <View className="flex-row justify-center gap-6 mb-6">
                <Chip variant="underline" label="Sign in" selected={mode === "signIn"} onPress={() => switchMode("signIn")} />
                <Chip variant="underline" label="Sign up" selected={mode === "signUp"} onPress={() => switchMode("signUp")} />
              </View>
            )}

            {mode === "verify" ? (
              <>
                <UIText size="sm" variant="muted" className="text-center mb-4">
                  Enter the code we sent to {email}
                </UIText>
                <TextInput
                  style={inputStyle}
                  placeholder="6-digit code"
                  placeholderTextColor={placeholderClr}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  autoFocus
                />
                <Button
                  label={submitting ? "Verifying..." : "Verify"}
                  variant="default"
                  className="mt-4 w-full"
                  disabled={!canSubmitCode}
                  onPress={handleVerifyCode}
                />
                <TouchableOpacity onPress={handleResendCode} activeOpacity={0.7} className="mt-4 items-center">
                  <UIText size="sm" variant="muted">Resend code</UIText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => switchMode("signUp")} activeOpacity={0.7} className="mt-2 items-center">
                  <UIText size="sm" variant="muted">Use a different email</UIText>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Email */}
                <TextInput
                  style={inputStyle}
                  placeholder="Email address"
                  placeholderTextColor={placeholderClr}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                {/* Password */}
                <TextInput
                  style={{ ...inputStyle, marginTop: 8 }}
                  placeholder="Password"
                  placeholderTextColor={placeholderClr}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <Button
                  label={submitting ? "Please wait..." : mode === "signIn" ? "Sign in" : "Create account"}
                  variant="default"
                  className="mt-4 w-full"
                  disabled={!canSubmitCredentials}
                  onPress={mode === "signIn" ? handleSignIn : handleSignUp}
                />

                {/* OR */}
                <View className="flex-row items-center gap-3 my-5">
                  <Separator className="flex-1" />
                  <UIText size="sm" variant="muted">or</UIText>
                  <Separator className="flex-1" />
                </View>

                {/* Google */}
                <Button
                  label="Continue with Google"
                  variant="outline"
                  className="w-full"
                  onPress={handleGoogleAuth}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
