// Gym logs + progression — on-device first; optional sync when home Wi‑Fi reaches API.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { submitGymLog } from './api';
import { toLocalDateKey } from './coreProgress';
import { KAIROS_PROGRAM_START } from './programConfig';
import { getScheduleForDate, type GymExercise } from './gymWorkouts';

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

/** Temporary start-weight scale for a return-from-illness / soft-reset day. */
export type ReturnDeload = {
  /** Multiply suggested start weights (e.g. 0.75 = −25%) */
  factor: number;
  /** Only applied on this local date */
  forDate: string;
};

export type GymProgressState = {
  /** YYYY-MM-DD — Day 1 of the lift program (Push). Set once on first open. */
  programStartDate: string | null;
  weights: Record<string, ExerciseWeightMemory>;
  sessions: GymSessionLog[];
  /** Dates when user chose a forced rest / recovery day (YYYY-MM-DD) */
  forcedRestDays?: string[];
  /** One-session deload for suggested start weights (does not rewrite history) */
  returnDeload?: ReturnDeload | null;
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
      forcedRestDays: [],
      returnDeload: null,
      streak: { ...DEFAULT_STREAK },
    };
  }
  try {
    const parsed = JSON.parse(raw) as GymProgressState;
    return {
      programStartDate: parsed.programStartDate ?? null,
      weights: parsed.weights ?? {},
      sessions: parsed.sessions ?? [],
      forcedRestDays: parsed.forcedRestDays ?? [],
      returnDeload: parsed.returnDeload ?? null,
      streak: parsed.streak ?? { ...DEFAULT_STREAK },
    };
  } catch {
    return {
      programStartDate: null,
      weights: {},
      sessions: [],
      forcedRestDays: [],
      returnDeload: null,
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
 * First launch → KAIROS_PROGRAM_START unless already set.
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

/**
 * Soft reset to Day 1 (Push) on dateKey.
 * Preserves session history and weight memory.
 * Optional returnDeloadFactor (e.g. 0.75) scales suggested start weights for that day only.
 */
export async function softResetLiftProgram(
  dateKey: string = toLocalDateKey(),
  options?: { returnDeloadFactor?: number }
): Promise<GymProgressState> {
  const state = await loadGymProgress();
  const factor = options?.returnDeloadFactor;
  const next: GymProgressState = {
    ...state,
    programStartDate: dateKey,
    returnDeload:
      factor != null && factor > 0 && factor < 1
        ? { factor, forDate: dateKey }
        : null,
  };
  await saveGymProgress(next);
  return next;
}

export function isReturnDeloadActive(
  state: GymProgressState,
  dateKey: string = toLocalDateKey()
): boolean {
  return !!state.returnDeload && state.returnDeload.forDate === dateKey;
}

export function returnDeloadPercent(state: GymProgressState): number | null {
  if (!state.returnDeload) return null;
  return Math.round((1 - state.returnDeload.factor) * 100);
}

function shiftIsoDate(isoDate: string, daysDelta: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + daysDelta);
  return toLocalDateKey(date);
}

/**
 * You planned to lift on missedDateKey but didn't (weather, etc.).
 * Marks that day as forced weather rest and shifts the rotation so today
 * shows the workout that was scheduled for the missed day.
 */
export async function catchUpMissedLiftDay(
  missedDateKey: string = shiftIsoDate(toLocalDateKey(), -1)
): Promise<GymProgressState> {
  return recordForcedRestDay(missedDateKey);
}

/**
 * Records a forced rest / weather delay for dateKey and shifts the program
 * anchor forward by 1 day so the missed workout moves to the next day.
 */
export async function recordForcedRestDay(dateKey: string = toLocalDateKey()): Promise<GymProgressState> {
  const state = await loadGymProgress();
  const restList = state.forcedRestDays ?? [];
  const alreadyMarked = restList.includes(dateKey);

  const newRestList = alreadyMarked ? restList : [...restList, dateKey];
  const curStart = state.programStartDate ?? KAIROS_PROGRAM_START;
  // Shift program start forward by 1 so the missed day's workout slides to the next day
  const newStart = alreadyMarked ? curStart : shiftIsoDate(curStart, 1);

  const next: GymProgressState = {
    ...state,
    forcedRestDays: newRestList,
    programStartDate: newStart,
  };
  await saveGymProgress(next);
  return next;
}

/**
 * Undo a forced rest day for dateKey. Shifts the program start date back by 1 day.
 */
export async function undoForcedRestDay(dateKey: string = toLocalDateKey()): Promise<GymProgressState> {
  const state = await loadGymProgress();
  const restList = state.forcedRestDays ?? [];
  if (!restList.includes(dateKey)) return state;

  const newRestList = restList.filter((d) => d !== dateKey);
  const curStart = state.programStartDate ?? KAIROS_PROGRAM_START;
  const newStart = shiftIsoDate(curStart, -1);

  const next: GymProgressState = {
    ...state,
    forcedRestDays: newRestList,
    programStartDate: newStart,
  };
  await saveGymProgress(next);
  return next;
}

export function isForcedRestToday(state: GymProgressState, dateKey: string = toLocalDateKey()): boolean {
  return (state.forcedRestDays ?? []).includes(dateKey);
}

export type RecoveryInsights = {
  daysSinceLastSession: number;
  recentRestDaysCount: number;
  isRestToday: boolean;
  recommendSoftReset: boolean;
  message: string;
};

/**
 * Analyzes recent rest / inactivity to offer recovery insights and suggest soft resets.
 */
export function getRecoveryInsights(state: GymProgressState, todayDateKey: string = toLocalDateKey()): RecoveryInsights {
  const isRestToday = isForcedRestToday(state, todayDateKey);
  const restList = state.forcedRestDays ?? [];

  // Calculate days since last completed session
  let daysSinceLastSession = 0;
  if (state.streak.lastCompletedDate) {
    const [ly, lm, ld] = state.streak.lastCompletedDate.split('-').map(Number);
    const [ty, tm, td] = todayDateKey.split('-').map(Number);
    const lastTime = new Date(ly, lm - 1, ld).getTime();
    const todayTime = new Date(ty, tm - 1, td).getTime();
    daysSinceLastSession = Math.max(0, Math.round((todayTime - lastTime) / (1000 * 60 * 60 * 24)));
  } else if (state.sessions.length > 0) {
    const lastSession = state.sessions[0];
    const [ly, lm, ld] = lastSession.date.split('-').map(Number);
    const [ty, tm, td] = todayDateKey.split('-').map(Number);
    const lastTime = new Date(ly, lm - 1, ld).getTime();
    const todayTime = new Date(ty, tm - 1, td).getTime();
    daysSinceLastSession = Math.max(0, Math.round((todayTime - lastTime) / (1000 * 60 * 60 * 24)));
  } else {
    daysSinceLastSession = 3; // Default fresh state
  }

  // Count forced rest days in last 7 days
  const recentRestDaysCount = restList.length;

  const recommendSoftReset = daysSinceLastSession >= 3 || recentRestDaysCount >= 2;

  let message = 'Recovery status: on track.';
  if (isRestToday) {
    message = 'Forced rest day active today. Schedule shifted by 1 day to allow full muscle recovery.';
  } else if (daysSinceLastSession >= 3) {
    message = `${daysSinceLastSession} days of rest/recovery detected. A soft reset to Day 1 (Push) is recommended to restart fresh.`;
  } else if (recentRestDaysCount >= 2) {
    message = 'Multiple forced rest days logged. Soft reset recommended to reset volume with Day 1 (Push).';
  }

  return {
    daysSinceLastSession,
    recentRestDaysCount,
    isRestToday,
    recommendSoftReset,
    message,
  };
}

function roundToIncrement(weight: number, increment: number): number {
  if (increment <= 0) return Math.round(weight * 2) / 2;
  return Math.round(weight / increment) * increment;
}

/** Last saved start weight, or null if first time (user enters their own). */
export function getSuggestedStartWeight(
  state: GymProgressState,
  exercise: GymExercise,
  dateKey: string = toLocalDateKey()
): number | null {
  const mem = state.weights[exercise.id];
  if (!mem) return null;
  const base = mem.nextStartWeightLbs ?? mem.lastWorkingWeightLbs;
  if (base == null) return null;

  if (isReturnDeloadActive(state, dateKey) && state.returnDeload) {
    const scaled = base * state.returnDeload.factor;
    const inc = Math.max(exercise.incrementLbs || 2.5, 2.5);
    // Bodyweight / zero stays zero; never round up above the deload target
    if (base <= 0) return 0;
    return Math.max(0, Math.min(base, roundToIncrement(scaled, inc)));
  }

  return base;
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

export type LiftDayLogStatus = {
  dateKey: string;
  label: string;
  kind: 'lift' | 'rest' | 'weather';
  logged: boolean;
  forcedRest: boolean;
};

/**
 * Schedule label for a past/present date without letting later weather-rest
 * shifts rewrite earlier days' workout names.
 * Current programStart already includes +1 for every forced rest; for date D,
 * undo rests that happened after D so D keeps its original label.
 */
function scheduleForAttendanceDate(
  dateKey: string,
  programStartIso: string,
  forcedRestDays: string[]
): ReturnType<typeof getScheduleForDate> {
  const restsAfter = forcedRestDays.filter((d) => d > dateKey).length;
  const effectiveStart = shiftIsoDate(programStartIso, -restsAfter);
  const [y, m, d] = dateKey.split('-').map(Number);
  return getScheduleForDate(new Date(y, m - 1, d), effectiveStart);
}

/** Recent lift days — see what was logged in-app vs only in Sheets. */
export function buildLiftAttendanceCalendar(
  state: GymProgressState,
  programStartIso: string,
  daysBack = 21
): LiftDayLogStatus[] {
  const loggedDates = new Set(state.sessions.map((s) => s.date));
  const forcedList = state.forcedRestDays ?? [];
  const forced = new Set(forcedList);
  const rows: LiftDayLogStatus[] = [];
  const today = toLocalDateKey();

  for (let i = daysBack - 1; i >= 0; i--) {
    const [y, m, d] = today.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - i);
    const dateKey = toLocalDateKey(dt);

    if (forced.has(dateKey)) {
      rows.push({
        dateKey,
        label: 'Weather / forced rest',
        kind: 'weather',
        logged: false,
        forcedRest: true,
      });
      continue;
    }

    const schedule = scheduleForAttendanceDate(dateKey, programStartIso, forcedList);
    rows.push({
      dateKey,
      label: schedule.label,
      kind: schedule.kind === 'lift' ? 'lift' : 'rest',
      logged: loggedDates.has(dateKey),
      forcedRest: false,
    });
  }
  return rows;
}

/** Lift days in the window that were not logged in-app and are not weather/forced rest. */
export function getMissedLiftDays(
  state: GymProgressState,
  programStartIso: string,
  daysBack = 21
): LiftDayLogStatus[] {
  return buildLiftAttendanceCalendar(state, programStartIso, daysBack).filter(
    (row) => row.kind === 'lift' && !row.logged && !row.forcedRest
  );
}

export function isGymCompletedOnDate(state: GymProgressState, dateKey: string): boolean {
  return state.sessions.some((s) => s.date === dateKey);
}

export function isGymCompletedToday(state: GymProgressState): boolean {
  return isGymCompletedOnDate(state, toLocalDateKey());
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
  const sessionDate = session.date || toLocalDateKey();
  const nextWeights = { ...state.weights };

  for (const exercise of session.exercises) {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    if (!lastSet) continue;
    nextWeights[exercise.exerciseId] = {
      lastWorkingWeightLbs: lastSet.weightLbs,
      nextStartWeightLbs: exercise.nextSessionWeightLbs,
      lastSessionDate: sessionDate,
      note: exercise.progressed
        ? `Progressed — start ${exercise.nextSessionWeightLbs} lb next time`
        : undefined,
    };
  }

  const today = toLocalDateKey();
  const last = state.streak.lastCompletedDate;
  let streak = state.streak;
  // Only advance streak when logging a session for today
  if (sessionDate === today && last !== today) {
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
    forcedRestDays: state.forcedRestDays ?? [],
    // Clear one-day return deload after logging so next session uses real lifts
    returnDeload:
      state.returnDeload && state.returnDeload.forDate === sessionDate
        ? null
        : state.returnDeload ?? null,
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
