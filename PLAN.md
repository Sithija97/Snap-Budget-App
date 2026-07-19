# SnapBudget — Consolidated Feature Plan

Single source of truth, combining the full feature roadmap with the narrowed AI scope. Supersedes the two earlier planning documents.

---

## 1. Core — built and backend-connected

| Feature | Status |
|---|---|
| Camera-first receipt scan (real camera + Gemini Vision OCR), manual entry as secondary | Built |
| Home dashboard — spent / income / remaining | Built, real transaction data |
| Transactions — search + category filter, grouped by date | Built |
| Budget — category progress bars, semantic color coding | Built |
| Analytics — monthly/weekly bar chart, category breakdown | Built, real transaction aggregation |
| Dark / light / system theme | Built, persisted |
| Settings — profile (Clerk), sign out, export data, clear all data | Built |

## 2. Backend — built

| Feature | Status |
|---|---|
| Neon (Postgres) database with full schema | Built — 5 tables, Drizzle ORM, all app-level scoped by `userId` |
| Clerk authentication (email + Google) | Built — full sign-up/sign-in/verification flow |
| Forgot password (email flow via Clerk) | Built — `login.tsx` gained `forgot`/`reset` modes using Clerk's `reset_password_email_code` strategy: "Forgot password?" link (sign-in only) → email → 6-digit code + new password → signs the user in on success |
| Cloudflare Workers API layer (Hono) | Built — `/api/{wallets,categories,budgets,transactions,data,scan,receipts,messaging}` |
| Receipt image storage | Built on **Cloudinary** (private, signed URLs), not Cloudflare R2 — R2 requires a card on file even for its free tier; Cloudinary's free tier doesn't. No other architectural impact: images are still never exposed via a public URL, only through our own authenticated `/api/receipts/:key` route |
| Gemini Vision for OCR + auto-categorization | Built — `gemini-2.5-flash`, structured JSON output, matches against the user's real category list |
| Merchant cache (free repeat-scan lookups) | Not built — deferred, no current need identified |

## 3. Functional additions — built

| Feature | Status |
|---|---|
| Zustand state, API-backed (no local persistence — the backend is the source of truth) | Built |
| Wallets — list, add/edit, auto-created default wallet (seeded server-side on first sign-in) | Built |
| "Balance not set" vs "Rs 0" distinction | Built |
| Categories — user-manageable, Expense/Income only, duplicate-proof (DB unique index + API check) | Built |
| Add/Edit Budget screen | Built |
| Transaction detail — view/edit/delete, shows receipt thumbnail when scanned | Built |
| Analytics linked from Home and Budget | Built |
| **2026-07-11 UI redesign** — borderless surface design app-wide (slate page bg, elevated dark cards, shared IconButton), Home summary card rework with add-transaction affordances, brand-blue scan button | Built |
| **Budget health gauge on Home** — safe-to-spend % semicircular gauge with Good/Watch/Over badge (pure arithmetic, `utils/budgetHealth.ts`, unit-tested). A stepping stone toward §4's predictive overspend warning: same data, simpler metric (no pace projection yet) | Built |
| Animated skeleton loading — pulsing, reduce-motion aware, layout-mirroring skeletons for lists and cards (`DataState.loadingSkeleton`) | Built |

## 4. AI features — active scope

| Feature | Description | Status |
|---|---|---|
| **Predictive overspend warning** | "At this pace, you'll exceed your Shopping budget by month end." Pure arithmetic (days elapsed vs. days in month, projected against current spend) — no LLM, no fabricated figures, deterministic true/false comparison against real transaction data | Planned |
| **Weekly / monthly AI recap** | Natural-language summary delivered on a schedule ("You spent 12% less on food this week than your usual average"). Database computes the numbers via SQL aggregation; Gemini only phrases the sentence — never generates the figures itself | **Built** — see below |

## 5. WhatsApp / conversational access — active scope

