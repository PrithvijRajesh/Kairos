// Home — train. Nothing else.
import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { ensureLiftProgramStart } from '../gymProgress';
import { getScheduleForDate, type DaySchedule } from '../gymWorkouts';
import { useTheme } from '../ThemeContext';
import { spacing, type as typeScale } from '../theme';
import { BrandMark, Screen, TrainingTile } from '../ui';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const [liftSchedule, setLiftSchedule] = useState<DaySchedule | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const gymState = await ensureLiftProgramStart(false);
        if (active && gymState.programStartDate) {
          setLiftSchedule(getScheduleForDate(new Date(), gymState.programStartDate));
        }
      }
      load();
      return () => {
        active = false;
      };
    }, [])
  );

  const liftSummary =
    liftSchedule?.kind === 'lift'
      ? liftSchedule.label.replace(/^Day \d+ · /, '')
      : liftSchedule?.kind === 'rest'
        ? 'Rest day'
        : '—';

  const weekday = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Screen>
      <View style={styles.topRow}>
        <BrandMark />
        <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
          <Text style={[typeScale.caption, { color: colors.textMuted }]}>Settings</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={[typeScale.caption, { color: colors.textSoft }]}>{weekday}</Text>
        <Text style={[typeScale.display, { color: colors.text, fontSize: 34, lineHeight: 40 }]}>
          {liftSummary}
        </Text>
        {liftSchedule?.kind === 'rest' && liftSchedule.hint ? (
          <Text style={[typeScale.body, { color: colors.textMuted }]}>{liftSchedule.hint}</Text>
        ) : (
          <Text style={[typeScale.body, { color: colors.textMuted }]}>Today’s lift focus</Text>
        )}
      </View>

      <View style={styles.list}>
        <TrainingTile
          title="Lift"
          subtitle="Program + sheets"
          onPress={() => router.push('/lift')}
          featured
        />
        <TrainingTile title="Cardio" subtitle="Goal sessions" onPress={() => router.push('/run')} />
        <TrainingTile title="Core" subtitle="Pick a focus" onPress={() => router.push('/core')} />
        <TrainingTile title="Stretch" subtitle="Mobility" onPress={() => router.push('/stretch')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hero: {
    gap: 8,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
});
