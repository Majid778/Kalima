export const fonts = {
  arabic: 'KFGQPC-Uthmanic-Script-HAFS',  // D-03
} as const;

export const typeScale = {
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  heading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  subheading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
} as const;

export const arabicFontSizes = {
  small: 24,
  medium: 32,
  large: 42,
  hero: 56,
} as const;

export const arabicLineHeights = {
  small: 40,
  medium: 56,
  large: 72,
  hero: 84,
} as const;

export type ArabicFontSize = keyof typeof arabicFontSizes;
