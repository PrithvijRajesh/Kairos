// Shown after finishing workout: celebration message + streak, then rate exercises.
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { loadCoreProgress } from '../../coreProgress';
import { useTheme } from '../../ThemeContext';
import { radius, spacing } from '../../theme';

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

  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>✓</Text>
      <Text style={styles.title}>You're all done for today!</Text>
      <Text style={styles.subtitle}>Great work finishing your core session.</Text>

      <View style={styles.streakCard}>
        <Text style={styles.streakLabel}>Current streak</Text>
        <Text style={styles.streakValue}>
          {currentStreak} day{currentStreak === 1 ? '' : 's'}
        </Text>
        <Text style={styles.streakMeta}>Longest streak: {longestStreak} days</Text>
      </View>

      <Pressable style={styles.button} onPress={() => router.replace('/core/review')}>
        <Text style={styles.buttonText}>Rate this workout</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.replace('/core')}>
        <Text style={styles.secondaryButtonText}>Back to Core</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.lg,
      justifyContent: 'center',
      gap: spacing.md,
      backgroundColor: colors.background,
    },
    emoji: {
      fontSize: 56,
      textAlign: 'center',
      color: colors.accent,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      textAlign: 'center',
      color: colors.text,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      color: colors.textMuted,
    },
    streakCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.xs,
      marginVertical: spacing.sm,
    },
    streakLabel: {
      fontSize: 14,
      color: colors.textMuted,
      fontWeight: '600',
    },
    streakValue: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.accent,
    },
    streakMeta: {
      fontSize: 14,
      color: colors.textMuted,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonText: {
      color: colors.primaryText,
      fontWeight: '700',
      fontSize: 16,
    },
    secondaryButton: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
