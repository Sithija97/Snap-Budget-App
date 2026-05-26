import {
  Wallet,
  Transaction,
  Budget,
  MonthlySpending,
  CategoryBreakdown,
} from "../types";

export const MOCK_USER = {
  name: "Kasun",
  monthlyIncome: 65000,
  monthlyBudget: 53000,
};

export const WALLETS: Wallet[] = [
  { id: 1, name: "Cash Wallet", balance: 18450, color: "#4A7AFF", emoji: "💵" },
  {
    id: 2,
    name: "Bank Account",
    balance: 62300,
    color: "#00C170",
    emoji: "🏦",
  },
  { id: 3, name: "Savings", balance: 120000, color: "#9B6BFF", emoji: "🐷" },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    merchant: "Keells Super",
    category: "Groceries",
    txType: "exp",
    amount: 2340,
    date: "2026-05-26",
    time: "10:22 AM",
    emoji: "🛒",
    iconBg: "#E6FAF4",
    iconColor: "#00C170",
  },
  {
    id: "2",
    merchant: "PickMe",
    category: "Transport",
    txType: "exp",
    amount: 450,
    date: "2026-05-26",
    time: "08:55 AM",
    emoji: "🚖",
    iconBg: "#EEF2FF",
    iconColor: "#4A7AFF",
  },
  {
    id: "3",
    merchant: "Salary",
    category: "Income",
    txType: "inc",
    amount: 50000,
    date: "2026-05-01",
    time: "09:00 AM",
    emoji: "💰",
    iconBg: "#E6FAF4",
    iconColor: "#00C170",
  },
  {
    id: "4",
    merchant: "Dialog",
    category: "Bills",
    txType: "exp",
    amount: 1000,
    date: "2026-05-25",
    time: "06:10 PM",
    emoji: "📱",
    iconBg: "#FFF4E5",
    iconColor: "#FF9F40",
  },
  {
    id: "5",
    merchant: "H&M",
    category: "Shopping",
    txType: "exp",
    amount: 5400,
    date: "2026-05-25",
    time: "02:30 PM",
    emoji: "🛍️",
    iconBg: "#FFF0F6",
    iconColor: "#FF6B9D",
  },
  {
    id: "6",
    merchant: "Barista",
    category: "Food",
    txType: "exp",
    amount: 680,
    date: "2026-05-25",
    time: "12:15 PM",
    emoji: "☕",
    iconBg: "#FFF4E5",
    iconColor: "#FF9F40",
  },
  {
    id: "7",
    merchant: "Freelance",
    category: "Income",
    txType: "inc",
    amount: 15000,
    date: "2026-05-18",
    time: "11:00 AM",
    emoji: "💻",
    iconBg: "#E6FAF4",
    iconColor: "#00C170",
  },
  {
    id: "8",
    merchant: "Pharmacy",
    category: "Health",
    txType: "exp",
    amount: 890,
    date: "2026-05-18",
    time: "04:45 PM",
    emoji: "💊",
    iconBg: "#E5F8FC",
    iconColor: "#00B8D9",
  },
];
export const MOCK_BUDGETS: Budget[] = [
  {
    category: "Groceries",
    emoji: "🛒",
    spent: 12400,
    limit: 15000,
    color: "#00C170",
  },
  {
    category: "Food",
    emoji: "🍽️",
    spent: 8200,
    limit: 10000,
    color: "#FF9F40",
  },
  {
    category: "Transport",
    emoji: "🚖",
    spent: 4800,
    limit: 5000,
    color: "#4A7AFF",
  },
  {
    category: "Shopping",
    emoji: "🛍️",
    spent: 9750,
    limit: 8000,
    color: "#FF5A5F",
  },
  {
    category: "Bills",
    emoji: "📱",
    spent: 7700,
    limit: 12000,
    color: "#9B6BFF",
  },
  {
    category: "Health",
    emoji: "💊",
    spent: 890,
    limit: 3000,
    color: "#00B8D9",
  },
];

export const MOCK_MONTHLY_SPENDING: MonthlySpending[] = [
  { month: "D", amount: 38000 },
  { month: "J", amount: 45000 },
  { month: "F", amount: 41000 },
  { month: "M", amount: 52000 },
  { month: "A", amount: 37000 },
  { month: "M", amount: 42850 },
];

export const MOCK_CATEGORY_BREAKDOWN: CategoryBreakdown[] = [
  {
    category: "Groceries",
    emoji: "🛒",
    amount: 12400,
    pct: 29,
    color: "#00C170",
  },
  {
    category: "Shopping",
    emoji: "🛍️",
    amount: 9750,
    pct: 23,
    color: "#FF6B9D",
  },
  { category: "Food", emoji: "🍽️", amount: 8200, pct: 19, color: "#FF9F40" },
  { category: "Bills", emoji: "📱", amount: 7700, pct: 18, color: "#9B6BFF" },
  {
    category: "Transport",
    emoji: "🚖",
    amount: 4800,
    pct: 11,
    color: "#4A7AFF",
  },
];

export const TOTAL_INCOME = 65000;
export const TOTAL_SPENT = 42850;
export const REMAINING = MOCK_USER.monthlyBudget - TOTAL_SPENT;
