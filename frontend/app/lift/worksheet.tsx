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
import {
  buildBlankLogRows,
  sendRowsToGoogleSheet,
} from '../../googleSheetsLog';
import { loadAppSettings } from '../../settingsStorage';
import { useTheme } from '../../ThemeContext';
import { radius, spacing } from '../../theme';

export default function LiftWorksheetScreen() {
  const { colors } = useTheme();
  const [schedule, setSchedule] = useState<DaySchedule | null>(null);
  const [startWeights, setStartWeights] = useState<Record<string, number | null>>({});
  const [importText, setImportText] = useState('');
  const [busy, setBusy] = useState(false);
  const [hasSheetsUrl, setHasSheetsUrl] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const state = await ensureLiftProgramStart(false);
        const settings = await loadAppSettings();
        if (!active || !state.programStartDate) return;
        setHasSheetsUrl(!!settings.sheetsWebhookUrl.trim());
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

  async function onSendToSheets() {
    if (!schedule || schedule.kind !== 'lift') {
      Alert.alert('Rest day', 'No lift rows to send today.');
      return;
    }
    setBusy(true);
    try {
      const rows = buildBlankLogRows(schedule, startWeights);
      const result = await sendRowsToGoogleSheet(rows);
      if (!result.ok) {
        Alert.alert('Could not send', result.error);
        return;
      }
      Alert.alert(
        'Sent to Google Sheets',
        `${result.message}\n\nOpen the Log tab on your phone, fill Weight / Reps / Feel at the gym. Check the Progress tab anytime for last weights.`
      );
    } finally {
      setBusy(false);
    }
  }

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
        <Text style={styles.title}>Gym log</Text>
        <Text style={styles.subtitle}>
          Sends today’s sets to the matching tab (Push, Pull, Legs, Upper, or Lower). At the
          gym fill Weight / Reps / Feel on that tab. Progress = last weight per exercise.
        </Text>

        {schedule?.kind === 'lift' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{schedule.label}</Text>
            <Text style={styles.cardBody}>
              {schedule.workout.exercises.length} exercises → blank rows ready to fill
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rest day</Text>
            <Text style={styles.cardBody}>No lift rows to send today.</Text>
          </View>
        )}

        <Text style={styles.section}>Google Sheets (recommended)</Text>
        {!hasSheetsUrl ? (
          <Text style={styles.hint}>
            First: create a Sheet, paste frontend/googleSheetsAppsScript.js into Apps Script,
            Deploy as Web app, then paste the URL in Settings.
          </Text>
        ) : null}
        <Pressable
          style={[styles.primaryBtn, busy && styles.disabled]}
          onPress={onSendToSheets}
          disabled={busy || schedule?.kind !== 'lift'}
        >
          <Text style={styles.primaryBtnText}>Send today’s rows to Sheets</Text>
        </Pressable>
        <Text style={styles.hint}>
          Needs home Wi‑Fi once. Then use Google Sheets offline/on cell data at the gym — no Expo.
        </Text>

        <Text style={styles.section}>Backup: share file</Text>
        <Pressable
          style={[styles.secondaryBtn, busy && styles.disabled]}
          onPress={onExport}
          disabled={busy || schedule?.kind !== 'lift'}
        >
          <Text style={styles.secondaryBtnText}>Export worksheet</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryBtn, busy && styles.disabled]}
          onPress={onShareCsvOnly}
          disabled={busy || schedule?.kind !== 'lift'}
        >
          <Text style={styles.secondaryBtnText}>Share CSV only</Text>
        </Pressable>

        <Text style={styles.section}>Optional: import CSV into Kairos</Text>
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
