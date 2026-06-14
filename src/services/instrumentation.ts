// src/services/instrumentation.ts
// PURE instrumentation core: typed event model + aggregate reducers
// NO RN imports, NO networking, NO Date.now() (all time passed as params)

/**
 * Event names that can be recorded.
 */
export type InstrumentationEventName =
  | 'app_opened'
  | 'learn_level_opened'
  | 'word_seen'
  | 'words_introduced'
  | 'practice_session_started'
  | 'practice_card_revealed'
  | 'practice_card_graded'
  | 'practice_session_completed'
  | 'practice_session_abandoned'
  | 'quiz_started'
  | 'quiz_answered'
  | 'quiz_completed'
  | 'activity_recorded';

/**
 * A single recorded event.
 */
export interface InstrumentationEvent {
  id: number;
  name: InstrumentationEventName;
  timestamp: string; // ISO 8601 or YYYY-MM-DD HH:MM:SS
  localDate: string; // YYYY-MM-DD
  sessionId: string;
  source?: 'app' | 'learn' | 'practice' | 'quiz' | 'streak';
  payload: Record<string, unknown>;
}

/**
 * Summary of a practice/quiz session lifecycle.
 */
export interface SessionSummary {
  sessionId: string;
  startedAt: string;
  completedAt: string | null;
  abandonedAt: string | null;
  startScreen: string;
  endScreen: string | null;
  cardsInitial: number;
  cardsReviewed: number;
  newWordsIntroduced: number;
  quizQuestionsAnswered: number;
  completed: boolean;
}

/**
 * Complete instrumentation state: events + milestones + aggregates.
 */
export interface InstrumentationState {
  schemaVersion: 1;
  installId: string;
  installedAt: string;
  installedLocalDate: string;
  lastEventId: number;
  currentSessionId: string | null;
  events: InstrumentationEvent[];
  milestones: {
    firstOpenAt: string | null;
    firstWordAt: string | null;
    firstReviewAt: string | null;
    firstTodaySessionStartedAt: string | null;
    firstTodaySessionCompletedAt: string | null;
  };
  activeDates: Record<string, number>; // date → event count
  sessionSummaries: Record<string, SessionSummary>;
}

/**
 * Derived snapshot for external consumption.
 */
export interface InstrumentationSnapshot {
  activation: {
    installed: boolean;
    firstWord: boolean;
    firstReview: boolean;
  };
  retention: {
    d1: boolean;
    d7: boolean;
    d30: boolean;
  };
  reviewCompletionRate: number | null;
  dropOffs: Array<{ lastStep: string; count: number }>;
}

/**
 * Create an initial, blank instrumentation state.
 * @param now Timestamp string (e.g., ISO 8601)
 * @param localDate Date string in YYYY-MM-DD format
 * @param installId Optional install ID; if omitted, a placeholder is used
 */
export function createInitialInstrumentationState(
  now: string,
  localDate: string,
  installId?: string,
): InstrumentationState {
  return {
    schemaVersion: 1,
    installId: installId || 'install-' + Math.random().toString(36).substring(2, 15),
    installedAt: now,
    installedLocalDate: localDate,
    lastEventId: 0,
    currentSessionId: null,
    events: [],
    milestones: {
      firstOpenAt: null,
      firstWordAt: null,
      firstReviewAt: null,
      firstTodaySessionStartedAt: null,
      firstTodaySessionCompletedAt: null,
    },
    activeDates: {},
    sessionSummaries: {},
  };
}

/**
 * Record a single event into state, capping the event log at maxEvents.
 * Drops oldest events if cap is exceeded.
 * Also triggers milestone recording if applicable.
 */
export function recordInstrumentationEvent(
  state: InstrumentationState,
  event: InstrumentationEvent,
  maxEvents: number = 1000,
): InstrumentationState {
  const newState = { ...state };

  // Increment event ID
  const eventId = newState.lastEventId + 1;
  const newEvent: InstrumentationEvent = { ...event, id: eventId };

  // Append event
  newState.events = [...newState.events, newEvent];
  newState.lastEventId = eventId;

  // Cap the log: if we exceed maxEvents, drop oldest
  if (newState.events.length > maxEvents) {
    newState.events = newState.events.slice(-maxEvents);
  }

  // Trigger milestones on specific events (first-occurrence only)
  if (newEvent.name === 'app_opened' && newState.milestones.firstOpenAt === null) {
    newState.milestones = {
      ...newState.milestones,
      firstOpenAt: newEvent.timestamp,
    };
  }

  if (newEvent.name === 'word_seen' && newState.milestones.firstWordAt === null) {
    newState.milestones = {
      ...newState.milestones,
      firstWordAt: newEvent.timestamp,
    };
  }

  if (newEvent.name === 'practice_card_graded' && newState.milestones.firstReviewAt === null) {
    newState.milestones = {
      ...newState.milestones,
      firstReviewAt: newEvent.timestamp,
    };
  }

  return newState;
}

/**
 * Start a new session: create or reuse sessionId and initialize a summary.
 */
