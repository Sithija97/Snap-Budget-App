# SnapBudget — Full Frontend Implementation Prompt

> Feed this file to any AI coding assistant (Cursor, Windsurf, Claude Code, Copilot) to scaffold the complete SnapBudget React Native app with pixel-accurate UI.

---

## Project Overview

Build **SnapBudget** — a personal finance mobile app that lets users snap photos of receipts, auto-categorize expenses with AI, track budgets by category, and visualize spending trends.

**This prompt covers frontend only.** No backend wiring is needed now — use mock/static data for all screens. The architecture must be ready to swap mocks for real Firebase calls later.

---

## Tech Stack — Exact Versions

```bash
# Scaffold
npx create-expo-app@latest SnapBudget --template blank-typescript

# Core deps
npx expo install expo-router expo-constants expo-status-bar react-native-safe-area-context react-native-screens expo-linking expo-font

# Styling
npm install nativewind@^4 tailwindcss@^3

# Icons (Lucide — lightweight, tree-shakeable)
npm install lucide-react-native react-native-svg

# Navigation bottom tabs
npm install @react-navigation/bottom-tabs

# Charts
npm install victory-native@^41 react-native-reanimated react-native-gesture-handler

# Camera & image (install but don't wire up yet)
npx expo install expo-camera expo-image-picker
```

### NativeWind v4 Config

`tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0F1117",
          green: "#1D9E75",
          green2: "#0F6E56",
          red: "#E24B4A",
          amber: "#EF9F27",
          muted: "#94A3B8",
          border: "#E8EDF2",
          surface: "#F8F9FA",
        },
      },
      fontFamily: {
        sans: ["DMSans_400Regular"],
        medium: ["DMSans_500Medium"],
        mono: ["DMSono_400Regular"],
      },
    },
  },
  plugins: [],
};
```

`babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

`metro.config.js`:

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

`global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## File Structure

```
SnapBudget/
├── app/
│   ├── _layout.tsx              ← Root layout (fonts, safe area, global.css import)
│   ├── index.tsx                ← Redirects to /login
│   ├── login.tsx                ← Login / sign-up screen
│   ├── (tabs)/
│   │   ├── _layout.tsx          ← Bottom tab navigator
│   │   ├── index.tsx            ← Home screen
│   │   ├── transactions.tsx     ← Transaction list screen
│   │   ├── budget.tsx           ← Budget overview screen
│   │   └── analytics.tsx        ← Analytics / charts screen
│   └── scan.tsx                 ← Full-screen receipt scanner (modal)
├── components/
│   ├── ui/
│   │   ├── StatChip.tsx
│   │   ├── TransactionItem.tsx
│   │   ├── CategoryProgressBar.tsx
│   │   ├── SectionTitle.tsx
│   │   └── AlertBanner.tsx
│   └── charts/
│       ├── SpendingBarChart.tsx
│       └── DonutChart.tsx
├── constants/
│   └── mockData.ts              ← All mock data lives here
├── types/
│   └── index.ts
├── global.css
├── tailwind.config.js
├── babel.config.js
└── metro.config.js
```

---

## Design Tokens (use these everywhere — do not hardcode hex)

| Token           | Value     | Usage                                                         |
| --------------- | --------- | ------------------------------------------------------------- |
| `brand-black`   | `#0F1117` | Primary dark bg, header cards                                 |
| `brand-green`   | `#1D9E75` | Primary accent, CTA buttons, positive amounts, progress fills |
| `brand-green2`  | `#0F6E56` | Darker green for pressed states                               |
| `brand-red`     | `#E24B4A` | Overspent budgets, negative alert                             |
| `brand-amber`   | `#EF9F27` | Warning state (near budget limit)                             |
| `brand-muted`   | `#94A3B8` | Secondary text, labels, icons                                 |
| `brand-border`  | `#E8EDF2` | Card borders, dividers                                        |
| `brand-surface` | `#F8F9FA` | Page background                                               |
| White           | `#FFFFFF` | Card backgrounds                                              |

**Typography rules:**

- All amounts/numbers: `font-mono` (DM Mono)
- All labels/body: `font-sans` (DM Sans Regular)
- All headings/bold: `font-medium` (DM Sans Medium)
- Never use font-weight > 500

---

## Mock Data (`constants/mockData.ts`)

