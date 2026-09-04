/**
 * Cardio session persistence — AsyncStorage keyed by date.
 * Sessions are stored newest-first.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CardioSessionLog } from './cardioCoach';

const CARDIO_LOG_KEY = 'kairos_cardio_log_v1';

/** Load all cardio sessions, newest first. */
export async function loadCardioLog(): Promise<CardioSessionLog[]> {
  try {
    const raw = await AsyncStorage.getItem(CARDIO_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CardioSessionLog[];
  } catch {
    return [];
  }
}

/** Append (or overwrite same-date session) and save, sorted newest first. */
export async function appendCardioLog(session: CardioSessionLog): Promise<void> {
  const existing = await loadCardioLog();
  // Replace if same workoutId already exists (re-log)
  const filtered = existing.filter((s) => s.workoutId !== session.workoutId);
  // Sort newest first by date then insertion order
  const merged = [session, ...filtered].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  await AsyncStorage.setItem(CARDIO_LOG_KEY, JSON.stringify(merged));
}

/** Clear all cardio logs (for testing / reset). */
export async function clearCardioLog(): Promise<void> {
  await AsyncStorage.removeItem(CARDIO_LOG_KEY);
}
