import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ReaderScreen } from '../ReaderScreen';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
  }),
}));

jest.mock('react-native-reanimated', () => {
  const { View: RNView } = jest.requireActual('react-native');

  return {
    __esModule: true,
    default: {
      View: RNView,
    },
    interpolateColor: jest.fn(() => '#f3ead4'),
    useAnimatedStyle: (callback: () => object) => callback(),
    useReducedMotion: () => true,
    useSharedValue: (value: unknown) => ({ value }),
    withRepeat: (value: unknown) => value,
    withTiming: (value: unknown) => value,
  };
});

jest.mock('../../../data/database', () => ({
  db: {},
}));

jest.mock('../../../components/ui', () => {
  const React = require('react');
  const { Text: RNText, View: RNView } = jest.requireActual('react-native');

  return {
    Card: ({ children }: { children: React.ReactNode }) => <RNView>{children}</RNView>,
    Chip: ({ children }: { children: React.ReactNode }) => <RNText>{children}</RNText>,
    EmptyState: ({ title }: { title: string }) => <RNText>{title}</RNText>,
    Skeleton: () => <RNView />,
  };
});

jest.mock('../../../services/practiceService', () => ({
  getLearnedWordStatuses: jest.fn(async () => []),
  getReaderEntries: jest.fn(async () => [
    {
      wordId: 1,
      arabic: 'كتاب',
      transliteration: 'kitab',
      meaning: 'book',
      root: 'ك ت ب',
      status: 'review',
      interval: 1,
      repetitions: 1,
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
  ]),
}));

jest.mock('../../../components/VerseTokens', () => ({
  VerseTokens: () => {
    const { Text: RNText } = jest.requireActual('react-native');
    return <RNText>verse tokens</RNText>;
  },
}));

jest.mock('../../../components/WordStrengthBadge', () => ({
  WordStrengthBadge: () => {
    const { View: RNView } = jest.requireActual('react-native');
    return <RNView />;
  },
}));

jest.mock('../../../components/audio/AyahAudioButton', () => ({
  AyahAudioButton: () => {
    const { View: RNView } = jest.requireActual('react-native');
    return <RNView />;
  },
}));

describe('ReaderScreen parchment chrome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the custom parchment header with entry count', async () => {
    const { getByText } = render(<ReaderScreen />);

    await waitFor(() => expect(getByText('verse tokens')).toBeTruthy());

    expect(getByText('Reader')).toBeTruthy();
    expect(getByText('1 word')).toBeTruthy();
  });
});
