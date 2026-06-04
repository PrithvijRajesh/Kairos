// Core list: today's workout preview and Start workout button.
import { ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  getTodayWorkout,
  getExercisesForWorkout,
  formatPrescription,
  getProgramStatusLabel,
} from '../../coreWorkouts';
import { getExerciseLevel, loadCoreProgress } from '../../coreProgress';
import { useTheme } from '../../ThemeContext';
import { radius, spacing } from '../../theme';

export default function CoreScreen() {
  const { colors, programStartDate } = useTheme();
  const workout = getTodayWorkout(programStartDate);
  const exercises = getExercisesForWorkout(workout);
  const [levels, setLevels] = useState<Record<string, 1 | 2 | 3>>({});
  const [currentStreak, setCurrentStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      async function loadLevels() {
        const state = await loadCoreProgress();
        if (!isMounted) return;
        const nextLevels: Record<string, 1 | 2 | 3> = {};
        for (const exercise of exercises) {
          nextLevels[exercise.id] = getExerciseLevel(state, exercise.id);
        }
        setLevels(nextLevels);
        setCurrentStreak(state.streak.currentStreak);
      }
      loadLevels();
      return () => {
        isMounted = false;
      };
    }, [workout.id, exercises])
  );

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.badge}>Workout {workout.id}</Text>
        <Text style={styles.title}>{workout.title}</Text>
        <Text style={styles.subtitle}>{workout.focus}</Text>
        <Text style={styles.meta}>{getProgramStatusLabel(new Date(), programStartDate)}</Text>
        <Text style={styles.meta}>~{workout.estimatedMin} min</Text>
        {currentStreak > 0 ? (
          <Text style={styles.streakBadge}>
            {currentStreak} day streak
          </Text>
        ) : null}

        {exercises.map((exercise) => (
          <View key={exercise.id} style={styles.card}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.exercisePrescription}>
              {formatPrescription(exercise, levels[exercise.id] ?? 1)}
            </Text>
            {exercise.cues.map((cue) => (
              <Text key={cue} style={styles.cue}>
                • {cue}
              </Text>
            ))}
            {exercise.stopIf ? (
              <Text style={styles.note}>{exercise.stopIf}</Text>
            ) : null}
          </View>
        ))}

        <Pressable
          style={styles.startButton}
          onPress={() => router.push('/core/workout')}
        >
          <Text style={styles.startButtonText}>Start workout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.lg * 2,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
  },
  meta: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  streakBadge: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  exercisePrescription: {
    fontSize: 15,
    color: colors.text,
  },
  cue: {
    fontSize: 14,
    color: colors.text,
  },
  note: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  startButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: colors.primaryText,
    fontSize: 17,
    fontWeight: '700',
  },
  });
}
