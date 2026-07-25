// Home screen: today's run + gym summary.
import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadGoals, saveGoals } from '../storage';
import { useTheme } from '../ThemeContext';
import { radius, spacing } from '../theme';

export default function HomeScreen() {
    const { colors } = useTheme();
    const [runningGoal, setRunningGoal] = useState('');
    const [gymGoal, setGymGoal] = useState('');
    const [ runningImportant, setRunningImportant] = useState(100);
    const gymImportant = 100 - runningImportant;

    const [saving, setSaving] = useState(false);

    useEffect(() => {
      async function initFromStorage() {
        const saved = await loadGoals();
        if (!saved) {
          return;
        }

        // Returning user: skip straight to dashboard.
        if (!router.canGoBack()) {
          router.replace('/dashboard');
          return;
        }

        // Edit flow: pre-fill the form with saved values.
        setRunningGoal(saved.runningGoal);
        setGymGoal(saved.gymGoal);
        setRunningImportant(saved.runningImportant);
      }

      initFromStorage();
    }, []);

    async function onSavePress() {
      if (saving) return;
      setSaving(true);
      try {
        const { synced } = await saveGoals({
          runningGoal,
          gymGoal,
          runningImportant,
          gymImportant,
        });
        router.replace('/dashboard');
        if (!synced) {
          Alert.alert(
            'Saved on this device',
            'Goals saved locally. Start the backend (cd backend && npm run dev) to sync plans and logs.'
          );
        }
      } catch {
        Alert.alert('Could not save', 'Something went wrong saving your goals.');
      } finally {
        setSaving(false);
      }
    }

    const styles = makeStyles(colors);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Set Your Goals</Text>
                <Text style={styles.subtitle}>Tell Kairos what you are training for.</Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Running Goal</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Example: Run 4:20 mile"
                        placeholderTextColor={colors.textMuted}
                        value={runningGoal}
                        onChangeText={setRunningGoal}
                        multiline
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Gym Goal</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Example: Sleeper build"
                        placeholderTextColor={colors.textMuted}
                        value={gymGoal}
                        onChangeText={setGymGoal}
                        multiline
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Importance Split</Text>
                    <View style={styles.splitBadge}>
                        <Text style={styles.splitText}>
                            Running {runningImportant}% · Gym {gymImportant}%
                        </Text>
                    </View>
                    <Slider
                        minimumValue={0}
                        maximumValue={100}
                        step={5}
                        value={runningImportant}
                        onValueChange={setRunningImportant}
                        minimumTrackTintColor={colors.accent}
                        maximumTrackTintColor={colors.border}
                        thumbTintColor={colors.primary}
                    />
                </View>

                <Pressable
                  style={[styles.button, saving && styles.buttonDisabled]}
                  onPress={onSavePress}
                  disabled={saving}
                >
                    <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Goals'}</Text>
                </Pressable>
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
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textMuted,
      marginBottom: spacing.sm,
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
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      padding: spacing.sm,
      minHeight: 84,
      textAlignVertical: 'top',
      color: '#111827',
      backgroundColor: '#ffffff',
    },
    splitBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accentSoft,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    splitText: {
      fontSize: 14,
      color: colors.accent,
      fontWeight: '600',
    },
    button: {
      marginTop: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}






