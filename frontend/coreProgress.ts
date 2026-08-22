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
};

const DEFAULT_STREAK: CoreStreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
};

const DEFAULT_STATE: CoreProgressState = { entries: {}, streak: DEFAULT_STREAK };
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
    return {
      entries: parsed.entries,
      streak: parsed.streak ?? DEFAULT_STREAK,
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

function isYesterdayDateKey(dateKey: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toLocalDateKey(yesterday) === dateKey;
}

export function recordCoreWorkoutCompletion(state: CoreProgressState): CoreProgressState {
  const today = toLocalDateKey();
  const last = state.streak.lastCompletedDate;

  if (last === today) {
    return state;
  }

  const currentStreak = last && isYesterdayDateKey(last) ? state.streak.currentStreak + 1 : 1;
  const longestStreak = Math.max(state.streak.longestStreak, currentStreak);

  return {
    ...state,
    streak: {
      currentStreak,
      longestStreak,
      lastCompletedDate: today,
    },
  };
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
  return state.streak.lastCompletedDate === toLocalDateKey();
}
