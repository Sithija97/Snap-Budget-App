import { useState } from 'react';
import { Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { formatFullDate, toISODate } from '@/utils/dates';
import { PickerFieldShell, usePickerFieldIconColor } from './PickerFieldShell';

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
// HTML date input (see PickerFieldShell).
export function DateField({ value, onChange, disabled = false, maxDate }: DateFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const iconColor = usePickerFieldIconColor();

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

  return (
    <>
      <PickerFieldShell
        displayText={formatFullDate(value)}
        disabled={disabled}
        onPress={() => setShowPicker(true)}
        icon={<Calendar size={16} color={iconColor} />}
        webInputProps={{
          type: 'date',
          value,
          onChange: (v) => onChange(v),
          max: maxDate ? toISODate(maxDate) : undefined,
        }}
      />

      {Platform.OS !== 'web' && showPicker && (
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
