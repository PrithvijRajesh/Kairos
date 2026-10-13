// Root layout: theme provider and navigation shell.
import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '../ThemeContext';
import { HeaderBackButton } from '../HeaderBackButton';

function RootStack() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 16,
        },
        contentStyle: { backgroundColor: colors.background },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ title: 'Kairos', headerShown: false }} />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerLeft: () => <HeaderBackButton label="Home" fallbackHref="/dashboard" />,
        }}
      />
      <Stack.Screen name="core" options={{ headerShown: false }} />
      <Stack.Screen name="stretch" options={{ headerShown: false }} />
      <Stack.Screen name="lift" options={{ headerShown: false }} />
      <Stack.Screen
        name="run"
        options={{
          title: 'Cardio',
          headerLeft: () => <HeaderBackButton label="Home" fallbackHref="/dashboard" />,
        }}
      />
      <Stack.Screen
        name="log-run"
        options={{
          title: 'Log',
          headerLeft: () => <HeaderBackButton label="Back" fallbackHref="/run" />,
        }}
      />
      <Stack.Screen
        name="log-gym"
        options={{
          title: 'Log gym',
          headerLeft: () => <HeaderBackButton label="Back" fallbackHref="/lift" />,
        }}
      />
      <Stack.Screen name="week" options={{ headerShown: false }} />
      <Stack.Screen name="check-in" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}
