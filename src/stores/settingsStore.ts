import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkvStorage';
import { ArabicFontSize } from '../theme/typography';

interface SettingsState {
  arabicFontSize: ArabicFontSize;
  showTransliteration: boolean;
  setArabicFontSize: (size: ArabicFontSize) => void;
  setShowTransliteration: (show: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      arabicFontSize: 'medium',        // D-12 default
      showTransliteration: true,        // D-16 default
      setArabicFontSize: (size) => set({ arabicFontSize: size }),
      setShowTransliteration: (show) => set({ showTransliteration: show }),
    }),
    {
      name: 'kalima-settings',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
