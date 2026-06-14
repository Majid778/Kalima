import {
  createInitialInstrumentationState,
  recordInstrumentationEvent,
  type InstrumentationEvent,
  type InstrumentationEventName,
} from '../instrumentation';

function evt(name: InstrumentationEventName, timestamp = '2026-06-14T10:00:00Z'): InstrumentationEvent {
  return {
    id: 0,
    name,
    timestamp,
    localDate: timestamp.split('T')[0],
    sessionId: 's1',
    payload: {},
  };
}

describe('createInitialInstrumentationState', () => {
  it('starts empty with milestones unset', () => {
    const s = createInitialInstrumentationState('2026-06-14T00:00:00Z', '2026-06-14', 'install-x');
    expect(s.events).toEqual([]);
    expect(s.lastEventId).toBe(0);
    expect(s.currentSessionId).toBeNull();
    expect(s.milestones.firstOpenAt).toBeNull();
    expect(s.milestones.firstWordAt).toBeNull();
    expect(s.milestones.firstReviewAt).toBeNull();
    expect(s.installId).toBe('install-x');
  });
});

describe('recordInstrumentationEvent', () => {
  const base = createInitialInstrumentationState('2026-06-14T00:00:00Z', '2026-06-14', 'i');

  it('appends events and assigns incrementing ids', () => {
    let s = recordInstrumentationEvent(base, evt('app_opened'));
    s = recordInstrumentationEvent(s, evt('word_seen'));
    expect(s.events).toHaveLength(2);
    expect(s.events[0].id).toBe(1);
    expect(s.events[1].id).toBe(2);
    expect(s.lastEventId).toBe(2);
  });

  it('records first-occurrence milestones only', () => {
    let s = recordInstrumentationEvent(base, evt('app_opened', '2026-06-14T01:00:00Z'));
    expect(s.milestones.firstOpenAt).toBe('2026-06-14T01:00:00Z');
    // a later app_opened must NOT overwrite the first
    s = recordInstrumentationEvent(s, evt('app_opened', '2026-06-14T05:00:00Z'));
    expect(s.milestones.firstOpenAt).toBe('2026-06-14T01:00:00Z');

    s = recordInstrumentationEvent(s, evt('word_seen', '2026-06-14T02:00:00Z'));
    expect(s.milestones.firstWordAt).toBe('2026-06-14T02:00:00Z');

    s = recordInstrumentationEvent(s, evt('practice_card_graded', '2026-06-14T03:00:00Z'));
    expect(s.milestones.firstReviewAt).toBe('2026-06-14T03:00:00Z');
  });

  it('caps the event log at maxEvents, dropping the oldest', () => {
    let s = base;
    for (let i = 0; i < 5; i += 1) {
      s = recordInstrumentationEvent(s, evt('word_seen'), 3);
    }
    expect(s.events).toHaveLength(3);
    // ids keep incrementing even as old events are dropped
    expect(s.events[s.events.length - 1].id).toBe(5);
  });

  it('does not mutate the input state', () => {
    const before = base.events.length;
    recordInstrumentationEvent(base, evt('app_opened'));
    expect(base.events.length).toBe(before);
  });
});
