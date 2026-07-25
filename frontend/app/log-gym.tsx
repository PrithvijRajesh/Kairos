// Log a completed gym session.
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

import { submitGymLog } from '../api';
import { toLocalDateKey } from '../coreProgress';
import { useTheme } from '../ThemeContext';
import { radius, spacing } from '../theme';

export default function LogGymScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ workoutId?: string }>();
  const workoutId = params.workoutId ?? 'full_body';
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const styles = makeStyles(colors);

  async function handleSave() {
    setSaving(true);
    try {
      await submitGymLog({
        date: toLocalDateKey(),
        workoutId,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Logged', 'Gym session saved.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not log session');
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
          <Text style={styles.title}>Log gym session</Text>
          <Text style={styles.subtitle}>Workout: {workoutId}</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Weights used, how it felt..."
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
    multiline: { minHeight: 120, textAlignVertical: 'top' },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonText: { color: colors.primaryText, fontWeight: '700', fontSize: 16 },
  });
}
