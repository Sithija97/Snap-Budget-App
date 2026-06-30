# SnapBudget — UI Generation Prompt

> Paste this into v0.dev, Bolt, Lovable, Figma AI, or any screen generation tool.
> Component sizes and layout measurements are specified. Color palette is intentionally
> left open — let the tool decide based on the app's context (personal finance, receipt
> scanning, budget tracking).

---

## App overview

**SnapBudget** is a personal finance mobile app for Sri Lankan users. Core features:
- Snap receipts with the camera to auto-log transactions
- Track monthly budgets by category
- View spending analytics and trends
- Manage income vs. expense records

---

## Design philosophy

- Style: shadcn/ui-inspired minimal. Clean, functional, distraction-free.
- No decorative gradients, illustrations, hero images, or colored header cards.
- Typography does the visual heavy lifting — size and weight hierarchy only.
- Dark mode is a first-class feature, not an afterthought. Every screen must work in both light and dark.
- Whitespace is generous. Nothing feels cramped.
- 3 font weights only: regular (body text), medium/500 (headings, labels, button text), monospace (all currency amounts and numbers).
- Currency format: `Rs 42,850` — Sri Lankan rupees, locale-formatted, always in monospace font.

---

## Layout rules (apply to all screens)

- Horizontal content padding: 16px
- Top content padding: 16px
- Bottom content padding: 96px (clears the tab bar)
- Gap between major sections: 24px
- Gap between cards in a list: 12px
- Border radius — 3 values only:
  - 8px — inputs, buttons, chips, small badges
  - 12px — large cards, camera viewfinder
  - 9999px — progress bars, avatar circles, dot indicators

---

## Shared components

Build these first. All screens compose from them.

### Card
Flat bordered container. No shadow.
- Border: 1px, all sides, rounded-xl (12px)
- Padding: 16px
- Background: card surface color (slightly distinct from page bg)

### Badge
Small inline label pill.
- Padding: 8px horizontal, 2px vertical
- Border radius: 8px
- Variants: outline · positive · warning · destructive
- Font size: 11px

### Button
- Height: 44px
- Border radius: 8px
- Horizontal padding: 16px
- Font size: 13px, weight 500
- Variants: filled (primary action) · outline · ghost · destructive
- Press opacity: 0.7

### Separator
- Height: 1px horizontal line

### Transaction row
Reusable row used in Home and Transactions screens.
- Layout: flex-row, vertically centered, gap 12px, padding 12px vertical
- Left: 36px square icon container, rounded-lg (8px), muted background
  - Icon inside: 16px Lucide outline icon
- Middle (flex-1):
  - Merchant name — 13px weight 500
  - Category — 11px muted text, 2px top margin
- Right (aligned end):
  - Amount — 13px monospace, colored by type (positive = income, negative = expense)
  - Time — 11px muted, 2px top margin
- Bottom border separating each row

### Progress bar
- Height: 6px (category overview) · 4px (individual category rows)
- Border radius: 9999px
- Track: muted background
- Fill color rules based on percentage spent:
  - Under 80%: neutral/foreground fill
  - 80–100%: warning/amber fill
  - Over 100%: destructive/red fill
- Fill width capped at 100% visually

---

## Screen 1 — Login

Full-screen, centered column layout.

```
[top spacer — roughly 1/3 of screen height]

App name "SnapBudget"         13px–22px weight 500, centered
Tagline (1 line, muted)       13px muted, centered, 4px top margin

[48px gap]

Email input                   full width, height 44px, border, rounded-lg, px 12px
Password input                same style, 8px top margin, secureTextEntry
"Sign in" button              filled, full width, 16px top margin

OR divider                    [separator] "or" muted text [separator]

"Continue with Google"        outline button, full width

[flex spacer]

"Don't have an account? Sign up"   13px muted, centered, bottom
```

Rules:
- No logo illustration — app name as text only
- No colored panels or hero sections

