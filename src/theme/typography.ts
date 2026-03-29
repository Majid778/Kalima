export const fonts = {
  arabic: 'KFGQPC-Uthmanic-Script-HAFS',  // D-03
} as const;

export const arabicFontSizes = {
  small: 24,
  medium: 32,
  large: 42,
} as const;

export const arabicLineHeights = {
  small: 40,
  medium: 56,
  large: 72,
} as const;

export type ArabicFontSize = keyof typeof arabicFontSizes;
