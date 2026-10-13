/** Goal-based cardio — pick a focus, get a random session (works 2–3×/week). */
import type { CardioMode } from './cardioCoach';
import { toLocalDateKey } from './coreProgress';

export type RunGoalId = 'endurance' | 'vo2' | 'speed' | 'aerobic_base';

export type RunGoalWorkout = {
  id: string;
  title: string;
  estimatedMin: number;
  effort: 'light' | 'normal' | 'farther';
  outdoor: { main: string; detail: string };
  treadmill: { main: string; detail: string };
  bike: { main: string; detail: string };
  why: string;
};

export type RunGoalCategory = {
  id: RunGoalId;
  title: string;
  blurb: string;
  workouts: RunGoalWorkout[];
};

export const runGoalCategories: RunGoalCategory[] = [
  {
    id: 'aerobic_base',
    title: 'Aerobic base',
    blurb: 'Easy volume — builds lung capacity and weekly consistency without frying you.',
    workouts: [
      {
        id: 'ab_easy',
        title: 'Easy conversational',
        estimatedMin: 30,
        effort: 'light',
        outdoor: { main: '2–3 mi easy', detail: 'Nose-breathing, walk breaks OK' },
        treadmill: { main: '25–30 min easy', detail: 'Incline 0.5–1%, no sprinting' },
        bike: { main: '25–35 min easy', detail: 'Light resistance, steady RPM' },
        why: 'Even once a week this keeps your base from sliding backward.',
      },
      {
        id: 'ab_progression',
        title: 'Base + 4 strides',
        estimatedMin: 35,
        effort: 'normal',
        outdoor: { main: '3 mi easy + 4×20 sec strides', detail: 'Strides = smooth, not all-out' },
        treadmill: { main: '30 min easy + 4×20 sec faster', detail: 'Bump speed slightly on strides' },
        bike: { main: '32 min steady + 4×15 sec hard', detail: 'Hard = +2 resistance, not max' },
        why: 'Strides wake up legs without a hard workout day.',
      },
      {
        id: 'ab_longish',
        title: 'Longer easy',
        estimatedMin: 40,
        effort: 'normal',
        outdoor: { main: '3.5–4 mi easy', detail: 'Hold back — should feel repeatable' },
        treadmill: { main: '35–40 min easy', detail: 'Netflix pace' },
        bike: { main: '40–45 min easy', detail: 'Zone 2 feel' },
        why: 'Time on feet matters more than pace when building base.',
      },
    ],
  },
  {
    id: 'endurance',
    title: 'Endurance',
    blurb: 'Slightly longer steady work — teaches your body to hold effort.',
    workouts: [
      {
        id: 'en_steady',
        title: 'Steady state',
        estimatedMin: 35,
        effort: 'normal',
        outdoor: { main: '3–4 mi steady', detail: 'Short sentences only, not gasping' },
        treadmill: { main: '30–35 min steady', detail: 'Incline 1%' },
        bike: { main: '35 min moderate', detail: 'Resistance ~6–7' },
        why: 'One endurance touch per week helps half-marathon prep later.',
      },
      {
        id: 'en_negative',
        title: 'Negative split easy',
        estimatedMin: 32,
        effort: 'normal',
        outdoor: { main: '3 mi — 2nd half slightly quicker', detail: 'Still controlled' },
        treadmill: { main: '28 min — last 10 min +0.3 mph', detail: 'Smooth build' },
        bike: { main: '30 min — last 8 min +1 resistance', detail: 'Same cadence' },
        why: 'Teaches pacing without a formal tempo day.',
      },
    ],
  },
  {
    id: 'vo2',
    title: 'VO₂ / intervals',
    blurb: 'Short hard efforts with full easy recovery — high return, low weekly volume need.',
    workouts: [
      {
        id: 'vo2_classic',
        title: '1-min repeats',
        estimatedMin: 28,
        effort: 'farther',
        outdoor: {
          main: 'Warm-up 10 min + 4×1 min hard / 2 min easy + cool-down',
          detail: 'Hard = 8/10, not sprint',
        },
        treadmill: {
          main: 'Warm-up 8 min + 4×1 min hard / 2 min walk + cool-down',
          detail: 'Use incline 1% on hard',
        },
        bike: {
          main: 'Warm-up 8 min + 5×1 min hard / 2 min easy + cool-down',
          detail: 'Hard = +3–4 resistance',
        },
        why: 'Even 4 intervals once a week improves top-end aerobic power.',
      },
      {
        id: 'vo2_hills',
        title: 'Hill / incline bursts',
        estimatedMin: 30,
        effort: 'farther',
        outdoor: { main: '6×30 sec uphill hard / walk down', detail: 'After 10 min warm-up' },
        treadmill: { main: '6×30 sec @ 4–6% incline / 90 sec flat', detail: 'After warm-up' },
        bike: { main: '8×30 sec hard / 90 sec easy', detail: 'High resistance, low cadence OK' },
        why: 'Low total hard time — good when you only run 2×/week.',
      },
    ],
  },
  {
    id: 'speed',
    title: 'Speed & turnover',
    blurb: 'Strides and short pickups — neuromuscular, not a full speed workout.',
    workouts: [
      {
        id: 'sp_strides',
        title: 'Easy + strides',
        estimatedMin: 28,
        effort: 'light',
        outdoor: { main: '2 mi easy + 6×20 sec strides', detail: '90 sec easy between' },
        treadmill: { main: '20 min easy + 6×20 sec faster', detail: 'Full recovery between' },
        bike: { main: '22 min easy + 6×15 sec spin-ups', detail: 'Fast legs, light load' },
        why: 'Strides improve form with minimal fatigue.',
      },
      {
        id: 'sp_fartlek',
        title: 'Mini fartlek',
        estimatedMin: 30,
        effort: 'normal',
        outdoor: {
          main: '25 min with 5×1 min “comfortably hard”',
          detail: '2 min easy between',
        },
        treadmill: { main: '25 min with 5×1 min faster', detail: 'Not max — controlled' },
        bike: { main: '28 min with 5×45 sec moderate-hard', detail: 'Stay seated' },
        why: 'Playful speed without track intervals.',
      },
    ],
  },
];

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getRunGoalById(id: RunGoalId): RunGoalCategory {
  return runGoalCategories.find((g) => g.id === id) ?? runGoalCategories[0];
}

export function pickRunWorkoutForGoal(
  goalId: RunGoalId,
  dateKey: string = toLocalDateKey()
): RunGoalWorkout {
  const cat = getRunGoalById(goalId);
  const idx = hashSeed(`${dateKey}:${goalId}`) % cat.workouts.length;
  return cat.workouts[idx];
}

export function prescriptionForMode(workout: RunGoalWorkout, mode: CardioMode): {
  main: string;
  detail: string;
} {
  if (mode === 'treadmill') return workout.treadmill;
  if (mode === 'bike') return workout.bike;
  return workout.outdoor;
}
