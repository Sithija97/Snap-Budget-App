# SnapBudget — App Context

## What this app does

SnapBudget is a personal finance app for Sri Lankan users. It lets people snap a photo of a receipt to auto-log an expense, then shows a clear picture of where their money goes — budgets per category, monthly spending trends, and a transaction history — all in a minimal, distraction-free UI.

---

## Current state

The app is a **fully functional local-first app**: all data (wallets, categories, budgets, transactions) lives in Zustand stores persisted to AsyncStorage and survives app restarts. There is still no backend, no real auth, and no real camera capture — the receipt scanner simulates a capture result, but saving it creates a real transaction in the store.

### What works

- Full navigation flow: login → tab bar (Home, Transactions, Budget, Analytics, Settings) + Scan modal
- **Full CRUD with persistence** — transactions, budgets, categories, and wallets are created/edited/deleted through real screens and persist across restarts (Zustand `persist` → AsyncStorage)
- **Live derived data** — Home totals (spent / income / remaining) and Budget progress bars compute from the transaction store for the current month; every change is reflected immediately
- Transaction detail screen (`/transaction/[id]`) with edit mode (merchant, amount, category, wallet) and delete-with-confirm; handles bad/missing ids without crashing
- Tapping any `TransactionItem` (Home recent list, Transactions list) opens its detail screen
- Scan screen saves — both the mock capture result and manual entry create real transactions (manual entry matches categories by name, creating a new expense category if none matches)
- Wallets: list + form screens, `balance: null` renders as "Balance not set" (distinct from a real Rs 0), a default "My Wallet" is auto-created silently at startup, the last remaining wallet can't be deleted
- Categories: Expense/Income tabs, custom categories with icon picker and optional parent (subcategory), default categories can be renamed but not deleted, deletion blocked while transactions reference the category
- Budgets: add/edit/delete per expense category for the current month, "repeat" flag persisted; Budget tab shows an "Add budget" prompt for any category with spending but no limit
- Analytics reachable via "See reports" (Home) and "View trends" (Budget)
- Fully functional dark / light / system theme with AsyncStorage persistence
- Transaction search (text filter) + category filter chips, both working simultaneously
- Analytics chart period toggle (Monthly / Weekly) — each drives its own mock dataset and correct max scale
- Budget progress bars with semantic color coding (amber at ≥80 %, red at >100 %)
- Dynamic dates — Today/Yesterday grouping, month labels, and "days remaining" computed from the real clock
- Validation everywhere: numeric keyboards with non-numeric characters stripped, Save buttons disabled (not hidden) until valid, all destructive actions go through `Alert.alert` with Cancel
- Memoized list rendering throughout — `memo()` on `TransactionItem` and `CategoryRow`; stores are read via narrow selectors

### What does not work yet

- **No real authentication** — Sign in navigates directly to Home; Google button is a no-op
- **No backend** — everything is local to the device (Neon / Clerk / Gemini Vision are a later cycle)
- **No real receipt scanning** — camera not integrated; "Capture Receipt" shows a static mock result (saving it does create a real transaction)
- **Analytics charts are still mock data** — bar chart and category breakdown are not wired to real transaction aggregation (known deferred item)
- **Budget "repeat" has no auto-renewal logic** — the flag persists but nothing acts on it yet
- **Settings actions** — Monthly budget, Export data, Clear all data are non-functional
- Out of scope by decision: Debt/Loan, bank connections, Events, Recurring Transactions

---

## Tech stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Expo (Managed) | SDK 54 |
| Runtime | React Native | 0.81.x |
| UI layer | React | 19.x |
| Routing | expo-router (file-based) | ~6.0.24 |
| State | Zustand (+ `persist` middleware) | 5.x |
| Persistence | @react-native-async-storage/async-storage | — |
| Styling | NativeWind v4 (Tailwind CSS for RN) | 4.x |
| Dark mode | NativeWind `darkMode: "class"` | — |
| IDs | expo-crypto `randomUUID()` (Hermes has no `crypto.randomUUID`) | — |
| Icons | lucide-react-native only | — |
| Fonts | DM Sans 400/500 + DM Mono 400 via @expo-google-fonts | — |
| Camera | expo-camera (installed, not yet used) | — |
| Language | TypeScript (strict) | 5.x |

