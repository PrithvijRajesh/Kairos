// Shared header back control for nested stacks.
import { Pressable, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { useTheme } from './ThemeContext';

type Props = {
  fallbackHref?: string;
  label?: string;
};

export function HeaderBackButton({ fallbackHref = '/dashboard', label = 'Home' }: Props) {
  const { colors } = useTheme();

  function onPress() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallbackHref);
  }

  return (
    <Pressable onPress={onPress} hitSlop={12} style={styles.hit}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginRight: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
