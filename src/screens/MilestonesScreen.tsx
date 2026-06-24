import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, Path, LinearGradient as SvgLinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { useStreakStore } from '../stores/streakStore';
import { AppIcon } from '../components/AppIcon';
import { display, fonts } from '../theme/typography';
import { mushafPalette } from '../theme/palette';
import type { RootStackParamList } from '../navigation/RootStackNavigator';
import { db } from '../data/database';
import {
  getQuranPercent,
  getWordsLearnedCount,
  getLevelsCompletedCount,
} from '../services/progressService';
import { evaluateBadges } from '../services/motivation/badges';

// The Milestone Cabinet is a presentational, reverent view of the learner's own
// earned and locked marks. It is NOT a leaderboard: there are no ranks and no
// comparison to other people. Reward comes from milestones, hasanat, and
// coverage of the Qur'an, never competition.

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// This screen takes no route params. It reads progress + streak from the app's
// existing services/stores. Push it with: navigation.navigate('Milestones').
export type MilestonesScreenParams = undefined;

// Each word learned writes ten hasanat, mirroring the app's convention in the
// Today result screen (sessionWordsShown * 10). Total hasanat is derived from
// real words-learned, so it omits gracefully (renders 0 / hidden) when empty.
const HASANAT_PER_WORD = 10;

// Cabinet tiles describe milestones the learner can reach. Each maps to real
// progress data; partial ones show a gentle "to go" hint, never a rank.
interface MilestoneTile {
  id: string;
  title: string;
  // Returns earned + an optional progress hint when partially complete.
  evaluate: (data: ProgressData) => { earned: boolean; hint?: string };
}

interface ProgressData {
  wordsLearned: number;
  quranPercent: number;
  levelsCompleted: number;
  currentStreak: number;
  longestStreak: number;
}

const CABINET_TILES: MilestoneTile[] = [
  {
    id: 'seven-day-rhythm',
    title: '7 day rhythm',
    evaluate: (d) => {
      const best = Math.max(d.currentStreak, d.longestStreak);
      return best >= 7
        ? { earned: true }
        : { earned: false, hint: `${7 - best} ${7 - best === 1 ? 'day' : 'days'} to go` };
    },
  },
  {
    id: 'first-fifty-words',
    title: 'First 50 words',
    evaluate: (d) =>
      d.wordsLearned >= 50
        ? { earned: true }
        : { earned: false, hint: `${50 - d.wordsLearned} words to go` },
  },
  {
    id: 'foundations-tier',
    title: 'Foundations tier',
    evaluate: (d) =>
      d.wordsLearned >= 350
        ? { earned: true }
        : { earned: false, hint: `${Math.max(0, 350 - d.wordsLearned)} words to go` },
  },
  {
    id: 'half-the-quran',
    title: "Half the Qur'an",
    evaluate: (d) =>
      d.quranPercent >= 0.5
        ? { earned: true }
        : { earned: false, hint: 'Locked' },
  },
];

