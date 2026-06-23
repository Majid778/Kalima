import React, { useEffect, useState } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion as useNativeReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { AppIcon } from './AppIcon';
import { display } from '../theme/typography';

export interface PrimaryCTAProps {
  label: string;
  onPress: () => void;
  arrow?: boolean;
  gleam?: boolean;
  style?: ViewStyle;
}

const useReducedMotion =
  typeof useNativeReducedMotion === 'function' ? useNativeReducedMotion : () => false;

// Sweep then pause cadence (ms).
const SWEEP_MS = 2200;
const PAUSE_MS = 1200;
const CYCLE_MS = SWEEP_MS + PAUSE_MS;
const SWEEP_FRACTION = SWEEP_MS / CYCLE_MS;

// Fraction of the button width the gleam band occupies.
const BAND_WIDTH_FRACTION = 0.42;

export const PrimaryCTA: React.FC<PrimaryCTAProps> = ({
  label,
  onPress,
  arrow = false,
  gleam = false,
  style,
}) => {
  const reduceMotion = useReducedMotion();
  const animate = gleam && !reduceMotion;

  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (!animate) {
      progress.value = 0;
      glow.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: CYCLE_MS, easing: Easing.linear }),
      -1,
      false,
    );
    glow.value = 0;
    glow.value = withRepeat(
      withTiming(1, { duration: CYCLE_MS / 2, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [animate, glow, progress]);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  // The light band sweeps from fully off-screen left to fully off-screen right
  // during the sweep window, then holds off-screen during the pause.
  const bandWidth = Math.max(width * BAND_WIDTH_FRACTION, 1);
  const startX = -bandWidth;
  const endX = width;

  const gleamStyle = useAnimatedStyle(() => {
    const sweep = Math.min(progress.value / SWEEP_FRACTION, 1);
    const translateX = interpolate(sweep, [0, 1], [startX, endX]);
    const opacity = progress.value <= SWEEP_FRACTION ? 1 : 0;
    return {
      opacity,
      transform: [{ translateX }, { skewX: '-18deg' }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(glow.value, [0, 1], [0.34, 0.6]);
    const shadowRadius = interpolate(glow.value, [0, 1], [22, 30]);
    const elevation = interpolate(glow.value, [0, 1], [5, 9]);
    return { shadowOpacity, shadowRadius, elevation };
  });

  const Container = animate ? Animated.View : View;

  return (
    <Container style={[styles.container, animate ? glowStyle : null, style]}>
      <Pressable onPress={onPress} style={styles.pressable} onLayout={onLayout}>
        <LinearGradient
          colors={['#caa033', '#a9760d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          {animate && width > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[styles.gleam, { width: bandWidth }, gleamStyle]}
            >
              <LinearGradient
                colors={[
                  'rgba(255,250,235,0)',
                  'rgba(255,250,235,0.45)',
                  'rgba(255,250,235,0)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}
          <View style={styles.content}>
            <Text style={[styles.label, { fontFamily: display.bold }]}>{label}</Text>
            {arrow && (
              <View style={styles.arrowContainer}>
                <AppIcon name="arrow-right" size={20} color="#fffaf0" />
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    shadowColor: 'rgba(168, 118, 13, 1)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.34,
    shadowRadius: 22,
    elevation: 5,
  },
  pressable: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gleam: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    left: 0,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  label: {
    fontSize: 20,
    color: '#fffaf0',
    fontWeight: '700',
  },
  arrowContainer: {
    position: 'absolute',
    right: 20,
  },
});
