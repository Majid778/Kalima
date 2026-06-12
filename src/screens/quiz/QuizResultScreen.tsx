import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import { colors } from '../../theme/colors';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = NativeStackScreenProps<RootStackParamList, 'QuizResult'>['route'];

export function QuizResultScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProp>();
  const { levelId, levelName, score, total } = route.params;

  const percent = total === 0 ? 0 : score / total;
  const percentDisplay = Math.round(percent * 100);
  const passed = percent >= 0.8;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleRetake = () => {
    navigation.replace('QuizSession', { levelId, levelName });
  };

  const handleDone = () => {
    navigation.navigate('Tabs');
  };

  return (
    <View style={styles.container}>
      <Animated.View style={styles.content} entering={FadeIn.duration(300)}>
        {/* Score circle */}
        <View style={styles.scoreCircleContainer}>
          <View style={[styles.scoreCircle, { borderColor: passed ? colors.success : colors.error }]}>
            <Text style={styles.scorePercent}>{percentDisplay}%</Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
        </View>

        {/* Result message */}
        <Animated.View entering={SlideInUp.delay(200)}>
          <Text style={[styles.resultTitle, { color: passed ? colors.success : colors.error }]}>
            {passed ? 'Great Job!' : 'Keep Practicing'}
          </Text>
          <Text style={styles.resultSubtitle}>
            {score} out of {total} questions correct
          </Text>
        </Animated.View>

        {/* Unlock message */}
        {passed && (
          <Animated.View
            style={styles.unlockedMessage}
            entering={SlideInUp.delay(400)}
          >
            <Ionicons name="star" size={20} color={colors.warning} />
            <Text style={styles.unlockedText}>Next level unlocked!</Text>
          </Animated.View>
        )}

        {/* Pass gate info */}
        <View style={styles.passGateInfo}>
          <Text style={styles.passGateLabel}>Pass: 80% or higher</Text>
          <View style={styles.passGateBar}>
            <View
              style={[
                styles.passGateFill,
                {
                  width: `${Math.min(percentDisplay, 100)}%`,
                  backgroundColor: passed ? colors.success : colors.error,
                },
              ]}
            />
          </View>
        </View>
      </Animated.View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable style={[styles.button, styles.buttonSecondary]} onPress={handleRetake}>
          <Text style={styles.buttonSecondaryText}>Retake</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.buttonPrimary]} onPress={handleDone}>
          <Text style={styles.buttonPrimaryText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCircleContainer: {
    marginBottom: 32,
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scorePercent: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.text,
  },
  scoreLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  unlockedMessage: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  unlockedText: {
    fontSize: 16,
    color: colors.warning,
    fontWeight: '600',
  },
  passGateInfo: {
    marginTop: 32,
    alignItems: 'center',
    width: '100%',
  },
  passGateLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  passGateBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  passGateFill: {
    height: '100%',
    borderRadius: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
