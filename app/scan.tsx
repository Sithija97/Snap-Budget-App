import { useState } from "react";
import { View, ScrollView, Alert, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, ScanLine, CheckCircle2 } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useWalletStore } from "@/store/useWalletStore";
import { TxType } from "@/types";
import { parseAmount } from "@/utils/format";
import { todayISO } from "@/utils/dates";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";

const nowTime = () =>
  new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

const RECEIPT_ROWS = [
  { label: "Merchant",  value: "Cargills Food City" },
  { label: "Category",  value: "Groceries" },
  { label: "Date",      value: "19 May 2026" },
  { label: "Total",     value: "Rs 3,680", highlight: true },
] as const;

const CORNER_POSITIONS = [
  { top: 12, left: 12,    borderTopWidth: 2,    borderLeftWidth: 2  },
  { top: 12, right: 12,   borderTopWidth: 2,    borderRightWidth: 2 },
  { bottom: 12, left: 12,  borderBottomWidth: 2, borderLeftWidth: 2  },
  { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2 },
] as const;

export default function ScanScreen() {
  const { isDark } = useTheme();
  const [scanned, setScanned] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [saving, setSaving] = useState(false);

  // Manual entry state
  const [amount, setAmount]     = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('');

  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const wallets = useWalletStore((s) => s.wallets);

  const defaultWalletId =
    wallets.find((w) => w.isDefault)?.id ?? wallets[0]?.id ?? null;

  // Matches an existing category by name, or creates a new expense category
  const resolveCategoryId = async (name: string): Promise<string> => {
    const trimmed = name.trim();
    const { categories, addCategory } = useCategoryStore.getState();
    const existing = categories.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing.id;
    const created = await addCategory({ name: trimmed, type: "expense", icon: "ShoppingCart", parentId: null });
    return created.id;
  };

  const canSaveManual =
    parseAmount(amount) > 0 && merchant.trim().length > 0 && category.trim().length > 0 && !saving;

  const saveTransaction = async (m: string, catName: string, amt: number) => {
    setSaving(true);
    try {
      const categoryId = await resolveCategoryId(catName);
      await addTransaction({
        merchant: m,
        categoryId,
        walletId: defaultWalletId,
        txType: TxType.Expense,
        amount: amt,
        date: todayISO(),
        time: nowTime(),
      });
      Alert.alert("Saved!", "Transaction saved successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Couldn't save transaction", e?.message ?? "Please try again.");
      setSaving(false);
    }
  };

  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const mutedBg     = isDark ? '#18181b' : '#f4f4f5';
  const iconColor   = isDark ? '#a1a1aa' : '#71717a';
  const inputText   = isDark ? '#fafafa' : '#09090b';
  const inputBg     = isDark ? '#09090b' : '#ffffff';

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

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 pt-3 pb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 items-center justify-center rounded-lg border border-border dark:border-border-dark mr-3"
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={iconColor} />
          </TouchableOpacity>
          <UIText size="base" variant="heading" className="flex-1 text-center">Scan receipt</UIText>
          <TouchableOpacity onPress={() => setShowManual(!showManual)} activeOpacity={0.7}>
            <UIText size="sm" variant="muted">{showManual ? 'Scan' : 'Manual'}</UIText>
          </TouchableOpacity>
        </View>

        {showManual ? (
          /* Manual entry — real TextInputs */
          <Card className="mx-4 mt-4 gap-3">
            <UIText size="xs" variant="label">Amount</UIText>
            <TextInput
              style={inputStyle}
              placeholder="Rs 0"
              placeholderTextColor={iconColor}
              value={amount}
              onChangeText={setAmount}
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
              returnKeyType="next"
            />

            <UIText size="xs" variant="label" className="mt-2">Category</UIText>
            <TextInput
              style={inputStyle}
              placeholder="e.g. Groceries"
              placeholderTextColor={iconColor}
              value={category}
              onChangeText={setCategory}
              autoCapitalize="words"
              returnKeyType="done"
            />

            <Button
              label={saving ? "Saving..." : "Save Transaction"}
              variant="default"
              className="mt-2"
              disabled={!canSaveManual}
              onPress={() =>
                saveTransaction(merchant.trim(), category, parseAmount(amount))
              }
            />
          </Card>
        ) : (
          <>
            {/* Viewfinder — hidden once scanned */}
            {!scanned && (
              <>
                <View
                  className="mx-4 mt-4 rounded-xl overflow-hidden"
                  style={{ height: 220, backgroundColor: mutedBg, borderWidth: 1, borderColor }}
                >
                  {CORNER_POSITIONS.map((s, i) => (
                    <View
                      key={i}
                      style={{ position: 'absolute', width: 20, height: 20, borderColor, ...s }}
                    />
                  ))}
                  <View className="flex-1 items-center justify-center">
                    <ScanLine size={32} color={iconColor} />
                  </View>
                </View>

                <UIText size="xs" variant="muted" className="text-center mx-8 mt-3 leading-5">
                  Keep receipt flat and well-lit for best results
                </UIText>

                <Button
                  label="Capture Receipt"
                  variant="default"
                  className="mx-4 mt-4"
                  onPress={() => setScanned(true)}
                />
              </>
            )}

            {/* Result card — shown immediately after scan */}
            {scanned && (
              <Card className="mx-4 mt-4">
                <View className="flex-row items-center gap-2 mb-1">
                  <CheckCircle2 size={14} color={isDark ? '#22c55e' : '#16a34a'} />
                  <UIText size="sm" variant="heading">Receipt detected</UIText>
                </View>

                <Separator className="my-3" />

                {RECEIPT_ROWS.map((row) => (
                  <View key={row.label} className="flex-row justify-between py-1.5">
                    <UIText size="xs" variant="muted">{row.label}</UIText>
                    <UIText
                      size="sm"
                      variant={'highlight' in row && row.highlight ? 'unstyled' : 'default'}
                      className={'highlight' in row && row.highlight ? 'font-mono text-positive dark:text-positive-dark' : ''}
                    >
                      {row.value}
                    </UIText>
                  </View>
                ))}

                <Button
                  label={saving ? "Saving..." : "Save Transaction"}
                  variant="default"
                  className="mt-4"
                  disabled={saving}
                  onPress={() => saveTransaction("Cargills Food City", "Groceries", 3680)}
                />
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