---

## Screen 2 — Home (tab 1)

```
[Header row]
  "May 2026"              lg weight 500
  [ThemeToggle]           top right — icon-only square button, 36×36px,
                          border, rounded-lg; shows sun or moon icon (16px)

[Summary card — Card component, mt 16px]
  "TOTAL SPENT"           11px uppercase tracking-widest muted label
  "Rs 42,850"             28px monospace weight 500, 4px top margin
  [Separator]             12px vertical margin
  [Two-column row]
    Left:
      "INCOME"            11px label
      "Rs 65,000"         15px weight 500
    Right:
      "REMAINING"         11px label
      "Rs 7,150"          15px weight 500, positive color

[Section label]           "RECENT TRANSACTIONS" 11px uppercase muted, mt 24px mb 12px

[Card — no inner padding, overflow hidden]
  [Transaction row × 4]  px 16px each, bottom-bordered

[Ghost link]              "View all transactions" 13px muted, mt 8px, self-start
```

---

## Screen 3 — Scan (modal screen, full height)

```
[Header row — px 16px, pt 12px]
  Back button             36×36px bordered square, rounded-lg, ChevronLeft icon 20px
  "Scan receipt"          15px weight 500, centered, flex-1
  "Manual"                13px muted, right (toggles to manual entry form)

[Camera viewfinder]       mx 16px, mt 16px
  Size: full width minus margins, height 220px
  Background: muted surface
  Border: 1px, rounded-xl (12px)
  4 corner bracket marks: 20×20px each, 2px border lines, positioned 12px from corners
  Center: ScanLine icon 32px, muted color

[Tip text]                11px muted, text-center, mx 32px, mt 12px
                          "Keep receipt flat and well-lit for best results"

[Filled button]           "Capture Receipt" — mx 16px, mt 16px, full width

--- result state (after capture) ---

[Result card — Card, mx 16px, mt 16px]
  Row: CheckCircle icon 14px (positive color) + "Receipt detected" 13px weight 500
  [Separator] my 12px
  4 label/value rows (Merchant / Category / Date / Total):
    Each row: flex-row justify-between, 6px vertical padding
    Label: 11px muted   |   Value: 13px (Total: monospace positive color)
  [Filled button] "Save Transaction" mt 16px

--- manual entry state (toggle from header) ---

[Card — mx 16px, mt 16px]
  Stacked fields: Amount · Merchant · Category · Date
  Each field:
    11px uppercase label above
    Bordered input below, height 44px, rounded-lg
  [Filled button] "Save" mt 8px
```

---

## Screen 4 — Transactions (tab 2)

```
[Header]
  "Transactions"          22px weight 500

[Search bar — Card, py 10px, flex-row, gap 8px]
  Search icon 16px muted
  TextInput flex-1, placeholder "Search..."

[Filter chips — horizontal scroll, gap 8px, vertical padding 12px]
  Active chip:   filled (accent color), rounded-lg, px 12px py 6px
  Inactive chip: outlined (border), muted text, rounded-lg, px 12px py 6px
  Labels: All · Income · Food · Transport · Shopping · Bills

[Grouped transaction list]
  Section header per date group:
    11px uppercase muted label, 8px vertical padding
    Background matches page (not card)
  Under each header:
    Card (no inner padding, overflow hidden)
    Transaction rows, each px 16px
```

---

## Screen 5 — Budget (tab 3)

