// Core progress storage and progression logic.
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CoreExerciseTemplate } from './coreWorkouts';

const CORE_PROGRESS_KEY = 'kairos.core.progress.v1';

export type ExerciseFeel = 'easy' | 'perfect' | 'hard';

export type CoreProgressEntry = {
  level: 1 | 2 | 3;
  /** Extra hold seconds on time exercises between level jumps */
  bonusSec: number;
};

export type CoreStreakState = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
};

export type CoreProgressState = {
  entries: Record<string, CoreProgressEntry>;
  streak: CoreStreakState;
  /** All dates core was completed (YYYY-MM-DD), used to rebuild streak when backdating */
  completedDates?: string[];
};

const DEFAULT_STREAK: CoreStreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
};

const DEFAULT_STATE: CoreProgressState = { entries: {}, streak: DEFAULT_STREAK, completedDates: [] };
const DEFAULT_ENTRY: CoreProgressEntry = { level: 1, bonusSec: 0 };

const TIME_BONUS_STEP = 5;
const TIME_BONUS_LEVEL_UP = 15;

function safeParseProgress(raw: string | null): CoreProgressState {
  if (!raw) {
    return DEFAULT_STATE;
  }
  try {
    const parsed = JSON.parse(raw) as CoreProgressState;
    if (!parsed || typeof parsed !== 'object' || !parsed.entries) {
      return DEFAULT_STATE;
    }
    const completedDates = Array.isArray(parsed.completedDates)
      ? parsed.completedDates
      : parsed.streak?.lastCompletedDate
        ? [parsed.streak.lastCompletedDate]
        : [];
    return {
      entries: parsed.entries,
      streak: parsed.streak ?? DEFAULT_STREAK,
      completedDates,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export async function loadCoreProgress(): Promise<CoreProgressState> {
  const raw = await AsyncStorage.getItem(CORE_PROGRESS_KEY);
  return safeParseProgress(raw);
}

export async function saveCoreProgress(state: CoreProgressState): Promise<void> {
  await AsyncStorage.setItem(CORE_PROGRESS_KEY, JSON.stringify(state));
}

export function getOrCreateEntry(
  state: CoreProgressState,
  exerciseId: string
): CoreProgressEntry {
  return state.entries[exerciseId] ?? { ...DEFAULT_ENTRY };
}

export function applyFeelToEntry(
  exercise: CoreExerciseTemplate,
  current: CoreProgressEntry,
  feel: ExerciseFeel
): CoreProgressEntry {
  if (feel === 'easy') {
    if (exercise.type === 'reps') {
      return {
        ...current,
        level: Math.min(3, current.level + 1) as 1 | 2 | 3,
      };
    }
    const nextBonus = current.bonusSec + TIME_BONUS_STEP;
    if (nextBonus >= TIME_BONUS_LEVEL_UP) {
      return {
        ...current,
        level: Math.min(3, current.level + 1) as 1 | 2 | 3,
        bonusSec: 0,
      };
    }
    return { ...current, bonusSec: nextBonus };
  }

  if (feel === 'hard') {
    if (exercise.type === 'reps') {
      return {
        ...current,
        level: Math.max(1, current.level - 1) as 1 | 2 | 3,
      };
    }
    if (current.bonusSec > 0) {
      return { ...current, bonusSec: Math.max(0, current.bonusSec - TIME_BONUS_STEP) };
    }
    return {
      ...current,
      level: Math.max(1, current.level - 1) as 1 | 2 | 3,
      bonusSec: 0,
    };
  }

  return current;
}

export function applySessionFeels(
  state: CoreProgressState,
  exercises: CoreExerciseTemplate[],
  feels: Record<string, ExerciseFeel>
): CoreProgressState {
  const nextEntries: Record<string, CoreProgressEntry> = { ...state.entries };

  for (const exercise of exercises) {
    const feel = feels[exercise.id];
    if (!feel) continue;

    const currentEntry = getOrCreateEntry(state, exercise.id);
    nextEntries[exercise.id] = applyFeelToEntry(exercise, currentEntry, feel);
  }

  return { ...state, entries: nextEntries };
}

export function toLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysToDateKey(dateKey: string, deltaDays: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const dt = new Date(year, month - 1, day);
  dt.setDate(dt.getDate() + deltaDays);
  return toLocalDateKey(dt);
}

function collectCompletedDates(state: CoreProgressState): string[] {
  const set = new Set<string>(state.completedDates ?? []);
  if (state.streak.lastCompletedDate) {
    set.add(state.streak.lastCompletedDate);
  }
  return [...set].sort();
}

function computeStreakFromDates(completedDates: string[]): CoreStreakState {
  const unique = [...new Set(completedDates)].sort();
  if (unique.length === 0) {
    return { ...DEFAULT_STREAK };
  }

  const lastCompletedDate = unique[unique.length - 1];
  const set = new Set(unique);

  let currentStreak = 1;
  let cursor = lastCompletedDate;
  while (set.has(addDaysToDateKey(cursor, -1))) {
    currentStreak += 1;
    cursor = addDaysToDateKey(cursor, -1);
  }

  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    if (unique[i] === addDaysToDateKey(unique[i - 1], 1)) {
      run += 1;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    lastCompletedDate,
  };
}

/** Mark core done for a specific date (today, yesterday, or any past day). Rebuilds streak. */
export function recordCoreWorkoutCompletionForDate(
  state: CoreProgressState,
  dateKey: string
): CoreProgressState {
  const completedDates = collectCompletedDates(state);
  if (!completedDates.includes(dateKey)) {
    completedDates.push(dateKey);
  }
  completedDates.sort();
  const streak = computeStreakFromDates(completedDates);
  // Preserve historical longest if somehow larger
  streak.longestStreak = Math.max(streak.longestStreak, state.streak.longestStreak);

  return {
    ...state,
    completedDates,
    streak,
  };
}

export function recordCoreWorkoutCompletion(state: CoreProgressState): CoreProgressState {
  return recordCoreWorkoutCompletionForDate(state, toLocalDateKey());
}

export function getExerciseLevel(
  state: CoreProgressState,
  exerciseId: string
): 1 | 2 | 3 {
  return state.entries[exerciseId]?.level ?? 1;
}

export function getExerciseBonusSeconds(
  state: CoreProgressState,
  exerciseId: string
): number {
  return state.entries[exerciseId]?.bonusSec ?? 0;
}

export function isCoreWorkoutCompletedToday(state: CoreProgressState): boolean {
  return isCoreCompletedOnDate(state, toLocalDateKey());
}

export function isCoreCompletedOnDate(state: CoreProgressState, dateKey: string): boolean {
  if (state.streak.lastCompletedDate === dateKey) return true;
  return (state.completedDates ?? []).includes(dateKey);
}

export function yesterdayDateKey(): string {
  return addDaysToDateKey(toLocalDateKey(), -1);
}
