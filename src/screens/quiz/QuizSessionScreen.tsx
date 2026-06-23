import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
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
import { AppIcon } from '../../components/AppIcon';
import { PrimaryCTA } from '../../components/PrimaryCTA';
import { useStreakStore } from '../../stores/streakStore';
import { mushafPalette } from '../../theme/palette';
import { display } from '../../theme/typography';

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
      
      const seedStr = `${levelId}-${today}`;
      let seed = 0;
      for (let i = 0; i < seedStr.length; i++) {
        seed = ((seed << 5) - seed) + seedStr.charCodeAt(i);
        seed |= 0;
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

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={mushafPalette.gold} />
      </View>
    );
  }

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

  const matchingAnsweredCount = matchingQ ? matchingQ.pairs.filter(p => matchingState[p.wordId]).length : 0;
  const matchingAllAnswered = matchingQ ? matchingAnsweredCount === matchingQ.pairs.length : false;

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()}>
          <AppIcon name="chevron-left" size={22} color={mushafPalette.muted} strokeWidth={1.8} />
        </Pressable>
        
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarTrack, { width: '100%' }]}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>
        
        <Text style={styles.progressText}>{currentIndex + 1}/{questions.length}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* MC Question */}
        {isMCQuestion && mcQ && (
          <View>
            <View style={styles.promptSection}>
              <Text style={styles.eyebrow}>what does this mean</Text>
              <ArabicText style={[styles.arabicWord, { fontWeight: '700' }]}>
                {mcQ.arabic}
              </ArabicText>
              <Text style={styles.transliteration}>{mcQ.transliteration}</Text>
            </View>

            <View style={styles.optionsSection}>
              {mcQ.options.map((option, idx) => (
                <Pressable
                  key={idx}
                  style={[
                    styles.optionCard,
                    answers[currentIndex] === option && styles.optionCardSelected,
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

            <View style={styles.buttonContainer}>
              <PrimaryCTA 
                label="Check"
                onPress={() => handleMCAnswer(answers[currentIndex] as string)}
              />
            </View>
          </View>
        )}

        {/* Matching Question */}
        {isMatchingQuestion && matchingQ && (
          <View>
            <View style={styles.promptSection}>
              <Text style={styles.eyebrow}>match each word to its meaning</Text>
            </View>

            <View style={styles.matchingContainer}>
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

              <View style={styles.matchingSide}>
                {matchingQ.meaningBank.map((meaning, idx) => (
                  <Pressable
                    key={idx}
                    style={[
                      styles.matchingMeaning,
                      Object.values(matchingState).includes(meaning) && styles.matchingMeaningSelected,
                    ]}
                    onPress={() => {
                      const pairedWordId = Object.entries(matchingState).find(
                        ([_, v]) => v === meaning,
                      )?.[0];
                      if (pairedWordId) {
                        handleMatchingPair(parseInt(pairedWordId, 10), meaning);
                      } else {
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

            <View style={styles.buttonContainer}>
              <PrimaryCTA 
                label="Check"
                onPress={handleMatchingSubmit}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mushafPalette.parchment,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: mushafPalette.parchment,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: mushafPalette.ink,
    marginBottom: 16,
  },
  button: {
    backgroundColor: mushafPalette.gold,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: mushafPalette.parchment,
    fontSize: 16,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 4,
    gap: 14,
  },
  progressBarContainer: {
    flex: 1,
    height: 7,
    backgroundColor: mushafPalette.goldRing,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarTrack: {
    flex: 1,
    position: 'relative',
  },
  progressBarFill: {
    height: 7,
    backgroundColor: mushafPalette.gold,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: mushafPalette.muted,
    fontFamily: display.semibold,
    minWidth: 35,
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 22,
    paddingVertical: 36,
  },
  promptSection: {
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 38,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: mushafPalette.muted,
    fontFamily: display.bold,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  arabicWord: {
    fontSize: 60,
    lineHeight: 96,
    color: mushafPalette.ink,
    marginTop: 28,
    textAlign: 'center',
  },
  transliteration: {
    fontSize: 13,
    color: mushafPalette.muted,
    marginTop: 4,
    fontFamily: display.regular,
  },
  optionsSection: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: mushafPalette.paper,
    borderRadius: 22,
    paddingVertical: 17,
    paddingHorizontal: 17,
    borderWidth: 1,
    borderColor: mushafPalette.goldLine,
    shadowColor: 'rgba(120,90,30,0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 2,
  },
  optionCardSelected: {
    backgroundColor: '#fbefcf',
    borderWidth: 2,
    borderColor: mushafPalette.gold,
    shadowOpacity: 0,
    elevation: 0,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: mushafPalette.ink,
    textAlign: 'center',
    fontFamily: display.medium,
  },
  optionTextSelected: {
    color: mushafPalette.goldDeep,
    fontWeight: '700',
    fontFamily: display.bold,
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
    backgroundColor: mushafPalette.paper,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: mushafPalette.goldLine,
    alignItems: 'center',
  },
  matchingWordSelected: {
    backgroundColor: mushafPalette.gold,
    borderColor: mushafPalette.gold,
  },
  matchingArabic: {
    fontSize: 16,
    color: mushafPalette.ink,
  },
  matchingMeaning: {
    backgroundColor: mushafPalette.paper,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: mushafPalette.goldLine,
  },
  matchingMeaningSelected: {
    backgroundColor: '#f0e5c3',
    borderColor: mushafPalette.gold,
  },
  matchingMeaningText: {
    fontSize: 14,
    color: mushafPalette.ink,
    textAlign: 'center',
    fontFamily: display.medium,
  },
  buttonContainer: {
    paddingHorizontal: 0,
    marginTop: 22,
  },
});
