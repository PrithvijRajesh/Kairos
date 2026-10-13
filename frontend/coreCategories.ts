/** Core categories — mostly rep targets; holds only where time is the right dose. */
import { toLocalDateKey } from './coreProgress';

export type CoreCategoryId = 'fast_burner' | 'running_core' | 'bracing' | 'rotation';

export type CoreStepKind = 'reps' | 'hold';

export type CoreCircuitStep = {
  id: string;
  label: string;
  kind: CoreStepKind;
  /** Reps total, or seconds for holds */
  amount: number;
  /** e.g. per side — amount is per side when true */
  perSide?: boolean;
  note?: string;
};

export type CoreCategoryWorkout = {
  id: string;
  title: string;
  rounds: number;
  restBetweenRoundsSec: number;
  estimatedMin: number;
  steps: CoreCircuitStep[];
  cue: string;
};

export type CoreCategory = {
  id: CoreCategoryId;
  title: string;
  blurb: string;
  workouts: CoreCategoryWorkout[];
};

function stepDetail(step: CoreCircuitStep): string {
  if (step.kind === 'hold') {
    return step.perSide ? `${step.amount}s / side` : `${step.amount}s`;
  }
  return step.perSide ? `${step.amount} / side` : `${step.amount}`;
}

export function formatCoreStep(step: CoreCircuitStep): string {
  const base = stepDetail(step);
  return step.note ? `${base} · ${step.note}` : base;
}

