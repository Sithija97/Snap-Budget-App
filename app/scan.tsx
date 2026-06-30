import { useState } from "react";
import { View, ScrollView, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, ScanLine, CheckCircle2 } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";

const RECEIPT_ROWS = [
  { label: "Merchant",  value: "Cargills Food City" },
  { label: "Category",  value: "Groceries" },
  { label: "Date",      value: "19 May 2026" },
  { label: "Total",     value: "Rs 3,680", highlight: true },
] as const;

const CORNER_POSITIONS = [
  { top: 12, left: 12,   borderTopWidth: 2,    borderLeftWidth: 2 },
  { top: 12, right: 12,  borderTopWidth: 2,    borderRightWidth: 2 },
  { bottom: 12, left: 12,  borderBottomWidth: 2, borderLeftWidth: 2 },
  { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2 },
] as const;

export default function ScanScreen() {
  const { isDark } = useTheme();
  const [scanned, setScanned] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const mutedBg     = isDark ? '#18181b' : '#f4f4f5';
  const iconColor   = isDark ? '#a1a1aa' : '#71717a';

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
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
            <UIText size="sm" variant="muted">Manual</UIText>
          </TouchableOpacity>
        </View>

        {!showManual ? (
          <>
            {/* Viewfinder */}
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

            {!scanned && (
              <Button
                label="Capture Receipt"
                variant="default"
                className="mx-4 mt-4"
                onPress={() => setScanned(true)}
              />
            )}
          </>
        ) : (
          /* Manual entry */
          <Card className="mx-4 mt-4 gap-3">
            <UIText size="xs" variant="label">Amount</UIText>
            <View
              style={{ height: 44, borderWidth: 1, borderColor, borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: isDark ? '#09090b' : '#ffffff' }}
            >
              <UIText size="sm" variant="muted">Rs 0</UIText>
            </View>
            <UIText size="xs" variant="label" className="mt-2">Merchant</UIText>
            <View
              style={{ height: 44, borderWidth: 1, borderColor, borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: isDark ? '#09090b' : '#ffffff' }}
            >
              <UIText size="sm" variant="muted">Merchant name</UIText>
            </View>
            <UIText size="xs" variant="label" className="mt-2">Category</UIText>
            <View
              style={{ height: 44, borderWidth: 1, borderColor, borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: isDark ? '#09090b' : '#ffffff' }}
            >
              <UIText size="sm" variant="muted">Select category</UIText>
            </View>
            <Button label="Save Transaction" variant="default" className="mt-2" />
          </Card>
        )}

        {/* Result card */}
        {scanned && !showManual && (
          <Card className="mx-4 mt-4">
            <View className="flex-row items-center gap-2 mb-1">
              <CheckCircle2 size={14} color="#16a34a" />
              <UIText size="sm" variant="heading">Receipt detected</UIText>
            </View>

            <Separator className="my-3" />

            {RECEIPT_ROWS.map((row) => (
              <View key={row.label} className="flex-row justify-between py-1.5">
                <UIText size="xs" variant="muted">{row.label}</UIText>
                <UIText
                  size="sm"
                  className={row.highlight ? 'font-mono text-positive dark:text-positive-dark' : ''}
                >
                  {row.value}
                </UIText>
              </View>
            ))}

            <Button
              label="Save Transaction"
              variant="default"
              className="mt-4"
              onPress={() =>
                Alert.alert("Saved!", "Transaction saved successfully.", [
                  { text: "OK", onPress: () => router.back() },
                ])
              }
            />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
