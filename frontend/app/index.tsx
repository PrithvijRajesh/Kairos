// Home screen: today's run + gym summary.
import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import React from 'react';
import Slider from '@react-native-community/slider';

export default function HomeScreen() {
    const [runningGoal, setRunningGoal] = useState('');
    const [gymGoal, setGymGoal] = useState('');
    const [ runningImportant, setRunningImportant] = useState(100);
    const gymImportant = 100 - runningImportant;

    return (
        <View style = {styles.container}>
            <Text style = {styles.title}> Set Your Goals </Text>
            <Text style = {styles.label}>Running Goal</Text>
            <TextInput
                style = {styles.input}
                placeholder = "Example: Run 4:20 mile"
                value = {runningGoal}
                onChangeText={setRunningGoal}
            />

            <Text style = {styles.label}>Gym Goal</Text>
            <TextInput
                style = {styles.input}
                placeholder = "Example: Sleeper build"
                value = {gymGoal}
                onChangeText={setGymGoal}
            />
            <Text style = {styles.label}> Importance Split </Text>
            <Text style = {styles.splitText}>
                Running {runningImportant}%. Gym {gymImportant}%.
            </Text>
            <Slider
                minimumValue = {0}
                maximumValue = {100}
                step = {5}
                value = {runningImportant}
                onValueChange = {setRunningImportant}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#fff',
      gap: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
    },
    input: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 8,
      padding: 12,
    },
    splitText: {
      fontSize: 14,
      color: '#374151',
    },
  });



