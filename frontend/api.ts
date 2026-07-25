import { Platform } from 'react-native';

import type {
  CheckIn,
  CheckInInput,
  DayPlan,
  Goals,
  GymLogInput,
  RunLogInput,
  WeekPlan,
} from './types';

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api');

const REQUEST_TIMEOUT_MS = 8000;

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const body = (await response.json()) as { error?: string };
        if (body.error) {
          message = body.error;
        }
      } catch {
        // ignore parse errors
      }
      throw new ApiError(message, response.status);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timed out — is the backend running?', 0);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    await request<{ ok: boolean }>('/health');
    return true;
  } catch {
    return false;
  }
}

export async function fetchGoals(): Promise<Goals | null> {
  const data = await request<{ goals: Goals | null }>('/goals');
  return data.goals;
}

export async function saveGoals(goals: Goals): Promise<Goals> {
  const data = await request<{ goals: Goals }>('/goals', {
    method: 'PUT',
    body: JSON.stringify(goals),
  });
  return data.goals;
}

export async function fetchTodayPlan(date?: string): Promise<{
  plan: DayPlan;
  goals: Goals;
  checkIn: CheckIn | null;
}> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return request(`/plan/today${query}`);
}

export async function fetchWeekPlan(date?: string): Promise<{ week: WeekPlan; goals: Goals }> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return request(`/plan/week${query}`);
}

export async function submitRunLog(input: RunLogInput) {
  return request('/logs/run', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function submitGymLog(input: GymLogInput) {
  return request('/logs/gym', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function submitCheckIn(input: CheckInInput): Promise<CheckIn> {
  const data = await request<{ checkIn: CheckIn }>('/check-in', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.checkIn;
}

export async function fetchCheckIn(date?: string): Promise<CheckIn | null> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const data = await request<{ checkIn: CheckIn | null }>(`/check-in${query}`);
  return data.checkIn;
}

export { API_BASE };
