// Onboarding: running goal, gym goal, importance slider (use index.tsx for now).
import { Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Pressable } from 'react-native';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Goals live on the home screen.</Text>
      <Pressable onPress={() => router.replace('/')}>
        <Text style={styles.link}>Go to goals</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  text: { fontSize: 16 },
  link: { fontSize: 16, color: '#2563eb' },
});
