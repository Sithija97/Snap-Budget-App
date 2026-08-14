// Brand blue sampled from assets/icon.png — the app's single accent color.
export const BRAND_BLUE = "#1073F5";

// Brand blue lightened for dark surfaces — #1073F5 at full saturation reads
// muddy against near-black cards, so dark mode uses this instead everywhere
// the light-mode UI would reach for BRAND_BLUE (charts, selection states).
export const BRAND_BLUE_DARK = "#3b8bff";

export function brandBlue(isDark: boolean): string {
  return isDark ? BRAND_BLUE_DARK : BRAND_BLUE;
}
