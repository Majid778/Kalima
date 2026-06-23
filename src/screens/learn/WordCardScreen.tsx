import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Pressable, Text, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import {
  getWordsByRoot,
  getWordsForLevel,
  type RootSibling,
  WordWithVerses,
} from '../../services/wordService';
import { getLearnedWordStatuses, introduceWords } from '../../services/practiceService';
import { getLocalToday } from '../../services/sm2';
import { db } from '../../data/database';
import { WordCard } from '../../components/WordCard';
import { AppIcon } from '../../components/AppIcon';
import { PrimaryCTA } from '../../components/PrimaryCTA';
import { useStreakStore } from '../../stores/streakStore';
import { mushafPalette } from '../../theme/palette';
import { display } from '../../theme/typography';
import { buildKnownWordMap } from '../../services/arabicNormalize';
import type { WordStrength } from '../../services/wordStrengthService';

const SWIPE_THRESHOLD = 50;

type WordCardRouteProp = RouteProp<RootStackParamList, 'WordCard'>;
type WordCardNavProp = NativeStackNavigationProp<RootStackParamList, 'WordCard'>;

export function WordCardScreen() {
  const navigation = useNavigation<WordCardNavProp>();
  const route = useRoute<WordCardRouteProp>();
  const { levelId, levelName } = route.params;

  const [words, setWords] = useState<WordWithVerses[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rootSiblings, setRootSiblings] = useState<RootSibling[]>([]);
  const [knownMap, setKnownMap] = useState<Map<string, WordStrength>>();
  const completionActivityRecordedRef = useRef(false);

  const translateX = useSharedValue(0);
  const currentWord = words[currentIndex];

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getWordsForLevel(db, levelId);
        if (mounted) {
          setWords(data);
        }
        // Exploring a level in Learn introduces its words into the SRS queue
        // (status 'new', due today) so they become practiceable. Existing
        // progress is preserved (onConflictDoNothing).
        await introduceWords(db, data.map((w) => w.id), getLocalToday());
        const learnedStatuses = await getLearnedWordStatuses(db);
        if (mounted) {
          setKnownMap(buildKnownWordMap(learnedStatuses));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, [levelId]);

  useEffect(() => {
    let mounted = true;

    async function loadRootSiblings() {
      if (!currentWord) {
        setRootSiblings([]);
        return;
      }

      const siblings = await getWordsByRoot(db, currentWord.root, currentWord.id);
      if (mounted) {
        setRootSiblings(siblings);
      }
    }

    loadRootSiblings();
    return () => { mounted = false; };
  }, [currentWord]);

  const goToNext = useCallback(() => {
    setCurrentIndex((i) => {
      const nextIndex = Math.min(i + 1, words.length - 1);

      if (
        nextIndex === words.length - 1 &&
        i !== nextIndex &&
        !completionActivityRecordedRef.current
      ) {
        completionActivityRecordedRef.current = true;
        useStreakStore.getState().recordActivity(getLocalToday());
      }

      return nextIndex;
    });
  }, [words.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  const selectWord = useCallback((wordId: number) => {
    const siblingIndex = words.findIndex(word => word.id === wordId);
    if (siblingIndex >= 0) {
      setCurrentIndex(siblingIndex);
    }
  }, [words]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX < -SWIPE_THRESHOLD) {
        runOnJS(goToNext)();
      } else if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(goToPrevious)();
      }
      translateX.value = withTiming(0, { duration: 200 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const renderHeader = (counter: string) => (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <AppIcon
          name="chevron-left"
          size={22}
          color={mushafPalette.ink}
          strokeWidth={1.8}
        />
      </Pressable>
      <View style={styles.headerCopy}>
        <Text numberOfLines={1} style={styles.headerTitle}>{levelName}</Text>
        <Text style={styles.headerCounter}>{counter}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader('Loading words')}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={mushafPalette.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (words.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader('No words')}
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>
            No words in this level yet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader(`Word ${currentIndex + 1} of ${words.length}`)}
      <View style={styles.cardArea}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.cardWrapper, animatedStyle]}>
            <WordCard
              word={currentWord}
              rootSiblings={rootSiblings}
              knownMap={knownMap}
              onSelectWord={selectWord}
            />
          </Animated.View>
        </GestureDetector>
      </View>
      <View style={styles.quizButtonContainer}>
        <PrimaryCTA
          label="Take the quiz"
          arrow={true}
          onPress={() => navigation.navigate('QuizSession', { levelId, levelName })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mushafPalette.parchment,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    backgroundColor: mushafPalette.parchment,
    borderBottomColor: mushafPalette.goldLine,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: mushafPalette.paper,
    borderColor: mushafPalette.goldLine,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    color: mushafPalette.ink,
    fontFamily: display.bold,
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 27,
  },
  headerCounter: {
    color: mushafPalette.muted,
    fontFamily: display.semibold,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 1,
  },
  cardArea: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  cardWrapper: {
    flex: 1,
  },
  emptyText: {
    color: mushafPalette.muted,
    fontFamily: display.regular,
    fontSize: 16,
  },
  quizButtonContainer: {
    backgroundColor: mushafPalette.parchment,
    borderTopColor: mushafPalette.goldLine,
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
});
