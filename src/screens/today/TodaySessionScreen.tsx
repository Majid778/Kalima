// src/screens/today/TodaySessionScreen.tsx
// Main reading session for Today: recognition (tap-the-meaning), auto-grading, audio, and mistake recovery.
// The learner taps the correct meaning among distractors; correctness is inferred and fed to SM-2.
// No subjective self-grading (replaced the old Again / I knew it self-rating).

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  SafeAreaView,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import { db } from '../../data/database';
import { getDueCards, gradeCard, getProgressWordIds, getLearnedWordStatuses } from '../../services/practiceService';
import { getWordsForLevel } from '../../services/wordService';
import { getLocalToday } from '../../services/sm2';
import { buildTodaySession, SessionSequence, SessionItem, reinsertAtEnd } from '../../services/sessionService';
import { Grade, type SM2State } from '../../services/sm2';
import { mulberry32, shuffle } from '../../services/quizService';
import type { WordStrength } from '../../services/wordStrengthService';
import { buildKnownWordMap } from '../../services/arabicNormalize';
import { ayahAudioUrl, getReciterById } from '../../services/audio/audioSource';
import { playAyah, stopAudio } from '../../services/audio/audioRuntime';
import { AppIcon } from '../../components/AppIcon';
import { Chip } from '../../components/Chip';
import { ArabicText } from '../../components/ArabicText';
import { mushafPalette } from '../../theme/palette';
import { display } from '../../theme/typography';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  recordEvent,
  startSession,
  completeSession,
  abandonSession,
  recordCardReviewed,
} from '../../services/instrumentationRuntime';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type SessionWord = SessionItem['word'];
type SessionVerse = SessionWord['verses'][number];

const SESSION_CONFIG = {
  dailyNewTarget: 10,
  maxSessionSize: 30,
  includeChecks: true,
};

// Most distractors a single question shows (correct + up to this many wrong meanings).
const MAX_OPTIONS = 4;

const SESSION_LIGHT = '#e9dcb6';
const SESSION_DARK = '#241a0d';
const SESSION_BG = '#221809';
const SESSION_RADIAL_STYLE = Platform.select({
  web: {
    backgroundImage: 'radial-gradient(135% 80% at 50% 0%, #3a2a12, #221809)',
  } as ViewStyle,
  default: null,
});

