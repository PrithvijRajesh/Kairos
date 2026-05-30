// Dashboard: shows saved goals + split at top, Edit button, and 4 category squares.
import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadGoals, savedGoals } from '../storage';
import { colors, radius, spacing } from '../theme';

export default function DashboardScreen() {
    const[goals, setGoals] = useState<savedGoals | null> (null);
    useEffect(() =>{
        loadGoals().then(setGoals);
    }, []);

    if(!goals) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingWrap}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Dashboard</Text>

                <View style={styles.goalsCard}>
                    <Text style={styles.cardTitle}>Your Goals</Text>
                    <Text style={styles.goalLine}>Running: {goals.runningGoal}</Text>
                    <Text style={styles.goalLine}>Gym: {goals.gymGoal}</Text>
                    <Text style={styles.splitLine}>
                        Split: {goals.runningImportant}% / {goals.gymImportant}%
                    </Text>
                    <Pressable style={styles.editButton} onPress={() => router.push('/')}>
                        <Text style={styles.editButtonText}>Edit Goals</Text>
                    </Pressable>
                </View>

                <Text style={styles.sectionTitle}>Today's Training</Text>
                <View style={styles.grid}>
                    <Pressable style={styles.tile} onPress={() => router.push('/run')}>
                        <Text style={styles.tileTitle}>Run</Text>
                    </Pressable>
                    <Pressable style={styles.tile} onPress={() => router.push('/lift')}>
                        <Text style={styles.tileTitle}>Lift</Text>
                    </Pressable>
                    <Pressable style={[styles.tile, styles.tileAccent]} onPress={() => router.push('/core')}>
                        <Text style={[styles.tileTitle, styles.tileTitleAccent]}>Core</Text>
                    </Pressable>
                    <Pressable style={styles.tile} onPress={() => router.push('/stretch')}>
                        <Text style={styles.tileTitle}>Stretch</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: colors.textMuted,
        fontSize: 16,
    },
    container: {
        padding: spacing.lg,
        gap: spacing.md,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
    },
    goalsCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        gap: spacing.sm,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    goalLine: {
        fontSize: 15,
        color: colors.text,
    },
    splitLine: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
    editButton: {
        marginTop: spacing.sm,
        alignSelf: 'flex-start',
        backgroundColor: colors.primary,
        borderRadius: radius.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    editButtonText: {
        color: colors.primaryText,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginTop: spacing.sm,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    tile: {
        width: '48%',
        minHeight: 96,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tileAccent: {
        backgroundColor: colors.accentSoft,
        borderColor: '#bfdbfe',
    },
    tileTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    tileTitleAccent: {
        color: colors.accent,
    },
});
