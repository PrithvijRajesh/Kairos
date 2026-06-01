// Core workout data only (exercise names, sets, reps) — no UI in this file.
export type progressionType = 'reps' | 'time';

export type exerciseLevel = {
  level: 1 |2 | 3;
  label: string;
  repsPerSide?: number;
  totalReps?: number;
  holdSec?: number;
  holdSecPerSide?: number;
};

export type CoreExerciseTemplate = {
  id: string;
  name: string;
  type: string;
  sets: number;
  restSec: number;
  cues: string[];
  stopIf?: string;
  levels: exerciseLevel[];
};

export type CoreWorkout = {
  id: 'A' | 'B' | 'C' | 'D';
  title: string;
  focus: string;
  estimatedMin: number;
  exerciseIds: string[];
}

// --- EXERCISE LIBRARY (shared; Workout A pulls from here) ---

export const coreExerciseLibrary: Record<string, CoreExerciseTemplate> = {
  dead_bug: {
    id: 'dead_bug',
    name: 'Dead bug',
    type: 'reps',
    sets: 3,
    restSec: 45,
    cues: [
      'Lower back stays flat on the floor',
      'Exhale as you extend arm and opposite leg',
      'Move slow — no rocking',
    ],
    stopIf: 'Stop if your low back arches off the floor.',
    levels: [
      { level: 1, label: 'Standard', repsPerSide: 8 },
      { level: 2, label: 'More reps', repsPerSide: 10 },
      { level: 3, label: 'Pause at bottom', repsPerSide: 12 },
    ],
  },

  bird_dog: {
    id: 'bird_dog',
    name: 'Bird dog',
    type: 'reps',
    sets: 3,
    restSec: 45,
    cues: [
      'Reach long through fingertips and heel',
      'Hold 2 seconds at the top',
      'Hips stay level — no rotation',
    ],
    stopIf: 'Stop if you feel sharp low-back pain.',
    levels: [
      { level: 1, label: 'Standard', repsPerSide: 8 },
      { level: 2, label: 'More reps', repsPerSide: 10 },
      { level: 3, label: 'Longer hold', repsPerSide: 10 }, // UI note: "3 sec hold at top"
    ],
  },

  front_plank: {
    id: 'front_plank',
    name: 'Front plank',
    type: 'time',
    sets: 3,
    restSec: 45,
    cues: [
      'Elbows under shoulders, fists or flat palms',
      'Squeeze glutes, ribs down',
      'Breathe behind your brace — don’t hold breath the whole time',
    ],
    stopIf: 'Stop if hips sag or shoulders dump forward.',
    levels: [
      { level: 1, label: 'Standard', holdSec: 30 },
      { level: 2, label: 'Longer', holdSec: 45 },
      { level: 3, label: 'Endurance', holdSec: 60 },
    ],
  },

  side_plank: {
    id: 'side_plank',
    name: 'Side plank',
    type: 'time',
    sets: 2, // 2 sets PER SIDE — see helper below
    restSec: 45,
    cues: [
      'Elbow under shoulder, hips stacked',
      'Top hip pushes forward slightly',
      'Neck neutral — look straight ahead',
    ],
    stopIf: 'Stop if shoulder or hip pain is sharp.',
    levels: [
      { level: 1, label: 'Standard', holdSecPerSide: 25 },
      { level: 2, label: 'Longer', holdSecPerSide: 35 },
      { level: 3, label: 'Endurance', holdSecPerSide: 45 },
    ],
  },

  glute_bridge: {
    id: 'glute_bridge',
    name: 'Glute bridge',
    type: 'reps',
    sets: 3,
    restSec: 45,
    cues: [
      'Drive through heels, not toes',
      '2 second squeeze at the top',
      'Don’t over-arch at the top',
    ],
    levels: [
      { level: 1, label: 'Standard', totalReps: 12 },
      { level: 2, label: 'More reps', totalReps: 15 },
      { level: 3, label: 'Single leg', repsPerSide: 8 },
    ],
  },

  windshield_wiper: {
    id: 'windshield_wiper',
    name: 'Windshield wiper (knees bent)',
    type: 'reps',
    sets: 3,
    restSec: 45,
    cues: [
      'Knees bent 90°, shoulders stay down',
      'Move slow — control the rotation',
      'Stop before shoulders lift off the floor',
    ],
    stopIf: 'Stop if low back pain or shoulders peel up.',
    levels: [
      { level: 1, label: 'Standard', repsPerSide: 6 },
      { level: 2, label: 'More control', repsPerSide: 8 },
      { level: 3, label: 'Slower tempo', repsPerSide: 8 },
    ],
  },

  bear_hold: {
    id: 'bear_hold',
    name: 'Bear hold',
    type: 'time',
    sets: 3,
    restSec: 45,
    cues: [
      'Knees hover 1–2 inches off floor',
      'Back flat, gaze down',
      'Breathe steadily — don’t hold your breath',
    ],
    stopIf: 'Stop if you feel strain in low back.',
    levels: [
      { level: 1, label: 'Standard', holdSec: 20 },
      { level: 2, label: 'Longer', holdSec: 30 },
      { level: 3, label: 'Endurance', holdSec: 40 },
    ],
  },

  reverse_crunch: {
    id: 'reverse_crunch',
    name: 'Reverse crunch (controlled)',
    type: 'reps',
    sets: 3,
    restSec: 45,
    cues: [
      'Curl pelvis up, not momentum from legs',
      'Slow lower — 2–3 seconds down',
      'Keep tension; don’t rest at the bottom',
    ],
    levels: [
      { level: 1, label: 'Standard', totalReps: 10 },
      { level: 2, label: 'More reps', totalReps: 12 },
      { level: 3, label: 'Slow eccentric', totalReps: 12 },
    ],
  },

  clamshell: {
    id: 'clamshell',
    name: 'Clamshell',
    type: 'reps',
    sets: 3,
    restSec: 40,
    cues: [
      'Heels stay together, open from the hip',
      'No rolling backward',
      'Pause 1 second at the top',
    ],
    levels: [
      { level: 1, label: 'Standard', repsPerSide: 15 },
      { level: 2, label: 'More reps', repsPerSide: 18 },
      { level: 3, label: 'Band above knees', repsPerSide: 18 },
    ],
  },

  copenhagen_plank: {
    id: 'copenhagen_plank',
    name: 'Copenhagen plank (short lever)',
    type: 'time',
    sets: 2,
    restSec: 45,
    cues: [
      'Top leg on bench/chair, bottom knee on floor if needed',
      'Hips high — straight line',
      'Start short — quality over duration',
    ],
    stopIf: 'Stop if inner thigh or groin pain is sharp.',
    levels: [
      { level: 1, label: 'Short lever', holdSecPerSide: 15 },
      { level: 2, label: 'Standard', holdSecPerSide: 20 },
      { level: 3, label: 'Longer', holdSecPerSide: 25 },
    ],
  },

  single_leg_glute_bridge: {
    id: 'single_leg_glute_bridge',
    name: 'Single-leg glute bridge',
    type: 'reps',
    sets: 3,
    restSec: 45,
    cues: [
      'Drive through the heel of the working leg',
      'Keep hips level — no twisting',
      '2 second squeeze at top',
    ],
    levels: [
      { level: 1, label: 'Standard', repsPerSide: 8 },
      { level: 2, label: 'More reps', repsPerSide: 10 },
      { level: 3, label: 'Pause at top', repsPerSide: 10 },
    ],
  },

  hip_airplane: {
    id: 'hip_airplane',
    name: 'Hip airplane (supported)',
    type: 'reps',
    sets: 2,
    restSec: 45,
    cues: [
      'Hand on wall/chair for balance',
      'Slow rotation — control the hip',
      'Stand tall on supporting leg',
    ],
    levels: [
      { level: 1, label: 'Standard', repsPerSide: 6 },
      { level: 2, label: 'More reps', repsPerSide: 8 },
      { level: 3, label: 'Less support', repsPerSide: 8 },
    ],
  },

  hollow_hold: {
    id: 'hollow_hold',
    name: 'Hollow hold (tucked)',
    type: 'time',
    sets: 3,
    restSec: 40,
    cues: [
      'Low back pressed into floor',
      'Ribs down, chin slightly tucked',
      'Legs tucked — extend only if form stays perfect',
    ],
    stopIf: 'Stop if low back lifts off the floor.',
    levels: [
      { level: 1, label: 'Standard', holdSec: 20 },
      { level: 2, label: 'Longer', holdSec: 30 },
      { level: 3, label: 'Endurance', holdSec: 40 },
    ],
  },

  bird_dog_hold: {
    id: 'bird_dog_hold',
    name: 'Bird dog (hold)',
    type: 'time',
    sets: 3,
    restSec: 40,
    cues: [
      'Hold arm and leg long — hips square',
      '2–3 second holds per rep mentally',
      'Exhale at the hardest point',
    ],
    levels: [
      { level: 1, label: 'Standard', holdSecPerSide: 20 },
      { level: 2, label: 'Longer', holdSecPerSide: 30 },
      { level: 3, label: 'Endurance', holdSecPerSide: 40 },
    ],
  },

  wall_sit: {
    id: 'wall_sit',
    name: 'Wall sit',
    type: 'time',
    sets: 2,
    restSec: 60,
    cues: [
      'Back flat on wall, knees ~90°',
      'Weight even on both feet',
      'Breathe — don’t hold breath',
    ],
    levels: [
      { level: 1, label: 'Standard', holdSec: 30 },
      { level: 2, label: 'Longer', holdSec: 45 },
      { level: 3, label: 'Endurance', holdSec: 60 },
    ],
  },
};

