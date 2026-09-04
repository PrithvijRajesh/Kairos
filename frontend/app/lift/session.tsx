// Guided lift: log weight + reps + feel → next-set advice. Saves on phone.
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';

import { AlternativeButton } from '../../AlternativeButton';
import { toLocalDateKey } from '../../coreProgress';
import {
  ensureLiftProgramStart,
  getSuggestedStartWeight,
  loadGymProgress,
  nextSessionWeightForExercise,
  recommendNextWeight,
  recordGymSessionCompletion,
  saveGymProgress,
  trySyncSession,
  type ExerciseSessionLog,
  type LoggedSet,
  type SetFeel,
  type WeightRecommendation,
} from '../../gymProgress';
import {
  formatRepRange,
  formatRest,
  getExerciseWarmupHint,
  getTodayGymWorkout,
  type GymExercise,
  type GymWorkout,
} from '../../gymWorkouts';
import {
  applySwapsToWorkout,
  loadTodaysSwaps,
  primaryIdOf,
  setExerciseSwap,
} from '../../gymSwaps';
import { useTheme } from '../../ThemeContext';
import { radius, spacing } from '../../theme';

export default function LiftSessionScreen() {
  const { colors } = useTheme();
  const [workout, setWorkout] = useState<GymWorkout | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  const [weightInput, setWeightInput] = useState('');
  const [repsInput, setRepsInput] = useState('');
  const [feel, setFeel] = useState<SetFeel | null>(null);
  const [lastRec, setLastRec] = useState<WeightRecommendation | null>(null);
  const [sessionLogs, setSessionLogs] = useState<ExerciseSessionLog[]>([]);
  const [currentSets, setCurrentSets] = useState<LoggedSet[]>([]);
  const [phase, setPhase] = useState<'do_set' | 'rest'>('do_set');
  const [restSeconds, setRestSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  const exercises = workout?.exercises ?? [];
  const current = exercises[exerciseIndex];

  useEffect(() => {
    let active = true;
    async function init() {
      const state = await ensureLiftProgramStart(false);
      if (!active || !state.programStartDate) return;
      const todayWorkout = getTodayGymWorkout(new Date(), state.programStartDate);
      if (!todayWorkout) {
        setWorkout(null);
        setReady(true);
        return;
      }
      const swaps = await loadTodaysSwaps();
      const resolved = applySwapsToWorkout(todayWorkout, swaps);
      setWorkout(resolved);
      const first = resolved.exercises[0];
      if (!first) {
        setReady(true);
        return;
      }
      const start = getSuggestedStartWeight(state, first);
      setWeightInput(start != null ? String(start) : '');
      setReady(true);
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  async function onSwapCurrent(next: GymExercise) {
    if (!workout || !current) return;
    if (currentSets.length > 0) {
      Alert.alert('Finish this exercise', 'Log remaining sets first, or go back and restart.');
      return;
    }
    await setExerciseSwap(primaryIdOf(current), next.id);
    const exercisesNext = workout.exercises.map((ex, i) =>
      i === exerciseIndex ? next : ex
    );
    setWorkout({ ...workout, exercises: exercisesNext });
    const state = await loadGymProgress();
    const start = getSuggestedStartWeight(state, next);
    setWeightInput(start != null ? String(start) : '');
    setLastRec(null);
    setFeel(null);
    setRepsInput('');
  }

  useEffect(() => {
    if (phase !== 'rest' || restSeconds <= 0) return;
    const id = setInterval(() => setRestSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [phase, restSeconds]);

  useEffect(() => {
    if (phase === 'rest' && restSeconds === 0) {
      setPhase('do_set');
    }
  }, [phase, restSeconds]);

  const styles = makeStyles(colors);

  async function finishWorkout(finalLogs: ExerciseSessionLog[]) {
    if (finalLogs.length === 0) {
      Alert.alert('No sets logged', 'Log at least one set to save.');
      return;
    }
    setSaving(true);
    try {
      const state = await loadGymProgress();
      const session = {
        date: toLocalDateKey(),
        workoutId: workout!.id,
        workoutTitle: workout!.title,
        exercises: finalLogs,
        synced: false,
      };
      const next = recordGymSessionCompletion(state, session);
      const synced = await trySyncSession(session);
      if (synced) {
        next.sessions[0] = { ...next.sessions[0], synced: true };
      }
      await saveGymProgress(next);
      router.replace('/lift/complete');
    } catch {
      Alert.alert('Saved locally', 'Could not finish cleanly — check storage and try again.');
      setSaving(false);
    }
  }

  function moveToNextExercise(logsSoFar: ExerciseSessionLog[]) {
    const nextIndex = exerciseIndex + 1;
    if (nextIndex >= exercises.length) {
      void finishWorkout(logsSoFar);
      return;
    }
    const nextEx = exercises[nextIndex];
    setExerciseIndex(nextIndex);
    setSetNumber(1);
    setCurrentSets([]);
    setFeel(null);
    setRepsInput('');
    setLastRec(null);
    setPhase('do_set');
    void loadGymProgress().then((state) => {
      const start = getSuggestedStartWeight(state, nextEx);
      setWeightInput(start != null ? String(start) : '');
    });
  }

  function onLogSet() {
    if (!current || !feel) {
      Alert.alert('How did it feel?', 'Tap Easy, Perfect, or Hard.');
      return;
    }
    const weightLbs = Number(weightInput);
    const reps = Number(repsInput);
    if (!Number.isFinite(weightLbs) || weightLbs < 0) {
      Alert.alert('Weight', 'Enter weight in lb (0 is OK for bodyweight).');
      return;
    }
    if (!Number.isFinite(reps) || reps <= 0) {
      Alert.alert('Reps', 'Enter how many reps you completed.');
      return;
    }

    const rec = recommendNextWeight(current, weightLbs, reps, feel);
    const logged: LoggedSet = {
      setNumber,
      weightLbs,
      reps,
      feel,
      recommendedNextLbs: rec.nextWeightLbs,
      adjustment: rec.adjustment,
    };
    const updatedSets = [...currentSets, logged];
    setCurrentSets(updatedSets);
    setLastRec(rec);
    setWeightInput(String(rec.nextWeightLbs));
    setFeel(null);
    setRepsInput('');

    if (setNumber >= current.sets) {
      const nextMeta = nextSessionWeightForExercise(current, updatedSets);
      const exerciseLog: ExerciseSessionLog = {
        exerciseId: current.id,
        exerciseName: current.name,
        sets: updatedSets,
        nextSessionWeightLbs: nextMeta.weight,
        progressed: nextMeta.progressed,
      };
      const logsSoFar = [...sessionLogs, exerciseLog];
      setSessionLogs(logsSoFar);
      moveToNextExercise(logsSoFar);
      return;
    }

    setSetNumber((n) => n + 1);
    setPhase('rest');
    setRestSeconds(current.restSec);
  }

  function formatClock(totalSec: number) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (!ready || !current) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.body}>Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.progressRow}>
          <Text style={styles.meta}>
            {exerciseIndex + 1}/{exercises.length} · Set {setNumber}/{current.sets}
          </Text>
          <Text style={styles.restHint}>Rest {formatRest(current)}</Text>
        </View>

        <Text style={styles.title}>{current.name}</Text>
        <Text style={styles.prescription}>Target {formatRepRange(current)}</Text>
        {current.notes ? <Text style={styles.note}>{current.notes}</Text> : null}
        {setNumber === 1 && currentSets.length === 0 ? (
          <AlternativeButton exercise={current} onChange={onSwapCurrent} />
        ) : null}
        {setNumber === 1 && currentSets.length === 0
          ? (() => {
              const hint = getExerciseWarmupHint(
                workout,
                current,
                weightInput ? Number(weightInput) : null
              );
              return hint ? (
                <View style={styles.warmupBanner}>
                  <Text style={styles.warmupBannerTitle}>Warm-up first</Text>
                  <Text style={styles.warmupBannerBody}>{hint}</Text>
                </View>
              ) : null;
            })()
          : null}

        {lastRec ? (
          <View
            style={[
              styles.recCard,
              lastRec.adjustment === 'up' && styles.recUp,
              lastRec.adjustment === 'down' && styles.recDown,
            ]}
          >
            <Text style={styles.recEyebrow}>Next set</Text>
            <Text style={styles.recTitle}>
              {lastRec.adjustment === 'up'
                ? 'Go up'
                : lastRec.adjustment === 'down'
                  ? 'Go down'
                  : 'Stay'}
              {'  ·  '}
              {lastRec.nextWeightLbs} lb
            </Text>
            <Text style={styles.recReason}>{lastRec.reason}</Text>
          </View>
        ) : (
          <View style={styles.recCard}>
            <Text style={styles.recEyebrow}>Working set</Text>
            <Text style={styles.recTitle}>
              {weightInput ? `Start at ${weightInput} lb` : 'Enter the weight you use'}
            </Text>
            <Text style={styles.recReason}>
              Leave 1–2 reps in reserve on compounds. Log after the set.
            </Text>
          </View>
        )}

        {phase === 'rest' ? (
          <View style={styles.restBox}>
            <Text style={styles.timerText}>{formatClock(restSeconds)}</Text>
            <Text style={styles.phaseLabel}>
              Rest · next ≈ {weightInput || '—'} lb
            </Text>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                setRestSeconds(0);
                setPhase('do_set');
              }}
            >
              <Text style={styles.secondaryButtonText}>Skip rest</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.logCard}>
            <Text style={styles.label}>Weight (lb)</Text>
            <TextInput
              style={styles.input}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              placeholder={current.bodyweight ? '0 if bodyweight' : 'e.g. 55'}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Reps</Text>
            <TextInput
              style={styles.input}
              value={repsInput}
              onChangeText={setRepsInput}
              keyboardType="number-pad"
              placeholder={`${current.repMin}–${current.repMax}`}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>How did it feel?</Text>
            <View style={styles.feelRow}>
              {(['easy', 'perfect', 'hard'] as SetFeel[]).map((option) => (
                <Pressable
                  key={option}
                  style={[styles.feelButton, feel === option && styles.feelSelected]}
                  onPress={() => setFeel(option)}
                >
                  <Text style={[styles.feelText, feel === option && styles.feelTextSelected]}>
                    {option === 'easy' ? 'Easy' : option === 'perfect' ? 'Perfect' : 'Hard'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.primaryButton, saving && styles.disabled]}
              onPress={onLogSet}
              disabled={saving}
            >
              <Text style={styles.primaryButtonText}>
                {setNumber >= current.sets ? 'Log & next exercise' : 'Log set'}
              </Text>
            </Pressable>
          </View>
        )}

        {currentSets.length > 0 ? (
          <View style={styles.historyCard}>
            <Text style={styles.label}>Logged</Text>
            {currentSets.map((s) => (
              <Text key={s.setNumber} style={styles.historyLine}>
                Set {s.setNumber}: {s.weightLbs} lb × {s.reps} · {s.feel}
              </Text>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    flex: { flex: 1 },
    container: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    meta: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
    restHint: { fontSize: 13, color: colors.textMuted },
    title: { fontSize: 26, fontWeight: '700', color: colors.text },
    prescription: { fontSize: 16, fontWeight: '600', color: colors.text },
    note: { fontSize: 13, color: colors.textMuted },
    warmupBanner: {
      backgroundColor: colors.accentSoft,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.accent,
      padding: spacing.md,
      gap: 4,
    },
    warmupBannerTitle: { fontSize: 13, fontWeight: '700', color: colors.accent },
    warmupBannerBody: { fontSize: 14, color: colors.text, lineHeight: 20 },
    body: { fontSize: 16, color: colors.text, textAlign: 'center' },
    recCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: 4,
    },
    recUp: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
    recDown: { borderColor: '#d97706', backgroundColor: '#fffbeb' },
    recEyebrow: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    recTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    recReason: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    restBox: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    timerText: {
      fontSize: 52,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    phaseLabel: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
    logCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    label: { fontSize: 14, fontWeight: '700', color: colors.text },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 12,
      color: colors.text,
      backgroundColor: colors.background,
      fontSize: 20,
      fontWeight: '700',
    },
    feelRow: { flexDirection: 'row', gap: spacing.sm },
    feelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    feelSelected: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    feelText: { fontSize: 14, fontWeight: '600', color: colors.text },
    feelTextSelected: { color: colors.accent },
    primaryButton: {
      marginTop: spacing.xs,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 15,
      alignItems: 'center',
    },
    primaryButtonText: { color: colors.primaryText, fontSize: 16, fontWeight: '700' },
    secondaryButton: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
    },
    secondaryButtonText: { fontSize: 15, fontWeight: '600', color: colors.text },
    disabled: { opacity: 0.5 },
    historyCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: 4,
    },
    historyLine: { fontSize: 14, color: colors.textMuted },
  });
}
