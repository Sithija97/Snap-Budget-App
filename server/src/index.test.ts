import { describe, it, expect } from "vitest";
import app from "./index";
import type { Env } from "./types";

// Never actually read — every request below is rejected before the auth
// middleware touches the DB or Clerk, so these can be nonsense values.
const fakeEnv: Env["Bindings"] = {
  DATABASE_URL: "postgres://fake",
  CLERK_SECRET_KEY: "sk_test_fake",
  RATE_LIMIT_KV: {} as KVNamespace,
  GEMINI_API_KEY: "fake",
  CLOUDINARY_CLOUD_NAME: "fake",
  CLOUDINARY_API_KEY: "fake",
  CLOUDINARY_API_SECRET: "fake",
};

describe("GET /", () => {
  it("responds without requiring auth", async () => {
    const res = await app.request("/", {}, fakeEnv);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, service: "snapbudget-api" });
  });
});

describe("protected routes", () => {
  const routes = [
    "/api/wallets",
    "/api/categories",
    "/api/budgets",
    "/api/transactions",
    "/api/scan",
    "/api/receipts/some-key",
  ];

  for (const route of routes) {
    it(`rejects ${route} with no Authorization header`, async () => {
      const res = await app.request(route, {}, fakeEnv);
      expect(res.status).toBe(401);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBeTruthy();
    });
  }
});
