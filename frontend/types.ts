export type Goals = {
  runningGoal: string;
  gymGoal: string;
  runningImportant: number;
  gymImportant: number;
};

export type RunExercise = {
  name: string;
  prescription: string;
};

export type RunWorkout = {
  id: string;
  title: string;
  focus: string;
  estimatedMin: number;
  warmup: string;
  main: string;
  cooldown: string;
  exercises: RunExercise[];
};

export type GymExercise = {
  name: string;
  sets: number;
  reps: string;
  notes?: string;
};

export type GymWorkout = {
  id: string;
  title: string;
  focus: string;
  estimatedMin: number;
  exercises: GymExercise[];
};

export type DayPlan = {
  date: string;
  dayName: string;
  run: RunWorkout | null;
  gym: GymWorkout | null;
  isRestDay: boolean;
  note?: string;
};

export type WeekPlan = {
  startDate: string;
  endDate: string;
  days: DayPlan[];
};

export type RunLogInput = {
  date: string;
  workoutId: string;
  durationMin?: number;
  distanceMi?: number;
  notes?: string;
  completed?: boolean;
};

export type GymLogInput = {
  date: string;
  workoutId: string;
  notes?: string;
  completed?: boolean;
};

export type CheckInInput = {
  date: string;
  energy: number;
  soreness: number;
  notes?: string;
};

export type CheckIn = CheckInInput & { id: number; createdAt: string };
