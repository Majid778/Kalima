import React from 'react';
import { render } from '@testing-library/react-native';
import { SacredNumber } from '../SacredNumber';

describe('SacredNumber', () => {
  it('renders a rounded percent display', () => {
    const { getByText } = render(<SacredNumber percent={0.378} />);

    expect(getByText('38%')).toBeTruthy();
  });

  it('renders a custom label', () => {
    const { getByText } = render(
      <SacredNumber percent={0.5} label="of the Qur'an you understand" />,
    );

    expect(getByText("of the Qur'an you understand")).toBeTruthy();
  });
});