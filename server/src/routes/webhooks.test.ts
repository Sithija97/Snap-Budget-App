import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { webhooksRoute } from "./webhooks";
import type { Env } from "../types";

function app() {
  const app = new Hono<Env>();
  app.route("/webhooks", webhooksRoute);
  return app;
}

const fakeEnv: Env["Bindings"] = {
  DATABASE_URL: "postgres://fake",
  CLERK_SECRET_KEY: "fake",
  RATE_LIMIT_KV: {} as KVNamespace,
  GEMINI_API_KEY: "fake",
  CLOUDINARY_CLOUD_NAME: "fake",
  CLOUDINARY_API_KEY: "fake",
  CLOUDINARY_API_SECRET: "fake",
  TELEGRAM_BOT_TOKEN: "fake",
  TELEGRAM_WEBHOOK_SECRET: "correct-secret",
  TELEGRAM_BOT_USERNAME: "fake_bot",
};

describe("POST /webhooks/telegram", () => {
  it("rejects a call with no secret token header", async () => {
    const res = await app().request(
      "/webhooks/telegram",
      { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } },
      fakeEnv
    );
    expect(res.status).toBe(401);
  });

  it("rejects a call with the wrong secret token", async () => {
    const res = await app().request(
      "/webhooks/telegram",
      {
        method: "POST",
        body: "{}",
        headers: { "Content-Type": "application/json", "X-Telegram-Bot-Api-Secret-Token": "wrong" },
      },
      fakeEnv
    );
    expect(res.status).toBe(401);
  });

  it("still acknowledges Telegram with 200 even when the DB lookup fails (fake DATABASE_URL)", async () => {
    // A non-/start message now looks up the chat's link, which requires a
    // real DB connection — DATABASE_URL is fake here, so this exercises the
    // route's own error handling rather than a short-circuit. Telegram must
    // always get its 200 back regardless (see webhooks.ts's try/catch), or
    // Telegram will keep retrying the same failed update.
    const res = await app().request(
      "/webhooks/telegram",
      {
        method: "POST",
        body: JSON.stringify({ message: { chat: { id: 1, type: "private" }, text: "hello" } }),
        headers: { "Content-Type": "application/json", "X-Telegram-Bot-Api-Secret-Token": "correct-secret" },
      },
      fakeEnv
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
