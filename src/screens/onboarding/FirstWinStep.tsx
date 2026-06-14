import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ArabicText } from '../../components/ArabicText';
import { VerseTokens } from '../../components/VerseTokens';
import { Button, Card } from '../../components/ui';
import type { FirstWinQuestion } from '../../services/onboarding/firstWin';
import type { ThemeTokens } from '../../theme/theme';
import { hapticSelection, hapticSuccess, motionValue, TIMINGS } from '../../theme/motion';
import { useTheme } from '../../theme/useTheme';

interface FirstWinStepProps {
  question: FirstWinQuestion;
  onContinue: () => void;
}

export function FirstWinStep({ question, onContinue }: FirstWinStepProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const reduceMotion = useReducedMotion();
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const revealProgress = useSharedValue(0);
  const isRevealed = selectedMeaning !== null;

  useEffect(() => {
    if (!isRevealed) {
      revealProgress.value = 0;
      return;
    }

    revealProgress.value = motionValue(
      reduceMotion,
      withTiming(1, { duration: TIMINGS.base, easing: Easing.out(Easing.cubic) }),
      1,
    );
  }, [isRevealed, reduceMotion, revealProgress]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: revealProgress.value,
    transform: [{ translateY: (1 - revealProgress.value) * 8 }],
  }));

  const handleAnswer = (meaning: string) => {
    if (selectedMeaning !== null) return;

    setSelectedMeaning(meaning);
    void hapticSelection();
    void hapticSuccess();
  };

  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Text style={styles.overline}>First word</Text>
        <Text style={styles.title}>Here is a word from the Qur'an.</Text>
      </View>

      <Card elevated style={styles.verseCard}>
        <VerseTokens
          verseText={question.verse.arabicText}
          targetPosition={question.verse.wordPosition}
          size="small"
        />
        <Text style={styles.reference}>
          {question.verse.surahNumber}:{question.verse.ayahNumber}
        </Text>
      </Card>

      <View style={styles.wordPanel}>
        <ArabicText size="hero" color={theme.text.textPrimary} style={styles.word}>
          {question.word.arabic}
        </ArabicText>
        <Text style={styles.prompt}>What does this word mean?</Text>
      </View>

      <View style={styles.options}>
        {question.options.map((option) => {
          const isSelected = selectedMeaning === option.meaning;
          const showCorrect = isRevealed && option.correct;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: isRevealed }}
              disabled={isRevealed}
              key={`${option.meaning}:${option.correct}`}
              onPress={() => handleAnswer(option.meaning)}
              style={({ pressed }) => [
                styles.option,
                pressed && !isRevealed ? styles.optionPressed : null,
                isSelected ? styles.optionSelected : null,
                showCorrect ? styles.optionCorrect : null,
              ]}
            >
              <Text style={[styles.optionText, showCorrect ? styles.optionCorrectText : null]}>
                {option.meaning}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isRevealed ? (
        <Animated.View style={[styles.reveal, revealStyle]}>
          <Text style={styles.celebration}>You just understood a word of the Qur'an.</Text>
          <View style={styles.meaningRow}>
            <ArabicText size="medium" color={theme.sacred.sacred} style={styles.revealWord}>
              {question.word.arabic}
            </ArabicText>
            <Text style={styles.meaning}>{question.word.meaning}</Text>
          </View>
          {question.word.root ? (
            <Text style={styles.root}>Root: {question.word.root}</Text>
          ) : null}
          <Button label="Continue" onPress={onContinue} style={styles.continueButton} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  container: {
    gap: 18,
  },
  copy: {
    gap: 8,
  },
  overline: {
    color: theme.sacred.sacred,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: theme.text.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  verseCard: {
    backgroundColor: theme.surfaces.surfaceElevated,
  },
  reference: {
    color: theme.text.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'left',
  },
  wordPanel: {
    alignItems: 'center',
    gap: 6,
  },
  word: {
    textAlign: 'center',
  },
  prompt: {
    color: theme.text.textSecondary,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
  },
  options: {
    gap: 10,
  },
  option: {
    borderColor: theme.surfaces.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.surfaces.surface,
  },
  optionPressed: {
    backgroundColor: theme.surfaces.surfaceElevated,
  },
  optionSelected: {
    borderColor: theme.text.textMuted,
  },
  optionCorrect: {
    backgroundColor: theme.surfaces.surfaceElevated,
    borderColor: theme.sacred.sacred,
  },
  optionText: {
    color: theme.text.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  optionCorrectText: {
    color: theme.sacred.sacred,
  },
  reveal: {
    alignItems: 'center',
    borderColor: theme.sacred.sacredMuted,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    padding: 16,
  },
  celebration: {
    color: theme.sacred.sacred,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    textAlign: 'center',
  },
  meaningRow: {
    alignItems: 'center',
    gap: 4,
  },
  revealWord: {
    textAlign: 'center',
  },
  meaning: {
    color: theme.text.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  root: {
    color: theme.text.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  continueButton: {
    alignSelf: 'stretch',
    marginTop: 6,
  },
});