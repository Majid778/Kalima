import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
import { display } from '../../theme/typography';
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
      <Text style={[styles.title, { fontFamily: display.bold }]}>Preparing your first word</Text>
      <Text style={styles.subtitle}>Kalima is finding a real Qur'anic word to begin with.</Text>
    </View>
  );

  const renderFirstWinWelcome = () => (
    <>
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={['#fff6dc', '#f0e2bc']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.logoCircle}
        >
          <AppIcon name="diamond-logo" size={100} color={mushafPalette.gold} />
        </LinearGradient>
      </View>

      <View style={styles.headlineContainer}>
        <Text style={[styles.headline, { fontFamily: display.extrabold }]}>
          Understand the Qur'an,{'\n'}word by word
        </Text>
      </View>

      <View style={styles.ctaContainer}>
        <PrimaryCTA label="Begin" onPress={() => setStep(1)} />
        <Pressable
          onPress={() => completeOnboarding('beginner')}
          style={styles.textLink}
        >
          <Text style={styles.textLinkLabel}>I already have an account</Text>
        </Pressable>
      </View>
    </>
  );

  const renderConceptStep = () => {
    const content = CONCEPT_STEPS[step - 1];

    return (
      <>
        <View style={styles.copy}>
          <Text style={[styles.title, { fontFamily: display.bold }]}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
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
              <Text style={styles.secondaryLabel}>Skip</Text>
            </Pressable>
          ) : null}
        </View>
      </>
    );
  };

  const renderLevelStep = () => (
    <>
      <View style={styles.copy}>
        <Text style={[styles.sectionHeader, { fontFamily: display.semibold }]}>Arabic Level</Text>
        <Text style={[styles.title, { fontFamily: display.bold }]}>Where should we start?</Text>
        <Text style={styles.subtitle}>Pick the level that best matches your current Arabic reading ability.</Text>
      </View>

      <View style={styles.levelList}>
        {LEVEL_CHOICES.map((choice) => (
          <Pressable
            key={choice.level}
            onPress={() => handleComplete(choice.level)}
            style={styles.levelButton}
          >
            <Text style={[styles.levelButtonLabel, { fontFamily: display.semibold }]}>
              {choice.text}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );

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
      colors={['#fdf6e4', mushafPalette.parchment]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>

        {!isLoading ? (
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

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 38,
  },
  logoCircle: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(184, 134, 11, 0.2)',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 1,
    shadowRadius: 44,
    elevation: 8,
  },
  headlineContainer: {
    marginBottom: 38,
    alignItems: 'center',
  },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: mushafPalette.ink,
    lineHeight: 32.5,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  ctaContainer: {
    gap: 16,
    alignItems: 'center',
  },
  textLink: {
    paddingVertical: 12,
  },
  textLinkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: mushafPalette.muted,
    textAlign: 'center',
  },
  copy: {
    marginBottom: 32,
  },
  sectionHeader: {
    color: mushafPalette.ink2,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  title: {
    color: mushafPalette.ink,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    marginBottom: 12,
  },
  subtitle: {
    color: mushafPalette.ink2,
    fontSize: 17,
    lineHeight: 26,
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
    fontSize: 16,
    fontWeight: '600',
    color: mushafPalette.ink2,
  },
  levelList: {
    gap: 12,
  },
  levelButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: mushafPalette.paper,
    borderWidth: 1,
    borderColor: mushafPalette.goldLine,
    minHeight: 58,
  },
  levelButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
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
