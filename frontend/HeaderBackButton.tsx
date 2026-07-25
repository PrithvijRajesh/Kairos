// Shared header back control for nested stacks (Lift / Core / Stretch).
import { Pressable, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { useTheme } from './ThemeContext';

type Props = {
  /** Where to go if there's no stack history (e.g. deep link). */
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
      <Text style={[styles.text, { color: colors.accent }]}>‹ {label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginRight: 4,
  },
  text: {
    fontSize: 17,
    fontWeight: '600',
  },
});
