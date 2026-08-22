// Provides theme colors and app settings across screens.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  loadAppSettings,
  resetProgramStartToday,
  saveAppSettings,
  setProgramStartDate,
  type AppSettings,
  type ThemeMode,
} from './settingsStorage';
import { runProgramMigrationIfNeeded } from './programMigration';
import { getColors, type ThemeColors } from './theme';

type ThemeContextValue = {
  colors: ThemeColors;
  themeMode: ThemeMode;
  programStartDate: string;
  isReady: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setProgramStartDate: (dateKey: string) => Promise<void>;
  resetPlanStartToday: () => Promise<AppSettings>;
  refreshSettings: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const refreshSettings = useCallback(async () => {
    await runProgramMigrationIfNeeded();
    const loaded = await loadAppSettings();
    setSettings(loaded);
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const setThemeMode = useCallback(
    async (mode: ThemeMode) => {
      const base = settings ?? (await loadAppSettings());
      const next = { ...base, themeMode: mode };
      await saveAppSettings(next);
      setSettings(next);
    },
    [settings]
  );

  const setProgramStartDate = useCallback(
    async (dateKey: string) => {
      const base = settings ?? (await loadAppSettings());
      const next = { ...base, programStartDate: dateKey };
      await saveAppSettings(next);
      setSettings(next);
    },
    [settings]
  );

  const resetPlanStartToday = useCallback(async () => {
    const next = await resetProgramStartToday();
    setSettings(next);
    return next;
  }, []);

  const value = useMemo<ThemeContextValue | null>(() => {
    if (!settings) {
      return null;
    }
    return {
      colors: getColors(settings.themeMode),
      themeMode: settings.themeMode,
      programStartDate: settings.programStartDate,
      isReady: true,
      setThemeMode,
      setProgramStartDate,
      resetPlanStartToday,
      refreshSettings,
    };
  }, [settings, setThemeMode, setProgramStartDate, resetPlanStartToday, refreshSettings]);

  if (!value) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
