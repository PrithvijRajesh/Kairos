// Export a fillable CSV worksheet at home; import it after the gym.
import { Share } from 'react-native';

import { toLocalDateKey } from './coreProgress';
import {
  nextSessionWeightForExercise,
  recommendNextWeight,
  recordGymSessionCompletion,
  loadGymProgress,
  saveGymProgress,
  type ExerciseSessionLog,
  type GymSessionLog,
  type LoggedSet,
  type SetFeel,
} from './gymProgress';
import {
  formatRepRange,
  getWorkoutWarmupPlan,
  type DaySchedule,
  type GymWorkout,
} from './gymWorkouts';

const HEADER =
  'exercise_id,exercise_name,set,target_min,target_max,suggested_weight_lbs,weight_lbs,reps,feel,notes';

function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildWorksheetCsv(
  schedule: Extract<DaySchedule, { kind: 'lift' }>,
  startWeights: Record<string, number | null>,
  dateKey: string = toLocalDateKey()
): string {
  const { workout, label } = schedule;
  const warmup = getWorkoutWarmupPlan(workout, startWeights);
  const lines: string[] = [
    '# Kairos gym worksheet — fill weight_lbs, reps, feel (easy|perfect|hard)',
    `# date=${dateKey}`,
    `# label=${label}`,
    `# workout_id=${workout.id}`,
    `# workout_title=${workout.title}`,
    '#',
    '# Warm-ups (do these, no need to log):',
  ];

  for (const item of warmup) {
    lines.push(`# ${item.kind === 'main' ? 'MAIN' : 'FEEDER'}: ${item.exerciseName}`);
    for (const line of item.lines) {
      lines.push(`#   ${line}`);
    }
  }

  lines.push('#');
  lines.push(HEADER);

  for (const exercise of workout.exercises) {
    const suggested = startWeights[exercise.id];
    for (let set = 1; set <= exercise.sets; set++) {
      lines.push(
        [
          csvEscape(exercise.id),
          csvEscape(exercise.name),
          set,
          exercise.repMin,
          exercise.repMax,
          suggested != null ? suggested : '',
          '', // weight_lbs — fill at gym
          '', // reps
          '', // feel
          '', // notes
        ].join(',')
      );
    }
  }

  return lines.join('\n');
}

export function buildWorksheetPlainText(
  schedule: Extract<DaySchedule, { kind: 'lift' }>,
  startWeights: Record<string, number | null>,
  dateKey: string = toLocalDateKey()
): string {
  const { workout, label } = schedule;
  const warmup = getWorkoutWarmupPlan(workout, startWeights);
  const parts: string[] = [
    `KAIROS WORKOUT SHEET`,
    `${label}`,
    `Date: ${dateKey}`,
    `Focus: ${workout.focus}`,
    '',
    'WARM-UPS',
  ];

  for (const item of warmup) {
    parts.push(`- ${item.exerciseName} (${item.kind})`);
    for (const line of item.lines) {
      parts.push(`    ${line}`);
    }
  }

  parts.push('', 'WORKING SETS (fill Weight / Reps / Feel: easy|perfect|hard)', '');

  for (const exercise of workout.exercises) {
    const suggested = startWeights[exercise.id];
    parts.push(
      `${exercise.name}  ·  ${formatRepRange(exercise)}` +
        (suggested != null ? `  ·  start ~${suggested} lb` : '')
    );
    if (exercise.notes) parts.push(`  note: ${exercise.notes}`);
    for (let set = 1; set <= exercise.sets; set++) {
      parts.push(`  Set ${set}: Weight ____  Reps ____  Feel ____`);
    }
    parts.push('');
  }

  parts.push(
    'When home: open Kairos → Lift → Import sheet → paste the CSV you filled,',
    'or re-type numbers into the Import screen from this note.'
  );

  return parts.join('\n');
}

export async function shareWorksheet(csv: string, plainText: string, title: string): Promise<void> {
  await Share.share({
    title,
    message: `${plainText}\n\n----- CSV (paste this back into Kairos Import) -----\n${csv}`,
  });
}

type CsvRow = {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  weightLbs: number;
  reps: number;
  feel: SetFeel;
};

