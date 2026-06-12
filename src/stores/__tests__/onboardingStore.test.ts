import { useOnboardingStore } from '../onboardingStore';
import { useSettingsStore } from '../settingsStore';

describe('onboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.setState({
      hasOnboarded: false,
      arabicLevel: null,
    });
    useSettingsStore.setState({
      arabicFontSize: 'medium',
      showTransliteration: true,
    });
  });

  it('has initial onboarding defaults', () => {
    const state = useOnboardingStore.getState();
    expect(state.hasOnboarded).toBe(false);
    expect(state.arabicLevel).toBeNull();
  });

  it('completeOnboarding stores reader level and disables transliteration', () => {
    useOnboardingStore.getState().completeOnboarding('reader');

    expect(useOnboardingStore.getState().hasOnboarded).toBe(true);
    expect(useOnboardingStore.getState().arabicLevel).toBe('reader');
    expect(useSettingsStore.getState().showTransliteration).toBe(false);
  });

  it('completeOnboarding keeps transliteration on for beginners', () => {
    useSettingsStore.getState().setShowTransliteration(false);

    useOnboardingStore.getState().completeOnboarding('beginner');

    expect(useSettingsStore.getState().showTransliteration).toBe(true);
  });

  it('resetOnboarding restores defaults', () => {
    useOnboardingStore.getState().completeOnboarding('alphabet');

    useOnboardingStore.getState().resetOnboarding();

    expect(useOnboardingStore.getState().hasOnboarded).toBe(false);
    expect(useOnboardingStore.getState().arabicLevel).toBeNull();
  });
});
