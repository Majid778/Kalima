import React, { useCallback, useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useSettingsStore } from '../stores/settingsStore';
import { useOnboardingStore, type ArabicLevel } from '../stores/onboardingStore';
import { buildActivityGrid, useStreakStore } from '../stores/streakStore';
import { SegmentedControl } from '../components/SegmentedControl';
import { ArabicFontSize } from '../theme/typography';
import { db } from '../data/database';
import {
  getLevelProgressList,
  getWordsMasteredCount,
  type LevelProgressView,
} from '../services/progressService';
import { getLocalToday } from '../services/sm2';

const FONT_SIZE_SEGMENTS: { label: string; value: ArabicFontSize }[] = [
  { label: 'S', value: 'small' },
  { label: 'M', value: 'medium' },
  { label: 'L', value: 'large' },
];

export function ProfileScreen() {
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const setArabicFontSize = useSettingsStore((s) => s.setArabicFontSize);
  const setShowTransliteration = useSettingsStore((s) => s.setShowTransliteration);
  const arabicLevel = useOnboardingStore((s) => s.arabicLevel);
  const activityDates = useStreakStore((s) => s.activityDates);
  const [wordsMastered, setWordsMastered] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [arabicLevelLabel, setArabicLevelLabel] = useState<string | null>(null);
  const [completedLevels, setCompletedLevels] = useState<LevelProgressView[]>([]);

  const loadProfile = useCallback(async () => {
    const [masteredCount, levelList] = await Promise.all([
      getWordsMasteredCount(db),
      getLevelProgressList(db),
    ]);

    setWordsMastered(masteredCount);
    setLongestStreak(useStreakStore.getState().longestStreak);
    setArabicLevelLabel(formatArabicLevel(arabicLevel));
    setCompletedLevels(levelList.filter(level => level.completed));
  }, [arabicLevel]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const activityGrid = buildActivityGrid(activityDates, getLocalToday());

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionHeader}>Your Progress</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Words mastered</Text>
          <Text style={styles.rowValue}>{wordsMastered}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Longest streak</Text>
          <Text style={styles.rowValue}>🔥 {longestStreak} days</Text>
        </View>

        {arabicLevelLabel !== null && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Arabic level</Text>
            <Text style={styles.rowValue}>{arabicLevelLabel}</Text>
          </View>
        )}

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
              value={showTransliteration}
              onValueChange={setShowTransliteration}
              trackColor={{ false: '#3e3e3e', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const activityColors: Record<0 | 1 | 2 | 3, string> = {
  0: colors.surfaceLight,
  1: '#14532d',
  2: colors.primaryDark,
  3: colors.primary,
};

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  sectionHeader: {
    color: colors.textSecondary,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 16,
  },
  rowValue: {
    color: colors.textSecondary,
    fontSize: 16,
    marginLeft: 16,
    textAlign: 'right',
  },
  emptyText: {
    color: colors.textSecondary,
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
    color: colors.textMuted,
    fontSize: 12,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
