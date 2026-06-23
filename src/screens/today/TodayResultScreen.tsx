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
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0.55);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      opacity.value = 0.55;
      return;
    }
    scale.value = withDelay(delay, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    opacity.value = withDelay(delay, withTiming(0.55, { duration: 600 }));
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
          borderRadius: 82,
        },
        animStyle,
      ]}
    />
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

function MoteParticle({ left, size, delay }: { left: number; size: number; delay: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      translateY.value = -220;
      opacity.value = 0;
      return;
    }
    translateY.value = withDelay(delay, withRepeat(withTiming(-220, { duration: 3000, easing: Easing.out(Easing.quad) }), -1, false));
    opacity.value = withDelay(delay, withRepeat(withTiming(0, { duration: 3000 }), -1, false));
  }, [delay, reduceMotion, translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
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
          borderRadius: size / 2,
          backgroundColor: '#c8973a',
        },
        animStyle,
      ]}
    />
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
            <GlowRing delay={200} />
            <RippleRing delay={400} />
            <RippleRing delay={1150} />
            <MoteParticle left={30} size={7} delay={200} />
            <MoteParticle left={46} size={5} delay={900} />
            <MoteParticle left={62} size={8} delay={500} />
            <MoteParticle left={70} size={5} delay={1400} />
            <MoteParticle left={38} size={6} delay={1100} />
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
      fontSize: 23,
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
      fontSize: 25,
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
