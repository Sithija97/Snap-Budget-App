// Brand blue accent color, shared by light and dark mode.
export const BRAND_BLUE = "#3b82f6";

// Intentionally identical to BRAND_BLUE right now — kept as a separate
// constant (and brandBlue() keeps its isDark param) so a future dark-mode-
// specific tuning pass has a place to land without touching every call site
// (Button, Chip, Input, tab bar, chart ramp, etc.) again.
export const BRAND_BLUE_DARK = "#3b82f6";

export function brandBlue(isDark: boolean): string {
  return isDark ? BRAND_BLUE_DARK : BRAND_BLUE;
}
