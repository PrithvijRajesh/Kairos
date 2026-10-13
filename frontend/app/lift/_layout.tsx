import { Pressable, Text } from 'react-native';
import { Stack, router } from 'expo-router';
import { useTheme } from '../../ThemeContext';
import { HeaderBackButton } from '../../HeaderBackButton';

export default function LiftLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        contentStyle: { backgroundColor: colors.background },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Lift',
          headerLeft: () => <HeaderBackButton label="Home" fallbackHref="/dashboard" />,
        }}
      />
      <Stack.Screen
        name="session"
        options={{
          title: 'Workout',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>Back</Text>
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
        name="worksheet"
        options={{
          title: 'Worksheet',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>Back</Text>
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
