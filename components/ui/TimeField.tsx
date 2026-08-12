import { useState } from 'react';
import { Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Clock } from 'lucide-react-native';
import { PickerFieldShell, usePickerFieldIconColor } from './PickerFieldShell';

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

// Time-of-day counterpart to DateField — same tap-to-open-native-picker
// pattern, hour/minute only (no date component). Used for the morning/
// evening finance-reminder times in Settings.
export function TimeField({ hour, minute, onChange, disabled = false }: TimeFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const iconColor = usePickerFieldIconColor();

  const timeValue = new Date();
  timeValue.setHours(hour, minute, 0, 0);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (event.type === 'set' && selected) {
      onChange(selected.getHours(), selected.getMinutes());
    }
  };

  return (
    <>
      <PickerFieldShell
        displayText={formatTime(hour, minute)}
        disabled={disabled}
        onPress={() => setShowPicker(true)}
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

      {Platform.OS !== 'web' && showPicker && (
        <DateTimePicker
          value={timeValue}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </>
  );
}
