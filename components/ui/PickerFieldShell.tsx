import { ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { UIText } from './UIText';
import { useTheme } from '@/context/ThemeContext';
import { AnimatedPressable } from './AnimatedPressable';

interface PickerFieldShellProps {
  /** Formatted value shown as the field's text (native) or the web <input>'s displayed value comes from `webInputProps` instead). */
  displayText: string;
  disabled: boolean;
  onPress: () => void;
  icon: ReactNode;
  /** Web has no native picker — rendered as a plain HTML input instead of the tap-to-open button. */
  webInputProps: {
    type: 'date' | 'time';
    value: string;
    onChange: (value: string) => void;
    /** HTML `max` attribute — e.g. an ISO date string to block future dates. */
    max?: string;
  };
}

// Shared shell for "tap to open the platform's native picker" fields —
// DateField and TimeField are otherwise identical (box styling, theme
// colors, disabled opacity, the web <input> fallback) and differ only in
// which DateTimePicker mode they open and how they format/parse the value.
// Extracted here so a future style tweak (box height, colors, disabled
// treatment) only needs to be made once.
export function PickerFieldShell({ displayText, disabled, onPress, icon, webInputProps }: PickerFieldShellProps) {
  const { isDark } = useTheme();

  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const inputBg = isDark ? '#09090b' : '#ffffff';
  const inputText = isDark ? '#fafafa' : '#09090b';

  if (Platform.OS === 'web') {
    return (
      <View
        style={{
          height: 44,
          borderWidth: 1,
          borderColor,
          borderRadius: 8,
          paddingHorizontal: 12,
          backgroundColor: inputBg,
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <input
          type={webInputProps.type}
          value={webInputProps.value}
          max={webInputProps.max}
          disabled={disabled}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => e.target.value && webInputProps.onChange(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: inputText,
            fontSize: 15,
            fontFamily: 'inherit',
            width: '100%',
            height: '100%',
          }}
        />
      </View>
    );
  }

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      pressScale={0.98}
      contentStyle={{
        height: 44,
        borderWidth: 1,
        borderColor,
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: inputBg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <UIText size="sm" variant="unstyled" style={{ color: inputText }}>
        {displayText}
      </UIText>
      {icon}
    </AnimatedPressable>
  );
}

export function usePickerFieldIconColor(): string {
  const { isDark } = useTheme();
  return isDark ? '#a1a1aa' : '#71717a';
}
