import AsyncStorage from '@react-native-async-storage/async-storage';

import { setLiftProgramStartDate } from './gymProgress';
import {
  KAIROS_PROGRAM_START,
  PROGRAM_CONFIG_VERSION,
  PROGRAM_MIGRATION_KEY,
} from './programConfig';
import { loadAppSettings, saveAppSettings } from './settingsStorage';

/** One-time: align Core + Lift start to KAIROS_PROGRAM_START (Sun Aug 23, 2026). */
export async function runProgramMigrationIfNeeded(): Promise<void> {
  const raw = await AsyncStorage.getItem(PROGRAM_MIGRATION_KEY);
  if (raw === String(PROGRAM_CONFIG_VERSION)) {
    return;
  }

  const settings = await loadAppSettings();
  await saveAppSettings({ ...settings, programStartDate: KAIROS_PROGRAM_START });
  await setLiftProgramStartDate(KAIROS_PROGRAM_START);
  await AsyncStorage.setItem(PROGRAM_MIGRATION_KEY, String(PROGRAM_CONFIG_VERSION));
}

export async function resetBothProgramsToStart(): Promise<void> {
  const settings = await loadAppSettings();
  await saveAppSettings({ ...settings, programStartDate: KAIROS_PROGRAM_START });
  await setLiftProgramStartDate(KAIROS_PROGRAM_START);
}
