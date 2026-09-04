// Your programmed lift split — calendar-based, fully offline.

import { formatProgramStartLabel } from './coreWorkouts';

export type ExerciseAlternative = {
  /** Unique id so weight history stays separate from the primary lift */
  id: string;
  name: string;
  notes?: string;
  bodyweight?: boolean;
  incrementLbs?: number;
};

export type GymExercise = {
  id: string;
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
  /** Typical bump when progressing (lbs). Dumbbells often 5. */
  incrementLbs: number;
  restSec: number;
  notes?: string;
  /** Bodyweight movement — 0 lb is valid */
  bodyweight?: boolean;
  /** Big lift that needs a warm-up; isolations stay false */
  compound?: boolean;
  /** Same-pattern swaps when equipment is taken */
  alternatives?: ExerciseAlternative[];
  /** Set when swapped away from the programmed lift */
  primaryId?: string;
  /** Original programmed exercise (for restoring / listing alts) */
  primarySnapshot?: GymExercise;
};

export type GymWorkout = {
  id: 'push' | 'pull' | 'legs' | 'upper' | 'lower';
  title: string;
  focus: string;
  estimatedMin: number;
  exercises: GymExercise[];
};

export type DaySchedule =
  | { kind: 'lift'; workout: GymWorkout; label: string }
  | { kind: 'rest'; label: string; hint: string };

/**
 * Final program goals: stronger, slightly denser (sleeper), strong legs + core for running.
 *
 * Week: Push → Pull → Legs → Rest → Upper → Lower → Rest
 *
 * Rules:
 * - Push/Legs = strength (lower reps, longer rest). Upper/Lower = volume (8–12).
 * - Leave ~1–2 reps in reserve on compounds. Hit top of range → add weight next time.
 * - Rest days recover — sleep and eat beat extra junk volume.
 */
