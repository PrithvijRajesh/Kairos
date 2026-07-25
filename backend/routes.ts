import { Router, type Request, type Response } from 'express';

import {
  getCheckIn,
  getGoals,
  getGoalsOrDefault,
  insertGymLog,
  insertRunLog,
  listCheckIns,
  listGymLogs,
  listRunLogs,
  todayDateKey,
  upsertCheckIn,
  upsertGoals,
} from './db';
import { buildDayPlan, buildWeekPlan, startOfWeek, toDateKey } from './planEngine';
import type { CheckInInput, Goals, GymLogInput, RunLogInput } from './types';

const router = Router();

function isValidDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseGoalsBody(body: unknown): Goals | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const data = body as Record<string, unknown>;
  if (
    typeof data.runningGoal !== 'string' ||
    typeof data.gymGoal !== 'string' ||
    typeof data.runningImportant !== 'number' ||
    typeof data.gymImportant !== 'number'
  ) {
    return null;
  }
  if (
    data.runningImportant < 0 ||
    data.runningImportant > 100 ||
    data.gymImportant < 0 ||
    data.gymImportant > 100
  ) {
    return null;
  }
  return {
    runningGoal: data.runningGoal,
    gymGoal: data.gymGoal,
    runningImportant: data.runningImportant,
    gymImportant: data.gymImportant,
  };
}

router.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, date: todayDateKey() });
});

router.get('/goals', (_req: Request, res: Response) => {
  const goals = getGoals();
  res.json({ goals });
});

router.put('/goals', (req: Request, res: Response) => {
  const goals = parseGoalsBody(req.body);
  if (!goals) {
    res.status(400).json({ error: 'Invalid goals payload' });
    return;
  }
  const saved = upsertGoals(goals);
  res.json({ goals: saved });
});

router.get('/plan/today', (req: Request, res: Response) => {
  const dateParam = req.query.date;
  const dateKey = isValidDateKey(dateParam) ? dateParam : todayDateKey();
  const goals = getGoalsOrDefault();
  const checkIn = getCheckIn(dateKey);
  const plan = buildDayPlan(dateKey, goals, checkIn);
  res.json({ plan, goals, checkIn });
});

router.get('/plan/week', (req: Request, res: Response) => {
  const dateParam = req.query.date;
  const anchor = isValidDateKey(dateParam) ? dateParam : todayDateKey();
  const goals = getGoalsOrDefault();
  const weekStart = startOfWeek(anchor);
  const weekEnd = toDateKey(
    new Date(
      parseInt(weekStart.slice(0, 4), 10),
      parseInt(weekStart.slice(5, 7), 10) - 1,
      parseInt(weekStart.slice(8, 10), 10) + 6
    )
  );
  const checkIns = listCheckIns(weekStart, weekEnd);
  const checkInsByDate = Object.fromEntries(checkIns.map((c) => [c.date, c]));
  const week = buildWeekPlan(anchor, goals, checkInsByDate);
  res.json({ week, goals });
});

router.post('/logs/run', (req: Request, res: Response) => {
  const body = req.body as Partial<RunLogInput>;
  if (!isValidDateKey(body.date) || typeof body.workoutId !== 'string' || !body.workoutId) {
    res.status(400).json({ error: 'date and workoutId are required' });
    return;
  }
  const log = insertRunLog({
    date: body.date,
    workoutId: body.workoutId,
    durationMin: typeof body.durationMin === 'number' ? body.durationMin : undefined,
    distanceMi: typeof body.distanceMi === 'number' ? body.distanceMi : undefined,
    notes: typeof body.notes === 'string' ? body.notes : undefined,
    completed: body.completed !== false,
  });
  res.status(201).json({ log });
});

router.get('/logs/run', (req: Request, res: Response) => {
  const from = isValidDateKey(req.query.from) ? req.query.from : undefined;
  const to = isValidDateKey(req.query.to) ? req.query.to : undefined;
  res.json({ logs: listRunLogs(from, to) });
});

router.post('/logs/gym', (req: Request, res: Response) => {
  const body = req.body as Partial<GymLogInput>;
  if (!isValidDateKey(body.date) || typeof body.workoutId !== 'string' || !body.workoutId) {
    res.status(400).json({ error: 'date and workoutId are required' });
    return;
  }
  const log = insertGymLog({
    date: body.date,
    workoutId: body.workoutId,
    notes: typeof body.notes === 'string' ? body.notes : undefined,
    completed: body.completed !== false,
  });
  res.status(201).json({ log });
});

router.get('/logs/gym', (req: Request, res: Response) => {
  const from = isValidDateKey(req.query.from) ? req.query.from : undefined;
  const to = isValidDateKey(req.query.to) ? req.query.to : undefined;
  res.json({ logs: listGymLogs(from, to) });
});

router.post('/check-in', (req: Request, res: Response) => {
  const body = req.body as Partial<CheckInInput>;
  if (
    !isValidDateKey(body.date) ||
    typeof body.energy !== 'number' ||
    typeof body.soreness !== 'number' ||
    body.energy < 1 ||
    body.energy > 5 ||
    body.soreness < 1 ||
    body.soreness > 5
  ) {
    res.status(400).json({ error: 'date, energy (1-5), and soreness (1-5) are required' });
    return;
  }
  const checkIn = upsertCheckIn({
    date: body.date,
    energy: body.energy,
    soreness: body.soreness,
    notes: typeof body.notes === 'string' ? body.notes : undefined,
  });
  res.json({ checkIn });
});

router.get('/check-in', (req: Request, res: Response) => {
  const dateParam = req.query.date;
  const dateKey = isValidDateKey(dateParam) ? dateParam : todayDateKey();
  const checkIn = getCheckIn(dateKey);
  res.json({ checkIn });
});

export default router;
