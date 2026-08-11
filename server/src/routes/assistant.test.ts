import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { assistantRoute } from "./assistant";
import * as assistantLib from "../lib/assistant";
import type { Env } from "../types";

// Route-level test: stub the Gemini-calling functions so this only exercises
// routing/validation, not a live model call — same approach receipts.test.ts
// uses for Cloudinary.
vi.mock("../lib/assistant", async () => {
  const actual = await vi.importActual<typeof assistantLib>("../lib/assistant");
  return {
    ...actual,
    classifyIntent: vi.fn(),
    phraseAnswer: vi.fn(),
    extractTransactionFromText: vi.fn(),
  };
});

// In-memory stand-in for RATE_LIMIT_KV, good enough for exercising the
// pending-draft put/get/delete cycle without a real Cloudflare KV binding.
function fakeKv(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
  } as unknown as KVNamespace;
}

function appWithFakeAuthAndDb(dbStub: unknown) {
  const app = new Hono<Env>();
  app.use("*", async (c, next) => {
    c.set("userId", "user_abc");
    c.set("db", dbStub as any);
    await next();
  });
  app.route("/api/assistant", assistantRoute);
  return app;
}

const emptyDbStub = {
  select: () => ({
    from: () => ({
      where: async () => [],
    }),
  }),
};

function fakeEnv(kv: KVNamespace = fakeKv()): Env["Bindings"] {
  return {
    DATABASE_URL: "postgres://fake",
    CLERK_SECRET_KEY: "fake",
    RATE_LIMIT_KV: kv,
    GEMINI_API_KEY: "fake",
    CLOUDINARY_CLOUD_NAME: "fake",
    CLOUDINARY_API_KEY: "fake",
    CLOUDINARY_API_SECRET: "fake",
    TELEGRAM_BOT_TOKEN: "fake",
    TELEGRAM_WEBHOOK_SECRET: "fake",
    TELEGRAM_BOT_USERNAME: "fake_bot",
  };
}

