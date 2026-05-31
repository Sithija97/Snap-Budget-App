export interface Wallet {
  id: number;
  name: string;
  balance: number;
  color: string;
  emoji: string;
}

export interface Transaction {
  id: string;
  merchant: string;
  category: string;
  txType: "inc" | "exp";
  amount: number;
  date: string;
  time: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

export interface Budget {
  category: string;
  emoji: string;
  spent: number;
  limit: number;
  color: string;
}

export interface MonthlySpending {
  month: string;
  amount: number;
}

export interface CategoryBreakdown {
  category: string;
  emoji: string;
  amount: number;
  pct: number;
  color: string;
}
