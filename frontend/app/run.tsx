// Cardio hub — shows smart next-run advice and recent history.
import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { loadCardioLog } from '../cardioLog';
import {
  daysBetween,
  effortLabel,
  formatMiles,
  lastOutdoorRunWithDistance,
  modeLabel,
  recommendMileage,
  recommendMinutes,
  type CardioMode,
  type CardioSessionLog,
} from '../cardioCoach';
import { toLocalDateKey } from '../coreProgress';
import { useTheme } from '../ThemeContext';
import { radius, spacing } from '../theme';

const MODES: { id: CardioMode; label: string; icon: string }[] = [
  { id: 'run', label: 'Outdoor Run', icon: '🏃' },
  { id: 'treadmill', label: 'Treadmill', icon: '⚙️' },
  { id: 'bike', label: 'Bike', icon: '🚴' },
];

export default function RunScreen() {
  const { colors } = useTheme();
  const [logs, setLogs] = useState<CardioSessionLog[]>([]);
  const [selectedMode, setSelectedMode] = useState<CardioMode>('run');
  const todayKey = toLocalDateKey();

  useFocusEffect(
    useCallback(() => {
      loadCardioLog().then(setLogs);
    }, [])
  );

  const styles = makeStyles(colors);

  const mileRec = recommendMileage(logs, todayKey);
  const minuteRec = recommendMinutes(logs, todayKey, selectedMode === 'run' ? 'treadmill' : selectedMode);

  const lastRun = lastOutdoorRunWithDistance(logs);
  const recentSessions = logs.slice(0, 5);

  // Smart coaching card
  function coachCard() {
    const daysSince = lastRun ? daysBetween(lastRun.date, todayKey) : null;

    if (!lastRun) {
      return {
        headline: "Let's build your base 🏗️",
        body: "You haven't logged a run yet. Start with whatever feels comfortable — even 10–15 min is a win. Tag how it felt when you log and I'll learn from it.",
        color: colors.accentSoft,
      };
    }

    if (daysSince != null && daysSince >= 7) {
      return {
        headline: `${daysSince} days since your last run — welcome back`,
        body: `Easy re-entry. Aim for ${formatMiles(Math.max(1.5, (lastRun.distanceMi ?? 2) * 0.6))} at a very comfortable pace. Walk breaks are fine. Your body just needs to remember the motion.`,
        color: '#fef3c7',
      };
    }

    if (daysSince != null && daysSince >= 4) {
      return {
        headline: 'Good time for an easy comeback run',
        body: `It's been ${daysSince} days. A Chill ${formatMiles(mileRec.lightMi)} will keep the base ticking without digging a hole.`,
        color: colors.accentSoft,
      };
    }

    const tag = lastRun?.effort;
    if (tag === 'farther') {
      return {
        headline: 'Pushed hard last time — easy day today',
        body: `You ran ${formatMiles(lastRun.distanceMi ?? 0)} hard. Take a Chill run at ${formatMiles(mileRec.lightMi)} — recovery runs make you faster, not rest.`,
        color: '#dcfce7',
      };
    }

    return {
      headline: "You're consistent — keep it going",
      body: `Last run: ${formatMiles(lastRun.distanceMi ?? 0)} · ${daysSince === 0 ? 'today' : daysSince === 1 ? 'yesterday' : `${daysSince}d ago`}. Normal effort today (~${formatMiles(mileRec.normalMi)}) would keep your base growing.`,
      color: '#dcfce7',
    };
  }

  const coach = coachCard();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Cardio</Text>

        {/* Smart coaching card */}
        <View style={[styles.coachCard, { backgroundColor: coach.color }]}>
          <Text style={styles.coachHeadline}>{coach.headline}</Text>
          <Text style={styles.coachBody}>{coach.body}</Text>
        </View>

        {/* Mode picker */}
        <Text style={styles.sectionLabel}>Mode</Text>
        <View style={styles.modeRow}>
          {MODES.map((m) => (
            <Pressable
              key={m.id}
              style={[styles.modeChip, selectedMode === m.id && styles.modeChipActive]}
              onPress={() => setSelectedMode(m.id)}
            >
              <Text style={styles.modeIcon}>{m.icon}</Text>
              <Text style={[styles.modeLabel, selectedMode === m.id && styles.modeLabelActive]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Suggested distances / times */}
        <Text style={styles.sectionLabel}>Today's suggestions</Text>
        <View style={styles.suggestCard}>
          {selectedMode === 'run' ? (
            <>
              <SuggestRow label="Chill" value={formatMiles(mileRec.lightMi)} colors={colors} />
              <SuggestRow label="Normal" value={formatMiles(mileRec.normalMi)} colors={colors} />
              <SuggestRow label="Harder" value={formatMiles(mileRec.fartherMi)} colors={colors} />
              <Text style={styles.recReason}>{mileRec.reason}</Text>
            </>
          ) : (
            <>
              <SuggestRow label="Chill" value={`${minuteRec.lightMin} min`} colors={colors} />
              <SuggestRow label="Normal" value={`${minuteRec.normalMin} min`} colors={colors} />
              <SuggestRow label="Harder" value={`${minuteRec.fartherMin} min`} colors={colors} />
              {selectedMode === 'treadmill' && minuteRec.incline && (
                <Text style={styles.recReason}>
                  Incline: Chill ~{minuteRec.incline.light}% · Normal ~{minuteRec.incline.normal}% · Harder ~{minuteRec.incline.farther}%
                </Text>
              )}
              {selectedMode === 'bike' && minuteRec.resistance && (
                <Text style={styles.recReason}>
                  Resistance: Chill ~{minuteRec.resistance.light} · Normal ~{minuteRec.resistance.normal} · Harder ~{minuteRec.resistance.farther}
                </Text>
              )}
              <Text style={styles.recReason}>{minuteRec.reason}</Text>
            </>
          )}
        </View>

        {/* Log today / past run */}
        <View style={styles.logRow}>
          <Pressable
            style={[styles.logBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push({ pathname: '/log-run', params: { mode: selectedMode, date: todayKey } })}
          >
            <Text style={styles.logBtnText}>Log today's {modeLabel(selectedMode).toLowerCase()}</Text>
          </Pressable>
          <Pressable
            style={[styles.logBtn, styles.logBtnSecondary]}
            onPress={() => router.push({ pathname: '/log-run', params: { mode: selectedMode } })}
          >
            <Text style={[styles.logBtnText, { color: colors.text }]}>Log past session</Text>
          </Pressable>
        </View>

        {/* Recent history */}
        {recentSessions.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Recent sessions</Text>
            {recentSessions.map((s, i) => (
              <View key={i} style={styles.historyRow}>
                <Text style={styles.historyDate}>{s.date}</Text>
                <Text style={styles.historyMode}>{modeLabel(s.mode)}</Text>
                <Text style={styles.historyDetail}>
                  {s.distanceMi ? formatMiles(s.distanceMi) : s.durationMin ? `${s.durationMin} min` : '—'}
                  {s.effort ? `  ·  ${effortLabel(s.effort)}` : ''}
                </Text>
              </View>
            ))}
          </>
        )}

        {recentSessions.length === 0 && (
          <Text style={styles.emptyHint}>
            No sessions logged yet. Hit "Log today's run" after your first run!
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SuggestRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ fontSize: 15, color: colors.textMuted, fontWeight: '600' }}>{label}</Text>
      <Text style={{ fontSize: 15, color: colors.text, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
    title: { fontSize: 28, fontWeight: '700', color: colors.text },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
    coachCard: {
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.xs,
    },
    coachHeadline: { fontSize: 16, fontWeight: '700', color: '#1e3a2f' },
    coachBody: { fontSize: 14, color: '#374151', lineHeight: 20 },
    modeRow: { flexDirection: 'row', gap: spacing.sm },
    modeChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      gap: 4,
    },
    modeChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.accentSoft,
    },
    modeIcon: { fontSize: 22 },
    modeLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
    modeLabelActive: { color: colors.accent },
    suggestCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    recReason: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 17 },
    logRow: { gap: spacing.sm },
    logBtn: {
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    logBtnSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    logBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    historyDate: { fontSize: 13, color: colors.textMuted, width: 92 },
    historyMode: { fontSize: 13, color: colors.text, fontWeight: '600', width: 80 },
    historyDetail: { fontSize: 13, color: colors.text, flex: 1 },
    emptyHint: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  });
}
