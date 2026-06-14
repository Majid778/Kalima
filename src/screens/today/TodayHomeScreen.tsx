// src/screens/today/TodayHomeScreen.tsx
// Today session home: shows session composition (new/review/check) and start button

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import { db } from '../../data/database';
import { getDueCards } from '../../services/practiceService';
import { getWordsForLevel } from '../../services/wordService';
import { getLocalToday } from '../../services/sm2';
import { buildTodaySession, SessionSequence } from '../../services/sessionService';
import type { ThemeTokens } from '../../theme/theme';
import { useTheme } from '../../theme/useTheme';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface TodayHomeScreenProps {}

// Session config
const SESSION_CONFIG = {
  dailyNewTarget: 10,
  maxSessionSize: 30,
  includeChecks: true, // Can be toggled to exclude quick-check items
};

export function TodayHomeScreen() {
  const navigation = useNavigation<NavProp>();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [session, setSession] = useState<SessionSequence | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const today = getLocalToday();
      const [dueCards, availableNew] = await Promise.all([
        getDueCards(db, today, 200),
        getWordsForLevel(db, 1), // Level 1 for new words
      ]);

      const seq = buildTodaySession(dueCards, availableNew, {
        dailyNewTarget: SESSION_CONFIG.dailyNewTarget,
        maxSessionSize: SESSION_CONFIG.maxSessionSize,
      });

      // Optionally filter out checks
      if (!SESSION_CONFIG.includeChecks) {
        seq.items = seq.items.filter(item => item.type !== 'check');
        seq.checkCount = 0;
        seq.totalCount = seq.items.length;
      }

      setSession(seq);
    } catch (err) {
      console.error('Failed to load today session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload on screen focus
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadSession();
    }, [loadSession]),
  );

  if (isLoading || !session) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.action.action} />
      </View>
    );
  }

  const hasItems = session.totalCount > 0;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Hero count */}
        <Text style={styles.heroCount}>{session.totalCount}</Text>
        <Text style={styles.heroLabel}>items for today</Text>

        {/* Breakdown pills */}
        {hasItems && (
          <View style={styles.breakdownContainer}>
            {session.newCount > 0 && (
              <BreakdownPill
                label="New"
                count={session.newCount}
                color={theme.action.action}
              />
            )}
            {session.reviewCount > 0 && (
              <BreakdownPill
                label="Review"
                count={session.reviewCount}
                color={theme.learningState.due}
              />
            )}
            {session.checkCount > 0 && (
              <BreakdownPill
                label="Check"
                count={session.checkCount}
                color={theme.feedback.warning}
              />
            )}
          </View>
        )}

        {/* Start button or empty state */}
        {hasItems ? (
          <Pressable
            style={styles.startButton}
            onPress={() => navigation.navigate('TodaySession')}
          >
            <Text style={styles.startButtonText}>Start Today Session</Text>
          </Pressable>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>
              Come back tomorrow for more words.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function BreakdownPill({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.pillText}>
        {label}: {count}
      </Text>
    </View>
  );
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surfaces.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  content: {
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroCount: {
    fontSize: 56,
    fontWeight: '800',
    color: theme.action.action,
    marginBottom: 4,
  },
  heroLabel: {
    fontSize: 16,
    color: theme.text.textSecondary,
    marginBottom: 32,
  },
  breakdownContainer: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaces.surface,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  pillText: {
    color: theme.text.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  startButton: {
    width: '100%',
    backgroundColor: theme.action.action,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: theme.text.onAction,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 24,
  },
  emptyTitle: {
    color: theme.text.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: theme.text.textSecondary,
    fontSize: 14,
  },
});
