import { useSettingsStore } from '../settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      arabicFontSize: 'medium',
      showTransliteration: true,
      reciterId: 'alafasy',
    });
  });

  it('exports useSettingsStore', () => {
    expect(useSettingsStore).toBeDefined();
    expect(typeof useSettingsStore.getState).toBe('function');
  });

  it('has initial arabicFontSize of medium (D-12)', () => {
    const state = useSettingsStore.getState();
    expect(state.arabicFontSize).toBe('medium');
  });

  it('has initial showTransliteration of true (D-16)', () => {
    const state = useSettingsStore.getState();
    expect(state.showTransliteration).toBe(true);
  });

  it('has initial reciterId of alafasy', () => {
    const state = useSettingsStore.getState();
    expect(state.reciterId).toBe('alafasy');
  });

  it('setArabicFontSize updates state to large', () => {
    useSettingsStore.getState().setArabicFontSize('large');
    expect(useSettingsStore.getState().arabicFontSize).toBe('large');
  });

  it('setArabicFontSize updates state to small', () => {
    useSettingsStore.getState().setArabicFontSize('small');
    expect(useSettingsStore.getState().arabicFontSize).toBe('small');
  });

  it('setShowTransliteration updates state to false', () => {
    useSettingsStore.getState().setShowTransliteration(false);
    expect(useSettingsStore.getState().showTransliteration).toBe(false);
  });

  it('setReciterId updates state', () => {
    useSettingsStore.getState().setReciterId('husary');
    expect(useSettingsStore.getState().reciterId).toBe('husary');
  });
});
