import { useState } from 'react';
import { Platform } from 'react-native';
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import { Calendar } from 'lucide-react-native';
import { formatFullDate, toISODate } from '@/utils/dates';
import { useTheme } from '@/context/ThemeContext';
import { BRAND_BLUE } from '@/constants/colors';
import { PickerFieldShell, usePickerFieldIconColor } from './PickerFieldShell';
import { PickerModal } from './PickerModal';

interface DateFieldProps {
  /** ISO "YYYY-MM-DD" */
  value: string;
  onChange: (isoDate: string) => void;
  disabled?: boolean;
  /** Dates after this ISO string are unselectable — defaults to no upper bound */
  maxDate?: Date;
}

// Single source of truth for "pick a date" across manual entry, editing, and
// the scan review screen. Uses react-native-ui-datepicker — a pure-JS,
// custom-drawn calendar grid with no native dialog involved at all — instead
// of the OS's own date-picker dialog. Several OEM skins (confirmed on
// Samsung's One UI) replace the native dialog with their own implementation
// that ignores the app's theme entirely and always renders using the
// device's system accent color; a fully custom-drawn picker sidesteps that
// limitation completely since there's no OS dialog to be overridden.
// react-native-web has no native picker either, so web falls back to a plain
// HTML date input (see PickerFieldShell).
export function DateField({ value, onChange, disabled = false, maxDate }: DateFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [draft, setDraft] = useState<Date>(() => (value ? new Date(`${value}T00:00:00`) : new Date()));
  const iconColor = usePickerFieldIconColor();
  const { isDark } = useTheme();
  const defaultStyles = useDefaultStyles(isDark ? 'dark' : 'light');

  const openPicker = () => {
    setDraft(value ? new Date(`${value}T00:00:00`) : new Date());
    setShowPicker(true);
  };

  const confirm = () => {
    onChange(toISODate(draft));
    setShowPicker(false);
  };

  return (
    <>
      <PickerFieldShell
        displayText={formatFullDate(value)}
        disabled={disabled}
        onPress={openPicker}
        icon={<Calendar size={16} color={iconColor} />}
        webInputProps={{
          type: 'date',
          value,
          onChange: (v) => onChange(v),
          max: maxDate ? toISODate(maxDate) : undefined,
        }}
      />

      {Platform.OS !== 'web' && (
        <PickerModal visible={showPicker} title="Select date" onClose={() => setShowPicker(false)} onConfirm={confirm}>
          <DateTimePicker
            mode="single"
            date={draft}
            onChange={({ date }) => date && setDraft(dayjs(date).toDate())}
            maxDate={maxDate}
            styles={{
              ...defaultStyles,
              selected: { backgroundColor: BRAND_BLUE, borderRadius: 10 },
              selected_label: { color: '#ffffff' },
              today: { borderColor: BRAND_BLUE, borderWidth: 1, borderRadius: 10 },
              today_label: { color: BRAND_BLUE },
            }}
          />
        </PickerModal>
      )}
    </>
  );
}
