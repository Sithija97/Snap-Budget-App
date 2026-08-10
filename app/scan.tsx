import { useState } from "react";
import { View, ScrollView, Alert, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { ChevronLeft, ScanLine, CheckCircle2 } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useWalletStore } from "@/store/useWalletStore";
import { api } from "@/lib/api";
import { TxType, CategoryType } from "@/types";
import { parseAmount } from "@/utils/format";
import { todayISO, currentMonth } from "@/utils/dates";
import { UIText } from "@/components/ui/UIText";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { DateField } from "@/components/ui/DateField";

const nowTime = () =>
  new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

// Photos straight off a phone camera are routinely 3-8MB; resizing the
// longest edge down keeps the base64 upload payload (and Gemini's token
// usage) reasonable without visibly hurting OCR accuracy.
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.6;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface ScanResult {
  merchant: string;
  amount: number;
  date: string;
  categoryName: string | null;
  receiptKey: string;
}

const CORNER_POSITIONS = [
  { top: 12, left: 12,    borderTopWidth: 2,    borderLeftWidth: 2  },
  { top: 12, right: 12,   borderTopWidth: 2,    borderRightWidth: 2 },
  { bottom: 12, left: 12,  borderBottomWidth: 2, borderLeftWidth: 2  },
  { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2 },
] as const;

type Stage = "idle" | "analyzing" | "review";