export function MilestonesScreen() {
  const navigation = useNavigation<NavProp>();
  const currentStreak = useStreakStore((s) => s.currentStreak);
  const longestStreak = useStreakStore((s) => s.longestStreak);

  const [wordsLearned, setWordsLearned] = useState(0);
  const [quranPercent, setQuranPercent] = useState(0);
  const [levelsCompleted, setLevelsCompleted] = useState(0);

  const loadProgress = useCallback(async () => {
    try {
      const [learned, percent, levels] = await Promise.all([
        getWordsLearnedCount(db),
        getQuranPercent(db),
        getLevelsCompletedCount(db),
      ]);
      setWordsLearned(learned ?? 0);
      setQuranPercent(percent ?? 0);
      setLevelsCompleted(levels ?? 0);
    } catch {
      // A no-op service on web leaves the sensible zero defaults in place; the
      // cabinet still renders with everything locked.
      setWordsLearned(0);
      setQuranPercent(0);
      setLevelsCompleted(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress]),
  );

  const progress: ProgressData = useMemo(
    () => ({
      wordsLearned,
      quranPercent,
      levelsCompleted,
      currentStreak,
      longestStreak,
    }),
    [wordsLearned, quranPercent, levelsCompleted, currentStreak, longestStreak],
  );

  // The headline mark "Read Al-Fatiha unaided" is earned once the learner has
  // reached at least 1% comprehension by vocabulary coverage. We reuse the real
  // badge rules to decide it (first-percent), so the screen stays in lockstep
  // with the rest of the app rather than inventing a parallel rule.
  const earnedBadges = useMemo(
    () =>
      evaluateBadges({
        wordsLearned,
        quranPercent,
        levelsCompleted,
        kindStreak: currentStreak,
        longestStreak,
      }),
    [wordsLearned, quranPercent, levelsCompleted, currentStreak, longestStreak],
  );
  const alFatihaUnaided = earnedBadges.some((b) => b.id === 'first-percent');

  const tiles = useMemo(
    () => CABINET_TILES.map((tile) => ({ tile, state: tile.evaluate(progress) })),
    [progress],
  );

  const earnedCount =
    (alFatihaUnaided ? 1 : 0) + tiles.filter((t) => t.state.earned).length;

  const totalHasanat = wordsLearned * HASANAT_PER_WORD;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <AppIcon name="chevron-left" size={22} color={mushafPalette.ink} strokeWidth={1.8} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Milestones</Text>
            <Text style={styles.headerSubtitle}>Marks of your own journey</Text>
          </View>
        </View>
        <View style={styles.earnedChip}>
          <Text style={styles.earnedChipText}>
            {`${earnedCount} earned`}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headlineCard}>
          <Svg width={52} height={52} viewBox="0 0 52 52">
            <SvgLinearGradient id="milestoneHeadline" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#e7d29a" />
              <Stop offset="1" stopColor="#946c10" />
            </SvgLinearGradient>
            <Circle cx="26" cy="26" r="24" fill="url(#milestoneHeadline)" />
            <Circle cx="26" cy="26" r="19" fill="none" stroke="#fbf6ea" strokeWidth="1" opacity="0.6" />
            {alFatihaUnaided ? (
              <Path
                d="M16 27l6 6 14-15"
                fill="none"
                stroke="#fbf6ea"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <Path
                d="M22 24v-2a4 4 0 018 0v2M19 24h14v9a2 2 0 01-2 2H21a2 2 0 01-2-2z"
                fill="none"
                stroke="#fbf6ea"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>
          <View style={styles.headlineText}>
            <Text style={styles.headlineTitle}>Read Al-Fatiha unaided</Text>
            <Text style={styles.headlineSub}>
              {alFatihaUnaided
                ? 'Every word known, no help. Earned.'
                : 'Every word known, no help. Keep learning to reach it.'}
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          {tiles.map(({ tile, state }) => (
            <CabinetTile key={tile.id} tile={tile} state={state} />
          ))}
        </View>

        {totalHasanat > 0 ? (
          <View style={styles.totalsRow}>
            <View>
              <Text style={styles.eyebrow}>Total hasanat</Text>
              <Text style={styles.totalsValue}>{formatNumber(totalHasanat)}</Text>
            </View>
            <Text style={styles.dua}>{'رَّبِ زِدْنِى عِلْمًا'}</Text>
          </View>
        ) : (
          <View style={styles.totalsRow}>
            <View>
              <Text style={styles.eyebrow}>Total hasanat</Text>
              <Text style={styles.totalsHintValue}>Begin to gather your hasanat</Text>
            </View>
            <Text style={styles.dua}>{'رَّبِ زِدْنِى عِلْمًا'}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CabinetTile({
  tile,
  state,
}: {
  tile: MilestoneTile;
  state: { earned: boolean; hint?: string };
}) {
  if (state.earned) {
    return (
      <View style={[styles.tile, styles.tileEarned]}>
        <View style={styles.tileMedal}>
          <Svg width={46} height={46} viewBox="0 0 46 46">
            <RadialGradient id={`medal-${tile.id}`} cx="35%" cy="30%" r="75%">
              <Stop offset="0" stopColor="#e7d29a" />
              <Stop offset="1" stopColor="#b8860b" />
            </RadialGradient>
            <Circle cx="23" cy="23" r="23" fill={`url(#medal-${tile.id})`} />
          </Svg>
          <Text style={styles.medalGlyph}>{glyphFor(tile.id)}</Text>
        </View>
        <Text style={styles.tileTitle}>{tile.title}</Text>
        <View style={styles.earnedTag}>
          <Text style={styles.earnedTagText}>Earned</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.tile, styles.tileLocked]}>
      <View style={styles.tileLockMedal}>
        <AppIcon name="lock" size={20} color={mushafPalette.muted} strokeWidth={2} />
      </View>
      <Text style={styles.tileTitleLocked}>{tile.title}</Text>
      <Text style={styles.tileHint}>{state.hint ?? 'Locked'}</Text>
    </View>
  );
}

function glyphFor(id: string): string {
  if (id === 'seven-day-rhythm') return '7';
  if (id === 'first-fifty-words') return '50';
  return '';
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mushafPalette.parchment,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 10,
  },
  headerLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: mushafPalette.paper,
    borderColor: mushafPalette.goldLine,
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    color: mushafPalette.ink,
    fontFamily: display.bold,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: mushafPalette.muted,
    fontFamily: display.regular,
    fontSize: 12,
    marginTop: 1,
  },
  earnedChip: {
    alignSelf: 'flex-start',
    backgroundColor: mushafPalette.goldSoft,
    borderColor: mushafPalette.goldLine,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  earnedChipText: {
    color: mushafPalette.goldDeep,
    fontFamily: display.semibold,
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    paddingBottom: 36,
  },
  headlineCard: {
    alignItems: 'center',
    backgroundColor: '#fbf0d4',
    borderColor: mushafPalette.goldSoft,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginHorizontal: 22,
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  headlineText: {
    flex: 1,
  },
  headlineTitle: {
    color: mushafPalette.ink,
    fontFamily: display.bold,
    fontSize: 14,
    fontWeight: '700',
  },
  headlineSub: {
    color: mushafPalette.ink2,
    fontFamily: display.regular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  tile: {
    alignItems: 'center',
    borderRadius: 14,
    flexBasis: '47%',
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  tileEarned: {
    backgroundColor: mushafPalette.paper,
    borderColor: mushafPalette.goldLine,
    borderWidth: 1,
  },
  tileLocked: {
    backgroundColor: '#f7f1e2',
    borderColor: mushafPalette.goldLine,
    borderStyle: 'dashed',
    borderWidth: 1,
    opacity: 0.75,
  },
  tileMedal: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  medalGlyph: {
    color: '#fbf6ea',
    fontFamily: display.extrabold,
    fontSize: 16,
    fontWeight: '800',
    position: 'absolute',
  },
  tileLockMedal: {
    alignItems: 'center',
    backgroundColor: '#e9ddc2',
    borderRadius: 999,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  tileTitle: {
    color: mushafPalette.ink,
    fontFamily: display.semibold,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  tileTitleLocked: {
    color: mushafPalette.ink2,
    fontFamily: display.semibold,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  tileHint: {
    color: mushafPalette.muted,
    fontFamily: display.regular,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  earnedTag: {
    backgroundColor: mushafPalette.goldSoft,
    borderColor: mushafPalette.goldLine,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  earnedTagText: {
    color: mushafPalette.goldDeep,
    fontFamily: display.semibold,
    fontSize: 11,
    fontWeight: '700',
  },
  totalsRow: {
    alignItems: 'center',
    borderTopColor: mushafPalette.goldLine,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  eyebrow: {
    color: mushafPalette.muted,
    fontFamily: display.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  totalsValue: {
    color: mushafPalette.goldDeep,
    fontFamily: display.extrabold,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  totalsHintValue: {
    color: mushafPalette.ink2,
    fontFamily: display.regular,
    fontSize: 13,
    marginTop: 4,
  },
  dua: {
    color: mushafPalette.ink2,
    fontFamily: fonts.arabic,
    fontSize: 17,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
