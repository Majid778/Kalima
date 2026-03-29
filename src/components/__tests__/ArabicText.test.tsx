import React from 'react';
import { render } from '@testing-library/react-native';
import { ArabicText } from '../ArabicText';

describe('ArabicText (ARAB-01): Font and diacritics', () => {
  test('renders with KFGQPC-Uthmanic-Script-HAFS fontFamily', () => {
    const { getByText } = render(<ArabicText>بِسْمِ</ArabicText>);
    const textElement = getByText('بِسْمِ');
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fontFamily: 'KFGQPC-Uthmanic-Script-HAFS' })
      ])
    );
  });

  test('lineHeight >= 48 for medium size (prevents diacritics clipping)', () => {
    const { getByText } = render(<ArabicText size="medium">بِسْمِ</ArabicText>);
    const textElement = getByText('بِسْمِ');
    const flatStyle = Object.assign({}, ...textElement.props.style.filter(Boolean));
    expect(flatStyle.lineHeight).toBeGreaterThanOrEqual(48);
  });
});

describe('ArabicText (ARAB-02): RTL rendering', () => {
  test('has writingDirection rtl', () => {
    const { getByText } = render(<ArabicText>بِسْمِ</ArabicText>);
    const textElement = getByText('بِسْمِ');
    const flatStyle = Object.assign({}, ...textElement.props.style.filter(Boolean));
    expect(flatStyle.writingDirection).toBe('rtl');
  });

  test('has textAlign right', () => {
    const { getByText } = render(<ArabicText>بِسْمِ</ArabicText>);
    const textElement = getByText('بِسْمِ');
    const flatStyle = Object.assign({}, ...textElement.props.style.filter(Boolean));
    expect(flatStyle.textAlign).toBe('right');
  });
});