```ts
export const MOCK_USER = {
  name: "Kasun",
  monthlyIncome: 50000,
  monthlyBudget: 50000,
};

export const MOCK_TRANSACTIONS = [
  {
    id: "1",
    merchant: "Keells Super",
    category: "Groceries",
    amount: -2340,
    date: "2026-05-22",
    time: "10:22 AM",
    icon: "shopping-cart",
    iconBg: "#FEF3C7",
    iconColor: "#B45309",
  },
  {
    id: "2",
    merchant: "PickMe",
    category: "Transport",
    amount: -450,
    date: "2026-05-22",
    time: "8:55 AM",
    icon: "car",
    iconBg: "#DCFCE7",
    iconColor: "#166534",
  },
  {
    id: "3",
    merchant: "Dialog top-up",
    category: "Bills",
    amount: -1000,
    date: "2026-05-21",
    time: "6:10 PM",
    icon: "smartphone",
    iconBg: "#EDE9FE",
    iconColor: "#5B21B6",
  },
  {
    id: "4",
    merchant: "H&M",
    category: "Shopping",
    amount: -5400,
    date: "2026-05-21",
    time: "2:30 PM",
    icon: "shopping-bag",
    iconBg: "#FEE2E2",
    iconColor: "#991B1B",
  },
  {
    id: "5",
    merchant: "Barista",
    category: "Food & Drink",
    amount: -680,
    date: "2026-05-21",
    time: "12:15 PM",
    icon: "coffee",
    iconBg: "#FEF3C7",
    iconColor: "#B45309",
  },
  {
    id: "6",
    merchant: "Salary",
    category: "Income",
    amount: 50000,
    date: "2026-05-01",
    time: "9:00 AM",
    icon: "arrow-down-circle",
    iconBg: "#E1F5EE",
    iconColor: "#085041",
  },
  {
    id: "7",
    merchant: "Cargills",
    category: "Groceries",
    amount: -1800,
    date: "2026-05-20",
    time: "5:30 PM",
    icon: "shopping-cart",
    iconBg: "#FEF3C7",
    iconColor: "#B45309",
  },
  {
    id: "8",
    merchant: "Uber",
    category: "Transport",
    amount: -620,
    date: "2026-05-20",
    time: "7:15 AM",
    icon: "car",
    iconBg: "#DCFCE7",
    iconColor: "#166534",
  },
];

export const MOCK_BUDGETS = [
  {
    category: "Groceries",
    spent: 12400,
    limit: 15000,
    icon: "🛒",
    color: "#1D9E75",
  },
  {
    category: "Food & Dining",
    spent: 8200,
    limit: 10000,
    icon: "🍽️",
    color: "#1D9E75",
  },
  {
    category: "Transport",
    spent: 4800,
    limit: 5000,
    icon: "🚌",
    color: "#E24B4A",
  },
  {
    category: "Shopping",
    spent: 9750,
    limit: 8000,
    icon: "🛍️",
    color: "#E24B4A",
  },
  {
    category: "Bills",
    spent: 7700,
    limit: 12000,
    icon: "💡",
    color: "#EF9F27",
  },
];

export const MOCK_MONTHLY_SPENDING = [
  { month: "Dec", amount: 38000 },
  { month: "Jan", amount: 45000 },
  { month: "Feb", amount: 41000 },
  { month: "Mar", amount: 52000 },
  { month: "Apr", amount: 37000 },
  { month: "May", amount: 42850 },
];

export const MOCK_CATEGORY_BREAKDOWN = [
  { category: "Groceries", amount: 12400, pct: 29, color: "#1D9E75" },
  { category: "Shopping", amount: 9750, pct: 23, color: "#EF9F27" },
  { category: "Food & Dining", amount: 8200, pct: 19, color: "#7F77DD" },
  { category: "Bills", amount: 7700, pct: 18, color: "#85B7EB" },
  { category: "Transport", amount: 4800, pct: 11, color: "#F0997B" },
];

export const TOTAL_SPENT = 42850;
export const REMAINING = 7150;
```

---

## Screen Specs

### 1. `app/login.tsx` — Login Screen

**Background:** `bg-brand-black` (full screen dark)

**Layout (top to bottom):**

```
[safe area top padding]
[Logo mark] — 52×52 green rounded square, receipt icon inside
[Title] — "Your money,\nfinally clear." — text-white text-3xl font-medium leading-tight
[Subtitle] — "Snap receipts. Track budgets.\nKnow exactly where it all goes." — text-brand-muted text-sm
[Gap 32px]
[Email input] — bg #1e293b, border #334155, text-white, rounded-xl, h-12, text-sm
[Password input] — same style
[Sign in button] — bg-brand-green, text-white, rounded-xl, h-12, font-medium
[OR divider] — thin line both sides of "or" text in brand-muted
[Continue with Google] — bg #1e293b, border #334155, text-brand-muted, rounded-xl, h-12, Google icon left
[Spacer flex-1]
[Footer text] — "Don't have an account?" + "Sign up free" in brand-green, text-xs, centered
```

