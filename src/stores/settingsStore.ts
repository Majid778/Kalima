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
  autoPlayAudio: boolean;
  setTheme: (theme: ThemeName) => void;
  setArabicFontSize: (size: ArabicFontSize) => void;
  setShowTransliteration: (show: boolean) => void;
  setNotificationPrefs: (partial: Partial<NotificationPrefs>) => void;
  setReciterId: (reciterId: string) => void;
  setAutoPlayAudio: (autoPlayAudio: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'mushaf',
      arabicFontSize: 'medium',        // D-12 default
      showTransliteration: true,        // D-16 default
      notifications: { enabled: false, maxPerWeek: 3, preferredHour: 19 },
      reciterId: DEFAULT_RECITER_ID,
      autoPlayAudio: false,
      setTheme: (theme) => set({ theme }),
      setArabicFontSize: (size) => set({ arabicFontSize: size }),
      setShowTransliteration: (show) => set({ showTransliteration: show }),
      setNotificationPrefs: (partial) =>
        set((state) => ({ notifications: { ...state.notifications, ...partial } })),
      setReciterId: (reciterId) => set({ reciterId }),
      setAutoPlayAudio: (autoPlayAudio) => set({ autoPlayAudio }),
    }),
    {
      name: 'kalima-settings',
      storage: createJSONStorage(() => mmkvStorage),
      // Bumped for the Mushaf redesign: installs from before the redesign had
      // 'dark' persisted, which would override the new default. Adopt 'mushaf' once.
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (version < 2 && persisted) {
          return { ...persisted, theme: 'mushaf' as ThemeName };
        }
        return persisted;
      },
    },
  ),
);
