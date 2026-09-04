// Send / pull workout rows to Google Sheets (Push / Pull / Legs / Upper / Lower).

import { loadAppSettings } from './settingsStorage';
import { toLocalDateKey } from './coreProgress';
import {
  gymWorkouts,
  type DaySchedule,
  type GymExercise,
  type GymWorkout,
} from './gymWorkouts';
import {
  loadGymProgress,
  nextSessionWeightForExercise,
  recordGymSessionCompletion,
  saveGymProgress,
  type ExerciseSessionLog,
  type GymSessionLog,
  type LoggedSet,
  type SetFeel,
} from './gymProgress';

/** Matches Apps Script v8: Date Exercise Set Target Start lb Weight Reps */
export type SheetLogRow = {
  date: string;
  workout: string;
  exercise: string;
  set: number;
  goal: string;
  /** Suggested start weight for the session (optional) */
  startWeight: number | '';
  weight: number | '';
  reps: number | '';
  /** Primary + alternate names for Sheets dropdown */
  exerciseOptions?: string[];
};

function exerciseOptionsFor(exercise: GymExercise): string[] {
  const names = [exercise.name];
  for (const alt of exercise.alternatives ?? []) {
    if (!names.includes(alt.name)) names.push(alt.name);
  }
  return names;
}

export function buildBlankLogRows(
  schedule: Extract<DaySchedule, { kind: 'lift' }>,
  startWeights: Record<string, number | null>,
  dateKey: string = toLocalDateKey()
): SheetLogRow[] {
  const { workout } = schedule;
  const rows: SheetLogRow[] = [];

  for (const exercise of workout.exercises) {
    const goal =
      exercise.repMin === exercise.repMax
        ? String(exercise.repMin)
        : `${exercise.repMin}-${exercise.repMax}`;
    const start = startWeights[exercise.id];
    const options = exerciseOptionsFor(exercise);

    for (let set = 1; set <= exercise.sets; set++) {
      rows.push({
        date: dateKey,
        workout: workout.title,
        exercise: exercise.name,
        set,
        goal,
        startWeight: start != null ? start : '',
        weight: '',
        reps: '',
        exerciseOptions: options,
      });
    }
  }

  return rows;
}

export function buildFilledLogRows(session: GymSessionLog): SheetLogRow[] {
  const rows: SheetLogRow[] = [];

  for (const exercise of session.exercises) {
    for (const set of exercise.sets) {
      rows.push({
        date: session.date,
        workout: session.workoutTitle,
        exercise: exercise.exerciseName,
        set: set.setNumber,
        goal: '',
        startWeight: '',
        weight: set.weightLbs,
        reps: set.reps,
      });
    }
  }

  return rows;
}

export type SheetsSendResult =
  | { ok: true; appended: number; message: string }
  | { ok: false; error: string };

async function sheetsUrl(): Promise<string | null> {
  const settings = await loadAppSettings();
  const url = settings.sheetsWebhookUrl?.trim();
  return url || null;
}

async function postToSheets<T extends { ok?: boolean; error?: string }>(
  body: Record<string, unknown>
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const url = await sheetsUrl();
  if (!url) {
    return { ok: false, error: 'Add your Google Sheets web app URL in Settings first.' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    let data: T;
    try {
      data = JSON.parse(text) as T;
    } catch {
      return {
        ok: false,
        error:
          'Sheet responded with non-JSON. Make sure the Apps Script is deployed as a Web app with access set to "Anyone".',
      };
    }
    if (data.ok === false) {
      return { ok: false, error: data.error ?? 'Sheet rejected request.' };
    }
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? `${e.message} — check your internet connection and Apps Script URL.`
          : 'Network error connecting to Sheets.',
    };
  }
}

export async function cleanGoogleSheetLayout(): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const result = await postToSheets<{ ok?: boolean; message?: string }>({
    action: 'clean_layout',
  });
  if (result.ok === false) return result;
  return {
    ok: true,
    message: result.data.message ?? 'Cleaned sheets layout successfully.',
  };
}

export async function sendRowsToGoogleSheet(rows: SheetLogRow[]): Promise<SheetsSendResult> {
  if (rows.length === 0) return { ok: false, error: 'No rows to send.' };

  const result = await postToSheets<{ ok?: boolean; appended?: number; message?: string }>({
    action: 'append',
    rows,
  });

  if (result.ok === false) return result;
  return {
    ok: true,
    appended: result.data.appended ?? rows.length,
    message: result.data.message ?? `Added ${rows.length} rows.`,
  };
}

