// Core list: today's workout preview and Start workout button.
import { ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  getTodayWorkout,
  getExercisesForWorkout,
  formatPrescription,
  getProgramStatusLabel,
} from '../../coreWorkouts';
import { colors, radius, spacing } from '../../theme';

export default function CoreScreen() {
  const workout = getTodayWorkout();
  const exercises = getExercisesForWorkout(workout);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.badge}>Workout {workout.id}</Text>
        <Text style={styles.title}>{workout.title}</Text>
        <Text style={styles.subtitle}>{workout.focus}</Text>
        <Text style={styles.meta}>{getProgramStatusLabel()}</Text>
        <Text style={styles.meta}>~{workout.estimatedMin} min</Text>

        {exercises.map((exercise) => (
          <View key={exercise.id} style={styles.card}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.exercisePrescription}>
              {formatPrescription(exercise, 1)}
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

const styles = StyleSheet.create({
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
