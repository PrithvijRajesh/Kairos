// Core section layout: stack navigation between list, workout, and review.
import { Pressable, Text } from 'react-native';
import { Stack, router } from 'expo-router';
import { useTheme } from '../../ThemeContext';
import { HeaderBackButton } from '../../HeaderBackButton';

export default function CoreLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Core',
          headerLeft: () => <HeaderBackButton label="Home" fallbackHref="/dashboard" />,
        }}
      />
      <Stack.Screen
        name="workout"
        options={{
          title: 'Workout',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.accent }}>‹ Back</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="complete"
        options={{
          title: 'Complete',
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton label="Home" fallbackHref="/dashboard" />,
        }}
      />
      <Stack.Screen
        name="review"
        options={{
          title: 'Review',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.accent }}>‹ Back</Text>
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
