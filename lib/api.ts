export const API_URL = process.env.EXPO_PUBLIC_API_URL;

type TokenGetter = () => Promise<string | null>;
let tokenGetter: TokenGetter = async () => null;

// Wired up once from a component inside <ClerkProvider> (see AuthBridge in
// app/_layout.tsx) — Zustand store actions run outside React, so they can't
// call the useAuth() hook directly to get a fresh token per request.
export function setTokenGetter(fn: TokenGetter) {
  tokenGetter = fn;
}

// Generous enough to cover the slowest route (assistant/ask can make two
// sequential Gemini calls server-side, each capped at 15s there) plus DB
// time — without this, a stalled connection just hangs the UI forever
// instead of failing with a message the user (and Alert.alert) can show.
const REQUEST_TIMEOUT_MS = 35_000;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL is not set");
  const token = await tokenGetter();

  // AbortSignal.timeout() isn't available in this Hermes runtime — a manual
  // AbortController + setTimeout is the portable equivalent.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (e: any) {
    // A stalled/dropped connection (or an aborted request) can reject with a
    // DOMException or bare TypeError that has no useful .message on RN — give
    // callers something readable instead of an empty string, so
    // Alert.alert(...) always shows real information.
    if (e?.name === "AbortError" || e?.name === "TimeoutError") {
      throw new Error("The request took too long. Check your connection and try again.");
    }
    throw new Error(e?.message || "Network request failed. Check your connection and try again.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: (path: string) => request<{ ok: true }>(path, { method: "DELETE" }),
};
