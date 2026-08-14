import { useCallback, useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignIn, useSignUp, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import { Chip } from "@/components/ui/Chip";
import { GoogleLogo } from "@/components/ui/GoogleLogo";
import { Input } from "@/components/ui/Input";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";

// Required once per app for the OAuth browser popup to close itself properly
WebBrowser.maybeCompleteAuthSession();

type Mode = "signIn" | "signUp" | "verify" | "forgot" | "reset";

function clerkErrorMessage(err: any, fallback: string): string {
  return err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? fallback;
}

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("signIn");
  // Which flow the "verify" screen belongs to: email verification during
  // sign-up, or an email-code first/second factor requested during sign-in
  const [verifyFlow, setVerifyFlow] =
    useState<"signUp" | "signInFirstFactor" | "signInSecondFactor">("signUp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const switchMode = (next: Mode) => {
    setMode(next);
    setCode("");
    setNewPassword("");
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
      // Clerk can require an email code on top of the password (e.g. the
      // account's email is unverified, or verification-at-sign-in is enabled)
      if (attempt.status === "needs_first_factor") {
        const emailFactor = attempt.supportedFirstFactors?.find(
          (f) => f.strategy === "email_code"
        );
        if (emailFactor) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailFactor.emailAddressId,
          });
          setVerifyFlow("signInFirstFactor");
          switchMode("verify");
          return;
        }
      }
      // MFA via email code (dashboard: Multi-factor → Email verification code)
      if (attempt.status === "needs_second_factor") {
        const emailFactor = attempt.supportedSecondFactors?.find(
          (f) => f.strategy === "email_code"
        );
        if (emailFactor) {
          await signIn.prepareSecondFactor({
            strategy: "email_code",
            emailAddressId: (emailFactor as any).emailAddressId,
          } as any);
          setVerifyFlow("signInSecondFactor");
          switchMode("verify");
          return;
        }
      }
      // e.g. 2FA or other additional factors — not implemented in this build
      const factors =
        attempt.supportedFirstFactors?.map((f) => f.strategy).join(", ") || "none";
      console.log("Sign-in incomplete", {
        status: attempt.status,
        supportedFirstFactors: attempt.supportedFirstFactors,
        supportedSecondFactors: attempt.supportedSecondFactors,
      });
      Alert.alert(
        "Additional verification required",
        `This account needs a sign-in step not supported here.\n\nstatus: ${attempt.status}\nfirst factors: ${factors}`
      );
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
      setVerifyFlow("signUp");
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

  const handleForgotPassword = useCallback(async () => {
    if (!signInLoaded || submitting) return;
    if (email.trim().length === 0) {
      Alert.alert("Enter your email", "Please enter the email address for your account.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn.create({ strategy: "reset_password_email_code", identifier: email.trim() });
      switchMode("reset");
    } catch (err: any) {
      Alert.alert(
        "Couldn't send reset code",
        clerkErrorMessage(err, "Please check the email address and try again.")
      );
    } finally {
      setSubmitting(false);
    }
  }, [signIn, email, signInLoaded, submitting]);

  const handleResetPassword = useCallback(async () => {
    if (!signInLoaded || submitting) return;
    setSubmitting(true);
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password: newPassword,
      });
      if (attempt.status === "complete") {
        await setActiveSignIn({ session: attempt.createdSessionId });
        return;
      }
      Alert.alert("Reset incomplete", "Please try the code again.");
    } catch (err: any) {
      Alert.alert("Couldn't reset password", clerkErrorMessage(err, "Please check the code and try again."));
    } finally {
      setSubmitting(false);
    }
  }, [signIn, code, newPassword, signInLoaded, submitting, setActiveSignIn]);

  const handleResendResetCode = useCallback(async () => {
    if (!signInLoaded) return;
    try {
      await signIn.create({ strategy: "reset_password_email_code", identifier: email.trim() });
      Alert.alert("Code sent", `We've sent a new code to ${email}.`);
    } catch (err: any) {
      Alert.alert("Couldn't resend code", clerkErrorMessage(err, "Please try again."));
    }
  }, [signIn, email, signInLoaded]);

  const handleVerifyCode = useCallback(async () => {
    if (!signInLoaded || !signUpLoaded || submitting) return;
    setSubmitting(true);
    try {
      if (verifyFlow === "signInFirstFactor") {
        const attempt = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: code.trim(),
        });
        if (attempt.status === "complete") {
          await setActiveSignIn({ session: attempt.createdSessionId });
          return;
        }
      } else if (verifyFlow === "signInSecondFactor") {
        const attempt = await signIn.attemptSecondFactor({
          strategy: "email_code",
          code: code.trim(),
        } as any);
        if (attempt.status === "complete") {
          await setActiveSignIn({ session: attempt.createdSessionId });
          return;
        }
      } else {
        const attempt = await signUp.attemptEmailAddressVerification({ code: code.trim() });
        if (attempt.status === "complete") {
          await setActiveSignUp({ session: attempt.createdSessionId });
          return;
        }
      }
      Alert.alert("Verification incomplete", "Please try the code again.");
    } catch (err: any) {
      Alert.alert("Invalid code", clerkErrorMessage(err, "Please check the code and try again."));
    } finally {
      setSubmitting(false);
    }
  }, [verifyFlow, signIn, signUp, code, signInLoaded, signUpLoaded, submitting, setActiveSignIn, setActiveSignUp]);

  const handleResendCode = useCallback(async () => {
    if (!signInLoaded || !signUpLoaded) return;
    try {
      if (verifyFlow === "signInFirstFactor") {
        const emailFactor = signIn.supportedFirstFactors?.find(
          (f) => f.strategy === "email_code"
        );
        if (!emailFactor) throw new Error("No email factor available");
        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: emailFactor.emailAddressId,
        });
      } else if (verifyFlow === "signInSecondFactor") {
        const emailFactor = signIn.supportedSecondFactors?.find(
          (f) => f.strategy === "email_code"
        );
        if (!emailFactor) throw new Error("No email factor available");
        await signIn.prepareSecondFactor({
          strategy: "email_code",
          emailAddressId: (emailFactor as any).emailAddressId,
        } as any);
      } else {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      }
      Alert.alert("Code sent", `We've sent a new code to ${email}.`);
    } catch (err: any) {
      Alert.alert("Couldn't resend code", clerkErrorMessage(err, "Please try again."));
    }
  }, [verifyFlow, signIn, signUp, signInLoaded, signUpLoaded, email]);

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

            {/* Auth form on a card surface, matching the app-wide borderless design */}
            <Card className="p-5">
            {mode !== "verify" && mode !== "forgot" && mode !== "reset" && (
              <View className="flex-row justify-center gap-6 mb-6">
                <Chip variant="underline" label="Sign in" selected={mode === "signIn"} onPress={() => switchMode("signIn")} />
                <Chip variant="underline" label="Sign up" selected={mode === "signUp"} onPress={() => switchMode("signUp")} />
              </View>
            )}

            {mode === "forgot" ? (
              <>
                <UIText size="sm" variant="muted" className="text-center mb-4">
                  Enter your email and we'll send you a password reset code.
                </UIText>
                <Input
                  placeholder="Email address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoFocus
                />
                <Button
                  label={submitting ? "Sending..." : "Send reset code"}
                  variant="default"
                  className="mt-4 w-full"
                  disabled={email.trim().length === 0 || submitting}
                  onPress={handleForgotPassword}
                />
                <AnimatedPressable onPress={() => switchMode("signIn")} className="mt-4 items-center">
                  <UIText size="sm" variant="muted">Back to sign in</UIText>
                </AnimatedPressable>
              </>
            ) : mode === "reset" ? (
              <>
                <UIText size="sm" variant="muted" className="text-center mb-4">
                  Enter the code we sent to {email} and choose a new password.
                </UIText>
                <Input
                  placeholder="6-digit code"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  autoFocus
                />
                <Input
                  style={{ marginTop: 8 }}
                  placeholder="New password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <Button
                  label={submitting ? "Resetting..." : "Reset password"}
                  variant="default"
                  className="mt-4 w-full"
                  disabled={code.trim().length === 0 || newPassword.length === 0 || submitting}
                  onPress={handleResetPassword}
                />
                <AnimatedPressable onPress={handleResendResetCode} className="mt-4 items-center">
                  <UIText size="sm" variant="muted">Resend code</UIText>
                </AnimatedPressable>
                <AnimatedPressable onPress={() => switchMode("signIn")} className="mt-2 items-center">
                  <UIText size="sm" variant="muted">Back to sign in</UIText>
                </AnimatedPressable>
              </>
            ) : mode === "verify" ? (
              <>
                <UIText size="sm" variant="muted" className="text-center mb-4">
                  Enter the code we sent to {email}
                </UIText>
                <Input
                  placeholder="6-digit code"
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
                <AnimatedPressable onPress={handleResendCode} className="mt-4 items-center">
                  <UIText size="sm" variant="muted">Resend code</UIText>
                </AnimatedPressable>
                <AnimatedPressable
                  onPress={() => switchMode(verifyFlow === "signUp" ? "signUp" : "signIn")}
                  className="mt-2 items-center"
                >
                  <UIText size="sm" variant="muted">
                    {verifyFlow === "signUp" ? "Use a different email" : "Back to sign in"}
                  </UIText>
                </AnimatedPressable>
              </>
            ) : (
              <>
                {/* Email */}
                <Input
                  placeholder="Email address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                {/* Password */}
                <Input
                  style={{ marginTop: 8 }}
                  placeholder="Password"
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

                {mode === "signIn" && (
                  <AnimatedPressable
                    onPress={() => switchMode("forgot")}
                    className="mt-3 items-center"
                  >
                    <UIText size="sm" variant="muted">Forgot password?</UIText>
                  </AnimatedPressable>
                )}

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
                  icon={<GoogleLogo />}
                  onPress={handleGoogleAuth}
                />
              </>
            )}
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
