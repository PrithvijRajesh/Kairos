// Stretch / mobility data — routines and exercise library.

export type StretchExercise = {
  id: string;
  name: string;
  holdSec: number;
  perSide?: boolean;
  cues: string[];
};

export type StretchRoutine = {
  id: 'A' | 'B' | 'C' | 'D';
  title: string;
  focus: string;
  estimatedMin: number;
  exerciseIds: string[];
};

export const stretchLibrary: Record<string, StretchExercise> = {
  hip_flexor_lunge: {
    id: 'hip_flexor_lunge',
    name: 'Hip flexor lunge',
    holdSec: 45,
    perSide: true,
    cues: [
      'Back knee down, front knee over ankle',
      'Tuck pelvis slightly — feel stretch in front of hip',
      'Breathe slow and steady',
    ],
  },
  hamstring_standing: {
    id: 'hamstring_standing',
    name: 'Standing hamstring',
    holdSec: 40,
    perSide: true,
    cues: [
      'Hinge at hips with flat back',
      'Flex foot toward shin',
      'Mild tension only — not painful',
    ],
  },
  calf_wall: {
    id: 'calf_wall',
    name: 'Calf stretch (wall)',
    holdSec: 35,
    perSide: true,
    cues: [
      'Back leg straight, heel down',
      'Lean into the wall',
      'Switch bent-knee version for soleus if needed',
    ],
  },
  figure_four: {
    id: 'figure_four',
    name: 'Figure-four glute stretch',
    holdSec: 45,
    perSide: true,
    cues: [
      'Ankle on opposite knee',
      'Sit tall or recline gently',
      'Keep back neutral',
    ],
  },
  pigeon: {
    id: 'pigeon',
    name: 'Pigeon pose (supported)',
    holdSec: 50,
    perSide: true,
    cues: [
      'Shin as parallel as comfortable',
      'Square hips forward',
      'Use a pillow under hip if needed',
    ],
  },
  cat_cow: {
    id: 'cat_cow',
    name: 'Cat-cow',
    holdSec: 30,
    cues: [
      'Slow alternating arch and round',
      'Move with your breath',
      '5–6 cycles total',
    ],
  },
  thoracic_rotation: {
    id: 'thoracic_rotation',
    name: 'Thoracic rotation',
    holdSec: 30,
    perSide: true,
    cues: [
      'Hand behind head, elbow wide',
      'Rotate upper back, hips stay still',
      'Pause at end range',
    ],
  },
  doorway_pec: {
    id: 'doorway_pec',
    name: 'Doorway chest stretch',
    holdSec: 40,
    perSide: true,
    cues: [
      'Forearm on frame at 90°',
      'Step through gently',
      'Shoulders down and back',
    ],
  },
  childs_pose: {
    id: 'childs_pose',
    name: "Child's pose",
    holdSec: 60,
    cues: [
      'Knees wide or together — whatever feels better',
      'Reach arms long',
      'Relax shoulders and jaw',
    ],
  },
  quad_standing: {
    id: 'quad_standing',
    name: 'Standing quad stretch',
    holdSec: 35,
    perSide: true,
    cues: [
      'Knees together',
      'Pull heel toward glute',
      'Stand tall — use wall for balance if needed',
    ],
  },
  spinal_twist_seated: {
    id: 'spinal_twist_seated',
    name: 'Seated spinal twist',
    holdSec: 40,
    perSide: true,
    cues: [
      'Sit tall, rotate from mid-back',
      'Use arm on knee for light pressure',
      'Never force the twist',
    ],
  },
};

const routineA: StretchRoutine = {
  id: 'A',
  title: 'Post-run legs',
  focus: 'Hips, hamstrings, and calves after running',
  estimatedMin: 10,
  exerciseIds: ['hip_flexor_lunge', 'hamstring_standing', 'calf_wall', 'figure_four', 'childs_pose'],
};

const routineB: StretchRoutine = {
  id: 'B',
  title: 'Hips & glutes',
  focus: 'Open tight hips from sitting or lifting',
  estimatedMin: 12,
  exerciseIds: ['figure_four', 'pigeon', 'hip_flexor_lunge', 'spinal_twist_seated', 'cat_cow'],
};

const routineC: StretchRoutine = {
  id: 'C',
  title: 'Upper back & shoulders',
  focus: 'Desk posture and pressing day recovery',
  estimatedMin: 10,
  exerciseIds: ['doorway_pec', 'thoracic_rotation', 'cat_cow', 'childs_pose'],
};

const routineD: StretchRoutine = {
  id: 'D',
  title: 'Full recovery',
  focus: 'Light full-body reset on rest days',
  estimatedMin: 12,
  exerciseIds: [
    'cat_cow',
    'hip_flexor_lunge',
    'hamstring_standing',
    'quad_standing',
    'thoracic_rotation',
    'childs_pose',
  ],
};

export const stretchRotation: StretchRoutine[] = [routineA, routineB, routineC, routineD];

export function getTodayStretchRoutine(forDate: Date = new Date()): StretchRoutine {
  const dayIndex = forDate.getDay(); // 0 = Sunday
  return stretchRotation[dayIndex % stretchRotation.length];
}

export function getExercisesForRoutine(routine: StretchRoutine): StretchExercise[] {
  return routine.exerciseIds
    .map((id) => stretchLibrary[id])
    .filter((exercise): exercise is StretchExercise => exercise != null);
}

export function formatStretchPrescription(exercise: StretchExercise): string {
  if (exercise.perSide) {
    return `${exercise.holdSec} sec per side`;
  }
  return `${exercise.holdSec} sec`;
}
