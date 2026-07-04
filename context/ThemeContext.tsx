import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  isDark: false,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    AsyncStorage.getItem('app_theme').then(saved => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeState(saved);
      }
    });
  }, []);

  // Stable reference — won't cause context consumers to re-render on unrelated state changes
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    AsyncStorage.setItem('app_theme', t);
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');

  // Only a new object when theme or isDark actually changes
  const value = useMemo<ThemeContextType>(
    () => ({ theme, isDark, setTheme }),
    [theme, isDark, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
