import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import { db } from '../../data/database';
import { getDueCards, gradeCard, DueCard } from '../../services/practiceService';
import { previewGrades, getLocalToday, SM2State, Grade } from '../../services/sm2';
import { GradeButtons } from '../../components/GradeButtons';
import { WordCard } from '../../components/WordCard';
import { useStreakStore } from '../../stores/streakStore';
import { colors } from '../../theme/colors';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function PracticeSessionScreen() {
  const navigation = useNavigation<NavProp>();
  const [cards, setCards] = useState<DueCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [today] = useState(() => getLocalToday());
  const completionActivityRecordedRef = useRef(false);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const dueCards = await getDueCards(db, today, 200);
      setCards(dueCards);
    } finally {
      setIsLoading(false);
    }
  };

  // Update header with remaining count
  useEffect(() => {
    if (cards.length > 0 && !isComplete) {
      const remaining = cards.length - currentIndex;
      navigation.setOptions({
        title: `${remaining} cards left`,
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      });
    }
  }, [cards.length, currentIndex, isComplete, navigation]);

  const currentCard = cards[currentIndex];
  const currentSM2State: SM2State | null = currentCard
    ? {
        easeFactor: currentCard.easeFactor,
        interval: currentCard.interval,
        repetitions: currentCard.repetitions,
        status: currentCard.status as SM2State['status'],
      }
    : null;

  const handleGrade = useCallback(
    async (grade: Grade) => {
      if (!currentCard || !currentSM2State) return;

      await gradeCard(db, currentCard.id, currentSM2State, grade, today);

      setIsRevealed(false);

      if (currentIndex < cards.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        if (!completionActivityRecordedRef.current) {
          completionActivityRecordedRef.current = true;
          useStreakStore.getState().recordActivity(getLocalToday());
        }
        setIsComplete(true);
      }
    },
    [currentCard, currentSM2State, currentIndex, cards.length, today],
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // No cards due
  if (cards.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No cards due</Text>
        <Pressable style={styles.doneButton} onPress={() => navigation.goBack()}>
          <Text style={styles.doneButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // Session complete
  if (isComplete) {
    return (
      <View style={styles.centered}>
        <Text style={styles.completeTitle}>Practice Complete</Text>
        <Text style={styles.completeSubtitle}>{cards.length} cards reviewed</Text>
        <Pressable style={styles.doneButton} onPress={() => navigation.goBack()}>
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  // Active session
  return (
    <View style={styles.container}>
      {/* Daily cap banner */}
      {cards.length === 200 && (
        <Text style={styles.capBanner}>You've hit today's limit</Text>
      )}

      {/* Card area */}
      {!isRevealed ? (
        // Front: Arabic only, tap anywhere to reveal
        <Pressable style={styles.cardArea} onPress={() => setIsRevealed(true)}>
          <WordCard word={currentCard} showFront={false} />
          <Text style={styles.tapHint}>Tap to reveal</Text>
        </Pressable>
      ) : (
        // Back: full card + grade buttons
        <View style={styles.cardArea}>
          <Animated.View entering={FadeIn.duration(250)} style={styles.revealContainer}>
            <WordCard word={currentCard} showFront={true} />
          </Animated.View>
          <GradeButtons
            intervals={previewGrades(currentSM2State!, today)}
            onGrade={handleGrade}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
  },
  revealContainer: {
    flex: 1,
  },
  tapHint: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingBottom: 32,
  },
  capBanner: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
  },
  completeTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  completeSubtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 32,
  },
  doneButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
