import { Moon, Sun } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { IconButton } from './IconButton';

export function ThemeToggle() {
  const { isDark, setTheme } = useTheme();
  return (
    <IconButton onPress={() => setTheme(isDark ? 'light' : 'dark')}>
      {isDark
        ? <Sun size={16} color="#fafafa" />
        : <Moon size={16} color="#09090b" />}
    </IconButton>
  );
}