**On sign-in press:** `router.replace("/(tabs)")`

---

### 2. `app/(tabs)/_layout.tsx` — Tab Navigator

Use `@react-navigation/bottom-tabs`. Custom tab bar with these 5 tabs:

| Tab       | Route                | Icon (Lucide) | Label        |
| --------- | -------------------- | ------------- | ------------ |
| Home      | `index`              | `Home`        | Home         |
| History   | `transactions`       | `List`        | History      |
| **SCAN**  | (opens `scan` modal) | `ScanLine`    | _(no label)_ |
| Budget    | `budget`             | `PieChart`    | Budget       |
| Analytics | `analytics`          | `BarChart2`   | Stats        |

**Custom tab bar design:**

- Background: white, top border `brand-border`
- Active icon/label: `brand-black`
- Inactive icon/label: `brand-muted`
- **Center SCAN button:** 46×46 circle, `bg-brand-green`, raised 16px above tab bar, white 3px border around it, `ScanLine` icon in white 20px. On press: `router.push("/scan")`

---

### 3. `app/(tabs)/index.tsx` — Home Screen

**Background:** `bg-brand-surface`

**Section A — Dark header card** (`bg-brand-black`, `rounded-b-3xl`, padding 16px):

```
Row:
  Left:
    "Good morning, {user.name}"  ← text-brand-muted text-xs
    "May 2026"                   ← text-white text-base font-medium
  Right:
    Avatar circle 32×32, bg-brand-green, initials "K", text-white text-sm font-medium

"Rs {TOTAL_SPENT.toLocaleString()}"  ← text-white text-4xl font-mono font-medium, mt-10
"spent this month"                   ← text-brand-muted text-xs

Row of chips (bg #1e293b, rounded-full, px-3 py-1 text-xs gap-1):
  Chip 1: ↓ icon red + "12% vs last month" in red
  Chip 2: Target icon green + "Rs 7,150 left" in green
```

**Section B — Stat chips** (2-column grid, gap-2, mx-4 mt-4):

```
Chip 1:
  Label: "Income"  text-brand-muted text-xs
  Value: "Rs 50k"  text-slate-900 text-xl font-medium
  Sub:   "this month" text-brand-muted text-xs

Chip 2:
  Label: "Saved"
  Value: "Rs 7,150" in brand-green
  Sub:   "14.3% of income"

Style: bg-white, border brand-border, rounded-2xl, p-3
```

**Section C — Recent transactions** (mx-4 mt-4):

```
SectionTitle: "Recent transactions"
List: show latest 4 from MOCK_TRANSACTIONS using <TransactionItem> component
```

---

### 4. `components/ui/TransactionItem.tsx`

Props: `{ merchant, category, amount, date | time, iconBg, iconColor, icon }`

```
Row, items-center, gap-3, py-2, border-b border-brand-border:
  [Icon box] 34×34, rounded-xl, bg={iconBg}
    Lucide icon name={icon} size=16 color={iconColor}
  [Middle]
    merchant name  — text-slate-900 text-sm font-medium
    category       — text-brand-muted text-xs mt-0.5
  [Right, ml-auto, items-end]
    amount         — text-sm font-mono, red if negative, brand-green if positive
                     format: "- Rs 2,340" or "+ Rs 50,000"
    date/time      — text-brand-muted text-xs mt-0.5
```

---

### 5. `app/scan.tsx` — Scan Receipt Screen (Modal / Full Screen)

**Background:** `bg-brand-surface`

**Header row:**

```
Back arrow (ChevronLeft) — onPress router.back()
"Scan receipt" — text-slate-900 text-base font-medium
"Manual entry" — text-brand-green text-xs ml-auto
```

**Camera finder box** (`bg-brand-black`, `rounded-3xl`, `mx-3`, height 220):

- 4 corner brackets in `brand-green` (22×22, border-width 2, only 2 sides each)
- Center: receipt icon 32px + "Point camera at receipt" text below
- Horizontal scan line (thin, brand-green, 80% width)

**Tip text:** "Keep receipt flat and well-lit for best results. AI will auto-detect merchant, items and total." — text-brand-muted text-xs text-center px-4

**AI badge:** `bg #E1F5EE`, rounded-full, sparkles icon + "AI-powered categorization", text `#085041`, text-xs

