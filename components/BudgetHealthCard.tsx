import { View, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Gauge } from "@/components/ui/Gauge";
import { UIText } from "@/components/ui/UIText";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTheme } from "@/context/ThemeContext";
import { BRAND_BLUE } from "@/constants/colors";
import { BudgetHealth } from "@/utils/budgetHealth";

const STATUS_BADGE: Record<
  BudgetHealth["status"],
  { label: string; variant: "positive" | "warning" | "destructive" }
> = {
  good: { label: "Good", variant: "positive" },
  watch: { label: "Watch", variant: "warning" },
  over: { label: "Over budget", variant: "destructive" },
};

interface Props {
  health: BudgetHealth;
  /** True before the underlying stores' first fetch resolves */
  loading: boolean;
}

// Home's budget-health gauge card. Dumb by design: the screen derives
// `health` (utils/budgetHealth) and passes it in, same split as TransactionItem.
export function BudgetHealthCard({ health, loading }: Props) {
  const { isDark } = useTheme();
  const trackColor = isDark ? "#27272a" : "#e4e4e7";

  if (loading) {
    return (
      <Card className="items-center py-6">
        <Skeleton width={190} height={95} />
      </Card>
    );
  }

  if (!health.hasBudgets) {
    return (
      <Card>
        <UIText size="sm" variant="muted">
          Set a monthly budget to see how much is safe to spend.
        </UIText>
        <TouchableOpacity
          className="mt-2 self-start"
          activeOpacity={0.7}
          onPress={() => router.push("/budget-form")}
        >
          <UIText size="sm" variant="heading">
            Set a budget
          </UIText>
        </TouchableOpacity>
      </Card>
    );
  }

  const badge = STATUS_BADGE[health.status];

  return (
    <Card className="items-center">
      <View className="self-end">
        <Badge label={badge.label} variant={badge.variant} />
      </View>
      <Gauge
        progress={health.safePercent / 100}
        color={BRAND_BLUE}
        trackColor={trackColor}
      >
        <UIText size="2xl" className="font-mono font-medium">
          {health.safePercent}%
        </UIText>
        <UIText size="xs" variant="label" className="mt-0.5">
          Safe to spend
        </UIText>
      </Gauge>
    </Card>
  );
}
