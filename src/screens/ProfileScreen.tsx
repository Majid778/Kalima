import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Share, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSettingsStore } from '../stores/settingsStore';
import { useOnboardingStore, type ArabicLevel } from '../stores/onboardingStore';
import { buildActivityGrid, useStreakStore } from '../stores/streakStore';
import { BadgeShelf } from '../components/motivation/BadgeShelf';
import { SegmentedControl } from '../components/SegmentedControl';
import { Button, Card } from '../components/ui';
import { AppIcon } from '../components/AppIcon';
import { StatCard } from '../components/StatCard';
import { display } from '../theme/typography';
import { mushafPalette } from '../theme/palette';
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
import { buildProgressSnapshot, restoreProgressSnapshot } from '../services/sync/progressSync';
import { isValidSnapshot } from '../services/sync/progressSnapshot';

const FONT_SIZE_SEGMENTS: { label: string; value: ArabicFontSize }[] = [
  { label: 'S', value: 'small' },
  { label: 'M', value: 'medium' },
  { label: 'L', value: 'large' },
];

const RECITER_SEGMENTS = RECITERS.map((reciter) => ({
  label: reciter.name.split(' ')[0],
  value: reciter.id,
}));

const USER_NAME = 'Majid';

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
  const notificationsEnabled = useSettingsStore((s) => s.notifications.enabled);
  const setNotificationPrefs = useSettingsStore((s) => s.setNotificationPrefs);
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
  const [importText, setImportText] = useState('');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);

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

  const handleExport = useCallback(async () => {
    setSyncBusy(true);
    setSyncMessage(null);
    try {
      const snapshot = await buildProgressSnapshot(db, new Date().toISOString());
      await Share.share({ message: JSON.stringify(snapshot) });
      setSyncMessage('Backup ready to save or share.');
    } catch {
      setSyncMessage('Could not create a backup right now.');
    } finally {
      setSyncBusy(false);
    }
  }, []);

  const handleRestore = useCallback(async () => {
    setSyncBusy(true);
    setSyncMessage(null);
    try {
      const parsed: unknown = JSON.parse(importText);
      if (!isValidSnapshot(parsed)) {
        setSyncMessage('This backup does not look like a Kalima progress snapshot.');
        return;
      }

      await restoreProgressSnapshot(db, parsed);
      setSyncMessage('Progress restored. Your local reviews were kept when they were further along.');
      setImportText('');
      await loadProfile();
    } catch {
      setSyncMessage('Could not restore from that text. Check the backup and try again.');
    } finally {
      setSyncBusy(false);
    }
  }, [importText, loadProfile]);

  const userInitial = USER_NAME.charAt(0).toUpperCase();
  const hoursRead = '2.4';
  const currentWeekActivity = activityGrid.length > 0 ? activityGrid[activityGrid.length - 1] : [];
  const daysActive = currentWeekActivity.filter(cell => activityColors[cell.intensity] !== activityColors[0]).length;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#fbf2d8', mushafPalette.parchment]}
        locations={[0, 0.3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topGradient}
        pointerEvents="none"
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <AvatarRing percent={Math.round(quranPercent * 100)} initial={userInitial} />
          <Text style={styles.quranPercentText}>{Math.round(quranPercent * 100)}% of the Qur'an</Text>
          <Text style={styles.userName}>{USER_NAME}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon="star"
            value={wordsMastered.toString()}
            label="mastered"
            valueColor={mushafPalette.goldDeep}
          />
          <StatCard
            icon="flame"
            value={kindStreak.toString()}
            label="day rhythm"
            valueColor={mushafPalette.ink}
          />
          <StatCard
            icon="clock"
            value={hoursRead}
            label="hours read"
            valueColor={mushafPalette.ink}
          />
        </View>

        <View style={styles.weekCard}>
          <View style={styles.weekHeader}>
            <Text style={styles.weekLabel}>This week</Text>
            <Text style={styles.weekDays}>{daysActive} of 7 days</Text>
          </View>
          <View style={styles.weekBars}>
            {currentWeekActivity.map((cell, idx) => {
              const isFilled = cell.intensity > 0;
              return (
                <WeekBar key={idx} filled={isFilled} />
              );
            })}
          </View>
        </View>

        <View style={styles.settingsPreview}>
          <View style={styles.previewRowLast}>
            <Text style={styles.previewLabel}>Daily reminder</Text>
            <GoldToggle
              value={notificationsEnabled}
              onValueChange={(enabled) => setNotificationPrefs({ enabled })}
              accessibilityLabel="Daily reminder"
            />
          </View>
        </View>

        <Text style={[styles.sectionHeader, styles.sectionSpacing]}>Display</Text>

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

        <View style={styles.rowStacked}>
          <Text style={styles.rowLabel}>Arabic Font Size</Text>
          <SegmentedControl
            segments={FONT_SIZE_SEGMENTS}
            selectedValue={arabicFontSize}
            onValueChange={setArabicFontSize}
          />
        </View>

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

        <Text style={[styles.sectionHeader, styles.sectionSpacing]}>Audio</Text>

        <View style={styles.rowStacked}>
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
            <Text style={styles.rowHint}>Play the first example ayah after reveal.</Text>
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

        <Text style={[styles.sectionHeader, styles.sectionSpacing]}>Backup and restore</Text>
        <Button
          label="Export backup"
          onPress={handleExport}
          disabled={syncBusy}
          variant="secondary"
        />
        <TextInput
          accessibilityLabel="Backup JSON"
          multiline
          onChangeText={setImportText}
          placeholder="Paste backup JSON"
          placeholderTextColor={theme.text.textMuted}
          style={styles.backupInput}
          value={importText}
        />
        <Button
          label="Restore"
          onPress={handleRestore}
          disabled={syncBusy || importText.trim().length === 0}
        />
        {syncMessage !== null && (
          <Text style={styles.backupMessage}>{syncMessage}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function GoldToggle({
  value,
  onValueChange,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: (val: boolean) => void;
  accessibilityLabel: string;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      style={[toggleStyles.track, value ? toggleStyles.trackOn : toggleStyles.trackOff]}
    >
      <View style={[toggleStyles.thumb, value ? toggleStyles.thumbOn : toggleStyles.thumbOff]} />
    </TouchableOpacity>
  );
}

function WeekBar({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <LinearGradient
        colors={['#dcb04a', '#b8860b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.weekBar}
      />
    );
  }
  return <View style={[styles.weekBar, styles.weekBarEmpty]} />;
}

function AvatarRing({ percent, initial }: { percent: number; initial: string }) {
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (Math.max(0, Math.min(100, percent)) / 100) * circumference;

  return (
    <View style={avatarStyles.avatarRingContainer}>
      <Svg width={96} height={96} viewBox="0 0 96 96" style={avatarStyles.avatarSvg}>
        <defs>
          <SvgLinearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#dcb04a" />
            <Stop offset="100%" stopColor="#946c10" />
          </SvgLinearGradient>
        </defs>
        <Circle cx="48" cy="48" r="44" fill="none" stroke={mushafPalette.goldRing} strokeWidth="8" />
        <Circle
          cx="48"
          cy="48"
          r="44"
          fill="none"
          stroke="url(#avatarGrad)"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          transform="rotate(-90 48 48)"
        />
      </Svg>
      <View style={avatarStyles.avatarInner}>
        <Text style={avatarStyles.avatarInitial}>{initial}</Text>
      </View>
    </View>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={settingsStyles.settingsRow}>
      <Text style={settingsStyles.settingsLabel}>{label}</Text>
      <Text style={settingsStyles.settingsValue}>{value}</Text>
    </View>
  );
}

function SettingsRowToggle({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (val: boolean) => void }) {
  return (
    <View style={settingsStyles.settingsRowToggle}>
      <Text style={settingsStyles.settingsLabel}>{label}</Text>
      <View style={settingsStyles.toggleContainer}>
        <View style={[settingsStyles.toggleTrack, value && settingsStyles.toggleTrackActive]}>
          <View style={[settingsStyles.toggleThumb, value && settingsStyles.toggleThumbActive]} />
        </View>
      </View>
    </View>
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

const avatarStyles = StyleSheet.create({
  avatarRingContainer: {
    position: 'relative',
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSvg: {
    position: 'absolute',
  },
  avatarInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fdf6e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 34,
    color: mushafPalette.goldDeep,
    fontFamily: display.bold,
  },
});

const toggleStyles = StyleSheet.create({
  track: {
    width: 44,
    height: 26,
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  trackOn: {
    backgroundColor: mushafPalette.gold,
  },
  trackOff: {
    backgroundColor: mushafPalette.goldRing,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
  thumbOff: {
    alignSelf: 'flex-start',
  },
});

const settingsStyles = StyleSheet.create({
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: mushafPalette.goldLine,
  },
  settingsRowToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: mushafPalette.goldLine,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: mushafPalette.ink,
    fontFamily: display.medium,
  },
  settingsValue: {
    fontSize: 14,
    color: mushafPalette.muted,
    fontFamily: display.regular,
  },
  toggleContainer: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'transparent',
  },
  toggleTrack: {
    flex: 1,
    borderRadius: 13,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleTrackActive: {
    backgroundColor: mushafPalette.gold,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mushafPalette.parchment,
  },
  content: {
    paddingBottom: 36,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: 22,
    marginBottom: 13,
  },
  quranPercentText: {
    fontSize: 12,
    fontWeight: '700',
    color: mushafPalette.goldDeep,
    marginBottom: 2,
    fontFamily: display.bold,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: mushafPalette.ink,
    fontFamily: display.bold,
  },
  weekCard: {
    marginHorizontal: 22,
    marginBottom: 16,
    padding: 15,
    backgroundColor: mushafPalette.paper,
    borderColor: mushafPalette.goldLine,
    borderRadius: 22,
    borderWidth: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekLabel: {
    fontSize: 12,
    color: mushafPalette.muted,
    fontFamily: display.medium,
  },
  weekDays: {
    fontSize: 12,
    color: mushafPalette.muted,
    fontFamily: display.medium,
  },
  weekBars: {
    flexDirection: 'row',
    gap: 6,
  },
  weekBar: {
    flex: 1,
    height: 36,
    borderRadius: 9,
  },
  weekBarEmpty: {
    backgroundColor: mushafPalette.goldRing,
  },
  sectionHeader: {
    color: mushafPalette.muted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    paddingHorizontal: 22,
    fontFamily: display.semibold,
  },
  sectionSpacing: {
    marginTop: 28,
  },
  backupInput: {
    backgroundColor: mushafPalette.paper,
    borderColor: mushafPalette.goldLine,
    borderRadius: 8,
    borderWidth: 1,
    color: mushafPalette.ink,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    marginHorizontal: 22,
    marginTop: 12,
    minHeight: 120,
    padding: 12,
    textAlignVertical: 'top',
  },
  backupMessage: {
    color: mushafPalette.ink2,
    fontSize: 14,
    lineHeight: 20,
    marginHorizontal: 22,
    marginTop: 12,
    fontFamily: display.regular,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: mushafPalette.goldLine,
  },
  rowStacked: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: mushafPalette.goldLine,
    gap: 12,
  },
  rowTextBlock: {
    flex: 1,
    marginRight: 16,
  },
  rowLabel: {
    color: mushafPalette.ink,
    flex: 1,
    fontSize: 16,
    fontFamily: display.regular,
  },
  rowHint: {
    color: mushafPalette.muted,
    fontSize: 13,
    marginTop: 4,
    fontFamily: display.regular,
  },
  rowValue: {
    color: mushafPalette.ink2,
    flexShrink: 1,
    fontSize: 16,
    marginLeft: 16,
    textAlign: 'right',
    fontFamily: display.regular,
  },
  emptyText: {
    color: mushafPalette.ink2,
    fontSize: 15,
    fontFamily: display.regular,
    paddingHorizontal: 22,
  },
  activityScroll: {
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 22,
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
    marginHorizontal: 22,
  },
  legendText: {
    color: mushafPalette.muted,
    fontSize: 12,
    fontFamily: display.regular,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mushafPalette.parchment,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  content: {
    paddingTop: 6,
    paddingBottom: 36,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 6,
    paddingHorizontal: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: 22,
    marginTop: 16,
  },
  quranPercentText: {
    fontSize: 12,
    color: mushafPalette.goldDeep,
    marginTop: 6,
    fontFamily: display.bold,
  },
  userName: {
    fontSize: 24,
    color: mushafPalette.ink,
    marginTop: 1,
    fontFamily: display.bold,
  },
  weekCard: {
    marginHorizontal: 22,
    marginTop: 13,
    padding: 16,
    paddingBottom: 17,
    backgroundColor: mushafPalette.paper,
    borderColor: mushafPalette.goldLine,
    borderRadius: 22,
    borderWidth: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  settingsPreview: {
    marginHorizontal: 22,
    marginTop: 16,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: mushafPalette.goldLine,
  },
  previewRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  previewLabel: {
    fontSize: 15,
    color: mushafPalette.ink,
    fontFamily: display.medium,
  },
  previewValue: {
    fontSize: 14,
    color: mushafPalette.muted,
    fontFamily: display.regular,
  },
  weekLabel: {
    fontSize: 12,
    color: mushafPalette.muted,
    fontFamily: display.medium,
  },
  weekDays: {
    fontSize: 12,
    color: mushafPalette.muted,
    fontFamily: display.medium,
  },
  weekBars: {
    flexDirection: 'row',
    gap: 6,
  },
  weekBar: {
    flex: 1,
    height: 36,
    borderRadius: 9,
  },
  weekBarEmpty: {
    backgroundColor: mushafPalette.goldRing,
  },
  sectionHeader: {
    color: mushafPalette.muted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    paddingHorizontal: 22,
    fontFamily: display.semibold,
  },
  sectionSpacing: {
    marginTop: 28,
  },
  backupInput: {
    backgroundColor: mushafPalette.paper,
    borderColor: mushafPalette.goldLine,
    borderRadius: 8,
    borderWidth: 1,
    color: mushafPalette.ink,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    marginHorizontal: 22,
    marginTop: 12,
    minHeight: 120,
    padding: 12,
    textAlignVertical: 'top',
  },
  backupMessage: {
    color: mushafPalette.ink2,
    fontSize: 14,
    lineHeight: 20,
    marginHorizontal: 22,
    marginTop: 12,
    fontFamily: display.regular,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: mushafPalette.goldLine,
  },
  rowStacked: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: mushafPalette.goldLine,
    gap: 12,
  },
  rowTextBlock: {
    flex: 1,
    marginRight: 16,
  },
  rowLabel: {
    color: mushafPalette.ink,
    flex: 1,
    fontSize: 16,
    fontFamily: display.regular,
  },
  rowHint: {
    color: mushafPalette.muted,
    fontSize: 13,
    marginTop: 4,
    fontFamily: display.regular,
  },
  rowValue: {
    color: mushafPalette.ink2,
    flexShrink: 1,
    fontSize: 16,
    marginLeft: 16,
    textAlign: 'right',
    fontFamily: display.regular,
  },
  emptyText: {
    color: mushafPalette.ink2,
    fontSize: 15,
    fontFamily: display.regular,
    paddingHorizontal: 22,
  },
  activityScroll: {
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 22,
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
    marginHorizontal: 22,
  },
  legendText: {
    color: mushafPalette.muted,
    fontSize: 12,
    fontFamily: display.regular,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