describe("POST /api/assistant/ask", () => {
  beforeEach(() => {
    vi.mocked(assistantLib.classifyIntent).mockReset();
    vi.mocked(assistantLib.phraseAnswer).mockReset();
  });

  it("rejects an empty question", async () => {
    const app = appWithFakeAuthAndDb(emptyDbStub);
    const res = await app.request(
      "/api/assistant/ask",
      { method: "POST", body: JSON.stringify({ question: "" }), headers: { "Content-Type": "application/json" } },
      fakeEnv()
    );
    expect(res.status).toBe(400);
  });

  it("returns the fixed fallback reply for an unsupported question without calling phraseAnswer", async () => {
    vi.mocked(assistantLib.classifyIntent).mockResolvedValue({ intent: "unsupported" });
    const app = appWithFakeAuthAndDb(emptyDbStub);
    const res = await app.request(
      "/api/assistant/ask",
      {
        method: "POST",
        body: JSON.stringify({ question: "what's the weather" }),
        headers: { "Content-Type": "application/json" },
      },
      fakeEnv()
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reply: assistantLib.UNSUPPORTED_REPLY });
    expect(assistantLib.phraseAnswer).not.toHaveBeenCalled();
  });

  it("computes real data and passes it to phraseAnswer for a generic query", async () => {
    vi.mocked(assistantLib.classifyIntent).mockResolvedValue({
      intent: "query",
      querySpec: { startDate: "2026-07-01", endDate: "2026-07-31" },
    });
    vi.mocked(assistantLib.phraseAnswer).mockResolvedValue("You've spent Rs 0 this month.");

    const app = appWithFakeAuthAndDb(emptyDbStub);
    const res = await app.request(
      "/api/assistant/ask",
      {
        method: "POST",
        body: JSON.stringify({ question: "how much have I spent this month?" }),
        headers: { "Content-Type": "application/json" },
      },
      fakeEnv()
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reply: "You've spent Rs 0 this month." });
    // The data argument must be real computed data, not the raw question —
    // guards against ever letting Gemini fabricate the numbers it reports.
    const dataArg = vi.mocked(assistantLib.phraseAnswer).mock.calls[0][2];
    expect(dataArg).toMatchObject({ total: 0, transactionCount: 0 });
  });

  it("computes budget status data for a budget_status intent", async () => {
    vi.mocked(assistantLib.classifyIntent).mockResolvedValue({ intent: "budget_status" });
    vi.mocked(assistantLib.phraseAnswer).mockResolvedValue("You have no budgets set.");

    const app = appWithFakeAuthAndDb(emptyDbStub);
    const res = await app.request(
      "/api/assistant/ask",
      {
        method: "POST",
        body: JSON.stringify({ question: "how am I doing against my budgets?" }),
        headers: { "Content-Type": "application/json" },
      },
      fakeEnv()
    );

    expect(res.status).toBe(200);
    const dataArg = vi.mocked(assistantLib.phraseAnswer).mock.calls[0][2];
    expect(dataArg).toEqual([]);
  });

  it("returns a 502 when intent classification fails", async () => {
    vi.mocked(assistantLib.classifyIntent).mockRejectedValue(new Error("Gemini down"));
    const app = appWithFakeAuthAndDb(emptyDbStub);
    const res = await app.request(
      "/api/assistant/ask",
      {
        method: "POST",
        body: JSON.stringify({ question: "how much have I spent?" }),
        headers: { "Content-Type": "application/json" },
      },
      fakeEnv()
    );
    expect(res.status).toBe(502);
  });

  it("returns a draft and stores it in KV for an add_transaction message, without querying transaction data", async () => {
    const draft = {
      merchant: "lunch",
      amount: 500,
      categoryName: "Food",
      txType: "exp" as const,
      date: "2026-07-20",
    };
    vi.mocked(assistantLib.classifyIntent).mockResolvedValue({ intent: "add_transaction", draft });

    const kv = fakeKv();
    const app = appWithFakeAuthAndDb(emptyDbStub);
    const res = await app.request(
      "/api/assistant/ask",
      {
        method: "POST",
        body: JSON.stringify({ question: "spent 500 on lunch" }),
        headers: { "Content-Type": "application/json" },
      },
      fakeEnv(kv)
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { reply: string; draft?: typeof draft };
    expect(body.draft).toEqual(draft);
    expect(body.reply).toContain("500");
    // Never touches phraseAnswer/real transaction data — a draft is
    // confirmed-then-saved, not phrased from computed numbers.
    expect(assistantLib.phraseAnswer).not.toHaveBeenCalled();
    expect(await kv.get("draft:user_abc")).toBe(JSON.stringify(draft));
  });
});

