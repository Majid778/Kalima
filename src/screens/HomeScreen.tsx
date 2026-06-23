import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStackNavigator';
import { db } from '../data/database';
import {
  getQuranPercent,
  getTodaysVerse,
  MILESTONES,
} from '../services/progressService';
import { getPracticeStats, getDueCards } from '../services/practiceService';
import { getLocalToday } from '../services/sm2';
import { getWordsForLevel } from '../services/wordService';
import { useStreakStore } from '../stores/streakStore';
import { buildTodaySession, SessionSequence } from '../services/sessionService';
import { MilestoneMoment } from '../components/MilestoneMoment';
import { Button, Card, Skeleton } from '../components/ui';
import type { ThemeTokens } from '../theme/theme';
import { serifFamily } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type TodaysVerse = Awaited<ReturnType<typeof getTodaysVerse>>;

interface HomeStats {
  quranPercent: number;
  dueCount: number;
  todaysVerse: TodaysVerse;
  session: SessionSequence | null;
  practiceStats: Awaited<ReturnType<typeof getPracticeStats>>;
}

const SESSION_CONFIG = {
  dailyNewTarget: 10,
  maxSessionSize: 30,
};

export function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const currentStreak = useStreakStore((s) => s.currentStreak);
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [celebrating, setCelebrating] = useState<number | null>(null);

  const loadHome = useCallback(async () => {
    try {
      const today = getLocalToday();
      const [
        quranPercent,
        practiceStats,
        todaysVerse,
        dueCards,
        availableNew,
      ] = await Promise.all([
        getQuranPercent(db),
        getPracticeStats(db, today),
        getTodaysVerse(db, today),
        getDueCards(db, today, 200),
        getWordsForLevel(db, 1),
      ]);

      const session = buildTodaySession(dueCards, availableNew, {
        dailyNewTarget: SESSION_CONFIG.dailyNewTarget,
        maxSessionSize: SESSION_CONFIG.maxSessionSize,
      });

      setStats({
        quranPercent,
        dueCount: practiceStats.dueCount,
        todaysVerse,
        session,
        practiceStats,
      });

      const celebratedMilestones = useStreakStore.getState().celebratedMilestones;
      const crossed = MILESTONES.filter(
        (m) => quranPercent >= m && !celebratedMilestones.includes(m),
      );
      const highest = crossed[crossed.length - 1] ?? null;

      if (highest !== null) {
        setCelebrating(highest);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const dismissCelebration = useCallback(() => {
    if (celebrating !== null) {
      const { celebratedMilestones, markMilestoneCelebrated } = useStreakStore.getState();
      for (const milestone of MILESTONES) {
        if (milestone <= celebrating && !celebratedMilestones.includes(milestone)) {
          markMilestoneCelebrated(milestone);
        }
      }
    }
    setCelebrating(null);
  }, [celebrating]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadHome();
    }, [loadHome]),
  );

  if (isLoading || !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Hero card skeleton */}
          <Card style={styles.heroCard}>
            <Skeleton height={12} width={120} />
            <Skeleton height={48} width={120} style={styles.skeletonSpacing} />
            <Skeleton height={6} width="100%" />
          </Card>

          {/* Today's session skeleton */}
          <Card style={styles.sessionCard}>
            <Skeleton height={20} width={80} />
            <Skeleton height={40} width="100%" radius={8} style={styles.skeletonSpacingLarge} />
          </Card>

          {/* Verse skeleton */}
          <Card style={styles.verseCard}>
            <Skeleton height={16} width={100} />
            <Skeleton height={60} width="100%" style={styles.skeletonSpacing} />
            <Skeleton height={14} width="100%" />
          </Card>
        </ScrollView>
      </View>
    );
  }

  const progressWidth = `${Math.min(100, Math.max(0, stats.quranPercent * 100))}%` as `${number}%`;
  const displayPercent = Math.round(stats.quranPercent * 100);
  const hasSessionItems = stats.session && stats.session.items.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* COMPREHENSION HERO (from JourneyScreen) */}
        <Card elevated style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Qur'an understood</Text>
          <Text style={styles.heroPercent}>
            {displayPercent}
            <Text style={styles.heroPercentMark}>%</Text>
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </Card>

        {/* TODAY'S SESSION CARD (from TodayHomeScreen) */}
        <Card style={styles.sessionCard}>
          <Text style={styles.cardTitle}>Today</Text>
          {hasSessionItems ? (
            <>
              <Text style={styles.sessionItemCount}>
                {stats.session!.items.length} items
              </Text>
              <View style={styles.breakdownContainer}>
                {stats.session!.newCount > 0 && (
                  <BreakdownPill label="New" count={stats.session!.newCount} />
                )}
                {stats.session!.reviewCount > 0 && (
                  <BreakdownPill label="Review" count={stats.session!.reviewCount} />
                )}
                {stats.session!.checkCount > 0 && (
                  <BreakdownPill label="Check" count={stats.session!.checkCount} />
                )}
              </View>
              <Pressable
                style={styles.startButton}
                onPress={() => navigation.navigate('TodaySession')}
              >
                <Text style={styles.startButtonText}>Start Today Session</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>You're all caught up</Text>
              <Text style={styles.emptySubtitle}>
                Come back tomorrow for more.
              </Text>
            </View>
          )}
        </Card>

        {/* PRACTICE-DUE LINK (from JourneyScreen) */}
        {stats.dueCount > 0 && (
          <Pressable
            style={styles.practiceLinkContainer}
            onPress={() => navigation.navigate('PracticeSession')}
          >
            <Text style={styles.practiceLink}>Practice {stats.dueCount} due →</Text>
          </Pressable>
        )}

        {/* TODAY'S VERSE (from JourneyScreen) */}
        {stats.todaysVerse && (
          <Card elevated style={styles.verseCard}>
            <Text style={styles.cardTitle}>Today's Verse</Text>
            <Text style={styles.verseReference}>
              {stats.todaysVerse.verse.surahNumber}:{stats.todaysVerse.verse.ayahNumber}
            </Text>
            <Text style={styles.verseArabic}>
              {stats.todaysVerse.verse.arabicText}
            </Text>
            <Text style={styles.translation}>{stats.todaysVerse.verse.translation}</Text>
            <Text style={styles.knownWords}>
              You know {stats.todaysVerse.knownCount}/{stats.todaysVerse.totalCount} words
            </Text>
          </Card>
        )}

        {/* Minimal streak line */}
        <Text style={styles.streakText}>{currentStreak}-day rhythm</Text>
      </ScrollView>

      <MilestoneMoment
        visible={celebrating !== null}
        percent={celebrating ?? 0}
        onDismiss={dismissCelebration}
      />
    </View>
  );
}