export type FetchedSheetRow = {
  date: string;
  workout: string;
  exercise: string;
  set: number;
  goal: string;
  startWeight?: number | '';
  weight: number;
  reps: number;
};

export type SheetsFetchResult =
  | { ok: true; date: string; workout: string; rows: FetchedSheetRow[]; message: string }
  | { ok: false; error: string };

export async function fetchSessionFromGoogleSheet(
  dateKey: string,
  workout?: string
): Promise<SheetsFetchResult> {
  const result = await postToSheets<{
    ok?: boolean;
    date?: string;
    workout?: string;
    rows?: FetchedSheetRow[];
    message?: string;
    error?: string;
  }>({
    action: 'fetch_session',
    date: dateKey,
    workout: workout ?? null,
  });

  if (result.ok === false) return result;

  const rows = result.data.rows ?? [];
  return {
    ok: true,
    date: result.data.date ?? dateKey,
    workout: result.data.workout ?? '',
    rows,
    message: result.data.message ?? `Found ${rows.length} sets.`,
  };
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/[\s_\-]+/g, ' ');
}

type CatalogEntry = {
  id: string;
  name: string;
  workoutId: GymWorkout['id'];
  workoutTitle: string;
  repMin: number;
  repMax: number;
  incrementLbs: number;
  bodyweight?: boolean;
  compound?: boolean;
};

function buildExerciseCatalog(): CatalogEntry[] {
  const list: CatalogEntry[] = [];
  for (const w of Object.values(gymWorkouts)) {
    for (const ex of w.exercises) {
      list.push({
        id: ex.id,
        name: ex.name,
        workoutId: w.id,
        workoutTitle: w.title,
        repMin: ex.repMin,
        repMax: ex.repMax,
        incrementLbs: ex.incrementLbs,
        bodyweight: ex.bodyweight,
        compound: ex.compound,
      });
      for (const alt of ex.alternatives ?? []) {
        list.push({
          id: alt.id,
          name: alt.name,
          workoutId: w.id,
          workoutTitle: w.title,
          repMin: ex.repMin,
          repMax: ex.repMax,
          incrementLbs: alt.incrementLbs ?? ex.incrementLbs,
          bodyweight: alt.bodyweight ?? ex.bodyweight,
          compound: ex.compound,
        });
      }
    }
  }
  return list;
}

function findCatalogEntry(exerciseName: string, workoutTabHint?: string): CatalogEntry | null {
  const norm = normalizeName(exerciseName);
  const catalog = buildExerciseCatalog();

  const exact = catalog.find(
    (c) =>
      normalizeName(c.name) === norm &&
      (!workoutTabHint || normalizeName(c.workoutTitle) === normalizeName(workoutTabHint))
  );
  if (exact) return exact;

  const anyExact = catalog.find((c) => normalizeName(c.name) === norm);
  if (anyExact) return anyExact;

  const partial = catalog.find((c) => {
    const cn = normalizeName(c.name);
    return cn.includes(norm) || norm.includes(cn);
  });
  return partial ?? null;
}

function parseGoal(goalStr: string): { repMin: number; repMax: number } | null {
  if (!goalStr) return null;
  const matchRange = goalStr.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (matchRange) {
    return { repMin: Number(matchRange[1]), repMax: Number(matchRange[2]) };
  }
  const matchSingle = goalStr.match(/(\d+)/);
  if (matchSingle) {
    const n = Number(matchSingle[1]);
    return { repMin: n, repMax: n };
  }
  return null;
}

function inferFeelFromReps(reps: number, repMin: number, repMax: number): SetFeel {
  if (reps >= repMax) return 'easy';
  if (reps <= repMin) return 'hard';
  return 'perfect';
}

function asGymExercise(entry: CatalogEntry): GymExercise {
  return {
    id: entry.id,
    name: entry.name,
    sets: 3,
    repMin: entry.repMin,
    repMax: entry.repMax,
    incrementLbs: entry.incrementLbs,
    restSec: 90,
    bodyweight: entry.bodyweight,
    compound: entry.compound,
  };
}