| Feature | Description | Status |
|---|---|---|
| Telegram account linking | Deep-link "Connect Telegram" flow: app requests a short-lived one-time code, opens `t.me/<bot>?start=<code>`, the bot's webhook consumes the code and links the Telegram chat id to the SnapBudget account. No code ever needs to be typed manually. | **Built** — see below |
| Telegram / in-app Q&A | Free-text questions — spending summary, top spending categories, "will I survive until payday" — answered from real computed data, phrased by Gemini. Works identically from the Telegram bot chat and a new in-app Assistant screen. | **Built** — see below |
| WhatsApp receipt capture | Forward a receipt photo, same Gemini Vision pipeline as in-app scan replies with a confirmation | Planned |
| Weekly/monthly AI recap | Proactive, schedule-delivered version of the same Q&A data (not user-initiated) | **Built** — see §4 |
| Natural language quick-add | "Spent 500 on lunch" typed in WhatsApp or an in-app quick-add bar becomes a logged transaction | Planned — deliberately excluded from the Q&A pass below (2026-07-19 decision) to keep it read-only; no write path exists yet from chat |

**Telegram linking — built 2026-07-19:**
- `server/src/db/schema.ts` — `messagingLinks` (one row per linked chat, unique on `(channel, externalId)`) and `messagingLinkCodes` (one-time codes, 10-minute expiry checked at query time, no cron sweep) tables; migration `0004_stale_vance_astro.sql`
- `POST /api/messaging/telegram/link-code` (authenticated) — generates an 8-char unambiguous-alphabet code, returns `{ code, expiresAt, deepLink }`; rejects with 409 if already linked
- `GET /api/messaging/telegram` (authenticated) — `{ linked, displayName?, linkedAt? }`
- `DELETE /api/messaging/telegram` (authenticated) — unlink
- `POST /webhooks/telegram` (public, **not** behind `clerkAuth` — mounted before it in `index.ts`) — verifies Telegram's `X-Telegram-Bot-Api-Secret-Token` header against `TELEGRAM_WEBHOOK_SECRET`, handles `/start <code>`: validates the code hasn't expired, links the chat, replies in-chat, deletes the consumed code. Handles "already linked to another account" and "expired/invalid code" with a chat reply, not a silent failure
- `server/src/lib/telegram.ts` — `sendTelegramMessage`, matching the direct-fetch (no SDK) convention of `gemini.ts`/`cloudinary.ts`
- New env bindings: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_BOT_USERNAME` — see `.dev.vars.example` and the webhook-registration `curl` command documented in `wrangler.toml`
- Frontend: `useMessagingStore` (Zustand, `status: idle|loading|error` like the other four stores, but single-object shape since there's one Telegram link, not a list), `app/telegram-link.tsx` (loading skeleton / not-connected / waiting-for-confirmation with `AppState`-aware polling / connected-with-disconnect / error-with-retry states), Settings → new "Connected apps" section

**Q&A assistant — built 2026-07-19 (same day, second pass):**
- Supports exactly three question types, everything else gets a fixed polite fallback (no free-form answers, no accidental write actions — see "scoping decisions" below):
  - **Spending summary** ("how's my spending this month?") — this month's total spent/income + top 5 categories
  - **Top spending** ("what are my top spending categories in the last 6 months?") — category ranking over a rolling N-month window (defaults to 6 if unspecified)
  - **Survival estimate** ("will I survive until my next payday?") — infers a recurring payday from income-transaction history (`server/src/lib/insights.ts`'s `inferPayday`, day-of-month clustering with a ±3-day drift tolerance for weekends/holidays; needs ≥2 similar occurrences or returns "not enough data" rather than guessing), then projects the current total wallet balance against a 30-day average daily spend rate out to that date
- **Two-step architecture, no fabricated numbers**: `server/src/lib/assistant.ts`'s `classifyIntent()` (Gemini, structured JSON output) picks the intent only — it never sees real transaction data. `server/src/lib/insights.ts` computes the actual numbers in plain TypeScript from Drizzle rows. `phraseAnswer()` (Gemini again) receives only the already-computed JSON and is instructed to phrase, never invent. Verified by a route test asserting the exact computed-data object reaches `phraseAnswer` (`server/src/routes/assistant.test.ts`)
- `POST /api/assistant/ask` (authenticated) — used by the in-app screen
- Telegram webhook extended: any non-`/start` message from an **already-linked** chat is answered via the same `answerQuestion()` function the HTTP route calls (`server/src/routes/assistant.ts`, exported and reused — one code path, not two copies that could drift). An unlinked chat asking a question gets a "link your account first" reply instead of an error
- `app/assistant.tsx` — new in-app chat screen (message bubbles, suggested-question chips on first open, loading indicator while waiting on a reply), entry point is a new header icon on Home next to the theme toggle — pushed route, not a 6th tab, matching the original §6 design intent
- **Payday inference has no dedicated schema field** — deliberate 2026-07-19 scoping decision to infer from existing income-transaction history rather than add a new Settings field; means the estimate is only as good as how regularly the user logs income, and is honest about that (returns `hasEnoughData: false` rather than guessing)
- **Not built**: writing transactions from chat ("spent 500 on lunch") — explicitly scoped out this pass to keep the assistant read-only

**Weekly/monthly proactive recap — built 2026-07-20:**
- Two Cloudflare Cron Triggers (`server/wrangler.toml`'s `[triggers].crons = ["0 8 * * 1", "5 8 1 * *"]` — weekly Monday 08:00 UTC, monthly 1st 08:05 UTC), both firing the same `scheduled()` handler exported from `server/src/index.ts`, which tells them apart by comparing `event.cron` against the weekly string
- `server/src/lib/insights.ts`'s new `recapForPeriod()` — pure aggregation over a `[periodStart, periodEnd]` window (total spent, total income, transaction count, top 5 categories, and the same window one period back for a "vs last period" comparison), built on the existing `runQuery()` helper so a recap can never disagree with an equivalent Q&A answer for the same dates
- `server/src/lib/recap.ts`'s `phraseRecap()` — same Gemini direct-fetch + `responseSchema` pattern as `assistant.ts`, receives only the already-computed data, writes 2-4 sentences
- `server/src/routes/recap.ts`'s `generateAndDeliverRecap(env, db, userId, periodType, today)` — the per-user unit of work: skips entirely (no Gemini call, no row) when the user logged zero transactions in the window; otherwise phrases the recap and inserts into a new `recaps` table via `.onConflictDoNothing()` against a unique `(userId, periodType, periodStart)` index, so a retried or double-fired cron can't send the same recap twice — Telegram delivery only fires when the insert actually happened. `generateRecapsForAllUsers()` loops every user, catching per-user failures so one bad user can't sink the batch
- Delivered via Telegram when linked, but the `recaps` row is written regardless — the in-app inbox (`app/recaps.tsx`, `useRecapStore`, entry point a new `Bell` header icon on Home next to the Assistant `Sparkles` icon) works for every user, not just Telegram-linked ones, per the 2026-07-20 scoping decision to build both surfaces in the same pass
- `GET /api/recaps` (authenticated) — lists the caller's past recaps newest-first, backing the inbox screen
- Unit-tested (`insights.test.ts`'s `recapForPeriod` cases) and route-tested (`recap.test.ts`'s `periodWindows` date-math cases, plus `generateAndDeliverRecap`'s skip-when-empty and idempotent-insert behavior with `phraseRecap`/`sendTelegramMessage` mocked)

**Implementation approach — no additional cost:**
- Meta WhatsApp Cloud API, direct integration (skip Twilio/BSP markup) — free to access, free messaging as long as the user initiates and your own AI (not Meta's Business Agent) replies within the 24-hour window
- **Telegram Bot API** as a parallel or first-built channel — completely free forever, no business verification required, faster to prototype the whole conversational flow before committing to Meta's setup process
- Watch item (updated 2026-07-10): Meta confirmed service-window replies become **per-message billed from October 1, 2026** (early figures ~US$0.0068/message, flat, no volume discount; exact per-market rates promised by September 1, 2026). Only exception: 72-hour "free entry point" windows from Click-to-WhatsApp ads — not applicable to us. Decision: **Telegram first** (free forever); revisit WhatsApp once real rates publish in September

**Remaining backend pieces (additive only, no new vendors):**

```
POST /webhooks/whatsapp        — receive incoming WhatsApp messages (Telegram's is built, see above)
```

`messaging_links` / `messaging_link_codes` tables are built (see above) — `channel` is currently a `"telegram"`-only enum in the schema; adding `"whatsapp"` when that channel is built is a one-line enum change, not a new table.

Cloudflare cron triggers (already free on the Workers plan) handle recap scheduling — **built 2026-07-20**, see the "Weekly/monthly proactive recap" section above.

## 6. Additional frontend work needed

| Addition | Purpose | Status |
|---|---|---|
| Telegram linking screen | Settings → "Connect Telegram" → verification flow | **Built** — `app/telegram-link.tsx` |
| WhatsApp linking screen | Settings → "Connect WhatsApp" → verification flow | Planned, same pattern as Telegram once that channel is built |
| In-app Assistant / chat screen | Pushed route from Home for users who want Q&A without leaving the app — not a 6th tab | **Built** — `app/assistant.tsx`, entry point is a header icon on Home |
| Quick-add bar | Persistent typed-entry input on Home | Planned |
| Notification / alerts inbox | List of past recap summaries and overspend warnings | **Built (recaps only)** — `app/recaps.tsx`; overspend warnings will land here too once §1's predictive warning ships |
| Inline predictive warning banner | Reuses the existing (currently unused) `AlertBanner` component on the Budget screen | Planned |
| Push notification permission prompt | Needed for recaps and warnings to reach the user | Planned |
| AI data-sharing disclosure | Settings toggle explaining transaction data is sent to Gemini for these features | Planned |

---

## 7. Automatic transaction capture (PARKED — 2026-07-15)

**Status: parked, not actively worked on.** An in-progress implementation attempt was rolled back this session (2026-07-15) — no notification-listener code remains in the codebase. Still committed as a future feature, but removed from the near-term sequencing (§9); revisit after the active AI + messaging scope (§4–§6) ships, or when there's fresh appetite to pick it back up. Nothing below describes code that exists today — it's the design as last planned, kept for whenever this resumes.

Digital payments (banking apps, PickMe/Uber, card taps) produce no printed receipt, so today they can only be entered manually — the core "snap" flow gives those transactions zero value. This feature detects them automatically and asks the user to approve; **nothing is ever saved without explicit confirmation**. Decided 2026-07-10; starts after the active AI + messaging scope ships. Free to run — no paid services.

**Backbone — Android notification listener:**
- `NotificationListenerService` reads incoming notifications from a user-selected allowlist of apps (their banks, ride apps). Bank SMS alerts are covered too: an SMS fires a Messages-app notification whose full body the listener receives — this is the Play-compliant route (the restricted `READ_SMS`/`RECEIVE_SMS` permissions are never requested; expense tracking is not an approved use case for them)
- Candidate module: `expo-android-notification-listener-service` (Expo Modules API) — requires the existing EAS dev build, won't run in Expo Go
- Parsing: on-device regex templates per Sri Lankan bank format first (free, private, no network); Gemini structured-output fallback for unmatched text — gated behind the AI data-sharing disclosure (§6)
- Flow: parsed payment → local notification "Add Rs 1,450 at Uber?" → deep link into `scan.tsx?manual=true` prefilled → user approves → saved via existing API. Unactioned suggestions land in the notification/alerts inbox (§6). Dedup by (amount, rounded timestamp) hash — a card payment often triggers both an app push and an SMS
- Graceful degradation: a detail-free notification ("You have a transaction alert") still triggers a prompt with wallet/time prefilled and only the amount left to type
- **Step zero before building**: collect a week of real notifications from actual Sri Lankan banking apps to measure what fraction contain parseable amounts

**Constraints (accepted):**
- **Android-only** — iOS has no API for reading other apps' notifications; iPhone users keep manual entry + screenshot import
- "Notification access" is a scary special-access permission → needs a dedicated explainer screen
- Bank alert formats change over time → regex templates treated as maintainable data, Gemini as safety net
- Ruled out: Accessibility-Service screen scraping (Play delisting risk), Gmail API auto-parsing (restricted scope requires paid CASA audit), bank aggregation APIs (paid, no Sri Lanka coverage)

**Cheap spinoffs that can ship earlier, independently:**
| Addition | Notes |
|---|---|
| Gallery/screenshot import in scan flow | `launchImageLibraryAsync` alongside the existing camera source — payment-confirmation screenshots go through the same Gemini Vision pipeline; small change, works on iOS |
| Android share target | Share a receipt screen/PDF from another app straight into the scan pipeline; intent-filter addition |

---

## 8. Not in current scope (deferred, documented for later)

These were considered and intentionally set aside — not rejected, just not being built this cycle:

| Feature | Category |
|---|---|
| Anomaly / duplicate transaction detection | AI — proactive intelligence |
| Smart recurring-bill pattern detection | AI — proactive intelligence |
| Voice-to-transaction | AI — frictionless capture |
| Per-user learned merchant corrections | AI — frictionless capture |
| Debt/Loan tracking | Core functionality |
| Connect to banks | Core functionality |
| Events | Core functionality |
| Recurring Transactions (auto-renewal automation) | Core functionality |

---

## 9. Sequencing

1. ~~**Functional CRUD**~~ — wallets, categories, budgets, transactions, local state — **Done**
2. ~~**Visual design polish**~~ — shadcn-style token system, dark mode — **Done**
3. ~~**Real backend**~~ — Neon, Clerk, Workers, Gemini Vision scanning (Cloudinary in place of R2, see §2) — **Done**
4. ~~**Forgot password**~~ — **Done 2026-07-19**: `login.tsx` gained `forgot`/`reset` modes using Clerk's `reset_password_email_code` strategy
5. **Predictive overspend warning** — next up. Can ship now that real transaction data exists; it's pure arithmetic, no messaging channel required first
6. ~~**Messaging channel — account linking**~~ — **Done 2026-07-19** (Telegram) — `messaging_links`/`messaging_link_codes` tables, `/api/messaging/telegram/*` routes, public `/webhooks/telegram` webhook, Settings → Connect Telegram screen. WhatsApp once ready for Meta's verification process, same table/pattern
7. ~~**Q&A assistant**~~ — **Done 2026-07-19** (same day, second pass) — spending summary / top spending / survival-until-payday, answerable from both the Telegram bot and a new in-app Assistant screen (`app/assistant.tsx`), backed by `server/src/lib/{assistant,insights}.ts`. Read-only by design — no natural-language quick-add yet
8. ~~**Weekly/monthly proactive recap**~~ — **Done 2026-07-20** — same underlying data as the Q&A assistant, delivered unprompted via two Cloudflare Cron Triggers (weekly + monthly), Telegram + a new in-app inbox (`app/recaps.tsx`)
9. **Natural language quick-add** — "spent 500 on lunch" creating a real transaction from chat — deliberately deferred past the Q&A assistant to keep that read-only; needs its own write-path safety design (confirm-before-save, matching the scan review flow's spirit)
10. **Automatic transaction capture** (see the dedicated "§7. Automatic transaction capture (PARKED)" section above) — **parked 2026-07-15**, no longer next-in-line. Revisit later; not currently being built. The gallery/screenshot-import spinoff is small enough to slot in earlier whenever convenient, independent of the parked status