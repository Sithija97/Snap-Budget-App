import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import { Wallet, Category, Budget, Transaction, TxType } from "@/types";

interface ExportData {
  wallets: Wallet[];
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
}

// Column headers are picked to read naturally in a spreadsheet — not the
// raw camelCase field names, and IDs are resolved to names since a
// spreadsheet reader has no store to look them up in.
export async function exportDataAsExcel(data: ExportData): Promise<void> {
  const categoryName = (id: string) => data.categories.find((c) => c.id === id)?.name ?? "Unknown";
  const walletName = (id: string | null) => data.wallets.find((w) => w.id === id)?.name ?? "—";

  const transactionRows = [...data.transactions]
    .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1))
    .map((t) => ({
      Date: t.date,
      Time: t.time,
      Merchant: t.merchant,
      Category: categoryName(t.categoryId),
      Wallet: walletName(t.walletId),
      Type: t.txType === TxType.Income ? "Income" : "Expense",
      "Amount (Rs)": t.amount,
    }));

  const budgetRows = data.budgets.map((b) => ({
    Month: b.month,
    Category: categoryName(b.categoryId),
    "Limit (Rs)": b.limitAmount,
    Repeats: b.repeat ? "Yes" : "No",
  }));

  const walletRows = data.wallets.map((w) => ({
    Name: w.name,
    "Balance (Rs)": w.balance ?? "Not set",
    Default: w.isDefault ? "Yes" : "No",
    "Created": w.createdAt,
  }));

  const categoryRows = data.categories.map((c) => ({
    Name: c.name,
    Type: c.type === "income" ? "Income" : "Expense",
    Parent: c.parentId ? categoryName(c.parentId) : "—",
  }));

  const workbook = XLSX.utils.book_new();
  const addSheet = (rows: Record<string, unknown>[], name: string) => {
    // A sheet with zero rows would otherwise render as a totally blank tab —
    // a single header-only placeholder row makes it clear the section is
    // legitimately empty, not a bug in the export.
    const sheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ " ": "No data" }]);
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  };

  addSheet(transactionRows, "Transactions");
  addSheet(budgetRows, "Budgets");
  addSheet(walletRows, "Wallets");
  addSheet(categoryRows, "Categories");

  const base64 = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
  const fileName = `SnapBudget-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Sharing isn't available on this device.");
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    dialogTitle: "SnapBudget data export",
    UTI: "org.openxmlformats.spreadsheetml.sheet",
  });
}
