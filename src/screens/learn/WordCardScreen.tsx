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
import { getWordsForLevel, WordWithVerses } from '../../services/wordService';
import { getLocalToday } from '../../services/sm2';
import { db } from '../../data/database';
import { WordCard } from '../../components/WordCard';
import { useStreakStore } from '../../stores/streakStore';
import { colors } from '../../theme/colors';

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
  const completionActivityRecordedRef = useRef(false);

  const translateX = useSharedValue(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getWordsForLevel(db, levelId);
        if (mounted) {
          setWords(data);
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
          <WordCard word={words[currentIndex]} />
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
