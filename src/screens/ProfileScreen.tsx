import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useSettingsStore } from '../stores/settingsStore';
import { useOnboardingStore, type ArabicLevel } from '../stores/onboardingStore';
import { buildActivityGrid, useStreakStore } from '../stores/streakStore';
import { BadgeShelf } from '../components/motivation/BadgeShelf';
import { SegmentedControl } from '../components/SegmentedControl';
import { Card } from '../components/ui';
import { ArabicFontSize } from '../theme/typography';
import { ThemeTokens } from '../theme/theme';
import { useTheme } from '../theme/useTheme';
import { db } from '../data/database';
import {
  getLevelProgressList,
  getLevelsCompletedCount,
  getQuranPercent,
  getWordsLearnedCount,
  getWordsMasteredCount,
  type LevelProgressView,
} from '../services/progressService';
import { getLocalToday } from '../services/sm2';
import { evaluateBadges } from '../services/motivation/badges';
import { computeKindStreak } from '../services/motivation/kindStreak';
import { computeWeeklyReflection } from '../services/motivation/weeklyReflection';
import { RECITERS, getReciterById } from '../services/audio/audioSource';

const FONT_SIZE_SEGMENTS: { label: string; value: ArabicFontSize }[] = [
  { label: 'S', value: 'small' },
  { label: 'M', value: 'medium' },
  { label: 'L', value: 'large' },
];

const RECITER_SEGMENTS = RECITERS.map((reciter) => ({
  label: reciter.name.split(' ')[0],
  value: reciter.id,
}));

