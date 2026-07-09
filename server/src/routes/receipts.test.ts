import { describe, it, expect, vi } from "vitest";
import { Hono } from "hono";
import { receiptsRoute } from "./receipts";
import type { Env } from "../types";

// getSignedDownloadUrl does a real network round-trip to Cloudinary — this
// test is only about routing/authorization, so it's stubbed.
vi.mock("../lib/cloudinary", () => ({
  getSignedDownloadUrl: vi.fn(async (_env: unknown, key: string) => `https://cloudinary.test/${key}`),
}));

// Hono's ":key{.+}" param is the only thing standing between "userId/uuid"
// (a key with a slash) being captured whole vs. truncated at the first
// segment — a truncated capture would silently defeat the userId-prefix
// check below and either 404 everything or (worse) let it through wrong.
function appWithFakeAuth() {
  const app = new Hono<Env>();
  app.use("*", async (c, next) => {
    c.set("userId", "user_abc");
    await next();
  });
  app.route("/api/receipts", receiptsRoute);
  return app;
}

describe("GET /api/receipts/:key", () => {
  it("captures a key containing a slash and redirects to the signed URL", async () => {
    const app = appWithFakeAuth();
    const res = await app.request("/api/receipts/user_abc/some-uuid", { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://cloudinary.test/user_abc/some-uuid");
  });

  it("rejects a key belonging to a different user", async () => {
    const app = appWithFakeAuth();
    const res = await app.request("/api/receipts/user_other/some-uuid", { redirect: "manual" });
    expect(res.status).toBe(404);
  });
});
