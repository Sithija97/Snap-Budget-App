# SnapBudget — Consolidated Feature Plan

Single source of truth, combining the full feature roadmap with the narrowed AI scope. Supersedes the two earlier planning documents.

---

## 1. Core — already built (UI prototype, mock data)

| Feature | Status |
|---|---|
| Camera-first receipt scan, manual entry as secondary | Built (mock result) |
| Home dashboard — spent / income / remaining | Built (mock data) |
| Transactions — search + category filter, grouped by date | Built |
| Budget — category progress bars, semantic color coding | Built |
| Analytics — monthly/weekly bar chart, category breakdown | Built (orphaned, needs linking) |
| Dark / light / system theme | Built, persisted |
| Settings — profile, theme, budget row | Built (mostly non-functional) |

## 2. Backend — planned, not yet built

| Feature | Status |
|---|---|
| Neon (Postgres) database with full schema | Planned |
| Clerk authentication (email + Google) | Planned |
| Cloudflare Workers API layer | Planned |
| Cloudflare R2 receipt image storage | Planned |
| Gemini Vision for OCR + auto-categorization | Planned |
| Merchant cache (free repeat-scan lookups) | Planned |

## 3. Functional additions — this cycle

| Feature | Status |
|---|---|
| Zustand local state + AsyncStorage persistence | Planned |
| Wallets — list, add/edit, auto-created default wallet | Planned |
| "Balance not set" vs "Rs 0" distinction | Planned |
| Categories — user-manageable, Expense/Income only | Planned |
| Add/Edit Budget screen | Planned |
| Transaction detail — view/edit/delete | Planned |
| Analytics linked from Home and Budget | Planned |

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
- Watch item: Meta's free service-window replies become a paid category from October 1, 2026 — rate not yet published, recheck before this carries meaningful volume

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

## 7. Not in current scope (deferred, documented for later)

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

## 8. Sequencing

1. **Functional CRUD** (current cycle) — wallets, categories, budgets, transactions, local state
2. **Visual design polish** (next cycle)
3. **Real backend** — Neon, Clerk, Workers, Gemini Vision scanning
4. **Predictive overspend warning** — can ship as soon as real transaction data exists; it's pure arithmetic, no messaging channel required first
5. **Messaging channel** — Telegram first (fastest to validate), WhatsApp once ready for Meta's verification process
6. **Weekly/monthly recap** — built last, depends on whichever messaging channel is live