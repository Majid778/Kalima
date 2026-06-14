import * as Haptics from 'expo-haptics';

export const SPRINGS = {
  gentle: {
    damping: 28,
    stiffness: 160,
    mass: 1,
  },
  snappy: {
    damping: 24,
    stiffness: 210,
    mass: 0.85,
  },
  bouncy: {
    damping: 16,
    stiffness: 180,
    mass: 0.9,
  },
} as const;

export const TIMINGS = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

const safeHaptic = async (run: () => Promise<void>): Promise<void> => {
  try {
    await run();
  } catch {
    // Haptics are optional feedback and should never block app flows.
  }
};

export const hapticSelection = (): Promise<void> =>
  safeHaptic(() => Haptics.selectionAsync());

export const hapticLight = (): Promise<void> =>
  safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));

export const hapticSuccess = (): Promise<void> =>
  safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));

export const hapticWarning = (): Promise<void> =>
  safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));

export const motionValue = <T>(reduced: boolean, animated: T, instant: T): T =>
  reduced ? instant : animated;