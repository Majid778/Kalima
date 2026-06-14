import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkvStorage';
import { ArabicFontSize } from '../theme/typography';
import { ThemeName } from '../theme/theme';
import type { NotificationPrefs } from '../services/notifications/reviewSchedule';
import { DEFAULT_RECITER_ID } from '../services/audio/audioSource';

interface SettingsState {
  theme: ThemeName;
  arabicFontSize: ArabicFontSize;
  showTransliteration: boolean;
  notifications: NotificationPrefs;
  reciterId: string;
  setTheme: (theme: ThemeName) => void;
  setArabicFontSize: (size: ArabicFontSize) => void;
  setShowTransliteration: (show: boolean) => void;
  setNotificationPrefs: (partial: Partial<NotificationPrefs>) => void;
  setReciterId: (reciterId: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      arabicFontSize: 'medium',        // D-12 default
      showTransliteration: true,        // D-16 default
      notifications: { enabled: false, maxPerWeek: 3, preferredHour: 19 },
      reciterId: DEFAULT_RECITER_ID,
      setTheme: (theme) => set({ theme }),
      setArabicFontSize: (size) => set({ arabicFontSize: size }),
      setShowTransliteration: (show) => set({ showTransliteration: show }),
      setNotificationPrefs: (partial) =>
        set((state) => ({ notifications: { ...state.notifications, ...partial } })),
      setReciterId: (reciterId) => set({ reciterId }),
    }),
    {
      name: 'kalima-settings',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
