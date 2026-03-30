import React from 'react';
import { View } from 'react-native';

export const GestureHandlerRootView = ({ children, ...props }: any) =>
  React.createElement(View, props, children);

export const GestureDetector = ({ children }: any) => children;

function createChainableGesture() {
  const gesture: Record<string, Function> = {};
  const handler = {
    onBegin: () => handler,
    onStart: () => handler,
    onUpdate: () => handler,
    onEnd: () => handler,
    onFinalize: () => handler,
    onChange: () => handler,
    enabled: () => handler,
    minDistance: () => handler,
    activeOffsetX: () => handler,
    activeOffsetY: () => handler,
    failOffsetX: () => handler,
    failOffsetY: () => handler,
    direction: () => handler,
    numberOfTaps: () => handler,
    maxDuration: () => handler,
  };
  return handler;
}

export const Gesture = {
  Pan: () => createChainableGesture(),
  Tap: () => createChainableGesture(),
  Fling: () => createChainableGesture(),
};

export const State = {
  UNDETERMINED: 0,
  BEGAN: 1,
  ACTIVE: 2,
  END: 3,
  CANCELLED: 4,
  FAILED: 5,
};

export const Directions = {
  RIGHT: 1,
  LEFT: 2,
  UP: 3,
  DOWN: 4,
};