const SURAH_NAMES: Record<number, string> = {
  1: 'Al-Fatihah',
  2: 'Al-Baqarah',
  3: 'Ali Imran',
  4: 'An-Nisa',
  5: "Al-Ma'idah",
  6: "Al-An'am",
  7: "Al-A'raf",
  8: 'Al-Anfal',
  9: 'At-Tawbah',
  10: 'Yunus',
  11: 'Hud',
  12: 'Yusuf',
  13: "Ar-Ra'd",
  14: 'Ibrahim',
  15: 'Al-Hijr',
  16: 'An-Nahl',
  17: 'Al-Isra',
  18: 'Al-Kahf',
  19: 'Maryam',
  20: 'Taha',
  21: 'Al-Anbiya',
  22: 'Al-Hajj',
  23: "Al-Mu'minun",
  24: 'An-Nur',
  25: 'Al-Furqan',
  26: "Ash-Shu'ara",
  27: 'An-Naml',
  28: 'Al-Qasas',
  29: 'Al-Ankabut',
  30: 'Ar-Rum',
  31: 'Luqman',
  32: 'As-Sajdah',
  33: 'Al-Ahzab',
  34: 'Saba',
  35: 'Fatir',
  36: 'Ya-Sin',
  37: 'As-Saffat',
  38: 'Sad',
  39: 'Az-Zumar',
  40: 'Ghafir',
  41: 'Fussilat',
  42: 'Ash-Shura',
  43: 'Az-Zukhruf',
  44: 'Ad-Dukhan',
  45: 'Al-Jathiyah',
  46: 'Al-Ahqaf',
  47: 'Muhammad',
  48: 'Al-Fath',
  49: 'Al-Hujurat',
  50: 'Qaf',
  51: 'Adh-Dhariyat',
  52: 'At-Tur',
  53: 'An-Najm',
  54: 'Al-Qamar',
  55: 'Ar-Rahman',
  56: "Al-Waqi'ah",
  57: 'Al-Hadid',
  58: 'Al-Mujadilah',
  59: 'Al-Hashr',
  60: 'Al-Mumtahanah',
  61: 'As-Saff',
  62: "Al-Jumu'ah",
  63: 'Al-Munafiqun',
  64: 'At-Taghabun',
  65: 'At-Talaq',
  66: 'At-Tahrim',
  67: 'Al-Mulk',
  68: 'Al-Qalam',
  69: 'Al-Haqqah',
  70: "Al-Ma'arij",
  71: 'Nuh',
  72: 'Al-Jinn',
  73: 'Al-Muzzammil',
  74: 'Al-Muddaththir',
  75: 'Al-Qiyamah',
  76: 'Al-Insan',
  77: 'Al-Mursalat',
  78: 'An-Naba',
  79: "An-Nazi'at",
  80: 'Abasa',
  81: 'At-Takwir',
  82: 'Al-Infitar',
  83: 'Al-Mutaffifin',
  84: 'Al-Inshiqaq',
  85: 'Al-Buruj',
  86: 'At-Tariq',
  87: "Al-A'la",
  88: 'Al-Ghashiyah',
  89: 'Al-Fajr',
  90: 'Al-Balad',
  91: 'Ash-Shams',
  92: 'Al-Layl',
  93: 'Ad-Duha',
  94: 'Ash-Sharh',
  95: 'At-Tin',
  96: 'Al-Alaq',
  97: 'Al-Qadr',
  98: 'Al-Bayyinah',
  99: 'Az-Zalzalah',
  100: 'Al-Adiyat',
  101: "Al-Qari'ah",
  102: 'At-Takathur',
  103: 'Al-Asr',
  104: 'Al-Humazah',
  105: 'Al-Fil',
  106: 'Quraysh',
  107: "Al-Ma'un",
  108: 'Al-Kawthar',
  109: 'Al-Kafirun',
  110: 'An-Nasr',
  111: 'Al-Masad',
  112: 'Al-Ikhlas',
  113: 'Al-Falaq',
  114: 'An-Nas',
};

interface SessionState {
  sequence: SessionSequence;
  currentIndex: number;
  revealed: boolean;            // true once the learner has tapped an answer
  selectedOption: string | null;
  answeredCorrect: boolean | null;
  isLoading: boolean;
  completed: boolean;
}

function formatVerseRef(verse?: SessionVerse): string {
  if (!verse) return 'Verse context';
  const surahName = SURAH_NAMES[verse.surahNumber] ?? `Surah ${verse.surahNumber}`;
  return `${surahName} · ${verse.surahNumber}:${verse.ayahNumber}`;
}

/** Build the answer options for a card: the correct meaning + up to MAX_OPTIONS-1 distractors,
 *  drawn from the other words in this session. Seeded by wordId so it is stable across re-renders. */
function buildOptions(seq: SessionSequence, index: number): string[] {
  const item = seq.items[index];
  if (!item) return [];
  const correct = item.word.meaning;
  const pool = new Set<string>();
  for (const it of seq.items) {
    const m = it.word.meaning;
    if (m && m !== correct) pool.add(m);
  }
  const rng = mulberry32(item.wordId + 1);
  const distractors = shuffle(Array.from(pool), rng).slice(0, MAX_OPTIONS - 1);
  return shuffle([correct, ...distractors], rng);
}

function LoadingSkeleton() {
  const styles = useMemo(() => makeStyles(), []);
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
    opacity: reduceMotion ? 0.35 : 0.2 + shimmer.value * 0.32,
  }));

  return (
    <SafeAreaView style={[styles.safeArea, SESSION_RADIAL_STYLE]}>
      <View style={[styles.container, styles.loadingContainer]}>
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonBadge} />
          <View style={styles.skeletonIcon} />
        </View>
        <View style={styles.skeletonProgress} />
        <View style={styles.skeletonCard}>
          <Animated.View style={[styles.skeletonShimmer, shimmerStyle]} />
          <View style={styles.skeletonArabicLine} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonLineNarrow} />
        </View>
      </View>
    </SafeAreaView>
  );
}

