// Guided stretch session with hold timers.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';

import {
  getExercisesForRoutine,
  getTodayStretchRoutine,
} from '../../stretchRoutines';
import {
  loadStretchProgress,
  recordStretchCompletion,
  saveStretchProgress,
} from '../../stretchProgress';
import { useTheme } from '../../ThemeContext';
import { radius, spacing } from '../../theme';

type Side = 'left' | 'right';
type Phase = 'ready' | 'hold';

export default function StretchSessionScreen() {
  const { colors } = useTheme();
  const routine = getTodayStretchRoutine();
  const exercises = useMemo(() => getExercisesForRoutine(routine), [routine.id]);

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [activeSide, setActiveSide] = useState<Side>('left');
  const [phase, setPhase] = useState<Phase>('ready');
  const [secondsLeft, setSecondsLeft] = useState(0);

  const current = exercises[exerciseIndex];

  const finishSession = useCallback(async () => {
    const state = await loadStretchProgress();
    const nextState = recordStretchCompletion(state);
    await saveStretchProgress(nextState);
    router.replace('/stretch/complete');
  }, []);

  const advance = useCallback(() => {
    if (!current) return;

    if (current.perSide && activeSide === 'left') {
      setActiveSide('right');
      setPhase('ready');
      setSecondsLeft(0);
      return;
    }

    if (exerciseIndex < exercises.length - 1) {
      setExerciseIndex((i) => i + 1);
      setActiveSide('left');
      setPhase('ready');
      setSecondsLeft(0);
      return;
    }

    void finishSession();
  }, [activeSide, current, exerciseIndex, exercises.length, finishSession]);

  function startHold() {
    if (!current) return;
    setSecondsLeft(current.holdSec);
    setPhase('hold');
  }

  function sideLabel(side: Side) {
    return side === 'left' ? 'Left side' : 'Right side';
  }

  function formatClock(totalSec: number) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  useEffect(() => {
    if (phase !== 'hold' || secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [phase, secondsLeft]);

  useEffect(() => {
    if (phase !== 'hold' || secondsLeft > 0) return;
    advance();
  }, [secondsLeft, phase, advance]);

  const styles = makeStyles(colors);

  if (!current) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.body}>No stretches found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.meta}>
        {exerciseIndex + 1} / {exercises.length}
      </Text>
      <Text style={styles.title}>{current.name}</Text>
      {current.perSide ? (
        <Text style={styles.sideLabel}>{sideLabel(activeSide)}</Text>
      ) : null}
      <Text style={styles.holdLabel}>{current.holdSec} sec hold</Text>

      {phase === 'hold' ? (
        <View style={styles.timerBox}>
          <Text style={styles.timerText}>{formatClock(secondsLeft)}</Text>
          <Text style={styles.phaseLabel}>Hold steady — breathe</Text>
        </View>
      ) : null}

      <View style={styles.cuesBox}>
        {current.cues.map((cue) => (
          <Text key={cue} style={styles.cue}>
            • {cue}
          </Text>
        ))}
      </View>

      <View style={styles.actions}>
        {phase === 'ready' ? (
          <Pressable style={styles.primaryButton} onPress={startHold}>
            <Text style={styles.primaryButtonText}>
              {current.perSide ? `Start ${sideLabel(activeSide)}` : 'Start hold'}
            </Text>
          </Pressable>
        ) : (
          <Pressable style={styles.primaryButton} onPress={advance}>
            <Text style={styles.primaryButtonText}>Next stretch</Text>
          </Pressable>
        )}
        <Pressable style={styles.secondaryButton} onPress={advance}>
          <Text style={styles.secondaryButtonText}>Skip</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.lg * 2 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    meta: { fontSize: 14, color: colors.textMuted },
    title: { fontSize: 26, fontWeight: '700', color: colors.text },
    sideLabel: { fontSize: 16, fontWeight: '600', color: colors.accent },
    holdLabel: { fontSize: 15, color: colors.textMuted },
    timerBox: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    timerText: {
      fontSize: 48,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    phaseLabel: { fontSize: 16, color: colors.textMuted },
    cuesBox: { gap: spacing.xs },
    cue: { fontSize: 14, color: colors.textMuted },
    actions: { gap: spacing.sm, marginTop: spacing.sm },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryButtonText: { color: colors.primaryText, fontSize: 16, fontWeight: '700' },
    secondaryButton: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    secondaryButtonText: { fontSize: 15, fontWeight: '600', color: colors.text },
    body: { fontSize: 16, color: colors.text },
  });
}
