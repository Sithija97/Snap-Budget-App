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
| Natural language quick-add | "Spent 500 on lunch" typed in Telegram or the in-app Assistant chat becomes a logged transaction, confirm-before-save | **Built** — see below |

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

**Natural language quick-add — built 2026-08-11:**
- `server/src/lib/assistant.ts`'s `classifyIntent()` gains a fourth intent, `add_transaction`, alongside `query`/`budget_status`/`survival_estimate`/`unsupported` — Gemini extracts `{merchant, amount, categoryName, txType, date}` as structured JSON from free text ("spent 500 on lunch"), matched against the user's real category list like OCR scanning already does; it never writes anything itself
- **Confirm-before-save, not silent write** — `answerQuestion()` (`server/src/routes/assistant.ts`) returns the parsed draft plus a human-readable confirmation line ("Log spend of Rs 500 for \"lunch\" (Food) on 2026-08-11?") but does not save it. The draft is mirrored into `RATE_LIMIT_KV` under `draft:<userId>` (5-minute TTL, one pending draft per user — a second `add_transaction` message before the first is resolved simply overwrites it) so either surface can resume it
- `POST /api/assistant/confirm` and `POST /api/assistant/cancel` — save or discard the pending draft. `saveDraftTransaction()` mirrors `scan.tsx`'s default-wallet-fallback rule and creates a new category server-side if the named one doesn't exist yet (case-insensitive match first)
- `app/assistant.tsx` — chat bubbles for an `add_transaction` reply now render Confirm/Cancel buttons; confirming refetches `useTransactionStore`/`useCategoryStore` so Home/Transactions/Categories stay in sync, matching every other cross-screen mutation in the app
- Telegram has no button step — a pending draft is confirmed/cancelled by the next free-text reply (`yes`/`y`/`yeah`/`confirm`/`ok`/`okay`/`sure` vs. `no`/`n`/`nope`/`cancel`/`stop`), checked before the message is classified as a new question so "yes" doesn't get sent to Gemini as a fresh nonsensical query
- One code path for both surfaces (`answerQuestion()`/`saveDraftTransaction()`, exported from `routes/assistant.ts` and reused by `routes/webhooks.ts`) — same guarantee the Q&A assistant already relies on
- Route-tested (`assistant.test.ts`): intent classification stubbed, exercises the confirm/cancel/pending-draft-overwrite cycle against an in-memory KV stand-in

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
| Push notification permission prompt | Needed for recaps and warnings to reach the user | Partially built — `expo-notifications` is installed and configured (see §7), but only requested/used for the capture-flow's FYI notification so far, not wired up for recaps/overspend warnings yet |
| AI data-sharing disclosure | Settings toggle explaining transaction data is sent to Gemini for these features | Planned |

---

## 7. Automatic transaction capture (Built — 2026-08-10, Android only, untested on-device)

**Status: code complete, not yet verified on a real device.** This session (2026-08-10) implemented the full pipeline below. Everything typechecks and the parsing/dedup/route logic is unit- and route-tested, but the actual native listener, the Android manifest service merge, and the notification permission/deep-link flow have **not been run on a device or emulator** — this dev environment has no JDK/Android toolchain to run a Gradle build. Verify end-to-end on a real device (or emulator) before relying on it, especially: the notification-listener service actually receiving `onNotificationPosted` callbacks, the "Enable in Settings" deep link, and the FYI local notification's tap-to-open-inbox behavior.

Digital payments (banking apps, PickMe/Uber, card taps) produce no printed receipt, so today they can only be entered manually — the core "snap" flow gives those transactions zero value. This feature detects them automatically and asks the user to approve; **nothing is ever saved without explicit confirmation**. Free to run — no paid services beyond the existing Gemini usage.

