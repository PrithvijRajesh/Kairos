// Core progress storage and progression logic (Step 5).
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CoreExerciseTemplate } from './coreWorkouts';

const CORE_PROGRESS_KEY = 'kairos.core.progress.v1';

// TODO(you): Keep these aligned with how review.tsx labels exercise feedback.
export type ExerciseFeel = 'easy' | 'perfect' | 'hard';

// One user's progress for a single exercise id (ex: "front_plank").
export type CoreProgressEntry = {
  level: 1 | 2 | 3;
  bonusSec: number; // useful for time-based exercises between level jumps
};

// Whole saved object in AsyncStorage.
export type CoreProgressState = {
  entries: Record<string, CoreProgressEntry>;
};

const DEFAULT_STATE: CoreProgressState = { entries: {} };
const DEFAULT_ENTRY: CoreProgressEntry = { level: 1, bonusSec: 0 };

// Basic helper: avoid sprinkling try/catch everywhere.
function safeParseProgress(raw: string | null): CoreProgressState {
  if (!raw) {
    return DEFAULT_STATE;
  }
  try {
    const parsed = JSON.parse(raw) as CoreProgressState;
    if (!parsed || typeof parsed !== 'object' || !parsed.entries) {
      return DEFAULT_STATE;
    }
    return parsed;
  } catch {
    return DEFAULT_STATE;
  }
}

// Read full progress object from device storage.
export async function loadCoreProgress(): Promise<CoreProgressState> {
  const raw = await AsyncStorage.getItem(CORE_PROGRESS_KEY);
  return safeParseProgress(raw);
}

// Save full progress object to device storage.
export async function saveCoreProgress(state: CoreProgressState): Promise<void> {
  await AsyncStorage.setItem(CORE_PROGRESS_KEY, JSON.stringify(state));
}

// Get existing progress for one exercise, or start at level 1.
export function getOrCreateEntry(
  state: CoreProgressState,
  exerciseId: string
): CoreProgressEntry {
  return state.entries[exerciseId] ?? { ...DEFAULT_ENTRY };
}

// TODO(you): implement the real progression logic.
// Starter behavior is intentionally conservative.
export function applyFeelToEntry(
  exercise: CoreExerciseTemplate,
  current: CoreProgressEntry,
  feel: ExerciseFeel
): CoreProgressEntry {
  // TODO 1: implement "easy" logic
  // Suggested:
  // - reps exercise: level + 1 (cap 3)
  // - time exercise: +5 bonusSec; if bonus reaches threshold, level up and reset bonus
  if (feel === 'easy') {
    if (exercise.type === 'reps') {
      return {
        ...current,
        level: Math.min(3, current.level + 1) as 1 | 2 | 3,
      };
    }
    const nextBonus = current.bonusSec + 5;
    if(nextBonus >= 15) {
        return {
            ...current,
            level: Math.min(3,current.level + 1) as 1|2|3,
            bonusSec:0,
        }
    }
    return {
      ...current,
      bonusSec: current.bonusSec + 5,
    };
  }

  // TODO 2: implement "hard" logic
  // Suggested:
  // - reps exercise: level - 1 (floor 1)
  // - time exercise: bonusSec - 5 (floor 0), optional level down if already 0
  if (feel === 'hard') {
    if (exercise.type === 'reps') {
      return {
        ...current,
        level: Math.max(1, current.level - 1) as 1 | 2 | 3,
      };
    }
    const nextBonus = current.bonusSec - 5;
    if (nextBonus <= 0) {
      return {
        ...current,
        bonusSec: 0,
      };
    }
    return {
      ...current,
      bonusSec: nextBonus,
    };
  }

  // TODO 3: confirm "perfect" means no change (usually yes for MVP)
  return current;
}

// Apply a whole review payload to state and return updated state.
export function applySessionFeels(
  state: CoreProgressState,
  exercises: CoreExerciseTemplate[],
  feels: Record<string, ExerciseFeel>
): CoreProgressState {
  const nextEntries: Record<string, CoreProgressEntry> = { ...state.entries };

  for (const exercise of exercises) {
    const feel = feels[exercise.id];
    if (!feel) continue; // skip unrated exercises safely

    const currentEntry = getOrCreateEntry(state, exercise.id);
    const updatedEntry = applyFeelToEntry(exercise, currentEntry, feel);
    nextEntries[exercise.id] = updatedEntry;
  }

  return { entries: nextEntries };
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
