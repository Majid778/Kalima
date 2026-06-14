import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders the label', () => {
    const { getByText } = render(<Button label="Start" onPress={jest.fn()} />);

    expect(getByText('Start')).toBeTruthy();
  });

  it('calls onPress when enabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Start" onPress={onPress} />);

    fireEvent.press(getByText('Start'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Start" onPress={onPress} disabled />);

    fireEvent.press(getByText('Start'));

    expect(onPress).not.toHaveBeenCalled();
  });
});