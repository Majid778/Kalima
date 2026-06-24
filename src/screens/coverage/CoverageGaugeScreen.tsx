import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, {
  Path,
  Line,
  Circle,
  ClipPath,
  Rect,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../../components/AppIcon';
import { Chip } from '../../components/ui';
import { db } from '../../data/database';
import {
  getQuranPercent,
  getWordsLearnedCount,
  getGlobalWordCounts,
} from '../../services/progressService';
import { display, fonts } from '../../theme/typography';
import { mushafPalette } from '../../theme/palette';

/**
 * CoverageGaugeScreen ("The leverage curve") expects NO route params. It is a
 * pushed, self-contained read of the user's overall comprehension progress,
 * loaded from progressService on focus. Register it in the root stack as a
 * pushed screen (back button, no bottom tab bar).
 */
export type CoverageGaugeScreenParams = undefined;

type NavProp = NativeStackNavigationProp<Record<string, object | undefined>>;

// Illustrative Zipf-style decay curve (the coverage climb). This is a
// representative shape, not per-word frequency data, exactly per the mockup.
const CURVE_FILL_PATH =
  'M0 18 C 30 30, 50 78, 90 110 C 130 138, 180 156, 240 163 C 270 165, 290 166, 300 166 L300 167 L0 167 Z';
const CURVE_STROKE_PATH =
  'M0 18 C 30 30, 50 78, 90 110 C 130 138, 180 156, 240 163 C 270 165, 290 166, 300 166';
const CURVE_VIEW_WIDTH = 300;
const CURVE_VIEW_HEIGHT = 168;

function formatCount(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString('en-US');
}

export function CoverageGaugeScreen() {
  const navigation = useNavigation<NavProp>();
  const [quranPercent, setQuranPercent] = useState(0);
  const [wordsKnown, setWordsKnown] = useState(0);
  const [totalWords, setTotalWords] = useState(0);

  const loadCoverage = useCallback(async () => {
    try {
      const [percent, learnedCount, globalCounts] = await Promise.all([
        getQuranPercent(db),
        getWordsLearnedCount(db),
        getGlobalWordCounts(db),
      ]);

      setQuranPercent(Number.isFinite(percent) ? percent : 0);
      setWordsKnown(learnedCount > 0 ? learnedCount : globalCounts.knownWords);
      setTotalWords(globalCounts.totalWords);
    } catch (error) {
      console.error('Failed to load coverage gauge:', error);
      setQuranPercent(0);
      setWordsKnown(0);
      setTotalWords(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCoverage();
    }, [loadCoverage]),
  );

  const percentValue = Math.max(0, Math.min(100, Math.round(quranPercent * 100)));
  // The marker rides the curve by current coverage. The mockup pins 42% at x=138
  // of a 300-wide viewBox; we scale that linearly so any percent lands sensibly.
  const markerX = (percentValue / 100) * CURVE_VIEW_WIDTH;
  // Approximate the curve's y at the marker so the dot sits on the decay line.
  const markerY = curveYAt(markerX);

  const remainingToFull = Math.max(0, totalWords - wordsKnown);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <AppIcon name="chevron-left" size={22} color={mushafPalette.ink} strokeWidth={1.8} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>The leverage curve</Text>
          <Text style={styles.headerSubtitle}>
            Qur'an words ranked by how often they appear. Learn the frequent ones first and
            coverage climbs fast.
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#1f1a10', '#2a2212']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.curveCard}
        >
          <Svg
            width="100%"
            height={CURVE_VIEW_HEIGHT}
            viewBox={`0 0 ${CURVE_VIEW_WIDTH} ${CURVE_VIEW_HEIGHT}`}
            preserveAspectRatio="none"
            style={styles.curveSvg}
          >
            <Defs>
              <SvgLinearGradient id="coverageFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#f0d27a" stopOpacity={0.95} />
                <Stop offset="1" stopColor="#946c10" stopOpacity={0.15} />
              </SvgLinearGradient>
              <SvgLinearGradient id="coverageStroke" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#fff3c4" />
                <Stop offset="1" stopColor="#dcb04a" />
              </SvgLinearGradient>
              <ClipPath id="coverageClip">
                <Rect x="0" y="0" width={markerX} height={CURVE_VIEW_HEIGHT} />
              </ClipPath>
            </Defs>

            <Line x1="0" y1="167" x2="300" y2="167" stroke="#5c4e30" strokeWidth={1} opacity={0.5} />
            <Path d={CURVE_FILL_PATH} fill="#3a3014" />
            <Path d={CURVE_FILL_PATH} fill="url(#coverageFill)" clipPath="url(#coverageClip)" />
            <Path
              d={CURVE_STROKE_PATH}
              fill="none"
              stroke="url(#coverageStroke)"
              strokeWidth={2.5}
              strokeLinecap="round"
            />

            <Line
              x1={markerX}
              y1="0"
              x2={markerX}
              y2="167"
              stroke="#fff7d8"
              strokeWidth={1.5}
              strokeDasharray="3 4"
              opacity={0.8}
            />
            <Circle cx={markerX} cy={markerY} r={5} fill="#fff7d8" />
          </Svg>

          <View style={styles.curveAxisRow}>
            <Text style={styles.axisMostFrequent}>most frequent</Text>
            <Text style={styles.axisLongTail}>the long tail</Text>
          </View>

          <View style={styles.curveStat}>
            <Text style={styles.curvePercent}>{percentValue}%</Text>
            <Text style={styles.curveUnderstood}>understood</Text>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCount(wordsKnown)}</Text>
            <Text style={styles.statLabel}>words known</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCount(remainingToFull)}</Text>
            <Text style={styles.statLabel}>to full coverage</Text>
          </View>
          <View style={[styles.statCard, styles.deltaCard]}>
            <Chip tone="mastery" style={styles.deltaChip}>
              {`${percentValue}%`}
            </Chip>
            <Text style={styles.deltaLabel}>understood now</Text>
          </View>
        </View>

        <View style={styles.verseBlock}>
          <Text style={styles.verseArabic}>وَٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ</Text>
          <Text style={styles.verseTranslation}>seek help through patience and prayer</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Sample the illustrative cubic-bezier decay curve at an x in [0, 300] so the
// "you are here" dot sits on the line. Mirrors CURVE_STROKE_PATH's control points.
function curveYAt(x: number): number {
  const clampedX = Math.max(0, Math.min(CURVE_VIEW_WIDTH, x));
  // Two bezier segments from the path: 0..90 and 90..300.
  if (clampedX <= 90) {
    const t = clampedX / 90;
    return cubicBezier(t, 18, 30, 78, 110);
  }
  const t = (clampedX - 90) / (CURVE_VIEW_WIDTH - 90);
  return cubicBezier(t, 110, 138, 156, 166);
}

function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t;
  return (
    u * u * u * p0 +
    3 * u * u * t * p1 +
    3 * u * t * t * p2 +
    t * t * t * p3
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mushafPalette.parchment,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mushafPalette.paper,
    borderWidth: 1,
    borderColor: mushafPalette.goldLine,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 23,
    color: mushafPalette.ink,
    fontFamily: display.extrabold,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: mushafPalette.ink2,
    marginTop: 3,
    fontFamily: display.regular,
    lineHeight: 18,
  },
  content: {
    paddingBottom: 36,
  },
  curveCard: {
    position: 'relative',
    marginHorizontal: 18,
    marginTop: 18,
    paddingTop: 14,
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderRadius: 20,
  },
  curveSvg: {
    display: 'flex',
  },
  curveAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  axisMostFrequent: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#e7d29a',
    fontFamily: display.semibold,
  },
  axisLongTail: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#8a7950',
    fontFamily: display.semibold,
  },
  curveStat: {
    position: 'absolute',
    top: 18,
    right: 22,
    alignItems: 'flex-end',
  },
  curvePercent: {
    fontSize: 34,
    color: '#fff7d8',
    lineHeight: 34,
    fontFamily: display.extrabold,
  },
  curveUnderstood: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#e7d29a',
    fontFamily: display.semibold,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 22,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: mushafPalette.paper,
    borderWidth: 1,
    borderColor: mushafPalette.goldLine,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    color: mushafPalette.ink,
    fontFamily: display.extrabold,
  },
  statLabel: {
    fontSize: 11,
    color: mushafPalette.ink2,
    marginTop: 2,
    fontFamily: display.regular,
    textAlign: 'center',
  },
  deltaCard: {
    justifyContent: 'center',
    gap: 4,
  },
  deltaChip: {
    minHeight: 24,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  deltaLabel: {
    fontSize: 11,
    color: mushafPalette.goldDeep,
    fontFamily: display.regular,
    textAlign: 'center',
  },
  verseBlock: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 18,
  },
  verseArabic: {
    fontSize: 17,
    color: mushafPalette.ink,
    lineHeight: 31,
    textAlign: 'center',
    fontFamily: fonts.arabic,
  },
  verseTranslation: {
    fontSize: 11,
    color: mushafPalette.muted,
    marginTop: 3,
    fontFamily: display.regular,
    textAlign: 'center',
  },
});
