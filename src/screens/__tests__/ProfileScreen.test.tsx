import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProfileScreen } from '../ProfileScreen';
import { useSettingsStore } from '../../stores/settingsStore';

beforeEach(() => {
  useSettingsStore.setState({ arabicFontSize: 'medium', showTransliteration: true });
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

  test('renders S, M, L segments', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('S')).toBeTruthy();
    expect(getByText('M')).toBeTruthy();
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

  test('toggling switch updates showTransliteration to false', () => {
    const { getByRole } = render(<ProfileScreen />);
    const switchElement = getByRole('switch');
    fireEvent(switchElement, 'valueChange', false);
    expect(useSettingsStore.getState().showTransliteration).toBe(false);
  });
});