function BreakdownPill({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label} {count}</Text>
    </View>
  );
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surfaces.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.surfaces.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },

  // HERO CARD STYLES
  heroCard: {
    alignItems: 'flex-start',
    backgroundColor: theme.surfaces.surfaceElevated,
    borderColor: theme.surfaces.border,
    borderWidth: 1,
    marginBottom: 16,
  },
  heroEyebrow: {
    color: theme.sacred.sacredMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  heroPercent: {
    color: theme.sacred.sacred,
    fontFamily: serifFamily,
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroPercentMark: {
    fontSize: 32,
  },
  progressTrack: {
    backgroundColor: theme.surfaces.border,
    borderRadius: 2,
    height: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    backgroundColor: theme.sacred.sacred,
    height: '100%',
  },

  // SESSION CARD STYLES
  sessionCard: {
    backgroundColor: theme.surfaces.surfaceElevated,
    borderColor: theme.surfaces.border,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    color: theme.text.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  sessionItemCount: {
    color: theme.sacred.sacred,
    fontFamily: serifFamily,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  breakdownContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    backgroundColor: theme.surfaces.background,
    borderColor: theme.sacred.sacred,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    color: theme.sacred.sacred,
    fontSize: 12,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: theme.sacred.sacred,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  startButtonText: {
    color: theme.surfaces.background,
    fontFamily: serifFamily,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyTitle: {
    color: theme.text.textPrimary,
    fontFamily: serifFamily,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: theme.text.textMuted,
    fontSize: 14,
  },

  // PRACTICE LINK
  practiceLinkContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  practiceLink: {
    color: theme.sacred.sacred,
    fontSize: 14,
    fontWeight: '600',
  },

  // VERSE CARD STYLES
  verseCard: {
    backgroundColor: theme.surfaces.surfaceElevated,
    borderColor: theme.surfaces.border,
    borderWidth: 1,
    marginBottom: 16,
  },
  verseReference: {
    color: theme.text.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  verseArabic: {
    color: theme.text.textPrimary,
    fontFamily: serifFamily,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 32,
    marginBottom: 12,
    textAlign: 'right',
  },
  translation: {
    color: theme.text.textPrimary,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 12,
  },
  knownWords: {
    color: theme.text.textMuted,
    fontSize: 12,
  },

  // MISC
  streakText: {
    color: theme.text.textMuted,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  skeletonSpacing: {
    marginBottom: 12,
  },
  skeletonSpacingLarge: {
    marginBottom: 16,
  },
});
