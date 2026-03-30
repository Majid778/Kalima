import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import { db } from '../../data/database';
import { getPracticeStats, getNextReviewDate } from '../../services/practiceService';
import { getLocalToday } from '../../services/sm2';
import { colors } from '../../theme/colors';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface PracticeStats {
  dueCount: number;
  newCount: number;
  learningCount: number;
  reviewCount: number;
}

function formatNextDate(dateStr: string): string {
  const today = getLocalToday();
  if (dateStr === today) return 'Today';

  const todayDate = new Date(today + 'T00:00:00');
  const dueDate = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 0) return 'Today'; // overdue

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[dueDate.getMonth()]} ${dueDate.getDate()}`;
}

export function PracticeHomeScreen() {
  const navigation = useNavigation<NavProp>();
  const [stats, setStats] = useState<PracticeStats | null>(null);
  const [nextDate, setNextDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const today = getLocalToday();
      const [practiceStats, nextReviewDate] = await Promise.all([
        getPracticeStats(db, today),
        getNextReviewDate(db),
      ]);
      setStats(practiceStats);
      setNextDate(nextReviewDate);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload stats every time screen is focused (e.g., after completing a session)
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadStats();
    }, [loadStats]),
  );

  if (isLoading || !stats) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const hasDueCards = stats.dueCount > 0;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Due count hero */}
        <Text style={styles.dueCount}>{stats.dueCount}</Text>
        <Text style={styles.dueLabel}>cards due for review</Text>

        {/* Stat pills */}
        <View style={styles.statsRow}>
          <StatPill label="New" count={stats.newCount} color={colors.primary} />
          <StatPill label="Learning" count={stats.learningCount} color={colors.warning} />
          <StatPill label="Review" count={stats.reviewCount} color="#3b82f6" />
        </View>

        {/* Start button or empty state */}
        {hasDueCards ? (
          <Pressable
            style={styles.startButton}
            onPress={() => navigation.navigate('PracticeSession')}
          >
            <Text style={styles.startButtonText}>Start Practice</Text>
          </Pressable>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.allCaughtUp}>All caught up!</Text>
            {nextDate && (
              <Text style={styles.nextReview}>
                Next review: {formatNextDate(nextDate)}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function StatPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.pillText}>
        {label}: {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  dueCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  dueLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 40,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  startButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 8,
  },
  allCaughtUp: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  nextReview: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 8,
  },
});
