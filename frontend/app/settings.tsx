// Settings — lift calendar, Sheets, appearance.
import { useEffect, useState } from 'react';
import { View, Text, TextInput, Switch, StyleSheet, Alert } from 'react-native';

import { useTheme } from '../ThemeContext';
import { ensureLiftProgramStart, loadGymProgress, setLiftProgramStartDate } from '../gymProgress';
import { isValidDateKey, loadAppSettings, saveAppSettings } from '../settingsStorage';
import { formatProgramStartLabel } from '../coreWorkouts';
import { toLocalDateKey } from '../coreProgress';
import { spacing, radius, type as typeScale } from '../theme';
import {
  PageTitle,
  Panel,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionLabel,
} from '../ui';

export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode } = useTheme();

  const [liftStartInput, setLiftStartInput] = useState(toLocalDateKey());
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadGymProgress().then((s) => {
      if (s.programStartDate) setLiftStartInput(s.programStartDate);
    });
    loadAppSettings().then((s) => setSheetsUrl(s.sheetsWebhookUrl));
  }, []);

  async function handleSaveLiftStartDate() {
    const trimmed = liftStartInput.trim();
    if (!isValidDateKey(trimmed)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD.');
      return;
    }
    setIsSaving(true);
    await setLiftProgramStartDate(trimmed);
    setIsSaving(false);
    Alert.alert('Saved', `Lift Day 1 (Push) = ${formatProgramStartLabel(trimmed)}.`);
  }

  async function handleResetLiftToday() {
    setIsSaving(true);
    await ensureLiftProgramStart(true);
    setLiftStartInput(toLocalDateKey());
    setIsSaving(false);
    Alert.alert('Reset', 'Today is Push (Day 1).');
  }

  async function handleSaveSheetsUrl() {
    setIsSaving(true);
    const base = await loadAppSettings();
    await saveAppSettings({ ...base, sheetsWebhookUrl: sheetsUrl.trim() });
    setIsSaving(false);
    Alert.alert('Saved', sheetsUrl.trim() ? 'Sheets URL saved.' : 'Sheets URL cleared.');
  }

  return (
    <Screen>
      <PageTitle eyebrow="Settings" title="Setup" subtitle="Lift calendar, Sheets sync, look." />

      <SectionLabel>Lift start</SectionLabel>
      <Panel>
        <Text style={[typeScale.caption, { color: colors.textMuted }]}>
          Push → Pull → Legs → Rest → Upper → Lower → Rest
        </Text>
        <Text style={[typeScale.bodyStrong, { color: colors.accent }]}>
          {formatProgramStartLabel(liftStartInput)} · Day 1 = Push
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, backgroundColor: colors.background },
          ]}
          value={liftStartInput}
          onChangeText={setLiftStartInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textSoft}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <PrimaryButton label="Save start date" onPress={() => void handleSaveLiftStartDate()} />
        <SecondaryButton
          label="Reset so today is Push"
          onPress={() => void handleResetLiftToday()}
        />
      </Panel>

      <SectionLabel>Google Sheets</SectionLabel>
      <Panel>
        <Text style={[typeScale.caption, { color: colors.textMuted }]}>
          Paste the Apps Script web app URL to sync lift logs.
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, backgroundColor: colors.background },
          ]}
          value={sheetsUrl}
          onChangeText={setSheetsUrl}
          placeholder="https://script.google.com/macros/s/…/exec"
          placeholderTextColor={colors.textSoft}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <PrimaryButton
          label={isSaving ? 'Saving…' : 'Save Sheets URL'}
          onPress={() => void handleSaveSheetsUrl()}
          disabled={isSaving}
        />
      </Panel>

      <SectionLabel>Appearance</SectionLabel>
      <Panel>
        <View style={styles.row}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[typeScale.bodyStrong, { color: colors.text }]}>Dark mode</Text>
            <Text style={[typeScale.caption, { color: colors.textMuted }]}>Ink on paper, inverted</Text>
          </View>
          <Switch
            value={themeMode === 'dark'}
            onValueChange={(on) => setThemeMode(on ? 'dark' : 'light')}
          />
        </View>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 15,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
});
