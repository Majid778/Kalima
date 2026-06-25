import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProfileScreen } from '../ProfileScreen';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

jest.mock('../../data/database', () => ({
  db: {},
}));

jest.mock('../../services/progressService', () => ({
  getLevelProgressList: jest.fn().mockResolvedValue([]),
  getWordsMasteredCount: jest.fn().mockResolvedValue(0),
  getWordsLearnedCount: jest.fn().mockResolvedValue(0),
  getQuranPercent: jest.fn().mockResolvedValue(0),
  getLevelsCompletedCount: jest.fn().mockResolvedValue(0),
}));

beforeEach(() => {
  mockNavigate.mockClear();
});

describe('ProfileScreen', () => {
  test('renders the user name', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Majid')).toBeTruthy();
  });

  test('renders the identity stat labels', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('mastered')).toBeTruthy();
    expect(getByText('day rhythm')).toBeTruthy();
  });

  test('renders the Memory strength vault heading', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Memory strength')).toBeTruthy();
  });

  test('renders the solid and fragile tiles', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('solid, well rooted')).toBeTruthy();
    expect(getByText('fragile, review soon')).toBeTruthy();
  });

  test('gear button navigates to Settings', () => {
    const { getByLabelText } = render(<ProfileScreen />);
    fireEvent.press(getByLabelText('Settings'));
    expect(mockNavigate).toHaveBeenCalledWith('Settings');
  });
});
