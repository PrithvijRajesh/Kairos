import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

import type {
  CheckIn,
  CheckInInput,
  Goals,
  GymLog,
  GymLogInput,
  RunLog,
  RunLogInput,
} from './types';
import { DEFAULT_USER_ID } from './types';
import { toDateKey } from './planEngine';

const DB_PATH = process.env.KAIROS_DB_PATH ?? path.join(__dirname, 'kairos.db');

let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
    migrate();
    ensureDefaultUser();
  }
  return db;
}

function migrate(): void {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  getDb().exec(schema);
}

function ensureDefaultUser(): void {
  getDb()
    .prepare('INSERT OR IGNORE INTO users (id) VALUES (?)')
    .run(DEFAULT_USER_ID);
}

const DEFAULT_GOALS: Goals = {
  runningGoal: '',
  gymGoal: '',
  runningImportant: 50,
  gymImportant: 50,
};

export function getGoals(userId = DEFAULT_USER_ID): Goals | null {
  const row = getDb()
    .prepare(
      `SELECT running_goal, gym_goal, running_important, gym_important
       FROM goals WHERE user_id = ?`
    )
    .get(userId) as
    | {
        running_goal: string;
        gym_goal: string;
        running_important: number;
        gym_important: number;
      }
    | undefined;

  if (!row) {
    return null;
  }

  return {
    runningGoal: row.running_goal,
    gymGoal: row.gym_goal,
    runningImportant: row.running_important,
    gymImportant: row.gym_important,
  };
}

export function upsertGoals(goals: Goals, userId = DEFAULT_USER_ID): Goals {
  getDb()
    .prepare(
      `INSERT INTO goals (user_id, running_goal, gym_goal, running_important, gym_important, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET
         running_goal = excluded.running_goal,
         gym_goal = excluded.gym_goal,
         running_important = excluded.running_important,
         gym_important = excluded.gym_important,
         updated_at = datetime('now')`
    )
    .run(
      userId,
      goals.runningGoal,
      goals.gymGoal,
      goals.runningImportant,
      goals.gymImportant
    );

  return goals;
}

export function getGoalsOrDefault(userId = DEFAULT_USER_ID): Goals {
  return getGoals(userId) ?? DEFAULT_GOALS;
}

export function insertRunLog(input: RunLogInput, userId = DEFAULT_USER_ID): RunLog {
  const result = getDb()
    .prepare(
      `INSERT INTO run_logs (user_id, log_date, workout_id, duration_min, distance_mi, notes, completed)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      userId,
      input.date,
      input.workoutId,
      input.durationMin ?? null,
      input.distanceMi ?? null,
      input.notes ?? null,
      input.completed === false ? 0 : 1
    );

  return {
    id: Number(result.lastInsertRowid),
    date: input.date,
    workoutId: input.workoutId,
    durationMin: input.durationMin,
    distanceMi: input.distanceMi,
    notes: input.notes,
    completed: input.completed !== false,
    createdAt: new Date().toISOString(),
  };
}

export function insertGymLog(input: GymLogInput, userId = DEFAULT_USER_ID): GymLog {
  const result = getDb()
    .prepare(
      `INSERT INTO gym_logs (user_id, log_date, workout_id, notes, completed)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      userId,
      input.date,
      input.workoutId,
      input.notes ?? null,
      input.completed === false ? 0 : 1
    );

  return {
    id: Number(result.lastInsertRowid),
    date: input.date,
    workoutId: input.workoutId,
    notes: input.notes,
    completed: input.completed !== false,
    createdAt: new Date().toISOString(),
  };
}

export function listRunLogs(from?: string, to?: string, userId = DEFAULT_USER_ID): RunLog[] {
  let query = `SELECT id, log_date, workout_id, duration_min, distance_mi, notes, completed, created_at
               FROM run_logs WHERE user_id = ?`;
  const params: (string | number)[] = [userId];

  if (from) {
    query += ' AND log_date >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND log_date <= ?';
    params.push(to);
  }
  query += ' ORDER BY log_date DESC, id DESC';

  const rows = getDb().prepare(query).all(...params) as Array<{
    id: number;
    log_date: string;
    workout_id: string;
    duration_min: number | null;
    distance_mi: number | null;
    notes: string | null;
    completed: number;
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    date: row.log_date,
    workoutId: row.workout_id,
    durationMin: row.duration_min ?? undefined,
    distanceMi: row.distance_mi ?? undefined,
    notes: row.notes ?? undefined,
    completed: row.completed === 1,
    createdAt: row.created_at,
  }));
}

export function listGymLogs(from?: string, to?: string, userId = DEFAULT_USER_ID): GymLog[] {
  let query = `SELECT id, log_date, workout_id, notes, completed, created_at
               FROM gym_logs WHERE user_id = ?`;
  const params: (string | number)[] = [userId];

  if (from) {
    query += ' AND log_date >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND log_date <= ?';
    params.push(to);
  }
  query += ' ORDER BY log_date DESC, id DESC';

  const rows = getDb().prepare(query).all(...params) as Array<{
    id: number;
    log_date: string;
    workout_id: string;
    notes: string | null;
    completed: number;
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    date: row.log_date,
    workoutId: row.workout_id,
    notes: row.notes ?? undefined,
    completed: row.completed === 1,
    createdAt: row.created_at,
  }));
}

export function upsertCheckIn(input: CheckInInput, userId = DEFAULT_USER_ID): CheckIn {
  getDb()
    .prepare(
      `INSERT INTO check_ins (user_id, check_in_date, energy, soreness, notes)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, check_in_date) DO UPDATE SET
         energy = excluded.energy,
         soreness = excluded.soreness,
         notes = excluded.notes,
         created_at = datetime('now')`
    )
    .run(userId, input.date, input.energy, input.soreness, input.notes ?? null);

  const row = getDb()
    .prepare(
      `SELECT id, check_in_date, energy, soreness, notes, created_at
       FROM check_ins WHERE user_id = ? AND check_in_date = ?`
    )
    .get(userId, input.date) as {
    id: number;
    check_in_date: string;
    energy: number;
    soreness: number;
    notes: string | null;
    created_at: string;
  };

  return {
    id: row.id,
    date: row.check_in_date,
    energy: row.energy,
    soreness: row.soreness,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

export function getCheckIn(dateKey: string, userId = DEFAULT_USER_ID): CheckIn | null {
  const row = getDb()
    .prepare(
      `SELECT id, check_in_date, energy, soreness, notes, created_at
       FROM check_ins WHERE user_id = ? AND check_in_date = ?`
    )
    .get(userId, dateKey) as
    | {
        id: number;
        check_in_date: string;
        energy: number;
        soreness: number;
        notes: string | null;
        created_at: string;
      }
    | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    date: row.check_in_date,
    energy: row.energy,
    soreness: row.soreness,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

export function listCheckIns(from: string, to: string, userId = DEFAULT_USER_ID): CheckIn[] {
  const rows = getDb()
    .prepare(
      `SELECT id, check_in_date, energy, soreness, notes, created_at
       FROM check_ins
       WHERE user_id = ? AND check_in_date >= ? AND check_in_date <= ?
       ORDER BY check_in_date ASC`
    )
    .all(userId, from, to) as Array<{
    id: number;
    check_in_date: string;
    energy: number;
    soreness: number;
    notes: string | null;
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    date: row.check_in_date,
    energy: row.energy,
    soreness: row.soreness,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  }));
}

export function todayDateKey(): string {
  return toDateKey(new Date());
}
