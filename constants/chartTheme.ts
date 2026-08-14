import { BRAND_BLUE, BRAND_BLUE_DARK, brandBlue } from "./colors";

// Single source of truth for chart/progress colors — bars, gauges, and
// progress fills all read from here instead of each screen re-deriving its
// own isDark ? black : white pair (the bug that made every chart render
// monochrome). Light/dark are resolved pairs, not raw hex, so callers never
// branch on isDark themselves.

interface ChartThemeShape {
  /** Track (unfilled) background for bars/progress rails. */
  track: string;
  /** Muted axis/caption text sitting next to a chart. */
  axisText: string;
}

export const CHART_THEME: Record<"light" | "dark", ChartThemeShape> = {
  light: { track: "#e4e4e7", axisText: "#71717a" },
  dark:  { track: "#27272a", axisText: "#a1a1aa" },
};

// Recency ramp for the monthly/weekly spend bar chart — older bars are a
// faint tint of brand blue, the most recent bar is full-strength, so the
// chart carries a color story instead of "one black bar among gray ones."
export const BAR_RAMP_LIGHT = ["#cfe1fd", "#a8c9fb", "#7fb0f9", "#4894f7", BRAND_BLUE];
export const BAR_RAMP_DARK  = ["#173456", "#204874", "#2c609a", "#3878c4", BRAND_BLUE_DARK];

export function barRampColor(isDark: boolean, index: number, length: number): string {
  const ramp = isDark ? BAR_RAMP_DARK : BAR_RAMP_LIGHT;
  if (length <= 1) return ramp[ramp.length - 1];
  const step = (ramp.length - 1) / (length - 1);
  return ramp[Math.round(index * step)];
}

// Budget progress fill: brand blue while comfortably under budget, escalating
// to the existing semantic amber/red once a category is near or over its
// limit. Same thresholds the app already used, now paired with a real accent
// instead of black for the "fine" state.
export function budgetFillColor(pct: number, isDark: boolean): string {
  if (pct > 100) return isDark ? "#f87171" : "#ef4444";
  if (pct >= 80) return isDark ? "#fbbf24" : "#d97706";
  return brandBlue(isDark);
}

export function chartTheme(isDark: boolean): ChartThemeShape {
  return isDark ? CHART_THEME.dark : CHART_THEME.light;
}
