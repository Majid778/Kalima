import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStackNavigator';
import { db } from '../data/database';
import {
  getQuranPercent, getGlobalWordCounts,
  getTodaysVerse,
  MILESTONES,
} from '../services/progressService';
import { getPracticeStats, getDueCards } from '../services/practiceService';
import { getLocalToday } from '../services/sm2';
import { getWordsForLevel } from '../services/wordService';
import { useStreakStore } from '../stores/streakStore';
import { buildTodaySession, SessionSequence } from '../services/sessionService';
import { MilestoneMoment } from '../components/MilestoneMoment';
import { Skeleton } from '../components/ui';
import { ProgressRing } from '../components/ProgressRing';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { CountBox } from '../components/CountBox';
import { Chip } from '../components/Chip';
import { ArabicText } from '../components/ArabicText';
import { AppIcon } from '../components/AppIcon';
import { mushafPalette } from '../theme/palette';
import { display } from '../theme/typography';
import type { ThemeTokens } from '../theme/theme';
import { useTheme } from '../theme/useTheme';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type TodaysVerse = Awaited<ReturnType<typeof getTodaysVerse>>;

interface HomeStats {
  quranPercent: number;
  dueCount: number;
  todaysVerse: TodaysVerse;
  session: SessionSequence | null;
  practiceStats: Awaited<ReturnType<typeof getPracticeStats>>;
  knownWords: number;
  totalWords: number;
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
        wordCounts,
      ] = await Promise.all([
        getQuranPercent(db),
        getPracticeStats(db, today),
        getTodaysVerse(db, today),
        getDueCards(db, today, 200),
        getWordsForLevel(db, 1),
        getGlobalWordCounts(db),
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
        knownWords: wordCounts.knownWords,
        totalWords: wordCounts.totalWords,
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
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Greeting skeleton */}
          <Skeleton height={12} width={120} />
          <Skeleton height={26} width={80} style={{ marginTop: 6 }} />

          {/* Progress ring skeleton */}
          <Skeleton
            height={196}
            width={196}
            radius={98}
            style={{ marginTop: 14, alignSelf: 'center' }}
          />

          {/* Card skeleton */}
          <Skeleton
            height={180}
            width="100%"
            radius={14}
            style={{ marginTop: 18 }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const displayPercent = Math.round(stats.quranPercent * 100);
  const hasSessionItems = stats.session && stats.session.items.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* GREETING */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingColumn}>
            <Text style={styles.greeting}>Assalamu alaikum</Text>
            <Text style={styles.name}>Majid</Text>
          </View>
          <Chip
            icon="flame"
            label={`${currentStreak} days`}
          />
        </View>

        {/* PROGRESS RING */}
        <View style={styles.ringContainer}>
          <ProgressRing
            percent={displayPercent}
            size={196}
            stroke={13}
            centerLabel={`${displayPercent}%`}
          />
          <Text style={styles.ringCaption}>
            {stats.knownWords.toLocaleString()} of {stats.totalWords.toLocaleString()} words known
          </Text>
        </View>

        {/* TODAY'S SESSION CARD */}
        <View style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionTitle}>Today's session</Text>
            <View style={styles.sessionMeta}>
              <AppIcon name="clock" size={14} color={mushafPalette.muted} />
              <Text style={styles.sessionTime}>6 min</Text>
            </View>
          </View>

          {hasSessionItems ? (
            <>
              {/* COUNT BOXES */}
              <View style={styles.countBoxRow}>
                {stats.session!.newCount > 0 && (
                  <CountBox
                    label="New"
                    value={stats.session!.newCount}
                    color={mushafPalette.gold}
                  />
                )}
                {stats.session!.reviewCount > 0 && (
                  <CountBox
                    label="Review"
                    value={stats.session!.reviewCount}
                    color={mushafPalette.teal}
                  />
                )}
                {stats.session!.checkCount > 0 && (
                  <CountBox
                    label="Check"
                    value={stats.session!.checkCount}
                    color={mushafPalette.clay}
                  />
                )}
              </View>

              {/* CTA BUTTON */}
              <PrimaryCTA
                label="Start reading"
                arrow={true}
                onPress={() => navigation.navigate('TodaySession')}
              />
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>You're all caught up</Text>
              <Text style={styles.emptySubtitle}>Come back tomorrow for more.</Text>
            </View>
          )}
        </View>

        {/* TODAY'S VERSE */}
        {stats.todaysVerse && (
          <View style={styles.verseSection}>
            <Text style={styles.verseTitle}>Today's verse</Text>
            <ArabicText style={styles.verseArabic}>
              {stats.todaysVerse.verse.arabicText}
            </ArabicText>
            <Text style={styles.verseTranslation}>
              {stats.todaysVerse.verse.translation}
            </Text>
          </View>
        )}
      </ScrollView>

      <MilestoneMoment
        visible={celebrating !== null}
        percent={celebrating ?? 0}
        onDismiss={dismissCelebration}
      />
    </SafeAreaView>
  );
}

const makeStyles = (theme: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: mushafPalette.parchment,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 6,
      paddingBottom: 32,
    },

    /* GREETING */
    greetingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 0,
    },
    greetingColumn: {
      flex: 1,
    },
    greeting: {
      fontSize: 13,
      color: mushafPalette.muted,
      fontFamily: display.semibold,
      marginBottom: 2,
    },
    name: {
      fontSize: 26,
      color: mushafPalette.ink,
      fontFamily: display.bold,
      fontWeight: '700',
    },

    /* PROGRESS RING */
    ringContainer: {
      alignItems: 'center',
      marginTop: 32,
      marginBottom: 18,
    },
    ringCaption: {
      fontSize: 13,
      color: mushafPalette.ink2,
      marginTop: 2,
      fontFamily: display.regular,
    },

    /* TODAY'S SESSION CARD */
    sessionCard: {
      backgroundColor: mushafPalette.paper,
      borderColor: mushafPalette.goldLine,
      borderWidth: 1,
      borderRadius: 22,
      padding: 18,
      marginBottom: 16,
    },
    sessionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 14,
    },
    sessionTitle: {
      fontSize: 21,
      color: mushafPalette.ink,
      fontFamily: display.bold,
      fontWeight: '700',
    },
    sessionMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    sessionTime: {
      fontSize: 13,
      color: mushafPalette.muted,
      fontFamily: display.semibold,
      fontWeight: '600',
    },

    /* COUNT BOX ROW */
    countBoxRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },

    /* EMPTY STATE */
    emptyState: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    emptyTitle: {
      fontSize: 18,
      color: mushafPalette.ink,
      fontFamily: display.bold,
      fontWeight: '700',
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: 14,
      color: mushafPalette.ink2,
      fontFamily: display.regular,
    },

    /* TODAY'S VERSE */
    verseSection: {
      marginBottom: 16,
    },
    verseTitle: {
      fontSize: 17,
      color: mushafPalette.ink,
      fontFamily: display.bold,
      fontWeight: '700',
      marginBottom: 6,
    },
    verseArabic: {
      fontSize: 23,
      lineHeight: 40,
      color: mushafPalette.ink,
      textAlign: 'right',
      marginBottom: 5,
    },
    verseTranslation: {
      fontSize: 13,
      color: mushafPalette.ink2,
      fontFamily: display.regular,
      lineHeight: 20,
    },
  });
