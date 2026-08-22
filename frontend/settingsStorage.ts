// App settings: program start date and theme preference.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { toLocalDateKey } from './coreProgress';
import { KAIROS_PROGRAM_START } from './programConfig';

const SETTINGS_KEY = 'kairos.settings.v1';

export type ThemeMode = 'light' | 'dark';

export type AppSettings = {
  programStartDate: string; // YYYY-MM-DD, day 0 = Workout A
  themeMode: ThemeMode;
  /** Google Apps Script web app URL for lift Log sheet */
  sheetsWebhookUrl: string;
};

const DEFAULT_SETTINGS: AppSettings = {
  programStartDate: KAIROS_PROGRAM_START,
  themeMode: 'light',
  sheetsWebhookUrl: '',
};

export async function loadAppSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      programStartDate: parsed.programStartDate ?? DEFAULT_SETTINGS.programStartDate,
      themeMode: parsed.themeMode ?? DEFAULT_SETTINGS.themeMode,
      sheetsWebhookUrl: parsed.sheetsWebhookUrl ?? DEFAULT_SETTINGS.sheetsWebhookUrl,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function resetProgramStartToday(): Promise<AppSettings> {
  const next: AppSettings = {
    ...(await loadAppSettings()),
    programStartDate: toLocalDateKey(new Date()),
  };
  await saveAppSettings(next);
  return next;
}

/** Set Core program start to a specific date (YYYY-MM-DD). */
export async function setProgramStartDate(dateKey: string): Promise<AppSettings> {
  const next: AppSettings = {
    ...(await loadAppSettings()),
    programStartDate: dateKey,
  };
  await saveAppSettings(next);
  return next;
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
