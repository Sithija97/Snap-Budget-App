import { randomUUID } from "expo-crypto";

// Hermes has no global crypto.randomUUID — expo-crypto provides the same API
export const generateId = (): string => randomUUID();
