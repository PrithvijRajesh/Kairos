// Post-workout review: Easy / Perfect / Hard per exercise.
import { Text, View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useState } from 'react';
import { getTodayWorkout, getExercisesForWorkout } from '../../coreWorkouts';
import { colors, radius, spacing } from '../../theme';
import { router } from 'expo-router';
import {
  applySessionFeels,
  loadCoreProgress,
  saveCoreProgress,
} from '../../coreProgress';

export type ExerciseFeel = 'easy' | 'perfect' | 'hard';

export type SessionReview = {
  workoutId: 'A' | 'B' | 'C' | 'D';
  date: string;
  feels: Record<string, ExerciseFeel>;
};

export default function CoreReviewScreen() {
  const workout = getTodayWorkout();
  const exercises = getExercisesForWorkout(workout);
  const [feels, setFeels] = useState<Record<string, ExerciseFeel>>({});
  const [isSaving, setIsSaving] = useState(false);

  function setFeel(exerciseId: string, feel: ExerciseFeel) {
    setFeels((prev) => ({ ...prev, [exerciseId]: feel }));
  }

  const allRated = exercises.every((ex) => feels[ex.id] != null);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>How did it feel?</Text>
      <Text style={styles.subtitle}>Rate each exercise once.</Text>

      {exercises.map((ex) => (
        <View key={ex.id} style={styles.card}>
          <Text style={styles.exerciseName}>{ex.name}</Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.feelButton, feels[ex.id] === 'easy' && styles.feelSelected]}
              onPress={() => setFeel(ex.id, 'easy')}
            >
              <Text style={styles.feelText}>Easy</Text>
            </Pressable>
            <Pressable
              style={[styles.feelButton, feels[ex.id] === 'perfect' && styles.feelSelected]}
              onPress={() => setFeel(ex.id, 'perfect')}
            >
              <Text style={styles.feelText}>Perfect</Text>
            </Pressable>
            <Pressable
              style={[styles.feelButton, feels[ex.id] === 'hard' && styles.feelSelected]}
              onPress={() => setFeel(ex.id, 'hard')}
            >
              <Text style={styles.feelText}>Hard</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Pressable
        style={[styles.doneButton, !allRated && styles.doneDisabled]}
        disabled={!allRated || isSaving}
        onPress={async () => {
          setIsSaving(true);
          const currentState = await loadCoreProgress();
          const nextState = applySessionFeels(currentState, exercises, feels);
          await saveCoreProgress(nextState);
          router.replace('/core');
          setIsSaving(false);
        }}
      >
        <Text style={styles.doneText}>{isSaving ? 'Saving...' : 'Save & finish'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.lg * 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  feelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  feelSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  feelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneDisabled: {
    opacity: 0.4,
  },
  doneText: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 16,
  },
});
