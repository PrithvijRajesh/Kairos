// Per-day exercise swaps (equipment taken). Stored on phone.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { toLocalDateKey } from './coreProgress';
import {
  applyExerciseAlternative,
  type GymExercise,
  type GymWorkout,
} from './gymWorkouts';

const SWAP_KEY = 'kairos.gym.swaps.v1';

type SwapStore = {
  date: string;
  /** primary exercise id → selected alternative id (or primary id) */
  swaps: Record<string, string>;
};

async function readStore(): Promise<SwapStore> {
  const today = toLocalDateKey();
  try {
    const raw = await AsyncStorage.getItem(SWAP_KEY);
    if (!raw) return { date: today, swaps: {} };
    const parsed = JSON.parse(raw) as SwapStore;
    if (parsed.date !== today) {
      return { date: today, swaps: {} };
    }
    return parsed;
  } catch {
    return { date: today, swaps: {} };
  }
}

async function writeStore(store: SwapStore): Promise<void> {
  await AsyncStorage.setItem(SWAP_KEY, JSON.stringify(store));
}

export async function loadTodaysSwaps(): Promise<Record<string, string>> {
  return (await readStore()).swaps;
}

export async function setExerciseSwap(
  primaryId: string,
  selectedId: string
): Promise<Record<string, string>> {
  const store = await readStore();
  const next = { ...store.swaps };
  if (selectedId === primaryId) {
    delete next[primaryId];
  } else {
    next[primaryId] = selectedId;
  }
  await writeStore({ date: toLocalDateKey(), swaps: next });
  return next;
}

export function applySwapsToWorkout(
  workout: GymWorkout,
  swaps: Record<string, string>
): GymWorkout {
  return {
    ...workout,
    exercises: workout.exercises.map((ex) => {
      const selected = swaps[ex.id];
      if (!selected || selected === ex.id) return ex;
      return applyExerciseAlternative(ex, selected);
    }),
  };
}

export function primaryIdOf(exercise: GymExercise): string {
  return exercise.primaryId ?? exercise.id;
}
