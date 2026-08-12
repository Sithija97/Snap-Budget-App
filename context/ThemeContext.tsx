import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (t: Theme) => void;
  /** False until the persisted preference has been read from AsyncStorage.
   *  Callers that render before this flips (e.g. the root layout deciding
   *  when to hide the splash screen) would otherwise show a frame in the
   *  wrong theme — system default — before snapping to the saved one. */
  hydrated: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  isDark: false,
  setTheme: () => {},
  hydrated: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // isDark is derived from NativeWind's OWN colorScheme observable (not React
  // Native's core useColorScheme + a separate nativewindColorScheme.set()
  // side effect) so it can never drift out of sync with `dark:` class
  // resolution. The two used to be independent subscriptions to appearance —
  // NativeWind's `set()` on native calls RN's Appearance.setColorScheme(),
  // which *itself* changes what RN's own useColorScheme() reports, creating
  // a feedback loop that could leave isDark (JS-driven colors) and NativeWind's
  // dark: variants disagreeing, especially around 'system' <-> explicit
  // transitions. Reading from the same observable NativeWind uses internally
  // guarantees agreement by construction.
  const { colorScheme, setColorScheme } = useNativewindColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('app_theme')
      .then(saved => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeState(saved);
          setColorScheme(saved);
        }
      })
      // A rejected read (corrupt storage, first-run platform quirks) just
      // means falling back to the system theme — never let it become an
      // unhandled rejection, and never let it block `hydrated` below.
      .catch(e => console.warn('Failed to read saved theme', e))
      // Flips even with nothing saved (first launch) or a read failure —
      // otherwise a caller gating on `hydrated` (the splash screen) would
      // hang forever instead of just falling back to the system theme.
      .finally(() => setHydrated(true));
    // Only ever runs once on mount to hydrate the persisted preference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable reference — won't cause context consumers to re-render on unrelated state changes
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    setColorScheme(t);
    AsyncStorage.setItem('app_theme', t);
  }, [setColorScheme]);

  const isDark = colorScheme === 'dark';

  // Only a new object when theme, isDark, or hydrated actually changes
  const value = useMemo<ThemeContextType>(
    () => ({ theme, isDark, setTheme, hydrated }),
    [theme, isDark, setTheme, hydrated],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
