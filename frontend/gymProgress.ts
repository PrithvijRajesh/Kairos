// Gym logs + progression — on-device first; optional sync when home Wi‑Fi reaches API.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { submitGymLog } from './api';
import { toLocalDateKey } from './coreProgress';
import { KAIROS_PROGRAM_START } from './programConfig';
import type { GymExercise } from './gymWorkouts';

const GYM_PROGRESS_KEY = 'kairos.gym.progress.v2';

export type SetFeel = 'easy' | 'perfect' | 'hard';
export type Adjustment = 'up' | 'down' | 'stay';

export type WeightRecommendation = {
  adjustment: Adjustment;
  nextWeightLbs: number;
  reason: string;
};

export type LoggedSet = {
  setNumber: number;
  weightLbs: number;
  reps: number;
  feel: SetFeel;
  recommendedNextLbs: number;
  adjustment: Adjustment;
};

export type ExerciseSessionLog = {
  exerciseId: string;
  exerciseName: string;
  sets: LoggedSet[];
  /** Suggested start weight for next session */
  nextSessionWeightLbs: number;
  progressed: boolean;
};

export type GymSessionLog = {
  date: string;
  workoutId: string;
  workoutTitle: string;
  exercises: ExerciseSessionLog[];
  synced?: boolean;
};

export type ExerciseWeightMemory = {
  lastWorkingWeightLbs: number;
  /** Suggested start next time (may be +increment after a clean top-rep session) */
  nextStartWeightLbs: number;
  lastSessionDate: string;
  note?: string;
};

export type GymProgressState = {
  /** YYYY-MM-DD — Day 1 of the lift program (Push). Set once on first open. */
  programStartDate: string | null;
  weights: Record<string, ExerciseWeightMemory>;
  sessions: GymSessionLog[];
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate: string | null;
  };
};

const DEFAULT_STREAK = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null as string | null,
};

function safeParse(raw: string | null): GymProgressState {
  if (!raw) {
    return {
      programStartDate: null,
      weights: {},
      sessions: [],
      streak: { ...DEFAULT_STREAK },
    };
  }
  try {
    const parsed = JSON.parse(raw) as GymProgressState;
    return {
      programStartDate: parsed.programStartDate ?? null,
      weights: parsed.weights ?? {},
      sessions: parsed.sessions ?? [],
      streak: parsed.streak ?? { ...DEFAULT_STREAK },
    };
  } catch {
    return {
      programStartDate: null,
      weights: {},
      sessions: [],
      streak: { ...DEFAULT_STREAK },
    };
  }
}

export async function loadGymProgress(): Promise<GymProgressState> {
  const raw = await AsyncStorage.getItem(GYM_PROGRESS_KEY);
  return safeParse(raw);
}

export async function saveGymProgress(state: GymProgressState): Promise<void> {
  await AsyncStorage.setItem(GYM_PROGRESS_KEY, JSON.stringify(state));
}

/**
 * Ensures the lift program has a start date.
 * First launch → KAIROS_PROGRAM_START (Sun Aug 23, 2026) unless already set.
 * Pass forceToday to restart from today; use setLiftProgramStartDate for a specific date.
 */
export async function ensureLiftProgramStart(forceToday = false): Promise<GymProgressState> {
  const state = await loadGymProgress();
  if (!forceToday && state.programStartDate) {
    return state;
  }
  const next: GymProgressState = {
    ...state,
    programStartDate: forceToday ? toLocalDateKey(new Date()) : KAIROS_PROGRAM_START,
  };
  await saveGymProgress(next);
  return next;
}

export async function setLiftProgramStartDate(dateKey: string): Promise<GymProgressState> {
  const state = await loadGymProgress();
  const next: GymProgressState = {
    ...state,
    programStartDate: dateKey,
  };
  await saveGymProgress(next);
  return next;
}

/** Last saved start weight, or null if first time (user enters their own). */
export function getSuggestedStartWeight(
  state: GymProgressState,
  exercise: GymExercise
): number | null {
  const mem = state.weights[exercise.id];
  if (!mem) return null;
  return mem.nextStartWeightLbs ?? mem.lastWorkingWeightLbs;
}

function roundToIncrement(weight: number, increment: number): number {
  if (increment <= 0) return Math.round(weight * 2) / 2;
  return Math.round(weight / increment) * increment;
}

/**
 * Next-set advice from this set's reps + feel (your progression rules).
 * - Hit top of range + easy → can bump next set
 * - Below min or hard → drop
 * - In range → stay (build toward topping every set)
 */
