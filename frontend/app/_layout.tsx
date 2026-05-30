// Root layout: wraps every screen (navigation, theme).
import { Stack } from 'expo-router';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}