import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import { db } from '../../data/database';
import {
  getQuizWords,
  generateQuiz,
  mulberry32,
  gradeQuiz,
  recordQuizResult,
  type QuizQuestion,
} from '../../services/quizService';
import { getLocalToday } from '../../services/sm2';
import { ArabicText } from '../../components/ArabicText';
import { useStreakStore } from '../../stores/streakStore';
import { colors } from '../../theme/colors';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = NativeStackScreenProps<RootStackParamList, 'QuizSession'>['route'];

export function QuizSessionScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProp>();
  const { levelId, levelName } = route.params;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [today] = useState(() => getLocalToday());
  const [answers, setAnswers] = useState<(string | Record<number, string>)[]>([]);
  const [matchingState, setMatchingState] = useState<Record<number, string | null>>({});

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    try {
      const { levelWords, globalPool } = await getQuizWords(db, levelId);
      
      // Generate seed from levelId + today for determinism
      const seedStr = `${levelId}-${today}`;
      let seed = 0;
      for (let i = 0; i < seedStr.length; i++) {
        seed = ((seed << 5) - seed) + seedStr.charCodeAt(i);
        seed |= 0; // Convert to 32-bit integer
      }
      
      const rng = mulberry32(seed);
      const quiz = generateQuiz(levelWords, globalPool, rng, 20);
      setQuestions(quiz);
      setAnswers(new Array(quiz.length).fill(null));
      setMatchingState({});
    } finally {
      setIsLoading(false);
    }
  };

  // Update header with progress
  useEffect(() => {
    if (questions.length > 0 && !isComplete) {
      const questionNum = currentIndex + 1;
      navigation.setOptions({
        title: `Question ${questionNum}/${questions.length}`,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      });
    }
  }, [questions.length, currentIndex, isComplete, navigation]);

  const currentQuestion = questions[currentIndex];

  const handleMCAnswer = useCallback(
    (option: string) => {
      const newAnswers = [...answers];
      newAnswers[currentIndex] = option;
      setAnswers(newAnswers);
      advanceQuestion(newAnswers);
    },
    [answers, currentIndex],
  );

  const handleMatchingPair = useCallback(
    (wordId: number, meaning: string) => {
      const newState = { ...matchingState };
      newState[wordId] = newState[wordId] === meaning ? null : meaning;
      setMatchingState(newState);
    },
    [matchingState],
  );

  const handleMatchingSubmit = useCallback(() => {
    const q = currentQuestion as Extract<QuizQuestion, { kind: 'matching' }>;
    const answer: Record<number, string> = {};
    for (const pair of q.pairs) {
      answer[pair.wordId] = matchingState[pair.wordId] || '';
    }
    
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answer;
    setAnswers(newAnswers);
    setMatchingState({});
    advanceQuestion(newAnswers);
  }, [currentQuestion, matchingState, answers, currentIndex]);

  const advanceQuestion = (updatedAnswers: (string | Record<number, string>)[]) => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishQuiz(updatedAnswers);
    }
  };

  const finishQuiz = async (finalAnswers: (string | Record<number, string>)[]) => {
    const gradeResult = gradeQuiz(questions, finalAnswers);
    await recordQuizResult(db, levelId, gradeResult.percent, today);
    useStreakStore.getState().recordActivity(getLocalToday());
    
    setIsComplete(true);
    navigation.replace('QuizResult', {
      levelId,
      levelName,
      score: gradeResult.score,
      total: gradeResult.total,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // No questions
  if (questions.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Unable to generate quiz</Text>
        <Pressable style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isMatchingQuestion = currentQuestion?.kind === 'matching';
  const isMCQuestion = currentQuestion?.kind === 'multiple-choice';
  const matchingQ = isMatchingQuestion ? (currentQuestion as Extract<QuizQuestion, { kind: 'matching' }>) : null;
  const mcQ = isMCQuestion ? (currentQuestion as Extract<QuizQuestion, { kind: 'multiple-choice' }>) : null;

  // Matching question state check
  const matchingAnsweredCount = matchingQ ? matchingQ.pairs.filter(p => matchingState[p.wordId]).length : 0;
  const matchingAllAnswered = matchingQ ? matchingAnsweredCount === matchingQ.pairs.length : false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* MC Question */}
      {isMCQuestion && mcQ && (
        <View>
          <View style={styles.questionSection}>
            <Text style={styles.questionLabel}>What does this word mean?</Text>
            <ArabicText size="large" style={styles.arabicWord}>
              {mcQ.arabic}
            </ArabicText>
            <Text style={styles.transliteration}>{mcQ.transliteration}</Text>
          </View>

          <View style={styles.optionsSection}>
            {mcQ.options.map((option, idx) => (
              <Pressable
                key={idx}
                style={[
                  styles.optionButton,
                  answers[currentIndex] === option && styles.optionButtonSelected,
                ]}
                onPress={() => handleMCAnswer(option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    answers[currentIndex] === option && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Matching Question */}
      {isMatchingQuestion && matchingQ && (
        <View>
          <View style={styles.questionSection}>
            <Text style={styles.questionLabel}>Match each word to its meaning</Text>
          </View>

          <View style={styles.matchingContainer}>
            {/* Left side: words */}
            <View style={styles.matchingSide}>
              {matchingQ.pairs.map(pair => (
                <Pressable
                  key={pair.wordId}
                  style={[
                    styles.matchingWord,
                    matchingState[pair.wordId] && styles.matchingWordSelected,
                  ]}
                >
                  <ArabicText style={styles.matchingArabic}>{pair.arabic}</ArabicText>
                </Pressable>
              ))}
            </View>

            {/* Right side: meanings */}
            <View style={styles.matchingSide}>
              {matchingQ.meaningBank.map((meaning, idx) => (
                <Pressable
                  key={idx}
                  style={[
                    styles.matchingMeaning,
                    Object.values(matchingState).includes(meaning) && styles.matchingMeaningSelected,
                  ]}
                  onPress={() => {
                    // Find which word is paired with this meaning
                    const pairedWordId = Object.entries(matchingState).find(
                      ([_, v]) => v === meaning,
                    )?.[0];
                    if (pairedWordId) {
                      handleMatchingPair(parseInt(pairedWordId, 10), meaning);
                    } else {
                      // Find an unpaired word to assign
                      const unpairedWord = matchingQ.pairs.find(p => !matchingState[p.wordId]);
                      if (unpairedWord) {
                        handleMatchingPair(unpairedWord.wordId, meaning);
                      }
                    }
                  }}
                >
                  <Text style={styles.matchingMeaningText}>{meaning}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            style={[styles.submitButton, !matchingAllAnswered && styles.submitButtonDisabled]}
            onPress={handleMatchingSubmit}
            disabled={!matchingAllAnswered}
          >
            <Text style={styles.submitButtonText}>
              {matchingAnsweredCount}/{matchingQ.pairs.length} Paired
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  questionSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  questionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  arabicWord: {
    fontSize: 36,
    marginVertical: 12,
  },
  transliteration: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  optionsSection: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: colors.background,
    fontWeight: '600',
  },
  matchingContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  matchingSide: {
    flex: 1,
    gap: 8,
  },
  matchingWord: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  matchingWordSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  matchingArabic: {
    fontSize: 16,
  },
  matchingMeaning: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  matchingMeaningSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  matchingMeaningText: {
    fontSize: 14,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
