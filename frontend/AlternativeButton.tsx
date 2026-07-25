// Tap to switch to a same-pattern alternative when equipment is taken.
import { Alert, Pressable, Text, StyleSheet } from 'react-native';

import {
  applyExerciseAlternative,
  hasAlternatives,
  listSelectableVariants,
  type GymExercise,
} from './gymWorkouts';
import { useTheme } from './ThemeContext';
import { radius, spacing } from './theme';

type Props = {
  exercise: GymExercise;
  onChange: (next: GymExercise) => void;
};

export function AlternativeButton({ exercise, onChange }: Props) {
  const { colors } = useTheme();

  if (!hasAlternatives(exercise)) {
    return null;
  }

  const styles = makeStyles(colors);
  const swapped = !!exercise.primaryId;

  function openPicker() {
    const variants = listSelectableVariants(exercise);
    Alert.alert(
      'Alternative equipment',
      'Same movement pattern — pick what’s free.',
      [
        ...variants.map((v) => ({
          text: v.id === exercise.id ? `✓ ${v.name}` : v.name,
          onPress: () => {
            const primary = exercise.primarySnapshot ?? exercise;
            const next =
              v.id === primary.id
                ? applyExerciseAlternative(exercise, null)
                : applyExerciseAlternative(primary, v.id);
            onChange(next);
          },
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  }

  return (
    <Pressable style={styles.button} onPress={openPicker}>
      <Text style={styles.text}>{swapped ? 'Switch exercise' : 'Alternative'}</Text>
    </Pressable>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    button: {
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    text: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.accent,
    },
  });
}
