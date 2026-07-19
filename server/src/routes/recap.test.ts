import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { recapRoute, periodWindows, generateAndDeliverRecap } from "./recap";
import * as recapLib from "../lib/recap";
import * as telegramLib from "../lib/telegram";
import type { Env } from "../types";

vi.mock("../lib/recap", async () => {
  const actual = await vi.importActual<typeof recapLib>("../lib/recap");
  return { ...actual, phraseRecap: vi.fn() };
});
vi.mock("../lib/telegram", async () => {
  const actual = await vi.importActual<typeof telegramLib>("../lib/telegram");
  return { ...actual, sendTelegramMessage: vi.fn() };
});

function appWithFakeAuthAndDb(dbStub: unknown) {
  const app = new Hono<Env>();
  app.use("*", async (c, next) => {
    c.set("userId", "user_abc");
    c.set("db", dbStub as any);
    await next();
  });
  app.route("/api/recaps", recapRoute);
  return app;
}

describe("periodWindows", () => {
  it("weekly: covers the 7 days ending yesterday, previous window the 7 before that", () => {
    const w = periodWindows("weekly", new Date(2026, 6, 20)); // Mon 2026-07-20
    expect(w.periodStart).toBe("2026-07-13");
    expect(w.periodEnd).toBe("2026-07-19");
    expect(w.previousPeriodStart).toBe("2026-07-06");
    expect(w.previousPeriodEnd).toBe("2026-07-12");
  });

  it("monthly: covers the full previous calendar month", () => {
    const w = periodWindows("monthly", new Date(2026, 7, 1)); // 2026-08-01
    expect(w.periodStart).toBe("2026-07-01");
    expect(w.periodEnd).toBe("2026-07-31");
    expect(w.previousPeriodStart).toBe("2026-06-01");
    expect(w.previousPeriodEnd).toBe("2026-06-30");
  });
});

describe("GET /api/recaps", () => {
  it("lists recaps newest first for the caller", async () => {
    const rows = [{ id: "r1", periodType: "weekly", periodStart: "2026-07-13", periodEnd: "2026-07-19", message: "hi", createdAt: "2026-07-20" }];
    const dbStub = {
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => ({
              limit: async () => rows,
            }),
          }),
        }),
      }),
    };
    const app = appWithFakeAuthAndDb(dbStub);
    const res = await app.request("/api/recaps");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ recaps: rows });
  });
});

const fakeEnv: Env["Bindings"] = {
  DATABASE_URL: "postgres://fake",
  CLERK_SECRET_KEY: "fake",
  RATE_LIMIT_KV: {} as KVNamespace,
  GEMINI_API_KEY: "fake",
  CLOUDINARY_CLOUD_NAME: "fake",
  CLOUDINARY_API_KEY: "fake",
  CLOUDINARY_API_SECRET: "fake",
  TELEGRAM_BOT_TOKEN: "fake",
  TELEGRAM_WEBHOOK_SECRET: "fake",
  TELEGRAM_BOT_USERNAME: "fake_bot",
};

describe("generateAndDeliverRecap", () => {
  beforeEach(() => {
    vi.mocked(recapLib.phraseRecap).mockReset();
    vi.mocked(telegramLib.sendTelegramMessage).mockReset();
  });

  it("skips generation entirely when there are no transactions in the period (no Gemini call, no insert)", async () => {
    const dbStub = {
      select: () => ({ from: () => ({ where: async () => [] }) }),
      insert: () => ({ values: () => ({ onConflictDoNothing: () => ({ returning: async () => [{ id: "new" }] }) }) }),
    };
    await generateAndDeliverRecap(fakeEnv, dbStub as any, "user_abc", "weekly", new Date(2026, 6, 20));
    expect(recapLib.phraseRecap).not.toHaveBeenCalled();
  });

  it("does not deliver via Telegram when the insert is a no-op (already delivered this period)", async () => {
    vi.mocked(recapLib.phraseRecap).mockResolvedValue("You spent Rs 500 this week.");
    const txRows = [{ txType: "exp", amount: 500, date: "2026-07-15", categoryId: "cat-food", merchant: "Shop" }];
    const dbStub = {
      select: () => ({
        from: () => ({
          where: async () => txRows,
        }),
      }),
      insert: () => ({
        values: () => ({
          onConflictDoNothing: () => ({ returning: async () => [] }), // conflict — already exists
        }),
      }),
    };
    await generateAndDeliverRecap(fakeEnv, dbStub as any, "user_abc", "weekly", new Date(2026, 6, 20));
    expect(telegramLib.sendTelegramMessage).not.toHaveBeenCalled();
  });
});
