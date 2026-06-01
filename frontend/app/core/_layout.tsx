// Core section layout: stack navigation between list, workout, and review.
import { Stack } from 'expo-router';
import { colors } from '../../theme';

export default function CoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Core' }} />
      <Stack.Screen name="workout" options={{ title: 'Workout' }} />
      <Stack.Screen name="review" options={{ title: 'Review' }} />
    </Stack>
  );
}
