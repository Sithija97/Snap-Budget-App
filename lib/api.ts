const API_URL = process.env.EXPO_PUBLIC_API_URL;

type TokenGetter = () => Promise<string | null>;
let tokenGetter: TokenGetter = async () => null;

// Wired up once from a component inside <ClerkProvider> (see AuthBridge in
// app/_layout.tsx) — Zustand store actions run outside React, so they can't
// call the useAuth() hook directly to get a fresh token per request.
export function setTokenGetter(fn: TokenGetter) {
  tokenGetter = fn;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL is not set");
  const token = await tokenGetter();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

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
