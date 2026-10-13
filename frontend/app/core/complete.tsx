// Core complete — streak only, no ratings.
import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { loadCoreProgress } from '../../coreProgress';
import { useTheme } from '../../ThemeContext';
import { type as typeScale } from '../../theme';
import { Panel, PrimaryButton, Screen, SecondaryButton, StatBlock } from '../../ui';

export default function CoreCompleteScreen() {
  const { colors } = useTheme();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  useEffect(() => {
    loadCoreProgress().then((state) => {
      setCurrentStreak(state.streak.currentStreak);
      setLongestStreak(state.streak.longestStreak);
    });
  }, []);

  return (
    <Screen scroll={false}>
      <View style={styles.center}>
        <Text style={[typeScale.section, { color: colors.accent }]}>Done</Text>
        <Text style={[typeScale.display, { color: colors.text }]}>Session logged</Text>
        <Panel style={{ width: '100%', marginTop: 24 }}>
          <View style={styles.row}>
            <StatBlock value={currentStreak} label="streak" />
            <StatBlock value={longestStreak} label="best" />
          </View>
        </Panel>
        <View style={{ width: '100%', gap: 12, marginTop: 24 }}>
          <PrimaryButton label="Home" onPress={() => router.replace('/dashboard')} />
          <SecondaryButton label="Back to core" onPress={() => router.replace('/core')} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', gap: 12 },
  row: { flexDirection: 'row', gap: 10 },
});
