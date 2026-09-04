/** Chill-phase cardio coach + 4-mile easy test for a later training block. */

export type CardioMode = 'run' | 'treadmill' | 'bike';
export type CardioEffort = 'light' | 'normal' | 'farther';
export type TrainingPhase = 'chill' | 'test_pending' | 'training';
export type FitnessBand = 'rebuild' | 'building' | 'solid' | 'strong';

export type CardioSessionLog = {
  date: string;
  mode: CardioMode;
  effort?: CardioEffort;
  durationMin?: number;
  /** Outdoor run only — treadmill uses minutes, not miles. */
  distanceMi?: number;
  /** Treadmill incline % (0–15 typical). */
  inclinePercent?: number;
  /** Bike resistance level (machine number). */
  resistance?: number;
  workoutId: string;
  notes?: string;
  isTestRun?: boolean;
};

export type TrainingState = {
  phase: TrainingPhase;
  fitnessBand: FitnessBand | null;
  testDistanceMi: number;
  testCompletedAt?: string;
  testTimeMin?: number;
};

export const DEFAULT_TRAINING_STATE: TrainingState = {
  phase: 'chill',
  fitnessBand: null,
  testDistanceMi: 4,
};

export const TEST_RUN_MILES = 4;

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function daysBetween(fromKey: string, toKey: string): number {
  const ms = parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function roundHalf(miles: number): number {
  return Math.round(miles * 2) / 2;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Outdoor runs only — treadmill miles aren't a fair match to outside. */
export function lastOutdoorRunWithDistance(logs: CardioSessionLog[]): CardioSessionLog | null {
  const runs = logs.filter(
    (log) => log.mode === 'run' && log.distanceMi && log.distanceMi > 0
  );
  return runs[0] ?? null;
}

/** @deprecated use lastOutdoorRunWithDistance */
export function lastRunWithDistance(logs: CardioSessionLog[]): CardioSessionLog | null {
  return lastOutdoorRunWithDistance(logs);
}

export function lastSessionForMode(
  logs: CardioSessionLog[],
  mode: CardioMode
): CardioSessionLog | null {
  return logs.find((log) => log.mode === mode && (log.durationMin || log.distanceMi)) ?? null;
}

export type MileageRec = {
  lightMi: number;
  normalMi: number;
  fartherMi: number;
  reason: string;
  lastMiles: number | null;
  daysSince: number | null;
};

export type MinutesRec = {
  lightMin: number;
  normalMin: number;
  fartherMin: number;
  reason: string;
  lastMin: number | null;
  daysSince: number | null;
  /** Suggested bike resistance for this effort band */
  resistance?: { light: number; normal: number; farther: number };
  /** Suggested treadmill incline % */
  incline?: { light: number; normal: number; farther: number };
};

function lastTaggedOutdoor(
  logs: CardioSessionLog[],
  effort: CardioEffort
): CardioSessionLog | null {
  return (
    logs.find(
      (log) =>
        log.mode === 'run' &&
        log.effort === effort &&
        log.distanceMi != null &&
        log.distanceMi > 0
    ) ?? null
  );
}

function lastTaggedTimed(
  logs: CardioSessionLog[],
  mode: 'treadmill' | 'bike',
  effort: CardioEffort
): CardioSessionLog | null {
  return (
    logs.find(
      (log) =>
        log.mode === mode &&
        log.effort === effort &&
        log.durationMin != null &&
        log.durationMin > 0
    ) ?? null
  );
}

/** Shrink volume after a layoff. */
function decayVolume(last: number, daysSince: number): number {
  if (daysSince <= 3) return last;
  if (daysSince <= 7) return last * 0.9;
  return last * 0.6;
}

/**
 * Chill / Normal / Harder are intensity tags (how it felt), not fixed distances.
 * Baselines learn from what you logged under each tag.
 * Example: did 4 mi and tagged Chill → next Chill suggestion rises toward 4.
 */
export function recommendMileage(logs: CardioSessionLog[], todayKey: string): MileageRec {
  const defaults = { light: 2, normal: 3, farther: 4 };
  const efforts: CardioEffort[] = ['light', 'normal', 'farther'];
  const values: Record<CardioEffort, number> = { ...defaults };
  const notes: string[] = [];

  for (const effort of efforts) {
    const tagged = lastTaggedOutdoor(logs, effort);
    if (tagged?.distanceMi) {
      const days = daysBetween(tagged.date, todayKey);
      values[effort] = clamp(roundHalf(decayVolume(tagged.distanceMi, days)), 1.5, 12);
      notes.push(
        `${effortLabel(effort)} last ${formatMiles(tagged.distanceMi)} (${days === 0 ? 'today' : days + 'd ago'})`
      );
    }
  }

  const any = lastOutdoorRunWithDistance(logs);
  if (any?.distanceMi && values.normal === defaults.normal && !lastTaggedOutdoor(logs, 'normal')) {
    const days = daysBetween(any.date, todayKey);
    values.normal = clamp(roundHalf(decayVolume(any.distanceMi, days)), 2, 10);
  }

  if (values.normal < values.light) values.normal = roundHalf(values.light + 0.5);
  if (values.farther < values.normal) values.farther = roundHalf(values.normal + 0.5);

  const reason =
    notes.length > 0
      ? `Intensity tags learn from you. ${notes.join(' · ')}. When you log, tag how hard it felt.`
      : 'No tagged outdoor runs yet. Suggestions start easy — log Chill / Normal / Harder so baselines learn.';

  return {
    lightMi: values.light,
    normalMi: values.normal,
    fartherMi: values.farther,
    reason,
    lastMiles: any?.distanceMi ?? null,
    daysSince: any ? daysBetween(any.date, todayKey) : null,
  };
}

/** Time-based baselines for treadmill / bike — same intensity-tag learning. */
export function recommendMinutes(
  logs: CardioSessionLog[],
  todayKey: string,
  mode: 'treadmill' | 'bike'
): MinutesRec {
  const defaults = { light: 20, normal: 30, farther: 40 };
  const inclineDefault = { light: 0.5, normal: 1, farther: 2 };
  const resistanceDefault = { light: 4, normal: 6, farther: 8 };
  const efforts: CardioEffort[] = ['light', 'normal', 'farther'];
  const values: Record<CardioEffort, number> = { ...defaults };
  const notes: string[] = [];

  for (const effort of efforts) {
    const tagged = lastTaggedTimed(logs, mode, effort);
    if (tagged?.durationMin) {
      const days = daysBetween(tagged.date, todayKey);
      values[effort] = clamp(Math.round(decayVolume(tagged.durationMin, days) / 5) * 5, 15, 90);
      notes.push(
        `${effortLabel(effort)} last ${tagged.durationMin} min (${days === 0 ? 'today' : days + 'd ago'})`
      );
    }
  }

  const any = lastSessionForMode(logs, mode);
  if (
    any?.durationMin &&
    values.normal === defaults.normal &&
    !lastTaggedTimed(logs, mode, 'normal')
  ) {
    const days = daysBetween(any.date, todayKey);
    values.normal = clamp(Math.round(decayVolume(any.durationMin, days) / 5) * 5, 20, 75);
  }

  if (values.normal < values.light) values.normal = values.light + 5;
  if (values.farther < values.normal) values.farther = values.normal + 5;

  const lastRes = any?.resistance;
  const lastInc = any?.inclinePercent;

  const reason =
    notes.length > 0
      ? `Intensity tags learn from you. ${notes.join(' · ')}. Tag how hard it felt when you log.`
      : mode === 'bike'
        ? 'No tagged bike yet. Easy 20–40 min. Log resistance + intensity so next time matches you.'
        : 'No tagged treadmill yet. Easy 20–40 min (time, not belt miles). Log incline + intensity.';

  return {
    lightMin: values.light,
    normalMin: values.normal,
    fartherMin: values.farther,
    reason,
    lastMin: any?.durationMin ?? null,
    daysSince: any ? daysBetween(any.date, todayKey) : null,
    incline:
      mode === 'treadmill'
        ? {
            light: lastInc != null ? Math.max(0, lastInc - 0.5) : inclineDefault.light,
            normal: lastInc != null ? lastInc : inclineDefault.normal,
            farther: lastInc != null ? lastInc + 1 : inclineDefault.farther,
          }
        : undefined,
    resistance:
      mode === 'bike'
        ? {
            light: lastRes != null ? Math.max(1, lastRes - 1) : resistanceDefault.light,
            normal: lastRes != null ? lastRes : resistanceDefault.normal,
            farther: lastRes != null ? lastRes + 1 : resistanceDefault.farther,
          }
        : undefined,
  };
}

export function milesForEffort(rec: MileageRec, effort: CardioEffort): number {
  if (effort === 'light') return rec.lightMi;
  if (effort === 'farther') return rec.fartherMi;
  return rec.normalMi;
}

export function minutesForEffort(rec: MinutesRec, effort: CardioEffort): number {
  if (effort === 'light') return rec.lightMin;
  if (effort === 'farther') return rec.fartherMin;
  return rec.normalMin;
}

/** Easy bike time ≈ 8 min per outdoor-run-mile equivalent (fallback only). */
export function bikeMinutesForMiles(miles: number): number {
  return Math.round(miles * 8);
}

export function formatMiles(miles: number): string {
  return Number.isInteger(miles) ? `${miles} mi` : `${miles.toFixed(1)} mi`;
}

export function effortLabel(effort: CardioEffort): string {
  if (effort === 'light') return 'Chill';
  if (effort === 'farther') return 'Harder';
  return 'Normal';
}

export function modeLabel(mode: CardioMode): string {
  if (mode === 'treadmill') return 'Treadmill';
  if (mode === 'bike') return 'Bike';
  return 'Run';
}

export type SessionPrescription = {
  title: string;
  main: string;
  suggestedMi?: number;
  suggestedMin: number;
  suggestedIncline?: number;
  suggestedResistance?: number;
  workoutId: string;
  metaLine?: string;
  reason: string;
};

export function prescribeSession(
  mode: CardioMode,
  effort: CardioEffort,
  mileRec: MileageRec,
  minuteRec: MinutesRec
): SessionPrescription {
  if (mode === 'bike') {
    const min = minutesForEffort(minuteRec, effort);
    const res =
      effort === 'light'
        ? minuteRec.resistance?.light
        : effort === 'farther'
          ? minuteRec.resistance?.farther
          : minuteRec.resistance?.normal;
    return {
      title: `${effortLabel(effort)} bike · suggested`,
      main: `About ${min} min${res != null ? ` · resistance ~${res}` : ''}. Do what you want — tag how hard it felt when you log.`,
      suggestedMin: min,
      suggestedResistance: res,
      workoutId: `bike_${effort}`,
      metaLine: `Chill ~${minuteRec.lightMin} min · Normal ~${minuteRec.normalMin} · Harder ~${minuteRec.fartherMin}`,
      reason: minuteRec.reason,
    };
  }

  if (mode === 'treadmill') {
    const min = minutesForEffort(minuteRec, effort);
    const incline =
      effort === 'light'
        ? minuteRec.incline?.light
        : effort === 'farther'
          ? minuteRec.incline?.farther
          : minuteRec.incline?.normal;
    return {
      title: `${effortLabel(effort)} treadmill · suggested`,
      main: `About ${min} min${incline != null ? ` · incline ~${incline}%` : ''}. Time-based (not belt miles). Tag intensity when you log.`,
      suggestedMin: min,
      suggestedIncline: incline,
      workoutId: `treadmill_${effort}`,
      metaLine: `Chill ~${minuteRec.lightMin} min · Normal ~${minuteRec.normalMin} · Harder ~${minuteRec.fartherMin}`,
      reason: minuteRec.reason,
    };
  }

  const miles = milesForEffort(mileRec, effort);
  return {
    title: `${effortLabel(effort)} outdoor · suggested`,
    main: `About ${formatMiles(miles)} outside. Do more or less — when you log, tag Chill / Normal / Harder so baselines learn.`,
    suggestedMi: miles,
    suggestedMin: Math.round(miles * 10),
    workoutId: `run_${effort}`,
    metaLine: `Chill ~${formatMiles(mileRec.lightMi)} · Normal ~${formatMiles(mileRec.normalMi)} · Harder ~${formatMiles(mileRec.fartherMi)}`,
    reason: mileRec.reason,
  };
}

/**
 * 4-mile easy test (not a race). Pace bands for aerobic fitness:
 * rebuild ≥36 min, building 32–36, solid 28–32, strong <28.
 */
export function classifyFourMileEasy(durationMin: number, distanceMi: number): {
  band: FitnessBand;
  fourMileMin: number;
  paceSec: number;
  label: string;
  blurb: string;
} {
  const fourMileMin = distanceMi > 0 ? (durationMin / distanceMi) * TEST_RUN_MILES : durationMin;
  const paceSec = (fourMileMin / TEST_RUN_MILES) * 60;

  if (fourMileMin >= 36) {
    return {
      band: 'rebuild',
      fourMileMin,
      paceSec,
      label: 'Rebuild',
      blurb: 'Start from the ground up: short easy days, walk-run is fine. No speed work yet.',
    };
  }
  if (fourMileMin >= 32) {
    return {
      band: 'building',
      fourMileMin,
      paceSec,
      label: 'Building',
      blurb: 'Okay aerobic base. 3 easy runs a week and a gentle long run. Add strides later, not now.',
    };
  }
  if (fourMileMin >= 28) {
    return {
      band: 'solid',
      fourMileMin,
      paceSec,
      label: 'Solid',
      blurb: 'Decent fitness. You can handle a real half build: easy volume first, then one quality day.',
    };
  }
  return {
    band: 'strong',
    fourMileMin,
    paceSec,
    label: 'Strong',
    blurb: 'Strong easy pace. Half training can start with more volume and one workout a week.',
  };
}

export function formatPace(paceSec: number): string {
  const m = Math.floor(paceSec / 60);
  const s = Math.round(paceSec % 60);
  return `${m}:${String(s).padStart(2, '0')}/mi`;
}

export type TrainingDay = {
  name: string;
  session: string;
};

export function trainingWeekForBand(band: FitnessBand): TrainingDay[] {
  if (band === 'rebuild') {
    return [
      { name: 'Day 1', session: 'Easy 2 mi or 20 min (walk-run OK)' },
      { name: 'Day 2', session: 'Rest or lift' },
      { name: 'Day 3', session: 'Easy 2–2.5 mi' },
      { name: 'Day 4', session: 'Rest' },
      { name: 'Day 5', session: 'Optional easy 20 min' },
      { name: 'Day 6', session: 'Longest: easy 3 mi' },
      { name: 'Day 7', session: 'Rest' },
    ];
  }
  if (band === 'building') {
    return [
      { name: 'Day 1', session: 'Easy 3 mi' },
      { name: 'Day 2', session: 'Rest or lift' },
      { name: 'Day 3', session: 'Easy 3 mi + 4 strides if legs feel snappy' },
      { name: 'Day 4', session: 'Rest' },
      { name: 'Day 5', session: 'Easy 2.5–3 mi' },
      { name: 'Day 6', session: 'Long: easy 5 mi' },
      { name: 'Day 7', session: 'Rest' },
    ];
  }
  if (band === 'solid') {
    return [
      { name: 'Day 1', session: 'Easy 4 mi' },
      { name: 'Day 2', session: 'Rest or lift' },
      { name: 'Day 3', session: 'Easy 3 mi or 20 min easy + 6 strides' },
      { name: 'Day 4', session: 'Rest' },
      { name: 'Day 5', session: 'Quality later: for now easy 4 mi' },
      { name: 'Day 6', session: 'Long: easy 6–7 mi' },
      { name: 'Day 7', session: 'Rest' },
    ];
  }
  return [
    { name: 'Day 1', session: 'Easy 4–5 mi' },
    { name: 'Day 2', session: 'Rest or lift' },
    { name: 'Day 3', session: 'Easy 4 mi or light workout (tempo 15 min) if recovered' },
    { name: 'Day 4', session: 'Rest' },
    { name: 'Day 5', session: 'Easy 3–4 mi' },
    { name: 'Day 6', session: 'Long: easy 8 mi' },
    { name: 'Day 7', session: 'Rest' },
  ];
}
