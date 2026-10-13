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
  buildLiftAttendanceCalendar,
  catchUpMissedLiftDay,
  ensureLiftProgramStart,
  getMissedLiftDays,
  getRecoveryInsights,
  getSuggestedStartWeight,
  isForcedRestToday,
  isGymCompletedToday,
  isReturnDeloadActive,
  recordForcedRestDay,
  returnDeloadPercent,
  softResetLiftProgram,
  syncUnsyncedSessions,
  undoForcedRestDay,
  type LiftDayLogStatus,
  type RecoveryInsights,
} from '../../gymProgress';
import { yesterdayDateKey } from '../../coreProgress';
import { syncSessionFromGoogleSheet } from '../../googleSheetsLog';
import { loadAppSettings } from '../../settingsStorage';
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
  const [attendance, setAttendance] = useState<LiftDayLogStatus[]>([]);
  const [missedDays, setMissedDays] = useState<LiftDayLogStatus[]>([]);
  const [busyMissed, setBusyMissed] = useState(false);
  const [returnDeloadNote, setReturnDeloadNote] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const state = await ensureLiftProgramStart(false);
    if (!state.programStartDate) return;

    setAttendance(buildLiftAttendanceCalendar(state, state.programStartDate, 21));
    setMissedDays(getMissedLiftDays(state, state.programStartDate, 21));

    const todaySchedule = getScheduleForDate(new Date(), state.programStartDate);
    const swaps = await loadTodaysSwaps();
    const insights = getRecoveryInsights(state);
    setRecovery(insights);
    setIsRestDayForced(isForcedRestToday(state));

    if (isReturnDeloadActive(state)) {
      const pct = returnDeloadPercent(state);
      setReturnDeloadNote(
        pct != null
          ? `Return day · start weights −${pct}% (history kept; next session uses what you lift)`
          : null
      );
    } else {
      setReturnDeloadNote(null);
    }

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
      'Start fresh with Day 1 (Push) today. History is kept. Use return deload if you’re coming back from being sick.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset only',
          onPress: async () => {
            await softResetLiftProgram();
            await loadData();
          },
        },
        {
          text: 'Reset + −25% weights',
          onPress: async () => {
            await softResetLiftProgram(undefined, { returnDeloadFactor: 0.75 });
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

  function handleMissedYesterday() {
    const y = yesterdayDateKey();
    Alert.alert(
      'Missed yesterday’s lift?',
      'Rain or couldn’t get to the gym? This shifts your rotation so today shows yesterday’s planned workout — nothing skipped.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use yesterday’s workout today',
          onPress: async () => {
            await catchUpMissedLiftDay(y);
            await loadData();
          },
        },
      ]
    );
  }

  function workoutHintFromLabel(label: string): string | undefined {
    const short = label.replace(/^Day \d+ · /, '');
    const match = short.match(/^(Push|Pull|Legs|Upper|Lower)/i);
    return match ? match[1] : undefined;
  }

  async function tryLogMissedFromSheets(row: LiftDayLogStatus): Promise<'ok' | 'empty' | 'error'> {
    const settings = await loadAppSettings();
    if (!settings.sheetsWebhookUrl.trim()) return 'error';
    const result = await syncSessionFromGoogleSheet(row.dateKey, workoutHintFromLabel(row.label));
    if (result.ok === false) {
      const msg = result.error.toLowerCase();
      if (msg.includes('no filled') || msg.includes('not found') || msg.includes('0 filled')) {
        return 'empty';
      }
      return 'error';
    }
    return 'ok';
  }

  function onMissedDayPress(row: LiftDayLogStatus) {
    Alert.alert(
      `Missed ${row.dateKey}`,
      `${row.label.replace(/^Day \d+ · /, '')}\n\nDid you actually lift that day?`,
      [
        {
          text: 'Log from Google Sheets',
          onPress: async () => {
            setBusyMissed(true);
            try {
              const settings = await loadAppSettings();
              if (!settings.sheetsWebhookUrl.trim()) {
                Alert.alert('Sheets not set up', 'Add your Sheets webhook URL in Settings first.');
                return;
              }
              const status = await tryLogMissedFromSheets(row);
              if (status === 'ok') {
                await loadData();
                Alert.alert('Logged', `Imported ${row.dateKey} from Sheets.`);
              } else if (status === 'empty') {
                Alert.alert(
                  'Nothing in Sheets',
                  `No filled sets found for ${row.dateKey}. Fill Weight + Reps in Sheets, or mark as weather rest if you skipped.`
                );
              } else {
                Alert.alert('Could not sync', 'Check your Sheets URL / Apps Script deployment.');
              }
            } finally {
              setBusyMissed(false);
            }
          },
        },
        {
          text: 'Mark as weather rest',
          onPress: async () => {
            await recordForcedRestDay(row.dateKey);
            await loadData();
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  function handleFindMissedDays() {
    if (missedDays.length === 0) {
      Alert.alert('All clear', 'No unlogged lift days in the last 3 weeks.');
      return;
    }

    const list = missedDays
      .map((d) => `• ${d.dateKey} — ${d.label.replace(/^Day \d+ · /, '')}`)
      .join('\n');

    Alert.alert(
      `${missedDays.length} missed lift day${missedDays.length === 1 ? '' : 's'}`,
      `${list}\n\nTry Google Sheets for all of them, or tap a day in the log below.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync all from Sheets',
          onPress: () => void syncAllMissedFromSheets(),
        },
      ]
    );
  }

  async function syncAllMissedFromSheets() {
    const settings = await loadAppSettings();
    if (!settings.sheetsWebhookUrl.trim()) {
      Alert.alert('Sheets not set up', 'Add your Sheets webhook URL in Settings first.');
      return;
    }

    setBusyMissed(true);
    let imported = 0;
    let empty = 0;
    let failed = 0;
    try {
      for (const row of missedDays) {
        const status = await tryLogMissedFromSheets(row);
        if (status === 'ok') imported += 1;
        else if (status === 'empty') empty += 1;
        else failed += 1;
      }
      await loadData();
      Alert.alert(
        'Missed-day scan done',
        `Imported ${imported} from Sheets.\n` +
          (empty ? `${empty} had no filled rows.\n` : '') +
          (failed ? `${failed} failed to sync.\n` : '') +
          (empty || failed
            ? '\nFor leftover dates: tap them in the log → Log from Sheets or Mark as weather rest.'
            : '')
      );
    } finally {
      setBusyMissed(false);
    }
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
              ? 'Recovery day · rotation shifted so nothing is skipped.'
              : schedule.hint}
          </Text>
          {returnDeloadNote ? <Text style={styles.syncNote}>{returnDeloadNote}</Text> : null}

          <View style={styles.recoveryCard}>
            <Text style={styles.recoveryTitle}>Rest day</Text>
            <Text style={styles.recoveryBody}>
              {recovery?.daysSinceLastSession
                ? `${recovery.daysSinceLastSession} days since last session.`
                : 'Train hard. Recover harder.'}
            </Text>
            <View style={styles.recoveryActions}>
              <Pressable style={styles.softResetBtn} onPress={handleSoftReset}>
                <Text style={styles.softResetBtnText}>Reset to Day 1 (Push)</Text>
              </Pressable>
              {isRestDayForced ? (
                <Pressable style={styles.undoBtn} onPress={handleUndoRestDay}>
                  <Text style={styles.undoBtnText}>Undo rest · resume lift</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Weekly rotation</Text>
            <Text style={styles.infoLine}>1 Push · 2 Pull · 3 Legs · 4 Rest</Text>
            <Text style={styles.infoLine}>5 Upper · 6 Lower · 7 Rest</Text>
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
        {returnDeloadNote ? <Text style={styles.syncNote}>{returnDeloadNote}</Text> : null}

        {/* Multi-day rest detection & soft reset prompt */}
        {recovery?.recommendSoftReset ? (
          <View style={styles.recoveryAlertCard}>
            <View style={styles.recoveryAlertHeader}>
              <Text style={styles.recoveryAlertTitle}>Recovery</Text>
            </View>
            <Text style={styles.recoveryAlertBody}>{recovery.message}</Text>
            <Pressable style={styles.softResetBannerBtn} onPress={handleSoftReset}>
              <Text style={styles.softResetBannerBtnText}>Reset to Day 1 (Push)</Text>
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
              <Text style={styles.actionsBoxTitle}>Adjust</Text>
              <View style={styles.actionsBoxRow}>
                <Pressable style={styles.restDayBtn} onPress={handleTakeRestDay}>
                  <Text style={styles.restDayBtnText}>Sore · shift +1</Text>
                </Pressable>
                <Pressable style={styles.resetBtn} onPress={handleSoftReset}>
                  <Text style={styles.resetBtnText}>Reset to Day 1</Text>
                </Pressable>
              </View>
              <Pressable style={styles.missedBtn} onPress={handleMissedYesterday}>
                <Text style={styles.missedBtnText}>Missed yesterday · use that workout today</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Pressable style={styles.secondaryBtn} onPress={() => router.push('/lift/worksheet')}>
            <Text style={styles.secondaryBtnText}>Google Sheets sync</Text>
          </Pressable>
        )}

        <View style={styles.attendanceCard}>
          <Text style={styles.attendanceTitle}>Log · last 3 weeks</Text>
          <Text style={styles.attendanceHint}>
            ✓ logged · weather = forced rest · tap open days to fix
          </Text>
          {missedDays.length > 0 ? (
            <Pressable
              style={[styles.findMissedBtn, busyMissed && styles.disabled]}
              onPress={handleFindMissedDays}
              disabled={busyMissed}
            >
              <Text style={styles.findMissedBtnText}>
                {busyMissed
                  ? 'Checking Sheets…'
                  : `Find & log missed days (${missedDays.length})`}
              </Text>
            </Pressable>
          ) : null}
          {attendance.map((row) => {
            const isMiss = row.kind === 'lift' && !row.logged;
            const Row = isMiss ? Pressable : View;
            return (
              <Row
                key={row.dateKey}
                style={styles.attendanceRow}
                {...(isMiss ? { onPress: () => onMissedDayPress(row) } : {})}
              >
                <Text style={styles.attendanceDate}>{row.dateKey.slice(5)}</Text>
                <Text style={styles.attendanceLabel} numberOfLines={1}>
                  {row.kind === 'weather'
                    ? 'Weather / forced rest'
                    : row.kind === 'rest'
                      ? 'Rest'
                      : row.label.replace(/^Day \d+ · /, '')}
                </Text>
                <Text
                  style={[
                    styles.attendanceStatus,
                    row.logged
                      ? styles.attendanceLogged
                      : row.kind === 'weather'
                        ? styles.attendanceWeather
                        : row.kind === 'lift'
                          ? styles.attendanceMiss
                          : styles.attendanceRest,
                  ]}
                >
                  {row.logged
                    ? '✓ logged'
                    : row.kind === 'weather'
                      ? 'weather'
                      : row.kind === 'rest'
                        ? 'rest'
                        : 'tap —'}
                </Text>
              </Row>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  const panel = {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
  } as const;

  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    container: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 48 },
    eyebrow: { fontSize: 13, fontWeight: '500', color: colors.accent },
    title: {
      fontSize: 28,
      fontWeight: '600',
      letterSpacing: -0.6,
      color: colors.text,
      marginTop: 2,
    },
    subtitle: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
    meta: { fontSize: 13, color: colors.textSoft, marginBottom: spacing.sm },
    syncNote: { fontSize: 12, fontWeight: '600', color: colors.accent },
    recoveryAlertCard: { ...panel, backgroundColor: colors.accentSoft, gap: spacing.xs },
    recoveryAlertHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    recoveryAlertTitle: { fontSize: 13, fontWeight: '600', color: colors.accent },
    recoveryAlertBody: { fontSize: 14, color: colors.text, lineHeight: 20 },
    softResetBannerBtn: {
      marginTop: spacing.xs,
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: 12,
      alignItems: 'center',
    },
    softResetBannerBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    recoveryCard: { ...panel, gap: spacing.xs, marginVertical: spacing.xs },
    recoveryTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
    recoveryBody: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    recoveryActions: { marginTop: spacing.sm, gap: spacing.xs },
    softResetBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    softResetBtnText: { color: colors.primaryText, fontWeight: '600', fontSize: 14 },
    undoBtn: {
      borderRadius: radius.md,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: colors.backgroundAlt,
    },
    undoBtnText: { color: colors.text, fontWeight: '600', fontSize: 13 },
    warmupCard: { ...panel, gap: 4, marginBottom: spacing.xs },
    warmupTitle: { fontSize: 13, fontWeight: '500', color: colors.textSoft, marginBottom: 4 },
    warmupIntro: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm, lineHeight: 18 },
    warmupBlock: { gap: 2, marginBottom: spacing.sm },
    warmupExName: { fontSize: 14, fontWeight: '600', color: colors.text },
    warmupLine: { fontSize: 13, color: colors.textMuted },
    exWarmup: { fontSize: 12, color: colors.accent, fontWeight: '600' },
    doneCard: {
      backgroundColor: colors.accentSoft,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    doneTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
    doneBody: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    card: { flexDirection: 'row', gap: spacing.sm, ...panel },
    exIndex: {
      width: 24,
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSoft,
      marginTop: 4,
    },
    exBody: { flex: 1, gap: 3 },
    exName: { fontSize: 16, fontWeight: '600', color: colors.text },
    exMeta: { fontSize: 14, color: colors.textMuted },
    exWeight: { fontSize: 13, fontWeight: '600', color: colors.accent },
    exWeightMuted: { fontSize: 13, color: colors.textSoft },
    exNote: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    howTo: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 20,
      marginTop: spacing.sm,
    },
    primaryBtn: {
      marginTop: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 15,
      alignItems: 'center',
    },
    primaryBtnText: { color: colors.primaryText, fontSize: 15, fontWeight: '600' },
    secondaryBtn: {
      marginTop: spacing.sm,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: colors.backgroundAlt,
    },
    secondaryBtnText: { color: colors.text, fontSize: 15, fontWeight: '600' },
    actionsBox: { ...panel, marginTop: spacing.md, gap: spacing.sm },
    actionsBoxTitle: { fontSize: 13, fontWeight: '500', color: colors.textSoft },
    actionsBoxRow: { flexDirection: 'row', gap: spacing.sm },
    restDayBtn: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.backgroundAlt,
      alignItems: 'center',
    },
    restDayBtnText: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },
    resetBtn: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.backgroundAlt,
      alignItems: 'center',
    },
    resetBtnText: { fontSize: 12, fontWeight: '600', color: colors.accent, textAlign: 'center' },
    missedBtn: {
      paddingVertical: 12,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
    },
    missedBtnText: { fontSize: 12, fontWeight: '600', color: colors.accent, textAlign: 'center' },
    attendanceCard: { ...panel, marginTop: spacing.md, gap: 4 },
    attendanceTitle: { fontSize: 13, fontWeight: '500', color: colors.textSoft },
    attendanceHint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.xs },
    attendanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    attendanceDate: { width: 44, fontSize: 12, color: colors.textMuted, fontWeight: '600' },
    attendanceLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: colors.text },
    attendanceStatus: { fontSize: 11, fontWeight: '600' },
    attendanceLogged: { color: colors.success },
    attendanceMiss: { color: colors.warning },
    attendanceRest: { color: colors.textMuted },
    attendanceWeather: { color: colors.accent },
    findMissedBtn: {
      marginVertical: spacing.xs,
      paddingVertical: 12,
      borderRadius: radius.md,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
    },
    findMissedBtnText: { fontSize: 13, fontWeight: '600', color: colors.accent },
    disabled: { opacity: 0.6 },
    infoCard: { ...panel, marginTop: spacing.md, gap: 6 },
    infoTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 },
    infoLine: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  });
}
