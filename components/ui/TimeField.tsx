import { useState } from 'react';
import { Platform, View } from 'react-native';
import { ChevronUp, ChevronDown, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { BRAND_BLUE } from '@/constants/colors';
import { UIText } from './UIText';
import { AnimatedPressable } from './AnimatedPressable';
import { PickerFieldShell, usePickerFieldIconColor } from './PickerFieldShell';
import { PickerModal } from './PickerModal';

interface TimeFieldProps {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  disabled?: boolean;
}

function formatTime(hour: number, minute: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour < 12 ? 'AM' : 'PM';
  return `${h12}:${String(minute).padStart(2, '0')} ${period}`;
}

function wrap(n: number, mod: number): number {
  return ((n % mod) + mod) % mod;
}

// Segmented up/down stepper for hour, minute, and AM/PM — used inside
// TimeField's PickerModal. No scrolling/wheel widget: each unit is a static
// number with a chevron above and below it, tap to increment/decrement.
function Stepper({
  value,
  label,
  onIncrement,
  onDecrement,
  color,
}: {
  value: string;
  label: string;
  onIncrement: () => void;
  onDecrement: () => void;
  color: string;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <AnimatedPressable onPress={onIncrement} pressScale={0.9} contentStyle={{ padding: 8 }}>
        <ChevronUp size={20} color={BRAND_BLUE} />
      </AnimatedPressable>
      <View style={{ minWidth: 64, alignItems: 'center', paddingVertical: 6 }}>
        <UIText size="2xl" variant="unstyled" className="font-semibold" style={{ color, fontVariant: ['tabular-nums'] }}>
          {value}
        </UIText>
      </View>
      <AnimatedPressable onPress={onDecrement} pressScale={0.9} contentStyle={{ padding: 8 }}>
        <ChevronDown size={20} color={BRAND_BLUE} />
      </AnimatedPressable>
      <UIText size="xs" variant="muted">{label}</UIText>
    </View>
  );
}

// Time-of-day counterpart to DateField — same tap-to-open modal pattern, but
// a custom hour/minute/AM-PM stepper instead of a scrolling wheel (the app's
// previous native-picker fallback was a wheel and the user asked for
// something else). No native dialog involved, so it's fully themeable and
// unaffected by OEM skins that override native picker colors. Used for the
// morning/evening finance-reminder times in Settings.
export function TimeField({ hour, minute, onChange, disabled = false }: TimeFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [draftHour, setDraftHour] = useState(hour);
  const [draftMinute, setDraftMinute] = useState(minute);
  const iconColor = usePickerFieldIconColor();
  const { foreground: textColor, border: dividerColor } = useThemeColors();

  const openPicker = () => {
    setDraftHour(hour);
    setDraftMinute(minute);
    setShowPicker(true);
  };

  const confirm = () => {
    onChange(draftHour, draftMinute);
    setShowPicker(false);
  };

  const draftH12 = draftHour % 12 === 0 ? 12 : draftHour % 12;
  const isPM = draftHour >= 12;

  return (
    <>
      <PickerFieldShell
        displayText={formatTime(hour, minute)}
        disabled={disabled}
        onPress={openPicker}
        icon={<Clock size={16} color={iconColor} />}
        webInputProps={{
          type: 'time',
          value: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
          onChange: (v) => {
            const [h, m] = v.split(':').map(Number);
            onChange(h, m);
          },
        }}
      />

      {Platform.OS !== 'web' && (
        <PickerModal visible={showPicker} title="Select time" onClose={() => setShowPicker(false)} onConfirm={confirm}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
            <Stepper
              value={String(draftH12)}
              label="Hour"
              color={textColor}
              onIncrement={() => setDraftHour((h) => wrap(h + 1, 24))}
              onDecrement={() => setDraftHour((h) => wrap(h - 1, 24))}
            />
            <UIText size="2xl" variant="unstyled" className="font-semibold" style={{ color: textColor }}>:</UIText>
            <Stepper
              value={String(draftMinute).padStart(2, '0')}
              label="Minute"
              color={textColor}
              onIncrement={() => setDraftMinute((m) => wrap(m + 1, 60))}
              onDecrement={() => setDraftMinute((m) => wrap(m - 1, 60))}
            />
            <View style={{ width: 1, height: 56, backgroundColor: dividerColor, marginHorizontal: 4 }} />
            <View style={{ gap: 8 }}>
              {(['AM', 'PM'] as const).map((period) => {
                const active = (period === 'PM') === isPM;
                return (
                  <AnimatedPressable
                    key={period}
                    onPress={() => setDraftHour((h) => (period === 'PM' ? wrap(h, 12) + 12 : wrap(h, 12)))}
                    pressScale={0.95}
                    contentStyle={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 8,
                      backgroundColor: active ? BRAND_BLUE : 'transparent',
                      borderWidth: 1,
                      borderColor: active ? BRAND_BLUE : dividerColor,
                    }}
                  >
                    <UIText size="sm" variant="unstyled" className="font-semibold" style={{ color: active ? '#ffffff' : textColor }}>
                      {period}
                    </UIText>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>
        </PickerModal>
      )}
    </>
  );
}
