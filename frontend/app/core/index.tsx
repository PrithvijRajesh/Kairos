// Core — pick focus, random circuit, reps-first.
import { Alert, Text, View, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import {
  coreCategories,
  formatCoreStep,
  pickWorkoutForCategory,
  type CoreCategoryId,
} from '../../coreCategories';
import {
  isCoreCompletedOnDate,
  isCoreWorkoutCompletedToday,
  loadCoreProgress,
  recordCoreWorkoutCompletionForDate,
  saveCoreProgress,
  toLocalDateKey,
  yesterdayDateKey,
} from '../../coreProgress';
import { useTheme } from '../../ThemeContext';
import { spacing, type as typeScale } from '../../theme';
import {
  ChoiceChip,
  PageTitle,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionLabel,
  StatBlock,
  Panel,
  StepRow,
} from '../../ui';

export default function CoreScreen() {
  const { colors } = useTheme();
  const [categoryId, setCategoryId] = useState<CoreCategoryId>('fast_burner');
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);
  const [completedYesterday, setCompletedYesterday] = useState(false);

  const todayKey = toLocalDateKey();
  const workout = useMemo(
    () => pickWorkoutForCategory(categoryId, todayKey),
    [categoryId, todayKey]
  );
  const category = coreCategories.find((c) => c.id === categoryId)!;

  const refresh = useCallback(async () => {
    const state = await loadCoreProgress();
    setCurrentStreak(state.streak.currentStreak);
    setLongestStreak(state.streak.longestStreak);
    setCompletedToday(isCoreWorkoutCompletedToday(state));
    setCompletedYesterday(isCoreCompletedOnDate(state, yesterdayDateKey()));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  async function markCoreDone(dateKey: string, label: string) {
    const state = await loadCoreProgress();
    const next = recordCoreWorkoutCompletionForDate(state, dateKey);
    await saveCoreProgress(next);
    await refresh();
    Alert.alert(
      'Logged',
      `${label} · streak ${next.streak.currentStreak} day${next.streak.currentStreak === 1 ? '' : 's'}`
    );
  }

  return (
    <Screen>
      <PageTitle
        eyebrow="Core"
        title={category.title}
        subtitle="Pick a focus. Today’s circuit is random within that group."
      />

      {completedToday ? (
        <Panel>
          <Text style={[typeScale.title, { color: colors.text }]}>Done today</Text>
          <View style={styles.statRow}>
            <StatBlock value={currentStreak} label="streak" />
            <StatBlock value={longestStreak} label="best" />
          </View>
        </Panel>
      ) : null}

      <SectionLabel>Focus</SectionLabel>
      <View style={styles.chipCol}>
        {coreCategories.map((c) => (
          <ChoiceChip
            key={c.id}
            label={c.title}
            detail={c.blurb}
            active={categoryId === c.id}
            onPress={() => setCategoryId(c.id)}
          />
        ))}
      </View>

      <Panel>
        <SectionLabel>Today</SectionLabel>
        <Text style={[typeScale.title, { color: colors.text }]}>{workout.title}</Text>
        <Text style={[typeScale.caption, { color: colors.textMuted }]}>
          ~{workout.estimatedMin} min · {workout.rounds}× round{workout.rounds === 1 ? '' : 's'}
        </Text>
        {workout.steps.map((step, i) => (
          <StepRow
            key={step.id}
            index={i + 1}
            label={step.label}
            amount={formatCoreStep(step)}
            kind={step.kind}
          />
        ))}
        <Text style={[typeScale.caption, { color: colors.accent, marginTop: spacing.sm }]}>
          {workout.cue}
        </Text>
      </Panel>

      {!completedToday ? (
        <>
          <PrimaryButton
            label="Start"
            onPress={() =>
              router.push({
                pathname: '/core/workout',
                params: { categoryId, workoutId: workout.id },
              })
            }
          />
          <SecondaryButton
            label="I did my own core"
            onPress={() =>
              Alert.alert('Mark done?', 'Counts toward streak.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Yes', onPress: () => void markCoreDone(todayKey, 'Today') },
              ])
            }
          />
        </>
      ) : (
        <SecondaryButton label="Home" onPress={() => router.replace('/dashboard')} />
      )}

      {!completedYesterday ? (
        <SecondaryButton
          label="Log yesterday"
          onPress={() =>
            Alert.alert('Log yesterday?', undefined, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Yes', onPress: () => void markCoreDone(yesterdayDateKey(), 'Yesterday') },
            ])
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipCol: { gap: spacing.sm },
  statRow: { flexDirection: 'row', gap: spacing.sm },
});
