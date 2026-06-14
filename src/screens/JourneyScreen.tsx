import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStackNavigator';
import { db } from '../data/database';
import {
  getLevelsCompletedCount,
  getQuranPercent,
  getTodaysVerse,
  getWordsLearnedCount,
  MILESTONES,
} from '../services/progressService';
import { getPracticeStats } from '../services/practiceService';
import { getLocalToday } from '../services/sm2';
import { useStreakStore } from '../stores/streakStore';
import { ArabicText } from '../components/ArabicText';
import { MilestoneMoment } from '../components/MilestoneMoment';
import { VerseTokens } from '../components/VerseTokens';
import { Button, Card, SacredNumber, Skeleton } from '../components/ui';
import type { ThemeTokens } from '../theme/theme';
import { useTheme } from '../theme/useTheme';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type TodaysVerse = Awaited<ReturnType<typeof getTodaysVerse>>;
const TOKENIZED_VERSE_MAX_LENGTH = 180;

interface JourneyStats {
  quranPercent: number;
  wordsLearned: number;
  levelsCompleted: number;
  dueCount: number;
  todaysVerse: TodaysVerse;
}

export function JourneyScreen() {
  const navigation = useNavigation<NavProp>();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const currentStreak = useStreakStore((s) => s.currentStreak);
  const [stats, setStats] = useState<JourneyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [celebrating, setCelebrating] = useState<number | null>(null);

  const loadJourney = useCallback(async () => {
    try {
      const today = getLocalToday();
      const [
        quranPercent,
        wordsLearned,
        levelsCompleted,
        practiceStats,
        todaysVerse,
      ] = await Promise.all([
        getQuranPercent(db),
        getWordsLearnedCount(db),
        getLevelsCompletedCount(db),
        getPracticeStats(db, today),
        getTodaysVerse(db, today),
      ]);

      setStats({
        quranPercent,
        wordsLearned,
        levelsCompleted,
        dueCount: practiceStats.dueCount,
        todaysVerse,
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
      loadJourney();
    }, [loadJourney]),
  );

  if (isLoading || !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.heroCard}>
            <Skeleton height={20} width={180} />
            <Skeleton height={60} width={128} style={styles.heroSkeleton} />
            <Skeleton height={10} width="100%" radius={5} />
          </Card>
          <View style={styles.statsRow}>
            <Card style={styles.statBlock}>
              <Skeleton height={30} width={48} />
              <Skeleton height={14} width={88} style={styles.skeletonSpacing} />
            </Card>
            <Card style={styles.statBlock}>
              <Skeleton height={30} width={48} />
              <Skeleton height={14} width={82} style={styles.skeletonSpacing} />
            </Card>
            <Card style={styles.statBlock}>
              <Skeleton height={30} width={48} />
              <Skeleton height={14} width={56} style={styles.skeletonSpacing} />
            </Card>
          </View>
          <Card style={styles.sectionCard}>
            <Skeleton height={24} width={96} />
            <Skeleton height={48} width="100%" radius={8} style={styles.skeletonSpacingLarge} />
          </Card>
        </ScrollView>
      </View>
    );
  }

  const progressWidth = `${Math.min(100, Math.max(0, stats.quranPercent * 100))}%` as `${number}%`;
  const hasDueCards = stats.dueCount > 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <Text style={styles.heroLabel}>Qur'an words understood</Text>
          <SacredNumber
            percent={stats.quranPercent}
            label="of the Qur'an's words"
            style={styles.heroNumber}
          />
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </Card>

        <View style={styles.statsRow}>
          <StatBlock styles={styles} label="Words learned" value={stats.wordsLearned} />
          <StatBlock styles={styles} label="Levels done" value={stats.levelsCompleted} />
          <StatBlock styles={styles} label="Streak" value={currentStreak} />
        </View>

        <Card style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Continue</Text>
          {hasDueCards ? (
            <Button
              label={`Practice ${stats.dueCount} due`}
              onPress={() => navigation.navigate('PracticeSession')}
            />
          ) : (
            <>
              <Text style={styles.caughtUpText}>All caught up</Text>
              <Button
                label="Learn"
                variant="secondary"
                onPress={() => {
                  (navigation as unknown as { navigate: (screen: string) => void }).navigate('Learn');
                }}
              />
            </>
          )}
        </Card>

        {stats.todaysVerse && (
          <Card style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Today's Verse</Text>
            <Text style={styles.verseReference}>
              {stats.todaysVerse.verse.surahNumber}:{stats.todaysVerse.verse.ayahNumber}
            </Text>
            {stats.todaysVerse.verse.arabicText.length <= TOKENIZED_VERSE_MAX_LENGTH ? (
              <VerseTokens
                verseText={stats.todaysVerse.verse.arabicText}
                targetPosition={null}
                size="large"
              />
            ) : (
              <ArabicText size="large" style={styles.verseArabic}>
                {stats.todaysVerse.verse.arabicText}
              </ArabicText>
            )}
            <Text style={styles.translation}>{stats.todaysVerse.verse.translation}</Text>
            <Text style={styles.knownWords}>
              You know {stats.todaysVerse.knownCount}/{stats.todaysVerse.totalCount} words in this verse
            </Text>
          </Card>
        )}
      </ScrollView>

      <MilestoneMoment
        visible={celebrating !== null}
        percent={celebrating ?? 0}
        onDismiss={dismissCelebration}
      />
    </View>
  );
}

function StatBlock({
  label,
  value,
  styles,
}: {
  label: string;
  value: number;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Card style={styles.statBlock}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
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
  heroCard: {
    marginBottom: 12,
  },
  heroLabel: {
    color: theme.text.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  heroNumber: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  progressTrack: {
    height: 10,
    backgroundColor: theme.surfaces.surfaceElevated,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.sacred.sacred,
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statBlock: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    color: theme.text.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: theme.text.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  sectionCard: {
    marginBottom: 12,
  },
  cardTitle: {
    color: theme.text.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  caughtUpText: {
    color: theme.text.textSecondary,
    fontSize: 16,
    marginBottom: 12,
  },
  verseReference: {
    color: theme.sacred.sacred,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  verseArabic: {
    marginBottom: 12,
  },
  translation: {
    color: theme.text.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  knownWords: {
    color: theme.text.textMuted,
    fontSize: 13,
  },
  heroSkeleton: {
    marginTop: 10,
    marginBottom: 16,
  },
  skeletonSpacing: {
    marginTop: 8,
  },
  skeletonSpacingLarge: {
    marginTop: 16,
  },
});