export function TodaySessionScreen() {
  const navigation = useNavigation<NavProp>();
  const styles = useMemo(() => makeStyles(), []);
  const autoPlayAudio = useSettingsStore((s) => s.autoPlayAudio);
  const reciterId = useSettingsStore((s) => s.reciterId);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [, setKnownMap] = useState<Map<string, WordStrength>>();
  const completedRef = useRef(false);
  const gradingRef = useRef(false);

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

        if (seq.totalCount === 0) {
          navigation.goBack();
          return;
        }

        setSessionState({
          sequence: seq,
          currentIndex: 0,
          revealed: false,
          selectedOption: null,
          answeredCorrect: null,
          isLoading: false,
          completed: false,
        });
        setKnownMap(buildKnownWordMap(learnedStatuses));

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
  }, [navigation, setKnownMap]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        stopAudio();
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

  const playCurrentAyah = useCallback(() => {
    if (!sessionState) return;
    const item = sessionState.sequence.items[sessionState.currentIndex];
    const verse = item?.word.verses[0];
    if (!verse) return;

    const reciter = getReciterById(reciterId);
    playAyah(ayahAudioUrl(reciter, verse.surahNumber, verse.ayahNumber));
  }, [reciterId, sessionState]);

  // Auto-play the recited ayah once the answer is revealed (recitation, never the meaning).
  useEffect(() => {
    if (!sessionState?.revealed || !autoPlayAudio) return;
    playCurrentAyah();

    return () => {
      stopAudio();
    };
  }, [autoPlayAudio, playCurrentAyah, sessionState?.revealed]);

  const finishSession = useCallback(
    (seq: SessionSequence) => {
      if (completedRef.current) return;
      completedRef.current = true;
      completeSession('TodayResult');
      recordEvent('practice_session_completed', { totalItems: seq.totalCount });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('TodayResult', { sessionWordsShown: seq.totalCount });
    },
    [navigation],
  );

  // The learner taps a meaning. Correctness is inferred and written to SM-2 (good / again).
  const handleAnswer = useCallback(
    async (option: string) => {
      if (!sessionState || sessionState.revealed || gradingRef.current) return;
      const cur = sessionState;
      const item = cur.sequence.items[cur.currentIndex];
      if (!item) return;
      gradingRef.current = true;

      const correct = option === item.word.meaning;
      const grade: Grade = correct ? 'good' : 'again';

      Haptics.notificationAsync(
        correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      );

      setSessionState(prev =>
        prev ? { ...prev, revealed: true, selectedOption: option, answeredCorrect: correct } : prev,
      );

      const isFirstPresentation = item.reviewCount === 0;
      if (isFirstPresentation && (item.type === 'new' || item.type === 'review')) {
        if (item.type === 'new') {
          recordEvent('word_seen', { wordId: item.wordId, word: item.word.arabic });
        }
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
    },
    [sessionState],
  );

  // Move on after feedback. A miss re-queues the word at the end of the session (no penalty).
  const handleContinue = useCallback(() => {
    if (!sessionState) return;
    const cur = sessionState;
    const item = cur.sequence.items[cur.currentIndex];
    if (!item) return;
    gradingRef.current = false;

    if (cur.answeredCorrect) {
      if (cur.currentIndex + 1 >= cur.sequence.totalCount) {
        finishSession(cur.sequence);
        setSessionState(prev => (prev ? { ...prev, completed: true } : prev));
      } else {
        setSessionState(prev =>
          prev
            ? { ...prev, currentIndex: prev.currentIndex + 1, revealed: false, selectedOption: null, answeredCorrect: null }
            : prev,
        );
      }
      return;
    }

    // Missed: requeue this word at the end so it comes back before the session closes.
    const newSeq = reinsertAtEnd(cur.sequence, item, 2);
    const nextIndex = cur.currentIndex + 1;
    if (nextIndex >= newSeq.totalCount) {
      finishSession(newSeq);
      setSessionState(prev => (prev ? { ...prev, sequence: newSeq, completed: true } : prev));
      return;
    }
    setSessionState(prev =>
      prev
        ? { ...prev, sequence: newSeq, currentIndex: nextIndex, revealed: false, selectedOption: null, answeredCorrect: null }
        : prev,
    );
  }, [sessionState, finishSession]);

  if (!sessionState) {
    return <LoadingSkeleton />;
  }

  const item = sessionState.sequence.items[sessionState.currentIndex];
  if (!item) {
    return (
      <SafeAreaView style={[styles.safeArea, SESSION_RADIAL_STYLE]}>
        <View style={[styles.centeredState, SESSION_RADIAL_STYLE]}>
          <Text style={styles.completionText}>You are all done for now.</Text>
          <Pressable style={styles.continueButton} onPress={() => navigation.navigate('Tabs')}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const verse = item.word.verses[0];
  const currentIndex = sessionState.currentIndex + 1;
  const totalItems = sessionState.sequence.totalCount;
  const progressPercent = totalItems > 0 ? (currentIndex / totalItems) * 100 : 0;
  const verseRef = formatVerseRef(verse);
  const ayahText = verse?.arabicText ?? item.word.arabic;
  const translation = verse?.translation ?? '';
  const revealed = sessionState.revealed;
  const options = buildOptions(sessionState.sequence, sessionState.currentIndex);

  return (
    <SafeAreaView style={[styles.safeArea, SESSION_RADIAL_STYLE]}>
      <View style={[styles.container, SESSION_RADIAL_STYLE]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.topIconButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AppIcon name="chevron-left" size={22} color={SESSION_LIGHT} />
          </Pressable>

          <Chip label={`${currentIndex} of ${totalItems}`} dark />

          <View style={styles.topIconButton}>
            <AppIcon name="dots" size={22} color={SESSION_LIGHT} />
          </View>
        </View>

        <View style={styles.progressTrack}>
          <LinearGradient
            colors={['#dcb04a', '#e9d49a']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.progressFill, { width: `${progressPercent}%` }]}
          />
        </View>

        <View style={styles.cardStage}>
          <View style={styles.floatingCard}>
            <View style={styles.cardHeaderRow}>
              <Pressable
                onPress={playCurrentAyah}
                style={styles.cardIconButton}
                accessibilityRole="button"
                accessibilityLabel="Play ayah audio"
              >
                <AppIcon name="speaker" size={20} color={mushafPalette.muted} />
              </Pressable>
              <Text style={styles.surahRef} numberOfLines={1}>{verseRef}</Text>
              <View style={styles.cardIconButton}>
                <AppIcon name="heart" size={20} color={mushafPalette.muted} />
              </View>
            </View>

            <ArabicText style={styles.ayahText} color={mushafPalette.ink}>
              {ayahText}
            </ArabicText>

            {/* Translation stays hidden until answered, so it never leaks the meaning. */}
            {revealed && translation.length > 0 && (
              <Text style={styles.translationText}>{translation}</Text>
            )}

            <View style={styles.learningSection}>
              <Text style={styles.eyebrow}>{'what does this word mean?'}</Text>
              <ArabicText style={styles.targetWord} color={mushafPalette.goldDeep}>
                {item.word.arabic}
              </ArabicText>
            </View>
          </View>
        </View>

        <View style={styles.optionsWrap}>
          {options.map((option) => {
            const isCorrectOption = option === item.word.meaning;
            const isSelected = option === sessionState.selectedOption;
            let optionStyle: ViewStyle = styles.option;
            let optionTextStyle: TextStyle = styles.optionText;
            if (revealed) {
              if (isCorrectOption) {
                optionStyle = styles.optionCorrect;
                optionTextStyle = styles.optionCorrectText;
              } else if (isSelected) {
                optionStyle = styles.optionWrong;
                optionTextStyle = styles.optionWrongText;
              } else {
                optionStyle = styles.optionDimmed;
                optionTextStyle = styles.optionDimmedText;
              }
            }
            return (
              <Pressable
                key={option}
                style={optionStyle}
                disabled={revealed}
                onPress={() => handleAnswer(option)}
                accessibilityRole="button"
                accessibilityLabel={option}
              >
                <Text style={optionTextStyle}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        {revealed && (
          <Pressable style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = () => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SESSION_BG,
  },
  container: {
    flex: 1,
    backgroundColor: SESSION_BG,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 30,
  },
  loadingContainer: {
    justifyContent: 'center',
  },
  centeredState: {
    flex: 1,
    backgroundColor: SESSION_BG,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  topIconButton: {
    width: 42,
    height: 42,
    marginVertical: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,.12)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 16,
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
  },
  cardStage: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  floatingCard: {
    backgroundColor: mushafPalette.paper,
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.4,
    shadowRadius: 48,
    elevation: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardIconButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahRef: {
    color: mushafPalette.ink,
    fontFamily: display.semibold,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  ayahText: {
    color: mushafPalette.ink,
    fontSize: 31,
    lineHeight: 60,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 18,
  },
  translationText: {
    color: mushafPalette.ink2,
    fontFamily: display.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  learningSection: {
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: mushafPalette.goldLine,
  },
  eyebrow: {
    color: mushafPalette.muted,
    fontFamily: display.bold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  targetWord: {
    color: mushafPalette.goldDeep,
    fontSize: 26,
    lineHeight: 42,
    textAlign: 'center',
    marginTop: 7,
  },
  optionsWrap: {
    gap: 10,
    marginTop: 8,
  },
  option: {
    backgroundColor: 'rgba(255,255,255,.07)',
    borderWidth: 1,
    borderColor: 'rgba(233,212,154,.22)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    color: SESSION_LIGHT,
    fontFamily: display.semibold,
    fontSize: 16,
    fontWeight: '600',
  },
  optionCorrect: {
    backgroundColor: 'rgba(120,170,90,.20)',
    borderWidth: 1,
    borderColor: '#8bbf6a',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCorrectText: {
    color: '#d7e8c2',
    fontFamily: display.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  optionWrong: {
    backgroundColor: 'rgba(190,90,70,.18)',
    borderWidth: 1,
    borderColor: '#c8775f',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionWrongText: {
    color: '#f0c9bd',
    fontFamily: display.semibold,
    fontSize: 16,
    fontWeight: '600',
  },
  optionDimmed: {
    backgroundColor: 'rgba(255,255,255,.04)',
    borderWidth: 1,
    borderColor: 'rgba(233,212,154,.10)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionDimmedText: {
    color: 'rgba(233,220,182,.45)',
    fontFamily: display.semibold,
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: mushafPalette.gold,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 14,
  },
  continueButtonText: {
    color: SESSION_DARK,
    fontFamily: display.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  completionText: {
    color: SESSION_LIGHT,
    fontFamily: display.medium,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,.08)',
  },
  skeletonBadge: {
    width: 86,
    height: 35,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,.08)',
  },
  skeletonProgress: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,.12)',
    marginBottom: 24,
  },
  skeletonCard: {
    minHeight: 360,
    backgroundColor: mushafPalette.paper,
    borderRadius: 26,
    overflow: 'hidden',
    padding: 22,
    justifyContent: 'center',
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
  },
  skeletonArabicLine: {
    height: 48,
    backgroundColor: 'rgba(36,27,14,.08)',
    marginVertical: 16,
    borderRadius: 8,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: 'rgba(36,27,14,.08)',
    marginVertical: 8,
    borderRadius: 8,
  },
  skeletonLineNarrow: {
    height: 14,
    backgroundColor: 'rgba(36,27,14,.08)',
    width: '70%',
    alignSelf: 'center',
    marginVertical: 8,
    borderRadius: 8,
  },
});
