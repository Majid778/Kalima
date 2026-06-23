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

  return {
    __esModule: true,
    default: {
      Text: RNText,
      View: RNView,
    },
    runOnJS: (fn: Function) => fn,
    useAnimatedStyle: (callback: () => object) => callback(),
    useSharedValue: (value: unknown) => ({ value }),
    withTiming: (value: unknown) => value,
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
