// Redirect stub — goals live on index (home).
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../ThemeContext';

export default function OnboardingScreen() {
  const { colors } = useTheme();

  useEffect(() => {
    router.replace('/');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
