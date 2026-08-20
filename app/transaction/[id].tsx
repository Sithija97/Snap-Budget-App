import { useState, useEffect } from "react";
import { View, ScrollView, Alert, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ChevronLeft } from "lucide-react-native";
import { useThemeColors } from "@/context/ThemeContext";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useWalletStore } from "@/store/useWalletStore";
import { TxType } from "@/types";
import { fmt, parseAmount } from "@/utils/format";
import { todayISO } from "@/utils/dates";
import { API_URL } from "@/lib/api";
import { UIText } from "@/components/ui/UIText";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { DateField } from "@/components/ui/DateField";
import { Input } from "@/components/ui/Input";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken } = useAuth();

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
  const [date, setDate] = useState(tx?.date ?? todayISO());
  const [saving, setSaving] = useState(false);
  // RN's <Image source={{ uri, headers }}> only actually attaches those
  // headers on native — react-native-web renders a plain <img>, and browsers
  // give no way to attach custom headers (e.g. Authorization) to an <img>
  // request, so that approach silently fails to load on web. fetch() +
  // a data URI works identically on every platform.
  const [receiptDataUri, setReceiptDataUri] = useState<string | null>(null);

  const receiptKey = tx?.receiptKey;
  useEffect(() => {
    if (!receiptKey || !API_URL) return;
    let cancelled = false;
    (async () => {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/api/receipts/${receiptKey}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        if (!cancelled) setReceiptDataUri(reader.result as string);
      };
      reader.readAsDataURL(blob);
    })();
    return () => {
      cancelled = true;
    };
  }, [receiptKey, getToken]);

  // One step above the dark card surface (#1a1f2e) so the receipt placeholder stays visible
  const { muted: mutedBg, mutedFg: iconColor } = useThemeColors();

  const toggleEdit = () => {
    // Cancelling discards unsaved edits
    if (isEditing && tx) {
      setMerchant(tx.merchant);
      setAmount(String(tx.amount));
      setCategoryId(tx.categoryId);
      setWalletId(tx.walletId);
      setDate(tx.date);
    }
    setIsEditing(!isEditing);
  };

  const header = (
    <View className="flex-row items-center px-4 pt-3 pb-4">
      <IconButton onPress={() => router.back()} className="mr-3">
        <ChevronLeft size={20} color={iconColor} />
      </IconButton>
      <UIText size="base" variant="heading" className="flex-1 text-center">Transaction</UIText>
      {tx ? (
        <AnimatedPressable onPress={toggleEdit}>
          <UIText size="sm" variant="muted">{isEditing ? "Cancel" : "Edit"}</UIText>
        </AnimatedPressable>
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

  const canSave = merchant.trim().length > 0 && parseAmount(amount) > 0 && categoryId !== null && !saving;

  const handleSave = async () => {
    if (!categoryId) return;
    setSaving(true);
    try {
      await updateTransaction(tx.id, {
        merchant: merchant.trim(),
        amount: parseAmount(amount),
        categoryId,
        walletId,
        date,
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Couldn't save transaction", e?.message ?? "Please try again.");
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete transaction?", `"${tx.merchant}" — ${fmt(tx.amount)} will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTransaction(tx.id);
            router.back();
          } catch (e: any) {
            Alert.alert("Couldn't delete transaction", e?.message ?? "Please try again.");
          }
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
            <Input
              placeholder="Rs 0"
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
              keyboardType="numeric"
              returnKeyType="next"
            />

            <UIText size="xs" variant="label" className="mt-2">Merchant</UIText>
            <Input
              placeholder="Merchant name"
              value={merchant}
              onChangeText={setMerchant}
              autoCapitalize="words"
              returnKeyType="done"
            />

            <UIText size="xs" variant="label" className="mt-2">Category</UIText>
            <View className="flex-row flex-wrap gap-2">
              {categoryOptions.map((c) => (
                <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
              ))}
            </View>

            <UIText size="xs" variant="label" className="mt-2">Date</UIText>
            <DateField value={date} onChange={setDate} maxDate={new Date()} />

            <UIText size="xs" variant="label" className="mt-2">Wallet</UIText>
            <View className="flex-row flex-wrap gap-2">
              {wallets.map((w) => (
                <Chip key={w.id} label={w.name} selected={walletId === w.id} onPress={() => setWalletId(w.id)} />
              ))}
            </View>

            <Button
              label={saving ? "Saving..." : "Save Changes"}
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
              className={`font-semibold mt-1 ${
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

            {receiptKey && (
              <>
                <Separator className="my-3" />
                <UIText size="xs" variant="label" className="mb-2">Receipt</UIText>
                {receiptDataUri ? (
                  <Image
                    source={{ uri: receiptDataUri }}
                    style={{ width: "100%", height: 200, borderRadius: 8, backgroundColor: mutedBg }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{ width: "100%", height: 200, borderRadius: 8, backgroundColor: mutedBg }}
                    className="items-center justify-center"
                  >
                    <ActivityIndicator color={iconColor} />
                  </View>
                )}
              </>
            )}

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