export const gymWorkouts: Record<GymWorkout['id'], GymWorkout> = {
  push: {
    id: 'push',
    title: 'Push',
    focus: 'Chest · shoulders · triceps',
    estimatedMin: 55,
    exercises: [
      {
        id: 'flat_machine_chest',
        name: 'Machine Chest Press',
        sets: 4,
        repMin: 5,
        repMax: 8,
        incrementLbs: 10,
        restSec: 150,
        notes: 'Main chest press · squeeze at lockout · hit 8 on all sets → add weight next time',
        compound: true,
        alternatives: [
          {
            id: 'flat_bb_bench',
            name: 'Barbell Bench Press',
            notes: 'Main lift · feet planted · pause on chest',
            incrementLbs: 5,
          },
          {
            id: 'flat_db_bench',
            name: 'Flat Dumbbell Bench Press',
            notes: 'Per dumbbell',
            incrementLbs: 5,
          },
        ],
      },
      {
        id: 'incline_db_press',
        name: 'Incline Dumbbell Press',
        sets: 3,
        repMin: 6,
        repMax: 10,
        incrementLbs: 5,
        restSec: 120,
        notes: 'Per dumbbell · 30–45° incline · controlled lower',
        compound: true,
        alternatives: [
          {
            id: 'incline_machine_press',
            name: 'Incline Machine Press',
            incrementLbs: 10,
          },
        ],
      },
      {
        id: 'seated_db_shoulder_press',
        name: 'Seated Dumbbell Shoulder Press',
        sets: 3,
        repMin: 6,
        repMax: 8,
        incrementLbs: 5,
        restSec: 120,
        notes: 'Per dumbbell · lower to ear level · press straight up',
        compound: true,
        alternatives: [
          {
            id: 'machine_shoulder_press',
            name: 'Machine Shoulder Press',
            incrementLbs: 10,
          },
          {
            id: 'standing_db_ohp',
            name: 'Standing Dumbbell Shoulder Press',
            notes: 'Per dumbbell · brace core',
            incrementLbs: 5,
          },
        ],
      },
      {
        id: 'db_lateral_raise',
        name: 'Dumbbell Lateral Raises',
        sets: 3,
        repMin: 10,
        repMax: 15,
        incrementLbs: 2.5,
        restSec: 60,
        notes: 'Per dumbbell · slight lean · lead with elbows',
        compound: false,
        alternatives: [
          { id: 'cable_lateral_raise', name: 'Cable Lateral Raises', incrementLbs: 5 },
          { id: 'lateral_machine', name: 'Machine Lateral Raise', incrementLbs: 5 },
        ],
      },
      {
        id: 'rope_pushdown',
        name: 'Rope Pushdowns',
        sets: 3,
        repMin: 8,
        repMax: 12,
        incrementLbs: 5,
        restSec: 60,
        notes: 'Elbows pinned · spread rope at bottom · lateral triceps',
        compound: false,
        alternatives: [
          { id: 'bar_pushdown', name: 'Straight-Bar Pushdowns', incrementLbs: 5 },
        ],
      },
      {
        id: 'oh_cable_tricep_ext',
        name: 'Overhead Cable Triceps Extension',
        sets: 3,
        repMin: 10,
        repMax: 15,
        incrementLbs: 5,
        restSec: 60,
        notes: 'Long head focus · elbows stay high · deep stretch',
        compound: false,
        alternatives: [
          {
            id: 'seated_oh_db_tricep',
            name: 'Seated Dumbbell Overhead Extension',
            notes: 'Both hands on one DB · slow lower',
            incrementLbs: 5,
          },
          {
            id: 'skull_crushers',
            name: 'Skull Crushers (EZ-Bar)',
            incrementLbs: 5,
          },
        ],
      },
    ],
  },

  pull: {
    id: 'pull',
    title: 'Pull',
    focus: 'Back · biceps · grip',
    estimatedMin: 55,
    exercises: [
      {
        id: 'pullups',
        name: 'Pull-Ups',
        sets: 4,
        repMin: 5,
        repMax: 8,
        incrementLbs: 5,
        restSec: 180,
        bodyweight: true,
        notes: 'Vertical pull · log added lb (0 if BW) · pull chest to bar',
        compound: true,
        alternatives: [
          {
            id: 'lat_pulldown_pull',
            name: 'Lat Pulldown',
            bodyweight: false,
            incrementLbs: 10,
            notes: 'Pull to upper chest · no bouncing',
          },
        ],
      },
      {
        id: 'chest_supported_row',
        name: 'Chest Supported Row',
        sets: 4,
        repMin: 5,
        repMax: 8,
        incrementLbs: 5,
        restSec: 150,
        notes: 'Horizontal pull · squeeze 1 sec at top',
        compound: true,
        alternatives: [
          { id: 'machine_row', name: 'Machine Row', incrementLbs: 10 },
          {
            id: 'seated_cable_row',
            name: 'Seated Cable Row',
            notes: 'Stretch at front · no hip rock',
            incrementLbs: 10,
          },
          {
            id: 'one_arm_db_row',
            name: 'One-Arm Dumbbell Row',
            notes: 'Same reps each arm',
            incrementLbs: 5,
          },
        ],
      },
      {
        id: 'face_pulls',
        name: 'Face Pulls',
        sets: 3,
        repMin: 12,
        repMax: 15,
        incrementLbs: 5,
        restSec: 60,
        notes: 'Upper back / rear delts · elbows high · external rotation',
        compound: false,
        alternatives: [
          { id: 'reverse_pec_deck', name: 'Reverse Pec Deck', incrementLbs: 5 },
        ],
      },
      {
        id: 'cable_curl',
        name: 'Cable Curl',
        sets: 3,
        repMin: 8,
        repMax: 12,
        incrementLbs: 5,
        restSec: 60,
        notes: 'Elbows pinned · full stretch · main biceps',
        compound: false,
        alternatives: [
          {
            id: 'standing_db_curl',
            name: 'Dumbbell Curl',
            notes: 'Per dumbbell',
            incrementLbs: 2.5,
          },
          { id: 'ez_curl_pull', name: 'EZ-Bar Curl', incrementLbs: 5 },
        ],
      },
      {
        id: 'hammer_curl_pull',
        name: 'Hammer Curl',
        sets: 3,
        repMin: 10,
        repMax: 15,
        incrementLbs: 2.5,
        restSec: 60,
        notes: 'Per dumbbell · brachialis / forearm thickness',
        compound: false,
        alternatives: [
          {
            id: 'rope_hammer_curl',
            name: 'Rope Hammer Curl',
            incrementLbs: 5,
          },
          {
            id: 'incline_db_curl',
            name: 'Incline Dumbbell Curl',
            notes: 'Per dumbbell',
            incrementLbs: 2.5,
          },
        ],
      },
      {
        id: 'dead_hang',
        name: 'Dead Hang',
        sets: 2,
        repMin: 20,
        repMax: 40,
        incrementLbs: 5,
        restSec: 75,
        bodyweight: true,
        notes: 'Hold seconds · log 0 · grip + scapular health',
        compound: false,
        alternatives: [
          {
            id: 'dead_hang_towel',
            name: 'Towel Dead Hang',
            bodyweight: true,
            notes: 'Harder grip · hold seconds',
          },
        ],
      },
    ],
  },

  legs: {
    id: 'legs',
    title: 'Legs',
    focus: 'Quads · hamstrings · calves',
    estimatedMin: 55,
    exercises: [
      {
        id: 'back_squat',
        name: 'Back Squat',
        sets: 4,
        repMin: 5,
        repMax: 8,
        incrementLbs: 10,
        restSec: 180,
        notes: 'Main strength lift · leave 1–2 in reserve · hit 8 on all sets → add weight next time',
        compound: true,
        alternatives: [
          { id: 'hack_squat', name: 'Hack Squat', incrementLbs: 20 },
          {
            id: 'goblet_squat',
            name: 'Goblet Squat',
            incrementLbs: 5,
            notes: 'DB or KB',
          },
        ],
      },
      {
        id: 'leg_press',
        name: 'Leg Press',
        sets: 3,
        repMin: 8,
        repMax: 12,
        incrementLbs: 20,
        restSec: 120,
        notes: 'Controlled depth · solid quad volume without lower-back strain',
        compound: true,
        alternatives: [
          { id: 'hack_squat_press', name: 'Hack Squat', incrementLbs: 20 },
        ],
      },
      {
        id: 'leg_extension',
        name: 'Leg Extension',
        sets: 3,
        repMin: 10,
        repMax: 15,
        incrementLbs: 10,
        restSec: 60,
        notes: 'Quad isolation · knee drive for running · squeeze 1 sec at top',
        compound: false,
        alternatives: [
          {
            id: 'leg_press_quad',
            name: 'Leg Press',
            notes: 'Higher reps, feet lower on platform',
            incrementLbs: 20,
          },
        ],
      },
      {
        id: 'seated_leg_curl',
        name: 'Seated Leg Curl',
        sets: 3,
        repMin: 8,
        repMax: 12,
        incrementLbs: 10,
        restSec: 75,
        notes: 'Hamstring strength · slow lower · balances quads & supports running',
        compound: false,
        alternatives: [
          { id: 'lying_leg_curl', name: 'Lying Leg Curl', incrementLbs: 10 },
        ],
      },
      {
        id: 'hyperextension_45',
        name: '45° Hyperextension',
        sets: 3,
        repMin: 8,
        repMax: 12,
        incrementLbs: 5,
        restSec: 90,
        notes: 'Posterior chain · squeeze glutes at top · if no bench, use cable pull-through',
        compound: true,
        alternatives: [
          {
            id: 'cable_pull_through',
            name: 'Cable Pull-Through',
            notes: 'Hinge hips back into cable · squeeze glutes at top',
            incrementLbs: 10,
          },
          {
            id: 'back_extension_machine',
            name: 'Back Extension Machine',
            incrementLbs: 10,
          },
          {
            id: 'bb_hip_thrust_legs',
            name: 'Barbell Hip Thrust',
            notes: 'Upper back on bench · pause 1 sec at top',
            incrementLbs: 10,
          },
          {
            id: 'hyperextension_bw',
            name: '45° Hyperextension (bodyweight)',
            bodyweight: true,
            notes: 'Log 0 if unweighted',
          },
        ],
      },
      {
        id: 'seated_calf',
        name: 'Seated Calf Raises',
        sets: 4,
        repMin: 10,
        repMax: 15,
        incrementLbs: 10,
        restSec: 60,
        notes: 'Full stretch at bottom · pause at top · ankle durability for running',
        compound: false,
        alternatives: [
          {
            id: 'leg_press_calf',
            name: 'Leg Press Calf Raises',
            notes: 'Balls of feet on platform edge · full stretch',
            incrementLbs: 20,
          },
          {
            id: 'single_leg_db_calf',
            name: 'Single-Leg Dumbbell Calf Raise',
            notes: 'Holding a DB · same reps each side',
            incrementLbs: 5,
          },
          {
            id: 'standing_calf_raise',
            name: 'Standing Calf Raises',
            incrementLbs: 10,
          },
        ],
      },
    ],
  },

  upper: {
    id: 'upper',
    title: 'Upper',
    focus: 'Press · pull · shoulders · arms',
    estimatedMin: 55,
    exercises: [
      {
        id: 'upper_incline_db',
        name: 'Incline Dumbbell Press',
        sets: 3,
        repMin: 8,
        repMax: 12,
        incrementLbs: 5,
        restSec: 120,
        notes: 'Per dumbbell · ~30° bench · controlled reps',
        compound: true,
        alternatives: [
          {
            id: 'upper_incline_machine',
            name: 'Incline Machine Press',
            incrementLbs: 10,
          },
        ],
      },
      {
        id: 'upper_lat_pulldown',
        name: 'Lat Pulldown',
        sets: 3,
        repMin: 8,
        repMax: 12,
        incrementLbs: 10,
        restSec: 90,
        notes: 'Full stretch at top · pull to collarbone',
        compound: true,
        alternatives: [
          {
            id: 'upper_pullups',
            name: 'Pull-Ups',
            bodyweight: true,
            incrementLbs: 5,
          },
        ],
      },
      {
        id: 'upper_cable_row',
        name: 'Seated Cable Row',
        sets: 3,
        repMin: 8,
        repMax: 12,
        incrementLbs: 10,
        restSec: 90,
        notes: 'Squeeze shoulder blades together · neutral grip',
        compound: true,
        alternatives: [
          { id: 'upper_machine_row', name: 'Machine Row', incrementLbs: 10 },
          { id: 'upper_cs_row', name: 'Chest Supported Row', incrementLbs: 5 },
        ],
      },
      {
        id: 'upper_lat_raises',
        name: 'Dumbbell Lateral Raises',
        sets: 3,
        repMin: 12,
        repMax: 15,
        incrementLbs: 2.5,
        restSec: 60,
        notes: 'Per dumbbell · strict form',
        compound: false,
        alternatives: [
          { id: 'upper_cable_lateral', name: 'Cable Lateral Raises', incrementLbs: 5 },
        ],
      },
      {
        id: 'upper_triceps',
        name: 'Rope Pushdowns',
        sets: 3,
        repMin: 10,
        repMax: 12,
        incrementLbs: 5,
        restSec: 60,
        notes: 'Lock out and spread rope',
        compound: false,
        alternatives: [
          { id: 'upper_bar_pushdown', name: 'Straight-Bar Pushdowns', incrementLbs: 5 },
          { id: 'upper_oh_ext', name: 'Overhead Cable Triceps Extension', incrementLbs: 5 },
        ],
      },
      {
        id: 'upper_biceps',
        name: 'Incline Dumbbell Curl',
        sets: 3,
        repMin: 10,
        repMax: 12,
        incrementLbs: 2.5,
        restSec: 60,
        notes: 'Per dumbbell · deep biceps stretch',
        compound: false,
        alternatives: [
          { id: 'upper_cable_curl', name: 'Cable Curl', incrementLbs: 5 },
          { id: 'upper_hammer_curl', name: 'Hammer Curl', incrementLbs: 2.5 },
        ],
      },
    ],
  },

  lower: {
    id: 'lower',
    title: 'Lower',
    focus: 'Hinge · quads · hamstrings · calves',
    estimatedMin: 50,
    exercises: [
      {
        id: 'lower_hip_thrust',
        name: 'Hip Thrust Machine',
        sets: 3,
        repMin: 8,
        repMax: 12,
        incrementLbs: 10,
        restSec: 120,
        notes: 'Posterior chain · pause at lockout',
        compound: true,
        alternatives: [
          { id: 'lower_bb_hip_thrust', name: 'Barbell Hip Thrust', incrementLbs: 10 },
          {
            id: 'lower_cable_pull_through',
            name: 'Cable Pull-Through',
            incrementLbs: 10,
          },
        ],
      },
      {
        id: 'lower_leg_press',
        name: 'Leg Press',
        sets: 3,
        repMin: 8,
        repMax: 12,
        incrementLbs: 20,
        restSec: 120,
        notes: 'Controlled depth',
        compound: true,
        alternatives: [
          { id: 'lower_hack_squat', name: 'Hack Squat', incrementLbs: 20 },
          { id: 'lower_back_squat', name: 'Back Squat', incrementLbs: 10 },
        ],
      },
      {
        id: 'lower_seated_curl',
        name: 'Seated Leg Curl',
        sets: 3,
        repMin: 8,
        repMax: 12,
        incrementLbs: 10,
        restSec: 75,
        compound: false,
        alternatives: [
          { id: 'lower_lying_curl', name: 'Lying Leg Curl', incrementLbs: 10 },
        ],
      },
      {
        id: 'lower_leg_extension',
        name: 'Leg Extension',
        sets: 3,
        repMin: 10,
        repMax: 12,
        incrementLbs: 10,
        restSec: 60,
        compound: false,
      },
      {
        id: 'lower_calf',
        name: 'Seated Calf Raises',
        sets: 3,
        repMin: 10,
        repMax: 15,
        incrementLbs: 10,
        restSec: 60,
        compound: false,
        alternatives: [
          {
            id: 'lower_leg_press_calf',
            name: 'Leg Press Calf Raises',
            incrementLbs: 20,
          },
          {
            id: 'lower_single_leg_db_calf',
            name: 'Single-Leg Dumbbell Calf Raise',
            incrementLbs: 5,
          },
          {
            id: 'lower_standing_calf',
            name: 'Standing Calf Raises',
            incrementLbs: 10,
          },
        ],
      },
    ],
  },
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Program day 0 = first lift (Push). Then Pull, Legs, Rest, Upper, Lower, Rest, repeat. */
const PROGRAM_ROTATION: Array<
  | { kind: 'lift'; workoutId: GymWorkout['id'] }
  | { kind: 'rest'; title: string; hint: string }
> = [
  { kind: 'lift', workoutId: 'push' },
  { kind: 'lift', workoutId: 'pull' },
  { kind: 'lift', workoutId: 'legs' },
  {
    kind: 'rest',
    title: 'Rest',
    hint: 'Recover for Upper. Walk or easy cardio is fine.',
  },
  { kind: 'lift', workoutId: 'upper' },
  { kind: 'lift', workoutId: 'lower' },
  {
    kind: 'rest',
    title: 'Rest',
    hint: 'Recover for Push. Sleep and protein first.',
  },
];

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Days since program start (0 = Day 1 / Push). Negative = before start. */
export function getLiftProgramDayIndex(
  forDate: Date = new Date(),
  programStartIso: string
): number {
  const start = startOfLocalDay(parseDateKey(programStartIso));
  const current = startOfLocalDay(forDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((current.getTime() - start.getTime()) / msPerDay);
}

export function isLiftProgramStarted(
  forDate: Date = new Date(),
  programStartIso: string
): boolean {
  return getLiftProgramDayIndex(forDate, programStartIso) >= 0;
}

/**
 * Schedule from your lift program start date.
 * Day 1 of the program = Push.
 */
export function getScheduleForDate(
  forDate: Date = new Date(),
  programStartIso: string
): DaySchedule {
  const dayIndex = getLiftProgramDayIndex(forDate, programStartIso);
  const weekday = DAY_NAMES[forDate.getDay()];

  if (dayIndex < 0) {
    return {
      kind: 'rest',
      label: `Program starts ${formatProgramStartLabel(programStartIso)} · preview (Push)`,
      hint: `${weekday}. Day 1 is Push when the program starts.`,
    };
  }

  const programDay = dayIndex + 1; // 1-based for UI
  const slot = PROGRAM_ROTATION[dayIndex % PROGRAM_ROTATION.length];

  if (slot.kind === 'rest') {
    return {
      kind: 'rest',
      label: `Day ${programDay} · ${slot.title}`,
      hint: `${weekday}. ${slot.hint}`,
    };
  }

  const workout = gymWorkouts[slot.workoutId];
  return {
    kind: 'lift',
    workout,
    label: `Day ${programDay} · ${workout.title}`,
  };
}

export function getTodayGymWorkout(
  forDate: Date = new Date(),
  programStartIso: string
): GymWorkout | null {
  const schedule = getScheduleForDate(forDate, programStartIso);
  return schedule.kind === 'lift' ? schedule.workout : null;
}

export function formatRepRange(exercise: GymExercise): string {
  if (exercise.repMin === exercise.repMax) {
    return `${exercise.sets} × ${exercise.repMin}`;
  }
  return `${exercise.sets} × ${exercise.repMin}–${exercise.repMax}`;
}

export function formatRest(exercise: GymExercise): string {
  if (exercise.restSec >= 120) {
    const min = exercise.restSec / 60;
    return min % 1 === 0 ? `${min} min` : `${min.toFixed(1)} min`;
  }
  return `${exercise.restSec} sec`;
}

/** Primary template id for an exercise (even after swapping). */
export function getPrimaryExerciseId(exercise: GymExercise): string {
  return exercise.primaryId ?? exercise.id;
}

/**
 * Apply an alternative (or restore primary). Keeps sets/reps/rest/compound.
 */
export function applyExerciseAlternative(
  exercise: GymExercise,
  alternativeId: string | null
): GymExercise {
  const primary: GymExercise = exercise.primarySnapshot
    ? { ...exercise.primarySnapshot }
    : {
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        repMin: exercise.repMin,
        repMax: exercise.repMax,
        incrementLbs: exercise.incrementLbs,
        restSec: exercise.restSec,
        notes: exercise.notes,
        bodyweight: exercise.bodyweight,
        compound: exercise.compound,
        alternatives: exercise.alternatives,
      };

  if (!alternativeId || alternativeId === primary.id) {
    return { ...primary };
  }

  const alt = primary.alternatives?.find((a) => a.id === alternativeId);
  if (!alt) return exercise;

  return {
    ...primary,
    id: alt.id,
    name: alt.name,
    notes: alt.notes ?? primary.notes,
    bodyweight: alt.bodyweight ?? false,
    incrementLbs: alt.incrementLbs ?? primary.incrementLbs,
    alternatives: primary.alternatives,
    primaryId: primary.id,
    primarySnapshot: primary,
  };
}

export function listSelectableVariants(exercise: GymExercise): Array<{
  id: string;
  name: string;
  isPrimary: boolean;
}> {
  const primary = exercise.primarySnapshot ?? exercise;
  return [
    { id: primary.id, name: primary.name, isPrimary: true },
    ...(primary.alternatives ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      isPrimary: false,
    })),
  ];
}

