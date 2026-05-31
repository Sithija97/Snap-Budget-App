export enum TxType {
  Income  = "inc",
  Expense = "exp",
}

export enum Category {
  Groceries = "Groceries",
  Food      = "Food",
  Transport = "Transport",
  Shopping  = "Shopping",
  Bills     = "Bills",
  Health    = "Health",
  Income    = "Income",
}

export interface Wallet {
  id:      number;
  name:    string;
  balance: number;
  color:   string;
  emoji:   string;
}

export interface Transaction {
  id:        string;
  merchant:  string;
  category:  string;
  txType:    TxType;
  amount:    number;
  date:      string;
  time:      string;
  icon:      string;
  iconBg:    string;
  iconColor: string;
}

export interface Budget {
  category: string;
  emoji:    string;
  spent:    number;
  limit:    number;
  color:    string;
}

export interface MonthlySpending {
  month:  string;
  amount: number;
}

export interface CategoryBreakdown {
  category: string;
  emoji:    string;
  amount:   number;
  pct:      number;
  color:    string;
}
