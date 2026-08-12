import { TextInput, TextInputProps, StyleProp, TextStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface InputProps extends TextInputProps {
  /** Layout-only overrides (flex, margin) — color/border/radius are always
   * computed internally from useTheme(), so this can't reintroduce the
   * per-screen dark-mode color drift it replaces (see Chip.tsx). */
  style?: StyleProp<TextStyle>;
  /** Compact 40px variant for inline rows (e.g. an input beside a button). */
  size?: 'default' | 'sm';
}

// Single source of truth for the app's text input styling — every screen
// used to hand-roll this same height/border/radius/color block per file
// (8+ copies), each independently recomputing colors from isDark. Any drift
// between copies was invisible until it wasn't (see the chat bubble bug).
export function Input({ style, size = 'default', ...props }: InputProps) {
  const { isDark } = useTheme();

  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const inputBg = isDark ? '#09090b' : '#ffffff';
  const inputText = isDark ? '#fafafa' : '#09090b';
  const placeholderClr = isDark ? '#71717a' : '#a1a1aa';

  return (
    <TextInput
      placeholderTextColor={placeholderClr}
      style={[
        {
          height: size === 'sm' ? 40 : 44,
          borderWidth: 1,
          borderColor,
          borderRadius: 8,
          paddingHorizontal: 12,
          backgroundColor: inputBg,
          color: inputText,
          fontSize: size === 'sm' ? 14 : 15,
          fontFamily: 'DMSans_400Regular',
        },
        style,
      ]}
      {...props}
    />
  );
}
