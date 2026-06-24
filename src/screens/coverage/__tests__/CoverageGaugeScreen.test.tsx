import React from 'react';
import { render } from '@testing-library/react-native';
import { CoverageGaugeScreen } from '../CoverageGaugeScreen';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

jest.mock('../../../data/database', () => ({
  db: {},
}));

jest.mock('../../../services/progressService', () => ({
  getQuranPercent: jest.fn().mockResolvedValue(0),
  getWordsLearnedCount: jest.fn().mockResolvedValue(0),
  getGlobalWordCounts: jest.fn().mockResolvedValue({ knownWords: 0, totalWords: 0 }),
}));

describe('CoverageGaugeScreen', () => {
  test('renders the leverage curve title', () => {
    const { getByText } = render(<CoverageGaugeScreen />);
    expect(getByText('The leverage curve')).toBeTruthy();
  });

  test('renders the coverage stat labels with safe zero defaults', () => {
    const { getByText } = render(<CoverageGaugeScreen />);
    expect(getByText('words known')).toBeTruthy();
    expect(getByText('to full coverage')).toBeTruthy();
    expect(getByText('understood')).toBeTruthy();
  });
});
