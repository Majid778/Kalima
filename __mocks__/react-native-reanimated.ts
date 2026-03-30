const { View, Text, ScrollView } = jest.requireActual('react-native');

export function useSharedValue(initialValue: unknown) {
  return { value: initialValue };
}

export function useAnimatedStyle(callback: () => object) {
  return callback();
}

export function withTiming(toValue: unknown) {
  return toValue;
}

export function withSpring(toValue: unknown) {
  return toValue;
}

export function runOnJS(fn: Function) {
  return fn;
}

export const FadeIn = {};
export const FadeOut = {};

export const Animated = {
  View,
  Text,
  ScrollView,
};

export default {
  createAnimatedComponent: (component: unknown) => component,
};
