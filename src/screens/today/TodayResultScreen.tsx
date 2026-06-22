// src/screens/today/TodayResultScreen.tsx
// Recap after session: words learned, streak, milestones

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import { db } from '../../data/database';
import { getWordsLearnedCount, getQuranPercent } from '../../services/progressService';
import { getLocalToday } from '../../services/sm2';
import { useStreakStore } from '../../stores/streakStore';
import type { ThemeTokens } from '../../theme/theme';
import { serifFamily } from '../../theme/typography';
import { useTheme } from '../../theme/useTheme';
import { recordEvent, recordActivityForToday } from '../../services/instrumentationRuntime';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface ResultStats {
  wordsLearned: number;
  quranPercent: number;
  currentStreak: number;
}

export function TodayResultScreen() {
  const navigation = useNavigation<NavProp>();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const recordActivity = useStreakStore(s => s.recordActivity);
  const { currentStreak: streak, activityDates } = useStreakStore();

  const [stats, setStats] = useState<ResultStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const today = getLocalToday();

        // Record activity in streak store
        recordActivity(today);

        // Record activity in instrumentation
        recordActivityForToday();

        // Load stats
        const [wordsLearned, quranPercent] = await Promise.all([
          getWordsLearnedCount(db),
          getQuranPercent(db),
        ]);

        setStats({
          wordsLearned,
          quranPercent,
          currentStreak: streak,
        });

        // Record session completion
        recordEvent('practice_session_completed', {
          wordsLearned,
          quranPercent: Math.round(quranPercent * 100),
        });
      } catch (err) {
        console.error('Failed to load result stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [recordActivity, streak]);

  if (isLoading || !stats) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.action.action} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Great work!</Text>

        {/* Stats cards */}
        <View style={styles.statsContainer}>
          <StatCard
            label="Words Learned"
            value={stats.wordsLearned.toString()}
            color={theme.action.action}
          />
          <StatCard
            label="Qur'an Mastered"
            value={`${Math.round(stats.quranPercent * 100)}%`}
            color={theme.learningState.due}
          />
          <StatCard
            label="Current Streak"
            value={stats.currentStreak.toString()}
            color={theme.feedback.warning}
          />
        </View>

        {/* CTA */}
        <Pressable
          style={styles.doneButton}
          onPress={() => navigation.navigate('Tabs')}
        >
          <Text style={styles.doneButtonText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.card, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
    </View>
  );
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surfaces.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: serifFamily,
    fontWeight: 'bold',
    color: theme.text.textPrimary,
    marginBottom: 40,
  },
  statsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 40,
  },
  card: {
    backgroundColor: theme.surfaces.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text.textSecondary,
    marginBottom: 6,
  },
  cardValue: {
    fontFamily: serifFamily,
    fontSize: 28,
    fontWeight: 'bold',
  },
  doneButton: {
    width: '100%',
    backgroundColor: theme.action.action,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: theme.text.onAction,
    fontFamily: serifFamily,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