function parseFeel(raw: string): SetFeel | null {
  const v = raw.trim().toLowerCase();
  if (v === 'easy' || v === 'perfect' || v === 'hard') return v;
  return null;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

export type ImportResult =
  | { ok: true; session: GymSessionLog; filledSets: number }
  | { ok: false; error: string };

/**
 * Parse a filled Kairos CSV (or Share blob containing the CSV section).
 */
export function parseWorksheetCsv(raw: string): ImportResult {
  let text = raw.trim();
  const csvMarker = '----- CSV';
  const markerIdx = text.indexOf(csvMarker);
  if (markerIdx >= 0) {
    const after = text.slice(markerIdx);
    const nl = after.indexOf('\n');
    text = nl >= 0 ? after.slice(nl + 1) : '';
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let date = toLocalDateKey();
  let workoutId = 'custom';
  let workoutTitle = 'Imported workout';

  for (const line of lines) {
    if (line.startsWith('# date=')) date = line.slice('# date='.length).trim();
    if (line.startsWith('# workout_id=')) workoutId = line.slice('# workout_id='.length).trim();
    if (line.startsWith('# workout_title=')) {
      workoutTitle = line.slice('# workout_title='.length).trim();
    }
  }

  const dataLines = lines.filter((l) => !l.startsWith('#') && !l.startsWith('exercise_id'));
  const rows: CsvRow[] = [];

  for (const line of dataLines) {
    const cells = parseCsvLine(line);
    if (cells.length < 9) continue;
    const [
      exerciseId,
      exerciseName,
      setStr,
      ,
      ,
      ,
      weightStr,
      repsStr,
      feelStr,
    ] = cells;

    const weightLbs = Number(weightStr);
    const reps = Number(repsStr);
    const feel = parseFeel(feelStr ?? '');
    if (!exerciseId || !Number.isFinite(Number(setStr))) continue;
    // Skip blank rows the user never filled
    if (!weightStr?.trim() && !repsStr?.trim() && !feelStr?.trim()) continue;
    if (!Number.isFinite(weightLbs) || weightLbs < 0) {
      return { ok: false, error: `Bad weight on ${exerciseName} set ${setStr}` };
    }
    if (!Number.isFinite(reps) || reps <= 0) {
      return { ok: false, error: `Bad reps on ${exerciseName} set ${setStr}` };
    }
    if (!feel) {
      return {
        ok: false,
        error: `Feel must be easy, perfect, or hard on ${exerciseName} set ${setStr}`,
      };
    }

    rows.push({
      exerciseId: exerciseId.trim(),
      exerciseName: exerciseName.trim(),
      setNumber: Number(setStr),
      weightLbs,
      reps,
      feel,
    });
  }

  if (rows.length === 0) {
    return { ok: false, error: 'No filled sets found. Fill weight, reps, and feel columns.' };
  }

  const byExercise = new Map<string, CsvRow[]>();
  for (const row of rows) {
    const list = byExercise.get(row.exerciseId) ?? [];
    list.push(row);
    byExercise.set(row.exerciseId, list);
  }

  const exercises: ExerciseSessionLog[] = [];
  for (const [, setRows] of byExercise) {
    setRows.sort((a, b) => a.setNumber - b.setNumber);
    const name = setRows[0].exerciseName;
    const exerciseId = setRows[0].exerciseId;
    const logged: LoggedSet[] = setRows.map((r) => {
      // Reconstruct a minimal exercise for recommendation math
      const fakeExercise = {
        id: exerciseId,
        name,
        sets: setRows.length,
        repMin: r.reps,
        repMax: r.reps,
        incrementLbs: 5,
        restSec: 90,
      };
      const rec = recommendNextWeight(fakeExercise, r.weightLbs, r.reps, r.feel);
      return {
        setNumber: r.setNumber,
        weightLbs: r.weightLbs,
        reps: r.reps,
        feel: r.feel,
        recommendedNextLbs: rec.nextWeightLbs,
        adjustment: rec.adjustment,
      };
    });

    const last = logged[logged.length - 1];
    exercises.push({
      exerciseId,
      exerciseName: name,
      sets: logged,
      nextSessionWeightLbs: last.weightLbs,
      progressed: false,
    });
  }

  // Refine next-session weights using real set history when possible
  for (const ex of exercises) {
    const fake = {
      id: ex.exerciseId,
      name: ex.exerciseName,
      sets: ex.sets.length,
      repMin: Math.min(...ex.sets.map((s) => s.reps)),
      repMax: Math.max(...ex.sets.map((s) => s.reps)),
      incrementLbs: 5,
      restSec: 90,
    };
    const meta = nextSessionWeightForExercise(fake, ex.sets);
    ex.nextSessionWeightLbs = meta.weight;
    ex.progressed = meta.progressed;
  }

  const session: GymSessionLog = {
    date,
    workoutId,
    workoutTitle,
    exercises,
    synced: false,
  };

  return { ok: true, session, filledSets: rows.length };
}

export async function importWorksheetAndSave(raw: string): Promise<ImportResult> {
  const parsed = parseWorksheetCsv(raw);
  if (!parsed.ok) return parsed;

  const state = await loadGymProgress();
  const next = recordGymSessionCompletion(state, parsed.session);
  await saveGymProgress(next);
  return parsed;
}

/** Convenience for typing — workout unused but keeps API clear */
export function worksheetFilename(workout: GymWorkout, dateKey: string): string {
  return `kairos-${workout.id}-${dateKey}.csv`;
}
