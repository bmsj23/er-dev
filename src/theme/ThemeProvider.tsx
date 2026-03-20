import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';

import { loadThemePreference, saveThemePreference } from '../services/storage';
import type { ThemeMode } from '../types/travel';
import { createAppTheme, type AppTheme } from './createAppTheme';

type ThemeContextValue = {
  mode: ThemeMode;
  theme: AppTheme;
  hydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateTheme() {
      const storedMode = await loadThemePreference();

      if (isMounted) {
        setModeState(storedMode);
        setHydrated(true);
      }
    }

    void hydrateTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  function setMode(nextMode: ThemeMode) {
    setModeState(nextMode);
    void saveThemePreference(nextMode);
  }

  function toggleTheme() {
    setMode(mode === 'light' ? 'dark' : 'light');
  }

  const theme = createAppTheme(mode);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme,
        hydrated,
        setMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemePreference(): ThemeContextValue {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error('useThemePreference must be used inside ThemeProvider.');
  }

  return value;
}

export function useAppTheme(): AppTheme {
  return useThemePreference().theme;
}