export default function ScanScreen() {
  const { isDark } = useTheme();
  // Lets other screens (e.g. Home's Income/Total spent tap targets) deep-link
  // straight into "add a transaction of this type" instead of landing on the
  // camera view and requiring an extra tap into Manual mode first.
  const params = useLocalSearchParams<{ manual?: string; type?: string }>();
  const [stage, setStage] = useState<Stage>("idle");
  const [showManual, setShowManual] = useState(params.manual === "true");
  const [saving, setSaving] = useState(false);

  // Manual entry state — this is the only place a transaction's type can be
  // chosen. Scanned receipts are always expenses (you don't photograph a
  // receipt for salary); income can only ever be logged here.
  const [txType, setTxType]     = useState<TxType>(params.type === "income" ? TxType.Income : TxType.Expense);
  const [amount, setAmount]     = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate]         = useState(todayISO());

  // Scan review state — pre-filled from Gemini's extraction, editable before save
  const [reviewMerchant, setReviewMerchant] = useState('');
  const [reviewAmount, setReviewAmount]     = useState('');
  const [reviewDate, setReviewDate]         = useState('');
  const [reviewCategory, setReviewCategory] = useState('');
  const [receiptKey, setReceiptKey]         = useState<string | null>(null);

  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const wallets = useWalletStore((s) => s.wallets);

  const defaultWalletId =
    wallets.find((w) => w.isDefault)?.id ?? wallets[0]?.id ?? null;

  // Matches an existing category of the given type by name, or creates one
  const resolveCategoryId = async (name: string, categoryType: CategoryType): Promise<string> => {
    const trimmed = name.trim();
    const { categories, addCategory } = useCategoryStore.getState();
    const existing = categories.find(
      (c) => c.type === categoryType && c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing.id;
    const created = await addCategory({
      name: trimmed,
      type: categoryType,
      icon: categoryType === "income" ? "CircleArrowDown" : "ShoppingCart",
      parentId: null,
    });
    return created.id;
  };

  const canSaveManual =
    parseAmount(amount) > 0 &&
    merchant.trim().length > 0 &&
    category.trim().length > 0 &&
    DATE_RE.test(date) &&
    !saving;

  const canSaveReview =
    parseAmount(reviewAmount) > 0 &&
    reviewMerchant.trim().length > 0 &&
    reviewCategory.trim().length > 0 &&
    DATE_RE.test(reviewDate) &&
    !saving;

  const saveTransaction = async (
    m: string,
    catName: string,
    amt: number,
    date: string,
    key: string | null,
    type: TxType
  ) => {
    setSaving(true);
    try {
      const categoryId = await resolveCategoryId(catName, type === TxType.Income ? "income" : "expense");
      await addTransaction({
        merchant: m,
        categoryId,
        walletId: defaultWalletId,
        txType: type,
        amount: amt,
        date,
        time: nowTime(),
        receiptKey: key,
      });
      Alert.alert("Saved!", "Transaction saved successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Couldn't save transaction", e?.message ?? "Please try again.");
      setSaving(false);
    }
  };

  // Receipts routinely have a printed date from days or weeks ago — Home and
  // Budget totals are scoped to the current month, so an older receipt is
  // correctly excluded from "this month's" spending. That's easy to mistake
  // for a bug (the transaction still shows in the full Transactions list),
  // and it's also the one signal available that OCR may have misread the
  // date — so confirm rather than save silently.
  const handleSaveReview = () => {
    if (!reviewDate.startsWith(currentMonth())) {
      Alert.alert(
        "Not this month",
        `This receipt is dated ${reviewDate}, so it won't count toward this month's totals — only toward its own month. Double-check the date is correct if that's unexpected.`,
        [
          { text: "Fix date", style: "cancel" },
          {
            text: "Save anyway",
            onPress: () =>
              saveTransaction(
                reviewMerchant.trim(),
                reviewCategory,
                parseAmount(reviewAmount),
                reviewDate,
                receiptKey,
                TxType.Expense
              ),
          },
        ]
      );
      return;
    }
    saveTransaction(
      reviewMerchant.trim(),
      reviewCategory,
      parseAmount(reviewAmount),
      reviewDate,
      receiptKey,
      TxType.Expense
    );
  };

  const resetScan = () => {
    setStage("idle");
    setReviewMerchant('');
    setReviewAmount('');
    setReviewDate('');
    setReviewCategory('');
    setReceiptKey(null);
  };

  const handleCapture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert(
        "Camera access needed",
        "Enable camera access for SnapBudget in your device Settings to scan receipts."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1 });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setStage("analyzing");

    try {
      let context = ImageManipulator.manipulate(asset.uri);
      if (asset.width > MAX_EDGE) {
        context = context.resize({ width: MAX_EDGE });
      }
      const rendered = await context.renderAsync();
      const compressed = await rendered.saveAsync({
        compress: JPEG_QUALITY,
        format: SaveFormat.JPEG,
        base64: true,
      });
      if (!compressed.base64) throw new Error("Couldn't process the photo");

      const extracted = await api.post<ScanResult>("/api/scan", { imageBase64: compressed.base64 });

      setReviewMerchant(extracted.merchant);
      setReviewAmount(String(extracted.amount));
      setReviewDate(DATE_RE.test(extracted.date) ? extracted.date : todayISO());
      setReviewCategory(extracted.categoryName ?? "");
      setReceiptKey(extracted.receiptKey);
      setStage("review");
    } catch (e: any) {
      Alert.alert(
        "Couldn't read that receipt",
        e?.message ?? "Try again, or switch to manual entry."
      );
      setStage("idle");
    }
  };

  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  // Viewfinder surface: card-level, not muted — the old #f4f4f5 is nearly
  // invisible against the slate-100 page background
  const mutedBg     = isDark ? '#18181b' : '#ffffff';
  const iconColor   = isDark ? '#a1a1aa' : '#71717a';
  const inputText   = isDark ? '#fafafa' : '#09090b';
  const inputBg     = isDark ? '#09090b' : '#ffffff';
  const accentFill  = isDark ? '#fafafa' : '#18181b';

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
          <IconButton onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={20} color={iconColor} />
          </IconButton>
          <UIText size="base" variant="heading" className="flex-1 text-center">Scan receipt</UIText>
          <TouchableOpacity
            onPress={() => { resetScan(); setShowManual(!showManual); }}
            activeOpacity={0.7}
          >
            <UIText size="sm" variant="muted">{showManual ? 'Scan' : 'Manual'}</UIText>
          </TouchableOpacity>
        </View>

        {showManual ? (
          /* Manual entry — real TextInputs */
          <Card className="mx-4 mt-4 gap-3">
            <UIText size="xs" variant="label">Type</UIText>
            <View className="flex-row gap-2">
              <Chip label="Expense" selected={txType === TxType.Expense} onPress={() => setTxType(TxType.Expense)} />
              <Chip label="Income" selected={txType === TxType.Income} onPress={() => setTxType(TxType.Income)} />
            </View>

            <UIText size="xs" variant="label" className="mt-2">Amount</UIText>
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
              placeholder={txType === TxType.Income ? "e.g. Salary" : "e.g. Groceries"}
              placeholderTextColor={iconColor}
              value={category}
              onChangeText={setCategory}
              autoCapitalize="words"
              returnKeyType="done"
            />

            <UIText size="xs" variant="label" className="mt-2">Date</UIText>
            <DateField value={date} onChange={setDate} maxDate={new Date()} />

            <Button
              label={saving ? "Saving..." : "Save Transaction"}
              variant="default"
              className="mt-2"
              disabled={!canSaveManual}
              onPress={() =>
                saveTransaction(merchant.trim(), category, parseAmount(amount), date, null, txType)
              }
            />
          </Card>
        ) : (
          <>
            {/* Viewfinder — shown before capture */}
            {stage === "idle" && (
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
                  onPress={handleCapture}
                />
              </>
            )}

            {/* Analyzing — awaiting the OCR call */}
            {stage === "analyzing" && (
              <View className="items-center py-16 gap-3">
                <ActivityIndicator color={accentFill} />
                <UIText size="sm" variant="muted">Analyzing receipt...</UIText>
              </View>
            )}

            {/* Review card — editable fields pre-filled from the scan */}
            {stage === "review" && (
              <Card className="mx-4 mt-4 gap-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <CheckCircle2 size={14} color={isDark ? '#22c55e' : '#16a34a'} />
                  <UIText size="sm" variant="heading">Receipt detected</UIText>
                </View>

                <Separator className="my-1" />

                <UIText size="xs" variant="label">Amount</UIText>
                <TextInput
                  style={inputStyle}
                  placeholderTextColor={iconColor}
                  value={reviewAmount}
                  onChangeText={setReviewAmount}
                  keyboardType="numeric"
                  returnKeyType="next"
                />

                <UIText size="xs" variant="label" className="mt-2">Merchant</UIText>
                <TextInput
                  style={inputStyle}
                  placeholderTextColor={iconColor}
                  value={reviewMerchant}
                  onChangeText={setReviewMerchant}
                  autoCapitalize="words"
                  returnKeyType="next"
                />

                <UIText size="xs" variant="label" className="mt-2">Date</UIText>
                <DateField value={reviewDate} onChange={setReviewDate} />

                <UIText size="xs" variant="label" className="mt-2">Category</UIText>
                <TextInput
                  style={inputStyle}
                  placeholder="e.g. Groceries"
                  placeholderTextColor={iconColor}
                  value={reviewCategory}
                  onChangeText={setReviewCategory}
                  autoCapitalize="words"
                  returnKeyType="done"
                />

                <Button
                  label={saving ? "Saving..." : "Save Transaction"}
                  variant="default"
                  className="mt-2"
                  disabled={!canSaveReview}
                  onPress={handleSaveReview}
                />

                <TouchableOpacity onPress={resetScan} activeOpacity={0.7} disabled={saving}>
                  <UIText size="sm" variant="muted" className="text-center py-1">
                    Retake photo
                  </UIText>
                </TouchableOpacity>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