export type ImportSheetsResult =
  | { ok: true; session: GymSessionLog; filledSets: number; advice: string[] }
  | { ok: false; error: string };

export function sheetRowsToSession(
  dateKey: string,
  workoutTab: string,
  rows: FetchedSheetRow[],
  serverMessage?: string
): ImportSheetsResult {
  if (rows.length === 0) {
    return {
      ok: false,
      error:
        serverMessage ||
        `No filled Weight + Reps found for ${dateKey}. Make sure the Date, Weight, and Reps columns are filled on your sheet.`,
    };
  }

  const byExercise = new Map<string, FetchedSheetRow[]>();
  for (const row of rows) {
    const key = row.exercise;
    const list = byExercise.get(key) ?? [];
    list.push(row);
    byExercise.set(key, list);
  }

  const exercises: ExerciseSessionLog[] = [];
  const advice: string[] = [];
  let workoutId: GymWorkout['id'] = 'push';
  let workoutTitle = workoutTab || 'Imported';

  for (const [exerciseName, setRows] of byExercise) {
    setRows.sort((a, b) => a.set - b.set);
    const hint = setRows[0]?.workout || workoutTab;
    const catalog = findCatalogEntry(exerciseName, hint);
    const goal = parseGoal(setRows[0]?.goal ?? '');
    const repMin = catalog?.repMin ?? goal?.repMin ?? 8;
    const repMax = catalog?.repMax ?? goal?.repMax ?? 12;
    const increment = catalog?.incrementLbs ?? 5;
    const exerciseId = catalog?.id ?? `sheet_${normalizeName(exerciseName).replace(/\s/g, '_')}`;

    if (catalog) {
      workoutId = catalog.workoutId;
      workoutTitle = catalog.workoutTitle;
    }

    const fake: GymExercise = asGymExercise({
      id: exerciseId,
      name: exerciseName,
      workoutId,
      workoutTitle,
      repMin,
      repMax,
      incrementLbs: increment,
      bodyweight: catalog?.bodyweight,
      compound: catalog?.compound,
    });

    const logged: LoggedSet[] = setRows.map((r) => {
      const feel = inferFeelFromReps(r.reps, repMin, repMax);
      return {
        setNumber: r.set,
        weightLbs: r.weight,
        reps: r.reps,
        feel,
        recommendedNextLbs: r.weight,
        adjustment: 'stay',
      };
    });

    const meta = nextSessionWeightForExercise(fake, logged);
    exercises.push({
      exerciseId,
      exerciseName,
      sets: logged,
      nextSessionWeightLbs: meta.weight,
      progressed: meta.progressed,
    });

    advice.push(
      meta.progressed
        ? `${exerciseName}: next start ${meta.weight} lb (hit top of target range)`
        : `${exerciseName}: next start ${meta.weight} lb`
    );
  }

  const session: GymSessionLog = {
    date: dateKey,
    workoutId,
    workoutTitle,
    exercises,
    synced: true,
  };

  return {
    ok: true,
    session,
    filledSets: rows.length,
    advice,
  };
}

export async function syncSessionFromGoogleSheet(
  dateKey: string,
  workout?: string
): Promise<ImportSheetsResult> {
  const fetched = await fetchSessionFromGoogleSheet(dateKey, workout);
  if (fetched.ok === false) return fetched;
  const parsed = sheetRowsToSession(dateKey, fetched.workout, fetched.rows, fetched.message);
  if (parsed.ok === false) return parsed;
  await commitImportedSession(parsed.session);
  return parsed;
}

export async function commitImportedSession(session: GymSessionLog): Promise<void> {
  const state = await loadGymProgress();
  const next = recordGymSessionCompletion(state, session);
  await saveGymProgress(next);
}

export async function previewSessionFromGoogleSheet(
  dateKey: string,
  workout?: string
): Promise<
  | { ok: true; session: GymSessionLog; filledSets: number; advice: string[] }
  | { ok: false; error: string }
> {
  const fetched = await fetchSessionFromGoogleSheet(dateKey, workout);
  if (fetched.ok === false) return fetched;
  return sheetRowsToSession(dateKey, fetched.workout, fetched.rows, fetched.message);
}

export function yesterdayDateKey(from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() - 1);
  return toLocalDateKey(d);
}
