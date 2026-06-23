import React, { useEffect, useMemo } from 'react';
import { View, Text, Pressable, SafeAreaView, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import { mushafPalette } from '../../theme/palette';
import { display } from '../../theme/typography';
import { useTheme } from '../../theme/useTheme';
import { AppIcon } from '../../components/AppIcon';
import { PrimaryCTA } from '../../components/PrimaryCTA';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = NativeStackScreenProps<RootStackParamList, 'QuizResult'>['route'];

export function QuizResultScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProp>();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#fdf3d6', mushafPalette.parchment]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.75 }} style={styles.background}>
        <View style={styles.content}>
          <Animated.View style={styles.scoreCircleContainer} entering={FadeInDown.duration(500).delay(200)}>
            <View style={[styles.scoreCircle, { borderColor: passed ? mushafPalette.olive : mushafPalette.clay }]}>
              <Text style={styles.scorePercent}>{percentDisplay}%</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(400)}>
            <Text style={[styles.resultTitle, { color: passed ? mushafPalette.olive : mushafPalette.clay }]}>
              {passed ? 'Great Job' : 'Keep Practicing'}
            </Text>
            <Text style={styles.resultSubtitle}>
              {score} out of {total} questions correct
            </Text>
          </Animated.View>

          {passed && (
            <Animated.View style={styles.unlockedMessage} entering={FadeInDown.duration(500).delay(600)}>
              <AppIcon name="star" size={20} color={mushafPalette.gold} />
              <Text style={styles.unlockedText}>Next level unlocked</Text>
            </Animated.View>
          )}

          <View style={styles.passGateInfo}>
            <Text style={styles.passGateLabel}>Pass: 80% or higher</Text>
            <View style={styles.passGateBar}>
              <View
                style={[
                  styles.passGateFill,
                  {
                    width: `${Math.min(percentDisplay, 100)}%`,
                    backgroundColor: passed ? mushafPalette.olive : mushafPalette.clay,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable style={[styles.button, styles.buttonSecondary]} onPress={handleRetake}>
            <Text style={styles.buttonSecondaryText}>Retake</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.buttonPrimary]} onPress={handleDone}>
            <Text style={styles.buttonPrimaryText}>Done</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: mushafPalette.parchment,
    },
    background: {
      flex: 1,
      justifyContent: 'space-between',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
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
      backgroundColor: mushafPalette.paper,
      shadowColor: 'rgba(0,0,0,.08)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 16,
    },
    scorePercent: {
      fontSize: 56,
      fontWeight: '700',
      color: mushafPalette.ink,
      fontFamily: display.bold,
    },
    scoreLabel: {
      fontSize: 14,
      color: mushafPalette.muted,
      marginTop: 4,
      fontFamily: display.semibold,
    },
    resultTitle: {
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
      fontFamily: display.bold,
    },
    resultSubtitle: {
      fontSize: 16,
      color: mushafPalette.ink2,
      textAlign: 'center',
      fontFamily: display.regular,
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
      color: mushafPalette.gold,
      fontWeight: '600',
      fontFamily: display.semibold,
    },
    passGateInfo: {
      marginTop: 32,
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: 20,
    },
    passGateLabel: {
      fontSize: 12,
      color: mushafPalette.muted,
      marginBottom: 8,
      fontFamily: display.semibold,
    },
    passGateBar: {
      width: '100%',
      height: 8,
      backgroundColor: mushafPalette.goldRing,
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
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 18,
      alignItems: 'center',
    },
    buttonPrimary: {
      backgroundColor: mushafPalette.gold,
    },
    buttonSecondary: {
      backgroundColor: mushafPalette.paper,
      borderWidth: 1,
      borderColor: mushafPalette.goldLine,
    },
    buttonPrimaryText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fffaf0',
      fontFamily: display.semibold,
    },
    buttonSecondaryText: {
      fontSize: 16,
      fontWeight: '600',
      color: mushafPalette.ink,
      fontFamily: display.semibold,
    },
  });
