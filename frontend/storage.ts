// Goals: save locally first so the app works without the backend.
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as api from './api';
import type { Goals } from './types';

const KEY = 'kairos.goals';

export type savedGoals = Goals;

export async function saveGoals(goals: savedGoals): Promise<{ synced: boolean }> {
  await AsyncStorage.setItem(KEY, JSON.stringify(goals));

  try {
    await api.saveGoals(goals);
    return { synced: true };
  } catch {
    return { synced: false };
  }
}

export async function loadGoals(): Promise<savedGoals | null> {
  const raw = await AsyncStorage.getItem(KEY);
  const local = raw ? (JSON.parse(raw) as savedGoals) : null;

  // If we have local goals, return immediately and sync in the background.
  if (local) {
    api
      .fetchGoals()
      .then(async (remote) => {
        if (remote) {
          await AsyncStorage.setItem(KEY, JSON.stringify(remote));
        }
      })
      .catch(() => {});
    return local;
  }

  try {
    const remote = await api.fetchGoals();
    if (remote) {
      await AsyncStorage.setItem(KEY, JSON.stringify(remote));
      return remote;
    }
  } catch {
    // no remote and no local
  }

  return null;
}
