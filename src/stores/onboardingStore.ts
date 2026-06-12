import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkvStorage';
import { useSettingsStore } from './settingsStore';

export type ArabicLevel = 'beginner' | 'alphabet' | 'reader';

interface OnboardingState {
  hasOnboarded: boolean;
  arabicLevel: ArabicLevel | null;
  completeOnboarding: (level: ArabicLevel) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      arabicLevel: null,
      completeOnboarding: (level) => {
        set({
          hasOnboarded: true,
          arabicLevel: level,
        });
        useSettingsStore.getState().setShowTransliteration(level !== 'reader');
      },
      resetOnboarding: () => set({
        hasOnboarded: false,
        arabicLevel: null,
      }),
    }),
    {
      name: 'kalima-onboarding',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
