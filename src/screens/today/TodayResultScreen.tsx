import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Circle, G, Line } from 'react-native-svg';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import { db } from '../../data/database';
import { getWordsLearnedCount, getQuranPercent } from '../../services/progressService';
import { getLocalToday } from '../../services/sm2';
import { useStreakStore } from '../../stores/streakStore';
import { mushafPalette } from '../../theme/palette';
import { display, naskh, fonts } from '../../theme/typography';
import { useTheme } from '../../theme/useTheme';
import { recordEvent, recordActivityForToday } from '../../services/instrumentationRuntime';
import { AppIcon } from '../../components/AppIcon';
import { PrimaryCTA } from '../../components/PrimaryCTA';
import { ArabicText } from '../../components/ArabicText';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface ResultStats {
  wordsShown: number;
  deltaPercent: number;
  currentStreak: number;
  hasanat: number;
}

function GlowRing({ delay }: { delay: number }) {
  // Mockup: glow keyframe scale .6 -> 1, opacity 0 -> .85 -> .6 over 1.3s, delay .1s.
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      opacity.value = 0.6;
      return;
    }
    scale.value = withDelay(delay, withTiming(1, { duration: 1300, easing: Easing.out(Easing.cubic) }));
    opacity.value = withDelay(delay, withTiming(0.6, { duration: 1300 }));
  }, [delay, reduceMotion, scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 164,
          height: 164,
        },
        animStyle,
      ]}
      pointerEvents="none"
    >
      <Svg width={164} height={164} viewBox="0 0 164 164">
        <Defs>
          <RadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#dcb04a" stopOpacity={0.55} />
            <Stop offset="65%" stopColor="#dcb04a" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={82} cy={82} r={82} fill="url(#glowGrad)" />
      </Svg>
    </Animated.View>
  );
}

function RaysBurst({ delay }: { delay: number }) {
  // Mockup: a thin gold conic ring. Native approximation = SVG spokes that
  // scale+rotate in (.4 scale / -22deg -> 1 / 0deg) and hold at opacity .5.
  const scale = useSharedValue(0.4);
  const rotate = useSharedValue(-22);
  const opacity = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      rotate.value = 0;
      opacity.value = 0.5;
      return;
    }
    scale.value = withDelay(delay, withTiming(1, { duration: 1500, easing: Easing.bezier(0.2, 0.7, 0.3, 1) }));
    rotate.value = withDelay(delay, withTiming(0, { duration: 1500, easing: Easing.bezier(0.2, 0.7, 0.3, 1) }));
    opacity.value = withDelay(delay, withTiming(0.5, { duration: 1500 }));
  }, [delay, reduceMotion, scale, rotate, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));

  // 16 spokes around the circle, drawn as short radial lines in the gold band.
  const spokes = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 240,
          height: 240,
        },
        animStyle,
      ]}
      pointerEvents="none"
    >
      <Svg width={240} height={240} viewBox="0 0 240 240">
        <G stroke="rgba(220,176,74,0.55)" strokeWidth={2}>
          {spokes.map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const inner = 47;
            const outer = 84;
            const cx = 120;
            const cy = 120;
            return (
              <Line
                key={angle}
                x1={cx + Math.cos(rad) * inner}
                y1={cy + Math.sin(rad) * inner}
                x2={cx + Math.cos(rad) * outer}
                y2={cy + Math.sin(rad) * outer}
              />
            );
          })}
        </G>
      </Svg>
    </Animated.View>
  );
}

function RippleRing({ delay }: { delay: number }) {
  const scale = useSharedValue(0.55);
  const opacity = useSharedValue(0.6);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 0.55;
      opacity.value = 0;
      return;
    }
    scale.value = withDelay(delay, withRepeat(withTiming(1.95, { duration: 2000, easing: Easing.out(Easing.cubic) }), -1, false));
    opacity.value = withDelay(delay, withRepeat(withTiming(0, { duration: 2000 }), -1, false));
  }, [delay, reduceMotion, scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 118,
          height: 118,
          borderRadius: 59,
          borderWidth: 2,
          borderColor: '#c8973a',
        },
        animStyle,
      ]}
    />
  );
}

