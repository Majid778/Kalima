import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useOnboardingStore } from '../../stores/onboardingStore';
import type { ArabicLevel } from '../../stores/onboardingStore';

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
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  // Completing onboarding flips `hasOnboarded` in the store; RootStackNavigator
  // reactively swaps the Onboarding screen for the Tabs stack — no manual
  // navigation needed (and navigating to 'Tabs' here would race the gate, since
  // that route isn't registered until the store flip commits).
  const handleComplete = (level: ArabicLevel) => {
    completeOnboarding(level);
  };

  const renderConceptStep = () => {
    const content = CONCEPT_STEPS[step];

    return (
      <>
        <View style={styles.copy}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={() => setStep((current) => (current === 0 ? 1 : 2))}
          >
            <Text style={styles.primaryButtonText}>Next</Text>
          </Pressable>

          {step === 0 && (
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              onPress={() => completeOnboarding('beginner')}
            >
              <Text style={styles.secondaryButtonText}>Skip</Text>
            </Pressable>
          )}
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
          <Pressable
            key={choice.level}
            style={({ pressed }) => [styles.levelButton, pressed && styles.pressed]}
            onPress={() => handleComplete(choice.level)}
          >
            <Text style={styles.levelButtonText}>{choice.text}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>{step < 2 ? renderConceptStep() : renderLevelStep()}</View>

      <View style={styles.dots}>
        {[0, 1, 2].map((index) => (
          <View key={index} style={[styles.dot, step === index && styles.activeDot]} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  copy: {
    marginBottom: 32,
  },
  sectionHeader: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    marginBottom: 12,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 17,
    lineHeight: 26,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  levelList: {
    gap: 12,
  },
  levelButton: {
    minHeight: 58,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  levelButtonText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
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
    backgroundColor: colors.surfaceLight,
  },
  activeDot: {
    width: 20,
    backgroundColor: colors.primary,
  },
});
