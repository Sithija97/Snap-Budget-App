import { MonthlySpending, CategoryBreakdown } from "@/types";

export const MOCK_USER = {
  name: "Kasun",
  monthlyIncome: 65000,
  monthlyBudget: 53000,
};

// Analytics stays on mock chart data this pass — real aggregation is a known deferred item
export const MOCK_MONTHLY_SPENDING: MonthlySpending[] = [
  { month: "D", amount: 38000 },
  { month: "J", amount: 45000 },
  { month: "F", amount: 41000 },
  { month: "M", amount: 52000 },
  { month: "A", amount: 37000 },
  { month: "M", amount: 42850 },
];

export const MOCK_CATEGORY_BREAKDOWN: CategoryBreakdown[] = [
  { category: "Groceries", emoji: "🛒",  amount: 12400, pct: 29, color: "#1D9E75" },
  { category: "Shopping",  emoji: "🛍️", amount: 9750,  pct: 23, color: "#FF6B9D" },
  { category: "Food",      emoji: "🍽️", amount: 8200,  pct: 19, color: "#FF9F40" },
  { category: "Bills",     emoji: "📱",  amount: 7700,  pct: 18, color: "#9B6BFF" },
  { category: "Transport", emoji: "🚖",  amount: 4800,  pct: 11, color: "#4A7AFF" },
];
