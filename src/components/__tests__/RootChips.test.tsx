import React from 'react';
import { render } from '@testing-library/react-native';
import { RootChips } from '../RootChips';
import { colors } from '../../theme/colors';
import type { WordStrength } from '../../services/wordStrengthService';

const siblings = [
  { id: 1, arabic: 'عَلِمَ', meaning: 'to know' },
  { id: 2, arabic: 'عِلْم', meaning: 'knowledge' },
  { id: 3, arabic: 'مُعَلِّم', meaning: 'teacher' },
];

const colorSiblings = [
  { id: 1, arabic: 'عَلِمَ', meaning: 'to know' },
  { id: 2, arabic: 'غَيْب', meaning: 'unseen' },
  { id: 3, arabic: 'مُعَلِّم', meaning: 'teacher' },
];

function flattenStyle(style: unknown) {
  return Object.assign({}, ...(Array.isArray(style) ? style.filter(Boolean) : [style]));
}

describe('RootChips', () => {
  it('renders nothing for empty siblings', () => {
    const { toJSON } = render(<RootChips root="علم" siblings={[]} />);

    expect(toJSON()).toBeNull();
  });

  it('renders one chip for each sibling', () => {
    const { getAllByTestId, getByText } = render(
      <RootChips root="علم" siblings={siblings} />,
    );

    expect(getByText('Same root · علم')).toBeTruthy();
    expect(getAllByTestId('root-chip')).toHaveLength(3);
  });

  it('colors Arabic text from the normalized known word map', () => {
    const knownMap = new Map<string, WordStrength>([
      ['علم', 'mastered'],
      ['معلم', 'new'],
    ]);

    const { getByText } = render(
      <RootChips root="علم" siblings={colorSiblings} knownMap={knownMap} />,
    );

    expect(flattenStyle(getByText('عَلِمَ').props.style).color).toBe(colors.success);
    expect(flattenStyle(getByText('غَيْب').props.style).color).toBe(colors.textMuted);
    expect(flattenStyle(getByText('مُعَلِّم').props.style).color).toBe(colors.warning);
  });
});