```
[Header row]
  "Budget"                22px weight 500
  "Edit"                  13px muted, right

[Monthly overview — Card, mt 16px]
  [Row — justify-between]
    Left column:
      "Rs 42,850"         18px monospace weight 500
      "of Rs 53,000"      11px muted, 2px top margin
    Right:
      Badge outline "85%"
  [Progress bar]          6px, mt 12px, fill width 85%
  "12 days remaining"     11px muted, mt 8px

[Section label]           "CATEGORIES" 11px uppercase muted, mt 24px mb 12px

[Category rows — gap 12px]
  Each: Card component
    [Row — items-center, gap 12px]
      Icon square:        32px, muted bg, rounded-lg (8px), lucide icon 15px inside
      Middle (flex-1):
        Category name     13px weight 500
        "Rs X of Rs Y"    11px muted, 2px top margin
      Right:
        Percentage        11px monospace muted
    [Progress bar]        4px, mt 10px, fill color follows spend % rule above

  Categories to show: Groceries · Food · Transport · Shopping · Bills · Health
```

---

## Screen 6 — Analytics (tab 4)

```
[Header row]
  "Analytics"             22px weight 500
  Period toggle (right):
    "Monthly" — 13px weight 500, underlined (active)
    "Weekly"  — 13px muted (inactive)

[Spending card — Card, mt 16px]
  "SPENDING — LAST 6 MONTHS"   11px uppercase muted label, mb 12px
  [Bar chart — height 120px]
    6 vertical bars (months: D · J · F · M · A · M)
    Current/active month bar: foreground/accent color
    Past bars: muted/border color
    No axis lines — only bottom month labels (11px muted)

[Category breakdown card — Card, mt 12px]
  "BY CATEGORY"           11px uppercase muted label, mb 12px
  [Rows — each: flex-row, items-center, gap 8px, 8px vertical padding, bottom border]
    8px circle dot        (category's assigned color)
    Category name         13px, flex-1
    Percentage            13px monospace muted
    Amount                13px monospace
```

---

## Screen 7 — Settings (tab 5)

```
[Header]
  "Settings"              22px weight 500

[Profile card — Card, mt 16px]
  [Row — items-center, gap 12px]
    Avatar circle:        40px, muted bg, rounded-full
                          User initials, 13px weight 500, centered
    Column:
      User name           15px weight 500
      User email          13px muted

[Separator — my 16px]

[Section — "APPEARANCE" 11px uppercase muted, mb 8px]
  [Card]
    [Row — items-center, justify-between, py 4px]
      Left column:
        "Theme"           13px weight 500
        "Light · Dark · System"  11px muted
      [3-way toggle — flex-row]
        3 compact buttons: Light | System | Dark
        Active:   filled (accent bg, accent text), rounded-lg, px 12px py 6px
        Inactive: muted text, px 12px py 6px (no bg, no border)

[Section — "BUDGET" 11px uppercase muted, mt 20px mb 8px]
  [Card — pressable]
    [Row — justify-between, items-center]
      "Monthly budget"    13px weight 500
      [Row — gap 8px]
        "Rs 50,000"       13px monospace muted
        ChevronRight icon 16px muted

[Section — "DATA" 11px uppercase muted, mt 20px mb 8px]
  [Card — pressable]    "Export data"     13px weight 500
  [Card — pressable]    "Clear all data"  13px destructive color

"SnapBudget v1.0.0"     11px muted, text-center, mt 32px
```

---

## Tab bar (persistent, all screens)

- Height: 60px + device safe area bottom inset
- Top: 1px border
- 5 tabs (left to right): Home · Transactions · Scan · Budget · Settings
- Icons: Lucide outline icons, 22px
  - Home → `House`
  - Transactions → `List`
  - Scan → `ScanLine`
  - Budget → `PieChart`
  - Settings → `Settings2`
- Active tab: foreground color icon + label, weight 500
- Inactive tab: muted color icon + label, weight 400
- Label size: 11px, 2px below icon
- **Scan tab** navigates to the Scan modal screen (not a tab screen)
- No floating action button

---

## What NOT to generate

- No illustrations, hero images, or decorative SVGs
- No colored backgrounds on screen-level containers
- No shadows on cards
- No bold text (weight 700) anywhere — max is weight 500
- No animations described in the layout
- No bottom sheet components
- No modals other than the Scan screen
