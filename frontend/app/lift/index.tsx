// Today's lift from your program — Day 1 = Push. Fully offline.
import { useCallback, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable, Alert } from 'react-native';
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
  getRecoveryInsights,
  getSuggestedStartWeight,
  isForcedRestToday,
  isGymCompletedToday,
  recordForcedRestDay,
  softResetLiftProgram,
  syncUnsyncedSessions,
  undoForcedRestDay,
  type GymProgressState,
  type RecoveryInsights,
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
  const [recovery, setRecovery] = useState<RecoveryInsights | null>(null);
  const [isRestDayForced, setIsRestDayForced] = useState(false);

  const loadData = useCallback(async () => {
    const state = await ensureLiftProgramStart(false);
    if (!state.programStartDate) return;

    const todaySchedule = getScheduleForDate(new Date(), state.programStartDate);
    const swaps = await loadTodaysSwaps();
    const insights = getRecoveryInsights(state);
    setRecovery(insights);
    setIsRestDayForced(isForcedRestToday(state));

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
    if (synced > 0) {
      setSyncNote(`Synced ${synced} session${synced === 1 ? '' : 's'} to your PC.`);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadData().then(() => {
        if (!active) return;
      });
      return () => {
        active = false;
      };
    }, [loadData])
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

  function handleTakeRestDay() {
    Alert.alert(
      'Take a Recovery Day?',
      'Feeling sore? Logging a rest day shifts your workout rotation forward by 1 day so no workouts are skipped.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Rest Day',
          onPress: async () => {
            await recordForcedRestDay();
            await loadData();
          },
        },
      ]
    );
  }

  function handleSoftReset() {
    Alert.alert(
      'Soft Reset to Day 1 (Push)?',
      'Start fresh with Day 1 (Push) today. All your saved weights and workout history are safely kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Day 1',
          onPress: async () => {
            await softResetLiftProgram();
            await loadData();
          },
        },
      ]
    );
  }

  async function handleUndoRestDay() {
    await undoForcedRestDay();
    await loadData();
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
          <Text style={styles.subtitle}>
            {isRestDayForced
              ? 'Recovery Day Active · Your rotation shifted +1 day so no workouts are skipped.'
              : schedule.hint}
          </Text>

          {/* Recovery info banner */}
          <View style={styles.recoveryCard}>
            <Text style={styles.recoveryTitle}>Recovery & Readiness</Text>
            <Text style={styles.recoveryBody}>
              {recovery?.daysSinceLastSession
                ? `${recovery.daysSinceLastSession} days since last session. Muscle repair and glycogen replenishment happen during rest.`
                : 'Muscles grow when resting. Sleep, hydration, and protein are your top priorities.'}
            </Text>
            <View style={styles.recoveryActions}>
              <Pressable style={styles.softResetBtn} onPress={handleSoftReset}>
                <Text style={styles.softResetBtnText}>Soft Reset to Day 1 (Push) today</Text>
              </Pressable>
              {isRestDayForced ? (
                <Pressable style={styles.undoBtn} onPress={handleUndoRestDay}>
                  <Text style={styles.undoBtnText}>Undo Rest Day (Resume Lift)</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>7-day purposeful rotation</Text>
            <Text style={styles.infoLine}>1 Push (Chest/Delts/Triceps) · 2 Pull (Lats/Rows/Arms)</Text>
            <Text style={styles.infoLine}>3 Legs (Squat/Press/Curts/Calves) · 4 Rest</Text>
            <Text style={styles.infoLine}>5 Upper (Press/Pull Volume) · 6 Lower · 7 Rest</Text>
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
          ~{workout.estimatedMin} min · {workout.exercises.length} purposeful exercises
        </Text>

        {/* Multi-day rest detection & soft reset prompt */}
        {recovery?.recommendSoftReset ? (
          <View style={styles.recoveryAlertCard}>
            <View style={styles.recoveryAlertHeader}>
              <Text style={styles.recoveryAlertTitle}>Smart Recovery Advice</Text>
            </View>
            <Text style={styles.recoveryAlertBody}>
              {recovery.message} Starting fresh ensures your training load matches your recovery.
            </Text>
            <Pressable style={styles.softResetBannerBtn} onPress={handleSoftReset}>
              <Text style={styles.softResetBannerBtnText}>Soft Reset to Day 1 (Push) Today</Text>
            </Pressable>
          </View>
        ) : null}

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
              First compound: 2 ramp sets. Other compounds: 1 light set. Isolations: start directly.
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
            <View key={`${primaryIdOf(exercise)}-${exercise.id}`} style={styles.card}>
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
              Keep 1–2 reps in reserve on heavy sets. If sore, take a forced rest day or soft reset anytime.
            </Text>
            <Pressable style={styles.primaryBtn} onPress={() => router.push('/lift/session')}>
              <Text style={styles.primaryBtnText}>Start workout in app</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => router.push('/lift/worksheet')}>
              <Text style={styles.secondaryBtnText}>Google Sheets sync</Text>
            </Pressable>

            {/* Recovery & Schedule Options */}
            <View style={styles.actionsBox}>
              <Text style={styles.actionsBoxTitle}>Need to adjust your body’s pace?</Text>
              <View style={styles.actionsBoxRow}>
                <Pressable style={styles.restDayBtn} onPress={handleTakeRestDay}>
                  <Text style={styles.restDayBtnText}>Sore today · Shift +1 day</Text>
                </Pressable>
                <Pressable style={styles.resetBtn} onPress={handleSoftReset}>
                  <Text style={styles.resetBtnText}>Soft Reset to Day 1</Text>
                </Pressable>
              </View>
            </View>
          </>
        ) : (
          <Pressable style={styles.secondaryBtn} onPress={() => router.push('/lift/worksheet')}>
            <Text style={styles.secondaryBtnText}>Google Sheets sync</Text>
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
    recoveryAlertCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.accent,
      padding: spacing.md,
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    recoveryAlertHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    recoveryAlertTitle: { fontSize: 15, fontWeight: '700', color: colors.accent },
    recoveryAlertBody: { fontSize: 13, color: colors.text, lineHeight: 18 },
    softResetBannerBtn: {
      marginTop: spacing.xs,
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingVertical: 10,
      alignItems: 'center',
    },
    softResetBannerBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
    recoveryCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.xs,
      marginVertical: spacing.xs,
    },
    recoveryTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    recoveryBody: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    recoveryActions: { marginTop: spacing.sm, gap: spacing.xs },
    softResetBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 12,
      alignItems: 'center',
    },
    softResetBtnText: { color: colors.primaryText, fontWeight: '700', fontSize: 14 },
    undoBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: 10,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    undoBtnText: { color: colors.text, fontWeight: '600', fontSize: 13 },
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
    actionsBox: {
      marginTop: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    actionsBoxTitle: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
    actionsBoxRow: { flexDirection: 'row', gap: spacing.sm },
    restDayBtn: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      alignItems: 'center',
    },
    restDayBtnText: { fontSize: 12, fontWeight: '600', color: colors.text },
    resetBtn: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      alignItems: 'center',
    },
    resetBtnText: { fontSize: 12, fontWeight: '600', color: colors.accent },
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
