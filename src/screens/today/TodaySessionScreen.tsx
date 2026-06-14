// src/screens/today/TodaySessionScreen.tsx
// Main practice session for Today: card reveal, grading, mistake recovery

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import { db } from '../../data/database';
import { getDueCards, gradeCard, getProgressWordIds, getLearnedWordStatuses } from '../../services/practiceService';
import { getWordsForLevel } from '../../services/wordService';
import { getLocalToday } from '../../services/sm2';
import { buildTodaySession, SessionSequence, SessionItem, reinsertAtEnd } from '../../services/sessionService';
import { previewGrades, Grade, type SM2State } from '../../services/sm2';
import { getWordStrength, type WordStrength } from '../../services/wordStrengthService';
import { buildKnownWordMap } from '../../services/arabicNormalize';
import { WordCard } from '../../components/WordCard';
import { GradeButtons } from '../../components/GradeButtons';
import { WordStrengthBadge } from '../../components/WordStrengthBadge';
import { swipeDirectionToGrade } from '../../components/today/swipeGrade';
import { colors } from '../../theme/colors';
import {
  recordEvent,
  startSession,
  completeSession,
  abandonSession,
  recordCardReviewed,
} from '../../services/instrumentationRuntime';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const SESSION_CONFIG = {
  dailyNewTarget: 10,
  maxSessionSize: 30,
  includeChecks: true,
};

const SWIPE_THRESHOLD = 72;
const OFFSCREEN_DISTANCE = Dimensions.get('window').height + Dimensions.get('window').width;
const SPRING_CONFIG = {
  damping: 24,
  stiffness: 210,
  mass: 0.85,
};
const HINTS: { grade: Grade; label: string; color: string }[] = [
  { grade: 'again', label: 'Again', color: colors.error },
  { grade: 'hard', label: 'Hard', color: colors.warning },
  { grade: 'good', label: 'Good', color: colors.primary },
  { grade: 'easy', label: 'Easy', color: '#3b82f6' },
];

interface SessionState {
  sequence: SessionSequence;
  currentIndex: number;
  revealed: boolean;
  mistakeModalVisible: boolean;
  isLoading: boolean;
  completed: boolean;
}

function LoadingSkeleton() {
  const reduceMotion = useReducedMotion();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      shimmer.value = 0.5;
      return;
    }

    shimmer.value = withRepeat(withTiming(1, { duration: 1800 }), -1, false);
  }, [reduceMotion, shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0 : 1,
    transform: [{ translateX: -180 + shimmer.value * 420 }],
  }));

  return (
    <View style={styles.skeletonContainer} accessibilityLabel="Loading today's session">
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonLineShort} />
        <View style={styles.skeletonBadge} />
      </View>
      <View style={styles.skeletonCard}>
        <Animated.View style={[styles.skeletonShimmer, shimmerStyle]} />
        <View style={styles.skeletonArabicLine} />
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonLineNarrow} />
      </View>
    </View>
  );
}

