// Daily check-in: energy and soreness adjust today's plan.
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';

import { fetchCheckIn, submitCheckIn } from '../api';
import { toLocalDateKey } from '../coreProgress';
import { useTheme } from '../ThemeContext';
import { radius, spacing } from '../theme';

export default function CheckInScreen() {
  const { colors } = useTheme();
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(2);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const today = toLocalDateKey();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const existing = await fetchCheckIn(today);
        if (existing) {
          setEnergy(existing.energy);
          setSoreness(existing.soreness);
          setNotes(existing.notes ?? '');
        }
      } catch {
        // new check-in
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [today]);

  const styles = makeStyles(colors);

  async function handleSave() {
    setSaving(true);
    try {
      await submitCheckIn({ date: today, energy, soreness, notes: notes.trim() || undefined });
      Alert.alert('Saved', 'Check-in recorded. Your plan may adjust for low energy or soreness.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save check-in');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Daily check-in</Text>
        <Text style={styles.subtitle}>{today}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Energy (1 = drained, 5 = great)</Text>
          <Text style={styles.value}>{energy}</Text>
          <Slider
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={energy}
            onValueChange={setEnergy}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Soreness (1 = fresh, 5 = very sore)</Text>
          <Text style={styles.value}>{soreness}</Text>
          <Slider
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={soreness}
            onValueChange={setSoreness}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="Sleep, stress, niggles..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </View>

        <Pressable style={styles.button} onPress={handleSave} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save check-in'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
    value: { fontSize: 24, fontWeight: '700', color: colors.accent },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      padding: spacing.sm,
      minHeight: 80,
      textAlignVertical: 'top',
      color: colors.text,
      backgroundColor: colors.background,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonText: { color: colors.primaryText, fontWeight: '700', fontSize: 16 },
  });
}
