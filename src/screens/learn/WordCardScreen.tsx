import React, { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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
import { useStreakStore } from '../../stores/streakStore';
import { colors } from '../../theme/colors';
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

  // Update header with level name and position indicator
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: levelName,
      headerRight: () =>
        words.length > 0 ? (
          <View style={styles.headerRight}>
            <Animated.Text style={styles.positionText}>
              Word {currentIndex + 1} of {words.length}
            </Animated.Text>
          </View>
        ) : null,
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      headerBackTitle: '',
    });
  }, [navigation, levelName, currentIndex, words.length]);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (words.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.Text style={styles.emptyText}>
          No words in this level yet.
        </Animated.Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 12,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    flex: 1,
  },
  headerRight: {
    marginRight: 8,
  },
  positionText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
  },
});
