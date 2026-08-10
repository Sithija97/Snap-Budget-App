import { useState } from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { UIText } from './UIText';
import { useTheme } from '@/context/ThemeContext';
import { formatFullDate, toISODate } from '@/utils/dates';

interface DateFieldProps {
  /** ISO "YYYY-MM-DD" */
  value: string;
  onChange: (isoDate: string) => void;
  disabled?: boolean;
  /** Dates after this ISO string are unselectable — defaults to no upper bound */
  maxDate?: Date;
}

// Single source of truth for "pick a date" across manual entry, editing, and
// the scan review screen — matches the inputStyle-height/border look every
// other field in those screens uses, but opens the platform's native picker
// instead of a raw text input (which is how the scan-review date used to
// work, and was the one field in the app still hand-typed as "YYYY-MM-DD").
// react-native-web has no native picker at all, so web falls back to a plain
// HTML date input rendered via View's web-only `<input>` passthrough.
export function DateField({ value, onChange, disabled = false, maxDate }: DateFieldProps) {
  const { isDark } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const inputBg = isDark ? '#09090b' : '#ffffff';
  const inputText = isDark ? '#fafafa' : '#09090b';
  const iconColor = isDark ? '#a1a1aa' : '#71717a';

  const dateValue = value ? new Date(`${value}T00:00:00`) : new Date();

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    // Android's dialog fires "dismissed" with no date on Cancel; iOS's
    // inline spinner has no separate confirm step, so closing on every
    // "set" keeps both platforms to a single tap-to-open, tap-to-pick flow.
    setShowPicker(Platform.OS === 'ios');
    if (event.type === 'set' && selected) {
      onChange(toISODate(selected));
    }
  };

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
          type="date"
          value={value}
          disabled={disabled}
          max={maxDate ? toISODate(maxDate) : undefined}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => e.target.value && onChange(e.target.value)}
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
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled}
        onPress={() => setShowPicker(true)}
        style={{
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
          {formatFullDate(value)}
        </UIText>
        <Calendar size={16} color={iconColor} />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={maxDate}
          onChange={handleChange}
        />
      )}
    </>
  );
}
