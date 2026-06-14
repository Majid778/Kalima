import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui';
import { db } from '../../data/database';
import { buildFirstWinQuestion, type FirstWinQuestion } from '../../services/onboarding/firstWin';
import { getWordsForLevel } from '../../services/wordService';
import { useOnboardingStore } from '../../stores/onboardingStore';
import type { ArabicLevel } from '../../stores/onboardingStore';
import type { ThemeTokens } from '../../theme/theme';
import { useTheme } from '../../theme/useTheme';
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

const FIRST_WIN_WELCOME = {
  title: 'Start with one real word',
  subtitle: "In a moment, you'll recognize a word from an actual ayah and see what it means.",
};

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

  // Completing onboarding flips `hasOnboarded` in the store; RootStackNavigator
  // reactively swaps the Onboarding screen for the Tabs stack — no manual
  // navigation needed.
  const handleComplete = (level: ArabicLevel) => {
    completeOnboarding(level);
  };

  const hasFirstWin = firstWinQuestion !== undefined && firstWinQuestion !== null;
  const isLoading = firstWinQuestion === undefined;
  const totalSteps = 3;

  const renderLoadingStep = () => (
    <View style={styles.copy}>
      <Text style={styles.title}>Preparing your first word</Text>
      <Text style={styles.subtitle}>Kalima is finding a real Qur'anic word to begin with.</Text>
    </View>
  );

  const renderFirstWinWelcome = () => (
    <>
      <View style={styles.copy}>
        <Text style={styles.title}>{FIRST_WIN_WELCOME.title}</Text>
        <Text style={styles.subtitle}>{FIRST_WIN_WELCOME.subtitle}</Text>
      </View>

      <View style={styles.actions}>
        <Button label="Begin" onPress={() => setStep(1)} />
        <Button label="Skip" variant="secondary" onPress={() => completeOnboarding('beginner')} />
      </View>
    </>
  );

  const renderConceptStep = () => {
    const content = CONCEPT_STEPS[step];

    return (
      <>
        <View style={styles.copy}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
        </View>

        <View style={styles.actions}>
          <Button label="Next" onPress={() => setStep((current) => (current === 0 ? 1 : 2))} />
          {step === 0 ? (
            <Button label="Skip" variant="secondary" onPress={() => completeOnboarding('beginner')} />
          ) : null}
        </View>
      </>
    );
  };

  const renderLevelStep = () => (
    <>
      <View style={styles.copy}>
        <Text style={styles.sectionHeader}>Arabic Level</Text>
        <Text style={styles.title}>Where should we start?</Text>
        <Text style={styles.subtitle}>Pick the level that best matches your current Arabic reading ability.</Text>
      </View>

      <View style={styles.levelList}>
        {LEVEL_CHOICES.map((choice) => (
          <Button
            key={choice.level}
            label={choice.text}
            variant="secondary"
            onPress={() => handleComplete(choice.level)}
            style={styles.levelButton}
          />
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

    return step < 2 ? renderConceptStep() : renderLevelStep();
  };

  return (
    <SafeAreaView style={styles.container}>
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
  );
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surfaces.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  copy: {
    marginBottom: 32,
  },
  sectionHeader: {
    color: theme.text.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  title: {
    color: theme.text.textPrimary,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    marginBottom: 12,
  },
  subtitle: {
    color: theme.text.textSecondary,
    fontSize: 17,
    lineHeight: 26,
  },
  actions: {
    gap: 12,
  },
  levelList: {
    gap: 12,
  },
  levelButton: {
    minHeight: 58,
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
    backgroundColor: theme.surfaces.surfaceElevated,
  },
  activeDot: {
    width: 20,
    backgroundColor: theme.sacred.sacred,
  },
});