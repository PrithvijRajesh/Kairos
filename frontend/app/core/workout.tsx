// Active core workout session: sets, rest timer, per-side holds, then complete screen.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import {
  getExercisesForWorkout,
  getTodayWorkout,
  formatPrescription,
  getHoldSeconds,
  isPerSideTimeExercise,
} from '../../coreWorkouts';
import {
  getExerciseBonusSeconds,
  getExerciseLevel,
  loadCoreProgress,
  recordCoreWorkoutCompletion,
  saveCoreProgress,
} from '../../coreProgress';
import { colors, radius, spacing } from '../../theme';

type Phase = 'ready' | 'work' | 'rest';
type Side = 'left' | 'right';

export default function CoreWorkoutScreen() {
  const workout = getTodayWorkout();
  const exercises = useMemo(() => getExercisesForWorkout(workout), [workout.id]);

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  const [activeSide, setActiveSide] = useState<Side>('left');
  const [phase, setPhase] = useState<Phase>('ready');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [levels, setLevels] = useState<Record<string, 1 | 2 | 3>>({});
  const [bonusSeconds, setBonusSeconds] = useState<Record<string, number>>({});

  const current = exercises[exerciseIndex];
  const level = current ? (levels[current.id] ?? 1) : 1;
  const isTimeExercise = current?.type === 'time';
  const perSide = current ? isPerSideTimeExercise(current, level) : false;

  const finishWorkout = useCallback(async () => {
    const state = await loadCoreProgress();
    const nextState = recordCoreWorkoutCompletion(state);
    await saveCoreProgress(nextState);
    router.replace('/core/complete');
  }, []);

  const onSetDone = useCallback(() => {
    if (!current) return;

    if (setNumber < current.sets) {
      setPhase('rest');
      setSecondsLeft(current.restSec);
      return;
    }

    if (perSide && activeSide === 'left') {
      setActiveSide('right');
      setSetNumber(1);
      setPhase('ready');
      setSecondsLeft(0);
      return;
    }

    if (exerciseIndex < exercises.length - 1) {
      setExerciseIndex((i) => i + 1);
      setSetNumber(1);
      setActiveSide('left');
      setPhase('ready');
      setSecondsLeft(0);
      return;
    }

    void finishWorkout();
  }, [
    activeSide,
    current,
    exerciseIndex,
    exercises.length,
    finishWorkout,
    perSide,
    setNumber,
  ]);

  const finishRest = useCallback(() => {
    setSetNumber((n) => n + 1);
    setPhase('ready');
    setSecondsLeft(0);
  }, []);

  if (!current) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No exercises found for this workout.</Text>
      </View>
    );
  }

  function formatClock(totalSec: number) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function startTimedSet() {
    const holdSec = (getHoldSeconds(current, level) ?? 30) + (bonusSeconds[current.id] ?? 0);
    setSecondsLeft(holdSec);
    setPhase('work');
  }

  function sideLabel(side: Side) {
    return side === 'left' ? 'Left side' : 'Right side';
  }

  useEffect(() => {
    let isMounted = true;
    async function loadLevelsAndBonus() {
      const state = await loadCoreProgress();
      if (!isMounted) return;
      const nextLevels: Record<string, 1 | 2 | 3> = {};
      const nextBonus: Record<string, number> = {};
      for (const exercise of exercises) {
        nextLevels[exercise.id] = getExerciseLevel(state, exercise.id);
        nextBonus[exercise.id] = getExerciseBonusSeconds(state, exercise.id);
      }
      setLevels(nextLevels);
      setBonusSeconds(nextBonus);
    }
    loadLevelsAndBonus();
    return () => {
      isMounted = false;
    };
  }, [workout.id]);

  useEffect(() => {
    if ((phase !== 'work' && phase !== 'rest') || secondsLeft <= 0) {
      return;
    }

    const id = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [phase, secondsLeft]);

  useEffect(() => {
    if (secondsLeft !== 0) return;

    if (phase === 'work') {
      onSetDone();
    } else if (phase === 'rest') {
      finishRest();
    }
  }, [secondsLeft, phase, onSetDone, finishRest]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.meta}>
        Workout {workout.id} · Exercise {exerciseIndex + 1}/{exercises.length}
      </Text>
      <Text style={styles.title}>{current.name}</Text>
      <Text style={styles.prescription}>{formatPrescription(current, level)}</Text>
      <Text style={styles.setLabel}>
        Set {setNumber} of {current.sets}
        {perSide ? ` · ${sideLabel(activeSide)}` : ''}
      </Text>

      {phase === 'ready' && perSide && activeSide === 'right' && (
        <Text style={styles.switchHint}>Switch to your right side</Text>
      )}

      {phase === 'work' && (
        <View style={styles.timerBox}>
          <Text style={styles.timerText}>{formatClock(secondsLeft)}</Text>
          <Text style={styles.phaseLabel}>
            Hold{perSide ? ` — ${sideLabel(activeSide)}` : ''}
          </Text>
        </View>
      )}

      {phase === 'rest' && (
        <View style={styles.timerBox}>
          <Text style={styles.timerText}>{formatClock(secondsLeft)}</Text>
          <Text style={styles.phaseLabel}>Rest</Text>
          <Pressable style={styles.secondaryButton} onPress={finishRest}>
            <Text style={styles.secondaryButtonText}>Skip rest</Text>
          </Pressable>
        </View>
      )}

      {phase === 'ready' && (
        <View style={styles.actions}>
          {isTimeExercise ? (
            <Pressable style={styles.primaryButton} onPress={startTimedSet}>
              <Text style={styles.primaryButtonText}>
                {perSide ? `Start ${sideLabel(activeSide)}` : 'Start set'}
              </Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.primaryButton} onPress={onSetDone}>
            <Text style={styles.primaryButtonText}>
              {isTimeExercise ? 'End set early' : 'Set done'}
            </Text>
          </Pressable>
        </View>
      )}

      {phase === 'work' && (
        <Pressable style={styles.secondaryButton} onPress={onSetDone}>
          <Text style={styles.secondaryButtonText}>End set</Text>
        </Pressable>
      )}

      <View style={styles.cuesBox}>
        {current.cues.map((cue) => (
          <Text key={cue} style={styles.cue}>
            • {cue}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.lg * 2,
  },
  meta: {
    fontSize: 14,
    color: colors.textMuted,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  prescription: {
    fontSize: 16,
    color: colors.text,
  },
  setLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
  switchHint: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
    backgroundColor: colors.accentSoft,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  timerBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  phaseLabel: {
    fontSize: 16,
    color: colors.textMuted,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  cuesBox: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  cue: {
    fontSize: 14,
    color: colors.textMuted,
  },
  text: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
});
