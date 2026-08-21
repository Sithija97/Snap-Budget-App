import { useState } from "react";
import { TextInput, TextInputProps, StyleProp, TextStyle } from "react-native";
import { useTheme, useThemeColors } from "@/context/ThemeContext";
import { brandBlue } from "@/constants/colors";

interface InputProps extends TextInputProps {
  /** Layout-only overrides (flex, margin) — color/border/radius are always
   * computed internally from useTheme(), so this can't reintroduce the
   * per-screen dark-mode color drift it replaces (see Chip.tsx). */
  style?: StyleProp<TextStyle>;
  /** Compact 40px variant for inline rows (e.g. an input beside a button). */
  size?: "default" | "sm";
}

// Single source of truth for the app's text input styling — every screen
// used to hand-roll this same height/border/radius/color block per file
// (8+ copies), each independently recomputing colors from isDark. Any drift
// between copies was invisible until it wasn't (see the chat bubble bug).
export function Input({ style, size = "default", onFocus, onBlur, ...props }: InputProps) {
  const { isDark } = useTheme();
  const { border, foreground } = useThemeColors();
  const [focused, setFocused] = useState(false);

  // Dark background sits one step above the card it lives on (same
  // card->muted relationship as elsewhere) so fields read as distinct
  // surfaces instead of blending into the surrounding Card.
  const borderColor = focused ? brandBlue(isDark) : border;
  const inputBg = isDark ? "#242b3d" : "#ffffff";
  const inputText = foreground;
  const placeholderClr = isDark ? "#71717a" : "#a1a1aa";

  // Border grows 1px on focus (RN's border-box model eats that from the
  // fixed height/width, same as a CSS focus ring would) — horizontal padding
  // shrinks by the same amount so the content box doesn't shift sideways.
  // Height is unaffected on purpose: RN centers TextInput's single-line text
  // vertically within its box regardless of border width, so there's no
  // equivalent vertical shift to compensate for.
  const BORDER_GROWTH = 1;

  return (
    <TextInput
      placeholderTextColor={placeholderClr}
      onFocus={(e) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); onBlur?.(e); }}
      style={[
        {
          height: size === "sm" ? 40 : 44,
          borderWidth: focused ? 1 + BORDER_GROWTH : 1,
          borderColor,
          borderRadius: 8,
          paddingHorizontal: focused ? 12 - BORDER_GROWTH : 12,
          backgroundColor: inputBg,
          color: inputText,
          fontSize: size === "sm" ? 14 : 15,
          fontFamily: "Inter_400Regular",
        },
        style,
      ]}
      {...props}
    />
  );
}
