import React from 'react';
import { render } from '@testing-library/react-native';
import { ArabicText } from '../ArabicText';
import { useSettingsStore } from '../../stores/settingsStore';

beforeEach(() => {
  useSettingsStore.setState({ arabicFontSize: 'medium', showTransliteration: true });
});

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

describe('ArabicText (SETT-02): Global font size from store', () => {
  test('uses store font size when no size prop provided', () => {
    useSettingsStore.setState({ arabicFontSize: 'large' });
    const { getByText } = render(<ArabicText>بِسْمِ</ArabicText>);
    const textElement = getByText('بِسْمِ');
    const flatStyle = Object.assign({}, ...textElement.props.style.filter(Boolean));
    expect(flatStyle.fontSize).toBe(42);
    expect(flatStyle.lineHeight).toBe(72);
  });

  test('explicit size prop overrides store', () => {
    useSettingsStore.setState({ arabicFontSize: 'large' });
    const { getByText } = render(<ArabicText size="small">بِسْمِ</ArabicText>);
    const textElement = getByText('بِسْمِ');
    const flatStyle = Object.assign({}, ...textElement.props.style.filter(Boolean));
    expect(flatStyle.fontSize).toBe(24);
    expect(flatStyle.lineHeight).toBe(40);
  });

  test('defaults to medium from store initial state', () => {
    // Store is reset to medium in beforeEach
    const { getByText } = render(<ArabicText>بِسْمِ</ArabicText>);
    const textElement = getByText('بِسْمِ');
    const flatStyle = Object.assign({}, ...textElement.props.style.filter(Boolean));
    expect(flatStyle.fontSize).toBe(32);
  });
});
