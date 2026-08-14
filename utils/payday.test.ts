import { describe, it, expect } from "vitest";
import { inferPayday } from "./payday";
import { Transaction, TxType } from "@/types";

let seq = 0;
const income = (date: string, amount: number): Transaction => ({
  id: `t-${seq++}`,
  merchant: "Salary",
  categoryId: "cat-income",
  walletId: "w1",
  txType: TxType.Income,
  amount,
  date,
  time: "9:00 AM",
});

const expense = (date: string, amount: number): Transaction => ({
  id: `t-${seq++}`,
  merchant: "Shop",
  categoryId: "cat-shop",
  walletId: "w1",
  txType: TxType.Expense,
  amount,
  date,
  time: "9:00 AM",
});

describe("inferPayday", () => {
  it("is not confident with fewer than two income transactions", () => {
    expect(inferPayday([income("2026-06-01", 1000)]).confident).toBe(false);
  });

  it("is not confident with no income transactions", () => {
    expect(inferPayday([expense("2026-06-05", 50)]).confident).toBe(false);
  });

  it("is not confident when income dates don't cluster (no recurring pattern)", () => {
    const txs = [income("2026-04-03", 1000), income("2026-05-20", 1200)];
    expect(inferPayday(txs).confident).toBe(false);
  });

  it("infers day-of-month and usual amount from a clear recurring pattern", () => {
    const txs = [
      income("2026-04-01", 1000),
      income("2026-05-01", 1000),
      income("2026-06-01", 1000),
      expense("2026-06-15", 200),
    ];
    const result = inferPayday(txs, new Date(2026, 6, 10)); // 10 July 2026
    expect(result.confident).toBe(true);
    expect(result.dayOfMonth).toBe(1);
    expect(result.usualAmount).toBe(1000);
    expect(result.nextPayday).toBe("2026-08-01");
  });

  it("tolerates a few days of drift across occurrences (weekends/holidays)", () => {
    const txs = [income("2026-04-28", 1000), income("2026-05-30", 1050), income("2026-07-01", 1000)];
    const result = inferPayday(txs, new Date(2026, 6, 15));
    expect(result.confident).toBe(true);
  });

  it("picks the next occurrence still in the future when today is past this month's payday", () => {
    const txs = [income("2026-04-05", 500), income("2026-05-05", 500)];
    const result = inferPayday(txs, new Date(2026, 5, 20)); // 20 June 2026, past the 5th
    expect(result.nextPayday).toBe("2026-07-05");
  });

  it("picks this month's occurrence when today is before it", () => {
    const txs = [income("2026-04-05", 500), income("2026-05-05", 500)];
    const result = inferPayday(txs, new Date(2026, 5, 1)); // 1 June 2026, before the 5th
    expect(result.nextPayday).toBe("2026-06-05");
  });

  it("clamps to month-end when dayOfMonth doesn't exist in the next month", () => {
    const txs = [income("2026-01-31", 500), income("2026-03-31", 500)];
    const result = inferPayday(txs, new Date(2026, 1, 27)); // 27 Feb 2026 (28-day month)
    expect(result.nextPayday).toBe("2026-02-28");
  });
});
