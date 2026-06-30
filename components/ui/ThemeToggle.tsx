import { TouchableOpacity } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle() {
  const { isDark, setTheme } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-9 h-9 items-center justify-center rounded-lg border border-border dark:border-border-dark"
      activeOpacity={0.7}
    >
      {isDark
        ? <Sun size={16} color="#fafafa" />
        : <Moon size={16} color="#09090b" />}
    </TouchableOpacity>
  );
}