**App config note**: `app.json`'s `expo-splash-screen` plugin entry had no config object from the initial commit onward, so no splash image ever rendered (just a blank white screen) — fixed 2026-07-04 by giving it `{ image: "./assets/splash-icon.png", imageWidth: 200, resizeMode: "contain", backgroundColor: "#ffffff" }`. This is a **managed workflow** project (no `android`/`ios` folders checked in), so splash/icon config changes only take effect on the next `expo prebuild` / `expo run:android`/`run:ios` / EAS build — not on a Metro reload. **Expo Go cannot render this config at all** (SDK 52+ limitation — Expo Go always shows the app icon as splash instead); testing the real splash screen requires a development build (`expo run:android`) or an EAS build.

**EAS build setup**: `eas.json` has `development`/`preview`/`production` profiles; `preview` builds an installable `.apk` (no store needed). Project is linked as `@sithija/Snapbudget` (`extra.eas.projectId` in `app.json`), with `android.package: "com.sithija.snapbudget"` required for `--non-interactive` builds. Any native-icon/splash change requires a fresh build — there's no JS/Metro shortcut for those.

**Android adaptive icon safe zone**: `android-icon-foreground.png`/`android-icon-monochrome.png` (432×432) originally had artwork filling ~97% of the canvas, which crowds launcher icon masks (circle/squircle) and hides the `android-icon-background.png` color/image around it. Fixed 2026-07-06 by re-centering the artwork at 66% canvas fill (Android's recommended 72dp-of-108dp safe zone) with transparent padding. Any future icon artwork should keep ~30-35% transparent margin baked in before export.

**Android adaptive icon pale halo (fixed 2026-07-07)**: after the safe-zone fix above, the launcher icon showed a visible pale ring around the blue pig square. Root cause: `android-icon-foreground.png` had the *entire* rounded-square shape (solid blue `#1070F8` + pig) baked into the foreground layer at 66% scale, while `android-icon-background.png` / `adaptiveIcon.backgroundColor` were a separate, much paler blue (`#E6F4FE`) filling the full canvas — so the untouched foreground margin let that pale background show through as a halo. Correct adaptive-icon structure is: **foreground = glyph only, transparent everywhere else**; **background = solid color reaching every edge**, and Android composites + masks them itself. Fixed by stripping the baked-in square out of `android-icon-foreground.png` (glyph-only now) and recoloring `android-icon-background.png` + `adaptiveIcon.backgroundColor` to the matching `#1070F8`. `android-icon-monochrome.png` was **not** touched — it turned out to still be an unrelated leftover glyph (looks like Expo's generic default template icon), not a pig-based asset, so attempting the same fix on it produced garbage. It only affects Android 13+ "themed icons" (an opt-in launcher setting) and needs a real pig-silhouette redesign whenever that's prioritized — not currently blocking anything visible.

## Data architecture

### Stores (`store/`)

Four Zustand stores, each persisted to its own AsyncStorage key via `persist` + `createJSONStorage`:

| Store | Key | State & actions |
|---|---|---|
| `useWalletStore` | `snapbudget-wallets` | `wallets`, add/update/delete, `ensureDefaultWallet()`, `getTotalBalance()` |
| `useCategoryStore` | `snapbudget-categories` | `categories`, add/update, `deleteCategory()` (refuses defaults + referenced), `categoryHasTransactions()` |
| `useBudgetStore` | `snapbudget-budgets` | `budgets`, add/update/delete, `budgetsForMonth()` helper |
| `useTransactionStore` | `snapbudget-transactions` | `transactions`, add/update/delete + pure helpers `transactionsInMonth`, `totalsForMonth`, `spentByCategoryInMonth` |

Conventions:
- Components subscribe with **narrow selectors** (`useWalletStore(s => s.wallets)`), never the whole store
- Derivations are pure functions applied inside `useMemo`, not stored state
- `ThemeContext` is untouched — Context remains the right tool for rarely-changing theme state
- `ensureDefaultWallet()` runs in `app/_layout.tsx` **after persist rehydration** (`persist.hasHydrated()` / `onFinishHydration`) to avoid duplicating the wallet on relaunch

### Data model (`types/index.ts`)

The old `Category` enum is **gone** — categories are data rows. `Transaction.categoryId` and `Budget.categoryId` reference `Category.id`.

| Type | Shape |
|---|---|
| `Category` | `id, name, type: 'expense'\|'income', icon (TX_ICONS key), parentId, isDefault` |
| `Wallet` | `id, name, balance: number \| null (null = "not set"), isDefault, createdAt` |
| `Transaction` | `id, merchant, categoryId, walletId, txType, amount, date "YYYY-MM-DD", time` |
| `Budget` | `id, categoryId, limitAmount, month "YYYY-MM", repeat` |

### Seed data (`constants/seedData.ts`)

- `DEFAULT_CATEGORIES` — 8 categories with **stable ids** (`cat-groceries`, `cat-salary`, …), all `isDefault: true`
- `buildSeedTransactions()` / `buildSeedBudgets()` — the old mock transactions/budget limits, with dates **remapped into the current month** so first-run totals aren't empty
- Seeds are the stores' initial state; once persisted, rehydration takes over

`constants/mockData.ts` now only holds what Analytics/Settings still read: `MOCK_USER`, `MOCK_MONTHLY_SPENDING`, `MOCK_CATEGORY_BREAKDOWN`.

---

## Design system

The app uses a **shadcn/ui-inspired semantic token system** — no hardcoded hex colors in components. All tokens are defined in `tailwind.config.js` and used as Tailwind classes (`bg-background`, `text-foreground`, etc.).

### Color tokens

| Token | Light | Dark | Used for |
|---|---|---|---|
| `background` | `#ffffff` | `#09090b` | Screen backgrounds |
| `foreground` | `#09090b` | `#fafafa` | Primary text |
| `card` | `#ffffff` | `#09090b` | Card surfaces |
| `border` | `#e4e4e7` | `#27272a` | Borders, dividers |
| `input` | `#e4e4e7` | `#27272a` | Input borders |
| `muted` | `#f4f4f5` | `#18181b` | Muted backgrounds, icon containers |
| `mutedFg` | `#71717a` | `#a1a1aa` | Secondary / placeholder text |
| `accent` | `#18181b` | `#fafafa` | Primary button background |
| `accentFg` | `#fafafa` | `#18181b` | Primary button text |
| `destructive` | `#ef4444` | `#ef4444` | Error states, delete actions |
| `positive` | `#16a34a` | `#22c55e` | Income, under-budget |
| `negative` | `#dc2626` | `#f87171` | Expense amounts |
| `warning` | `#d97706` | `#fbbf24` | Near-limit budget |
| `ring` | `#09090b` | `#d4d4d8` | Focus rings |

Dark mode is activated by adding the `dark` className to the root `View` in `app/_layout.tsx`. NativeWind then applies all `dark:*` variants automatically.

### Typography

- **Body / UI text** — DM Sans 400 (`font-sans`)
- **Headings / labels / medium weight** — DM Sans 500 (`font-medium`)
- **Monetary values / monospace** — DM Mono 400 (`font-mono`)
- **Currency format** — `Rs X,XXX` via `utils/format.ts → fmt(n)`; the inverse `parseAmount(input)` strips non-numeric characters for form fields

### Sizing / spacing conventions

- Screen padding: `px-4` horizontal, `pt-4` top, `pb-24` bottom (clears tab bar)
- Card: `rounded-xl p-4`, no shadow, `border border-border`
- Buttons: `h-11 rounded-lg`
- Icons: `size={22}` in tab bar, `size={16}` in list rows, `size={15}` in category badges
- Tab bar height: 60 px + safe area insets
- Form fields: 44 px tall bordered `TextInput`s (the scan-screen style, reused on every form)

---

## Dark mode architecture

`context/ThemeContext.tsx` is the single source of truth.

```
ThemeProvider
  ├── reads AsyncStorage on mount → setThemeState
  ├── setTheme (useCallback) → updates state + writes AsyncStorage
  ├── isDark = theme==='dark' || (theme==='system' && systemScheme==='dark')
  └── value (useMemo) → only new object when theme/isDark changes

app/_layout.tsx → InnerLayout
  ├── reads isDark from useTheme()
  └── <View className={isDark ? "dark flex-1" : "flex-1"}>
        all screens live here → NativeWind dark: variants activate
```

The tab bar renders outside the NativeWind tree so it uses `useTheme()` + inline styles directly instead of Tailwind dark classes.

---

## Project structure

```
app/
  _layout.tsx              Root: fonts, splash, ensureDefaultWallet (post-hydration),
                           SafeAreaProvider → ThemeProvider → InnerLayout
  login.tsx                Login screen (email + password TextInputs, Sign in, Google button)
  scan.tsx                 Receipt scanner (modal) — saves real transactions
  wallets.tsx              Wallet list (+ button → wallet-form)
  wallet-form.tsx          Create/edit wallet (?id= param), delete guarded
  categories.tsx           Category list with Expense/Income toggle
  category-form.tsx        Create/edit category (?id= or ?type=), icon picker, parent picker
  budget-form.tsx          Create/edit budget (?id= or ?categoryId=), repeat checkbox
  transaction/
    [id].tsx               Transaction detail — view / edit / delete, safe not-found state
  (tabs)/
    _layout.tsx            Custom 5-item tab bar (matches active tab by route name)
    index.tsx              Home dashboard (live totals, dynamic month, links to analytics)
    transactions.tsx       Transaction list with search + filter (live store data)
    budget.tsx             Budget tracker (live spend per category, add-budget prompts)
    analytics.tsx          Spending charts (still mock chart data)
    settings.tsx           Theme toggle, profile, Manage (Wallets/Categories), data actions

store/
  useWalletStore.ts        Wallets + ensureDefaultWallet + getTotalBalance
  useCategoryStore.ts      Categories + guarded delete
  useBudgetStore.ts        Budgets + budgetsForMonth
  useTransactionStore.ts   Transactions + month/category derivation helpers

components/
  ui/
    UIText.tsx             Base text component (variant + size props)
    Card.tsx               Flat bordered container
    Separator.tsx          1 px horizontal rule
    Badge.tsx              Pill label (default / outline / destructive / positive / warning)
    Button.tsx             Pressable button (default / outline / ghost / destructive) + disabled prop
    ThemeToggle.tsx        36×36 Sun/Moon icon button (used on Home header)
    TransactionItem.tsx    Single transaction row (memo-wrapped, pressable via onPress prop)

context/
  ThemeContext.tsx          ThemeProvider + useTheme hook

hooks/
  useDisplayTransactions.ts Joins transactions with category name/icon, newest first
  useTransactionFilters.ts  Filter + group DisplayTransactions by date

utils/
  format.ts                fmt(n) → "Rs X,XXX"; parseAmount(s) → number
  dates.ts                 todayISO, currentMonth, daysAgoISO, groupByDate (dynamic Today/Yesterday)
  id.ts                    generateId() via expo-crypto randomUUID

constants/
  seedData.ts              DEFAULT_CATEGORIES + seed transaction/budget builders
  mockData.ts              Remaining mock: MOCK_USER + Analytics chart data
  icons.ts                 TX_ICONS and CAT_ICONS maps (lucide-react-native)

types/
  index.ts                 Transaction, Budget, Wallet, Category, CategoryType,
                           MonthlySpending, CategoryBreakdown, TxType enum
```

---

## Shared UI components

### UIText
```tsx
<UIText variant="default|muted|heading|label|mono" size="xs|sm|base|lg|xl|2xl" className="..." />
```
Wraps `<Text>`. Variant sets color + font family; size sets px. Additional `className` or `style` can override. Default variant is `foreground` color in DM Sans.

### Card
```tsx
<Card className="...">...</Card>
```
`rounded-xl p-4 border border-border bg-card`. Pass `className="p-0 overflow-hidden"` for edge-to-edge card content.

### Button
```tsx
<Button label="..." variant="default|outline|ghost|destructive" onPress={fn} icon={<Icon />} disabled={bool} className="..." />
```
Text color is set via inline `style` (not Tailwind class) to guarantee correct contrast. `disabled` renders at 50 % opacity and blocks presses — used by every form's Save button until required fields are valid.

### Badge
```tsx
<Badge label="..." variant="default|outline|destructive|positive|warning" />
```

### Separator
```tsx
<Separator className="my-3" />  {/* 1 px horizontal rule */}
```

### ThemeToggle
```tsx
<ThemeToggle />  {/* Sun in dark, Moon in light, 36×36 bordered button */}
```

### TransactionItem
```tsx
<TransactionItem merchant categoryName txType amount time icon isLast={bool} onPress={fn} />
```
`memo()`-wrapped and pressable (wrapped in `TouchableOpacity`, disabled when no `onPress`). Callers resolve `categoryName`/`icon` via `useDisplayTransactions`. `isLast` suppresses the bottom border on the last row in a group.

---

## Tab bar

Custom `CustomTabBar` component in `app/(tabs)/_layout.tsx`. Five items:

| Slot | Screen | Type |
|---|---|---|
| Home | `(tabs)/index` | Tab |
| Transactions | `(tabs)/transactions` | Tab |
| Scan | `scan` (modal) | Action button — `router.push('/scan')` |
| Budget | `(tabs)/budget` | Tab |
| Settings | `(tabs)/settings` | Tab |

The active tab is matched by **route name** (`state.routes[state.index].name`), not index — `analytics` registers as a route between budget and settings, which made index-based matching wrong. `analytics` has no tab button; it is reached via "See reports" (Home) and "View trends" (Budget).

---

## Screen-by-screen summary

### Login (`app/login.tsx`)
Centered column layout. Real `TextInput` for email + password (inline styles for dark-mode colors). "Sign in" button calls `router.replace('/(tabs)')`. Google button is outline style, no-op. Footer has non-functional "Sign up" link.

### Home (`app/(tabs)/index.tsx`)
- Header: dynamic month label (e.g. "July 2026") + `ThemeToggle`
- Summary `Card`: total spent / income / remaining — computed from `useTransactionStore` for the current month (remaining = income − spent)
- "See reports" link → Analytics
- Recent transactions: top 4 from `useDisplayTransactions`, each pressable → detail screen; empty state when none
- "View all transactions" link → `/(tabs)/transactions`

### Transactions (`app/(tabs)/transactions.tsx`)
- Text search bar (merchant or category name) with clear (×) button
- Horizontal filter chip row: All, Income, Food, Transport, Shopping, Bills
- Reads `useDisplayTransactions()`; search filters first via `useMemo`, result passed to `useTransactionFilters`
- Grouped by date label (Today / Yesterday / "Jul 1") — labels computed from the real clock
- Rows pressable → `/transaction/[id]`; empty state when no results

### Transaction detail (`app/transaction/[id].tsx`)
- Read view: signed amount, merchant / category / date / wallet rows, Delete button (confirm Alert)
- "Edit" toggles TextInputs (scan-screen field styling) for amount + merchant, chip pickers for category (same-direction only) and wallet; Cancel discards edits
- Unknown id → "Transaction not found" + back button, no crash

### Budget (`app/(tabs)/budget.tsx`)
- Header "Add" → `/budget-form`
- Overview Card: total spent vs total of this month's budget limits, progress bar, computed days remaining, semantic badge
- "View trends" link → Analytics
- Category list from `useBudgetStore` for the current month; `spent` computed per `categoryId` from the transaction store; rows pressable → edit budget
- Categories with spending but no budget show an "Add budget" prompt row → `/budget-form?categoryId=…`
- Empty state when no budgets and no spending

### Analytics (`app/(tabs)/analytics.tsx`)
- Period toggle in header: Monthly / Weekly (underline style for active)
- Bar chart + category breakdown — **still mock data**; real aggregation is the known deferred item

### Settings (`app/(tabs)/settings.tsx`)
- Profile card: initials avatar, name, email (still `MOCK_USER`)
- Theme segmented control: Light | System | Dark
- **Manage section: Wallets and Categories rows** → `/wallets`, `/categories`
- Monthly budget / Export data / Clear all data rows (non-functional)

### Wallets (`app/wallets.tsx`, `app/wallet-form.tsx`)
- List of wallets with balance or "Balance not set" (`balance: null`); `getTotalBalance()` treats null as 0 but rows keep the distinction
- Form: Name (required), Balance (optional — blank keeps `null`); Delete blocked with an Alert on the last remaining wallet

### Categories (`app/categories.tsx`, `app/category-form.tsx`)
- Expense/Income toggle (Analytics-style), "New category" row, list with icons and parent labels
- Form: Name, locked Type badge, icon picker (TX_ICONS tiles), optional parent chips (same type, top-level only)
- Delete only for non-default categories with no referencing transactions (explanatory Alerts otherwise)

### Budget form (`app/budget-form.tsx`)
- Expense-category chips, Monthly limit (numeric), read-only Period (current month), "Repeat this budget monthly" checkbox
- Editing supports changing category/limit/repeat and deleting the budget

### Scan (`app/scan.tsx`)
- Header with back button, title, "Manual / Scan" toggle (camera-first flow unchanged)
- **Camera mode**: viewfinder mock → capture → result card → Save creates a real Groceries transaction
- **Manual mode**: Amount / Merchant / Category TextInputs; Save disabled until valid; category resolved by name (case-insensitive), creating a new expense category if no match; transaction saved to the default wallet with today's date/time

---

## Performance patterns

| Pattern | Where applied |
|---|---|
| `memo()` on list items | `TransactionItem`, `CategoryRow` |
| Narrow Zustand selectors | every store read (`useXStore(s => s.slice)`), never the whole store object |
| Pure derivation helpers in `useMemo` | `totalsForMonth`, `spentByCategoryInMonth`, `budgetsForMonth`, `useDisplayTransactions` join |
| `useMemo` for search filtering | Transactions screen — runs before `useTransactionFilters` hook |
| `useCallback` on context setter | `ThemeContext.setTheme` |
| `useMemo` on context value | `ThemeContext` — only new object when `theme`/`isDark` changes |

---

## Next steps (not started)

1. Wire the Analytics bar chart + category breakdown to real transaction aggregation (deferred from the functional pass)
2. Wire up real authentication (Clerk planned)
3. Connect to a backend (Neon planned) for sync — local stores become the offline cache
4. Integrate `expo-camera` for actual receipt photo capture
5. Add OCR / AI receipt parsing (Gemini Vision planned — extract merchant, amount, date, category)
6. Budget auto-renewal logic behind the persisted "repeat" flag
7. Implement Settings actions (edit monthly budget, export, clear data)
8. Push notifications for budget threshold alerts
