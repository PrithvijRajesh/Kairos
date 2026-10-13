// Stretch — simple list + start.
import { useCallback, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import {
  formatStretchPrescription,
  getExercisesForRoutine,
  getTodayStretchRoutine,
} from '../../stretchRoutines';
import { isStretchCompletedToday, loadStretchProgress } from '../../stretchProgress';
import { useTheme } from '../../ThemeContext';
import { spacing, type as typeScale } from '../../theme';
import {
  PageTitle,
  Panel,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionLabel,
  StatBlock,
} from '../../ui';

export default function StretchScreen() {
  const { colors } = useTheme();
  const routine = getTodayStretchRoutine();
  const exercises = getExercisesForRoutine(routine);
  const [completedToday, setCompletedToday] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const state = await loadStretchProgress();
        if (!active) return;
        setCompletedToday(isStretchCompletedToday(state));
        setCurrentStreak(state.streak.currentStreak);
        setLongestStreak(state.streak.longestStreak);
      }
      load();
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <Screen>
      <PageTitle
        eyebrow={`Routine ${routine.id}`}
        title={routine.title}
        subtitle={`${routine.focus} · ~${routine.estimatedMin} min`}
      />

      {completedToday ? (
        <Panel>
          <Text style={[typeScale.title, { color: colors.text }]}>Done today</Text>
          <View style={styles.statRow}>
            <StatBlock value={currentStreak} label="streak" />
            <StatBlock value={longestStreak} label="best" />
          </View>
        </Panel>
      ) : (
        <>
          <SectionLabel>Moves</SectionLabel>
          {exercises.map((exercise) => (
            <Panel key={exercise.id}>
              <Text style={[typeScale.bodyStrong, { color: colors.text }]}>{exercise.name}</Text>
              <Text style={[typeScale.caption, { color: colors.textMuted }]}>
                {formatStretchPrescription(exercise)}
              </Text>
            </Panel>
          ))}
          <PrimaryButton label="Start" onPress={() => router.push('/stretch/session')} />
        </>
      )}

      {completedToday ? (
        <SecondaryButton label="Home" onPress={() => router.replace('/dashboard')} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statRow: { flexDirection: 'row', gap: spacing.sm },
});
