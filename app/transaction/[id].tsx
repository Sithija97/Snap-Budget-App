import { useState } from "react";
import { View, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useWalletStore } from "@/store/useWalletStore";
import { TxType } from "@/types";
import { fmt, parseAmount } from "@/utils/format";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";

export default function TransactionDetailScreen() {
  const { isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const transactions = useTransactionStore((s) => s.transactions);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const categories = useCategoryStore((s) => s.categories);
  const wallets = useWalletStore((s) => s.wallets);

  const tx = transactions.find((t) => t.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [merchant, setMerchant] = useState(tx?.merchant ?? "");
  const [amount, setAmount] = useState(tx ? String(tx.amount) : "");
  const [categoryId, setCategoryId] = useState(tx?.categoryId ?? null);
  const [walletId, setWalletId] = useState(tx?.walletId ?? null);

  const borderColor = isDark ? "#27272a" : "#e4e4e7";
  const iconColor   = isDark ? "#a1a1aa" : "#71717a";
  const inputText   = isDark ? "#fafafa" : "#09090b";
  const inputBg     = isDark ? "#09090b" : "#ffffff";
  const accentFill  = isDark ? "#fafafa" : "#18181b";

  const inputStyle = {
    height: 44,
    borderWidth: 1,
    borderColor,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: inputBg,
    color: inputText,
    fontSize: 15,
  } as const;

  const chipStyle = (isActive: boolean) =>
    ({
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isActive ? accentFill : borderColor,
      backgroundColor: isActive ? accentFill : "transparent",
    }) as const;

  const toggleEdit = () => {
    // Cancelling discards unsaved edits
    if (isEditing && tx) {
      setMerchant(tx.merchant);
      setAmount(String(tx.amount));
      setCategoryId(tx.categoryId);
      setWalletId(tx.walletId);
    }
    setIsEditing(!isEditing);
  };

  const chipText = (isActive: boolean) =>
    isActive
      ? "font-medium text-accentFg dark:text-accentFg-dark"
      : "text-mutedFg dark:text-mutedFg-dark";

  const header = (
    <View className="flex-row items-center px-4 pt-3 pb-4">
      <TouchableOpacity
        onPress={() => router.back()}
        className="w-9 h-9 items-center justify-center rounded-lg border border-border dark:border-border-dark mr-3"
        activeOpacity={0.7}
      >
        <ChevronLeft size={20} color={iconColor} />
      </TouchableOpacity>
      <UIText size="base" variant="heading" className="flex-1 text-center">Transaction</UIText>
      {tx ? (
        <TouchableOpacity onPress={toggleEdit} activeOpacity={0.7}>
          <UIText size="sm" variant="muted">{isEditing ? "Cancel" : "Edit"}</UIText>
        </TouchableOpacity>
      ) : (
        <View className="w-9" />
      )}
    </View>
  );

  // Bad id / deep link edge case — never crash
  if (!tx) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
        {header}
        <View className="items-center py-12">
          <UIText size="sm" variant="muted">Transaction not found</UIText>
          <Button label="Go Back" variant="outline" className="mt-4" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const category = categories.find((c) => c.id === tx.categoryId);
  const wallet = wallets.find((w) => w.id === tx.walletId);
  const isIncome = tx.txType === TxType.Income;

  // Category options match the transaction's direction
  const categoryOptions = categories.filter(
    (c) => c.type === (isIncome ? "income" : "expense")
  );

  const canSave = merchant.trim().length > 0 && parseAmount(amount) > 0 && categoryId !== null;

  const handleSave = () => {
    if (!categoryId) return;
    updateTransaction(tx.id, {
      merchant: merchant.trim(),
      amount: parseAmount(amount),
      categoryId,
      walletId,
    });
    router.back();
  };

  const handleDelete = () => {
    Alert.alert("Delete transaction?", `"${tx.merchant}" — ${fmt(tx.amount)} will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteTransaction(tx.id);
          router.back();
        },
      },
    ]);
  };

  const readRows = [
    { label: "Merchant", value: tx.merchant },
    { label: "Category", value: category?.name ?? "Uncategorized" },
    { label: "Date",     value: `${tx.date} · ${tx.time}` },
    { label: "Wallet",   value: wallet?.name ?? "Not set" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {header}

        {isEditing ? (
          <Card className="mx-4 mt-4 gap-3">
            <UIText size="xs" variant="label">Amount</UIText>
            <TextInput
              style={inputStyle}
              placeholder="Rs 0"
              placeholderTextColor={iconColor}
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
              keyboardType="numeric"
              returnKeyType="next"
            />

            <UIText size="xs" variant="label" className="mt-2">Merchant</UIText>
            <TextInput
              style={inputStyle}
              placeholder="Merchant name"
              placeholderTextColor={iconColor}
              value={merchant}
              onChangeText={setMerchant}
              autoCapitalize="words"
              returnKeyType="done"
            />

            <UIText size="xs" variant="label" className="mt-2">Category</UIText>
            <View className="flex-row flex-wrap gap-2">
              {categoryOptions.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setCategoryId(c.id)}
                  activeOpacity={0.7}
                  style={chipStyle(categoryId === c.id)}
                >
                  <UIText size="sm" className={chipText(categoryId === c.id)}>{c.name}</UIText>
                </TouchableOpacity>
              ))}
            </View>

            <UIText size="xs" variant="label" className="mt-2">Wallet</UIText>
            <View className="flex-row flex-wrap gap-2">
              {wallets.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  onPress={() => setWalletId(w.id)}
                  activeOpacity={0.7}
                  style={chipStyle(walletId === w.id)}
                >
                  <UIText size="sm" className={chipText(walletId === w.id)}>{w.name}</UIText>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              label="Save Changes"
              variant="default"
              className="mt-2"
              disabled={!canSave}
              onPress={handleSave}
            />
          </Card>
        ) : (
          <Card className="mx-4 mt-4">
            <UIText size="xs" variant="label">{isIncome ? "Income" : "Expense"}</UIText>
            <UIText
              size="2xl"
              className={`font-mono font-medium mt-1 ${
                isIncome
                  ? "text-positive dark:text-positive-dark"
                  : "text-negative dark:text-negative-dark"
              }`}
            >
              {isIncome ? "+" : "−"}{fmt(tx.amount)}
            </UIText>

            <Separator className="my-3" />

            {readRows.map((row) => (
              <View key={row.label} className="flex-row justify-between py-1.5">
                <UIText size="xs" variant="muted">{row.label}</UIText>
                <UIText size="sm">{row.value}</UIText>
              </View>
            ))}

            <Button
              label="Delete Transaction"
              variant="destructive"
              className="mt-4"
              onPress={handleDelete}
            />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
