import { Platform, ViewStyle } from "react-native";
import { BRAND_BLUE, BRAND_BLUE_DARK } from "./colors";

// Soft, brand-tinted elevation for surfaces that should read as "raised"
// (hero cards, the tab-bar FAB) instead of the flat background-contrast-only
// cards used everywhere else. iOS reads the shadow* props; Android only
// respects `elevation` and renders shadows as neutral gray regardless of
// `shadowColor`, so `elevation` alone can't carry the brand tint there — kept
// deliberately subtle (low opacity/radius) so it stays "premium soft," not a
// heavy drop-shadow.
function softShadow(color: string, opacity: number, radius: number, elevation: number): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: radius / 2 },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: { elevation },
    default: {
      shadowColor: color,
      shadowOffset: { width: 0, height: radius / 2 },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
  })!;
}

// Elevation for the single hero surface per screen (Home's "Total spent"
// card, Budget's overview card) — brand-blue tinted so it feels like a lit
// surface, not just a gray drop-shadow.
export function heroShadow(isDark: boolean): ViewStyle {
  return softShadow(isDark ? BRAND_BLUE_DARK : BRAND_BLUE, isDark ? 0.35 : 0.18, 16, 8);
}

// Lighter elevation for the floating tab-bar action button.
export function fabShadow(isDark: boolean): ViewStyle {
  return softShadow(isDark ? BRAND_BLUE_DARK : BRAND_BLUE, isDark ? 0.45 : 0.3, 10, 6);
}
