import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SettingsScreen } from '../SettingsScreen';
import { useSettingsStore } from '../../stores/settingsStore';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
}));

beforeEach(() => {
  mockGoBack.mockClear();
  // Reset the settings touched by these tests to known defaults.
  const s = useSettingsStore.getState();
  s.setArabicFontSize('medium');
  s.setShowTransliteration(true);
  s.setAutoPlayAudio(false);
  s.setTheme('mushaf');
});

describe('SettingsScreen', () => {
  test('renders the title and section headers', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('RECITATION')).toBeTruthy();
    expect(getByText('READING')).toBeTruthy();
    expect(getByText('REMINDERS')).toBeTruthy();
  });

  test('back button calls goBack', () => {
    const { getByLabelText } = render(<SettingsScreen />);
    fireEvent.press(getByLabelText('Back'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  test('tapping L sets Arabic font size to large', () => {
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('L'));
    expect(useSettingsStore.getState().arabicFontSize).toBe('large');
  });

  test('tapping S sets Arabic font size to small', () => {
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('S'));
    expect(useSettingsStore.getState().arabicFontSize).toBe('small');
  });

  test('toggling Show transliteration updates the store', () => {
    const { getByLabelText } = render(<SettingsScreen />);
    fireEvent.press(getByLabelText('Show transliteration'));
    expect(useSettingsStore.getState().showTransliteration).toBe(false);
  });

  test('toggling Auto-play recitation updates the store', () => {
    const { getByLabelText } = render(<SettingsScreen />);
    fireEvent.press(getByLabelText('Auto-play recitation'));
    expect(useSettingsStore.getState().autoPlayAudio).toBe(true);
  });

  test('toggling Theme switches to dark', () => {
    const { getByLabelText } = render(<SettingsScreen />);
    fireEvent.press(getByLabelText('Theme'));
    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  test('toggling Daily reminder flips the notification preference', () => {
    const before = useSettingsStore.getState().notifications.enabled;
    const { getByLabelText } = render(<SettingsScreen />);
    fireEvent.press(getByLabelText('Daily reminder'));
    expect(useSettingsStore.getState().notifications.enabled).toBe(!before);
  });
});
