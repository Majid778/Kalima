import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Circle, Path } from 'react-native-svg';
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
import { display, naskh } from '../../theme/typography';
import { useTheme } from '../../theme/useTheme';
import { recordEvent, recordActivityForToday } from '../../services/instrumentationRuntime';
import { ArabicText } from '../../components/ArabicText';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface ResultStats {
  wordsShown: number;
  deltaPercent: number;
  currentStreak: number;
  hasanat: number;
}

// Calm centered gold tick (mockup: 54px gradient-stroke circle + check), wrapped
// by a single gold ripple ring. Quiet and reverent, not a slot machine.
function QuietTick({ delay }: { delay: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }
    // Mockup k-pop: scale 0 -> 1, opacity 0 -> 1 over .7s with a gentle delay.
    scale.value = withDelay(delay, withTiming(1, { duration: 700, easing: Easing.bezier(0.2, 0.8, 0.3, 1.2) }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 700 }));
  }, [delay, reduceMotion, scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[tickStyles.tick, animStyle]}>
      <Svg width={54} height={54} viewBox="0 0 54 54">
        <Defs>
          <SvgLinearGradient id="gg-result-c" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#f0d68a" />
            <Stop offset="1" stopColor="#c79a30" />
          </SvgLinearGradient>
        </Defs>
        <Circle cx={27} cy={27} r={24} fill="none" stroke="url(#gg-result-c)" strokeWidth={1.6} opacity={0.8} />
        <Path
          d="M18 28 l6 6 l13 -15"
          fill="none"
          stroke="url(#gg-result-c)"
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}

function RippleRing({ delay }: { delay: number }) {
  // Mockup k-ripple: scale .55 -> 1.95, opacity .6 -> 0, 1.9s ease-out infinite.
  const scale = useSharedValue(0.55);
  const opacity = useSharedValue(0.6);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      opacity.value = 0;
      return;
    }
    scale.value = withDelay(delay, withRepeat(withTiming(1.95, { duration: 1900, easing: Easing.out(Easing.cubic) }), -1, false));
    opacity.value = withDelay(delay, withRepeat(withTiming(0, { duration: 1900 }), -1, false));
  }, [delay, reduceMotion, scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[tickStyles.rippleRing, animStyle]} pointerEvents="none" />;
}

// Static styles for the tick + ripple (theme-independent, fixed mockup values).
const tickStyles = StyleSheet.create({
  tick: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rippleRing: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: 'rgba(231,210,154,0.6)',
  },
});

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
          <ActivityIndicator size="large" color={mushafPalette.goldSoft} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#2a2110', '#3a2d15']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.background}
      >
        <View style={styles.content}>
          <View style={styles.tickStack}>
            <RippleRing delay={400} />
            <QuietTick delay={150} />
          </View>

          <Animated.Text style={styles.mashaAllah} entering={FadeInDown.duration(500).delay(700)}>
            ما شاء الله
          </Animated.Text>

          <Animated.View style={styles.divider} entering={FadeInDown.duration(500).delay(850)} />

          <Animated.View style={styles.duaSection} entering={FadeInDown.duration(500).delay(1000)}>
            <ArabicText style={styles.duaArabic}>رَّبِّ زِدْنِى عِلْمًا</ArabicText>
            <Text style={styles.duaTranslation}>My Lord, increase me in knowledge</Text>
          </Animated.View>

          <Animated.View style={styles.hasanatChip} entering={FadeInDown.duration(500).delay(1200)}>
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#946c10" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 3l2.4 6.1L21 11l-6.6 1.9L12 19l-2.4-6.1L3 11l6.6-1.9z" />
            </Svg>
            <Text style={styles.hasanatChipText}>+{stats.hasanat} hasanat written</Text>
          </Animated.View>

          <Animated.View style={styles.statsRow} entering={FadeInDown.duration(500).delay(1350)}>
            <Text style={styles.statText}>
              <Text style={styles.statValue}>{stats.wordsShown}</Text> words
            </Text>
            <Text style={styles.statText}>
              <Text style={styles.statValue}>+{stats.deltaPercent}%</Text> understood
            </Text>
            <Text style={styles.statText}>
              <Text style={styles.statValue}>{stats.currentStreak}</Text> day rhythm
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={styles.buttonContainer} entering={FadeInDown.duration(500).delay(1500)}>
          <Pressable onPress={() => navigation.navigate('Tabs')} style={styles.ctaPressable}>
            <LinearGradient
              colors={['#e0bd55', '#b88a1e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaLabel}>Done</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#2a2110',
    },
    background: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#2a2110',
    },
    content: {
      flex: 1,
      paddingHorizontal: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tickStack: {
      position: 'relative',
      width: 54,
      height: 54,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 26,
    },
    mashaAllah: {
      fontFamily: naskh.regular,
      fontSize: 30,
      color: '#f0d68a',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    divider: {
      width: 46,
      height: 1,
      backgroundColor: 'rgba(231,210,154,0.28)',
      marginVertical: 24,
    },
    duaSection: {
      alignItems: 'center',
    },
    duaArabic: {
      fontSize: 38,
      lineHeight: 63,
      color: '#f7eccb',
      textAlign: 'center',
    },
    duaTranslation: {
      fontSize: 13,
      color: '#d8c79a',
      fontFamily: display.regular,
      fontStyle: 'italic',
      lineHeight: 20,
      textAlign: 'center',
      marginTop: 12,
    },
    hasanatChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginTop: 34,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: '#fbf0d4',
      borderWidth: 1,
      borderColor: mushafPalette.goldSoft,
    },
    hasanatChipText: {
      fontSize: 13,
      fontWeight: '600',
      fontFamily: display.semibold,
      color: mushafPalette.goldDeep,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 22,
      marginTop: 18,
      alignItems: 'center',
    },
    statText: {
      fontSize: 12,
      color: '#cbb985',
      fontFamily: display.regular,
    },
    statValue: {
      color: '#f3ead4',
      fontWeight: '700',
      fontFamily: display.bold,
    },
    buttonContainer: {
      width: '100%',
      paddingHorizontal: 30,
      paddingBottom: 32,
    },
    ctaPressable: {
      borderRadius: 18,
      overflow: 'hidden',
      shadowColor: 'rgba(168, 118, 13, 1)',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.34,
      shadowRadius: 22,
      elevation: 5,
    },
    ctaGradient: {
      paddingVertical: 16,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaLabel: {
      fontSize: 20,
      fontWeight: '700',
      fontFamily: display.bold,
      color: '#2a2110',
    },
  });
