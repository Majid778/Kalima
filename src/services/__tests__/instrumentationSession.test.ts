import {
  createInitialInstrumentationState,
  startInstrumentationSession,
  completeInstrumentationSession,
  abandonInstrumentationSession,
} from '../instrumentation';

const base = createInitialInstrumentationState('2026-06-14T00:00:00Z', '2026-06-14', 'i');

describe('startInstrumentationSession', () => {
  it('opens a session summary and sets it current', () => {
    const s = startInstrumentationSession(base, {
      sessionId: 'sess-1',
      timestamp: '2026-06-14T10:00:00Z',
      localDate: '2026-06-14',
      startScreen: 'TodaySession',
    });
    expect(s.currentSessionId).toBe('sess-1');
    const summary = s.sessionSummaries['sess-1'];
    expect(summary.startedAt).toBe('2026-06-14T10:00:00Z');
    expect(summary.startScreen).toBe('TodaySession');
    expect(summary.completed).toBe(false);
    expect(summary.completedAt).toBeNull();
  });

  it('records the active date', () => {
    const s = startInstrumentationSession(base, {
      sessionId: 'sess-2',
      timestamp: '2026-06-14T10:00:00Z',
      localDate: '2026-06-14',
      startScreen: 'TodaySession',
    });
    expect(s.activeDates['2026-06-14']).toBeGreaterThanOrEqual(1);
  });
});

describe('completeInstrumentationSession', () => {
  it('marks the session completed with end metadata', () => {
    let s = startInstrumentationSession(base, {
      sessionId: 'sess-3',
      timestamp: '2026-06-14T10:00:00Z',
      localDate: '2026-06-14',
      startScreen: 'TodaySession',
    });
    s = completeInstrumentationSession(s, {
      sessionId: 'sess-3',
      timestamp: '2026-06-14T10:05:00Z',
      endScreen: 'TodayResult',
    });
    const summary = s.sessionSummaries['sess-3'];
    expect(summary.completed).toBe(true);
    expect(summary.completedAt).toBe('2026-06-14T10:05:00Z');
    expect(summary.endScreen).toBe('TodayResult');
    expect(summary.abandonedAt).toBeNull();
  });

  it('is a no-op for an unknown session', () => {
    const s = completeInstrumentationSession(base, {
      sessionId: 'ghost',
      timestamp: '2026-06-14T10:05:00Z',
      endScreen: 'TodayResult',
    });
    expect(s.sessionSummaries['ghost']).toBeUndefined();
  });
});

describe('abandonInstrumentationSession', () => {
  it('marks the session abandoned (not completed)', () => {
    let s = startInstrumentationSession(base, {
      sessionId: 'sess-4',
      timestamp: '2026-06-14T10:00:00Z',
      localDate: '2026-06-14',
      startScreen: 'TodaySession',
    });
    s = abandonInstrumentationSession(s, {
      sessionId: 'sess-4',
      timestamp: '2026-06-14T10:02:00Z',
      endScreen: 'TodaySession',
      lastStep: 'item 3',
    });
    const summary = s.sessionSummaries['sess-4'];
    expect(summary.abandonedAt).toBe('2026-06-14T10:02:00Z');
    expect(summary.completed).toBe(false);
    expect(summary.completedAt).toBeNull();
  });
});