**Backbone — Android notification listener:**
- `modules/expo-notification-listener/` — a locally-vendored Expo Modules API module (not an npm dependency), trimmed from the MIT-licensed `expo-android-notification-listener-service` reference implementation with its unconditional app-icon-to-disk writing removed (we only need text, not icons). Native side: `NotificationListener.kt` (extends `NotificationListenerService`, filters by allowlist, 1s same-key dedup) + `NotificationListenerModule.kt` (Expo module: `isAccessGranted()`, `openAccessSettings()`, `setAllowedPackages()`, emits `onNotification`/`onListenerConnectionChange` events). JS side: `src/index.ts` (platform-gated export), `.web.ts` no-op stub for web/iOS.
- Linked via `package.json`'s `"expo-notification-listener": "file:./modules/expo-notification-listener"` + autolinking's default `./modules/` search path — confirmed resolved correctly by `npx expo-modules-autolinking resolve --platform android`, and `expo prebuild` succeeds. The module's own `AndroidManifest.xml` (service + `BIND_NOTIFICATION_LISTENER_SERVICE` + intent-filter) merges at **Gradle build time**, not prebuild time, so it could not be visually confirmed in this session — needs a real build to verify.
- Bank SMS alerts are covered too: an SMS fires a Messages-app notification whose full body the listener receives — this is the Play-compliant route (the restricted `READ_SMS`/`RECEIVE_SMS` permissions are never requested)
- Orchestration: `lib/notificationCapture.ts` — wires the native listener's events through the parser → Gemini fallback → `useCaptureStore`, fires the FYI local notification, and re-applies the allowlist on app foreground (the listener service can start independently of app state). Started from `app/_layout.tsx`'s `AuthBridge`, alongside the other stores' sign-in-gated setup.

**Parsing:**
- `utils/notificationParser.ts` — on-device, regex-only, free/private/no-network. The "step zero" real-sample check happened 2026-08-10 (same day, later in the session) — four real notifications from a live Sri Lankan account (one OTP + three card-authorisation SMS alerts from ComBank/Keells/PickMe/Uber Eats) were checked against the original 3 generic templates, which **missed all three real purchase alerts** (real format is "Purchase at MERCHANT for LKR AMOUNT ... authorised", not the assumed "debited/spent Rs AMOUNT" shape) and would have burned a Gemini call on every single one. Added a verified real template for that exact card-authorisation format, plus:
  - `cleanMerchant()` — strips embedded phone numbers, run-together city+country-code suffixes (e.g. "COLK" = "COL" + "LK"), trailing 2-letter country codes, trailing numeric merchant codes, and collapses immediately-repeated words, then title-cases — turns raw POS strings like "KEELLS PANNIPITIYA PANNIPITIYA COLK" into "Keells Pannipitiya" without a network call. Best-effort only; user can still edit before saving.
  - `extractDateFromText()` — pulls a `DD/MM/YY(YY)` date out of the message text when present and prefers it over the notification's Android-delivery timestamp, since a delayed SMS relay could otherwise misattribute the transaction to the wrong day. `ParsedNotificationTransaction.date` is `null` when the text has no printed date, in which case the caller (`lib/notificationCapture.ts`) falls back to `postTime`.
  - `NON_TRANSACTION_RE` — a narrow, deliberately-conservative guard (`otp`, `one-time password`, `verification code`, `use code \d`, `do not share`) that runs before every template, so an OTP/approval-code SMS like "...LKR 20,000.00 attempted. Please use code 719321 to approve" is never treated as a completed transaction even by a future, looser template. Kept narrow on purpose — broader words like "attempted"/"declined"/"approve" were considered and rejected because a bank could plausibly use them in genuinely completed-transaction wording too ("your payment attempt was successful"); a false-negative here just costs an extra Gemini call, a false-positive would make a real transaction silently vanish before the user ever sees it.
- Gemini structured-output fallback: `server/src/lib/assistant.ts`'s `extractTransactionFromText()` (reuses the same `TransactionDraft` shape and `validateDraft()` validation as the existing chat quick-add path) via `POST /api/assistant/parse-notification` (no KV persistence — unlike chat, the client already holds the draft in its own review screen). Classifies OTPs/marketing/non-transaction notifications as `isTransaction: false` rather than fabricating a draft — same intent as the on-device guard above, kept as defense-in-depth for whatever the regex layer misses.
- Dedup: `isDuplicateNotification()` — same amount within a 90s window (not a fixed rounded-timestamp bucket, which wrongly splits pairs straddling a bucket edge) — a card payment often triggers both an app push and an SMS relay.
- Graceful degradation: an unparsed notification still becomes a suggestion with `amount: null` — shown in the inbox with its raw text, review screen has amount blank for manual entry rather than being dropped.
- Unit-tested directly against the four real samples (`utils/notificationParser.test.ts`) — not synthetic examples.

