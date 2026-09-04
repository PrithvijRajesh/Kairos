import type { CheckIn, DayPlan, Goals, WeekPlan } from './types';
import { getGymWorkout, getRunWorkout } from './workouts';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type Slot = { runId: string | null; gymId: string | null; note?: string };

function padDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return padDate(date);
}

function startOfWeek(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  return padDate(date);
}

function weeklyTemplate(runningImportant: number): Record<number, Slot> {
  // Race-prep week — only when running is the main goal.
  if (runningImportant >= 65) {
    return {
      0: { runId: null, gymId: null, note: 'Rest or light mobility' },
      1: { runId: 'easy_run_30', gymId: null },
      2: { runId: null, gymId: 'lift_tab', note: 'Lift: follow the Lift tab' },
      3: { runId: 'intervals_400', gymId: null },
      4: { runId: 'recovery_run_20', gymId: null },
      5: { runId: 'tempo_20', gymId: null },
      6: { runId: 'long_run_60', gymId: null },
    };
  }

  // Default: lift-first. Cardio is optional so you stay in shape, not race-ready.
  if (runningImportant <= 35) {
    return {
      0: {
        runId: 'optional_cardio_25',
        gymId: null,
        note: 'Optional cardio on a lift rest day. Run, treadmill, or bike. Skip anytime.',
      },
      1: { runId: null, gymId: 'lift_tab', note: 'Lift day — use the Lift tab' },
      2: { runId: null, gymId: 'lift_tab', note: 'Lift day — use the Lift tab' },
      3: { runId: null, gymId: 'lift_tab', note: 'Lift day — use the Lift tab' },
      4: {
        runId: 'optional_cardio_25',
        gymId: null,
        note: 'Optional 20–30 min easy. Bike or incline walk if legs are sore.',
      },
      5: { runId: null, gymId: 'lift_tab', note: 'Lift day — use the Lift tab' },
      6: { runId: null, gymId: 'lift_tab', note: 'Lift day — use the Lift tab' },
    };
  }

  return {
    0: {
      runId: 'optional_cardio_40',
      gymId: null,
      note: 'Optional longer easy cardio. Skip if you need the rest.',
    },
    1: { runId: null, gymId: 'lift_tab', note: 'Lift day — use the Lift tab' },
    2: { runId: 'optional_cardio_25', gymId: 'lift_tab', note: 'Keep cardio easy if you also lift' },
    3: { runId: null, gymId: 'lift_tab', note: 'Lift day — use the Lift tab' },
    4: { runId: null, gymId: 'lift_tab', note: 'Lift day — use the Lift tab' },
    5: { runId: 'easy_run_30', gymId: null, note: 'Easy only — not intervals' },
    6: { runId: null, gymId: 'lift_tab', note: 'Lift day — use the Lift tab' },
  };
}

function applyCheckInAdjustments(slot: Slot, checkIn: CheckIn | null): Slot {
  if (!checkIn) {
    return slot;
  }

  const tired = checkIn.energy <= 2 || checkIn.soreness >= 4;
  const fresh = checkIn.energy >= 4 && checkIn.soreness <= 2;

  if (tired) {
    if (slot.runId === 'intervals_400' || slot.runId === 'tempo_20') {
      return { ...slot, runId: 'easy_run_30', note: 'Adjusted: easier run based on check-in' };
    }
    if (slot.runId === 'long_run_60') {
      return { ...slot, runId: 'easy_run_45', note: 'Adjusted: shorter long run based on check-in' };
    }
    if (
      slot.runId === 'optional_cardio_25' ||
      slot.runId === 'optional_cardio_40' ||
      slot.runId === 'easy_run_30'
    ) {
      return {
        ...slot,
        runId: null,
        note: 'Adjusted: skip cardio today — lift recovery comes first',
      };
    }
    if (slot.gymId && slot.gymId !== 'light_gym' && slot.gymId !== 'lift_tab') {
      return { ...slot, gymId: 'light_gym', note: 'Adjusted: lighter gym based on check-in' };
    }
  }

  if (fresh && slot.runId === 'easy_run_30') {
    return { ...slot, note: 'Feeling good — add 4 strides in the last 10 min if legs feel snappy' };
  }

  return slot;
}

function slotToDayPlan(dateKey: string, slot: Slot): DayPlan {
  const date = parseDateKey(dateKey);
  const run = slot.runId ? getRunWorkout(slot.runId) : null;
  const gym = slot.gymId ? getGymWorkout(slot.gymId) : null;

  return {
    date: dateKey,
    dayName: DAY_NAMES[date.getDay()],
    run,
    gym,
    isRestDay: !run && !gym,
    note: slot.note,
  };
}

export function buildDayPlan(
  dateKey: string,
  goals: Goals,
  checkIn: CheckIn | null
): DayPlan {
  const template = weeklyTemplate(goals.runningImportant);
  const dayOfWeek = parseDateKey(dateKey).getDay();
  const slot = applyCheckInAdjustments(template[dayOfWeek], checkIn);
  return slotToDayPlan(dateKey, slot);
}

export function buildWeekPlan(
  dateKey: string,
  goals: Goals,
  checkInsByDate: Record<string, CheckIn>
): WeekPlan {
  const weekStart = startOfWeek(dateKey);
  const days: DayPlan[] = [];

  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    const checkIn = checkInsByDate[day] ?? null;
    days.push(buildDayPlan(day, goals, checkIn));
  }

  return {
    startDate: weekStart,
    endDate: addDays(weekStart, 6),
    days,
  };
}

export { padDate as toDateKey, startOfWeek };
