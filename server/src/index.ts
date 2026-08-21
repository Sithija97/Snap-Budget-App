import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { clerkAuth } from "./middleware/auth";
import { rateLimit } from "./middleware/rateLimit";
import { walletsRoute } from "./routes/wallets";
import { categoriesRoute } from "./routes/categories";
import { budgetsRoute } from "./routes/budgets";
import { transactionsRoute } from "./routes/transactions";
import { dataRoute } from "./routes/data";
import { accountRoute } from "./routes/account";
import { scanRoute } from "./routes/scan";
import { receiptsRoute } from "./routes/receipts";
import { messagingRoute } from "./routes/messaging";
import { assistantRoute } from "./routes/assistant";
import { webhooksRoute } from "./routes/webhooks";
import { recapRoute, generateRecapsForAllUsers } from "./routes/recap";
import { createDb } from "./db/client";
import type { Env } from "./types";

const app = new Hono<Env>();

// This API has no web frontend — only the native mobile app (which doesn't
// send an Origin header) and server-to-server calls (Telegram webhook) call
// it. `origin: "*"` previously let any website's browser JS call authenticated
// endpoints on behalf of a user who had a valid token (e.g. phished or
// leaked). Returning no Access-Control-Allow-Origin blocks browser-based
// cross-origin calls while leaving the native app, curl, and the webhook
// route (which isn't behind this check anyway) unaffected.
app.use(
  "*",
  cors({
    origin: [],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse();
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

app.get("/", (c) => c.json({ ok: true, service: "snapbudget-api" }));

// Called by Telegram, not the app — verified by its own secret-token check
// (see routes/webhooks.ts), so it sits outside clerkAuth/rateLimit entirely.
app.route("/webhooks", webhooksRoute);

app.use("/api/*", clerkAuth);
app.use("/api/*", rateLimit);
app.route("/api/wallets", walletsRoute);
app.route("/api/categories", categoriesRoute);
app.route("/api/budgets", budgetsRoute);
app.route("/api/transactions", transactionsRoute);
app.route("/api/data", dataRoute);
app.route("/api/account", accountRoute);
app.route("/api/scan", scanRoute);
app.route("/api/receipts", receiptsRoute);
app.route("/api/messaging", messagingRoute);
app.route("/api/assistant", assistantRoute);
app.route("/api/recaps", recapRoute);

export default app;

// Cloudflare cron entry point (see wrangler.toml's [triggers].crons) — two
// schedules share this one handler, distinguished by which cron string
// fired. Not behind clerkAuth (nothing here is a user-initiated HTTP
// request); scoped instead by iterating every row in `users`.
export const scheduled: ExportedHandlerScheduledHandler<Env["Bindings"]> = async (event, env) => {
  const db = createDb(env.DATABASE_URL);
  const periodType = event.cron === WEEKLY_CRON ? "weekly" : "monthly";
  await generateRecapsForAllUsers(env, db, periodType);
};

// Kept in sync with wrangler.toml's [triggers].crons — the weekly entry is
// compared against event.cron to tell the two schedules apart at runtime.
const WEEKLY_CRON = "0 8 * * 1";
