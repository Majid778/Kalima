import React from 'react';
import { render } from '@testing-library/react-native';
import { MilestonesScreen } from '../MilestonesScreen';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
  useNavigation: () => ({ navigate: jest.fn(), goBack: mockGoBack }),
}));

jest.mock('../../data/database', () => ({
  db: {},
}));

jest.mock('../../services/progressService', () => ({
  getWordsLearnedCount: jest.fn().mockResolvedValue(0),
  getQuranPercent: jest.fn().mockResolvedValue(0),
  getLevelsCompletedCount: jest.fn().mockResolvedValue(0),
}));

beforeEach(() => {
  mockGoBack.mockClear();
});

describe('MilestonesScreen', () => {
  test('renders the screen title and subtitle', () => {
    const { getByText } = render(<MilestonesScreen />);
    expect(getByText('Milestones')).toBeTruthy();
    expect(getByText('Marks of your own journey')).toBeTruthy();
  });

  test('renders the headline mark and cabinet tiles', () => {
    const { getByText } = render(<MilestonesScreen />);
    expect(getByText('Read Al-Fatiha unaided')).toBeTruthy();
    expect(getByText('7 day rhythm')).toBeTruthy();
    expect(getByText('First 50 words')).toBeTruthy();
  });

  test('renders the total hasanat eyebrow', () => {
    const { getByText } = render(<MilestonesScreen />);
    expect(getByText('Total hasanat')).toBeTruthy();
  });
});
