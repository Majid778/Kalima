import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { WordCardScreen } from '../WordCardScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: {
      levelId: 1,
      levelName: 'Level 1',
    },
  }),
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
  Gesture: {
    Pan: () => ({
      onUpdate: jest.fn().mockReturnThis(),
      onEnd: jest.fn().mockReturnThis(),
    }),
  },
}));

jest.mock('react-native-reanimated', () => {
  const { Text: RNText, View: RNView } = jest.requireActual('react-native');
  const ease = (x: number) => x;
  const Easing = { linear: ease, ease, quad: ease, sin: ease, inOut: () => ease, out: () => ease, bezier: () => ease };

  return {
    __esModule: true,
    default: {
      Text: RNText,
      View: RNView,
      createAnimatedComponent: (c: unknown) => c,
    },
    Easing,
    interpolate: (value: unknown) => value,
    runOnJS: (fn: Function) => fn,
    useAnimatedStyle: (callback: () => object) => callback(),
    useReducedMotion: () => true,
    useSharedValue: (value: unknown) => ({ value }),
    withRepeat: (value: unknown) => value,
    withDelay: (_d: unknown, value: unknown) => value,
    withSequence: (...args: unknown[]) => args[0],
    withSpring: (value: unknown) => value,
    withTiming: (value: unknown) => value,
    cancelAnimation: () => {},
  };
});

jest.mock('../../../data/database', () => ({
  db: {},
}));

jest.mock('../../../services/practiceService', () => ({
  getLearnedWordStatuses: jest.fn(async () => []),
  introduceWords: jest.fn(async () => undefined),
}));

jest.mock('../../../services/sm2', () => ({
  getLocalToday: jest.fn(() => '2026-06-23'),
}));

jest.mock('../../../services/wordService', () => ({
  getWordsByRoot: jest.fn(async () => []),
  getWordsForLevel: jest.fn(async () => [
    {
      id: 1,
      arabic: 'كتاب',
      transliteration: 'kitab',
      meaning: 'book',
      root: 'ك ت ب',
      partOfSpeech: 'noun',
      occurrenceCount: 1,
      verses: [],
    },
    {
      id: 2,
      arabic: 'نور',
      transliteration: 'nur',
      meaning: 'light',
      root: 'ن و ر',
      partOfSpeech: 'noun',
      occurrenceCount: 1,
      verses: [],
    },
  ]),
}));

jest.mock('../../../components/WordCard', () => ({
  WordCard: () => {
    const { Text: RNText } = jest.requireActual('react-native');
    return <RNText>word card</RNText>;
  },
}));

describe('WordCardScreen parchment chrome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the custom parchment header and bottom quiz action', async () => {
    const { getByText } = render(<WordCardScreen />);

    await waitFor(() => expect(getByText('word card')).toBeTruthy());

    expect(getByText('Level 1')).toBeTruthy();
    expect(getByText('Word 1 of 2')).toBeTruthy();
    expect(getByText('Take the quiz')).toBeTruthy();
  });
});
