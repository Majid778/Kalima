import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { PrimaryCTA } from '../../components/PrimaryCTA';
import { AppIcon } from '../../components/AppIcon';
import { db } from '../../data/database';
import { buildFirstWinQuestion, type FirstWinQuestion } from '../../services/onboarding/firstWin';
import { getWordsForLevel } from '../../services/wordService';
import { useOnboardingStore } from '../../stores/onboardingStore';
import type { ArabicLevel } from '../../stores/onboardingStore';
import type { ThemeTokens } from '../../theme/theme';
import { useTheme } from '../../theme/useTheme';
import { mushafPalette } from '../../theme/palette';
import { display, fonts } from '../../theme/typography';
import { FirstWinStep } from './FirstWinStep';

const CONCEPT_STEPS = [
  {
    title: 'Build Arabic one word at a time',
    subtitle: 'Kalima helps you learn vocabulary through short, focused practice that fits into your day.',
  },
  {
    title: 'Practice with the right support',
    subtitle: 'Choose how much guidance you need, then adjust transliteration and reading help as you grow.',
  },
];

const LEVEL_CHOICES: { text: string; level: ArabicLevel }[] = [
  { text: 'Beginner', level: 'beginner' },
  { text: 'Alphabet Learner', level: 'alphabet' },
  { text: 'Advanced Reader', level: 'reader' },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [step, setStep] = useState(0);
  const [firstWinQuestion, setFirstWinQuestion] = useState<FirstWinQuestion | null>();
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  useEffect(() => {
    let active = true;

    const loadFirstWin = async () => {
      try {
        const levelWords = await getWordsForLevel(db, 1);
        if (active) {
          setFirstWinQuestion(buildFirstWinQuestion(levelWords));
        }
      } catch {
        if (active) {
          setFirstWinQuestion(null);
        }
      }
    };

    void loadFirstWin();

    return () => {
      active = false;
    };
  }, []);

  const handleComplete = (level: ArabicLevel) => {
    completeOnboarding(level);
  };

  const hasFirstWin = firstWinQuestion !== undefined && firstWinQuestion !== null;
  const isLoading = firstWinQuestion === undefined;
  const totalSteps = 3;

  const renderLoadingStep = () => (
    <View style={styles.copy}>
      <Text style={[styles.title, { fontFamily: display.extrabold }]}>Preparing your first word</Text>
      <Text style={[styles.subtitle, { fontFamily: display.regular }]}>
        Finding a real Qur'anic word to begin with.
      </Text>
    </View>
  );

  const renderFirstWinWelcome = () => (
    <View style={styles.welcome}>
      <Svg width={120} height={120} viewBox="0 0 120 120" style={styles.seal}>
        <Defs>
          <SvgLinearGradient id="gg-onb1" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={mushafPalette.goldSoft} />
            <Stop offset="1" stopColor={mushafPalette.goldDeep} />
          </SvgLinearGradient>
        </Defs>
        <Circle cx="60" cy="60" r="54" fill="none" stroke="url(#gg-onb1)" strokeWidth={1.5} />
        <Circle
          cx="60"
          cy="60"
          r="46"
          fill="none"
          stroke={mushafPalette.goldLine}
          strokeWidth={1}
          strokeDasharray="3 5"
        />
        <SvgText
          x="60"
          y="64"
          textAnchor="middle"
          fontFamily={fonts.arabic}
          fontSize={40}
          fill={mushafPalette.goldDeep}
        >
          {'اقْرَأْ'}
        </SvgText>
      </Svg>

      <Text style={[styles.appMark, { fontFamily: fonts.arabic }]}>
        {'كَلِمَة'}
      </Text>
      <Text style={[styles.eyebrow, { fontFamily: display.semibold }]}>Kalima</Text>

      <Text style={[styles.headline, { fontFamily: display.extrabold }]}>
        Understand the Qur'an,{'\n'}one word at a time
      </Text>
      <Text style={[styles.welcomeSubline, { fontFamily: display.regular }]}>
        The most frequent words first, so meaning arrives faster than you expect.
      </Text>
    </View>
  );

  const renderWelcomeFooter = () => (
    <View style={styles.welcomeFooter}>
      <PrimaryCTA label="Begin, bismillah" onPress={() => setStep(1)} />
      <Pressable
        onPress={() => completeOnboarding('reader')}
        style={styles.textLink}
      >
        <Text style={[styles.textLinkLabel, { fontFamily: display.semibold }]}>
          I already read Arabic, place me
        </Text>
      </Pressable>
    </View>
  );

  const renderConceptStep = () => {
    const content = CONCEPT_STEPS[step - 1];

    return (
      <>
        <View style={styles.copy}>
          <Text style={[styles.title, { fontFamily: display.extrabold }]}>{content.title}</Text>
          <Text style={[styles.subtitle, { fontFamily: display.regular }]}>{content.subtitle}</Text>
        </View>

        <View style={styles.actions}>
          <PrimaryCTA
            label={step === 1 ? 'Next' : 'Continue'}
            onPress={() => setStep(step === 1 ? 2 : 3)}
          />
          {step === 1 ? (
            <Pressable
              onPress={() => completeOnboarding('beginner')}
              style={styles.secondaryButton}
            >
              <Text style={[styles.secondaryLabel, { fontFamily: display.semibold }]}>Skip</Text>
            </Pressable>
          ) : null}
        </View>
      </>
    );
  };

  const renderLevelStep = () => (
    <>
      <View style={styles.copy}>
        <Text style={[styles.sectionHeader, { fontFamily: display.semibold }]}>Arabic level</Text>
        <Text style={[styles.title, { fontFamily: display.extrabold }]}>Where should we start?</Text>
        <Text style={[styles.subtitle, { fontFamily: display.regular }]}>
          Pick what matches your reading today.
        </Text>
      </View>

      <View style={styles.levelList}>
        {LEVEL_CHOICES.map((choice) => (
          <Pressable
            key={choice.level}
            onPress={() => handleComplete(choice.level)}
            style={({ pressed }) => [styles.levelButton, pressed && styles.levelButtonPressed]}
          >
            <Text style={[styles.levelButtonLabel, { fontFamily: display.semibold }]}>
              {choice.text}
            </Text>
            <AppIcon name="arrow-right" size={18} color={mushafPalette.gold} />
          </Pressable>
        ))}
      </View>
    </>
  );

  const isWelcome = hasFirstWin && step === 0;

  const renderContent = () => {
    if (isLoading) return renderLoadingStep();

    if (hasFirstWin) {
      if (step === 0) return renderFirstWinWelcome();
      if (step === 1) {
        return (
          <FirstWinStep
            question={firstWinQuestion}
            onContinue={() => setStep(2)}
          />
        );
      }
      return renderLevelStep();
    }

    if (step < 2) return renderConceptStep();
    return renderLevelStep();
  };

  return (
    <LinearGradient
      colors={[mushafPalette.parchment, '#fdf6e4']}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.content, isWelcome && styles.welcomeContent]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>

        {isWelcome ? renderWelcomeFooter() : null}

        {!isLoading && !isWelcome ? (
          <View style={styles.dots}>
            {Array.from({ length: totalSteps }, (_, index) => (
              <View key={index} style={[styles.dot, step === index && styles.activeDot]} />
            ))}
          </View>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

const makeStyles = (_theme: ThemeTokens) => StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  welcomeContent: {
    paddingHorizontal: 34,
  },
  welcome: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seal: {
    marginBottom: 4,
  },
  appMark: {
    fontSize: 30,
    color: mushafPalette.ink,
    textAlign: 'center',
    marginTop: 24,
  },
  eyebrow: {
    fontSize: 12,
    color: mushafPalette.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    textAlign: 'center',
    marginTop: 6,
  },
  headline: {
    fontSize: 23,
    color: mushafPalette.ink,
    lineHeight: 32,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginTop: 22,
  },
  welcomeSubline: {
    fontSize: 14,
    color: mushafPalette.ink2,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
  },
  welcomeFooter: {
    paddingHorizontal: 26,
    paddingBottom: 8,
  },
  textLink: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  textLinkLabel: {
    fontSize: 14,
    color: mushafPalette.muted,
    textAlign: 'center',
  },
  copy: {
    marginBottom: 32,
  },
  sectionHeader: {
    color: mushafPalette.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  title: {
    color: mushafPalette.ink,
    fontSize: 28,
    lineHeight: 35,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  subtitle: {
    color: mushafPalette.ink2,
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    gap: 12,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: mushafPalette.paper,
    borderWidth: 1,
    borderColor: mushafPalette.goldLine,
  },
  secondaryLabel: {
    fontSize: 15,
    color: mushafPalette.ink2,
  },
  levelList: {
    gap: 12,
  },
  levelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: mushafPalette.paper,
    borderWidth: 1,
    borderColor: mushafPalette.goldLine,
    minHeight: 60,
    shadowColor: 'rgba(148, 108, 16, 0.12)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 2,
  },
  levelButtonPressed: {
    backgroundColor: '#fbefcf',
    borderColor: mushafPalette.gold,
  },
  levelButtonLabel: {
    fontSize: 16,
    color: mushafPalette.ink,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: mushafPalette.goldSoft,
  },
  activeDot: {
    width: 20,
    backgroundColor: mushafPalette.gold,
  },
});
