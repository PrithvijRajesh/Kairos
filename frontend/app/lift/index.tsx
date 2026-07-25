// Today's lift from your program — Day 1 = Push. Fully offline.
import { useCallback, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { AlternativeButton } from '../../AlternativeButton';
import {
  formatRepRange,
  formatRest,
  getExerciseWarmupHint,
  getScheduleForDate,
  getWorkoutWarmupPlan,
  type DaySchedule,
  type GymExercise,
} from '../../gymWorkouts';
import {
  ensureLiftProgramStart,
  getSuggestedStartWeight,
  isGymCompletedToday,
  syncUnsyncedSessions,
} from '../../gymProgress';
import {
  applySwapsToWorkout,
  loadTodaysSwaps,
  primaryIdOf,
  setExerciseSwap,
} from '../../gymSwaps';
import { useTheme } from '../../ThemeContext';
import { radius, spacing } from '../../theme';

export default function LiftScreen() {
  const { colors } = useTheme();
  const [schedule, setSchedule] = useState<DaySchedule | null>(null);
  const [completedToday, setCompletedToday] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [startWeights, setStartWeights] = useState<Record<string, number | null>>({});
  const [syncNote, setSyncNote] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const state = await ensureLiftProgramStart(false);
        if (!active || !state.programStartDate) return;

        const todaySchedule = getScheduleForDate(new Date(), state.programStartDate);
        const swaps = await loadTodaysSwaps();

        if (todaySchedule.kind === 'lift') {
          const withSwaps = {
            ...todaySchedule,
            workout: applySwapsToWorkout(todaySchedule.workout, swaps),
          };
          setSchedule(withSwaps);
          const weights: Record<string, number | null> = {};
          for (const ex of withSwaps.workout.exercises) {
            weights[ex.id] = getSuggestedStartWeight(state, ex);
          }
          setStartWeights(weights);
        } else {
          setSchedule(todaySchedule);
        }

        setCompletedToday(isGymCompletedToday(state));
        setCurrentStreak(state.streak.currentStreak);

        const synced = await syncUnsyncedSessions();
        if (active && synced > 0) {
          setSyncNote(`Synced ${synced} session${synced === 1 ? '' : 's'} to your PC.`);
        }
      }
      load();
      return () => {
        active = false;
      };
    }, [])
  );

  async function onSwapExercise(index: number, next: GymExercise) {
    if (!schedule || schedule.kind !== 'lift') return;
    const prev = schedule.workout.exercises[index];
    const primaryId = primaryIdOf(prev);
    await setExerciseSwap(primaryId, next.id);

    const exercises = schedule.workout.exercises.map((ex, i) => (i === index ? next : ex));
    setSchedule({
      ...schedule,
      workout: { ...schedule.workout, exercises },
    });

    const state = await ensureLiftProgramStart(false);
    setStartWeights((prevWeights) => ({
      ...prevWeights,
      [next.id]: getSuggestedStartWeight(state, next),
    }));
  }

  const styles = makeStyles(colors);

  if (!schedule) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <Text style={styles.subtitle}>Loading your program…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (schedule.kind === 'rest') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.eyebrow}>Lift program</Text>
          <Text style={styles.title}>{schedule.label}</Text>
          <Text style={styles.subtitle}>{schedule.hint}</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>7-day rotation from Day 1</Text>
            <Text style={styles.infoLine}>1 Push · 2 Pull · 3 Legs · 4 Rest/Run</Text>
            <Text style={styles.infoLine}>5 Upper · 6 Lower+Core · 7 Rest/Long run</Text>
          </View>

          <Pressable style={styles.secondaryBtn} onPress={() => router.push('/core')}>
            <Text style={styles.secondaryBtnText}>Do Core instead</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const workout = schedule.workout;
  const warmupPlan = getWorkoutWarmupPlan(workout, startWeights);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>{schedule.label}</Text>
        <Text style={styles.title}>{workout.title}</Text>
        <Text style={styles.subtitle}>{workout.focus}</Text>
        <Text style={styles.meta}>
          ~{workout.estimatedMin} min · {workout.exercises.length} exercises
        </Text>

        {syncNote ? <Text style={styles.syncNote}>{syncNote}</Text> : null}

        {completedToday ? (
          <View style={styles.doneCard}>
            <Text style={styles.doneTitle}>Logged for today</Text>
            <Text style={styles.doneBody}>
              Saved on this phone
              {currentStreak > 0 ? ` · ${currentStreak}-day lift streak` : ''}.
            </Text>
            <Pressable style={styles.primaryBtn} onPress={() => router.push('/lift/session')}>
              <Text style={styles.primaryBtnText}>Train again (extra session)</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.warmupCard}>
            <Text style={styles.warmupTitle}>Warm-ups</Text>
            <Text style={styles.warmupIntro}>
              First compound: 2 sets. Other compounds: 1 light set. Skip warm-ups on isolation.
            </Text>
            {warmupPlan.map((item) => (
              <View key={item.exerciseId} style={styles.warmupBlock}>
                <Text style={styles.warmupExName}>
                  {item.kind === 'main' ? 'Main · ' : 'Feeder · '}
                  {item.exerciseName}
                </Text>
                {item.lines.map((line) => (
                  <Text key={line} style={styles.warmupLine}>
                    {line}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {workout.exercises.map((exercise, index) => {
          const remembered = startWeights[exercise.id];
          const warmHint = getExerciseWarmupHint(workout, exercise, remembered ?? null);
          return (
            <View key={exercise.id} style={styles.card}>
              <Text style={styles.exIndex}>{index + 1}</Text>
              <View style={styles.exBody}>
                <Text style={styles.exName}>{exercise.name}</Text>
                <Text style={styles.exMeta}>
                  {formatRepRange(exercise)} · rest {formatRest(exercise)}
                </Text>
                {warmHint ? <Text style={styles.exWarmup}>Warm-up: {warmHint}</Text> : null}
                {remembered != null ? (
                  <Text style={styles.exWeight}>Last / next: {remembered} lb</Text>
                ) : (
                  <Text style={styles.exWeightMuted}>First time — enter weight in-session</Text>
                )}
                {exercise.notes ? <Text style={styles.exNote}>{exercise.notes}</Text> : null}
                <AlternativeButton
                  exercise={exercise}
                  onChange={(next) => onSwapExercise(index, next)}
                />
              </View>
            </View>
          );
        })}

        {!completedToday ? (
          <>
            <Text style={styles.howTo}>
              After each set: log weight, reps, and Easy / Perfect / Hard. Kairos suggests up /
              stay / down and remembers weights for next time.
            </Text>
            <Pressable style={styles.primaryBtn} onPress={() => router.push('/lift/session')}>
              <Text style={styles.primaryBtnText}>Start workout</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => router.push('/lift/worksheet')}>
              <Text style={styles.secondaryBtnText}>Export gym worksheet</Text>
            </Pressable>
            <Text style={styles.sheetHint}>
              Going to the gym without home Wi‑Fi? Export a sheet here, fill it offline, import when
              you get back.
            </Text>
          </>
        ) : (
          <Pressable style={styles.secondaryBtn} onPress={() => router.push('/lift/worksheet')}>
            <Text style={styles.secondaryBtnText}>Import / export worksheet</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    container: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 40 },
    eyebrow: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.accent,
      letterSpacing: 0.3,
    },
    title: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: 2 },
    subtitle: { fontSize: 16, color: colors.textMuted },
    meta: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm },
    syncNote: { fontSize: 13, color: colors.accent, fontWeight: '600' },
    warmupCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: 4,
      marginBottom: spacing.xs,
    },
    warmupTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
    warmupIntro: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm, lineHeight: 18 },
    warmupBlock: { gap: 2, marginBottom: spacing.sm },
    warmupExName: { fontSize: 14, fontWeight: '700', color: colors.text },
    warmupLine: { fontSize: 14, color: colors.textMuted },
    exWarmup: { fontSize: 13, color: colors.accent, fontWeight: '600' },
    doneCard: {
      backgroundColor: colors.accentSoft,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.accent,
      padding: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    doneTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    doneBody: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    card: {
      flexDirection: 'row',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    exIndex: {
      width: 24,
      fontSize: 15,
      fontWeight: '700',
      color: colors.accent,
      marginTop: 2,
    },
    exBody: { flex: 1, gap: 3 },
    exName: { fontSize: 16, fontWeight: '700', color: colors.text },
    exMeta: { fontSize: 14, color: colors.text },
    exWeight: { fontSize: 13, fontWeight: '600', color: colors.accent },
    exWeightMuted: { fontSize: 13, color: colors.textMuted },
    exNote: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    howTo: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
      marginTop: spacing.sm,
    },
    sheetHint: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 18,
    },
    primaryBtn: {
      marginTop: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 16,
      alignItems: 'center',
    },
    primaryBtnText: { color: colors.primaryText, fontSize: 17, fontWeight: '700' },
    secondaryBtn: {
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    secondaryBtnText: { color: colors.text, fontSize: 16, fontWeight: '700' },
    ghostBtn: { paddingVertical: 14, alignItems: 'center' },
    ghostBtnText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
    infoCard: {
      marginTop: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: 6,
    },
    infoTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
    infoLine: { fontSize: 14, color: colors.textMuted },
  });
}
