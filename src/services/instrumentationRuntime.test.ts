import {
  initInstrumentationRuntime,
  recordEvent,
  getState,
  resetRuntime,
} from './instrumentationRuntime';

describe('instrumentationRuntime', () => {
  beforeEach(() => {
    resetRuntime();
  });

  it('throws if an event is recorded before initialization', () => {
    expect(() => recordEvent('app_opened')).toThrow();
  });

  it('initializes state and returns a valid InstrumentationState', () => {
    const s = initInstrumentationRuntime('2026-06-14T00:00:00Z', '2026-06-14');
    expect(s).toBeTruthy();
    expect(s.schemaVersion).toBe(1);
    expect(Array.isArray(s.events)).toBe(true);
    expect(getState()).not.toBeNull();
  });

  it('appends an event and persists it after init', () => {
    initInstrumentationRuntime('2026-06-14T00:00:00Z', '2026-06-14');
    const before = getState()!.events.length;
    recordEvent('app_opened', { version: '2.0.0' }, 'app');
    const after = getState()!.events.length;
    expect(after).toBe(before + 1);
    expect(getState()!.events[after - 1].name).toBe('app_opened');
  });

  it('guards against double-init (returns the already-initialized state)', () => {
    const first = initInstrumentationRuntime('2026-06-14T00:00:00Z', '2026-06-14');
    const second = initInstrumentationRuntime('2030-01-01T00:00:00Z', '2030-01-01');
    expect(second).toBe(first);
  });
});
