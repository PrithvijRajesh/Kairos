// Log a cardio session — mode, effort, distance/time, date.
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { appendCardioLog } from '../cardioLog';
import { toLocalDateKey } from '../coreProgress';
import {
  type CardioEffort,
  type CardioMode,
  effortLabel,
  formatMiles,
  modeLabel,
  recommendMileage,
  recommendMinutes,
} from '../cardioCoach';
import { loadCardioLog } from '../cardioLog';
import { useTheme } from '../ThemeContext';
import { radius, spacing } from '../theme';

const MODES: { id: CardioMode; label: string }[] = [
  { id: 'run', label: 'Outdoor' },
  { id: 'treadmill', label: 'Treadmill' },
  { id: 'bike', label: 'Bike' },
];

const EFFORTS: { id: CardioEffort; label: string; desc: string }[] = [
  { id: 'light', label: 'Chill', desc: 'Conversational pace, nose-breathing easy' },
  { id: 'normal', label: 'Normal', desc: 'Comfortable push — short sentences' },
  { id: 'farther', label: 'Harder', desc: 'High effort, breathing heavy' },
];

const DATE_PRESETS = [
  { label: 'Today', offset: 0 },
  { label: 'Yesterday', offset: 1 },
  { label: '2 days ago', offset: 2 },
];

function dateFromOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return toLocalDateKey(d);
}

