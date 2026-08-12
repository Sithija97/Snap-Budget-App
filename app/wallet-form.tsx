import { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useWalletStore } from "@/store/useWalletStore";
import { parseAmount } from "@/utils/format";
import { UIText } from "@/components/ui/UIText";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function WalletFormScreen() {
  const { isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const wallets = useWalletStore((s) => s.wallets);
  const addWallet = useWalletStore((s) => s.addWallet);
  const updateWallet = useWalletStore((s) => s.updateWallet);
  const deleteWallet = useWalletStore((s) => s.deleteWallet);

  const editing = wallets.find((w) => w.id === id);

  const [name, setName] = useState(editing?.name ?? "");
  const [balance, setBalance] = useState(
    editing && editing.balance !== null ? String(editing.balance) : ""
  );
  const [saving, setSaving] = useState(false);

  const iconColor   = isDark ? "#a1a1aa" : "#71717a";

  const canSave = name.trim().length > 0 && !saving;

  const handleSave = async () => {
    // Blank balance keeps null ("not set") — a typed 0 is a real value
    const parsedBalance = balance.trim() === "" ? null : parseAmount(balance);
    setSaving(true);
    try {
      if (editing) {
        await updateWallet(editing.id, { name: name.trim(), balance: parsedBalance });
      } else {
        await addWallet({ name: name.trim(), balance: parsedBalance, isDefault: false });
      }
      router.back();
    } catch (e: any) {
      Alert.alert("Couldn't save wallet", e?.message ?? "Please try again.");
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    if (wallets.length <= 1) {
      Alert.alert(
        "Can't delete wallet",
        "This is your only wallet. The app needs at least one wallet to track transactions."
      );
      return;
    }
    Alert.alert("Delete wallet?", `"${editing.name}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteWallet(editing.id);
            router.back();
          } catch (e: any) {
            Alert.alert("Couldn't delete wallet", e?.message ?? "Please try again.");
          }
        },
      },
    ]);
  };

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
          <UIText size="base" variant="heading" className="flex-1 text-center">
            {editing ? "Edit wallet" : "New wallet"}
          </UIText>
          <View className="w-9" />
        </View>

        <Card className="mx-4 mt-4 gap-3">
          <UIText size="xs" variant="label">Name</UIText>
          <Input
            placeholder="e.g. Cash"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <UIText size="xs" variant="label" className="mt-2">Balance (optional)</UIText>
          <Input
            placeholder="Leave blank if not set"
            value={balance}
            onChangeText={(v) => setBalance(v.replace(/[^0-9.]/g, ""))}
            keyboardType="numeric"
            returnKeyType="done"
          />

          <Button
            label={saving ? "Saving..." : "Save Wallet"}
            variant="default"
            className="mt-2"
            disabled={!canSave}
            onPress={handleSave}
          />

          {editing && (
            <Button
              label="Delete Wallet"
              variant="destructive"
              onPress={handleDelete}
            />
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
