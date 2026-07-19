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
  };
});

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

describe("POST /api/assistant/ask", () => {
  beforeEach(() => {
    vi.mocked(assistantLib.classifyIntent).mockReset();
    vi.mocked(assistantLib.phraseAnswer).mockReset();
  });

  it("rejects an empty question", async () => {
    const app = appWithFakeAuthAndDb(emptyDbStub);
    const res = await app.request("/api/assistant/ask", {
      method: "POST",
      body: JSON.stringify({ question: "" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  it("returns the fixed fallback reply for an unsupported question without calling phraseAnswer", async () => {
    vi.mocked(assistantLib.classifyIntent).mockResolvedValue({ intent: "unsupported" });
    const app = appWithFakeAuthAndDb(emptyDbStub);
    const res = await app.request("/api/assistant/ask", {
      method: "POST",
      body: JSON.stringify({ question: "what's the weather" }),
      headers: { "Content-Type": "application/json" },
    });
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
    const res = await app.request("/api/assistant/ask", {
      method: "POST",
      body: JSON.stringify({ question: "how much have I spent this month?" }),
      headers: { "Content-Type": "application/json" },
    });

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
    const res = await app.request("/api/assistant/ask", {
      method: "POST",
      body: JSON.stringify({ question: "how am I doing against my budgets?" }),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(200);
    const dataArg = vi.mocked(assistantLib.phraseAnswer).mock.calls[0][2];
    expect(dataArg).toEqual([]);
  });

  it("returns a 502 when intent classification fails", async () => {
    vi.mocked(assistantLib.classifyIntent).mockRejectedValue(new Error("Gemini down"));
    const app = appWithFakeAuthAndDb(emptyDbStub);
    const res = await app.request("/api/assistant/ask", {
      method: "POST",
      body: JSON.stringify({ question: "how much have I spent?" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(502);
  });
});