describe("POST /api/assistant/confirm", () => {
  const draft = { merchant: "lunch", amount: 500, categoryName: "Food", txType: "exp" as const, date: "2026-07-20" };

  it("rejects a malformed draft", async () => {
    const app = appWithFakeAuthAndDb(emptyDbStub);
    const res = await app.request(
      "/api/assistant/confirm",
      { method: "POST", body: JSON.stringify({ merchant: "lunch" }), headers: { "Content-Type": "application/json" } },
      fakeEnv()
    );
    expect(res.status).toBe(400);
  });

  it("resolves an existing category, inserts the transaction, and clears the pending draft", async () => {
    const insertedRow = { id: "tx1", ...draft, userId: "user_abc" };
    const dbStub = {
      select: () => ({
        from: () => ({
          where: async () => [{ id: "cat1" }], // matches both the wallet and category lookups
        }),
      }),
      insert: () => ({
        values: () => ({
          returning: async () => [insertedRow],
        }),
      }),
    };
    const kv = fakeKv();
    await kv.put("draft:user_abc", JSON.stringify(draft));

    const app = appWithFakeAuthAndDb(dbStub);
    const res = await app.request(
      "/api/assistant/confirm",
      { method: "POST", body: JSON.stringify(draft), headers: { "Content-Type": "application/json" } },
      fakeEnv(kv)
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(insertedRow);
    expect(await kv.get("draft:user_abc")).toBeNull();
  });
});

describe("POST /api/assistant/cancel", () => {
  it("clears the pending draft", async () => {
    const kv = fakeKv();
    await kv.put("draft:user_abc", JSON.stringify({ merchant: "lunch" }));

    const app = appWithFakeAuthAndDb(emptyDbStub);
    const res = await app.request("/api/assistant/cancel", { method: "POST" }, fakeEnv(kv));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(await kv.get("draft:user_abc")).toBeNull();
  });

  it("returns a 502 instead of an unhandled error when the KV delete fails", async () => {
    const kv: KVNamespace = {
      get: async () => null,
      put: async () => {},
      delete: async () => {
        throw new Error("KV unavailable");
      },
    } as unknown as KVNamespace;

    const app = appWithFakeAuthAndDb(emptyDbStub);
    const res = await app.request("/api/assistant/cancel", { method: "POST" }, fakeEnv(kv));

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Couldn't cancel that right now. Try again in a moment." });
  });
});

describe("POST /api/assistant/parse-notification", () => {
  beforeEach(() => {
    vi.mocked(assistantLib.extractTransactionFromText).mockReset();
  });

  it("rejects empty notification text", async () => {
    const app = appWithFakeAuthAndDb(emptyDbStub);
    const res = await app.request(
      "/api/assistant/parse-notification",
      {
        method: "POST",
        body: JSON.stringify({ text: "", postedAt: "2026-07-20T10:00:00.000Z" }),
        headers: { "Content-Type": "application/json" },
      },
      fakeEnv()
    );
    expect(res.status).toBe(400);
  });

  it("rejects a malformed postedAt", async () => {
    const app = appWithFakeAuthAndDb(emptyDbStub);
    const res = await app.request(
      "/api/assistant/parse-notification",
      {
        method: "POST",
        body: JSON.stringify({ text: "Rs 500 debited", postedAt: "not-a-date" }),
        headers: { "Content-Type": "application/json" },
      },
      fakeEnv()
    );
    expect(res.status).toBe(400);
  });

  it("returns null when the notification isn't a transaction", async () => {
    vi.mocked(assistantLib.extractTransactionFromText).mockResolvedValue(undefined);
    const app = appWithFakeAuthAndDb(emptyDbStub);
    const res = await app.request(
      "/api/assistant/parse-notification",
      {
        method: "POST",
        body: JSON.stringify({ text: "Your OTP is 483920", postedAt: "2026-07-20T10:00:00.000Z" }),
        headers: { "Content-Type": "application/json" },
      },
      fakeEnv()
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ draft: null });
  });

  it("returns the extracted draft without persisting anything to KV", async () => {
    const draft = { merchant: "Keells Super", amount: 850, categoryName: "Food", txType: "exp" as const, date: "2026-07-20" };
    vi.mocked(assistantLib.extractTransactionFromText).mockResolvedValue(draft);

    const kv = fakeKv();
    const app = appWithFakeAuthAndDb(emptyDbStub);
    const res = await app.request(
      "/api/assistant/parse-notification",
      {
        method: "POST",
        body: JSON.stringify({ text: "Rs 850 spent at Keells Super", postedAt: "2026-07-20T10:00:00.000Z" }),
        headers: { "Content-Type": "application/json" },
      },
      fakeEnv(kv)
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ draft });
    expect(await kv.get("draft:user_abc")).toBeNull();
  });

  it("returns a 502 when extraction fails", async () => {
    vi.mocked(assistantLib.extractTransactionFromText).mockRejectedValue(new Error("Gemini down"));
    const app = appWithFakeAuthAndDb(emptyDbStub);
    const res = await app.request(
      "/api/assistant/parse-notification",
      {
        method: "POST",
        body: JSON.stringify({ text: "Rs 850 spent at Keells Super", postedAt: "2026-07-20T10:00:00.000Z" }),
        headers: { "Content-Type": "application/json" },
      },
      fakeEnv()
    );
    expect(res.status).toBe(502);
  });
});
