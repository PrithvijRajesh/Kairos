// Stretch list: today's mobility routine and start button.
import { useCallback, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import {
  formatStretchPrescription,
  getExercisesForRoutine,
  getTodayStretchRoutine,
} from '../../stretchRoutines';
import { isStretchCompletedToday, loadStretchProgress } from '../../stretchProgress';
import { useTheme } from '../../ThemeContext';
import { radius, spacing } from '../../theme';

export default function StretchScreen() {
  const { colors } = useTheme();
  const routine = getTodayStretchRoutine();
  const exercises = getExercisesForRoutine(routine);
  const [completedToday, setCompletedToday] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const state = await loadStretchProgress();
        if (!active) return;
        setCompletedToday(isStretchCompletedToday(state));
        setCurrentStreak(state.streak.currentStreak);
        setLongestStreak(state.streak.longestStreak);
      }
      load();
      return () => {
        active = false;
      };
    }, [])
  );

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.badge}>Routine {routine.id}</Text>
        <Text style={styles.title}>{routine.title}</Text>
        <Text style={styles.subtitle}>{routine.focus}</Text>
        <Text style={styles.meta}>~{routine.estimatedMin} min · {exercises.length} stretches</Text>

        {completedToday ? (
          <View style={styles.completedCard}>
            <Text style={styles.completedTitle}>Stretch completed for today</Text>
            <Text style={styles.completedSubtitle}>
              Your mobility is done — nice work staying consistent.
            </Text>
            <View style={styles.streakRow}>
              <View style={styles.streakStat}>
                <Text style={styles.streakValue}>{currentStreak}</Text>
                <Text style={styles.streakLabel}>day streak</Text>
              </View>
              <View style={styles.streakStat}>
                <Text style={styles.streakValue}>{longestStreak}</Text>
                <Text style={styles.streakLabel}>longest</Text>
              </View>
            </View>
          </View>
        ) : null}

        {!completedToday
          ? exercises.map((exercise) => (
              <View key={exercise.id} style={styles.card}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.prescription}>{formatStretchPrescription(exercise)}</Text>
                {exercise.cues.map((cue) => (
                  <Text key={cue} style={styles.cue}>
                    • {cue}
                  </Text>
                ))}
              </View>
            ))
          : null}

        {completedToday ? (
          <Pressable style={styles.dashboardButton} onPress={() => router.replace('/dashboard')}>
            <Text style={styles.dashboardButtonText}>Back to Dashboard</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.startButton} onPress={() => router.push('/stretch/session')}>
            <Text style={styles.startButtonText}>Start stretching</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.lg * 2 },
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
    title: { fontSize: 28, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 15, color: colors.textMuted },
    meta: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm },
    completedCard: {
      backgroundColor: colors.accentSoft,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.accent,
      padding: spacing.lg,
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    completedTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    completedSubtitle: { fontSize: 15, color: colors.textMuted },
    streakRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
    streakStat: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
      gap: spacing.xs,
    },
    streakValue: { fontSize: 28, fontWeight: '700', color: colors.accent },
    streakLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.xs,
    },
    exerciseName: { fontSize: 17, fontWeight: '700', color: colors.text },
    prescription: { fontSize: 15, color: colors.text },
    cue: { fontSize: 14, color: colors.textMuted },
    startButton: {
      marginTop: spacing.md,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 16,
      alignItems: 'center',
    },
    startButtonText: { color: colors.primaryText, fontSize: 17, fontWeight: '700' },
    dashboardButton: {
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    dashboardButtonText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  });
}
