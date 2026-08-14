export enum TxType {
  Income  = "inc",
  Expense = "exp",
}

export type CategoryType = "expense" | "income";

export interface Category {
  id:        string;
  name:      string;
  type:      CategoryType;
  icon:      string;          // key into TX_ICONS map
  parentId:  string | null;   // for subcategories, optional
  isDefault: boolean;         // seeded categories can't be deleted, only hidden
}

export interface Wallet {
  id:        string;
  name:      string;
  balance:   number | null;   // null = "not set", distinct from a real 0
  isDefault: boolean;
  createdAt: string;
}

export interface Transaction {
  id:         string;
  merchant:   string;
  categoryId: string;
  walletId:   string | null;
  txType:     TxType;
  amount:     number;
  date:       string;         // "YYYY-MM-DD"
  time:       string;         // "10:22 AM"
  receiptKey?: string | null; // Cloudinary public_id, set only when created from a scan
}

export interface Budget {
  id:          string;
  categoryId:  string;
  limitAmount: number;
  month:       string;        // "YYYY-MM"
  repeat:      boolean;
}

export interface TelegramLinkStatus {
  linked:      boolean;
  displayName?: string | null;
  linkedAt?:    string;
}

export interface TelegramLinkCode {
  code:      string;
  expiresAt: string;
  deepLink:  string;
}

export interface Recap {
  id:          string;
  periodType:  "weekly" | "monthly";
  periodStart: string;   // "YYYY-MM-DD"
  periodEnd:   string;   // "YYYY-MM-DD"
  message:     string;
  createdAt:   string;
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
