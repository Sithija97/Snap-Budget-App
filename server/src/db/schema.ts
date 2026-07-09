import {
  pgTable,
  text,
  uuid,
  numeric,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Clerk's user id (e.g. "user_2abc...") is the primary key — no separate
// internal id, since every foreign key in this schema needs to reference it.
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  // Not present on the JWT payload we verify per-request; left null unless
  // populated later via a Clerk webhook or explicit profile fetch.
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  balance: numeric("balance", { mode: "number" }), // nullable: null = "not set"
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("wallets_user_id_idx").on(table.userId),
]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", { enum: ["expense", "income"] }).notNull(),
  icon: text("icon").notNull(),
  parentId: uuid("parent_id"),
  isDefault: boolean("is_default").notNull().default(false),
}, (table) => [
  index("categories_user_id_idx").on(table.userId),
  // Case-insensitive: prevents "Groceries" and "groceries" coexisting under
  // the same type for the same user, not just byte-identical duplicates.
  uniqueIndex("categories_user_type_name_unique_idx").on(
    table.userId,
    table.type,
    sql`lower(${table.name})`
  ),
]);

export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  limitAmount: numeric("limit_amount", { mode: "number" }).notNull(),
  month: text("month").notNull(), // "YYYY-MM"
  repeat: boolean("repeat").notNull().default(false),
}, (table) => [
  index("budgets_user_id_month_idx").on(table.userId, table.month),
  index("budgets_category_id_idx").on(table.categoryId),
]);

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  merchant: text("merchant").notNull(),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
  walletId: uuid("wallet_id").references(() => wallets.id, { onDelete: "set null" }),
  txType: text("tx_type", { enum: ["inc", "exp"] }).notNull(),
  amount: numeric("amount", { mode: "number" }).notNull(),
  date: text("date").notNull(), // "YYYY-MM-DD"
  time: text("time").notNull(), // "10:22 AM"
  // Cloudinary public_id ("userId/uuid"), null when the transaction wasn't
  // created from a scanned receipt (e.g. manual entry).
  receiptKey: text("receipt_key"),
}, (table) => [
  index("transactions_user_id_date_idx").on(table.userId, table.date),
  index("transactions_category_id_idx").on(table.categoryId),
  index("transactions_wallet_id_idx").on(table.walletId),
]);
