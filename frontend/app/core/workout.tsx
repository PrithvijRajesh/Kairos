// Circuit session — step through reps/holds, then done.
import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  formatCoreStep,
  getCategoryById,
  pickWorkoutForCategory,
  type CoreCategoryId,
} from '../../coreCategories';
import {
  loadCoreProgress,
  recordCoreWorkoutCompletion,
  saveCoreProgress,
  toLocalDateKey,
} from '../../coreProgress';
import { useTheme } from '../../ThemeContext';
import { type as typeScale } from '../../theme';
import { PrimaryButton, Screen, SecondaryButton, Panel } from '../../ui';

export default function CoreWorkoutScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ categoryId?: string; workoutId?: string }>();
  const categoryId = (params.categoryId as CoreCategoryId) || 'fast_burner';
  const todayKey = toLocalDateKey();

  const workout = useMemo(() => {
    const picked = pickWorkoutForCategory(categoryId, todayKey);
    if (params.workoutId && picked.id !== params.workoutId) {
      const cat = getCategoryById(categoryId);
      return cat.workouts.find((w) => w.id === params.workoutId) ?? picked;
    }
    return picked;
  }, [categoryId, todayKey, params.workoutId]);

  const [round, setRound] = useState(1);
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = workout.steps[stepIndex];

  const finishWorkout = useCallback(async () => {
    const state = await loadCoreProgress();
    const next = recordCoreWorkoutCompletion(state);
    await saveCoreProgress(next);
    router.replace('/core/complete');
  }, []);

  function markStepDone() {
    if (!currentStep) return;
    if (stepIndex < workout.steps.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    if (round < workout.rounds) {
      setRound((r) => r + 1);
      setStepIndex(0);
      return;
    }
    void finishWorkout();
  }

  return (
    <Screen>
      <Text style={[typeScale.micro, { color: colors.textSoft }]}>
        Round {round}/{workout.rounds} · step {stepIndex + 1}/{workout.steps.length}
      </Text>
      <Text style={[typeScale.display, { color: colors.text }]}>{currentStep?.label}</Text>

      <Panel ink>
        <Text style={[typeScale.micro, { color: colors.accent }]}>
          {currentStep?.kind === 'hold' ? 'Hold' : 'Reps'}
        </Text>
        <Text style={[typeScale.mono, { color: colors.text, fontSize: 52 }]}>
          {currentStep ? formatCoreStep(currentStep) : '—'}
        </Text>
      </Panel>

      <PrimaryButton
        label={
          round === workout.rounds && stepIndex === workout.steps.length - 1
            ? 'Finish'
            : 'Done · next'
        }
        onPress={markStepDone}
      />
      <SecondaryButton label="Finish early" onPress={() => void finishWorkout()} />

      <Panel>
        <Text style={[typeScale.section, { color: colors.textSoft }]}>Circuit</Text>
        {workout.steps.map((s, i) => (
          <Text
            key={s.id}
            style={[
              typeScale.caption,
              {
                color: i === stepIndex ? colors.accent : colors.textMuted,
                fontWeight: i === stepIndex ? '700' : '500',
              },
            ]}
          >
            {i + 1}. {s.label} — {formatCoreStep(s)}
          </Text>
        ))}
      </Panel>
    </Screen>
  );
}