// --- WORKOUT A ---

export const workoutA: CoreWorkout = {
  id: 'A',
  title: 'Foundation A',
  focus: 'Anti-extension and bracing — build a stable trunk',
  estimatedMin: 15,
  exerciseIds: [
    'dead_bug',
    'bird_dog',
    'front_plank',
    'side_plank',
    'glute_bridge',
  ],
};

export const workoutB: CoreWorkout = {
  id: 'B',
  title: 'Anti-rotation B',
  focus: 'Resist twisting — trunk stiffness for run and lift',
  estimatedMin: 16,
  exerciseIds: [
    'dead_bug',
    'windshield_wiper',
    'side_plank',
    'bear_hold',
    'reverse_crunch',
  ],
};

export const workoutC: CoreWorkout = {
  id: 'C',
  title: 'Lateral & hips C',
  focus: 'Side chain and pelvis — stability for running',
  estimatedMin: 16,
  exerciseIds: [
    'side_plank',
    'clamshell',
    'copenhagen_plank',
    'single_leg_glute_bridge',
    'hip_airplane',
  ],
};

export const workoutD: CoreWorkout = {
  id: 'D',
  title: 'Endurance D',
  focus: 'Bracing under fatigue — maintain form when tired',
  estimatedMin: 15,
  exerciseIds: [
    'hollow_hold',
    'front_plank',
    'bird_dog_hold',
    'dead_bug',
    'wall_sit',
  ],
};

