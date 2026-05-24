export interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  time: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

export interface Budget {
  category: string;
  spent: number;
  limit: number;
  icon: string;
  color: string;
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