export function ProfileScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const activityColors = useMemo<Record<0 | 1 | 2 | 3, string>>(() => ({
    0: theme.surfaces.surfaceElevated,
    1: theme.learningState.mastery,
    2: theme.action.actionPressed,
    3: theme.action.action,
  }), [theme]);
  const themeName = useSettingsStore((s) => s.theme);
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const reciterId = useSettingsStore((s) => s.reciterId);
  const autoPlayAudio = useSettingsStore((s) => s.autoPlayAudio);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setArabicFontSize = useSettingsStore((s) => s.setArabicFontSize);
  const setShowTransliteration = useSettingsStore((s) => s.setShowTransliteration);
  const setReciterId = useSettingsStore((s) => s.setReciterId);
  const setAutoPlayAudio = useSettingsStore((s) => s.setAutoPlayAudio);
  const arabicLevel = useOnboardingStore((s) => s.arabicLevel);
  const activityDates = useStreakStore((s) => s.activityDates);
  const currentStreak = useStreakStore((s) => s.currentStreak);
  const graceTokens = useStreakStore((s) => s.graceTokens);
  const [wordsMastered, setWordsMastered] = useState(0);
  const [wordsLearned, setWordsLearned] = useState(0);
  const [quranPercent, setQuranPercent] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [levelsCompletedCount, setLevelsCompletedCount] = useState(0);
  const [arabicLevelLabel, setArabicLevelLabel] = useState<string | null>(null);
  const [completedLevels, setCompletedLevels] = useState<LevelProgressView[]>([]);

  const loadProfile = useCallback(async () => {
    const [masteredCount, levelList, learnedCount, percent, completedCount] = await Promise.all([
      getWordsMasteredCount(db),
      getLevelProgressList(db),
      getWordsLearnedCount(db),
      getQuranPercent(db),
      getLevelsCompletedCount(db),
    ]);

    setWordsMastered(masteredCount);
    setWordsLearned(learnedCount);
    setQuranPercent(percent);
    setLongestStreak(useStreakStore.getState().longestStreak);
    setLevelsCompletedCount(completedCount);
    setArabicLevelLabel(formatArabicLevel(arabicLevel));
    setCompletedLevels(levelList.filter(level => level.completed));
  }, [arabicLevel]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const today = getLocalToday();
  const activityGrid = buildActivityGrid(activityDates, today);
  const kindStreak = useMemo(
    () => computeKindStreak(activityDates, today, graceTokens),
    [activityDates, graceTokens, today],
  );
  const weeklyReflection = useMemo(
    () => computeWeeklyReflection(activityDates, today),
    [activityDates, today],
  );
  const selectedReciter = useMemo(() => getReciterById(reciterId), [reciterId]);
  const hasAnyActivity = useMemo(
    () => Object.values(activityDates).some(count => count > 0),
    [activityDates],
  );
  const earnedBadges = useMemo(() => evaluateBadges({
    wordsLearned,
    quranPercent,
    levelsCompleted: levelsCompletedCount,
    kindStreak,
    longestStreak,
  }), [kindStreak, levelsCompletedCount, longestStreak, quranPercent, wordsLearned]);
  const consistencyLine = hasAnyActivity && (kindStreak === 0 || kindStreak > currentStreak)
    ? 'Welcome back - pick up where you left off.'
    : 'A steady rhythm grows through small returns.';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionHeader}>Your Progress</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Words mastered</Text>
          <Text style={styles.rowValue}>{wordsMastered}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Current rhythm</Text>
          <Text style={styles.rowValue}>{kindStreak} days of consistency</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Longest rhythm</Text>
          <Text style={styles.rowValue}>{longestStreak} days</Text>
        </View>
        <Text style={styles.consistencyHint}>{consistencyLine}</Text>

        {arabicLevelLabel !== null && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Arabic level</Text>
            <Text style={styles.rowValue}>{arabicLevelLabel}</Text>
          </View>
        )}

        <Card style={styles.reflectionCard}>
          <Text style={styles.reflectionTitle}>
            This week: practiced {weeklyReflection.daysPracticedThisWeek} of 7 days
          </Text>
          <Text style={styles.reflectionText}>
            {weeklyReflection.daysPracticedThisWeek > 0
              ? 'Every day of review is a small mercy to be grateful for.'
              : consistencyLine}
          </Text>
        </Card>

        <Text style={[styles.sectionHeader, styles.sectionSpacing]}>Badges</Text>
        <BadgeShelf badges={earnedBadges} />

        <Text style={[styles.sectionHeader, styles.sectionSpacing]}>Level completion history</Text>
        {completedLevels.length === 0 ? (
          <Text style={styles.emptyText}>No levels completed yet.</Text>
        ) : (
          <View>
            {completedLevels.map(level => (
              <View key={level.id} style={styles.row}>
                <Text style={styles.rowLabel}>{level.name}</Text>
                <Text style={styles.rowValue}>{formatBestScore(level.bestQuizScore)}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.sectionHeader, styles.sectionSpacing]}>Activity</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activityScroll}
        >
          {activityGrid.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.activityWeek}>
              {week.map(cell => (
                <View
                  key={cell.date}
                  style={[
                    styles.activityCell,
                    { backgroundColor: activityColors[cell.intensity] },
                  ]}
                />
              ))}
            </View>
          ))}
        </ScrollView>
        <View style={styles.legend}>
          <Text style={styles.legendText}>Less</Text>
          {[0, 1, 2, 3].map(intensity => (
            <View
              key={intensity}
              style={[
                styles.legendCell,
                { backgroundColor: activityColors[intensity as 0 | 1 | 2 | 3] },
              ]}
            />
          ))}
          <Text style={styles.legendText}>More</Text>
        </View>

        <View style={styles.displaySection}>
          {/* Section header per D-06 */}
          <Text style={styles.sectionHeader}>Display</Text>

          <View style={styles.row}>
            <View style={styles.rowTextBlock}>
              <Text style={styles.rowLabel}>Theme</Text>
              <Text style={styles.rowHint}>{themeName === 'dark' ? 'Dark' : 'Mushaf'}</Text>
            </View>
            <Switch
              accessibilityLabel="Theme"
              value={themeName === 'dark'}
              onValueChange={(enabled) => setTheme(enabled ? 'dark' : 'mushaf')}
              trackColor={{
                false: theme.surfaces.surfaceElevated,
                true: theme.action.action,
              }}
              thumbColor={theme.surfaces.surface}
            />
          </View>

          {/* Arabic Font Size row per D-07, D-08 */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Arabic Font Size</Text>
            <SegmentedControl
              segments={FONT_SIZE_SEGMENTS}
              selectedValue={arabicFontSize}
              onValueChange={setArabicFontSize}
            />
          </View>

          {/* Transliteration toggle per D-07, D-13, D-14 */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Show Transliteration</Text>
            <Switch
              accessibilityLabel="Show Transliteration"
              value={showTransliteration}
              onValueChange={setShowTransliteration}
              trackColor={{
                false: theme.surfaces.surfaceElevated,
                true: theme.action.action,
              }}
              thumbColor={theme.surfaces.surface}
            />
          </View>
        </View>

        <View style={styles.audioSection}>
          <Text style={styles.sectionHeader}>Audio</Text>

          <View style={styles.row}>
            <View style={styles.rowTextBlock}>
              <Text style={styles.rowLabel}>Reciter</Text>
              <Text style={styles.rowHint}>{selectedReciter.name}</Text>
            </View>
            <SegmentedControl
              segments={RECITER_SEGMENTS}
              selectedValue={reciterId}
              onValueChange={setReciterId}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowTextBlock}>
              <Text style={styles.rowLabel}>Auto-play recitation</Text>
              <Text style={styles.rowHint}>Play the first example āyah after reveal.</Text>
            </View>
            <Switch
              accessibilityLabel="Auto-play recitation"
              value={autoPlayAudio}
              onValueChange={setAutoPlayAudio}
              trackColor={{
                false: theme.surfaces.surfaceElevated,
                true: theme.action.action,
              }}
              thumbColor={theme.surfaces.surface}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatArabicLevel(level: ArabicLevel | null): string | null {
  if (level === 'beginner') return 'Complete beginner';
  if (level === 'alphabet') return 'Knows alphabet';
  if (level === 'reader') return 'Can read';
  return null;
}

function formatBestScore(bestQuizScore: number | null): string {
  if (bestQuizScore === null) return 'Best --';
  return `Best ${Math.round(bestQuizScore * 100)}%`;
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surfaces.background,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  sectionHeader: {
    color: theme.text.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  sectionSpacing: {
    marginTop: 28,
  },
  displaySection: {
    marginTop: 28,
  },
  audioSection: {
    marginTop: 28,
  },
  reflectionCard: {
    marginTop: 24,
  },
  reflectionTitle: {
    color: theme.text.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  reflectionText: {
    color: theme.text.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.surfaces.border,
  },
  rowTextBlock: {
    flex: 1,
    marginRight: 16,
  },
  rowLabel: {
    color: theme.text.textPrimary,
    flex: 1,
    fontSize: 16,
  },
  rowHint: {
    color: theme.text.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  rowValue: {
    color: theme.text.textSecondary,
    flexShrink: 1,
    fontSize: 16,
    marginLeft: 16,
    textAlign: 'right',
  },
  consistencyHint: {
    color: theme.text.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  emptyText: {
    color: theme.text.textSecondary,
    fontSize: 15,
  },
  activityScroll: {
    gap: 4,
    paddingVertical: 2,
  },
  activityWeek: {
    gap: 4,
  },
  activityCell: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  legendText: {
    color: theme.text.textMuted,
    fontSize: 12,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
