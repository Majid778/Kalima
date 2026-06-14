import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { MilestoneMoment } from '../MilestoneMoment';

describe('MilestoneMoment', () => {
  it('renders the percent and fires onDismiss', () => {
    const onDismiss = jest.fn();
    const { getByText } = render(
      <MilestoneMoment visible percent={0.25} onDismiss={onDismiss} />,
    );

    expect(getByText("You now understand 25% of the Qur'an's words")).toBeTruthy();

    fireEvent.press(getByText('Continue'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});