export function hasAlternatives(exercise: GymExercise): boolean {
  const primary = exercise.primarySnapshot ?? exercise;
  return (primary.alternatives?.length ?? 0) > 0;
}

/**
 * Warm-up plan for a workout:
 * - First compound: 2 ramp-up sets
 * - Later compounds: 1 light feeder set
 * - Isolations: no warm-up
 */
export type WarmupItem = {
  exerciseId: string;
  exerciseName: string;
  kind: 'main' | 'feeder';
  lines: string[];
};

function roundDownToIncrement(weight: number, increment: number): number {
  if (increment <= 0) return Math.round(weight);
  return Math.floor(weight / increment) * increment;
}

function mainWarmupLines(exercise: GymExercise, workingWeightLbs: number | null): string[] {
  if (exercise.bodyweight) {
    return [
      `2 easy sets: ${Math.max(3, exercise.repMin - 2)}–${exercise.repMin} reps (assisted or bodyweight)`,
      `Then working sets`,
    ];
  }
  if (workingWeightLbs == null || workingWeightLbs <= 0) {
    return [
      `1) very light × 8`,
      `2) medium (below work weight) × 5`,
      `Then working sets`,
    ];
  }
  const light = Math.max(
    exercise.incrementLbs,
    roundDownToIncrement(workingWeightLbs * 0.5, exercise.incrementLbs)
  );
  const medium = Math.max(
    light + exercise.incrementLbs,
    roundDownToIncrement(workingWeightLbs * 0.7, exercise.incrementLbs)
  );
  return [
    `1) ${light} lb × 8`,
    `2) ${medium} lb × 5`,
    `Then ~${workingWeightLbs} lb working sets`,
  ];
}

