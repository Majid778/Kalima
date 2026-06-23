import { colors } from './colors';
import { mushafPalette } from './palette';

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
    background: mushafPalette.parchment,
    surface: mushafPalette.paper,
    surfaceElevated: mushafPalette.paper,
    border: mushafPalette.goldLine,
    overlay: 'rgba(44,33,19,.42)',
  },
  text: {
    textPrimary: mushafPalette.ink,
    textSecondary: mushafPalette.ink2,
    textMuted: mushafPalette.muted,
    onAction: '#fffaf0',
    onSacred: mushafPalette.ink,
  },
  action: {
    action: mushafPalette.gold,
    actionPressed: mushafPalette.goldDeep,
    actionDisabled: mushafPalette.goldLine,
  },
  learningState: {
    mastery: mushafPalette.olive,
    learning: mushafPalette.clay,
    due: mushafPalette.teal,
    locked: mushafPalette.muted,
    new: mushafPalette.gold,
  },
  feedback: {
    success: mushafPalette.olive,
    warning: mushafPalette.clay,
    error: '#b5402f',
  },
  sacred: {
    sacred: mushafPalette.gold,
    sacredMuted: mushafPalette.muted,
  },
};

export const themes: Record<ThemeName, ThemeTokens> = {
  dark: darkTheme,
  mushaf: mushafTheme,
};
