// Cardio — goal pick, random session.
import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { loadCardioLog } from '../cardioLog';
import {
  effortLabel,
  formatMiles,
  modeLabel,
  type CardioMode,
  type CardioSessionLog,
} from '../cardioCoach';
import {
  pickRunWorkoutForGoal,
  prescriptionForMode,
  runGoalCategories,
  type RunGoalId,
} from '../runCategories';
import { toLocalDateKey } from '../coreProgress';
import { useTheme } from '../ThemeContext';
import { spacing, type as typeScale } from '../theme';
import {
  ChoiceChip,
  PageTitle,
  Panel,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionLabel,
} from '../ui';

const MODES: { id: CardioMode; label: string }[] = [
  { id: 'run', label: 'Outdoor' },
  { id: 'treadmill', label: 'Treadmill' },
  { id: 'bike', label: 'Bike' },
];

export default function RunScreen() {
  const { colors } = useTheme();
  const [logs, setLogs] = useState<CardioSessionLog[]>([]);
  const [goalId, setGoalId] = useState<RunGoalId>('aerobic_base');
  const [mode, setMode] = useState<CardioMode>('run');
  const todayKey = toLocalDateKey();

  useFocusEffect(
    useCallback(() => {
      loadCardioLog().then(setLogs);
    }, [])
  );

  const workout = useMemo(() => pickRunWorkoutForGoal(goalId, todayKey), [goalId, todayKey]);
  const rx = prescriptionForMode(workout, mode);
  const goal = runGoalCategories.find((g) => g.id === goalId)!;
  const recent = logs.slice(0, 4);

  return (
    <Screen>
      <PageTitle
        eyebrow="Cardio"
        title={goal.title}
        subtitle="Pick a goal and mode. Built for 2–3 sessions a week."
      />

      <SectionLabel>Goal</SectionLabel>
      <View style={styles.col}>
        {runGoalCategories.map((g) => (
          <ChoiceChip
            key={g.id}
            label={g.title}
            detail={g.blurb}
            active={goalId === g.id}
            onPress={() => setGoalId(g.id)}
          />
        ))}
      </View>

      <SectionLabel>Mode</SectionLabel>
      <View style={styles.row}>
        {MODES.map((m) => (
          <View key={m.id} style={{ flex: 1 }}>
            <ChoiceChip label={m.label} active={mode === m.id} onPress={() => setMode(m.id)} />
          </View>
        ))}
      </View>

      <Panel ink>
        <Text style={[typeScale.section, { color: colors.accent }]}>{workout.title}</Text>
        <Text style={[typeScale.caption, { color: colors.textMuted }]}>
          ~{workout.estimatedMin} min · log as {effortLabel(workout.effort)}
        </Text>
        <Text style={[typeScale.title, { color: colors.text, marginTop: spacing.sm }]}>{rx.main}</Text>
        <Text style={[typeScale.body, { color: colors.textMuted }]}>{rx.detail}</Text>
        <Text style={[typeScale.caption, { color: colors.accent, marginTop: spacing.sm }]}>
          {workout.why}
        </Text>
      </Panel>

      <PrimaryButton
        label={`Log ${modeLabel(mode).toLowerCase()}`}
        onPress={() =>
          router.push({
            pathname: '/log-run',
            params: { mode, date: todayKey, effort: workout.effort },
          })
        }
      />
      <SecondaryButton
        label="Log past session"
        onPress={() => router.push({ pathname: '/log-run', params: { mode } })}
      />

      {recent.length > 0 ? (
        <>
          <SectionLabel>Recent</SectionLabel>
          <Panel>
            {recent.map((s, i) => (
              <View key={`${s.date}-${i}`} style={styles.hist}>
                <Text style={[typeScale.caption, { color: colors.textMuted, width: 56 }]}>
                  {s.date.slice(5)}
                </Text>
                <Text style={[typeScale.bodyStrong, { color: colors.text, width: 72 }]}>
                  {modeLabel(s.mode)}
                </Text>
                <Text style={[typeScale.caption, { color: colors.text, flex: 1 }]}>
                  {s.distanceMi
                    ? formatMiles(s.distanceMi)
                    : s.durationMin
                      ? `${s.durationMin} min`
                      : '—'}
                </Text>
              </View>
            ))}
          </Panel>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  col: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  hist: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
});
