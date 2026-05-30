// Core workout data only (exercise names, sets, reps) — no UI in this file.
export type CoreExercise = {
    name: string;
    sets: number;
    reps: string; // "8/side" or "30 sec"
    note?: string;
  };
  
  export const dailyCoreRoutine: CoreExercise[] = [
    { name: 'Dead bug', sets: 3, reps: '8/side', note: 'Back flat' },
    { name: 'Bird dog', sets: 3, reps: '8/side' },
    { name: 'Front plank', sets: 3, reps: '30-45 sec' },
    { name: 'Side plank', sets: 2, reps: '20-30 sec/side' },
    { name: 'Glute bridge', sets: 3, reps: '12' },
  ];