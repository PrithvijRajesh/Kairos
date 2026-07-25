import type { GymWorkout, RunWorkout } from './types';

export const runWorkouts: Record<string, RunWorkout> = {
  easy_run_30: {
    id: 'easy_run_30',
    title: 'Easy Run',
    focus: 'Aerobic base — conversational pace',
    estimatedMin: 35,
    warmup: '5 min brisk walk + leg swings',
    main: '30 min easy run (you should be able to hold a full sentence)',
    cooldown: '5 min walk + light calf stretch',
    exercises: [
      { name: 'Warm-up', prescription: '5 min walk / jog' },
      { name: 'Main set', prescription: '30 min easy' },
      { name: 'Cool-down', prescription: '5 min walk' },
    ],
  },
  easy_run_45: {
    id: 'easy_run_45',
    title: 'Easy Run',
    focus: 'Longer aerobic volume',
    estimatedMin: 50,
    warmup: '5 min brisk walk',
    main: '45 min easy run — relaxed shoulders, soft landing',
    cooldown: '5 min walk',
    exercises: [
      { name: 'Warm-up', prescription: '5 min walk / jog' },
      { name: 'Main set', prescription: '45 min easy' },
      { name: 'Cool-down', prescription: '5 min walk' },
    ],
  },
  recovery_run_20: {
    id: 'recovery_run_20',
    title: 'Recovery Jog',
    focus: 'Flush legs — very easy',
    estimatedMin: 25,
    warmup: '3 min walk',
    main: '20 min super easy jog (slower than normal easy pace)',
    cooldown: '2 min walk',
    exercises: [
      { name: 'Main set', prescription: '20 min recovery pace' },
    ],
  },
  intervals_400: {
    id: 'intervals_400',
    title: 'Track Intervals',
    focus: 'Speed — controlled reps',
    estimatedMin: 45,
    warmup: '10 min easy jog + 4 strides',
    main: '6 × 400 m @ 5K effort, 90 sec walk/jog between',
    cooldown: '10 min easy jog',
    exercises: [
      { name: 'Warm-up', prescription: '10 min easy + strides' },
      { name: 'Intervals', prescription: '6 × 400 m, 90 sec rest' },
      { name: 'Cool-down', prescription: '10 min easy' },
    ],
  },
  tempo_20: {
    id: 'tempo_20',
    title: 'Tempo Run',
    focus: 'Lactate threshold — comfortably hard',
    estimatedMin: 40,
    warmup: '10 min easy',
    main: '20 min tempo (roughly half-marathon effort)',
    cooldown: '10 min easy',
    exercises: [
      { name: 'Warm-up', prescription: '10 min easy' },
      { name: 'Tempo', prescription: '20 min steady-hard' },
      { name: 'Cool-down', prescription: '10 min easy' },
    ],
  },
  long_run_60: {
    id: 'long_run_60',
    title: 'Long Run',
    focus: 'Endurance — stay patient early',
    estimatedMin: 70,
    warmup: '5 min walk / easy jog',
    main: '60 min easy-long — start conservative, finish strong',
    cooldown: '5 min walk + hip flexor stretch',
    exercises: [
      { name: 'Main set', prescription: '60 min easy-long' },
    ],
  },
};

export const gymWorkouts: Record<string, GymWorkout> = {
  upper_strength: {
    id: 'upper_strength',
    title: 'Upper Strength',
    focus: 'Push + pull compounds',
    estimatedMin: 50,
    exercises: [
      { name: 'Bench press', sets: 4, reps: '6–8', notes: '2 min rest' },
      { name: 'Barbell row', sets: 4, reps: '8–10' },
      { name: 'Overhead press', sets: 3, reps: '8–10' },
      { name: 'Lat pulldown or pull-ups', sets: 3, reps: '8–12' },
      { name: 'Face pulls', sets: 3, reps: '15' },
    ],
  },
  lower_strength: {
    id: 'lower_strength',
    title: 'Lower Strength',
    focus: 'Squat pattern + hinge',
    estimatedMin: 55,
    exercises: [
      { name: 'Back squat or goblet squat', sets: 4, reps: '6–8' },
      { name: 'Romanian deadlift', sets: 3, reps: '8–10' },
      { name: 'Walking lunges', sets: 3, reps: '10 / leg' },
      { name: 'Calf raises', sets: 3, reps: '15' },
      { name: 'Plank', sets: 3, reps: '30–45 sec' },
    ],
  },
  full_body: {
    id: 'full_body',
    title: 'Full Body',
    focus: 'Balanced strength session',
    estimatedMin: 50,
    exercises: [
      { name: 'Squat variation', sets: 3, reps: '8–10' },
      { name: 'Bench or push-ups', sets: 3, reps: '8–12' },
      { name: 'Row variation', sets: 3, reps: '10–12' },
      { name: 'RDL or hip hinge', sets: 3, reps: '10' },
      { name: 'Farmer carry', sets: 3, reps: '40 m' },
    ],
  },
  push_day: {
    id: 'push_day',
    title: 'Push Day',
    focus: 'Chest, shoulders, triceps',
    estimatedMin: 45,
    exercises: [
      { name: 'Incline DB press', sets: 4, reps: '8–10' },
      { name: 'Overhead press', sets: 3, reps: '8–10' },
      { name: 'Lateral raises', sets: 3, reps: '12–15' },
      { name: 'Tricep pushdowns', sets: 3, reps: '12' },
    ],
  },
  pull_day: {
    id: 'pull_day',
    title: 'Pull Day',
    focus: 'Back and biceps',
    estimatedMin: 45,
    exercises: [
      { name: 'Pull-ups or lat pulldown', sets: 4, reps: '6–10' },
      { name: 'Chest-supported row', sets: 3, reps: '10–12' },
      { name: 'Rear delt fly', sets: 3, reps: '12–15' },
      { name: 'Hammer curls', sets: 3, reps: '12' },
    ],
  },
  legs_day: {
    id: 'legs_day',
    title: 'Leg Day',
    focus: 'Quads, glutes, hamstrings',
    estimatedMin: 55,
    exercises: [
      { name: 'Squat or leg press', sets: 4, reps: '8–10' },
      { name: 'Romanian deadlift', sets: 3, reps: '10' },
      { name: 'Split squat', sets: 3, reps: '10 / leg' },
      { name: 'Leg curl', sets: 3, reps: '12' },
    ],
  },
  light_gym: {
    id: 'light_gym',
    title: 'Light Gym',
    focus: 'Technique and blood flow — not max effort',
    estimatedMin: 35,
    exercises: [
      { name: 'Goblet squat', sets: 2, reps: '10' },
      { name: 'Push-ups', sets: 2, reps: '10' },
      { name: 'DB row', sets: 2, reps: '12' },
      { name: 'Band pull-aparts', sets: 2, reps: '15' },
    ],
  },
};

export function getRunWorkout(id: string): RunWorkout | null {
  return runWorkouts[id] ?? null;
}

export function getGymWorkout(id: string): GymWorkout | null {
  return gymWorkouts[id] ?? null;
}
