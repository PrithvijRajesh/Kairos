// Root layout: theme provider and navigation shell.
import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '../ThemeContext';

function RootStack() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Goals' }} />
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="core" options={{ headerShown: false }} />
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