export function TodaySessionScreen() {
  const navigation = useNavigation<NavProp>();
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  // Known-word map for in-āyah status coloring (P2); optional — WordCard degrades
  // to target-only coloring when absent.
  const [knownMap, setKnownMap] = useState<Map<string, WordStrength>>();
  // Refs are read synchronously at callback/cleanup time, immune to stale closures:
  // completedRef gates the abandon-on-blur cleanup; gradingRef blocks re-entrant taps.
  const completedRef = useRef(false);
  const gradingRef = useRef(false);
  const reduceMotion = useReducedMotion();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const revealProgress = useSharedValue(0);
  const swipeCommitted = useSharedValue(false);
  const currentItemIndex = sessionState?.currentIndex;
  const currentTotalCount = sessionState?.sequence.totalCount;
  const isRevealed = sessionState?.revealed ?? false;

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const today = getLocalToday();
        const [dueCards, levelWords, progressIds, learnedStatuses] = await Promise.all([
          getDueCards(db, today, 200),
          getWordsForLevel(db, 1),
          getProgressWordIds(db),
          getLearnedWordStatuses(db),
        ]);

        // "New" = level words not yet in the SR queue, so a word can never be
        // both a new card and a due review in the same session.
        const inProgress = new Set(progressIds);
        const availableNew = levelWords.filter(w => !inProgress.has(w.id));

        let seq = buildTodaySession(dueCards, availableNew, {
          dailyNewTarget: SESSION_CONFIG.dailyNewTarget,
          maxSessionSize: SESSION_CONFIG.maxSessionSize,
        });

        if (!SESSION_CONFIG.includeChecks) {
          seq.items = seq.items.filter(item => item.type !== 'check');
          seq.checkCount = 0;
          seq.totalCount = seq.items.length;
        }

        // Nothing to study (e.g. due cleared since Home) — return to the
        // "all caught up" home rather than starting an empty session.
        if (seq.totalCount === 0) {
          navigation.goBack();
          return;
        }

        setSessionState({
          sequence: seq,
          currentIndex: 0,
          revealed: false,
          mistakeModalVisible: false,
          isLoading: false,
          completed: false,
        });
        setKnownMap(buildKnownWordMap(learnedStatuses));

        // Open an instrumentation session (populates sessionSummaries for
        // completion-rate + drop-off) and record the start event (funnel + milestone).
        startSession('TodaySession', seq.reviewCount);
        recordEvent('practice_session_started', {
          totalItems: seq.totalCount,
          newItems: seq.newCount,
          reviewItems: seq.reviewCount,
          checkItems: seq.checkCount,
        });
      } catch (err) {
        console.error('Failed to init session:', err);
        setSessionState(prev => prev ? { ...prev, isLoading: false } : null);
      }
    };

    initSession();
  }, []);

  // Handle unmount: record session abandon if not completed
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (
          sessionState &&
          !completedRef.current &&
          sessionState.currentIndex < sessionState.sequence.totalCount
        ) {
          recordEvent('practice_session_abandoned', {
            itemsCompleted: sessionState.currentIndex,
            totalItems: sessionState.sequence.totalCount,
          });
          abandonSession('TodaySession', `item ${sessionState.currentIndex}`);
        }
      };
    }, [sessionState]),
  );

  useEffect(() => {
    if (currentItemIndex == null) return;
    translateX.value = 0;
    translateY.value = 0;
    swipeCommitted.value = false;
    revealProgress.value = 0;
  }, [
    currentItemIndex,
    currentTotalCount,
    revealProgress,
    swipeCommitted,
    translateX,
    translateY,
  ]);

  useEffect(() => {
    if (currentItemIndex == null) return;
    const nextValue = isRevealed ? 1 : 0;
    revealProgress.value = reduceMotion
      ? nextValue
      : withSpring(nextValue, SPRING_CONFIG);
  }, [currentItemIndex, isRevealed, reduceMotion, revealProgress]);

  const handleCardReveal = useCallback(() => {
    setSessionState(prev => {
      if (!prev) return prev;
      const item = prev.sequence.items[prev.currentIndex];
      if (item && item.type === 'new' && !prev.revealed) {
        recordEvent('word_seen', { wordId: item.wordId, word: item.word.arabic });
      }
      return { ...prev, revealed: true };
    });
  }, []);

  const handleRevealPress = useCallback(() => {
    if (!sessionState || sessionState.revealed) return;
    Haptics.selectionAsync();
    handleCardReveal();
  }, [handleCardReveal, sessionState]);

  // Close the session exactly once. Side-effects live OUTSIDE any state updater so
  // they never double-fire, and completedRef flips synchronously BEFORE navigating
  // (the blur cleanup reads the ref, so a completed session is never marked abandoned).
  const finishSession = useCallback(
    (seq: SessionSequence) => {
      if (completedRef.current) return;
      completedRef.current = true;
      completeSession('TodayResult');
      recordEvent('practice_session_completed', { totalItems: seq.totalCount });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('TodayResult');
    },
    [navigation],
  );

  const advanceToNextItem = useCallback(() => {
    setSessionState(prev =>
      prev
        ? { ...prev, currentIndex: prev.currentIndex + 1, revealed: false, mistakeModalVisible: false }
        : prev,
    );
  }, []);

  const handleGrade = useCallback(
    async (grade: Grade) => {
      // gradingRef blocks re-entrant taps while the async grade is in flight,
      // preventing double-grading and duplicate completion events.
      if (!sessionState || gradingRef.current) return;
      const cur = sessionState;
      const item = cur.sequence.items[cur.currentIndex];
      if (!item) return;
      gradingRef.current = true;

      try {
        // Persist SR state ONLY on a card's first presentation (reviewCount 0).
        // Retry copies (reviewCount > 0) are in-session reinforcement: re-writing
        // SM-2 would overwrite the lapse penalty from the original 'again' and could
        // push cardsReviewed past cardsInitial. 'new' words are introduced on grade;
        // 'review' words are updated; 'check' items are ungraded recalls.
        const isFirstPresentation = item.reviewCount === 0;
        if (isFirstPresentation && (item.type === 'new' || item.type === 'review')) {
          recordEvent('practice_card_graded', { wordId: item.wordId, grade, itemType: item.type });
          try {
            const today = getLocalToday();
            const sm2State: SM2State = item.sm2
              ? {
                  easeFactor: item.sm2.easeFactor,
                  interval: item.sm2.interval,
                  repetitions: item.sm2.repetitions,
                  status: item.sm2.status as 'new' | 'learning' | 'review',
                }
              : { easeFactor: 2.5, interval: 0, repetitions: 0, status: 'new' };
            await gradeCard(db, item.wordId, sm2State, grade, today);
            if (item.type === 'review') {
              recordCardReviewed();
            }
          } catch (err) {
            console.error('Failed to grade card:', err);
          }
        }

        // Wrong answer: show the teaching modal; the grade (if first) is already saved.
        // Keep gradingRef held until the modal is resolved (retry/close).
        if (grade === 'again') {
          setSessionState(prev => (prev ? { ...prev, mistakeModalVisible: true } : null));
          return;
        }

        // Correct: finish if this was the last item, else advance.
        if (cur.currentIndex + 1 >= cur.sequence.totalCount) {
          finishSession(cur.sequence);
          setSessionState(prev => (prev ? { ...prev, completed: true } : null));
        } else {
          advanceToNextItem();
        }
      } finally {
        if (grade !== 'again') {
          gradingRef.current = false;
        }
      }
    },
    [sessionState, advanceToNextItem, finishSession],
  );

  const handleMistakeRetry = useCallback(() => {
    if (!sessionState) return;
    gradingRef.current = false;
    const cur = sessionState;
    const item = cur.sequence.items[cur.currentIndex];
    if (!item) return;

    // Re-queue at the end, bounded by the retry cap. reinsertAtEnd DROPS the item
    // (unchanged length) once the cap is exhausted, so the session still terminates.
    const newSeq = reinsertAtEnd(cur.sequence, item, 2);
    const nextIndex = cur.currentIndex + 1;

    if (nextIndex >= newSeq.totalCount) {
      // Last item (or dropped at the cap) — finish; never index past the end.
      finishSession(newSeq);
      setSessionState(prev =>
        prev ? { ...prev, sequence: newSeq, mistakeModalVisible: false, completed: true } : prev,
      );
      return;
    }
    setSessionState(prev =>
      prev
        ? { ...prev, sequence: newSeq, currentIndex: nextIndex, revealed: false, mistakeModalVisible: false }
        : prev,
    );
  }, [sessionState, finishSession]);

  const handleSwipeGrade = useCallback(
    (grade: Grade) => {
      handleGrade(grade);
    },
    [handleGrade],
  );

  const panGesture = Gesture.Pan()
    .enabled(Boolean(sessionState?.revealed && !sessionState.mistakeModalVisible && !sessionState.completed))
    .onUpdate((event) => {
      if (swipeCommitted.value) return;
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (swipeCommitted.value) return;

      const grade = swipeDirectionToGrade(event.translationX, event.translationY, SWIPE_THRESHOLD);
      if (!grade) {
        translateX.value = reduceMotion ? 0 : withSpring(0, SPRING_CONFIG);
        translateY.value = reduceMotion ? 0 : withSpring(0, SPRING_CONFIG);
        return;
      }

      swipeCommitted.value = true;

      if (reduceMotion) {
        translateX.value = 0;
        translateY.value = 0;
        runOnJS(handleSwipeGrade)(grade);
        return;
      }

      const horizontal = Math.abs(event.translationX) > Math.abs(event.translationY);
      const offscreenX = horizontal
        ? (event.translationX > 0 ? OFFSCREEN_DISTANCE : -OFFSCREEN_DISTANCE)
        : event.translationX;
      const offscreenY = horizontal
        ? event.translationY
        : (event.translationY > 0 ? OFFSCREEN_DISTANCE : -OFFSCREEN_DISTANCE);
      const onFinished = (finished?: boolean) => {
        if (finished) {
          runOnJS(handleSwipeGrade)(grade);
        }
      };

      if (horizontal) {
        translateY.value = withSpring(offscreenY, SPRING_CONFIG);
        translateX.value = withSpring(offscreenX, SPRING_CONFIG, onFinished);
      } else {
        translateX.value = withSpring(offscreenX, SPRING_CONFIG);
        translateY.value = withSpring(offscreenY, SPRING_CONFIG, onFinished);
      }
    });

  const swipeCardStyle = useAnimatedStyle(() => {
    const rotate = Math.max(-1, Math.min(1, translateX.value / 180)) * 5;

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotate}deg` },
      ],
    };
  });

  const frontFaceStyle = useAnimatedStyle(() => ({
    opacity: 1 - revealProgress.value,
    transform: [
      { translateY: -6 * revealProgress.value },
      { scale: 1 - 0.015 * revealProgress.value },
    ],
  }));

  const revealedFaceStyle = useAnimatedStyle(() => ({
    opacity: revealProgress.value,
    transform: [
      { translateY: 10 * (1 - revealProgress.value) },
      { scale: 0.985 + 0.015 * revealProgress.value },
    ],
  }));

  const againHintStyle = useAnimatedStyle(() => ({
    opacity: swipeDirectionToGrade(translateX.value, translateY.value, SWIPE_THRESHOLD) === 'again' ? 1 : 0,
    transform: [{ translateX: -8 }],
  }));

  const hardHintStyle = useAnimatedStyle(() => ({
    opacity: swipeDirectionToGrade(translateX.value, translateY.value, SWIPE_THRESHOLD) === 'hard' ? 1 : 0,
    transform: [{ translateY: 8 }],
  }));

  const goodHintStyle = useAnimatedStyle(() => ({
    opacity: swipeDirectionToGrade(translateX.value, translateY.value, SWIPE_THRESHOLD) === 'good' ? 1 : 0,
    transform: [{ translateX: 8 }],
  }));

  const easyHintStyle = useAnimatedStyle(() => ({
    opacity: swipeDirectionToGrade(translateX.value, translateY.value, SWIPE_THRESHOLD) === 'easy' ? 1 : 0,
    transform: [{ translateY: -8 }],
  }));

  if (!sessionState) {
    return (
      <View style={styles.container}>
        <LoadingSkeleton />
      </View>
    );
  }

  const item = sessionState.sequence.items[sessionState.currentIndex];
  if (!item) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text, fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
          You're all done for now.
        </Text>
        <Pressable
          style={[styles.revealButton, { alignSelf: 'stretch' }]}
          onPress={() => navigation.navigate('Tabs')}
        >
          <Text style={styles.revealButtonText}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  // Get strength from SM2 state if available, else 'new'
  const strength = item.sm2 
    ? getWordStrength({
        status: item.sm2.status as 'new' | 'learning' | 'review',
        interval: item.sm2.interval,
        repetitions: item.sm2.repetitions,
      })
    : 'new';

  const defaultSM2: SM2State = { easeFactor: 2.5, interval: 0, repetitions: 0, status: 'new' };
  const smState: SM2State = item.sm2 
    ? {
        easeFactor: item.sm2.easeFactor,
        interval: item.sm2.interval,
        repetitions: item.sm2.repetitions,
        status: item.sm2.status as 'new' | 'learning' | 'review',
      }
    : defaultSM2;
  const intervals = previewGrades(smState);

  const progress = `${sessionState.currentIndex + 1} / ${sessionState.sequence.totalCount}`;
  const remainingItems = Math.max(0, sessionState.sequence.totalCount - sessionState.currentIndex - 1);
  const pileCount = Math.min(3, remainingItems);
  const hintStyles: Record<Grade, object> = {
    again: againHintStyle,
    hard: hardHintStyle,
    good: goodHintStyle,
    easy: easyHintStyle,
  };
  const hintPositionStyles: Record<Grade, object> = {
    again: styles.swipeHintAgain,
    hard: styles.swipeHintHard,
    good: styles.swipeHintGood,
    easy: styles.swipeHintEasy,
  };

  return (
    <View style={styles.container}>
      {/* Header with progress */}
      <View style={styles.header}>
        <Text style={styles.progress}>{progress}</Text>
        <WordStrengthBadge strength={strength} />
      </View>

      {/* Word card */}
      <View style={styles.cardContainer}>
        {Array.from({ length: pileCount }).map((_, index) => (
          <View
            key={`pile-${index}`}
            style={[
              styles.pileCard,
              {
                opacity: 0.22 - index * 0.045,
                transform: [
                  { translateY: 10 + index * 9 },
                  { scale: 0.972 - index * 0.018 },
                ],
              },
            ]}
          />
        ))}

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.activeCard, swipeCardStyle]}>
            {sessionState.revealed && (
              <View pointerEvents="none" style={styles.hintLayer}>
                {HINTS.map(({ grade, label, color }) => (
                  <Animated.View
                    key={grade}
                    style={[
                      styles.swipeHint,
                      hintPositionStyles[grade],
                      { borderColor: color, backgroundColor: `${color}1A` },
                      hintStyles[grade],
                    ]}
                  >
                    <Text style={[styles.swipeHintLabel, { color }]}>{label}</Text>
                    <Text style={styles.swipeHintInterval}>{intervals[grade]}</Text>
                  </Animated.View>
                ))}
              </View>
            )}

            <Animated.View
              pointerEvents={sessionState.revealed ? 'none' : 'auto'}
              style={[styles.cardFace, frontFaceStyle]}
            >
              {/* Front (pre-reveal) = recall view: Arabic + context āyāt, meaning hidden. */}
              <WordCard word={item.word} showFront={false} knownMap={knownMap} />
            </Animated.View>

            <Animated.View
              pointerEvents={sessionState.revealed ? 'auto' : 'none'}
              style={[styles.cardFace, revealedFaceStyle]}
            >
              {/* Revealed = full card: meaning, transliteration, root, occurrences, āyāt. */}
              <WordCard word={item.word} showFront knownMap={knownMap} />
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Tap to reveal prompt or grade buttons */}
      {!sessionState.revealed && (
        <Pressable
          style={styles.revealButton}
          onPress={handleRevealPress}
        >
          <Text style={styles.revealButtonText}>Tap to reveal</Text>
        </Pressable>
      )}

      {sessionState.revealed && (
        <GradeButtons intervals={intervals} onGrade={handleGrade} />
      )}

      {/* Mistake recovery modal */}
      <Modal
        visible={sessionState.mistakeModalVisible}
        transparent
        onRequestClose={handleMistakeRetry}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Let's review</Text>
            <ScrollView style={styles.reviewScroll}>
              <Text style={styles.modalLabel}>Root:</Text>
              <Text style={styles.reviewText}>{item.word.root || '—'}</Text>

              {item.word.verses && item.word.verses.length > 0 && (
                <>
                  <Text style={styles.modalLabel}>Example Verse:</Text>
                  <Text style={styles.arabicText}>{item.word.verses[0].arabicText}</Text>
                  <Text style={styles.translationText}>{item.word.verses[0].translation}</Text>
                </>
              )}
            </ScrollView>

            <Pressable
              style={styles.retryButton}
              onPress={handleMistakeRetry}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  progress: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 24,
  },
  revealButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  revealButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  reviewScroll: {
    marginBottom: 16,
  },
  reviewText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 12,
  },
  arabicText: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
  },
  translationText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  skeletonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 0,
  },
  skeletonLineShort: {
    height: 14,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
    width: 50,
  },
  skeletonBadge: {
    width: 48,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
  },
  skeletonCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  skeletonArabicLine: {
    height: 48,
    backgroundColor: colors.surfaceLight,
    marginVertical: 16,
    borderRadius: 6,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: colors.surfaceLight,
    marginVertical: 8,
    borderRadius: 6,
  },
  skeletonLineNarrow: {
    height: 14,
    backgroundColor: colors.surfaceLight,
    width: '70%',
    marginVertical: 8,
    borderRadius: 6,
  },
  pileCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  activeCard: {
    flex: 1,
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hintLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  swipeHint: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  swipeHintLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  swipeHintInterval: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  swipeHintAgain: {
    top: '50%',
    left: 12,
    transform: [{ translateY: -28 }],
  },
  swipeHintHard: {
    bottom: 12,
    left: '50%',
    transform: [{ translateX: -36 }],
  },
  swipeHintGood: {
    top: '50%',
    right: 12,
    transform: [{ translateY: -28 }],
  },
  swipeHintEasy: {
    top: 12,
    left: '50%',
    transform: [{ translateX: -36 }],
  },
});
