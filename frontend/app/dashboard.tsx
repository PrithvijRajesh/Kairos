// Dashboard: goals, today's run (API) + lift (offline program), training tiles.
import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchTodayPlan } from '../api';
import { toLocalDateKey } from '../coreProgress';
import { ensureLiftProgramStart } from '../gymProgress';
import { getScheduleForDate, type DaySchedule } from '../gymWorkouts';
import { loadGoals, savedGoals } from '../storage';
import { useTheme } from '../ThemeContext';
import type { DayPlan } from '../types';
import { radius, spacing } from '../theme';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const [goals, setGoals] = useState<savedGoals | null>(null);
  const [todayPlan, setTodayPlan] = useState<DayPlan | null>(null);
  const [liftSchedule, setLiftSchedule] = useState<DaySchedule | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const saved = await loadGoals();
        if (active) setGoals(saved);

        const gymState = await ensureLiftProgramStart(false);
        if (active && gymState.programStartDate) {
          setLiftSchedule(getScheduleForDate(new Date(), gymState.programStartDate));
        }

        try {
          const data = await fetchTodayPlan(toLocalDateKey());
          if (active) setTodayPlan(data.plan);
        } catch {
          if (active) setTodayPlan(null);
        }
      }
      load();
      return () => {
        active = false;
      };
    }, [])
  );

  const styles = makeStyles(colors);

  if (!goals) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const liftLine =
    liftSchedule?.kind === 'lift'
      ? `Lift: ${liftSchedule.label}`
      : liftSchedule?.kind === 'rest'
        ? `Lift: ${liftSchedule.label}`
        : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Dashboard</Text>
          <Pressable style={styles.settingsButton} onPress={() => router.push('/settings')}>
            <Text style={styles.settingsButtonText}>Settings</Text>
          </Pressable>
        </View>

        <View style={styles.goalsCard}>
          <Text style={styles.cardTitle}>Your Goals</Text>
          <Text style={styles.goalLine}>Running: {goals.runningGoal}</Text>
          <Text style={styles.goalLine}>Gym: {goals.gymGoal}</Text>
          <Text style={styles.splitLine}>
            Split: {goals.runningImportant}% / {goals.gymImportant}%
          </Text>
          <Pressable style={styles.editButton} onPress={() => router.push('/')}>
            <Text style={styles.editButtonText}>Edit Goals</Text>
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.actionChip} onPress={() => router.push('/check-in')}>
            <Text style={styles.actionChipText}>Check-in</Text>
          </Pressable>
          <Pressable style={styles.actionChip} onPress={() => router.push('/week')}>
            <Text style={styles.actionChipText}>Week plan</Text>
          </Pressable>
        </View>

        {todayPlan || liftLine ? (
          <View style={styles.todayCard}>
            <Text style={styles.cardTitle}>
              Today{todayPlan ? ` (${todayPlan.dayName})` : ''}
            </Text>
            {todayPlan?.run ? (
              <Text style={styles.todayLine}>Run: {todayPlan.run.title}</Text>
            ) : todayPlan?.isRestDay && !todayPlan.run ? (
              <Text style={styles.todayLine}>Run: rest / easy day</Text>
            ) : null}
            {liftLine ? <Text style={styles.todayLine}>{liftLine}</Text> : null}
            {todayPlan?.note ? (
              <Text style={styles.todayNote}>{todayPlan.note}</Text>
            ) : liftSchedule?.kind === 'rest' ? (
              <Text style={styles.todayNote}>{liftSchedule.hint}</Text>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Today's Training</Text>
        <View style={styles.grid}>
          <Pressable style={styles.tile} onPress={() => router.push('/run')}>
            <Text style={styles.tileTitle}>Run</Text>
          </Pressable>
          <Pressable style={styles.tile} onPress={() => router.push('/lift')}>
            <Text style={styles.tileTitle}>Lift</Text>
          </Pressable>
          <Pressable
            style={[styles.tile, styles.tileAccent]}
            onPress={() => router.push('/core')}
          >
            <Text style={[styles.tileTitle, styles.tileTitleAccent]}>Core</Text>
          </Pressable>
          <Pressable style={styles.tile} onPress={() => router.push('/stretch')}>
            <Text style={styles.tileTitle}>Stretch</Text>
          </Pressable>
        </View>
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
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      color: colors.textMuted,
      fontSize: 16,
    },
    container: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    settingsButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    settingsButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    goalsCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    goalLine: {
      fontSize: 15,
      color: colors.text,
    },
    splitLine: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    editButton: {
      marginTop: spacing.sm,
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    editButtonText: {
      color: colors.primaryText,
      fontWeight: '600',
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
    },
    actionChipText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    todayCard: {
      backgroundColor: colors.accentSoft,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: '#bfdbfe',
      padding: spacing.md,
      gap: spacing.xs,
    },
    todayLine: {
      fontSize: 15,
      color: colors.text,
    },
    todayNote: {
      fontSize: 13,
      color: colors.accent,
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.sm,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    tile: {
      width: '48%',
      minHeight: 96,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileAccent: {
      backgroundColor: colors.accentSoft,
      borderColor: '#bfdbfe',
    },
    tileTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    tileTitleAccent: {
      color: colors.accent,
    },
  });
}
