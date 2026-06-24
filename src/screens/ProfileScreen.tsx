import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboardingStore, type ArabicLevel } from '../stores/onboardingStore';
import { useStreakStore } from '../stores/streakStore';
import { AppIcon } from '../components/AppIcon';
import { StatCard } from '../components/StatCard';
import { display, fonts } from '../theme/typography';
import { mushafPalette } from '../theme/palette';
import type { RootStackParamList } from '../navigation/RootStackNavigator';
import { db } from '../data/database';
import {
  getLevelProgressList,
  getLevelsCompletedCount,
  getQuranPercent,
  getWordsLearnedCount,
  getWordsMasteredCount,
  type LevelProgressView,
} from '../services/progressService';
import { computeKindStreak } from '../services/motivation/kindStreak';

const USER_NAME = 'Majid';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// Representative words for the Memory strength vault rows (mirrors the design
// mockup). The tile counts are driven by real progress data; these illustrative
// rows give the vault its texture, identical to the locked mockup.
type StrengthBars = 1 | 2 | 3;

interface VaultWord {
  arabic: string;
  gloss: string;
  bars: StrengthBars;
}

const SOLID_WORDS: VaultWord[] = [
  { arabic: 'رَبّ', gloss: 'Lord, Sustainer', bars: 3 },
  { arabic: 'كِتَاب', gloss: 'Book, Scripture', bars: 3 },
];

const FRAGILE_WORDS: VaultWord[] = [
  { arabic: 'صَبْر', gloss: 'Patience', bars: 1 },
  { arabic: 'عِلْم', gloss: 'Knowledge', bars: 1 },
];

export function ProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const arabicLevel = useOnboardingStore((s) => s.arabicLevel);
  const activityDates = useStreakStore((s) => s.activityDates);
  const graceTokens = useStreakStore((s) => s.graceTokens);
  const [wordsMastered, setWordsMastered] = useState(0);
  const [wordsLearned, setWordsLearned] = useState(0);
  const [quranPercent, setQuranPercent] = useState(0);
  const [, setLongestStreak] = useState(0);
  const [, setLevelsCompletedCount] = useState(0);
  const [, setArabicLevelLabel] = useState<string | null>(null);
  const [, setCompletedLevels] = useState<LevelProgressView[]>([]);

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

  const today = getLocalTodayString();
  const kindStreak = useMemo(
    () => computeKindStreak(activityDates, today, graceTokens),
    [activityDates, graceTokens, today],
  );

  const userInitial = USER_NAME.charAt(0).toUpperCase();
  const hoursRead = '2.4';
  const solidCount = wordsMastered;
  const fragileCount = Math.max(0, wordsLearned - wordsMastered);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#fbf2d8', mushafPalette.parchment]}
        locations={[0, 0.3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topGradient}
        pointerEvents="none"
      />

      <View style={styles.headerBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Settings"
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Settings')}
          style={styles.gearButton}
        >
          <AppIcon name="gear" size={22} color={mushafPalette.ink2} strokeWidth={1.6} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <AvatarRing percent={Math.round(quranPercent * 100)} />
          <Text style={styles.userName}>{USER_NAME}</Text>
          <Text style={styles.quranPercentText}>
            {Math.round(quranPercent * 100)}% of the Qur'an, word by word
          </Text>
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
            label="hours"
            valueColor={mushafPalette.ink}
          />
        </View>

        <View style={styles.vaultHeading}>
          <Text style={styles.eyebrow}>Memory strength</Text>
          <Text style={styles.vaultCount}>{wordsLearned} words</Text>
          <View style={styles.vaultRule} />
        </View>

        <View style={styles.tileRow}>
          <View style={[styles.tile, styles.tileSolid]}>
            <Text style={styles.tileValueSolid}>{solidCount}</Text>
            <Text style={styles.tileLabelSolid}>solid, well rooted</Text>
          </View>
          <View style={[styles.tile, styles.tileFragile]}>
            <Text style={styles.tileValueFragile}>{fragileCount}</Text>
            <Text style={styles.tileLabelFragile}>fragile, review soon</Text>
          </View>
        </View>

        <View style={styles.vaultGroup}>
          <Text style={[styles.groupEyebrow, styles.groupEyebrowGold]}>SOLID, WELL ROOTED</Text>
          <View style={styles.card}>
            {SOLID_WORDS.map((word, idx) => (
              <WordRow
                key={word.arabic}
                word={word}
                tone="solid"
                showDivider={idx < SOLID_WORDS.length - 1}
              />
            ))}
          </View>
        </View>

        <View style={styles.vaultGroup}>
          <Text style={styles.groupEyebrow}>FRAGILE, DUE FOR REVIEW</Text>
          <View style={[styles.card, styles.cardFragile]}>
            {FRAGILE_WORDS.map((word, idx) => (
              <WordRow
                key={word.arabic}
                word={word}
                tone="fragile"
                showDivider={idx < FRAGILE_WORDS.length - 1}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function WordRow({
  word,
  tone,
  showDivider,
}: {
  word: VaultWord;
  tone: 'solid' | 'fragile';
  showDivider: boolean;
}) {
  const arabicColor = tone === 'solid' ? mushafPalette.ink : mushafPalette.ink2;
  const glossColor = tone === 'solid' ? mushafPalette.ink2 : mushafPalette.muted;

  return (
    <>
      <View style={styles.wordRow}>
        <Text style={[styles.wordArabic, { color: arabicColor }]}>{word.arabic}</Text>
        <Text style={[styles.wordGloss, { color: glossColor }]}>{word.gloss}</Text>
        <StrengthBarsGlyph filled={word.bars} />
      </View>
      {showDivider && <View style={styles.rowDivider} />}
    </>
  );
}

function StrengthBarsGlyph({ filled }: { filled: StrengthBars }) {
  return (
    <View style={styles.barsGlyph}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[styles.bar, i < filled ? styles.barFilled : styles.barEmpty]}
        />
      ))}
    </View>
  );
}

function AvatarRing({ percent }: { percent: number }) {
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, percent)) / 100) * circumference;

  return (
    <View style={avatarStyles.avatarRingContainer}>
      <Svg width={150} height={150} viewBox="0 0 150 150" style={avatarStyles.avatarSvg}>
        <SvgLinearGradient id="avatarGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#dcb04a" />
          <Stop offset="1" stopColor="#946c10" />
        </SvgLinearGradient>
        <Circle cx="75" cy="75" r={radius} fill="none" stroke={mushafPalette.goldRing} strokeWidth="9" />
        <Circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke="url(#avatarGrad)"
          strokeWidth="9"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 75 75)"
        />
      </Svg>
      <View style={avatarStyles.avatarInner}>
        <Text style={avatarStyles.avatarGlyph}>{'م'}</Text>
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

function getLocalTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const avatarStyles = StyleSheet.create({
  avatarRingContainer: {
    position: 'relative',
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSvg: {
    position: 'absolute',
  },
  avatarInner: {
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: '#fbf0d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlyph: {
    fontSize: 58,
    lineHeight: 70,
    color: mushafPalette.goldDeep,
    fontFamily: fonts.arabic,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mushafPalette.parchment,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  gearButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mushafPalette.paper,
    borderWidth: 1,
    borderColor: mushafPalette.goldLine,
  },
  content: {
    paddingBottom: 36,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 6,
    paddingHorizontal: 24,
  },
  userName: {
    fontSize: 26,
    color: mushafPalette.ink,
    marginTop: 16,
    fontFamily: display.extrabold,
  },
  quranPercentText: {
    fontSize: 13,
    color: mushafPalette.ink2,
    marginTop: 3,
    fontFamily: display.regular,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: 22,
    marginTop: 20,
  },
  vaultHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    marginTop: 22,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: mushafPalette.muted,
    fontFamily: display.semibold,
  },
  vaultCount: {
    fontSize: 11,
    color: mushafPalette.goldDeep,
    fontFamily: display.semibold,
  },
  vaultRule: {
    flex: 1,
    height: 1,
    backgroundColor: mushafPalette.goldLine,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 24,
    marginTop: 12,
  },
  tile: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tileSolid: {
    backgroundColor: '#fbf0d4',
    borderColor: mushafPalette.goldSoft,
  },
  tileFragile: {
    backgroundColor: mushafPalette.paper,
    borderColor: mushafPalette.goldLine,
  },
  tileValueSolid: {
    fontSize: 20,
    color: mushafPalette.goldDeep,
    fontFamily: display.extrabold,
  },
  tileValueFragile: {
    fontSize: 20,
    color: mushafPalette.ink2,
    fontFamily: display.extrabold,
  },
  tileLabelSolid: {
    fontSize: 11,
    color: mushafPalette.ink2,
    marginTop: 2,
    fontFamily: display.regular,
  },
  tileLabelFragile: {
    fontSize: 11,
    color: mushafPalette.muted,
    marginTop: 2,
    fontFamily: display.regular,
  },
  vaultGroup: {
    paddingHorizontal: 20,
    marginTop: 14,
  },
  groupEyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: mushafPalette.muted,
    marginHorizontal: 4,
    marginBottom: 7,
    fontFamily: display.semibold,
  },
  groupEyebrowGold: {
    color: mushafPalette.goldDeep,
  },
  card: {
    backgroundColor: mushafPalette.paper,
    borderWidth: 1,
    borderColor: mushafPalette.goldLine,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  cardFragile: {
    backgroundColor: mushafPalette.paper,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  wordArabic: {
    fontSize: 21,
    fontFamily: fonts.arabic,
  },
  wordGloss: {
    flex: 1,
    fontSize: 12,
    marginLeft: 12,
    fontFamily: display.regular,
  },
  rowDivider: {
    height: 1,
    backgroundColor: mushafPalette.goldLine,
    opacity: 0.7,
  },
  barsGlyph: {
    flexDirection: 'row',
    gap: 2,
  },
  bar: {
    width: 5,
    height: 14,
    borderRadius: 2,
  },
  barFilled: {
    backgroundColor: mushafPalette.goldDeep,
  },
  barEmpty: {
    backgroundColor: mushafPalette.goldRing,
  },
});
