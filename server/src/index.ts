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
import type { Env } from "./types";

const app = new Hono<Env>();

// Auth is bearer-token only (no cookies), so there's no CSRF surface —
// allowing any origin is a deliberate, documented choice, not an oversight.
app.use(
  "*",
  cors({
    origin: "*",
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

app.use("/api/*", clerkAuth);
app.use("/api/*", rateLimit);
app.route("/api/wallets", walletsRoute);
app.route("/api/categories", categoriesRoute);
app.route("/api/budgets", budgetsRoute);
app.route("/api/transactions", transactionsRoute);
app.route("/api/data", dataRoute);

export default app;