function feederWarmupLine(exercise: GymExercise, workingWeightLbs: number | null): string {
  if (exercise.bodyweight) {
    return `1 easy set of ${Math.max(3, exercise.repMin - 2)}–${exercise.repMin} reps, then work`;
  }
  if (workingWeightLbs == null || workingWeightLbs <= 0) {
    return `1 light set × 5–6 (below work weight), then work`;
  }
  const feeder = Math.max(
    exercise.incrementLbs,
    roundDownToIncrement(workingWeightLbs * 0.6, exercise.incrementLbs)
  );
  return `1 set @ ${feeder} lb × 5–6, then ~${workingWeightLbs} lb work`;
}

export function getWorkoutWarmupPlan(
  workout: GymWorkout,
  startWeights: Record<string, number | null>
): WarmupItem[] {
  const compounds = workout.exercises.filter((ex) => ex.compound);
  return compounds.map((exercise, index) => {
    const weight = startWeights[exercise.id] ?? null;
    if (index === 0) {
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        kind: 'main' as const,
        lines: mainWarmupLines(exercise, weight),
      };
    }
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      kind: 'feeder' as const,
      lines: [feederWarmupLine(exercise, weight)],
    };
  });
}

/** Short line shown on an exercise card / in-session. */
export function getExerciseWarmupHint(
  workout: GymWorkout,
  exercise: GymExercise,
  workingWeightLbs: number | null
): string | null {
  if (!exercise.compound) return null;
  const compounds = workout.exercises.filter((ex) => ex.compound);
  const index = compounds.findIndex((ex) => ex.id === exercise.id);
  if (index < 0) return null;
  if (index === 0) {
    return mainWarmupLines(exercise, workingWeightLbs).slice(0, 2).join(' · ');
  }
  return feederWarmupLine(exercise, workingWeightLbs);
}