export default function LogRunScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ mode?: string; date?: string; effort?: string }>();

  const initMode: CardioMode =
    params.mode === 'treadmill' || params.mode === 'bike' ? params.mode : 'run';
  const initDate = params.date ?? toLocalDateKey();
  const initEffort: CardioEffort =
    params.effort === 'light' || params.effort === 'farther' ? params.effort : 'normal';

  const [mode, setMode] = useState<CardioMode>(initMode);
  const [effort, setEffort] = useState<CardioEffort>(initEffort);
  const [distanceText, setDistanceText] = useState('');
  const [durationText, setDurationText] = useState('');
  const [inclineText, setInclineText] = useState('');
  const [resistanceText, setResistanceText] = useState('');
  const [notesText, setNotesText] = useState('');

  // Date selection
  const [datePreset, setDatePreset] = useState<number | null>(
    initDate === toLocalDateKey() ? 0 : initDate === dateFromOffset(1) ? 1 : null
  );
  const [customDate, setCustomDate] = useState(
    datePreset === null ? initDate : ''
  );

  const styles = makeStyles(colors);

  const selectedDate =
    datePreset !== null ? dateFromOffset(datePreset) : customDate.trim() || toLocalDateKey();

  async function handleSave() {
    const distance = parseFloat(distanceText);
    const duration = parseInt(durationText, 10);
    const incline = parseFloat(inclineText);
    const resistance = parseInt(resistanceText, 10);

    if (mode === 'run' && (!distance || isNaN(distance))) {
      Alert.alert('Add distance', 'Enter how many miles you ran.');
      return;
    }
    if ((mode === 'treadmill' || mode === 'bike') && (!duration || isNaN(duration))) {
      Alert.alert('Add duration', 'Enter how many minutes you went.');
      return;
    }
    if (!selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Check the date', 'Date must be in YYYY-MM-DD format (e.g. 2026-09-03).');
      return;
    }

    const workoutId = `${mode}_${selectedDate}_${Date.now()}`;

    await appendCardioLog({
      date: selectedDate,
      mode,
      effort,
      distanceMi: mode === 'run' && distance ? distance : undefined,
      durationMin: (mode === 'treadmill' || mode === 'bike') && duration ? duration : undefined,
      inclinePercent: mode === 'treadmill' && !isNaN(incline) ? incline : undefined,
      resistance: mode === 'bike' && !isNaN(resistance) ? resistance : undefined,
      notes: notesText.trim() || undefined,
      workoutId,
    });

    // Show smart feedback
    const allLogs = await loadCardioLog();
    const todayKey = toLocalDateKey();
    const mileRec = recommendMileage(allLogs, todayKey);
    const minuteRec = recommendMinutes(allLogs, todayKey, mode === 'run' ? 'treadmill' : mode);

    let nextMsg = '';
    if (mode === 'run') {
      if (effort === 'farther') {
        nextMsg = `Nice hard run! Next time aim for a Chill ${formatMiles(mileRec.lightMi)} — recovery runs rebuild faster.`;
      } else if (effort === 'light') {
        nextMsg = `Solid easy run. Your base is building. Next Normal target: ~${formatMiles(mileRec.normalMi)}.`;
      } else {
        nextMsg = `Good Normal effort. Next time try ${formatMiles(mileRec.normalMi)}–${formatMiles(mileRec.fartherMi)} or stick with Normal to lock in the base.`;
      }
    } else {
      if (effort === 'farther') {
        nextMsg = `Hard ${modeLabel(mode).toLowerCase()} session logged. Next time keep it easy — ${minuteRec.lightMin} min is plenty.`;
      } else {
        nextMsg = `${modeLabel(mode)} logged. Next Normal session target: ~${minuteRec.normalMin} min.`;
      }
    }

    Alert.alert('Logged', nextMsg, [
      { text: 'OK', onPress: () => router.push('/run') },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Log session</Text>

          {/* Mode */}
          <Text style={styles.sectionLabel}>Activity</Text>
          <View style={styles.chipRow}>
            {MODES.map((m) => (
              <Pressable
                key={m.id}
                style={[styles.chip, mode === m.id && styles.chipActive]}
                onPress={() => setMode(m.id)}
              >
                <Text style={[styles.chipLabel, mode === m.id && styles.chipLabelActive]}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Date */}
          <Text style={styles.sectionLabel}>Date</Text>
          <View style={styles.chipRow}>
            {DATE_PRESETS.map((p) => (
              <Pressable
                key={p.offset}
                style={[styles.chip, datePreset === p.offset && styles.chipActive]}
                onPress={() => { setDatePreset(p.offset); setCustomDate(''); }}
              >
                <Text style={[styles.chipLabel, datePreset === p.offset && styles.chipLabelActive]}>
                  {p.label}
                </Text>
                <Text style={[styles.chipSub, datePreset === p.offset && { color: colors.accent }]}>
                  {dateFromOffset(p.offset)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={[styles.chip, datePreset === null && styles.chipActive]}
            onPress={() => setDatePreset(null)}
          >
            <Text style={[styles.chipLabel, datePreset === null && styles.chipLabelActive]}>Custom date</Text>
          </Pressable>
          {datePreset === null && (
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              value={customDate}
              onChangeText={setCustomDate}
              keyboardType="numbers-and-punctuation"
              autoFocus
            />
          )}

          {/* Stats */}
          {mode === 'run' && (
            <>
              <Text style={styles.sectionLabel}>Distance (miles)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 3.1"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={distanceText}
                onChangeText={setDistanceText}
              />
            </>
          )}

          {(mode === 'treadmill' || mode === 'bike') && (
            <>
              <Text style={styles.sectionLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 30"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={durationText}
                onChangeText={setDurationText}
              />
            </>
          )}

          {mode === 'treadmill' && (
            <>
              <Text style={styles.sectionLabel}>Incline % (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1.5"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={inclineText}
                onChangeText={setInclineText}
              />
            </>
          )}

          {mode === 'bike' && (
            <>
              <Text style={styles.sectionLabel}>Resistance level (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 6"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={resistanceText}
                onChangeText={setResistanceText}
              />
            </>
          )}

          {/* Effort */}
          <Text style={styles.sectionLabel}>How did it feel?</Text>
          <View style={styles.effortCol}>
            {EFFORTS.map((e) => (
              <Pressable
                key={e.id}
                style={[styles.effortRow, effort === e.id && styles.effortRowActive]}
                onPress={() => setEffort(e.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.effortLabel, effort === e.id && styles.effortLabelActive]}>
                    {e.label}
                  </Text>
                  <Text style={[styles.effortDesc, effort === e.id && { color: colors.accentMuted }]}>
                    {e.desc}
                  </Text>
                </View>
                {effort === e.id && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
            ))}
          </View>

          {/* Notes */}
          <Text style={styles.sectionLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            placeholder="How did it go? Anything notable?"
            placeholderTextColor={colors.textMuted}
            value={notesText}
            onChangeText={setNotesText}
            multiline
            numberOfLines={3}
          />

          <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save session</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 48 },
    title: {
      fontSize: 28,
      fontWeight: '600',
      letterSpacing: -0.6,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSoft,
      marginTop: spacing.sm,
    },
    chipRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
    chip: {
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceRaised,
      gap: 2,
    },
    chipActive: { backgroundColor: colors.accentSoft },
    chipIcon: { fontSize: 18 },
    chipLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
    chipLabelActive: { color: colors.accent },
    chipSub: { fontSize: 11, color: colors.textMuted },
    input: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    inputMulti: { minHeight: 80, textAlignVertical: 'top' },
    effortCol: { gap: spacing.xs },
    effortRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceRaised,
    },
    effortRowActive: { backgroundColor: colors.accentSoft },
    effortLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
    effortLabelActive: { color: colors.accent },
    effortDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    checkmark: { fontSize: 16, color: colors.accent, fontWeight: '600' },
    saveBtn: {
      marginTop: spacing.md,
      borderRadius: radius.md,
      paddingVertical: 15,
      alignItems: 'center',
    },
    saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  });
}
