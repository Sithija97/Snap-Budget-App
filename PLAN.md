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
| Cloudflare Workers API layer (Hono) | Built — `/api/{wallets,categories,budgets,transactions,data,scan,receipts}` |
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
| **Weekly / monthly AI recap** | Natural-language summary delivered on a schedule ("You spent 12% less on food this week than your usual average"). Database computes the numbers via SQL aggregation; Gemini only phrases the sentence — never generates the figures itself | Planned |

## 5. WhatsApp / conversational access — active scope

| Feature | Description | Status |
|---|---|---|
| WhatsApp receipt capture | Forward a receipt photo, same Gemini Vision pipeline as in-app scan replies with a confirmation | Planned |
| WhatsApp / in-app Q&A | "How much have I spent on food this month?" — Gemini function-calling selects the SQL query, Neon runs it, Gemini phrases the answer. No vector DB needed, data is structured | Planned |
| Natural language quick-add | "Spent 500 on lunch" typed in WhatsApp or an in-app quick-add bar becomes a logged transaction | Planned |

**Implementation approach — no additional cost:**
- Meta WhatsApp Cloud API, direct integration (skip Twilio/BSP markup) — free to access, free messaging as long as the user initiates and your own AI (not Meta's Business Agent) replies within the 24-hour window
- **Telegram Bot API** as a parallel or first-built channel — completely free forever, no business verification required, faster to prototype the whole conversational flow before committing to Meta's setup process
- Watch item (updated 2026-07-10): Meta confirmed service-window replies become **per-message billed from October 1, 2026** (early figures ~US$0.0068/message, flat, no volume discount; exact per-market rates promised by September 1, 2026). Only exception: 72-hour "free entry point" windows from Click-to-WhatsApp ads — not applicable to us. Decision: **Telegram first** (free forever); revisit WhatsApp once real rates publish in September

**New backend pieces required (additive only, no new vendors):**

```
POST /webhooks/whatsapp        — receive incoming WhatsApp messages
POST /webhooks/telegram        — receive incoming Telegram messages
POST /api/recap/generate       — cron-triggered Worker: SQL aggregation + Gemini phrasing + send
```

```sql
CREATE TABLE messaging_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,          -- 'whatsapp' | 'telegram'
  external_id TEXT NOT NULL,      -- phone number or Telegram chat ID
  linked_at TIMESTAMPTZ DEFAULT NOW()
);
```

Cloudflare cron triggers (already free on the Workers plan) handle recap scheduling — no new infrastructure.

## 6. Additional frontend work needed

| Addition | Purpose |
|---|---|
| WhatsApp/Telegram linking screen | Settings → "Connect WhatsApp" or "Connect Telegram" → verification flow |
| In-app Assistant / chat screen | Pushed route from Home for users who want Q&A without leaving the app — not a 6th tab |
| Quick-add bar | Persistent typed-entry input on Home |
| Notification / alerts inbox | List of past recap summaries and overspend warnings |
| Inline predictive warning banner | Reuses the existing (currently unused) `AlertBanner` component on the Budget screen |
| Push notification permission prompt | Needed for recaps and warnings to reach the user |
| AI data-sharing disclosure | Settings toggle explaining transaction data is sent to Gemini for these features |

---

## 7. Automatic transaction capture (committed — later cycle)

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
4. **Predictive overspend warning** — next up. Can ship now that real transaction data exists; it's pure arithmetic, no messaging channel required first
5. **Messaging channel** — Telegram first (fastest to validate), WhatsApp once ready for Meta's verification process
6. **Weekly/monthly recap** — built last of the active scope, depends on whichever messaging channel is live
7. **Automatic transaction capture** (§7) — committed, but starts only after 4–6 ship. The gallery/screenshot-import spinoff is small enough to slot in earlier whenever convenient