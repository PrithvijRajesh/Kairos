// Google Sheets Sync & Log bridge
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { toLocalDateKey } from '../../coreProgress';
import {
  ensureLiftProgramStart,
  getSuggestedStartWeight,
  loadGymProgress,
} from '../../gymProgress';
import { getScheduleForDate, type DaySchedule } from '../../gymWorkouts';
import { applySwapsToWorkout, loadTodaysSwaps } from '../../gymSwaps';
import {
  buildBlankLogRows,
  buildFilledLogRows,
  cleanGoogleSheetLayout,
  sendRowsToGoogleSheet,
  syncSessionFromGoogleSheet,
  yesterdayDateKey,
} from '../../googleSheetsLog';
import { loadAppSettings } from '../../settingsStorage';
import { useTheme } from '../../ThemeContext';
import { radius, spacing } from '../../theme';

export default function LiftWorksheetScreen() {
  const { colors } = useTheme();
  const [schedule, setSchedule] = useState<DaySchedule | null>(null);
  const [startWeights, setStartWeights] = useState<Record<string, number | null>>({});
  const [busy, setBusy] = useState(false);
  const [hasSheetsUrl, setHasSheetsUrl] = useState(false);
  const [syncDate, setSyncDate] = useState(toLocalDateKey());

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
      if (result.ok === false) {
        Alert.alert('Could not send', result.error);
        return;
      }
      Alert.alert(
        'Sent to Google Sheets',
        `${result.message}\n\nOpen your sheet at the gym and fill Weight + Reps (yellow columns).`
      );
    } finally {
      setBusy(false);
    }
  }

  async function onSendFilledSession() {
    setBusy(true);
    try {
      const state = await loadGymProgress();
      const latest = state.sessions[0];
      if (!latest || latest.date !== toLocalDateKey()) {
        Alert.alert(
          'No session logged today',
          'Complete a lift in the app first, or send blank rows to fill in Sheets.'
        );
        return;
      }
      const rows = buildFilledLogRows(latest);
      const result = await sendRowsToGoogleSheet(rows);
      if (result.ok === false) {
        Alert.alert('Could not send', result.error);
        return;
      }
      Alert.alert('Sent', result.message);
    } finally {
      setBusy(false);
    }
  }

  async function onSyncFromSheets() {
    const trimmed = syncDate.trim();
    if (!trimmed) {
      Alert.alert('Pick date', 'Enter date as YYYY-MM-DD');
      return;
    }
    setBusy(true);
    try {
      const result = await syncSessionFromGoogleSheet(trimmed);
      if (result.ok === false) {
        Alert.alert('Sync failed', result.error);
        return;
      }
      const adviceText = result.advice.length ? '\n\n' + result.advice.join('\n') : '';
      Alert.alert(
        'Synced from Google Sheets ✓',
        `Imported ${result.filledSets} sets from ${result.session.workoutTitle} for ${trimmed}.${adviceText}`,
        [{ text: 'OK', onPress: () => router.replace('/lift') }]
      );
    } finally {
      setBusy(false);
    }
  }

  async function onCleanLayout() {
    setBusy(true);
    try {
      const result = await cleanGoogleSheetLayout();
      if (result.ok === false) {
        Alert.alert('Could not clean sheets', result.error);
        return;
      }
      Alert.alert('Sheets Cleaned ✓', 'Restored pristine 7-column header across all tabs and cleared legacy columns.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Google Sheets Sync</Text>
        <Text style={styles.subtitle}>
          Send today’s blank workout rows to Sheets before the gym. Fill Weight + Reps (yellow) on
          your phone. When home, tap Sync to remember weights for next time.
        </Text>

        {!hasSheetsUrl ? (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>Google Sheets setup</Text>
            <Text style={styles.alertBody}>
              1. Open your Google Sheet → Extensions → Apps Script{'\n'}
              2. Paste frontend/googleSheetsAppsScript.js → Save{'\n'}
              3. Deploy as Web app (Access: Anyone){'\n'}
              4. Paste the Web app URL in Kairos Settings
            </Text>
          </View>
        ) : null}

        <Text style={styles.section}>1. Send rows to Sheets</Text>
        <Pressable
          style={[styles.primaryBtn, busy && styles.disabled]}
          onPress={onSendToSheets}
          disabled={busy || schedule?.kind !== 'lift'}
        >
          <Text style={styles.primaryBtnText}>
            {schedule?.kind === 'lift'
              ? `Send today’s ${schedule.workout.title} to Sheets`
              : 'Rest day — no rows'}
          </Text>
        </Pressable>

        <Text style={styles.section}>2. Pull filled workout from Sheets</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session date to sync</Text>
          <View style={styles.btnRow}>
            <Pressable
              style={[styles.dateChip, syncDate === toLocalDateKey() && styles.dateChipActive]}
              onPress={() => setSyncDate(toLocalDateKey())}
            >
              <Text style={[styles.dateChipText, syncDate === toLocalDateKey() && styles.dateChipTextActive]}>
                Today
              </Text>
            </Pressable>
            <Pressable
              style={[styles.dateChip, syncDate === yesterdayDateKey() && styles.dateChipActive]}
              onPress={() => setSyncDate(yesterdayDateKey())}
            >
              <Text style={[styles.dateChipText, syncDate === yesterdayDateKey() && styles.dateChipTextActive]}>
                Yesterday
              </Text>
            </Pressable>
          </View>
          <TextInput
            style={styles.input}
            value={syncDate}
            onChangeText={setSyncDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            style={[styles.syncBtn, busy && styles.disabled]}
            onPress={onSyncFromSheets}
            disabled={busy}
          >
            <Text style={styles.syncBtnText}>
              {busy ? 'Syncing…' : `Sync ${syncDate} from Sheets`}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Maintenance</Text>
        <Pressable
          style={[styles.secondaryBtn, busy && styles.disabled]}
          onPress={onCleanLayout}
          disabled={busy}
        >
          <Text style={styles.secondaryBtnText}>Clean & reset sheet headers (removes old columns)</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryBtn, busy && styles.disabled]}
          onPress={onSendFilledSession}
          disabled={busy}
        >
          <Text style={styles.secondaryBtnText}>Send completed in-app lift to Sheets</Text>
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
    subtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.xs },
    alertCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.accent,
      padding: spacing.md,
      gap: 6,
      marginBottom: spacing.xs,
    },
    alertTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    alertBody: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    section: {
      marginTop: spacing.md,
      fontSize: 15,
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
    cardTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
    btnRow: { flexDirection: 'row', gap: spacing.sm },
    dateChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      backgroundColor: colors.background,
    },
    dateChipActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    dateChipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
    dateChipTextActive: { color: colors.accent },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      padding: spacing.sm,
      color: colors.text,
      backgroundColor: colors.background,
      fontSize: 14,
    },
    syncBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 2,
    },
    syncBtnText: { color: colors.primaryText, fontWeight: '700', fontSize: 15 },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryBtnText: { color: colors.primaryText, fontWeight: '700', fontSize: 15 },
    secondaryBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    secondaryBtnText: { color: colors.text, fontWeight: '600', fontSize: 14 },
    disabled: { opacity: 0.5 },
  });
}
