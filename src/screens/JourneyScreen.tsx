import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Modal,
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
import { colors } from '../theme/colors';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type TodaysVerse = Awaited<ReturnType<typeof getTodaysVerse>>;

interface JourneyStats {
  quranPercent: number;
  wordsLearned: number;
  levelsCompleted: number;
  dueCount: number;
  todaysVerse: TodaysVerse;
}

export function JourneyScreen() {
  const navigation = useNavigation<NavProp>();
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const percentValue = Math.round(stats.quranPercent * 1000) / 10;
  const percentLabel = `${percentValue.toFixed(1)}%`;
  const progressWidth = `${Math.min(100, Math.max(0, stats.quranPercent * 100))}%` as `${number}%`;
  const hasDueCards = stats.dueCount > 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Qur'an words understood</Text>
          <Text style={styles.percentHeadline}>{percentLabel}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBlock label="Words learned" value={stats.wordsLearned} />
          <StatBlock label="Levels done" value={stats.levelsCompleted} />
          <StatBlock label="🔥 streak" value={currentStreak} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Continue</Text>
          {hasDueCards ? (
            <Pressable
              style={styles.primaryButton}
              onPress={() => navigation.navigate('PracticeSession')}
            >
              <Text style={styles.primaryButtonText}>Practice {stats.dueCount} due</Text>
            </Pressable>
          ) : (
            <>
              <Text style={styles.caughtUpText}>All caught up</Text>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  (navigation as unknown as { navigate: (screen: string) => void }).navigate('Learn');
                }}
              >
                <Text style={styles.secondaryButtonText}>Learn</Text>
              </Pressable>
            </>
          )}
        </View>

        {stats.todaysVerse && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today's Verse</Text>
            <Text style={styles.verseReference}>
              {stats.todaysVerse.verse.surahNumber}:{stats.todaysVerse.verse.ayahNumber}
            </Text>
            <ArabicText size="large" style={styles.verseArabic}>
              {stats.todaysVerse.verse.arabicText}
            </ArabicText>
            <Text style={styles.translation}>{stats.todaysVerse.verse.translation}</Text>
            <Text style={styles.knownWords}>
              You know {stats.todaysVerse.knownCount}/{stats.todaysVerse.totalCount} words in this verse
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={celebrating !== null}
        transparent
        animationType="fade"
        onRequestClose={dismissCelebration}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🎉</Text>
            <Text style={styles.modalMessage}>
              You understand {celebrating === null ? 0 : Math.round(celebrating * 100)}% of the Qur'an's words!
            </Text>
            <Pressable style={styles.primaryButton} onPress={dismissCelebration}>
              <Text style={styles.primaryButtonText}>Keep going</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  heroLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  percentHeadline: {
    color: colors.primary,
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 16,
  },
  progressTrack: {
    height: 10,
    backgroundColor: colors.surfaceLight,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statBlock: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  caughtUpText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 12,
  },
  verseReference: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  verseArabic: {
    marginBottom: 12,
  },
  translation: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  knownWords: {
    color: colors.textMuted,
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 40,
    marginBottom: 8,
  },
  modalMessage: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
});