**Detected result card** (bg-white, border, rounded-2xl, mx-3, p-3):

```
Header: Check icon (brand-green) + "Receipt detected" text-sm font-medium

Rows (each: flex-row justify-between text-xs border-b border-surface py-1):
  Merchant  | Cargills Food City     (font-medium slate-900)
  Category  | [Groceries pill]       (bg #E1F5EE, text #085041, rounded-full px-2)
  Date      | 19 May 2026
  ──────────────────────────
  Total     | Rs 3,680               (brand-green font-medium text-sm)
```

**CTA button:** `bg-brand-green`, `rounded-xl`, `mx-3`, h-12, "Save transaction", text-white font-medium. On press: show a toast/alert and router.back()

---

### 6. `app/(tabs)/transactions.tsx` — Transactions Screen

**Header:** "Transactions" text-xl font-medium text-slate-900

**Search bar:** bg-white, border, rounded-xl, row with Search icon + "Search transactions…" placeholder, text-xs text-slate-300

**Filter chips** (horizontal ScrollView, gap-2):

- "All" (active: bg-brand-black text-white), "Food", "Transport", "Bills", "Shopping"
- Inactive: bg-white, border, text-brand-muted, rounded-full, text-xs px-3 py-1

**Transaction list** grouped by date:

```
SectionTitle "Today"
  → transactions from today (MOCK_TRANSACTIONS filtered by date)
SectionTitle "Yesterday"
  → yesterday's transactions
...etc
```

Use `SectionList` with `MOCK_TRANSACTIONS` grouped by date. Each item: `<TransactionItem>`

---

### 7. `app/(tabs)/budget.tsx` — Budget Screen

**Header row:** "Budget" + "Edit limits" (brand-green text-xs) right-aligned

**Total budget card** (`bg-brand-black`, `rounded-2xl`, `mx-0`, `p-4`):

```
"Monthly budget"   text-brand-muted text-xs
Row:
  "Rs 50,000"      text-white text-2xl font-mono font-medium
  "Rs 7,150 remaining" text-brand-muted text-xs self-end

Progress bar: bg #1e293b, inner bg-brand-green, width 85.7%, h-1, rounded-full, mt-3
"85.7% used · 12 days left"  text-brand-muted text-xs mt-1
```

**Category progress bars** (ScrollView list):
Render each item from `MOCK_BUDGETS` using `<CategoryProgressBar>`:

```
Props: { category, spent, limit, icon, color }

Row:
  icon emoji + category name  — text-slate-900 text-xs font-medium + emoji text-sm
  "Rs {spent} / Rs {limit}"  — text-brand-muted text-xs ml-auto

Progress track: bg #F1F5F9, h-1.5, rounded-full
  Fill: width = (spent/limit * 100)%, capped at 100%, color = props.color

If spent > limit:
  Show <AlertBanner> below:
  bg #FCEBEB, rounded-xl, p-2 mx-0, AlertCircle icon red 14px +
  "Shopping budget exceeded by Rs {spent - limit}" text-red-700 text-xs
```

---

### 8. `app/(tabs)/analytics.tsx` — Analytics Screen

**Header:** "Analytics" + toggle pills ("Monthly" active | "Weekly")

**Spending bar chart card** (bg-white, border, rounded-2xl, p-3):

```
"Spending last 6 months"  text-brand-muted text-xs mb-2

Bar chart:
  Use Victory Native <VictoryBar> or custom bars with View
  Data: MOCK_MONTHLY_SPENDING
  Active month (May) bar: bg-brand-green
  Other bars: bg #E2E8F0
  Labels below each bar: month name, text-brand-muted text-[8px]
  Height: 90px total

X-axis labels: "0", "Rs 20k", "Rs 50k" — right-aligned below chart
```

**Spending breakdown card** (bg-white, border, rounded-2xl, p-3):

```
"Spending breakdown — May"  SectionTitle

Row:
  Left: SVG Donut chart (72×72)
    - strokeWidth 10, r=28
    - Segments from MOCK_CATEGORY_BREAKDOWN
    - use stroke-dasharray to draw each segment proportionally

  Right: Legend list
    Each item: colored dot (8×8 rounded-full) + "Category — XX%" text-xs text-slate-900
```

---

## Reusable Components

### `components/ui/SectionTitle.tsx`

```tsx
// text-brand-muted text-[11px] font-medium uppercase tracking-widest mb-2 mt-0.5
```

### `components/ui/StatChip.tsx`

Props: `{ label, value, sub, valueColor? }`

