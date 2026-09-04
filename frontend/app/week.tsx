// Week view: 7-day run + lift plan from the backend.
import { useCallback, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { fetchWeekPlan } from '../api';
import { toLocalDateKey } from '../coreProgress';
import { useTheme } from '../ThemeContext';
import type { WeekPlan } from '../types';
import { radius, spacing } from '../theme';

export default function WeekScreen() {
  const { colors } = useTheme();
  const [week, setWeek] = useState<WeekPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const today = toLocalDateKey();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchWeekPlan(today);
          if (active) setWeek(data.week);
        } catch (e) {
          if (active) {
            setError(e instanceof Error ? e.message : 'Could not load week');
          }
        } finally {
          if (active) setLoading(false);
        }
      }
      load();
      return () => {
        active = false;
      };
    }, [today])
  );

  const styles = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !week) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Could not load week</Text>
          <Text style={styles.errorText}>{error ?? 'Unknown error'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>This week</Text>
        <Text style={styles.subtitle}>
          {week.startDate} → {week.endDate}
        </Text>

        {week.days.map((day) => {
          const isToday = day.date === today;
          return (
            <View key={day.date} style={[styles.card, isToday && styles.cardToday]}>
              <View style={styles.cardHeader}>
                <Text style={styles.dayName}>{day.dayName}</Text>
                <Text style={styles.date}>{day.date}</Text>
              </View>
              {day.isRestDay ? (
                <Text style={styles.rest}>Rest / mobility</Text>
              ) : (
                <>
                  {day.run ? <Text style={styles.line}>Cardio: {day.run.title}</Text> : null}
                  {day.gym ? <Text style={styles.line}>Lift: {day.gym.title}</Text> : null}
                </>
              )}
              {day.note ? <Text style={styles.note}>{day.note}</Text> : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
    container: { padding: spacing.lg, gap: spacing.md },
    title: { fontSize: 26, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.xs,
    },
    cardToday: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dayName: { fontSize: 16, fontWeight: '700', color: colors.text },
    date: { fontSize: 13, color: colors.textMuted },
    line: { fontSize: 15, color: colors.text },
    rest: { fontSize: 15, color: colors.textMuted, fontStyle: 'italic' },
    note: { fontSize: 13, color: colors.accent, marginTop: spacing.xs },
    errorTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    errorText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  });
}
