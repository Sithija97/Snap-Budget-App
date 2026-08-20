# SnapBudget — App Context

## What this app does

SnapBudget is a personal finance app for Sri Lankan users. It lets people snap a photo of a receipt to auto-log an expense, then shows a clear picture of where their money goes — budgets per category, monthly spending trends, and a transaction history — all in a minimal, distraction-free UI.

---

## Current state

The app is a **fully functional, backend-connected app**: real authentication (Clerk), a real API (Cloudflare Workers + Hono), a real database (Neon Postgres via Drizzle ORM), and real receipt scanning (camera capture → Gemini Vision OCR → Cloudinary image storage). Zustand stores are now a thin in-memory cache populated by API responses, not a local source of truth — there is no AsyncStorage persistence for app data anymore (theme preference is the one exception, see Dark mode architecture).

### What works

- **Real authentication** — Clerk email/password sign-up (with verification code) + sign-in + Google OAuth + forgot/reset password (email code via Clerk's `reset_password_email_code` strategy); `Stack.Protected` gates `(tabs)`/`scan` behind `isSignedIn`, `login` behind `!isSignedIn`
- **Telegram account linking (2026-07-19)** — Settings → "Connect Telegram" generates a short-lived one-time code server-side, deep-links into `t.me/<bot>?start=<code>` (no manual code entry), and the bot's webhook (`POST /webhooks/telegram`, public, verified by a Telegram-supplied secret token — not behind Clerk) links the chat id to the account
- **Q&A assistant (2026-07-19, same day)** — free-text questions about spending this month, top spending categories over N months, or whether the current balance will last until the next (inferred) payday. Answerable from the linked Telegram chat *or* a new in-app `app/assistant.tsx` screen (entry point: header icon on Home) — both call the exact same `answerQuestion()` server function. Gemini only classifies intent and phrases the final sentence; every number comes from `server/src/lib/insights.ts`'s pure TS aggregation over real Drizzle rows, never from the model. Anything outside the three supported questions gets a fixed fallback message — no attempt to guess, and no write path (can't create a transaction from chat yet, that's still planned)
- **Weekly/monthly proactive recap (2026-07-20)** — unprompted, schedule-delivered version of the same "Gemini phrases, never computes" pattern: two Cloudflare Cron Triggers (`0 8 * * 1` weekly, `5 8 1 * *` monthly) fire `scheduled()` in `server/src/index.ts`, which iterates every row in `users` and calls `generateAndDeliverRecap()` per user. Delivered via Telegram (if linked) *and* always persisted to a new `recaps` table for the in-app inbox (`app/recaps.tsx`, entry point: a second Home header icon next to Assistant) — recaps don't require Telegram to be visible in-app. A user with zero transactions in the window gets nothing generated at all (no empty "you spent Rs 0" message, no Gemini call). Idempotent by a unique `(userId, periodType, periodStart)` index — a retried or double-fired cron is a skip-on-conflict no-op, so it can never double-send the same recap
- **Real backend for all CRUD** — wallets, categories, budgets, transactions are fetched from and written to a Cloudflare Workers API (`server/`), backed by Neon Postgres via Drizzle. Every row is scoped by the Clerk `userId`; app-level scoping (not Postgres RLS) is the authorization boundary
- **Real receipt scanning** — camera capture (`expo-image-picker`), client-side resize/compress (`expo-image-manipulator`, max 1600px edge, JPEG q0.6), Gemini Vision OCR extraction (merchant/amount/date/category, matched against the user's real categories), private Cloudinary storage for the receipt image, editable review card before saving (OCR isn't assumed perfect), manual entry remains as a fallback
- **Income logging** — the only place a transaction's type (Expense/Income) can be chosen is manual entry in `scan.tsx` (an Expense/Income `Chip` pair, defaults to Expense). Scanning is expense-only by design (you don't photograph a receipt for salary) — wallet `balance` is a separate, standalone "how much is currently in this wallet" figure and was never wired to Home's Income stat; that stat only ever reflects `txType: "inc"` transactions, which previously had no creation path anywhere in the UI. A single unified add-transaction flow with a type toggle (rather than separate Expense/Income screens) is the standard pattern in this category of app, not a shortcut — but the entry point was buried two taps deep (Scan → Manual). `scan.tsx` now also accepts `?manual=true&type=income|expense` query params so other screens can deep-link straight into the right mode; Home's "Total spent"/"Income" figures are tappable and use exactly this
- **Live derived data** — Home totals (spent / income / remaining) and Budget progress bars compute from real transaction data for the current month; Analytics charts use real aggregation (`utils/analytics.ts`, expense-only by design), not mock data. Both summary cards show a `Skeleton` placeholder instead of a misleading `Rs 0` before their first fetch resolves (see "Loading states" below) — not on every pull-to-refresh, only before real data has ever loaded
- **Home redesign + budget health (2026-07-11)** — summary card with hero Total-spent row (visible "+" add-expense affordance), icon-anchored Income/Remaining stats (Remaining turns red when negative); a "Budget health" section with a brand-blue semicircular gauge (safe-to-spend % from the pure, unit-tested `utils/budgetHealth.ts`; Good ≥40% left / Watch / Over badge) and See more → Analytics; recent transactions show the date ("4 July 2026") as subtitle with no separators and a "See all" header link. The same pass rolled the borderless-surface design app-wide (see "Design system") and put the login form on a Card
- Transaction detail screen (`/transaction/[id]`) with edit mode and delete-with-confirm; shows the original receipt photo when the transaction came from a scan, loaded via an authenticated `fetch()` + data URI (not `<Image source={{headers}}>` — see "Receipt image loading" below)
- Wallets: list + form screens, `balance: null` renders as "Balance not set", a default "My Wallet" is seeded server-side on first sign-in, the last remaining wallet can't be deleted (enforced both client- and server-side)
- Categories: Expense/Income tabs, custom categories with icon picker and optional parent (subcategory), duplicate-proof (DB unique index on `(userId, type, lower(name))` + API pre-check), deletion blocked while referenced by transactions or budgets
- Budgets: add/edit/delete per expense category for the current month, "repeat" flag persisted (no auto-renewal logic acting on it yet)
- Settings: real Clerk profile, Sign Out, Export data (`utils/exportExcel.ts` — real `.xlsx` workbook, one sheet per store with resolved category/wallet names instead of raw IDs, shared via `expo-sharing`), Clear all data (wipes + reseeds via `DELETE /api/data`)
- List screens (`transactions`, `budget`, `wallets`, `categories`) are virtualized (`FlatList`/`SectionList`) with `RefreshControl` pull-to-refresh, decoupled from the initial-load spinner (`hooks/useRefresh.ts`) to avoid a double-spinner
- Fully functional dark / light / system theme
- Validation everywhere: numeric keyboards with non-numeric stripped, Save buttons disabled until valid, destructive actions go through `Alert.alert`