```tsx
// bg-white border border-brand-border rounded-2xl p-3
// label: text-brand-muted text-[10px]
// value: text-xl font-medium text-slate-900 (override with valueColor)
// sub:   text-brand-muted text-[10px] mt-0.5
```

### `components/ui/CategoryProgressBar.tsx`

Props: `{ category, spent, limit, icon, color }`
See budget screen spec above.

### `components/ui/AlertBanner.tsx`

Props: `{ message, type: 'error' | 'warning' }`

```tsx
// type === 'error'   → bg #FCEBEB, text/icon red
// type === 'warning' → bg #FAEEDA, text/icon amber
// rounded-xl p-2 flex-row items-center gap-2
```

---

## Routing Map

```
/                    → redirect to /login (if not authed) or /(tabs) (if authed)
/login               → Login screen
/(tabs)              → Tab navigator wrapper
/(tabs)/index        → Home
/(tabs)/transactions → Transactions
/(tabs)/budget       → Budget
/(tabs)/analytics    → Analytics
/scan                → Receipt scanner (push as modal)
```

For now, skip real auth. In `app/index.tsx`:

```tsx
import { Redirect } from "expo-router";
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
```

---

## Root Layout (`app/_layout.tsx`)

```tsx
import "../global.css";
import { useFonts } from "expo-font";
import {
  DMSans_400Regular,
  DMSans_500Medium,
} from "@expo-google-fonts/dm-sans";
import { DMMono_400Regular } from "@expo-google-fonts/dm-mono";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMMono_400Regular,
  });
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);
  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="scan" options={{ presentation: "modal" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
```

---

## Implementation Rules

1. **No inline hex colors** — use Tailwind classes (`text-brand-green`, `bg-brand-black`) or reference `colors` from `tailwind.config.js` in StyleSheet only when absolutely needed.
2. **No hardcoded strings** — all amounts must come from `mockData.ts`.
3. **Format all currency as:** `Rs ${amount.toLocaleString()}` — never `Rs42850`.
4. **Negative amounts** = text-brand-red with "- " prefix. Positive = text-brand-green with "+ " prefix.
5. **All screens** must be wrapped in `<SafeAreaView className="flex-1 bg-brand-surface">` + `<ScrollView>` where content may overflow.
6. **All icon imports** must be from `lucide-react-native`, not `@expo/vector-icons`.
7. **Progress bar width** = `(spent / limit * 100).toFixed(1) + "%"` — cap at `"100%"` using `Math.min`.
8. **No `StyleSheet.create()`** unless NativeWind can't cover it (e.g. dynamic width on progress bars).
9. Keep each file **under 150 lines** — extract to components if it gets long.
10. TypeScript strict — define types in `types/index.ts` for `Transaction`, `Budget`, `MonthlySpending`.

---

## Types (`types/index.ts`)

```ts
export interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number; // negative = expense, positive = income
  date: string; // ISO date string "YYYY-MM-DD"
  time: string;
  icon: string; // lucide icon name
  iconBg: string;
  iconColor: string;
}

export interface Budget {
  category: string;
  spent: number;
  limit: number;
  icon: string; // emoji
  color: string; // hex for progress fill
}

export interface MonthlySpending {
  month: string;
  amount: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  pct: number;
  color: string;
}
```

---

## What to Build — Summary Checklist

- [ ] Project scaffolded with Expo + TypeScript
- [ ] NativeWind v4 configured (tailwind.config, babel, metro, global.css)
- [ ] DM Sans + DM Mono fonts loaded in root layout
- [ ] `constants/mockData.ts` with all mock data
- [ ] `types/index.ts` with all interfaces
- [ ] `app/login.tsx` — dark login screen
- [ ] `app/(tabs)/_layout.tsx` — custom tab bar with floating scan button
- [ ] `app/(tabs)/index.tsx` — home with dark header + stats + recent transactions
- [ ] `app/(tabs)/transactions.tsx` — SectionList grouped by date with search + filter chips
- [ ] `app/(tabs)/budget.tsx` — total budget card + category progress bars + alert banners
- [ ] `app/(tabs)/analytics.tsx` — bar chart + donut chart
- [ ] `app/scan.tsx` — full scanner UI with mock detected result card
- [ ] All reusable components in `components/ui/`
- [ ] Routing wired up with expo-router file-based routing
- [ ] App runs on Android and iOS with `npx expo start`

---

_Backend integration (Firebase Auth, Firestore, Cloud Storage, ML Kit OCR) will be added in Phase 2. Keep all data access behind a `services/` layer so mocks are swappable with one-line changes._
