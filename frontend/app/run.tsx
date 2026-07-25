// Running screen: today's planned run from the backend.
import { useCallback, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { fetchTodayPlan } from '../api';
import { toLocalDateKey } from '../coreProgress';
import { useTheme } from '../ThemeContext';
import type { DayPlan } from '../types';
import { radius, spacing } from '../theme';

export default function RunScreen() {
  const { colors } = useTheme();
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchTodayPlan(toLocalDateKey());
          if (active) setPlan(data.plan);
        } catch (e) {
          if (active) {
            setError(e instanceof Error ? e.message : 'Could not load plan');
          }
        } finally {
          if (active) setLoading(false);
        }
      }
      load();
      return () => {
        active = false;
      };
    }, [])
  );

  const styles = makeStyles(colors);
  const run = plan?.run;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Backend unreachable</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.hint}>Start the API: cd backend && npm run dev</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!run) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.title}>Rest day</Text>
          <Text style={styles.subtitle}>No run scheduled for today.</Text>
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/week')}>
            <Text style={styles.secondaryButtonText}>View week</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.badge}>Today · {plan?.dayName}</Text>
        <Text style={styles.title}>{run.title}</Text>
        <Text style={styles.subtitle}>{run.focus}</Text>
        <Text style={styles.meta}>~{run.estimatedMin} min</Text>
        {plan?.note ? <Text style={styles.note}>{plan.note}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Warm-up</Text>
          <Text style={styles.body}>{run.warmup}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Main</Text>
          <Text style={styles.body}>{run.main}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cool-down</Text>
          <Text style={styles.body}>{run.cooldown}</Text>
        </View>

        {run.exercises.map((exercise) => (
          <View key={exercise.name} style={styles.card}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.body}>{exercise.prescription}</Text>
          </View>
        ))}

        <Pressable
          style={styles.button}
          onPress={() => router.push({ pathname: '/log-run', params: { workoutId: run.id } })}
        >
          <Text style={styles.buttonText}>Log this run</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
    container: { padding: spacing.lg, gap: spacing.md },
    badge: { fontSize: 13, fontWeight: '600', color: colors.accent },
    title: { fontSize: 26, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 15, color: colors.textMuted },
    meta: { fontSize: 14, color: colors.textMuted },
    note: { fontSize: 14, color: colors.accent, fontWeight: '600' },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.xs,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    exerciseName: { fontSize: 16, fontWeight: '600', color: colors.text },
    body: { fontSize: 15, color: colors.text, lineHeight: 22 },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    buttonText: { color: colors.primaryText, fontWeight: '700', fontSize: 16 },
    secondaryButton: {
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    secondaryButtonText: { color: colors.text, fontWeight: '600' },
    errorTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    errorText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
    hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  });
}