function MoteParticle({ id, left, size, delay }: { id: string; left: number; size: number; delay: number }) {
  // Mockup: mote 2.6s ease-out infinite, translateY 0 -> -220 + scale 1 -> .35,
  // opacity 0 -> .95 (at 18%) -> 0; radial-gradient fill #f3dd9a -> #c8973a.
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const gradId = `mote-${id}`;

  useEffect(() => {
    if (reduceMotion) {
      translateY.value = -220;
      scale.value = 0.35;
      opacity.value = 0;
      return;
    }
    translateY.value = withDelay(delay, withRepeat(withTiming(-220, { duration: 2600, easing: Easing.out(Easing.quad) }), -1, false));
    scale.value = withDelay(delay, withRepeat(withTiming(0.35, { duration: 2600, easing: Easing.out(Easing.quad) }), -1, false));
    opacity.value = withDelay(delay, withRepeat(withTiming(0, { duration: 2600 }), -1, false));
  }, [delay, reduceMotion, translateY, scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left,
          bottom: 0,
          width: size,
          height: size,
        },
        animStyle,
      ]}
      pointerEvents="none"
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#f3dd9a" />
            <Stop offset="100%" stopColor="#c8973a" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gradId})`} />
      </Svg>
    </Animated.View>
  );
}

function TickCircle({ delay }: { delay: number }) {
  const scale = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      return;
    }
    scale.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.elastic(0.7) }));
  }, [delay, reduceMotion, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 98,
          height: 98,
          borderRadius: 49,
          justifyContent: 'center',
          alignItems: 'center',
        },
        animStyle,
      ]}
    >
      <LinearGradient colors={['#e9cf83', '#c8973a']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ width: 98, height: 98, borderRadius: 49, justifyContent: 'center', alignItems: 'center', shadowColor: 'rgba(168,118,13,.42)', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 1, shadowRadius: 26 }}>
        <AppIcon name="check" size={48} color="#fffaf0" strokeWidth={2.6} />
      </LinearGradient>
    </Animated.View>
  );
}

export function TodayResultScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'TodayResult'>>();
  const navigation = useNavigation<NavProp>();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { currentStreak: streak } = useStreakStore();
  const [stats, setStats] = useState<ResultStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const today = getLocalToday();
        recordActivityForToday();

        const [wordsLearned, quranPercent] = await Promise.all([
          getWordsLearnedCount(db),
          getQuranPercent(db),
        ]);

        const sessionWordsShown = route.params?.sessionWordsShown ?? 30;
        const deltaPercent = Math.max(0.1, Math.round((sessionWordsShown / 100) * 10) / 10);

        setStats({
          wordsShown: sessionWordsShown,
          deltaPercent,
          currentStreak: streak,
          hasanat: sessionWordsShown * 10,
        });

        recordEvent('practice_session_completed', {
          wordsLearned,
          quranPercent: Math.round(quranPercent * 100),
        });
      } catch (err) {
        console.error('Failed to load result stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [streak]);

  if (isLoading || !stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={mushafPalette.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#fdf3d6', mushafPalette.parchment]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.75 }} style={styles.background}>
        <View style={styles.content}>
          <View style={styles.tickStack}>
            <MoteParticle id="a" left={30} size={7} delay={200} />
            <MoteParticle id="b" left={46} size={5} delay={900} />
            <MoteParticle id="c" left={62} size={8} delay={500} />
            <MoteParticle id="d" left={70} size={5} delay={1400} />
            <MoteParticle id="e" left={38} size={6} delay={1100} />
            <GlowRing delay={100} />
            <RaysBurst delay={150} />
            <RippleRing delay={400} />
            <RippleRing delay={1150} />
            <TickCircle delay={900} />
          </View>

          <Animated.View style={styles.headerSection} entering={FadeInDown.duration(500).delay(1100)}>
            <Text style={styles.mashaAllahArabic}>مَا شَاءَ ٱللّٰه</Text>
            <Text style={styles.mashaAllahEnglish}>MASHA'ALLAH</Text>
          </Animated.View>

          <Animated.View style={styles.hasanatBadge} entering={FadeInDown.duration(500).delay(1350)}>
            <LinearGradient colors={['#fbeec4', '#f1da95']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.badgeGradient}>
              <Text style={styles.hasanatValue}>+{stats.hasanat}</Text>
              <Text style={styles.hasanatLabel}>hasanat</Text>
            </LinearGradient>
          </Animated.View>

          <View style={styles.cardsRow}>
            <Animated.View style={styles.card} entering={FadeInDown.duration(500).delay(1550)}>
              <Text style={styles.cardValue}>{stats.wordsShown}</Text>
              <Text style={styles.cardLabel}>words</Text>
            </Animated.View>
            <Animated.View style={styles.card} entering={FadeInDown.duration(500).delay(1700)}>
              <Text style={styles.cardValue}>+{stats.deltaPercent}%</Text>
              <Text style={styles.cardLabel}>understood</Text>
            </Animated.View>
            <Animated.View style={styles.card} entering={FadeInDown.duration(500).delay(1850)}>
              <Text style={styles.cardValue}>{stats.currentStreak}</Text>
              <Text style={styles.cardLabel}>day rhythm</Text>
            </Animated.View>
          </View>

          <Animated.View style={styles.duaSection} entering={FadeInDown.duration(500).delay(1900)}>
            <ArabicText style={styles.duaArabic}>رَّبِّ زِدْنِى عِلْمًا</ArabicText>
            <Text style={styles.duaTranslation}>My Lord, increase me in knowledge</Text>
          </Animated.View>

          <Animated.View style={styles.buttonContainer} entering={FadeInDown.duration(500).delay(2200)}>
            <PrimaryCTA label="Done" onPress={() => navigation.navigate('Tabs')} />
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: mushafPalette.parchment,
    },
    background: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      paddingHorizontal: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tickStack: {
      position: 'relative',
      width: 150,
      height: 150,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 26,
    },
    headerSection: {
      alignItems: 'center',
      marginTop: 22,
      marginBottom: 14,
    },
    mashaAllahArabic: {
      fontFamily: naskh.bold,
      fontSize: 42,
      fontWeight: '700',
      color: mushafPalette.ink,
      lineHeight: 52,
    },
    mashaAllahEnglish: {
      fontSize: 13,
      fontFamily: display.semibold,
      color: mushafPalette.muted,
      marginTop: 4,
      letterSpacing: 1,
      fontWeight: '600',
    },
    hasanatBadge: {
      marginTop: 14,
      marginBottom: 18,
    },
    badgeGradient: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 7,
      paddingHorizontal: 26,
      paddingVertical: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: mushafPalette.goldSoft,
    },
    hasanatValue: {
      fontSize: 20,
      fontWeight: '800',
      fontFamily: display.extrabold,
      color: mushafPalette.goldDeep,
    },
    hasanatLabel: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: display.semibold,
      color: mushafPalette.goldDeep,
    },
    cardsRow: {
      flexDirection: 'row',
      gap: 11,
      width: '100%',
      marginBottom: 18,
    },
    card: {
      flex: 1,
      backgroundColor: mushafPalette.paper,
      borderRadius: 22,
      paddingVertical: 15,
      paddingHorizontal: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: mushafPalette.goldLine,
      shadowColor: 'rgba(0,0,0,.04)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
    },
    cardValue: {
      fontSize: 19,
      fontWeight: '700',
      fontFamily: display.bold,
      color: mushafPalette.ink,
    },
    cardLabel: {
      fontSize: 11,
      color: mushafPalette.muted,
      marginTop: 4,
      fontFamily: display.semibold,
    },
    duaSection: {
      alignItems: 'center',
      marginTop: 30,
      marginBottom: 40,
    },
    duaArabic: {
      fontSize: 21,
      color: mushafPalette.goldDeep,
      fontFamily: fonts.arabic,
      fontWeight: '700',
    },
    duaTranslation: {
      fontSize: 12,
      color: mushafPalette.muted,
      fontFamily: display.regular,
      marginTop: 3,
    },
    buttonContainer: {
      width: '100%',
      paddingHorizontal: 0,
    },
  });
