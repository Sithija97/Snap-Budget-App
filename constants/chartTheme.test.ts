import { describe, it, expect } from "vitest";
import { barRampColor, budgetFillColor, chartTheme, BAR_RAMP_LIGHT, BAR_RAMP_DARK } from "./chartTheme";
import { BRAND_BLUE, BRAND_BLUE_DARK } from "./colors";

describe("chartTheme", () => {
  it("resolves light and dark track/axis colors distinctly", () => {
    expect(chartTheme(false)).toEqual({ track: "#e4e4e7", axisText: "#71717a" });
    expect(chartTheme(true)).toEqual({ track: "#27272a", axisText: "#a1a1aa" });
  });
});

describe("barRampColor", () => {
  it("returns the full-strength brand color for the last bar in light mode", () => {
    expect(barRampColor(false, 4, 5)).toBe(BRAND_BLUE);
  });

  it("returns the full-strength brand color for the last bar in dark mode", () => {
    expect(barRampColor(true, 4, 5)).toBe(BRAND_BLUE_DARK);
  });

  it("returns the faintest tint for the first (oldest) bar", () => {
    expect(barRampColor(false, 0, 5)).toBe(BAR_RAMP_LIGHT[0]);
    expect(barRampColor(true, 0, 5)).toBe(BAR_RAMP_DARK[0]);
  });

  it("never returns the same color for every bar across a typical 6-bar series", () => {
    const colors = Array.from({ length: 6 }, (_, i) => barRampColor(false, i, 6));
    expect(new Set(colors).size).toBeGreaterThan(1);
  });

  it("falls back to full brand color when there's only one data point", () => {
    expect(barRampColor(false, 0, 1)).toBe(BRAND_BLUE);
    expect(barRampColor(true, 0, 1)).toBe(BRAND_BLUE_DARK);
  });
});

describe("budgetFillColor", () => {
  it("is brand blue while comfortably under budget", () => {
    expect(budgetFillColor(0, false)).toBe(BRAND_BLUE);
    expect(budgetFillColor(50, false)).toBe(BRAND_BLUE);
    expect(budgetFillColor(79, false)).toBe(BRAND_BLUE);
  });

  it("escalates to amber at the 80% near-limit threshold", () => {
    expect(budgetFillColor(80, false)).toBe("#d97706");
    expect(budgetFillColor(100, false)).toBe("#d97706");
  });

  it("escalates to red once over 100%", () => {
    expect(budgetFillColor(101, false)).toBe("#ef4444");
    expect(budgetFillColor(250, false)).toBe("#ef4444");
  });

  it("uses dark-mode-tuned variants for each threshold", () => {
    expect(budgetFillColor(50, true)).toBe(BRAND_BLUE_DARK);
    expect(budgetFillColor(90, true)).toBe("#fbbf24");
    expect(budgetFillColor(120, true)).toBe("#f87171");
  });
});
