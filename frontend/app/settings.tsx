// Settings: program start date and dark mode.
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../ThemeContext';
import { isValidDateKey } from '../settingsStorage';
import { formatProgramStartLabel } from '../coreWorkouts';
import { spacing, radius } from '../theme';
import { toLocalDateKey } from '../coreProgress';

export default function SettingsScreen() {
  const {
    colors,
    themeMode,
    programStartDate,
    setThemeMode,
    setProgramStartDate,
    resetPlanStartToday,
  } = useTheme();

  const [startDateInput, setStartDateInput] = useState(programStartDate);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setStartDateInput(programStartDate);
  }, [programStartDate]);

  const styles = makeStyles(colors);

  async function handleSaveStartDate() {
    const trimmed = startDateInput.trim();
    if (!isValidDateKey(trimmed)) {
      Alert.alert('Invalid date', 'Use format YYYY-MM-DD (example: 2026-06-09).');
      return;
    }
    setIsSaving(true);
    await setProgramStartDate(trimmed);
    setIsSaving(false);
    Alert.alert('Saved', `Program will start on ${formatProgramStartLabel(trimmed)}.`);
  }

  async function handleResetToday() {
    setIsSaving(true);
    const next = await resetPlanStartToday();
    setStartDateInput(next.programStartDate);
    setIsSaving(false);
    Alert.alert('Plan reset', 'Your core program now starts today (Workout A).');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Core program</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Program start date</Text>
          <Text style={styles.hint}>
            Day 0 is Workout A. Before this date you see a preview workout.
          </Text>
          <Text style={styles.current}>
            Current: {formatProgramStartLabel(programStartDate)}
          </Text>
          <TextInput
            style={styles.input}
            value={startDateInput}
            onChangeText={setStartDateInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            style={styles.button}
            onPress={handleSaveStartDate}
            disabled={isSaving}
          >
            <Text style={styles.buttonText}>Save start date</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={handleResetToday}
            disabled={isSaving}
          >
            <Text style={styles.secondaryButtonText}>Reset plan to start today</Text>
          </Pressable>
          <Text style={styles.hint}>
            Today is {toLocalDateKey(new Date())}. Reset sets start to today and
            Workout A.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.label}>Dark mode</Text>
              <Text style={styles.hint}>Easier on the eyes at night</Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={(on) => setThemeMode(on ? 'dark' : 'light')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    hint: {
      fontSize: 14,
      color: colors.textMuted,
    },
    current: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accent,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      padding: spacing.sm,
      color: colors.text,
      backgroundColor: colors.background,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 12,
      alignItems: 'center',
    },
    buttonText: {
      color: colors.primaryText,
      fontWeight: '700',
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: 12,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: colors.text,
      fontWeight: '600',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    rowText: {
      flex: 1,
      gap: spacing.xs,
    },
  });
}
