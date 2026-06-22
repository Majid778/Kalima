import { colors } from './colors';

export type ThemeName = 'dark' | 'mushaf';

export interface ThemeTokens {
  surfaces: {
    background: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    overlay: string;
  };
  text: {
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    onAction: string;
    onSacred: string;
  };
  action: {
    action: string;
    actionPressed: string;
    actionDisabled: string;
  };
  learningState: {
    mastery: string;
    learning: string;
    due: string;
    locked: string;
    new: string;
  };
  feedback: {
    success: string;
    warning: string;
    error: string;
  };
  sacred: {
    sacred: string;
    sacredMuted: string;
  };
}

export const darkTheme: ThemeTokens = {
  surfaces: {
    background: colors.background,
    surface: colors.surface,
    surfaceElevated: colors.surfaceLight,
    border: colors.border,
    overlay: 'rgba(0, 0, 0, 0.72)',
  },
  text: {
    textPrimary: colors.text,
    textSecondary: colors.textSecondary,
    textMuted: colors.textMuted,
    onAction: colors.background,
    onSacred: '#1f1604',
  },
  action: {
    action: colors.primary,
    actionPressed: colors.primaryDark,
    actionDisabled: '#3f3f46',
  },
  learningState: {
    mastery: colors.success,
    learning: colors.warning,
    due: '#2dd4bf',
    locked: colors.textMuted,
    new: '#a16207',
  },
  feedback: {
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  },
  sacred: {
    sacred: '#d4af37',
    sacredMuted: '#8f7831',
  },
};

export const mushafTheme: ThemeTokens = {
  surfaces: {
    background: '#f4ecd8',
    surface: '#ece0c4',
    surfaceElevated: '#f6efdc',
    border: '#d8c79a',
    overlay: 'rgba(44,33,19,.42)',
  },
  text: {
    textPrimary: '#2c2113',
    textSecondary: '#7c6b45',
    textMuted: '#9a8454',
    onAction: '#fffaf0',
    onSacred: '#2c2113',
  },
  action: {
    action: '#b8860b',
    actionPressed: '#9a6f08',
    actionDisabled: '#d8c79a',
  },
  learningState: {
    mastery: '#6b7d3f',
    learning: '#b07a1e',
    due: '#4a7c74',
    locked: '#b3a785',
    new: '#c9a94e',
  },
  feedback: {
    success: '#6b7d3f',
    warning: '#b07a1e',
    error: '#b5402f',
  },
  sacred: {
    sacred: '#b8860b',
    sacredMuted: '#9a8454',
  },
};

export const themes: Record<ThemeName, ThemeTokens> = {
  dark: darkTheme,
  mushaf: mushafTheme,
};
