import React, { useEffect, useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion as useNativeReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Button, SacredNumber } from './ui';
import { hapticSuccess, motionValue, SPRINGS, TIMINGS } from '../theme/motion';
import type { ThemeTokens } from '../theme/theme';
import { serifFamily } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

interface MilestoneMomentProps {
  visible: boolean;
  percent: number;
  onDismiss: () => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);
const useReducedMotion = typeof useNativeReducedMotion === 'function'
  ? useNativeReducedMotion
  : () => false;

export function MilestoneMoment({
  visible,
  percent,
  onDismiss,
}: MilestoneMomentProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.96);
  const translateY = useSharedValue(12);
  const displayPercent = Math.round(percent * 100);

  useEffect(() => {
    if (!visible) {
      opacity.value = 0;
      scale.value = 0.96;
      translateY.value = 12;
      return;
    }

    void hapticSuccess();

    opacity.value = motionValue(
      reduceMotion,
      withTiming(1, { duration: TIMINGS.base }),
      1,
    );
    scale.value = motionValue(
      reduceMotion,
      withSpring(1, SPRINGS.gentle),
      1,
    );
    translateY.value = motionValue(
      reduceMotion,
      withSpring(0, SPRINGS.gentle),
      0,
    );
  }, [opacity, reduceMotion, scale, translateY, visible]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <AnimatedView style={[styles.card, animatedCardStyle]}>
          <Text style={styles.kicker}>Milestone reached</Text>
          <SacredNumber
            percent={percent}
            label="of the Qur'an's words"
            style={styles.number}
          />
          <Text style={styles.message}>
            You now understand {displayPercent}% of the Qur'an's words
          </Text>
          <Text style={styles.submessage}>
            Alhamdulillah - keep going, one word at a time
          </Text>
          <Button
            label="Continue"
            onPress={onDismiss}
            style={styles.button}
          />
        </AnimatedView>
      </View>
    </Modal>
  );
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaces.overlay,
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    backgroundColor: theme.surfaces.surfaceElevated,
    borderColor: theme.surfaces.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  kicker: {
    color: theme.sacred.sacredMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  number: {
    marginBottom: 16,
  },
  message: {
    color: theme.text.textPrimary,
    fontFamily: serifFamily,
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 29,
    marginBottom: 10,
    textAlign: 'center',
  },
  submessage: {
    color: theme.text.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
});
