import { useCallback, useEffect, useRef, useState } from "react";
import { View, ScrollView, Alert, AppState } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { ChevronLeft, Send } from "lucide-react-native";
import { useThemeColors } from "@/context/ThemeContext";
import { useMessagingStore } from "@/store/useMessagingStore";
import { UIText } from "@/components/ui/UIText";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

// Polls link status while the user is off in the Telegram app confirming —
// there's no push channel back into this screen, so short polling is the
// only way to reflect a linkage that just happened without a manual refresh.
const POLL_INTERVAL_MS = 3000;

export default function TelegramLinkScreen() {
  const telegram = useMessagingStore((s) => s.telegram);
  const status = useMessagingStore((s) => s.status);
  const fetchStatus = useMessagingStore((s) => s.fetchStatus);
  const requestLinkCode = useMessagingStore((s) => s.requestLinkCode);
  const unlinkTelegram = useMessagingStore((s) => s.unlinkTelegram);

  const [connecting, setConnecting] = useState(false);
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { mutedFg: iconColor } = useThemeColors();

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setWaitingForConfirmation(false);
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  // If the confirmation happened while the app was backgrounded (the normal
  // path — the user is in the Telegram app), catch up the moment they return
  // instead of waiting for the next poll tick.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active" && waitingForConfirmation) {
        fetchStatus().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [waitingForConfirmation, fetchStatus]);

  useEffect(() => {
    if (telegram.linked) stopPolling();
  }, [telegram.linked, stopPolling]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { deepLink, expiresAt } = await requestLinkCode();
      const canOpen = await Linking.canOpenURL(deepLink);
      if (!canOpen) {
        Alert.alert("Telegram isn't installed", "Install Telegram to connect your account.");
        return;
      }
      await Linking.openURL(deepLink);

      setWaitingForConfirmation(true);
      const expiresAtMs = new Date(expiresAt).getTime();
      pollRef.current = setInterval(async () => {
        if (Date.now() > expiresAtMs) {
          stopPolling();
          Alert.alert("Linking code expired", "Tap Connect to get a new one.");
          return;
        }
        try {
          await fetchStatus();
        } catch {
          // transient network hiccup — the next tick tries again
        }
      }, POLL_INTERVAL_MS);
    } catch (e: any) {
      Alert.alert("Couldn't start linking", e?.message ?? "Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect Telegram?",
      "You'll stop receiving SnapBudget messages in this chat until you reconnect.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            setDisconnecting(true);
            try {
              await unlinkTelegram();
            } catch (e: any) {
              Alert.alert("Couldn't disconnect", e?.message ?? "Please try again.");
            } finally {
              setDisconnecting(false);
            }
          },
        },
      ]
    );
  };

  const linkedAtLabel = telegram.linkedAt
    ? new Date(telegram.linkedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : null;

  const firstLoad = status === "loading" && !telegram.linked && !waitingForConfirmation;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="flex-row items-center px-4 pt-3 pb-4">
          <IconButton onPress={() => router.back()} className="mr-3" accessibilityLabel="Go back" accessibilityRole="button">
            <ChevronLeft size={20} color={iconColor} />
          </IconButton>
          <UIText size="base" variant="heading" className="flex-1 text-center">Connect Telegram</UIText>
          <View className="w-9" />
        </View>

        <Card className="mx-4 mt-4">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 rounded-full bg-muted dark:bg-muted-dark items-center justify-center">
              <Send size={18} color={iconColor} />
            </View>
            <View className="flex-1">
              <UIText size="base" variant="heading">Telegram</UIText>
              <UIText size="sm" variant="muted">
                Get recaps and overspend warnings as chat messages
              </UIText>
            </View>
          </View>

          {firstLoad ? (
            <Skeleton width="100%" height={44} />
          ) : status === "error" && !telegram.linked ? (
            <View className="items-center py-2 gap-3">
              <UIText size="sm" variant="muted">Couldn't check connection status</UIText>
              <Button label="Retry" variant="outline" onPress={() => fetchStatus().catch(() => {})} />
            </View>
          ) : telegram.linked ? (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Badge label="Connected" variant="positive" />
              </View>
              {telegram.displayName && (
                <UIText size="sm" variant="muted">Linked to {telegram.displayName}</UIText>
              )}
              {linkedAtLabel && (
                <UIText size="xs" variant="muted">Since {linkedAtLabel}</UIText>
              )}
              <Button
                label={disconnecting ? "Disconnecting..." : "Disconnect"}
                variant="destructive"
                className="mt-2"
                disabled={disconnecting}
                onPress={handleDisconnect}
              />
            </View>
          ) : waitingForConfirmation ? (
            <View className="items-center py-2 gap-3">
              <UIText size="sm" variant="muted" className="text-center">
                Waiting for confirmation — tap Start in the Telegram chat that just opened.
              </UIText>
              <Button label="Cancel" variant="outline" onPress={stopPolling} />
            </View>
          ) : (
            <Button
              label={connecting ? "Preparing..." : "Connect Telegram"}
              variant="default"
              disabled={connecting}
              onPress={handleConnect}
            />
          )}
        </Card>

        <UIText size="xs" variant="muted" className="mx-4 mt-4">
          Opens Telegram to our bot and links it to your SnapBudget account. You can disconnect any time.
        </UIText>
      </ScrollView>
    </SafeAreaView>
  );
}
