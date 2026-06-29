# SnapBudget

## What problem does this app solve?

Managing personal finances in Sri Lanka is tedious. People lose track of daily spending, overshoot budgets, and have no quick way to log cash-based purchases. SnapBudget solves this by letting users **snap a photo of a receipt** to auto-categorize the expense, then giving them a clear dashboard of where their money goes each month — budgets, spending trends, and category breakdowns — all in one place on their phone.

## Core features

| Feature | Status | Screen |
|---|---|---|
| **Login / Sign-up** | UI complete, no backend auth | `app/login.tsx` |
| **Home dashboard** | Wallet summary, stat chips, recent transactions, profile modal | `app/(tabs)/index.tsx` |
| **Transaction records** | Filterable list grouped by date, income/expense summaries | `app/(tabs)/transactions.tsx` |
| **Budget tracker** | Per-category progress bars, ring chart showing % used | `app/(tabs)/budget.tsx` |
| **Analytics / Reports** | Donut chart (category breakdown), bar chart (monthly trend), tab switcher | `app/(tabs)/analytics.tsx` |
| **Receipt scanner** | Camera placeholder UI, mock "AI-powered" categorization, save flow | `app/scan.tsx` |

## Current state

The app is a **fully styled UI prototype** running on mock data. There is no backend, no persistent storage, and no real authentication. All data comes from `constants/mockData.ts`. The receipt scanner UI is in place but does not use the device camera yet — it shows a placeholder and a simulated detection result.

### What works

- Complete navigation: login -> tab bar (Home, Records, Budget, Reports) + scan modal
- Polished, production-quality UI with custom dark/light theme, DM Sans / DM Mono fonts, Lucide icons
- NativeWind (Tailwind CSS) styling throughout
- SOLID-aligned architecture: custom hooks, extracted components, memoization
- `@/` path aliases for clean imports
- Runs via Expo Go (SDK 54) on physical devices

### What does not work yet

- **No real authentication** — login button navigates directly to home, Google sign-in is a non-functional button
- **No backend / database** — all financial data is hardcoded mock data
- **No real receipt scanning** — camera integration (`expo-camera`) is installed but not wired up; the "Capture Receipt" button shows a static mock result
- **No data persistence** — nothing is saved between sessions
- **Dates are hardcoded** — `utils/dates.ts` has static "Today" / "Yesterday" dates (2026-05-26)

## Tech stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Expo (Managed) | SDK 54.0.35 |
| Runtime | React Native | 0.81.5 |
| UI | React | 19.1.0 |
| Routing | expo-router (file-based) | 6.0.24 |
| Styling | NativeWind (Tailwind CSS for RN) | 4.2.4 |
| Icons | lucide-react-native | 1.16.0 |
| Charts | react-native-svg (custom components) | 15.12.1 |
| Fonts | DM Sans (400, 500) + DM Mono (400) | Google Fonts |
| Camera | expo-camera (installed, unused) | 17.0.10 |
| Language | TypeScript (strict mode) | 5.9.2 |

## Project structure

```
app/
  _layout.tsx            Root layout (fonts, splash screen, SafeAreaProvider)
  login.tsx              Login screen
  scan.tsx               Receipt scanner (modal)
  (tabs)/
    _layout.tsx          Tab bar with floating scan button
    index.tsx            Home dashboard
    transactions.tsx     Transaction records
    budget.tsx           Budget tracker
    analytics.tsx        Analytics / reports

components/
  ui/
    TransactionItem.tsx  Single transaction row
    SummaryCards.tsx      Income/expense card pair
    CategoryProgressBar.tsx  Budget category bar
    AlertBanner.tsx      Warning/info banner
    SectionTitle.tsx     Reusable section header
    StatChip.tsx         Colored stat badge
  charts/
    DonutChart.tsx       SVG donut with legend
    SpendingBarChart.tsx SVG bar chart
  home/
    ProfileModal.tsx     User profile bottom sheet

hooks/
  useTransactionFilters.ts  Filter + group transactions (useMemo)

utils/
  format.ts             Currency formatter (Rs locale)
  dates.ts              Group transactions by date

constants/
  mockData.ts           All mock data (user, transactions, budgets, charts)
  theme.ts              Color palette (exported as Colors object)
  icons.ts              Lucide icon registry maps

types/
  index.ts              TypeScript interfaces (Transaction, Budget, Wallet, etc.)
```

## Currency & locale

The app targets **Sri Lankan users**. Currency is formatted as `Rs X,XXX` via `utils/format.ts`. Categories and merchant names in mock data reflect Sri Lankan businesses (Keells, PickMe, Dialog, Cargills, Barista).

## Design system

- **Dark header** (`#0F1117`) with white text for the wallet/home card
- **Light surface** (`#F8F9FA`) background for content areas
- **White cards** with `rounded-[20px]` and subtle shadows
- **Brand green** (`#1D9E75`) as primary accent — buttons, active states, positive values
- **Brand red** (`#E24B4A`) for expenses and warnings
- **Muted** (`#94A3B8`) for secondary text
- All colors available as `brand-*` Tailwind classes via `tailwind.config.js`

## Next steps (not started)

1. Wire up real authentication (email/password + Google OAuth)
2. Connect to a backend (Supabase, Firebase, or custom API) for data persistence
3. Integrate `expo-camera` for actual receipt photo capture
4. Add OCR / AI receipt parsing (extract merchant, amount, date, category)
5. Replace hardcoded dates with dynamic `new Date()` logic
6. Add transaction create/edit/delete flows
7. Implement wallet management (multiple wallets, transfers)
8. Push notifications for budget alerts
