// Running screen: daily running workouts (placeholder until you build this).
import { Text, View, StyleSheet } from 'react-native';

export default function RunScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Running — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18 },
});