**Flow (revised from the original design — see 2026-08-10 decisions below):**
- Parsed payment → saved as a `CapturedSuggestion` in `useCaptureStore` (Zustand + AsyncStorage, local-only, capped at 200 entries) → a **local FYI notification** ("Added Rs 1,450 transaction from Uber to your review inbox") fires, tap opens `app/captured.tsx` → user taps **Review** on any pending suggestion → deep-links into `scan.tsx?manual=true&amount=...&merchant=...&category=...&date=...&captureId=...` prefilled → user edits/confirms → existing manual-save path saves it and marks the source suggestion `saved` in the store.

**2026-08-10 scoping decisions (this session, diverging from the original design above):**
- **In-app inbox now, interactive push later.** The original design had a local notification whose tap deep-linked directly into a prefilled review with action buttons. Since `expo-notifications` had no infrastructure in the app yet (tracked separately in §6) and this session couldn't device-test a build, the interactive push was descoped to a **plain FYI notification** (fire-and-forget, no action buttons, tap just opens the inbox) plus the inbox screen (`app/captured.tsx`) as the source of truth for pending suggestions. Full push-driven review (matching the original "Add Rs 1,450 at Uber?" one-tap flow) is a fast-follow once this can be verified on a real device.
- **Curated allowlist, not full app enumeration.** Android has no Play-policy-safe way to list all installed apps without the heavily-scrutinized `QUERY_ALL_PACKAGES` permission. `utils/knownCaptureApps.ts` ships a curated list of verified real package names (ComBank, HNB, Sampath, BOC, NDB, PickMe, Uber) as toggleable chips, plus a manual "add by package name" text field in `app/notification-capture.tsx` for anything not listed. Also includes Google Messages and Samsung Messages (`com.google.android.apps.messaging`, `com.samsung.android.messaging`) — the real samples confirmed card-authorisation alerts arrive as SMS relayed through the default Messages app, not the bank's own app, matching the original design's "bank SMS alerts are covered too" note. Watching a Messages app is a materially bigger trust surface than a single bank app (SnapBudget then reads the text of *every* SMS, not just bank ones), so `notification-capture.tsx` shows an explicit extra disclosure (`MESSAGING_APP_PACKAGES` check) when one is selected, on top of the general notification-access explainer.
- **Vendored, not npm-installed, native module.** See "Backbone" above — auditability for a permission-sensitive native service outweighed the convenience of depending on a single-maintainer package.

**Constraints (accepted):**
- **Android-only** — iOS has no API for reading other apps' notifications; iPhone users keep manual entry + screenshot import. `notification-capture.tsx` shows an explanatory message instead of the picker when `isNotificationCaptureSupportedPlatform` is false.
- "Notification access" is a scary special-access permission → `app/notification-capture.tsx` is a dedicated explainer screen (Settings → Automation → Automatic capture) with an explicit description of what is/isn't read, before the "Enable in Settings" deep link
- Bank alert formats change over time → regex templates treated as maintainable data (`utils/notificationParser.ts`'s `TEMPLATES` array), Gemini as safety net
- Ruled out: Accessibility-Service screen scraping (Play delisting risk), Gmail API auto-parsing (restricted scope requires paid CASA audit), bank aggregation APIs (paid, no Sri Lanka coverage), `QUERY_ALL_PACKAGES` app enumeration (Play review risk for a non-launcher app)

**Follow-up work (not done this session):**
- Verify on a real Android device/emulator: manifest service merge, permission grant flow, listener actually receiving notifications, FYI notification + tap-to-inbox
- Only one bank's real format (ComBank's card-network SMS relay) has been verified — HNB/Sampath/BOC/NDB alerts may use different wording and will likely need their own template entries once samples are available; until then they rely on the Gemini fallback
- Upgrade the FYI notification to the original interactive one-tap-review design once device-verified
- AI data-sharing disclosure (§6, still "Planned") should mention the Gemini notification-parsing fallback alongside receipt OCR and chat quick-add

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
9. ~~**Natural language quick-add**~~ — **Done 2026-08-11** — "spent 500 on lunch" typed in the in-app Assistant or Telegram becomes a confirm-before-save draft (`add_transaction` intent, `/api/assistant/{confirm,cancel}`), one code path shared by both surfaces
10. ~~**Automatic transaction capture**~~ (see the dedicated "§7. Automatic transaction capture" section above) — **Built 2026-08-10**, Android only, code complete but **not yet verified on a real device** (no JDK/Android toolchain in the build environment this session). Verify the manifest/permission/listener flow on-device before relying on it, then revisit the interactive-push follow-up. The gallery/screenshot-import spinoff is still independent, still not built