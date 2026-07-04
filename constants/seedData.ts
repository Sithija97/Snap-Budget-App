import { Budget, Category, Transaction, TxType } from "@/types";
import { currentMonth, daysAgoISO } from "@/utils/dates";

// Stable ids so seed transactions/budgets can reference them deterministically
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-groceries", name: "Groceries", type: "expense", icon: "ShoppingCart",    parentId: null, isDefault: true },
  { id: "cat-food",      name: "Food",      type: "expense", icon: "Coffee",          parentId: null, isDefault: true },
  { id: "cat-transport", name: "Transport", type: "expense", icon: "Car",             parentId: null, isDefault: true },
  { id: "cat-shopping",  name: "Shopping",  type: "expense", icon: "ShoppingBag",     parentId: null, isDefault: true },
  { id: "cat-bills",     name: "Bills",     type: "expense", icon: "Smartphone",      parentId: null, isDefault: true },
  { id: "cat-health",    name: "Health",    type: "expense", icon: "HeartPulse",      parentId: null, isDefault: true },
  { id: "cat-salary",    name: "Salary",    type: "income",  icon: "CircleArrowDown", parentId: null, isDefault: true },
  { id: "cat-freelance", name: "Freelance", type: "income",  icon: "Laptop",          parentId: null, isDefault: true },
];

// Keep seed dates inside the current month so Home/Budget totals aren't empty on first run
const inMonth = (daysAgo: number): string => {
  const firstOfMonth = `${currentMonth()}-01`;
  const d = daysAgoISO(daysAgo);
  return d < firstOfMonth ? firstOfMonth : d;
};

export function buildSeedTransactions(): Transaction[] {
  return [
    {
      id: "seed-1", merchant: "Keells Super", categoryId: "cat-groceries", walletId: null,
      txType: TxType.Expense, amount: 2340, date: inMonth(0), time: "10:22 AM",
    },
    {
      id: "seed-2", merchant: "PickMe", categoryId: "cat-transport", walletId: null,
      txType: TxType.Expense, amount: 450, date: inMonth(0), time: "08:55 AM",
    },
    {
      id: "seed-3", merchant: "Salary", categoryId: "cat-salary", walletId: null,
      txType: TxType.Income, amount: 50000, date: `${currentMonth()}-01`, time: "09:00 AM",
    },
    {
      id: "seed-4", merchant: "Dialog", categoryId: "cat-bills", walletId: null,
      txType: TxType.Expense, amount: 1000, date: inMonth(1), time: "06:10 PM",
    },
    {
      id: "seed-5", merchant: "H&M", categoryId: "cat-shopping", walletId: null,
      txType: TxType.Expense, amount: 5400, date: inMonth(1), time: "02:30 PM",
    },
    {
      id: "seed-6", merchant: "Barista", categoryId: "cat-food", walletId: null,
      txType: TxType.Expense, amount: 680, date: inMonth(1), time: "12:15 PM",
    },
    {
      id: "seed-7", merchant: "Freelance", categoryId: "cat-freelance", walletId: null,
      txType: TxType.Income, amount: 15000, date: inMonth(8), time: "11:00 AM",
    },
    {
      id: "seed-8", merchant: "Pharmacy", categoryId: "cat-health", walletId: null,
      txType: TxType.Expense, amount: 890, date: inMonth(8), time: "04:45 PM",
    },
  ];
}

export function buildSeedBudgets(): Budget[] {
  const month = currentMonth();
  return [
    { id: "seed-b1", categoryId: "cat-groceries", limitAmount: 15000, month, repeat: true },
    { id: "seed-b2", categoryId: "cat-food",      limitAmount: 10000, month, repeat: true },
    { id: "seed-b3", categoryId: "cat-transport", limitAmount: 5000,  month, repeat: true },
    { id: "seed-b4", categoryId: "cat-shopping",  limitAmount: 8000,  month, repeat: true },
    { id: "seed-b5", categoryId: "cat-bills",     limitAmount: 12000, month, repeat: true },
    { id: "seed-b6", categoryId: "cat-health",    limitAmount: 3000,  month, repeat: true },
  ];
}
