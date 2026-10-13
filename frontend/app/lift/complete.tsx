import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

import {
  buildFilledLogRows,
  sendRowsToGoogleSheet,
} from '../../googleSheetsLog';
import { loadGymProgress, syncUnsyncedSessions } from '../../gymProgress';
import { loadAppSettings } from '../../settingsStorage';
import { useTheme } from '../../ThemeContext';
import { radius, spacing } from '../../theme';

export default function LiftCompleteScreen() {
  const { colors } = useTheme();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [synced, setSynced] = useState(false);
  const [lastTitle, setLastTitle] = useState('Lift');
  const [hasSheets, setHasSheets] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([loadGymProgress(), loadAppSettings(), syncUnsyncedSessions()]).then(
      ([state, settings]) => {
        setCurrentStreak(state.streak.currentStreak);
        setHasSheets(!!settings.sheetsWebhookUrl.trim());
        const latest = state.sessions[0];
        if (latest) {
          setSynced(!!latest.synced);
          setLastTitle(latest.workoutTitle);
        }
      }
    );
  }, []);

  const styles = makeStyles(colors);

  async function onSendFilledToSheets() {
    setBusy(true);
    try {
      const state = await loadGymProgress();
      const latest = state.sessions[0];
      if (!latest) {
        Alert.alert('Nothing to send', 'No completed session found.');
        return;
      }
      const rows = buildFilledLogRows(latest);
      const result = await sendRowsToGoogleSheet(rows);
      if (result.ok === false) {
        Alert.alert('Could not send', result.error);
        return;
      }
      Alert.alert('Sent to Sheets', result.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.check}>Complete</Text>
      <Text style={styles.title}>{lastTitle} logged</Text>
      <Text style={styles.subtitle}>
        Saved on this phone. Weights will preload next time you hit these lifts.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Lift streak</Text>
        <Text style={styles.cardValue}>
          {currentStreak} day{currentStreak === 1 ? '' : 's'}
        </Text>
        <Text style={styles.cardMeta}>
          {synced
            ? 'Also synced to your home API'
            : 'Offline log — will sync when you’re home with the API running'}
        </Text>
      </View>

      {hasSheets ? (
        <Pressable
          style={[styles.secondaryBtn, busy && styles.disabled]}
          onPress={onSendFilledToSheets}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.secondaryBtnText}>Send filled sets to Google Sheets</Text>
          )}
        </Pressable>
      ) : null}

      <Pressable
        style={styles.secondaryBtn}
        onPress={() =>
          router.push({
            pathname: '/log-gym',
            params: { workoutId: lastTitle.toLowerCase().replace(/\s+/g, '_') },
          })
        }
      >
        <Text style={styles.secondaryBtnText}>Add notes to API log</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.replace('/dashboard')}>
        <Text style={styles.buttonText}>Back to Dashboard</Text>
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
    check: { fontSize: 13, fontWeight: '500', textAlign: 'center', color: colors.accent },
    title: {
      fontSize: 28,
      fontWeight: '600',
      letterSpacing: -0.6,
      textAlign: 'center',
      color: colors.text,
    },
    subtitle: {
      fontSize: 15,
      textAlign: 'center',
      color: colors.textMuted,
      lineHeight: 22,
    },
    card: {
      backgroundColor: colors.accentSoft,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.xs,
      marginVertical: spacing.sm,
    },
    cardLabel: { fontSize: 13, color: colors.accentMuted, fontWeight: '500' },
    cardValue: { fontSize: 32, fontWeight: '600', color: colors.text },
    cardMeta: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 15,
      alignItems: 'center',
    },
    buttonText: { color: colors.primaryText, fontWeight: '600', fontSize: 15 },
    secondaryBtn: {
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: colors.backgroundAlt,
    },
    secondaryBtnText: { color: colors.text, fontWeight: '600', fontSize: 14 },
    disabled: { opacity: 0.5 },
  });
}
