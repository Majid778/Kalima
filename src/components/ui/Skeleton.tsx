import React, { useEffect, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { motionValue, TIMINGS } from '../../theme/motion';
import { ThemeTokens } from '../../theme/theme';
import { useTheme } from '../../theme/useTheme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Skeleton({
  width = '100%',
  height = 20,
  radius = 6,
  style,
  testID,
}: SkeletonProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = motionValue(
      reduceMotion,
      withRepeat(
        withTiming(1, { duration: TIMINGS.slow * 3, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      ),
      1,
    );
  }, [progress, reduceMotion]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -80 + progress.value * 160 }],
  }));

  return (
    <View
      style={[
        styles.skeleton,
        { borderRadius: radius, height, width },
        style,
      ]}
      testID={testID}
    >
      <Animated.View style={[styles.shimmer, shimmerStyle]} />
    </View>
  );
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  skeleton: {
    backgroundColor: theme.surfaces.surfaceElevated,
    overflow: 'hidden',
  },
  shimmer: {
    backgroundColor: theme.surfaces.border,
    height: '100%',
    width: 80,
  },
});