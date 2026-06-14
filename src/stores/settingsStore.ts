import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkvStorage';
import { ArabicFontSize } from '../theme/typography';
import { ThemeName } from '../theme/theme';

interface SettingsState {
  theme: ThemeName;
  arabicFontSize: ArabicFontSize;
  showTransliteration: boolean;
  setTheme: (theme: ThemeName) => void;
  setArabicFontSize: (size: ArabicFontSize) => void;
  setShowTransliteration: (show: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      arabicFontSize: 'medium',        // D-12 default
      showTransliteration: true,        // D-16 default
      setTheme: (theme) => set({ theme }),
      setArabicFontSize: (size) => set({ arabicFontSize: size }),
      setShowTransliteration: (show) => set({ showTransliteration: show }),
    }),
    {
      name: 'kalima-settings',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