export function startInstrumentationSession(
  state: InstrumentationState,
  input: {
    sessionId?: string;
    timestamp: string;
    localDate: string;
    startScreen: string;
  },
): InstrumentationState {
  const newState = { ...state };

  const sessionId = input.sessionId || 'session-' + Math.random().toString(36).substring(2, 15);
  newState.currentSessionId = sessionId;

  // Initialize session summary if not already present
  if (!newState.sessionSummaries[sessionId]) {
    newState.sessionSummaries = {
      ...newState.sessionSummaries,
      [sessionId]: {
        sessionId,
        startedAt: input.timestamp,
        completedAt: null,
        abandonedAt: null,
        startScreen: input.startScreen,
        endScreen: null,
        cardsInitial: 0,
        cardsReviewed: 0,
        newWordsIntroduced: 0,
        quizQuestionsAnswered: 0,
        completed: false,
      },
    };
  }

  // Record active date
  newState.activeDates = {
    ...newState.activeDates,
    [input.localDate]: (newState.activeDates[input.localDate] || 0) + 1,
  };

  return newState;
}

/**
 * Complete a session: mark it done and update active dates.
 */
export function completeInstrumentationSession(
  state: InstrumentationState,
  input: {
    sessionId: string;
    timestamp: string;
    endScreen: string;
  },
): InstrumentationState {
  const newState = { ...state };

  const sessionId = input.sessionId;
  if (newState.sessionSummaries[sessionId]) {
    newState.sessionSummaries = {
      ...newState.sessionSummaries,
      [sessionId]: {
        ...newState.sessionSummaries[sessionId],
        completedAt: input.timestamp,
        endScreen: input.endScreen,
        completed: true,
      },
    };
  }

  return newState;
}

/**
 * Abandon a session: mark it abandoned with a last step.
 */
export function abandonInstrumentationSession(
  state: InstrumentationState,
  input: {
    sessionId: string;
    timestamp: string;
    endScreen: string;
    lastStep: string;
  },
): InstrumentationState {
  const newState = { ...state };

  const sessionId = input.sessionId;
  if (newState.sessionSummaries[sessionId]) {
    newState.sessionSummaries = {
      ...newState.sessionSummaries,
      [sessionId]: {
        ...newState.sessionSummaries[sessionId],
        abandonedAt: input.timestamp,
        endScreen: input.endScreen,
        completed: false,
      },
    };
  }

  return newState;
}

/**
 * Record activity for a given date (used for D1/D7/D30 retention).
 */
export function recordActiveDate(
  state: InstrumentationState,
  date: string,
  _reason?: 'learn' | 'practice' | 'quiz',
): InstrumentationState {
  const newState = { ...state };

  newState.activeDates = {
    ...newState.activeDates,
    [date]: (newState.activeDates[date] || 0) + 1,
  };

  return newState;
}

/**
 * Add N days to a YYYY-MM-DD date string (pure, no Date constructor side effects).
 */
function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, '0');
  const newDay = String(date.getDate()).padStart(2, '0');

  return `${newYear}-${newMonth}-${newDay}`;
}

/**
 * Compute retention (D1/D7/D30) given installedLocalDate and current date.
 */
function computeRetention(
  activeDates: Record<string, number>,
  installedLocalDate: string,
  today: string,
): { d1: boolean; d7: boolean; d30: boolean } {
  const d1Date = addDays(installedLocalDate, 1);
  const d7Date = addDays(installedLocalDate, 7);
  const d30Date = addDays(installedLocalDate, 30);

  const d1 = (activeDates[d1Date] || 0) > 0;
  const d7 = (activeDates[d7Date] || 0) > 0;
  const d30 = (activeDates[d30Date] || 0) > 0;

  return { d1, d7, d30 };
}

/**
 * Compute review completion rate from session summaries.
 */
function computeReviewCompletionRate(
  sessionSummaries: Record<string, SessionSummary>,
): number | null {
  const completedSessions = Object.values(sessionSummaries).filter(s => s.completed);

  if (completedSessions.length === 0) return null;

  const totalInitial = completedSessions.reduce((sum, s) => sum + s.cardsInitial, 0);
  const totalReviewed = completedSessions.reduce((sum, s) => sum + s.cardsReviewed, 0);

  if (totalInitial === 0) return null;

  return totalReviewed / totalInitial;
}

/**
 * Compute drop-offs (sessions that were abandoned mid-course).
 */
function computeDropOffs(
  sessionSummaries: Record<string, SessionSummary>,
): Array<{ lastStep: string; count: number }> {
  const dropOffMap = new Map<string, number>();

  for (const session of Object.values(sessionSummaries)) {
    if (!session.completed && session.abandonedAt) {
      // Infer last step from which screen was active at abandon time
      const lastStep = session.endScreen || 'unknown';
      dropOffMap.set(lastStep, (dropOffMap.get(lastStep) || 0) + 1);
    }
  }

  return Array.from(dropOffMap.entries())
    .map(([lastStep, count]) => ({ lastStep, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Summarize the full instrumentation state into a snapshot.
 */
export function summarizeInstrumentation(
  state: InstrumentationState,
  today: string,
): InstrumentationSnapshot {
  return {
    activation: {
      installed: state.milestones.firstOpenAt !== null,
      firstWord: state.milestones.firstWordAt !== null,
      firstReview: state.milestones.firstReviewAt !== null,
    },
    retention: computeRetention(state.activeDates, state.installedLocalDate, today),
    reviewCompletionRate: computeReviewCompletionRate(state.sessionSummaries),
    dropOffs: computeDropOffs(state.sessionSummaries),
  };
}
