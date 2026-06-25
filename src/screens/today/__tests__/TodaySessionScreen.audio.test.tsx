import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { TodaySessionScreen } from '../TodaySessionScreen';
import { useSettingsStore } from '../../../stores/settingsStore';
import { playAyah, stopAudio } from '../../../services/audio/audioRuntime';

jest.mock('@react-navigation/native', () => {
  // Return a STABLE navigation object (like the real useNavigation) so effects
  // that depend on `navigation` do not re-run and reset session state on every render.
  const navigation = { goBack: jest.fn(), navigate: jest.fn() };
  return {
    useNavigation: () => navigation,
    useFocusEffect: jest.fn(),
  };
});

jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
  Gesture: {
    Pan: () => ({
      enabled: jest.fn().mockReturnThis(),
      onUpdate: jest.fn().mockReturnThis(),
      onEnd: jest.fn().mockReturnThis(),
    }),
  },
}));

jest.mock('react-native-reanimated', () => {
  const { View: RNView } = jest.requireActual('react-native');

  return {
    __esModule: true,
    default: {
      View: RNView,
    },
    runOnJS: (fn: Function) => fn,
    useAnimatedStyle: (callback: () => object) => callback(),
    useReducedMotion: () => true,
    useSharedValue: (value: unknown) => ({ value }),
    withRepeat: (value: unknown) => value,
    withSpring: (value: unknown) => value,
    withTiming: (value: unknown) => value,
  };
});

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('expo-linear-gradient', () => {
  const { View: RNView } = jest.requireActual('react-native');
  return { LinearGradient: ({ children, ...props }: { children: React.ReactNode }) => <RNView {...props}>{children}</RNView> };
});

jest.mock('../../../data/database', () => ({
  db: {},
}));

jest.mock('../../../services/practiceService', () => ({
  getDueCards: jest.fn(async () => []),
  getProgressWordIds: jest.fn(async () => []),
  getLearnedWordStatuses: jest.fn(async () => []),
  gradeCard: jest.fn(async () => ({
    easeFactor: 2.5,
    interval: 1,
    repetitions: 1,
    dueDate: '2026-06-15',
    status: 'learning',
  })),
}));

jest.mock('../../../services/wordService', () => ({
  getWordsForLevel: jest.fn(async () => [
    {
      id: 1,
      arabic: 'كتاب',
      transliteration: 'kitab',
      meaning: 'book',
      root: null,
      partOfSpeech: null,
      occurrenceCount: 1,
      verses: [
        {
          surahNumber: 1,
          ayahNumber: 2,
          arabicText: 'الحمد لله رب العالمين',
          translation: 'All praise is for Allah',
          wordPosition: 0,
        },
      ],
    },
    {
      id: 2,
      arabic: 'نور',
      transliteration: 'nur',
      meaning: 'light',
      root: null,
      partOfSpeech: null,
      occurrenceCount: 1,
      verses: [
        {
          surahNumber: 2,
          ayahNumber: 3,
          arabicText: 'الذين يؤمنون بالغيب',
          translation: 'Those who believe in the unseen',
          wordPosition: 0,
        },
      ],
    },
  ]),
}));

jest.mock('../../../components/WordCard', () => ({
  WordCard: ({ showFront }: { showFront?: boolean }) => {
    const { Text: RNText } = jest.requireActual('react-native');
    return <RNText>{showFront ? 'revealed card' : 'front card'}</RNText>;
  },
}));

jest.mock('../../../components/GradeButtons', () => ({
  GradeButtons: ({ onGrade }: { onGrade: (grade: string) => void }) => {
    const { Pressable: RNPressable, Text: RNText } = jest.requireActual('react-native');
    return (
      <RNPressable testID="grade-good" onPress={() => onGrade('good')}>
        <RNText>Good</RNText>
      </RNPressable>
    );
  },
}));

jest.mock('../../../components/WordStrengthBadge', () => ({
  WordStrengthBadge: () => {
    const { View: RNView } = jest.requireActual('react-native');
    return <RNView />;
  },
}));

jest.mock('../../../services/instrumentationRuntime', () => ({
  recordEvent: jest.fn(),
  startSession: jest.fn(),
  completeSession: jest.fn(),
  abandonSession: jest.fn(),
  recordCardReviewed: jest.fn(),
}));

jest.mock('../../../services/audio/audioRuntime', () => ({
  playAyah: jest.fn(async () => undefined),
  stopAudio: jest.fn(async () => undefined),
}));

jest.mock('../../../services/audio/audioSource', () => ({
  DEFAULT_RECITER_ID: 'alafasy',
  getReciterById: jest.fn((id: string) => ({ id, name: id, baseUrl: `https://audio/${id}` })),
  ayahAudioUrl: jest.fn((reciter: { id: string }, surahNumber: number, ayahNumber: number) =>
    `audio://${reciter.id}/${surahNumber}/${ayahNumber}`,
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
  useSettingsStore.setState({
    theme: 'dark',
    arabicFontSize: 'medium',
    showTransliteration: true,
    notifications: { enabled: false, maxPerWeek: 3, preferredHour: 19 },
    reciterId: 'husary',
    autoPlayAudio: true,
  });
});

describe('TodaySessionScreen recognition flow', () => {
  test('auto-plays the ayah after a correct tap and stops when advancing to the next item', async () => {
    const { getByText } = render(<TodaySessionScreen />);

    // First card: the Arabic word كتاب; its meaning "book" appears as a tappable option.
    await waitFor(() => expect(getByText('book')).toBeTruthy());

    expect(playAyah).not.toHaveBeenCalled();

    // Tap the correct meaning -> the answer is revealed and the recited ayah auto-plays.
    fireEvent.press(getByText('book'));

    await waitFor(() => {
      expect(playAyah).toHaveBeenCalledWith('audio://husary/1/2');
    });

    // Continue to the next item -> audio stops.
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(stopAudio).toHaveBeenCalled();
    });
  });
});
