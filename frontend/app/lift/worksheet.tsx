// Export a gym sheet at home; import the filled CSV when you return.
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { toLocalDateKey } from '../../coreProgress';
import {
  ensureLiftProgramStart,
  getSuggestedStartWeight,
} from '../../gymProgress';
import { getScheduleForDate, type DaySchedule } from '../../gymWorkouts';
import { applySwapsToWorkout, loadTodaysSwaps } from '../../gymSwaps';
import {
  buildWorksheetCsv,
  buildWorksheetPlainText,
  importWorksheetAndSave,
  shareWorksheet,
} from '../../gymWorksheet';
import { useTheme } from '../../ThemeContext';
import { radius, spacing } from '../../theme';

export default function LiftWorksheetScreen() {
  const { colors } = useTheme();
  const [schedule, setSchedule] = useState<DaySchedule | null>(null);
  const [startWeights, setStartWeights] = useState<Record<string, number | null>>({});
  const [importText, setImportText] = useState('');
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const state = await ensureLiftProgramStart(false);
        if (!active || !state.programStartDate) return;
        const today = getScheduleForDate(new Date(), state.programStartDate);
        const swaps = await loadTodaysSwaps();
        if (today.kind === 'lift') {
          const workout = applySwapsToWorkout(today.workout, swaps);
          setSchedule({ ...today, workout });
          const weights: Record<string, number | null> = {};
          for (const ex of workout.exercises) {
            weights[ex.id] = getSuggestedStartWeight(state, ex);
          }
          setStartWeights(weights);
        } else {
          setSchedule(today);
        }
      }
      load();
      return () => {
        active = false;
      };
    }, [])
  );

  const styles = makeStyles(colors);

  async function onExport() {
    if (!schedule || schedule.kind !== 'lift') {
      Alert.alert('Rest day', 'No lift worksheet today.');
      return;
    }
    setBusy(true);
    try {
      const dateKey = toLocalDateKey();
      const csv = buildWorksheetCsv(schedule, startWeights, dateKey);
      const plain = buildWorksheetPlainText(schedule, startWeights, dateKey);
      await shareWorksheet(csv, plain, `Kairos ${schedule.workout.title}`);
    } catch (e) {
      Alert.alert('Share failed', e instanceof Error ? e.message : 'Could not share sheet');
    } finally {
      setBusy(false);
    }
  }

  async function onShareCsvOnly() {
    if (!schedule || schedule.kind !== 'lift') return;
    setBusy(true);
    try {
      const csv = buildWorksheetCsv(schedule, startWeights);
      await Share.share({
        title: `Kairos ${schedule.workout.title} CSV`,
        message: csv,
      });
    } catch (e) {
      Alert.alert('Share failed', e instanceof Error ? e.message : 'Could not share');
    } finally {
      setBusy(false);
    }
  }

  async function onImport() {
    if (!importText.trim()) {
      Alert.alert('Paste CSV', 'Paste the filled worksheet CSV below, then Import.');
      return;
    }
    setBusy(true);
    try {
      const result = await importWorksheetAndSave(importText);
      if (!result.ok) {
        Alert.alert('Import failed', result.error);
        return;
      }
      Alert.alert(
        'Imported',
        `Saved ${result.filledSets} sets from ${result.session.workoutTitle}. Weights remembered for next time.`,
        [{ text: 'OK', onPress: () => router.replace('/lift') }]
      );
      setImportText('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Gym worksheet</Text>
        <Text style={styles.subtitle}>
          Expo Go needs your home PC. For the gym, export a sheet at home, fill it offline, import
          when you get back.
        </Text>

        {schedule?.kind === 'lift' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{schedule.label}</Text>
            <Text style={styles.cardBody}>
              {schedule.workout.exercises.length} exercises · CSV opens in Excel / Sheets / Notes
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rest day</Text>
            <Text style={styles.cardBody}>No lift sheet to export today.</Text>
          </View>
        )}

        <Text style={styles.section}>At home — before the gym</Text>
        <Pressable
          style={[styles.primaryBtn, busy && styles.disabled]}
          onPress={onExport}
          disabled={busy || schedule?.kind !== 'lift'}
        >
          <Text style={styles.primaryBtnText}>Export worksheet</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryBtn, busy && styles.disabled]}
          onPress={onShareCsvOnly}
          disabled={busy || schedule?.kind !== 'lift'}
        >
          <Text style={styles.secondaryBtnText}>Share CSV only</Text>
        </Pressable>
        <Text style={styles.hint}>
          Save to Files, email yourself, or open in Excel. Fill weight_lbs, reps, and feel
          (easy / perfect / hard). Leave unused sets blank.
        </Text>

        <Text style={styles.section}>At home — after the gym</Text>
        <TextInput
          style={styles.input}
          value={importText}
          onChangeText={setImportText}
          placeholder="Paste filled CSV here"
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          style={[styles.primaryBtn, busy && styles.disabled]}
          onPress={onImport}
          disabled={busy}
        >
          <Text style={styles.primaryBtnText}>Import & save</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 15, color: colors.textMuted, lineHeight: 22, marginBottom: spacing.sm },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: 4,
      marginBottom: spacing.sm,
    },
    cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    cardBody: { fontSize: 14, color: colors.textMuted },
    section: {
      marginTop: spacing.md,
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryBtnText: { color: colors.primaryText, fontWeight: '700', fontSize: 16 },
    secondaryBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    secondaryBtnText: { color: colors.text, fontWeight: '600', fontSize: 15 },
    hint: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    input: {
      minHeight: 160,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.sm,
      color: '#111827',
      backgroundColor: '#ffffff',
      fontSize: 13,
      fontFamily: 'monospace',
    },
    disabled: { opacity: 0.5 },
  });
}
