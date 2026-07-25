// Stretch completion and streak tracking.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { toLocalDateKey } from './coreProgress';

const STRETCH_PROGRESS_KEY = 'kairos.stretch.progress.v1';

export type StretchStreakState = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
};

export type StretchProgressState = {
  streak: StretchStreakState;
};

const DEFAULT_STREAK: StretchStreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
};

const DEFAULT_STATE: StretchProgressState = { streak: DEFAULT_STREAK };

function safeParse(raw: string | null): StretchProgressState {
  if (!raw) return DEFAULT_STATE;
  try {
    const parsed = JSON.parse(raw) as StretchProgressState;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_STATE;
    return { streak: parsed.streak ?? DEFAULT_STREAK };
  } catch {
    return DEFAULT_STATE;
  }
}

export async function loadStretchProgress(): Promise<StretchProgressState> {
  const raw = await AsyncStorage.getItem(STRETCH_PROGRESS_KEY);
  return safeParse(raw);
}

export async function saveStretchProgress(state: StretchProgressState): Promise<void> {
  await AsyncStorage.setItem(STRETCH_PROGRESS_KEY, JSON.stringify(state));
}

function isYesterdayDateKey(dateKey: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toLocalDateKey(yesterday) === dateKey;
}

export function recordStretchCompletion(state: StretchProgressState): StretchProgressState {
  const today = toLocalDateKey();
  const last = state.streak.lastCompletedDate;

  if (last === today) {
    return state;
  }

  const currentStreak = last && isYesterdayDateKey(last) ? state.streak.currentStreak + 1 : 1;
  const longestStreak = Math.max(state.streak.longestStreak, currentStreak);

  return {
    streak: {
      currentStreak,
      longestStreak,
      lastCompletedDate: today,
    },
  };
}

export function isStretchCompletedToday(state: StretchProgressState): boolean {
  return state.streak.lastCompletedDate === toLocalDateKey();
}
