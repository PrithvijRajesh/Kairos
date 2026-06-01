// Log run placeholder.
import { Text, View, StyleSheet } from 'react-native';

export default function LogRunScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Log run — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18 },
});