/** Program starts June 1, 2026 — day 0 = Workout A */
export const CORE_PROGRAM_START_ISO = '2026-06-01';

export const coreWorkoutRotation: CoreWorkout[] = [
  workoutA,
  workoutB,
  workoutC,
  workoutD,
];

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseProgramStartDate(): Date {
  const [year, month, day] = CORE_PROGRAM_START_ISO.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Days since program start (0 = June 1, 2026). Negative = before start. */
export function getDaysSinceProgramStart(forDate: Date = new Date()): number {
  const start = startOfLocalDay(parseProgramStartDate());
  const current = startOfLocalDay(forDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((current.getTime() - start.getTime()) / msPerDay);
}

/** Which workout (A–D) for a given calendar day */
export function getWorkoutForDate(forDate: Date = new Date()): CoreWorkout {
  const days = getDaysSinceProgramStart(forDate);
  if (days < 0) {
    return workoutA;
  }
  return coreWorkoutRotation[days % coreWorkoutRotation.length];
}

export function getTodayWorkout(): CoreWorkout {
  return getWorkoutForDate(new Date());
}

export function isProgramStarted(forDate: Date = new Date()): boolean {
  return getDaysSinceProgramStart(forDate) >= 0;
}

/** Line shown under the title on the Core tab */
export function getProgramStatusLabel(forDate: Date = new Date()): string {
  const days = getDaysSinceProgramStart(forDate);
  if (days < 0) {
    return 'Program starts June 1, 2026 · showing preview (Workout A)';
  }
  const workout = getWorkoutForDate(forDate);
  return `Workout ${workout.id} · program day ${days + 1}`;
}

export function getExercisesForWorkout(workout: CoreWorkout): CoreExerciseTemplate[] {
  return workout.exerciseIds
    .map((id) => coreExerciseLibrary[id])
    .filter((exercise): exercise is CoreExerciseTemplate => exercise != null);
}

/** What to show for prescription at a given level (default level 1 for new users) */
export function formatPrescription(
  exercise: CoreExerciseTemplate,
  level: 1 | 2 | 3 = 1
): string {
  const step = exercise.levels.find((l) => l.level === level)!;
  if (exercise.type === 'time') {
    if (step.holdSecPerSide != null) {
      return `${exercise.sets} sets × ${step.holdSecPerSide} sec/side`;
    }
    return `${exercise.sets} sets × ${step.holdSec} sec`;
  }
  // reps
  if (step.repsPerSide != null) {
    return `${exercise.sets} sets × ${step.repsPerSide}/side`;
  }
  return `${exercise.sets} sets × ${step.totalReps} reps`;
}
/** Seconds for countdown timer (time exercises only) */
export function getHoldSeconds(
  exercise: CoreExerciseTemplate,
  level: 1 | 2 | 3 = 1
): number | null {
  if (exercise.type !== 'time') return null;
  const step = exercise.levels.find((l) => l.level === level)!;
  return step.holdSecPerSide ?? step.holdSec ?? null;
}