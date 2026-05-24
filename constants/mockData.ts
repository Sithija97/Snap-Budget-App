import {
  Transaction,
  Budget,
  MonthlySpending,
  CategoryBreakdown,
} from "../types";

export const MOCK_USER = {
  name: "Kasun",
  monthlyIncome: 50000,
  monthlyBudget: 50000,
};

export const MOCK_TRANSACTIONS: Transaction[] = [
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

export const MOCK_BUDGETS: Budget[] = [
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

export const MOCK_MONTHLY_SPENDING: MonthlySpending[] = [
  { month: "Dec", amount: 38000 },
  { month: "Jan", amount: 45000 },
  { month: "Feb", amount: 41000 },
  { month: "Mar", amount: 52000 },
  { month: "Apr", amount: 37000 },
  { month: "May", amount: 42850 },
];

export const MOCK_CATEGORY_BREAKDOWN: CategoryBreakdown[] = [
  { category: "Groceries", amount: 12400, pct: 29, color: "#1D9E75" },
  { category: "Shopping", amount: 9750, pct: 23, color: "#EF9F27" },
  { category: "Food & Dining", amount: 8200, pct: 19, color: "#7F77DD" },
  { category: "Bills", amount: 7700, pct: 18, color: "#85B7EB" },
  { category: "Transport", amount: 4800, pct: 11, color: "#F0997B" },
];

export const TOTAL_SPENT = 42850;
export const REMAINING = 7150;
