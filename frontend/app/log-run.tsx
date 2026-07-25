// Log a completed run.
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { submitRunLog } from '../api';
import { toLocalDateKey } from '../coreProgress';
import { useTheme } from '../ThemeContext';
import { radius, spacing } from '../theme';

export default function LogRunScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ workoutId?: string }>();
  const workoutId = params.workoutId ?? 'easy_run_30';
  const [durationMin, setDurationMin] = useState('');
  const [distanceMi, setDistanceMi] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const styles = makeStyles(colors);

  async function handleSave() {
    setSaving(true);
    try {
      await submitRunLog({
        date: toLocalDateKey(),
        workoutId,
        durationMin: durationMin ? Number(durationMin) : undefined,
        distanceMi: distanceMi ? Number(distanceMi) : undefined,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Logged', 'Run saved.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not log run');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Log run</Text>
          <Text style={styles.subtitle}>Workout: {workoutId}</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={durationMin}
              onChangeText={setDurationMin}
              keyboardType="numeric"
              placeholder="35"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Distance (miles)</Text>
            <TextInput
              style={styles.input}
              value={distanceMi}
              onChangeText={setDistanceMi}
              keyboardType="decimal-pad"
              placeholder="4.2"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={notes}
              onChangeText={setNotes}
              placeholder="How it felt..."
              placeholderTextColor={colors.textMuted}
              multiline
            />
          </View>

          <Pressable style={styles.button} onPress={handleSave} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save log'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    container: { padding: spacing.lg, gap: spacing.md },
    title: { fontSize: 26, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 14, color: colors.textMuted },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    label: { fontSize: 16, fontWeight: '600', color: colors.text },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      padding: spacing.sm,
      color: colors.text,
      backgroundColor: colors.background,
    },
    multiline: { minHeight: 80, textAlignVertical: 'top' },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonText: { color: colors.primaryText, fontWeight: '700', fontSize: 16 },
  });
}
