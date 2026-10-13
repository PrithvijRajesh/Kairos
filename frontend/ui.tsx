// Shared UI — calm, spare, type-led.
import type { ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from './ThemeContext';
import { radius, spacing, type } from './theme';

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ['bottom'],
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}) {
  const { colors } = useTheme();
  const content = (
    <View style={[styles.inner, padded && styles.padded]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function BrandMark() {
  const { colors } = useTheme();
  return <Text style={[type.brand, { color: colors.text }]}>Kairos</Text>;
}

export function SectionLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[type.section, { color: colors.textSoft, marginTop: spacing.sm }]}>{children}</Text>
  );
}

export function PageTitle({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {eyebrow ? <Text style={[type.micro, { color: colors.accent }]}>{eyebrow}</Text> : null}
      <Text style={[type.display, { color: colors.text, fontWeight: '600' }]}>{title}</Text>
      {subtitle ? <Text style={[type.body, { color: colors.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function Panel({
  children,
  style,
  ink = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  ink?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: ink ? colors.accentSoft : colors.surfaceRaised,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** @deprecated alias */
export const Surface = Panel;

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        { backgroundColor: colors.primary, opacity: disabled ? 0.4 : 1 },
      ]}
    >
      <Text style={[styles.btnLabel, { color: colors.primaryText }]}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, { backgroundColor: colors.backgroundAlt, opacity: disabled ? 0.4 : 1 }]}
    >
      <Text style={[styles.btnLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function AccentButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.btn, { backgroundColor: colors.accent }]}>
      <Text style={[styles.btnLabel, { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ paddingVertical: 8 }}>
      <Text style={[type.bodyStrong, { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

export function ChoiceChip({
  label,
  active,
  onPress,
  detail,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  detail?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.accentSoft : colors.surfaceRaised,
        },
      ]}
    >
      <Text style={[type.bodyStrong, { color: active ? colors.accentMuted : colors.text }]}>
        {label}
      </Text>
      {detail ? (
        <Text
          style={[
            type.caption,
            { color: active ? colors.accentMuted : colors.textMuted, marginTop: 4, opacity: 0.9 },
          ]}
          numberOfLines={2}
        >
          {detail}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function TrainingTile({
  title,
  subtitle,
  onPress,
  featured,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  featured?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: featured ? colors.accentSoft : colors.surfaceRaised,
        },
      ]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.title, { color: colors.text }]}>{title}</Text>
        <Text style={[type.caption, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
      <Text style={[type.body, { color: featured ? colors.accent : colors.textSoft }]}>→</Text>
    </Pressable>
  );
}

export function StatBlock({ value, label }: { value: string | number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surfaceRaised }]}>
      <Text style={[type.mono, { color: colors.text, fontSize: 24 }]}>{value}</Text>
      <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>{label}</Text>
    </View>
  );
}

export function StepRow({
  index,
  label,
  amount,
  kind,
}: {
  index: number;
  label: string;
  amount: string;
  kind: 'reps' | 'hold';
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stepRow, { borderBottomColor: colors.border }]}>
      <Text style={[type.caption, { color: colors.textSoft, width: 22 }]}>{index}</Text>
      <Text style={[type.bodyStrong, { color: colors.text, flex: 1 }]}>{label}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[type.bodyStrong, { color: colors.text }]}>{amount}</Text>
        <Text style={[type.micro, { color: colors.textSoft }]}>
          {kind === 'hold' ? 'hold' : 'reps'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  inner: { flexGrow: 1 },
  padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  panel: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  btn: {
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: { fontSize: 15, fontWeight: '600' },
  chip: {
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
