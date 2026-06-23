import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProfileScreen } from '../ProfileScreen';
import { useSettingsStore } from '../../stores/settingsStore';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('../../data/database', () => ({
  db: {},
}));

jest.mock('../../services/progressService', () => ({
  getLevelProgressList: jest.fn(),
  getWordsMasteredCount: jest.fn(),
}));

beforeEach(() => {
  useSettingsStore.setState({
    theme: 'dark',
    arabicFontSize: 'medium',
    showTransliteration: true,
    reciterId: 'alafasy',
    autoPlayAudio: false,
  });
});

describe('ProfileScreen', () => {
  test('renders Display section header', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Display')).toBeTruthy();
  });

  test('renders Arabic Font Size label', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Arabic Font Size')).toBeTruthy();
  });

  test('renders Show Transliteration label', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Show Transliteration')).toBeTruthy();
  });

  test('renders Auto-play recitation label', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Auto-play recitation')).toBeTruthy();
  });

  test('renders Theme label', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Theme')).toBeTruthy();
  });

  test('renders S, M, L segments', () => {
    const { getByText, getAllByText } = render(<ProfileScreen />);
    expect(getByText('S')).toBeTruthy();
    // "M" also appears as the avatar initial, so allow more than one match here.
    expect(getAllByText('M').length).toBeGreaterThan(0);
    expect(getByText('L')).toBeTruthy();
  });

  test('tapping L segment updates store to large', () => {
    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText('L'));
    expect(useSettingsStore.getState().arabicFontSize).toBe('large');
  });

  test('tapping S segment updates store to small', () => {
    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText('S'));
    expect(useSettingsStore.getState().arabicFontSize).toBe('small');
  });

  // Switch order: [0] Daily reminder, [1] Theme, [2] Show Transliteration, [3] Auto-play.
  test('toggling switch updates showTransliteration to false', () => {
    const { getAllByRole } = render(<ProfileScreen />);
    const switchElement = getAllByRole('switch')[2];
    fireEvent(switchElement, 'valueChange', false);
    expect(useSettingsStore.getState().showTransliteration).toBe(false);
  });

  test('toggling auto-play switch updates autoPlayAudio to true', () => {
    const { getAllByRole } = render(<ProfileScreen />);
    const switchElement = getAllByRole('switch')[3];
    fireEvent(switchElement, 'valueChange', true);
    expect(useSettingsStore.getState().autoPlayAudio).toBe(true);
  });

  test('toggling theme switch updates theme to mushaf', () => {
    const { getAllByRole } = render(<ProfileScreen />);
    const switchElement = getAllByRole('switch')[1];
    fireEvent(switchElement, 'valueChange', false);
    expect(useSettingsStore.getState().theme).toBe('mushaf');
  });
});
