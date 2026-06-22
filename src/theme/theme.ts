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
    background: '#faf6e9',
    surface: '#fffdf5',
    surfaceElevated: '#f6f1e1',
    border: '#ded5bd',
    overlay: 'rgba(38, 30, 14, 0.42)',
  },
  text: {
    textPrimary: '#241f17',
    textSecondary: '#5c5548',
    textMuted: '#8b8170',
    onAction: '#241f17',
    onSacred: '#211805',
  },
  action: {
    action: '#c08a1e',
    actionPressed: '#a5751a',
    actionDisabled: '#c9bea7',
  },
  learningState: {
    mastery: '#218c4b',
    learning: '#b7791f',
    due: '#0f766e',
    locked: '#9a927f',
    new: '#d9caa3',
  },
  feedback: {
    success: '#218c4b',
    warning: '#b7791f',
    error: '#c2413c',
  },
  sacred: {
    sacred: '#b8952f',
    sacredMuted: '#7c6828',
  },
};

export const themes: Record<ThemeName, ThemeTokens> = {
  dark: darkTheme,
  mushaf: mushafTheme,
};