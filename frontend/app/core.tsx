// Core screen: displays today's core workout list (from coreWorkouts.ts).
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dailyCoreRoutine } from '../coreWorkouts';
import { colors, radius, spacing } from '../theme';

export default function CoreScreen(){
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Today's Core</Text>
                <Text style={styles.subtitle}>Foundation work for every training day.</Text>

                {dailyCoreRoutine.map((exercise) =>(
                    <View key={exercise.name} style={styles.card}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exercisePrescription}>
                            {exercise.sets} sets × {exercise.reps}
                        </Text>
                        {exercise.note ? <Text style={styles.note}>{exercise.note}</Text> : null}
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        padding: spacing.lg,
        gap: spacing.sm,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
    },
    subtitle: {
        fontSize: 15,
        color: colors.textMuted,
        marginBottom: spacing.sm,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        gap: spacing.xs,
    },
    exerciseName: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
    },
    exercisePrescription: {
        fontSize: 15,
        color: colors.text,
    },
    note: {
        fontSize: 13,
        color: colors.textMuted,
        fontStyle: 'italic',
    },
});
