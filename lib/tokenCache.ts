import * as SecureStore from "expo-secure-store";
import type { TokenCache } from "@clerk/clerk-expo";

// Clerk's recommended pattern for Expo: session tokens are sensitive and
// must not sit in plain AsyncStorage — SecureStore is backed by Keychain
// (iOS) / Keystore (Android).
export const tokenCache: TokenCache = {
  getToken: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  saveToken: async (key: string, token: string) => {
    try {
      await SecureStore.setItemAsync(key, token);
    } catch {
      // best-effort — swallow write errors (e.g. simulator keychain issues)
    }
  },
};
