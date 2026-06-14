import { useSettingsStore } from '../stores/settingsStore';
import { ThemeTokens, themes } from './theme';

export const useTheme = (): ThemeTokens => {
  const themeName = useSettingsStore((state) => state.theme);
  return themes[themeName];
};

export const getActiveTheme = (): ThemeTokens => {
  const themeName = useSettingsStore.getState().theme;
  return themes[themeName];
};