export function recommendNextWeight(
  exercise: GymExercise,
  weightLbs: number,
  reps: number,
  feel: SetFeel
): WeightRecommendation {
  const { repMin, repMax, incrementLbs } = exercise;
  const inc = Math.max(incrementLbs, 2.5);

  if (reps < repMin || feel === 'hard') {
    const next = Math.max(0, roundToIncrement(weightLbs - inc, inc));
    return {
      adjustment: 'down',
      nextWeightLbs: next,
      reason:
        reps < repMin
          ? `Below ${repMin} reps — drop to ${next} lb and keep form clean.`
          : `Felt hard — drop to ${next} lb. Don't sacrifice form.`,
    };
  }

  if (feel === 'easy' && reps >= repMax) {
    const next = roundToIncrement(weightLbs + inc, inc);
    return {
      adjustment: 'up',
      nextWeightLbs: next,
      reason: `Hit ${reps} (top of ${repMin}–${repMax}) and it felt easy — try ${next} lb next set.`,
    };
  }

  if (reps >= repMin && reps < repMax) {
    return {
      adjustment: 'stay',
      nextWeightLbs: weightLbs,
      reason: `${reps} reps is in range (${repMin}–${repMax}). Stay at ${weightLbs} lb and chase the top of the range.`,
    };
  }

  // Hit top with perfect (not easy) → stay for consistency across remaining sets
  return {
    adjustment: 'stay',
    nextWeightLbs: weightLbs,
    reason: `Solid ${reps} @ ${weightLbs} lb. Stay here — progress when you top the range on every set.`,
  };
}

/**
 * After finishing an exercise: bump next-session start only if every set
 * hit the top of the rep range at the same weight without "hard".
 */
export function nextSessionWeightForExercise(
  exercise: GymExercise,
  sets: LoggedSet[]
): { weight: number; progressed: boolean } {
  if (sets.length === 0) {
    return { weight: 0, progressed: false };
  }

  const last = sets[sets.length - 1];
  const base = last.weightLbs;
  const sameWeight = sets.every((s) => s.weightLbs === sets[0].weightLbs);
  const allTopped =
    sameWeight &&
    sets.length >= exercise.sets &&
    sets.every((s) => s.reps >= exercise.repMax && s.feel !== 'hard');

  if (allTopped) {
    const bumped = roundToIncrement(base + exercise.incrementLbs, exercise.incrementLbs);
    return { weight: bumped, progressed: true };
  }

  return { weight: base, progressed: false };
}

export function isGymCompletedToday(state: GymProgressState): boolean {
  return state.streak.lastCompletedDate === toLocalDateKey();
}

function isYesterdayDateKey(dateKey: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toLocalDateKey(yesterday) === dateKey;
}

export function recordGymSessionCompletion(
  state: GymProgressState,
  session: GymSessionLog
): GymProgressState {
  const today = toLocalDateKey();
  const nextWeights = { ...state.weights };

  for (const exercise of session.exercises) {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    if (!lastSet) continue;
    nextWeights[exercise.exerciseId] = {
      lastWorkingWeightLbs: lastSet.weightLbs,
      nextStartWeightLbs: exercise.nextSessionWeightLbs,
      lastSessionDate: today,
      note: exercise.progressed
        ? `Progressed — start ${exercise.nextSessionWeightLbs} lb next time`
        : undefined,
    };
  }

  const last = state.streak.lastCompletedDate;
  let streak = state.streak;
  if (last !== today) {
    const currentStreak = last && isYesterdayDateKey(last) ? state.streak.currentStreak + 1 : 1;
    streak = {
      currentStreak,
      longestStreak: Math.max(state.streak.longestStreak, currentStreak),
      lastCompletedDate: today,
    };
  }

  return {
    programStartDate: state.programStartDate,
    weights: nextWeights,
    sessions: [session, ...state.sessions].slice(0, 40),
    streak,
  };
}

/** Best-effort upload when you're back on home network with API running. */
export async function trySyncSession(session: GymSessionLog): Promise<boolean> {
  try {
    await submitGymLog({
      date: session.date,
      workoutId: session.workoutId,
      notes: JSON.stringify({
        title: session.workoutTitle,
        exercises: session.exercises.map((ex) => ({
          name: ex.exerciseName,
          sets: ex.sets.map((s) => ({
            set: s.setNumber,
            lbs: s.weightLbs,
            reps: s.reps,
            feel: s.feel,
          })),
        })),
      }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function syncUnsyncedSessions(): Promise<number> {
  const state = await loadGymProgress();
  let syncedCount = 0;
  const sessions = [...state.sessions];

  for (let i = 0; i < sessions.length; i++) {
    if (sessions[i].synced) continue;
    const ok = await trySyncSession(sessions[i]);
    if (ok) {
      sessions[i] = { ...sessions[i], synced: true };
      syncedCount += 1;
    }
  }

  if (syncedCount > 0) {
    await saveGymProgress({ ...state, sessions });
  }
  return syncedCount;
}