### What does not work yet / known gaps

- **Budget "repeat" has no auto-renewal logic** — the flag persists but nothing acts on it yet
- **No predictive overspend warning** — next planned feature (see PLAN.md §9), pure arithmetic against existing data, no new backend needed
- ~~**No proactive/scheduled AI recap**~~ — **Built 2026-07-20**: weekly + monthly Cloudflare Cron-delivered summaries (Telegram + in-app inbox), see below
- **No natural-language quick-add** — the Q&A assistant is deliberately read-only; "spent 500 on lunch" creating a real transaction from chat is separate, deferred future work
- **No WhatsApp channel** — Telegram shipped first (no business verification required); WhatsApp planned once Meta's per-message billing rates publish
- **Manual transaction entry and the edit screen have no date field** — both always use "today"; only the scan review flow lets you edit the transaction date (with a confirm-if-not-this-month warning, since Gemini reads the real printed receipt date)
- **The edit screen can't change a transaction's type** — Expense/Income is fixed at creation, consistent with categories also being locked to one type
- **Merchant cache** (free repeat-scan lookups) — not built, no current need identified
- Out of scope by decision: Debt/Loan, bank connections, Events, Recurring Transactions

---

## Tech stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Expo (Managed) | SDK 54 (AGENTS.md says v56 — that's stale; the installed SDK is 54) |
| Runtime | React Native | 0.81.x |
| UI layer | React | 19.x |
| Routing | expo-router (file-based), `Stack.Protected` for auth gating | ~6.0.24 |
| State | Zustand, API-backed (no persist middleware) | 5.x |
| Auth | `@clerk/clerk-expo` — email/password + verification code + Google OAuth + forgot/reset password | ^2.19.31 |
| Token storage | `expo-secure-store` (Clerk token cache — Keychain/Keystore, not AsyncStorage) | ~15.0.8 |
| Backend API | Cloudflare Workers + Hono | hono ^4.6.14 |
| ORM / DB | Drizzle ORM + Neon Postgres (`neon-http` driver — no `db.transaction()`, use `db.batch()`) | drizzle-orm ^0.45.2 |
| Rate limiting | Cloudflare KV, fixed-window, 120 req/min/user | — |
| Receipt OCR | Gemini Vision (`gemini-2.5-flash`, structured JSON output) | — |
| Receipt storage | Cloudinary (private, signed URLs) — not Cloudflare R2, see "Backend architecture" | — |
| Camera capture | `expo-image-picker` (`launchCameraAsync`) — not raw `expo-camera`, despite it being a dependency | ~17.0.11 |
| Image compression | `expo-image-manipulator` (new contextual API — `manipulateAsync` is deprecated, don't use it) | ~14.0.8 |
| Styling | NativeWind v4 (Tailwind CSS for RN) | 4.x |
| Dark mode | NativeWind `darkMode: "class"` + JS-driven inline colors for anything using `dark:` variant text | — |
| IDs | Server-generated UUIDs (Postgres `defaultRandom()`); `utils/tempId.ts` for optimistic-insert placeholders only | — |
| Icons | lucide-react-native only | — |
| Fonts | DM Sans 400/500 + DM Mono 400 via @expo-google-fonts | — |
| Testing | Vitest — root (`store/`, `utils/`) and `server/` (Hono route tests via `app.request()`) | ^4.1.10 |
| Language | TypeScript (strict) | 5.x |

**App config note**: `app.json`'s `expo-splash-screen` plugin entry had no config object from the initial commit onward, so no splash image ever rendered (just a blank white screen) — fixed 2026-07-04 by giving it `{ image: "./assets/splash-icon.png", imageWidth: 200, resizeMode: "contain", backgroundColor: "#ffffff" }`. This is a **managed workflow** project (no `android`/`ios` folders checked in), so splash/icon config changes only take effect on the next `expo prebuild` / `expo run:android`/`run:ios` / EAS build — not on a Metro reload. **Expo Go cannot render this config at all** (SDK 52+ limitation); testing the real splash screen requires a development build or an EAS build. The same applies to `expo-image-picker`'s custom permission strings (`app.json`'s `plugins` entry) — Expo Go shows its own generic camera/photo-library permission prompt, not the app's custom text; only a dev-client/EAS build shows the real strings.

**EAS build setup**: `eas.json` has `development`/`preview`/`production` profiles; `preview` builds an installable `.apk`. Project is linked as `@sithija/Snapbudget`, `android.package: "com.sithija.snapbudget"`.

**Android adaptive icon safe zone / pale halo** (fixed 2026-07-06/07): foreground artwork was originally too close to the canvas edge (crowded launcher masks) and later had a duplicate background baked in causing a pale halo. Correct structure: foreground = glyph only (transparent elsewhere), background = solid color reaching every edge, Android composites + masks them itself. `android-icon-monochrome.png` is a separate, still-unfixed leftover default asset — only affects Android 13+ opt-in themed icons.

---

## Backend architecture (`server/`)

Cloudflare Worker (Hono framework) at `https://snapbudget-api.<subdomain>.workers.dev`, deployed via `wrangler deploy`. Every `/api/*` route sits behind two global middlewares, in this order: `clerkAuth` (verifies the bearer JWT via `@clerk/backend`'s `verifyToken`, lazily seeds a new user's default categories + wallet on first sight, sets `userId`/`db` on Hono's context) then `rateLimit` (120 req/min/user via Cloudflare KV, documented as best-effort/eventually-consistent, not exact).

### Database (Neon Postgres via Drizzle, `neon-http` driver)

7 tables, all descendant rows scoped by `userId` (app-level authorization, not Postgres RLS):

| Table | Key columns |
|---|---|
| `users` | `id` (Clerk user id, text PK), `email` (nullable), `createdAt` |
| `wallets` | `id` (uuid), `userId` (FK cascade), `name`, `balance` (numeric, nullable = "not set"), `isDefault`, `createdAt` |
| `categories` | `id`, `userId` (FK cascade), `name`, `type` (`expense`\|`income`), `icon`, `parentId` (nullable, no FK), `isDefault`. Unique index on `(userId, type, lower(name))` |
| `budgets` | `id`, `userId` (FK cascade), `categoryId` (FK cascade), `limitAmount`, `month` ("YYYY-MM"), `repeat` |
| `transactions` | `id`, `userId` (FK cascade), `merchant`, `categoryId` (FK restrict — can't delete a referenced category), `walletId` (FK set-null, nullable), `txType` (`inc`\|`exp`), `amount`, `date` ("YYYY-MM-DD"), `time`, `receiptKey` (nullable — Cloudinary `public_id`, set only when created from a scan) |
| `messaging_links` | `id` (uuid), `userId` (FK cascade), `channel` (`telegram`-only enum today), `externalId` (Telegram chat id), `externalDisplayName` (nullable), `linkedAt`. Unique index on `(channel, externalId)` — one chat can't link to two accounts |
| `messaging_link_codes` | `code` (text PK, 8-char unambiguous alphabet), `userId` (FK cascade), `channel`, `expiresAt`, `createdAt`. Expiry checked at query time, not swept by a cron |
| `recaps` | `id` (uuid), `userId` (FK cascade), `periodType` (`weekly`\|`monthly`), `periodStart`/`periodEnd` ("YYYY-MM-DD"), `message` (the phrased sentence actually sent), `data` (JSON.stringify of the computed `RecapData`, kept for future richer rendering), `createdAt`. Unique index on `(userId, periodType, periodStart)` — makes cron delivery idempotent |

Note: `neon-http` has **no interactive `db.transaction()`** (throws at runtime) — `db.batch([...])` is the atomic primitive used instead (see `routes/data.ts`'s clear-all-data).

### Routes

Standard REST under `/api/{wallets,categories,budgets,transactions}` (GET/POST/PATCH/DELETE), plus:
- `DELETE /api/data` — wipes all 4 tables for the caller and reseeds defaults (one `db.batch()`)
- `POST /api/scan` — accepts `{ imageBase64 }` (capped at 15MB as a defensive ceiling, client sends far less), calls Gemini Vision with the user's real expense-category names embedded in the prompt, uploads the image to Cloudinary, returns `{ merchant, amount, date, categoryName, receiptKey }`. Both the Gemini and Cloudinary calls are bounded by a 20s `AbortSignal.timeout` so a stalled upstream can't hang the Worker
- `GET /api/receipts/:key{.+}` — the `{.+}` regex param is required because the key itself contains a slash (`userId/uuid`); verifies the key's `userId/` prefix matches the caller (404 otherwise), then 302-redirects to a freshly-signed Cloudinary private-download URL. The client never sees a raw Cloudinary URL or credential — every image load goes through this authenticated route first
- `GET /api/messaging/telegram` — `{ linked, displayName?, linkedAt? }`
- `POST /api/messaging/telegram/link-code` — generates a one-time code + `t.me` deep link (409 if already linked)
- `DELETE /api/messaging/telegram` — unlink
- `POST /webhooks/telegram` — **public, not behind `clerkAuth`** (mounted before it in `index.ts`), verified instead by Telegram's `X-Telegram-Bot-Api-Secret-Token` header matching `TELEGRAM_WEBHOOK_SECRET`. Handles `/start <code>`: validates + consumes the code, links the chat, replies in-chat either way (success, expired code, or "already linked to another account"). Any other text from an already-linked chat is routed to the same Q&A logic as `/api/assistant/ask` (see below); an unlinked chat gets a "link your account first" reply. The whole non-`/start` branch (including the DB call, which throws synchronously on a malformed connection string) is wrapped in one try/catch — Telegram must always get its 200 back or it will keep retrying the same update
- `POST /api/assistant/ask` — `{ question: string }` → `{ reply: string }`. Two-step: `lib/assistant.ts`'s `classifyIntent()` (Gemini, structured output) picks one of `spending_summary`/`top_spending`/`survival_estimate`/`unsupported` — never sees real data; `lib/insights.ts` then computes the real numbers in plain TS from Drizzle rows; `phraseAnswer()` (Gemini again) receives only that computed JSON and phrases it into a sentence. `unsupported` short-circuits to a fixed message without a second Gemini call at all
- `GET /api/recaps` — authenticated, lists the caller's past recaps newest-first (max 100) for the in-app inbox
- Cloudflare Cron Triggers (`server/wrangler.toml`'s `[triggers].crons`, not an HTTP route) — `scheduled()` in `server/src/index.ts` fires on `0 8 * * 1` (weekly) and `5 8 1 * *` (monthly), iterating every `users` row and calling `generateAndDeliverRecap()` per user (see "Weekly/monthly proactive recap" below)

### Receipt image storage: Cloudinary, not Cloudflare R2

The original plan called for R2, but R2 requires a card on file to enable even on its free tier, which the user preferred to avoid. Cloudinary's free tier doesn't. This has no other architectural impact — the same privacy model applies (upload as `type: "private"`, never a public URL) via two signed operations sharing one signing helper (`server/src/lib/cloudinary.ts`, SHA-1 over sorted params + secret, the same scheme Cloudinary uses for both its Upload and Admin APIs):
- **Upload**: signed `type: "private"` upload to `POST /v1_1/:cloud/image/upload`, `public_id: "userId/uuid"`.
- **Download**: signed request to the Admin API's `.../image/download` endpoint (not the special short `s--...--` authenticated-delivery-URL scheme — this endpoint reuses the same plain signing logic as upload, which is simpler and was verified against the real account before relying on it).

### Gemini Vision OCR (`server/src/lib/gemini.ts`)

Direct `fetch` to the Generative Language REST API (no SDK dependency — consistent with this backend's general preference for lean, Workers-compatible code, same reasoning that picked Drizzle over Prisma). Uses `responseMimeType: "application/json"` + a `responseSchema` for strict structured output instead of parsing free-form text. The prompt sends the user's real expense category names so the model picks from what actually exists; if nothing fits it returns `categoryName: null`, and the client falls back to the same "match by name or create a new expense category" logic (`resolveCategoryId` in `scan.tsx`) that manual entry already used.

### Q&A assistant (`server/src/lib/{assistant,insights}.ts`, 2026-07-19)

Same "Gemini phrases, never computes" principle as the OCR flow above, applied to free-text questions instead of receipt images:
- **`lib/assistant.ts`** — two Gemini calls, both using the same direct-fetch + `responseSchema` pattern as `gemini.ts` (no new dependency). `classifyIntent()` maps the question to one of `spending_summary`/`top_spending`/`survival_estimate`/`unsupported` and never receives real transaction data. `phraseAnswer()` receives only already-computed JSON (from `lib/insights.ts`) and is instructed to phrase it, never invent a number not present in that JSON.
- **`lib/insights.ts`** — pure TypeScript aggregation over Drizzle rows: `spendingSummaryForMonth`, `topSpendingOverMonths`, `inferPayday` (recurring-payday detection from income-transaction history — day-of-month clustering with ±3-day drift tolerance, needs ≥2 similar occurrences or reports `confident: false` rather than guessing), `survivalEstimate` (current total wallet balance vs. a 30-day average daily spend rate projected out to the inferred payday). Fully unit-tested (`insights.test.ts`), no DB needed since every function is pure.
- Duplicated, not imported, from the frontend's `utils/payday.ts` (same algorithm, also unit-tested) — `server/` is a fully separate package with its own `tsconfig.json` and no existing cross-package import anywhere in the codebase; introducing one now would be a first-of-its-kind pattern and a Wrangler-bundling risk.
- `routes/assistant.ts` exports `answerQuestion(env, db, userId, question)` — the single code path both `POST /api/assistant/ask` and the Telegram webhook's free-text handling call, so the two surfaces can never answer the same question differently.

### Weekly/monthly proactive recap (`server/src/lib/recap.ts`, `server/src/routes/recap.ts`, 2026-07-20)

Same "Gemini phrases, never computes" principle, delivered unprompted on a schedule instead of in reply to a question:
- **`lib/insights.ts`'s `recapForPeriod()`** — pure aggregation over a `[periodStart, periodEnd]` window: total spent, total income, transaction count, top 5 categories by spend, and the same window one period back (`previousPeriodSpent`, `null` if there's no transaction history before the period at all — distinct from a real `0`). Built on top of the existing `runQuery()` filter/group helper rather than a separate query path, so a recap and an equivalent Q&A answer for the same window can never silently disagree.
- **`lib/recap.ts`'s `phraseRecap()`** — same direct-fetch + `responseSchema` Gemini pattern as `assistant.ts`; receives only the already-computed `RecapData` JSON and is instructed to phrase 2-4 sentences, never invent a number.
- **`routes/recap.ts`'s `periodWindows(periodType, today)`** — weekly = the 7 days ending yesterday (a Monday cron looking back at the week that just finished); monthly = the full previous calendar month (a 1st-of-month cron looking back at the month that just ended).
- **`routes/recap.ts`'s `generateAndDeliverRecap(env, db, userId, periodType, today)`** — the per-user unit of work the cron calls once per user per schedule. If `transactionCount` is 0 for the window, it returns early with no Gemini call and no row inserted (no "you spent Rs 0" noise for an inactive user). Otherwise it phrases the message, then inserts into `recaps` via `.onConflictDoNothing()` against the unique `(userId, periodType, periodStart)` index — Telegram delivery only fires if the insert actually happened (`.returning()` came back non-empty), so a retried or double-fired cron trigger can never send the same recap twice. Delivery is Telegram-only when linked; the `recaps` row itself is written regardless, which is what makes the in-app inbox work even for users with no messaging channel connected.
- **`routes/recap.ts`'s `generateRecapsForAllUsers(env, db, periodType, today)`** — the actual `scheduled()` entry point's body: selects every row in `users`, calls `generateAndDeliverRecap` per user in a loop, catching and logging per-user failures so one bad user can't stop the rest of the batch.
- **Cloudflare Cron Triggers**, not a new vendor — `server/wrangler.toml`'s `[triggers].crons = ["0 8 * * 1", "5 8 1 * *"]`; `scheduled()` in `index.ts` tells the two schedules apart by comparing `event.cron` against the weekly string.
- `GET /api/recaps` (authenticated) — lists the caller's past recaps newest-first, backing `app/recaps.tsx`.
- Frontend: `useRecapStore` (Zustand, read-only — no mutation actions, since recaps are never created/edited from the app), `app/recaps.tsx` (card list, pull-to-refresh, `DataState` for loading/empty/error), entry point is a second Home header icon (`Bell`) next to the existing Assistant icon (`Sparkles`).

---

## Data architecture (frontend)

### Stores (`store/`)

Five Zustand stores, **no persistence middleware** — the API is the source of truth. The four CRUD stores share an identical shape: `status: "idle"|"loading"|"error"`, `fetchAll()`, `add*`/`update*`/`delete*` (all `async`, all **optimistic** — apply the change locally first via `tempId()` for inserts, reconcile with the real server row on success, roll back to the previous snapshot on failure), `reset()` (called on sign-out).

| Store | State & extras |
|---|---|
| `useWalletStore` | `wallets`; `getTotalBalance()` (treats null as 0) |
| `useCategoryStore` | `categories`; `categoryHasTransactions(id)` (reads `useTransactionStore` directly); `addCategory` returns the created row (used by scan/manual-entry category resolution) |
| `useBudgetStore` | `budgets`; pure helper `budgetsForMonth(budgets, month)` |
| `useTransactionStore` | `transactions`; pure helpers `transactionsInMonth`, `totalsForMonth`, `spentByCategoryInMonth` |
| `useMessagingStore` | `telegram: TelegramLinkStatus` (single object, not a list — there's one Telegram link, not many); `fetchStatus()`, `requestLinkCode()` (not optimistic — a code has no meaningful local shape before the server generates it), `unlinkTelegram()` (optimistic) |
| `useRecapStore` | `recaps: Recap[]`; `fetchAll()` only — read-only, no mutation actions since recaps are generated server-side by the cron handler, never created/edited/deleted from the app |

`app/_layout.tsx`'s `AuthBridge` component wires all of this together: feeds Clerk's `getToken()` into `lib/api.ts`'s module-level token getter (Zustand actions run outside React and can't call hooks directly), and on `isSignedIn` becoming true fires all five fetches in parallel; on sign-out, resets all five stores.

### Data model (`types/index.ts`)

| Type | Shape |
|---|---|
| `Category` | `id, name, type: 'expense'\|'income', icon, parentId, isDefault` |
| `Wallet` | `id, name, balance: number \| null, isDefault, createdAt` |
| `Transaction` | `id, merchant, categoryId, walletId, txType, amount, date, time, receiptKey?: string \| null` |
| `Budget` | `id, categoryId, limitAmount, month, repeat` |
| `TelegramLinkStatus` | `linked: boolean, displayName?: string \| null, linkedAt?: string` |
| `TelegramLinkCode` | `code, expiresAt, deepLink` |
| `Recap` | `id, periodType: 'weekly'\|'monthly', periodStart, periodEnd, message, createdAt` |

### `lib/`

- **`api.ts`** — `API_URL` (from `EXPO_PUBLIC_API_URL`), `setTokenGetter`, `api.get/post/patch/del`. Attaches `Authorization: Bearer <token>` when a token is available; throws on non-2xx with the server's `error` message.
- **`tokenCache.ts`** — Clerk `TokenCache` backed by `expo-secure-store`.

### Default data

No client-side seed data anymore — `constants/seedData.ts` and `constants/mockData.ts` are deleted. Default categories (`DEFAULT_CATEGORIES`, 8 entries) and the default wallet are seeded **server-side**, once, on a user's first authenticated request (`server/src/middleware/auth.ts`, `server/src/db/defaultCategories.ts`), via a race-safe `INSERT ... ON CONFLICT DO NOTHING` (a prior `SELECT`-then-`INSERT` version raced on the app's first parallel `fetchAll()` burst and produced duplicate categories — since fixed, and the duplicates that had already been created were cleaned up directly in Neon).

---

## Design system

The app uses a **shadcn/ui-inspired semantic token system** — no hardcoded hex colors in components. All tokens are defined in `tailwind.config.js` and used as Tailwind classes (`bg-background`, `text-foreground`, etc.).

### Color tokens

| Token | Light | Dark | Used for |
|---|---|---|---|
| `background` | `#f1f5f9` (slate-100) | `#0b0f19` | Screen backgrounds — one step below `card` so borderless cards read as surfaces |
| `foreground` | `#09090b` | `#fafafa` | Primary text |
| `card` | `#ffffff` | `#1a1f2e` | Card surfaces (dark is elevated above background by design) |
| `border` | `#e4e4e7` | `#374151` | Borders, dividers |
| `input` | `#e4e4e7` | `#374151` | Input borders |
| `muted` | `#f4f4f5` | `#242b3d` | Muted backgrounds, icon containers — one step above `card` in dark so they stay visible on it |
| `mutedFg` | `#71717a` | `#9ca3af` | Secondary / placeholder text |
| `accent` | `#18181b` | `#fafafa` | Outline/ghost button text, checkbox fill (grayscale contrast pair; primary buttons use `BRAND_BLUE` instead, see below) |
| `accentFg` | `#fafafa` | `#18181b` | Contrasting text/icon against `accent` |
| `destructive` | `#ef4444` | `#ef4444` | Error states, delete actions |
| `positive` | `#16a34a` | `#22c55e` | Income, under-budget |
| `negative` | `#dc2626` | `#f87171` | Expense amounts |
| `warning` | `#d97706` | `#fbbf24` | Near-limit budget |
| `ring` | `#09090b` | `#d4d4d8` | Focus rings |

`BRAND_BLUE` / `BRAND_BLUE_DARK` (`constants/colors.ts`, both `#3b82f6`) is the single brand accent — not a `tailwind.config.js` token, since it's consumed programmatically (`brandBlue(isDark)`) rather than via className. It drives `Button`'s `variant="default"` background, `Chip`'s selected-pill fill, chart/progress colors, and the Android adaptive icon/notification/splash-tint config in `app.json`.

### Typography

Single family app-wide — Inter (`@expo-google-fonts/inter`), loaded blocking in `app/_layout.tsx` before first paint. Stands in for SF Pro Display/Rounded (the iOS system font): Apple's license doesn't permit bundling actual SF Pro font files in a cross-platform (iOS + Android) app, so Inter — visually close in x-height and letterform neutrality — is used as the open-license equivalent on both platforms.

- **Body / UI text** — Inter 400 (`font-sans`)
- **Labels / medium weight** — Inter 500 (`font-medium`)
- **Headings** — Inter 600 (`font-semibold`)
- **Hero numbers / emphasis** (`UIText variant="strong"`) — Inter 700 (`font-bold`)
- **Extra-heavy display** — Inter 800/900 (`font-extrabold`/`font-black`) also loaded; used ad hoc where a single figure needs to outrank even `strong` (e.g. Home's "Total spent" hero number uses `font-black` directly rather than through a `UIText` variant).
- Money amounts render in the same Inter weights as everything else — there is no separate monospace family, so digit alignment across a list isn't guaranteed the way a true mono font would provide.
- **Currency format** — `Rs X,XXX` via `utils/format.ts → fmt(n)`; the inverse `parseAmount(input)` strips non-numeric characters for form fields

### Sizing / spacing conventions

- Screen padding: `px-4` horizontal, `pt-4` top, `pb-24` bottom (clears tab bar)
- Card: `rounded-xl p-4`, no shadow, **borderless by default** (2026-07-11 redesign) — separation comes from the card/background surface contrast; `bordered` prop opts back into an outline. `utils/cardRow.ts` mirrors the same borderless look for virtualized-list rows
- Buttons: `h-11 rounded-lg`
- Form fields: 44px tall bordered `TextInput`s, reused on every form

---

## Dark mode architecture

`context/ThemeContext.tsx` is the single source of truth for both the **theme preference** (`'light'|'dark'|'system'`, persisted in AsyncStorage — this one preference is fine to keep local, unlike app data) and the resolved **`isDark` boolean** every screen reads for JS-driven colors.

```
ThemeProvider
  ├── reads AsyncStorage on mount → setThemeState + setColorScheme(saved)   (NativeWind's own setter)
  ├── setTheme (useCallback) → updates state + writes AsyncStorage + setColorScheme(t)
  ├── const { colorScheme, setColorScheme } = useColorScheme() from 'nativewind'  (NOT react-native's own hook)
  ├── isDark = colorScheme === 'dark'
  └── value (useMemo) → only new object when theme/isDark changes

app/_layout.tsx → InnerLayout
  ├── reads isDark from useTheme()
  └── <View className={isDark ? "dark flex-1" : "flex-1"}>
        all screens live here → NativeWind dark: variants activate
```

**Root-cause fix (2026-07-10): `isDark` must come from NativeWind's own `useColorScheme()`, never React Native's core one.** The original implementation read `systemScheme` from RN's `useColorScheme()` hook and separately called `nativewindColorScheme.set(theme)` as a side effect to drive `dark:` class resolution — two independent subscriptions to appearance state. On native, NativeWind's `.set()` calls RN's own `Appearance.setColorScheme()`, which **changes what RN's `useColorScheme()` itself reports app-wide** — a feedback loop where the "input" to the theme decision could be altered by its own "output," especially around explicit-theme ↔ 'system' transitions. The two values could disagree, which is why JS-driven colors (background of a chip, say) and `dark:` Tailwind variants (its text, if styled that way) could visibly diverge. The fix: `useColorScheme()` **imported from `nativewind`** returns `{ colorScheme, setColorScheme }` reading the *exact same* internal observable NativeWind uses to resolve `dark:` variants — so `isDark` and `dark:` classes are now reading from one shared source of truth by construction, not two synchronized-by-convention ones.

**Chip component is the second half of the fix.** Every selectable chip/tab/segmented-control in the app (category pickers, filter chips, type toggles, sign-in/sign-up tabs, theme picker) used to hand-roll its own `TouchableOpacity` + `dark:`-classed `UIText`, duplicated across 8 files — the exact pattern that caused the original bug, and it recurred more than once because there was no single place to fix it. `components/ui/Chip.tsx` is now that single place: it computes selected/unselected text color **entirely in JS** from `useTheme()`, the same convention `Button.tsx` already used, so a `dark:` className for interactive/stateful color can't be reintroduced by accident. Use it (`variant="pill"` for bordered/filled chips, `variant="underline"` for tab-style toggles, `bordered={false}` + a layout-only `style` for chips living inside a shared track like a segmented control) for any new selectable control instead of hand-rolling the pattern again.

The tab bar renders outside the NativeWind tree so it uses `useTheme()` + inline styles directly instead of Tailwind dark classes.

---

## Receipt image loading (cross-platform gotcha)

`transaction/[id].tsx`'s receipt thumbnail cannot use RN's `<Image source={{ uri, headers }}>` pattern for the `Authorization` header, even though that's the standard native approach — `react-native-web` renders a plain `<img>` tag, and **browsers give no way to attach custom headers to an `<img>` request**, so the header is silently dropped on web and the authenticated request 401s with nothing visibly wrong in the UI (just a blank/broken image). The fix, which works identically on native and web: `fetch()` the authenticated URL manually with the header, read the response as a `Blob`, and convert it to a data URI via `FileReader.readAsDataURL()` — then hand that data URI (no headers needed) to `<Image source={{ uri }}>`. Use this pattern for any future authenticated-image loading in this app; don't reach for `Image`'s `headers` option.

---

## Loading states (2026-07-10)

Screens that render a **computed numeric total** (Home's spent/income/remaining, Budget's overview card) used to render real `UIText` immediately from whatever the store held at mount — `0` before the first `fetchAll()` resolved — then silently update once data arrived. That's a "flash of wrong content": the number looked real, not loading, which reads as a bug even though it's just timing. The fix is a `Skeleton` placeholder (see Shared UI components), gated on **`status === "loading" && data.length === 0`** — true only before a store's first successful fetch, false again the instant it resolves (even to a genuinely-empty result) and false on every subsequent pull-to-refresh. This mirrors the same `status === "loading" && isEmpty` convention `DataState` already used for lists; `Skeleton` is the equivalent for a single value living inside an otherwise-static card, where swapping the whole card for a spinner would be heavier than necessary. Reintroducing local caching/persistence to avoid the flash entirely (stale-while-revalidate) was considered and rejected — it would partially undo the Phase 1 decision that the API is the sole source of truth, for a problem a skeleton already solves cleanly.

**2026-07-11 evolution:** skeletons now pulse (reanimated, reduce-motion aware) and extend to whole lists — `DataState` accepts a `loadingSkeleton` node so first loads show rows shaped like the real content (`TransactionItemSkeleton`, budget's `CategoryRowSkeleton`, BudgetHealthCard's mirrored loading layout) instead of a centered spinner. The gating rule is unchanged: first load only, never pull-to-refresh.

---

## Project structure

```
app/
  _layout.tsx              Root: ClerkProvider → ClerkLoaded → ThemeProvider → AuthBridge → InnerLayout
                           AuthBridge wires Clerk token into lib/api.ts, fires fetchAll() on sign-in
                           InnerLayout: Stack.Protected auth gating + dark class on root View
  login.tsx                Clerk sign-in/sign-up/verify-code/forgot-password/reset-password + Google OAuth
  scan.tsx                 Real camera capture → compress → Gemini OCR → editable review → save
                           Manual entry has an Expense/Income type toggle — the only place a
                           transaction's type is chosen; scanning is always Expense
  wallets.tsx               FlatList + RefreshControl + DataState
  wallet-form.tsx          Create/edit wallet, delete guarded (client + server)
  categories.tsx            FlatList + RefreshControl + DataState
  category-form.tsx        Create/edit category, icon picker, parent picker
  budget-form.tsx          Create/edit budget
  telegram-link.tsx        Connect/disconnect Telegram — generates a link code, opens the
                           t.me deep link, polls status (+ AppState resume) while waiting
  assistant.tsx            Q&A chat screen — message bubbles, suggested-question chips on
                           first open, calls POST /api/assistant/ask; pushed from Home
  recaps.tsx               In-app recap inbox — card list of past weekly/monthly recaps,
                           pull-to-refresh, GET /api/recaps; pushed from Home
  ai-disclosure.tsx        Static explainer of what's sent to Gemini and when (scanning,
                           assistant/quick-add, recaps, capture fallback); no data of its
                           own, pushed from Settings → Data
  transaction/
    [id].tsx               View/edit/delete + receipt thumbnail (authenticated fetch)
  (tabs)/
    _layout.tsx            Custom 5-item tab bar
    index.tsx               Home — ScrollView + RefreshControl, real totals; header icons
                            link to /recaps and /assistant next to the theme toggle
    transactions.tsx        FlatList (grouped by date) + RefreshControl + DataState
    budget.tsx               FlatList + RefreshControl + DataState
    analytics.tsx            ScrollView + RefreshControl, real aggregation
    settings.tsx             Profile, theme, sign out, export (Excel)/clear data, AI & data
                            disclosure, Connected apps → Telegram

store/            useWalletStore, useCategoryStore, useBudgetStore, useTransactionStore
                  — all API-backed, optimistic CRUD, status: idle|loading|error
                  useMessagingStore — single-object Telegram link status, not list-shaped
                  useRecapStore — read-only, fetchAll() only, no mutation actions

components/ui/    UIText, Card, Separator, Badge, Button, Chip, IconButton, ThemeToggle, TransactionItem,
                  TransactionItemSkeleton, DataState, Skeleton, Gauge, GoogleLogo
components/       BudgetHealthCard (domain card composing Card + Badge + Gauge)

context/          ThemeContext.tsx

hooks/            useDisplayTransactions, useTransactionFilters, useRefresh

lib/              api.ts (fetch wrapper + token getter), tokenCache.ts (Clerk SecureStore cache)

utils/            format.ts, dates.ts, analytics.ts, cardRow.ts, tempId.ts, payday.ts
                  (recurring-payday inference, unit-tested — server has an equivalent
                  twin in server/src/lib/insights.ts, not imported cross-package)

constants/        icons.ts (TX_ICONS, CAT_ICONS) — mockData.ts/seedData.ts deleted, defaults are server-side

types/            index.ts — Transaction, Budget, Wallet, Category, CategoryType, TxType enum

server/
  src/
    index.ts              Hono app entry, CORS, middleware + route mounting
    types.ts               Env (Bindings/Variables) type
    middleware/            auth.ts (clerkAuth), rateLimit.ts
    lib/                    cloudinary.ts, gemini.ts, telegram.ts, assistant.ts (Gemini
                            intent classification + answer phrasing), insights.ts (pure
                            spending/payday/survival/recap aggregation, unit-tested),
                            recap.ts (Gemini recap phrasing)
    db/                     schema.ts, client.ts, defaultCategories.ts
    routes/                 wallets, categories, budgets, transactions, data, scan, receipts,
                            messaging (Telegram link/status/unlink, authenticated),
                            assistant (POST /ask, authenticated — exports answerQuestion(),
                            reused by webhooks.ts so both surfaces share one code path),
                            webhooks (Telegram bot webhook — public, verified by secret token;
                            /start links the account, any other text is a Q&A question),
                            recap (GET /api/recaps, authenticated; exports
                            generateAndDeliverRecap()/generateRecapsForAllUsers(), called by
                            index.ts's scheduled() cron handler, not an HTTP route)
    index.ts also exports    scheduled() — Cloudflare Cron Trigger entry point (see
                            wrangler.toml's [triggers].crons), not reachable over HTTP
  drizzle/                 Generated SQL migrations
  wrangler.toml             KV namespace binding, [triggers].crons (weekly + monthly recap
                            schedules); DB/secrets via .dev.vars (dev) / `wrangler secret put` (prod)
```

---

## Shared UI components

### UIText
```tsx
<UIText variant="default|muted|heading|label|mono|unstyled" size="xs|sm|base|lg|xl|2xl" className="..." style={{...}} />
```
Wraps `<Text>`. `unstyled` sets no color class — for callers computing color in JS (see Dark mode architecture, pattern 2).

### Card / Separator / Badge / ThemeToggle
Card is **borderless by default** since the 2026-07-11 surface redesign (`bordered` prop opts back in); Separator/Badge unchanged; ThemeToggle now renders via IconButton.

### IconButton
```tsx
<IconButton onPress={fn} className="mr-3"><ChevronLeft size={20} color={iconColor} /></IconButton>
```
The square 36px icon button (screen-header back buttons, header add/edit actions, theme toggle) — a filled `bg-card` surface, replacing the outlined `TouchableOpacity` that was hand-rolled in 8 files. `className` is for layout-only additions (margins).

### Gauge / BudgetHealthCard
```tsx
<Gauge progress={0.7} color={BRAND_BLUE} trackColor={...}>{centered content}</Gauge>
```
`Gauge` is a presentational SVG semicircle (react-native-svg), colors passed in per the JS-driven convention. `BudgetHealthCard` (components/, not components/ui/) composes Card + Badge + Gauge for Home's "Budget health" section; the metric comes from the pure, unit-tested `utils/budgetHealth.ts` (safe-to-spend % across the month's budgets; Good ≥40% left / Watch / Over). `BRAND_BLUE` (#3b82f6) lives in `constants/colors.ts` and is shared by the tab bar's Scan button and the gauge.

### Button
```tsx
<Button label="..." variant="default|outline|ghost|destructive" onPress={fn} icon={<Icon />} disabled={bool} className="..." />
```
Text color set via inline `style`, not a Tailwind class, to guarantee correct contrast.

### Chip
```tsx
<Chip label="..." selected={bool} onPress={fn} variant="pill|underline" bordered={bool} size="xs|sm|base" disabled={bool} style={{...}} />
```
Every selectable chip/tab/segmented-control in the app — see "Dark mode architecture" for why this exists and replaced 8 hand-rolled copies of the same pattern. `style` is layout-only (flex, padding, margin); color is always computed internally from `useTheme()` and can't be overridden — that's the point.

### TransactionItem
```tsx
<TransactionItem merchant categoryName txType amount time icon isLast={bool} onPress={fn} />
```
`memo()`-wrapped, pressable. Callers resolve `categoryName`/`icon` via `useDisplayTransactions`.

### DataState
```tsx
<DataState status="idle|loading|error" isEmpty={bool} onRetry={fn} emptyMessage="..." loadingSkeleton={<Rows />} />
```
Unifies the loading / error+retry / empty-message states every API-backed list needs. Used as `ListEmptyComponent` in virtualized lists, or inline in plain `ScrollView` screens. `loadingSkeleton` (2026-07-11) replaces the centered spinner with skeleton rows shaped like the list's real content, so nothing jumps when data arrives — Transactions passes a date-label + card-of-rows mock, Home's recent list and Budget's category list render `TransactionItemSkeleton` / `CategoryRowSkeleton` equivalents.

### Alerts (RN `Alert.alert` — an AppAlert replacement was documented here but never landed)
All confirm/error dialogs currently use React Native's `Alert.alert` directly (settings, forms, scan, transaction detail). A themed in-app `showAlert`/`AlertHost` replacement was previously described in this file as built — **it does not exist in the codebase** (no `AppAlert.tsx`; corrected 2026-07-11). The motivation for eventually building it still stands: Android ignores the button `style` prop (destructive buttons render in the OS accent color), `react-native-web` doesn't implement `Alert` at all, and the native dialog follows the OS theme rather than the app's theme setting.

### Skeleton
```tsx
<Skeleton width={120} height={28} className="mt-1" />
```
Placeholder block for content that hasn't loaded yet (Home's totals, Budget's overview card). **Pulses gently** (reanimated 800ms opacity loop) so the wait reads as activity; automatically static under the OS reduce-motion setting. Gate it on `status === "loading" && data.length === 0` (see "Loading states"), never on `status === "loading"` alone — that would also flash a skeleton over already-loaded data on every pull-to-refresh, which is worse than the problem it solves.

Composite skeletons mirror their real component's layout so the screen doesn't reflow when data lands: `TransactionItemSkeleton` (shared, components/ui), `CategoryRowSkeleton` (local to budget.tsx), and BudgetHealthCard's built-in loading state. Follow this pattern — mirror the loaded layout — when adding a skeleton for any new component.

---

## Tab bar

Custom `CustomTabBar` in `app/(tabs)/_layout.tsx`. Five slots: Home, Transactions, **Scan** (action button — `router.push('/scan')`, not a real tab route), Budget, Settings. Active tab matched by **route name**, not index (`analytics` is a real route between `budget` and `settings` with no tab button of its own — reached via "See reports"/"View trends" links).

---

## Performance patterns

| Pattern | Where applied |
|---|---|
| `FlatList`/`SectionList` virtualization + `RefreshControl` | `transactions`, `budget`, `wallets`, `categories` |
| `RefreshControl` decoupled from initial-load status (`useRefresh` hook) | Every list screen — avoids a double-spinner on first automatic fetch |
| `memo()` on list items | `TransactionItem`, `CategoryRow` (budget.tsx) |
| Narrow Zustand selectors | Every store read (`useXStore(s => s.slice)`), never the whole store object |
| Optimistic updates | Every store mutation — instant UI feedback, roll back on API failure |
| Pure derivation helpers in `useMemo` | `totalsForMonth`, `spentByCategoryInMonth`, `budgetsForMonth`, `useDisplayTransactions` join, `utils/analytics.ts` |
| Server-side row caps | `transactions` capped at 500 rows (`ORDER BY date DESC, time DESC LIMIT 500`) |
| Client-side image compression before upload | `scan.tsx` — resize to 1600px edge + JPEG q0.6 before the receipt ever leaves the device |
| Request timeouts on outbound backend calls | Gemini (OCR) + Cloudinary calls bounded to 20s; assistant's two Gemini calls (intent classification, answer phrasing) bounded to 15s each — smaller structured-output payloads than the OCR call |

---

## Next steps (not started)

1. **Predictive overspend warning** — pure arithmetic (days elapsed vs. days in month, projected spend vs. budget limit) against data that already exists; no new backend, no messaging channel required first. The existing (currently unused) `AlertBanner` concept from earlier planning docs would need to actually be built — it doesn't exist as a component yet
2. ~~**Messaging channel — account linking**~~ — **Telegram done 2026-07-19** (`messaging_links`/`messaging_link_codes`, `/api/messaging/telegram/*`, `/webhooks/telegram`, Settings → Connect Telegram); WhatsApp once ready for Meta's Cloud API verification process, same table/pattern
3. ~~**Q&A assistant**~~ — **Done 2026-07-19** (same day) — spending summary / top spending / survival-until-payday, from both Telegram and a new in-app `app/assistant.tsx` screen; `answerQuestion()` is the one shared code path both surfaces call. Read-only by design
4. ~~**Weekly/monthly proactive AI recap**~~ — **Done 2026-07-20** — weekly (Monday) + monthly (1st) Cloudflare Cron Triggers, delivered via Telegram and a new in-app inbox (`app/recaps.tsx`); see `server/src/lib/recap.ts` / `server/src/routes/recap.ts`
5. **Natural-language quick-add** — "spent 500 on lunch" creating a real transaction from chat — deliberately deferred past the read-only Q&A assistant; needs its own confirm-before-save design
6. Budget auto-renewal logic behind the persisted "repeat" flag
7. A date field on manual entry / transaction edit, for consistency with the scan flow (currently the only place a transaction's date can be anything other than "today")
8. **Automatic transaction capture** (PLAN.md §7) — **PARKED 2026-07-15**: an in-progress notification-listener implementation was rolled back this session; no such code remains in the app. Still committed as a future feature (Android notification listener covering bank SMS via notifications → parse → user approves via prefilled deep link into `scan.tsx?manual=true`, Android-only by iOS platform limitation) but no longer next-in-line — revisit later. Its gallery/screenshot-import spinoff is a small, cross-platform addition to the scan flow that can still ship earlier, independent of the parked status
