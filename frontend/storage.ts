// Save and load data on the phone (goals, logs) using AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'kairos.goals';

export type savedGoals = {
    runningGoal: string;
    gymGoal: string;
    runningImportant: number;
    gymImportant: number;
};

export async function saveGoals(goals: savedGoals) {
    await AsyncStorage.setItem(KEY, JSON.stringify(goals));
}

export async function loadGoals(): Promise<savedGoals | null> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as savedGoals;
}