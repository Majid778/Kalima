import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NowPlayingScreen } from '../NowPlayingScreen';

const mockGoBack = jest.fn();
const mockPlayAyah = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
  useRoute: () => ({
    params: { surahNumber: 2, ayahNumber: 5, surahName: 'Surah Al-Baqarah' },
  }),
}));

jest.mock('../../../services/audio/audioRuntime', () => ({
  // No-op audio: useAudioPlayback returns an idle state, playAyah is a spy.
  useAudioPlayback: () => ({ playingUrl: null, isLoading: false }),
  playAyah: (...args: unknown[]) => mockPlayAyah(...args),
}));

beforeEach(() => {
  mockGoBack.mockClear();
  mockPlayAyah.mockClear();
});

describe('NowPlayingScreen', () => {
  test('renders the reciter name and surah/ayah line', () => {
    const { getByText } = render(<NowPlayingScreen />);
    expect(getByText('Mishary Alafasy')).toBeTruthy();
    expect(getByText('Surah Al-Baqarah, ayah 5')).toBeTruthy();
  });

  test('renders the now playing label and a zeroed scrubber', () => {
    const { getByText, getAllByText } = render(<NowPlayingScreen />);
    expect(getByText('Now playing')).toBeTruthy();
    expect(getAllByText('0:00').length).toBeGreaterThanOrEqual(2);
  });

  test('back button calls navigation.goBack', () => {
    const { getByLabelText } = render(<NowPlayingScreen />);
    fireEvent.press(getByLabelText('Go back'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  test('play button triggers playAyah', () => {
    const { getByLabelText } = render(<NowPlayingScreen />);
    fireEvent.press(getByLabelText('Play ayah'));
    expect(mockPlayAyah).toHaveBeenCalledTimes(1);
  });
});