export const coreCategories: CoreCategory[] = [
  {
    id: 'fast_burner',
    title: 'Fast burner',
    blurb: 'High-rep circuits. Finish in 10–15 minutes.',
    workouts: [
      {
        id: 'fb_classic',
        title: 'Bike · suitcase · twist',
        rounds: 2,
        restBetweenRoundsSec: 60,
        estimatedMin: 12,
        cue: 'Clean reps beat speed on round 2.',
        steps: [
          { id: 's1', label: 'Bicycle crunches', kind: 'reps', amount: 50, note: '25/side' },
          { id: 's2', label: 'Suitcase crunches', kind: 'reps', amount: 30 },
          { id: 's3', label: 'Russian twists', kind: 'reps', amount: 40, note: '20/side' },
          { id: 's4', label: 'Bear hold', kind: 'hold', amount: 30 },
          { id: 's5', label: 'Plank shoulder taps', kind: 'reps', amount: 30 },
        ],
      },
      {
        id: 'fb_abs',
        title: 'Abs ladder',
        rounds: 2,
        restBetweenRoundsSec: 50,
        estimatedMin: 11,
        cue: 'Ribs down — stop if low back arches.',
        steps: [
          { id: 's1', label: 'Reverse crunch', kind: 'reps', amount: 15 },
          { id: 's2', label: 'Dead bug', kind: 'reps', amount: 10, perSide: true },
          { id: 's3', label: 'Hollow hold (tucked)', kind: 'hold', amount: 25 },
          { id: 's4', label: 'Mountain climbers', kind: 'reps', amount: 40 },
        ],
      },
      {
        id: 'fb_finisher',
        title: 'Short finisher',
        rounds: 1,
        restBetweenRoundsSec: 0,
        estimatedMin: 8,
        cue: 'One clean round after lifting.',
        steps: [
          { id: 's1', label: 'Bicycle crunches', kind: 'reps', amount: 40 },
          { id: 's2', label: 'Russian twists', kind: 'reps', amount: 40 },
          { id: 's3', label: 'Front plank', kind: 'hold', amount: 45 },
          { id: 's4', label: 'Suitcase crunch', kind: 'reps', amount: 12, perSide: true },
        ],
      },
      {
        id: 'fb_burn',
        title: 'Burn set',
        rounds: 3,
        restBetweenRoundsSec: 40,
        estimatedMin: 12,
        cue: 'Same numbers each round — form first.',
        steps: [
          { id: 's1', label: 'Flutter kicks', kind: 'reps', amount: 40 },
          { id: 's2', label: 'Sit-up', kind: 'reps', amount: 15 },
          { id: 's3', label: 'Side plank', kind: 'hold', amount: 20, perSide: true },
        ],
      },
    ],
  },
  {
    id: 'running_core',
    title: 'Running core',
    blurb: 'Hips and trunk for posture and power on runs.',
    workouts: [
      {
        id: 'rc_single',
        title: 'Single-leg stability',
        rounds: 2,
        restBetweenRoundsSec: 55,
        estimatedMin: 14,
        cue: 'Hips level — no twisting.',
        steps: [
          { id: 's1', label: 'Single-leg glute bridge', kind: 'reps', amount: 10, perSide: true },
          { id: 's2', label: 'Side-lying hip adduction', kind: 'reps', amount: 12, perSide: true },
          { id: 's3', label: 'Bird dog', kind: 'reps', amount: 8, perSide: true, note: '2s pause' },
          { id: 's4', label: 'Side plank', kind: 'hold', amount: 25, perSide: true },
        ],
      },
      {
        id: 'rc_posture',
        title: 'Run posture stack',
        rounds: 2,
        restBetweenRoundsSec: 45,
        estimatedMin: 12,
        cue: 'Slow shoulder taps — resist rotation.',
        steps: [
          { id: 's1', label: 'Dead bug', kind: 'reps', amount: 8, perSide: true },
          { id: 's2', label: 'Plank shoulder taps', kind: 'reps', amount: 20 },
          { id: 's3', label: 'Clamshell', kind: 'reps', amount: 15, perSide: true },
          { id: 's4', label: 'Front plank', kind: 'hold', amount: 35 },
        ],
      },
      {
        id: 'rc_reset',
        title: 'Post-run reset',
        rounds: 1,
        restBetweenRoundsSec: 0,
        estimatedMin: 10,
        cue: 'Easy breathing — recovery-friendly.',
        steps: [
          { id: 's1', label: 'Glute bridge', kind: 'reps', amount: 15, note: '2s squeeze' },
          { id: 's2', label: 'Dead bug', kind: 'reps', amount: 10, perSide: true },
          { id: 's3', label: 'Side plank', kind: 'hold', amount: 30, perSide: true },
          { id: 's4', label: 'Windshield wiper', kind: 'reps', amount: 6, perSide: true },
        ],
      },
    ],
  },
  {
    id: 'bracing',
    title: 'Bracing',
    blurb: 'Anti-extension strength — solid trunk under load.',
    workouts: [
      {
        id: 'br_plank',
        title: 'Plank + dead bug',
        rounds: 2,
        restBetweenRoundsSec: 50,
        estimatedMin: 12,
        cue: 'Exhale without losing brace.',
        steps: [
          { id: 's1', label: 'Front plank', kind: 'hold', amount: 40 },
          { id: 's2', label: 'Dead bug', kind: 'reps', amount: 8, perSide: true },
          { id: 's3', label: 'Side plank', kind: 'hold', amount: 25, perSide: true },
          { id: 's4', label: 'Bear hold', kind: 'hold', amount: 30 },
        ],
      },
      {
        id: 'br_hollow',
        title: 'Hollow focus',
        rounds: 3,
        restBetweenRoundsSec: 40,
        estimatedMin: 11,
        cue: 'Low back glued to floor.',
        steps: [
          { id: 's1', label: 'Hollow hold (tucked)', kind: 'hold', amount: 25 },
          { id: 's2', label: 'Dead bug', kind: 'reps', amount: 10, perSide: true },
          { id: 's3', label: 'Front plank', kind: 'hold', amount: 30 },
        ],
      },
      {
        id: 'br_bird',
        title: 'Bird dog control',
        rounds: 2,
        restBetweenRoundsSec: 45,
        estimatedMin: 10,
        cue: 'Reach long — hips square.',
        steps: [
          { id: 's1', label: 'Bird dog', kind: 'reps', amount: 10, perSide: true },
          { id: 's2', label: 'Front plank', kind: 'hold', amount: 35 },
          { id: 's3', label: 'Glute bridge', kind: 'reps', amount: 12 },
        ],
      },
    ],
  },
  {
    id: 'rotation',
    title: 'Rotation',
    blurb: 'Obliques and controlled twist — not sit-up spam.',
    workouts: [
      {
        id: 'rot_twist',
        title: 'Twist & side',
        rounds: 2,
        restBetweenRoundsSec: 50,
        estimatedMin: 12,
        cue: 'Rotate from ribs, not arms.',
        steps: [
          { id: 's1', label: 'Russian twists', kind: 'reps', amount: 40 },
          { id: 's2', label: 'Side plank', kind: 'hold', amount: 30, perSide: true },
          { id: 's3', label: 'Windshield wiper', kind: 'reps', amount: 8, perSide: true },
          { id: 's4', label: 'Suitcase crunch', kind: 'reps', amount: 12, perSide: true },
        ],
      },
      {
        id: 'rot_anti',
        title: 'Anti-rotation',
        rounds: 2,
        restBetweenRoundsSec: 45,
        estimatedMin: 11,
        cue: 'Resist twisting — hips square.',
        steps: [
          { id: 's1', label: 'Plank shoulder taps', kind: 'reps', amount: 24 },
          { id: 's2', label: 'Dead bug', kind: 'reps', amount: 8, perSide: true },
          { id: 's3', label: 'Bicycle crunch', kind: 'reps', amount: 30 },
          { id: 's4', label: 'Side plank', kind: 'hold', amount: 25, perSide: true },
        ],
      },
      {
        id: 'rot_quick',
        title: 'Oblique hit',
        rounds: 1,
        restBetweenRoundsSec: 0,
        estimatedMin: 8,
        cue: 'Short and sharp add-on.',
        steps: [
          { id: 's1', label: 'Bicycle crunches', kind: 'reps', amount: 40 },
          { id: 's2', label: 'Russian twists', kind: 'reps', amount: 40 },
          { id: 's3', label: 'Side plank', kind: 'hold', amount: 25, perSide: true },
        ],
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

export function getCategoryById(id: CoreCategoryId): CoreCategory {
  return coreCategories.find((c) => c.id === id) ?? coreCategories[0];
}

export function pickWorkoutForCategory(
  categoryId: CoreCategoryId,
  dateKey: string = toLocalDateKey()
): CoreCategoryWorkout {
  const cat = getCategoryById(categoryId);
  const idx = hashSeed(`${dateKey}:${categoryId}`) % cat.workouts.length;
  return cat.workouts[idx];
}
