// Active core workout session: sets, rest timer, then review screen.
import { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import {
  getExercisesForWorkout,
  getTodayWorkout,
  formatPrescription,
  getHoldSeconds,
} from '../../coreWorkouts';
import { colors, radius, spacing } from '../../theme';

type Phase = 'ready' | 'work' | 'rest';

export default function CoreWorkoutScreen() {
  const workout = getTodayWorkout();
  const exercises = getExercisesForWorkout(workout);

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  const [phase, setPhase] = useState<Phase>('ready');
  const [secondsLeft, setSecondsLeft] = useState(0);

  const level = 1 as 1 | 2 | 3; // Step 4: load from core progress storage
  const current = exercises[exerciseIndex];
  const isTimeExercise = current?.type === 'time';

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

  /** After a set: rest, next exercise, or review */
  function onSetDone() {
    if (setNumber < current.sets) {
      setPhase('rest');
      setSecondsLeft(current.restSec);
      return;
    }
    if (exerciseIndex < exercises.length - 1) {
      setExerciseIndex((i) => i + 1);
      setSetNumber(1);
      setPhase('ready');
      setSecondsLeft(0);
      return;
    }
    router.replace('/core/review');
  }

  /** After rest between sets: go to next set */
  function finishRest() {
    setSetNumber((n) => n + 1);
    setPhase('ready');
    setSecondsLeft(0);
  }

  function startTimedSet() {
    const holdSec = getHoldSeconds(current, level) ?? 30;
    setSecondsLeft(holdSec);
    setPhase('work');
  }

  // Count down during work / rest
  useEffect(() => {
    if ((phase !== 'work' && phase !== 'rest') || secondsLeft <= 0) {
      return;
    }

    const id = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [phase, secondsLeft]);

  // When timer hits 0: work -> rest, rest -> next set
  useEffect(() => {
    if (secondsLeft !== 0) return;

    if (phase === 'work') {
      onSetDone();
    } else if (phase === 'rest') {
      finishRest();
    }
  }, [secondsLeft, phase]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.meta}>
        Workout {workout.id} · Exercise {exerciseIndex + 1}/{exercises.length}
      </Text>
      <Text style={styles.title}>{current.name}</Text>
      <Text style={styles.prescription}>{formatPrescription(current, level)}</Text>
      <Text style={styles.setLabel}>
        Set {setNumber} of {current.sets}
      </Text>

      {phase === 'work' && (
        <View style={styles.timerBox}>
          <Text style={styles.timerText}>{formatClock(secondsLeft)}</Text>
          <Text style={styles.phaseLabel}>Hold</Text>
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
              <Text style={styles.primaryButtonText}>Start set</Text>
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
