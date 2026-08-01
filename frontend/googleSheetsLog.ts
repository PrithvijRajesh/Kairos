// Send workout rows to Google Sheets (routed to Push / Pull / Legs / Upper / Lower tabs).

import { loadAppSettings } from './settingsStorage';

import { toLocalDateKey } from './coreProgress';

import type { DaySchedule } from './gymWorkouts';

import type { GymSessionLog } from './gymProgress';



/** Matches Apps Script Log columns: Date Workout Exercise Set Goal Weight Reps Feel */

export type SheetLogRow = {

  date: string;

  workout: string;

  exercise: string;

  set: number;

  goal: string;

  weight: number | '';

  reps: number | '';

  feel: string;

};



export function buildBlankLogRows(

  schedule: Extract<DaySchedule, { kind: 'lift' }>,

  _startWeights: Record<string, number | null>,

  dateKey: string = toLocalDateKey()

): SheetLogRow[] {

  const { workout } = schedule;

  const rows: SheetLogRow[] = [];

  for (const exercise of workout.exercises) {

    const goal =

      exercise.repMin === exercise.repMax

        ? String(exercise.repMin)

        : `${exercise.repMin}-${exercise.repMax}`;

    for (let set = 1; set <= exercise.sets; set++) {

      rows.push({

        date: dateKey,

        workout: workout.title,

        exercise: exercise.name,

        set,

        goal,

        weight: '',

        reps: '',

        feel: '',

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

        weight: set.weightLbs,

        reps: set.reps,

        feel: set.feel,

      });

    }

  }

  return rows;

}



export type SheetsSendResult =

  | { ok: true; appended: number; message: string }

  | { ok: false; error: string };



export async function sendRowsToGoogleSheet(rows: SheetLogRow[]): Promise<SheetsSendResult> {

  const settings = await loadAppSettings();

  const url = settings.sheetsWebhookUrl?.trim();

  if (!url) {

    return {

      ok: false,

      error: 'Add your Google Sheets web app URL in Settings first.',

    };

  }

  if (rows.length === 0) {

    return { ok: false, error: 'No rows to send.' };

  }



  try {

    const response = await fetch(url, {

      method: 'POST',

      headers: { 'Content-Type': 'text/plain;charset=utf-8' },

      body: JSON.stringify({ action: 'append', rows }),

    });

    const text = await response.text();

    let data: { ok?: boolean; appended?: number; message?: string; error?: string } = {};

    try {

      data = JSON.parse(text) as typeof data;

    } catch {

      return {

        ok: false,

        error: 'Sheet responded with non-JSON. Check Apps Script deployment.',

      };

    }

    if (!data.ok) {

      return { ok: false, error: data.error ?? 'Sheet rejected the request.' };

    }

    return {

      ok: true,

      appended: data.appended ?? rows.length,

      message: data.message ?? `Added ${rows.length} rows.`,

    };

  } catch (e) {

    return {

      ok: false,

      error:

        e instanceof Error

          ? `${e.message} — need home Wi‑Fi and a valid web app URL.`

          : 'Network error sending to Sheets.',

    };

  }

}


