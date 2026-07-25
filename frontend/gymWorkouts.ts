// Your programmed lift split — calendar-based, fully offline.

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

export const gymWorkouts: Record<GymWorkout['id'], GymWorkout> = {
  push: {
    id: 'push',
    title: 'Push',
    focus: 'Chest / Shoulders / Triceps',
    estimatedMin: 60,
    exercises: [
      {
        id: 'flat_db_bench',
        name: 'Flat Dumbbell Bench Press',
        sets: 4,
        repMin: 6,
        repMax: 8,
        incrementLbs: 5,
        restSec: 150,
        notes: 'Per dumbbell · leave 1–2 reps in reserve',
        compound: true,
        alternatives: [
          { id: 'flat_bb_bench', name: 'Barbell Bench Press', notes: 'Leave 1–2 RIR' },
          { id: 'flat_machine_chest', name: 'Machine Chest Press', incrementLbs: 10 },
        ],
      },
      {
        id: 'incline_db_press',
        name: 'Incline Dumbbell Press',
        sets: 3,
        repMin: 8,
        repMax: 10,
        incrementLbs: 5,
        restSec: 120,
        notes: 'Per dumbbell',
        compound: true,
        alternatives: [
          {
            id: 'incline_machine_press',
            name: 'Incline Machine Press',
            incrementLbs: 10,
          },
          { id: 'incline_bb_press', name: 'Incline Barbell Press' },
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
        notes: 'Per dumbbell · leave 1–2 RIR',
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
            notes: 'Per dumbbell',
          },
        ],
      },
      {
        id: 'cable_lateral_raise',
        name: 'Cable Lateral Raises',
        sets: 4,
        repMin: 12,
        repMax: 15,
        incrementLbs: 5,
        restSec: 60,
        compound: false,
        alternatives: [
          {
            id: 'db_lateral_raise',
            name: 'Dumbbell Lateral Raises',
            notes: 'Per dumbbell',
            incrementLbs: 2.5,
          },
        ],
      },
      {
        id: 'pec_deck_fly',
        name: 'Pec Deck Fly',
        sets: 3,
        repMin: 12,
        repMax: 15,
        incrementLbs: 5,
        restSec: 60,
        compound: false,
        alternatives: [
          { id: 'cable_fly', name: 'Cable Chest Fly' },
          {
            id: 'db_fly',
            name: 'Dumbbell Fly',
            notes: 'Per dumbbell',
            incrementLbs: 2.5,
          },
        ],
      },
      {
        id: 'oh_db_tricep_ext',
        name: 'Overhead Dumbbell Triceps Extension',
        sets: 3,
        repMin: 10,
        repMax: 12,
        incrementLbs: 5,
        restSec: 60,
        compound: false,
        alternatives: [
          { id: 'cable_oh_tricep', name: 'Cable Overhead Triceps Extension' },
        ],
      },
      {
        id: 'rope_pushdown',
        name: 'Rope Pushdowns',
        sets: 2,
        repMin: 12,
        repMax: 15,
        incrementLbs: 5,
        restSec: 60,
        compound: false,
        alternatives: [
          { id: 'bar_pushdown', name: 'Straight-Bar Pushdowns' },
        ],
      },
    ],
  },

  pull: {
    id: 'pull',
    title: 'Pull',
    focus: 'Back / Rear Delts / Biceps',
    estimatedMin: 65,
    exercises: [
      {
        id: 'pullups',
        name: 'Pull-Ups',
        sets: 4,
        repMin: 6,
        repMax: 10,
        incrementLbs: 5,
        restSec: 150,
        bodyweight: true,
        notes: 'Bodyweight or add weight · log added weight (0 if BW)',
        compound: true,
        alternatives: [
          {
            id: 'lat_pulldown_pull',
            name: 'Lat Pulldown',
            bodyweight: false,
            incrementLbs: 10,
          },
        ],
      },
      {
        id: 'chest_supported_row',
        name: 'Chest Supported Row',
        sets: 4,
        repMin: 8,
        repMax: 10,
        incrementLbs: 5,
        restSec: 120,
        notes: 'Leave 1–2 RIR',
        compound: true,
        alternatives: [
          { id: 'machine_row', name: 'Machine Row', incrementLbs: 10 },
          {
            id: 'one_arm_db_row',
            name: 'One-Arm Dumbbell Row',
            notes: 'Per arm',
          },
        ],
      },
      {
        id: 'neutral_lat_pulldown',
        name: 'Neutral Grip Lat Pulldown',
        sets: 3,
        repMin: 10,
        repMax: 12,
        incrementLbs: 10,
        restSec: 90,
        compound: true,
        alternatives: [
          {
            id: 'wide_lat_pulldown',
            name: 'Wide-Grip Lat Pulldown',
            incrementLbs: 10,
          },
          {
            id: 'pullup_alt',
            name: 'Pull-Ups',
            bodyweight: true,
            incrementLbs: 5,
            notes: 'Log added weight (0 if BW)',
          },
        ],
      },
      {
        id: 'seated_cable_row',
        name: 'Seated Cable Row',
        sets: 3,
        repMin: 10,
        repMax: 12,
        incrementLbs: 10,
        restSec: 90,
        compound: true,
        alternatives: [
          { id: 'chest_row_alt', name: 'Chest Supported Row', incrementLbs: 5 },
          {
            id: 'cable_row_single',
            name: 'Single-Arm Cable Row',
            notes: 'Per arm',
          },
        ],
      },
      {
        id: 'face_pulls',
        name: 'Face Pulls',
        sets: 3,
        repMin: 15,
        repMax: 15,
        incrementLbs: 5,
        restSec: 60,
        compound: false,
        alternatives: [
          { id: 'reverse_pec_deck', name: 'Reverse Pec Deck' },
        ],
      },
      {
        id: 'rear_delt_fly',
        name: 'Rear Delt Fly',
        sets: 3,
        repMin: 15,
        repMax: 15,
        incrementLbs: 2.5,
        restSec: 60,
        compound: false,
        alternatives: [
          { id: 'reverse_pec_deck_rd', name: 'Reverse Pec Deck', incrementLbs: 5 },
          { id: 'band_pull_apart', name: 'Band Pull-Aparts', bodyweight: true },
        ],
      },
      {
        id: 'incline_db_curl',
        name: 'Incline Dumbbell Curl',
        sets: 3,
        repMin: 10,
        repMax: 12,
        incrementLbs: 2.5,
        restSec: 60,
        notes: 'Per dumbbell',
        compound: false,
        alternatives: [
          { id: 'standing_db_curl', name: 'Standing Dumbbell Curl', notes: 'Per dumbbell' },
          { id: 'ez_curl_pull', name: 'EZ-Bar Curl', incrementLbs: 5 },
        ],
      },
      {
        id: 'hammer_curl',
        name: 'Hammer Curl',
        sets: 3,
        repMin: 10,
        repMax: 12,
        incrementLbs: 2.5,
        restSec: 60,
        notes: 'Per dumbbell',
        compound: false,
        alternatives: [
          { id: 'rope_hammer', name: 'Rope Hammer Curl', incrementLbs: 5 },
        ],
      },
    ],
  },

  legs: {
    id: 'legs',
    title: 'Legs',
    focus: 'Legs / Posterior Chain',
    estimatedMin: 55,
    exercises: [
      {
        id: 'leg_press',
        name: 'Leg Press',
        sets: 4,
        repMin: 8,
        repMax: 10,
        incrementLbs: 20,
        restSec: 120,
        notes: 'Leave 1–2 RIR',
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
        id: 'bulgarian_split_squat',
        name: 'Bulgarian Split Squat',
        sets: 3,
        repMin: 8,
        repMax: 8,
        incrementLbs: 5,
        restSec: 90,
        notes: '8 each leg · skip if knees hurt · weight = per DB',
        compound: true,
        alternatives: [
          {
            id: 'reverse_lunge',
            name: 'Reverse Lunges',
            notes: '8 each leg · per DB',
          },
          {
            id: 'walking_lunge',
            name: 'Walking Lunges',
            notes: '8 each leg · per DB',
          },
        ],
      },
      {
        id: 'seated_leg_curl',
        name: 'Seated Leg Curl',
        sets: 4,
        repMin: 10,
        repMax: 12,
        incrementLbs: 10,
        restSec: 75,
        compound: false,
        alternatives: [
          { id: 'lying_leg_curl', name: 'Lying Leg Curl', incrementLbs: 10 },
        ],
      },
      {
        id: 'hip_thrust_machine',
        name: 'Hip Thrust Machine',
        sets: 3,
        repMin: 8,
        repMax: 10,
        incrementLbs: 10,
        restSec: 120,
        compound: true,
        alternatives: [
          { id: 'bb_hip_thrust', name: 'Barbell Hip Thrust', incrementLbs: 10 },
          {
            id: 'db_glute_bridge',
            name: 'Dumbbell Glute Bridge',
            incrementLbs: 5,
          },
        ],
      },
      {
        id: 'standing_calf_raise',
        name: 'Standing Calf Raises',
        sets: 4,
        repMin: 12,
        repMax: 15,
        incrementLbs: 10,
        restSec: 60,
        compound: false,
        alternatives: [
          { id: 'seated_calf', name: 'Seated Calf Raises', incrementLbs: 10 },
        ],
      },
    ],
  },

  upper: {
    id: 'upper',
    title: 'Upper',
    focus: 'Heavy Upper',
    estimatedMin: 60,
    exercises: [
      {
        id: 'upper_incline_db',
        name: 'Incline Dumbbell Press',
        sets: 4,
        repMin: 6,
        repMax: 8,
        incrementLbs: 5,
        restSec: 150,
        notes: 'Per dumbbell · leave 1–2 RIR',
        compound: true,
        alternatives: [
          {
            id: 'upper_incline_machine',
            name: 'Incline Machine Press',
            incrementLbs: 10,
          },
          { id: 'upper_incline_bb', name: 'Incline Barbell Press' },
        ],
      },
      {
        id: 'upper_weighted_pullup',
        name: 'Weighted Pull-Up (or Lat Pulldown)',
        sets: 4,
        repMin: 6,
        repMax: 8,
        incrementLbs: 5,
        restSec: 150,
        bodyweight: true,
        notes: 'Log added weight (0 if bodyweight) or machine weight',
        compound: true,
        alternatives: [
          {
            id: 'upper_lat_pulldown',
            name: 'Lat Pulldown',
            bodyweight: false,
            incrementLbs: 10,
          },
        ],
      },
      {
        id: 'upper_machine_chest',
        name: 'Machine Chest Press',
        sets: 3,
        repMin: 8,
        repMax: 10,
        incrementLbs: 10,
        restSec: 90,
        compound: true,
        alternatives: [
          {
            id: 'upper_flat_db',
            name: 'Flat Dumbbell Bench Press',
            notes: 'Per dumbbell',
            incrementLbs: 5,
          },
          { id: 'upper_bb_bench', name: 'Barbell Bench Press', incrementLbs: 5 },
        ],
      },
      {
        id: 'upper_chest_row',
        name: 'Chest Supported Row',
        sets: 3,
        repMin: 8,
        repMax: 10,
        incrementLbs: 5,
        restSec: 120,
        compound: true,
        alternatives: [
          { id: 'upper_machine_row', name: 'Machine Row', incrementLbs: 10 },
          { id: 'upper_seated_row', name: 'Seated Cable Row', incrementLbs: 10 },
        ],
      },
      {
        id: 'upper_cable_lateral',
        name: 'Cable Lateral Raise',
        sets: 4,
        repMin: 15,
        repMax: 15,
        incrementLbs: 5,
        restSec: 60,
        compound: false,
        alternatives: [
          {
            id: 'upper_db_lateral',
            name: 'Dumbbell Lateral Raises',
            notes: 'Per dumbbell',
            incrementLbs: 2.5,
          },
        ],
      },
      {
        id: 'upper_oh_tricep',
        name: 'Overhead Dumbbell Triceps Extension',
        sets: 3,
        repMin: 10,
        repMax: 12,
        incrementLbs: 5,
        restSec: 60,
        compound: false,
        alternatives: [
          { id: 'upper_cable_oh_tricep', name: 'Cable Overhead Triceps Extension' },
          { id: 'upper_rope_pushdown', name: 'Rope Pushdowns' },
        ],
      },
      {
        id: 'upper_ez_curl',
        name: 'EZ-Bar Curl',
        sets: 3,
        repMin: 10,
        repMax: 12,
        incrementLbs: 5,
        restSec: 60,
        compound: false,
        alternatives: [
          {
            id: 'upper_db_curl',
            name: 'Dumbbell Curl',
            notes: 'Per dumbbell',
            incrementLbs: 2.5,
          },
        ],
      },
    ],
  },

  lower: {
    id: 'lower',
    title: 'Lower + Core',
    focus: 'Legs / Core',
    estimatedMin: 55,
    exercises: [
      {
        id: 'lower_hip_thrust',
        name: 'Hip Thrust Machine',
        sets: 4,
        repMin: 8,
        repMax: 10,
        incrementLbs: 10,
        restSec: 120,
        compound: true,
        alternatives: [
          { id: 'lower_bb_hip_thrust', name: 'Barbell Hip Thrust', incrementLbs: 10 },
        ],
      },
      {
        id: 'lower_single_leg_press',
        name: 'Single Leg Press',
        sets: 3,
        repMin: 10,
        repMax: 10,
        incrementLbs: 10,
        restSec: 90,
        notes: '10 each leg',
        compound: true,
        alternatives: [
          {
            id: 'lower_bulgarian',
            name: 'Bulgarian Split Squat',
            notes: '10 each leg · per DB',
            incrementLbs: 5,
          },
          {
            id: 'lower_reverse_lunge',
            name: 'Reverse Lunges',
            notes: '10 each leg',
            incrementLbs: 5,
          },
        ],
      },
      {
        id: 'lower_seated_curl',
        name: 'Seated Leg Curl',
        sets: 4,
        repMin: 10,
        repMax: 12,
        incrementLbs: 10,
        restSec: 75,
        compound: false,
        alternatives: [
          { id: 'lower_lying_curl', name: 'Lying Leg Curl', incrementLbs: 10 },
        ],
      },
      {
        id: 'lower_calf',
        name: 'Standing Calf Raises',
        sets: 4,
        repMin: 12,
        repMax: 15,
        incrementLbs: 10,
        restSec: 60,
        compound: false,
        alternatives: [
          { id: 'lower_seated_calf', name: 'Seated Calf Raises', incrementLbs: 10 },
        ],
      },
      {
        id: 'hanging_leg_raise',
        name: 'Hanging Leg Raises',
        sets: 3,
        repMin: 12,
        repMax: 15,
        incrementLbs: 5,
        restSec: 60,
        bodyweight: true,
        notes: 'Bodyweight · log 0 if unweighted',
        compound: false,
        alternatives: [
          {
            id: 'captains_chair',
            name: "Captain's Chair Leg Raises",
            bodyweight: true,
          },
          {
            id: 'lying_leg_raise',
            name: 'Lying Leg Raises',
            bodyweight: true,
          },
        ],
      },
      {
        id: 'cable_woodchop',
        name: 'Cable Woodchoppers',
        sets: 3,
        repMin: 12,
        repMax: 12,
        incrementLbs: 5,
        restSec: 60,
        notes: '12 each side',
        compound: false,
        alternatives: [
          {
            id: 'db_woodchop',
            name: 'Dumbbell Woodchoppers',
            notes: '12 each side',
            incrementLbs: 5,
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
    title: 'Rest or Run',
    hint: 'Programmed recovery / run day. Core and Stretch are still available.',
  },
  { kind: 'lift', workoutId: 'upper' },
  { kind: 'lift', workoutId: 'lower' },
  {
    kind: 'rest',
    title: 'Rest or Long Run',
    hint: 'Programmed rest / long-run day. Next lift day is Push.',
  },
];

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Days since program start (0 = Day 1 / Push). */
export function getLiftProgramDayIndex(
  forDate: Date = new Date(),
  programStartIso: string
): number {
  const start = startOfLocalDay(parseDateKey(programStartIso));
  const current = startOfLocalDay(forDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.round((current.getTime() - start.getTime()) / msPerDay));
}

/**
 * Schedule from your lift program start date (not calendar weekday).
 * Day 1 of the program = Push.
 */
export function getScheduleForDate(
  forDate: Date = new Date(),
  programStartIso: string
): DaySchedule {
  const dayIndex = getLiftProgramDayIndex(forDate, programStartIso);
  const programDay = dayIndex + 1; // 1-based for UI
  const slot = PROGRAM_ROTATION[dayIndex % PROGRAM_ROTATION.length];
  const weekday = DAY_NAMES[forDate.getDay()];

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
 * - First compound: 2 ramp-up sets (you need these)
 * - Later compounds: 1 light feeder set (better than skipping; don't need 2–3)
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

/** @deprecated use getWorkoutWarmupPlan */
export function getWarmupLines(
  firstExercise: GymExercise,
  workingWeightLbs: number | null
): string[] {
  return mainWarmupLines(firstExercise, workingWeightLbs);
}
