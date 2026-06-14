// src/services/instrumentationRuntime.ts
// Imperative runtime wrapper around pure instrumentation logic
// Handles persistence via MMKV, session lifecycle, and event recording

import { mmkvStorage } from '../stores/mmkvStorage';
import {
  createInitialInstrumentationState,
  recordInstrumentationEvent,
  startInstrumentationSession,
  completeInstrumentationSession,
  abandonInstrumentationSession,
  recordActiveDate,
  summarizeInstrumentation,
  InstrumentationState,
  InstrumentationSnapshot,
  InstrumentationEventName,
} from './instrumentation';

const INSTRUMENTATION_KEY = 'kalima-instrumentation-state';

/**
 * Module-level singleton state and guard to prevent double-init.
 */
let state: InstrumentationState | null = null;
let initialized = false;

/**
 * Load instrumentation state from persistent storage.
 * On corrupt/missing JSON, recovers to createInitialInstrumentationState.
 * Guards against double-init.
 */
export function initInstrumentationRuntime(now: string, localDate: string): InstrumentationState {
  if (initialized) {
    return state!;
  }

  try {
    const storedValue = mmkvStorage.getItem(INSTRUMENTATION_KEY);
    // storedValue may be a string or null
    const stored = typeof storedValue === 'string' ? storedValue : null;
    
    if (!stored) {
      state = createInitialInstrumentationState(now, localDate);
    } else {
      const parsed = JSON.parse(stored);
      // Validate shape; if anything is amiss, recover
      if (
        parsed &&
        typeof parsed === 'object' &&
        parsed.schemaVersion === 1 &&
        Array.isArray(parsed.events)
      ) {
        state = parsed as InstrumentationState;
      } else {
        // Corrupt or old schema: recover
        state = createInitialInstrumentationState(now, localDate);
      }
    }
  } catch (_err) {
    // JSON parse error or any other issue: recover
    state = createInitialInstrumentationState(now, localDate);
  }

  initialized = true;
  persistState();
  return state;
}

/**
 * Record a single event into the runtime state.
 * Automatically persists to storage.
 */
export function recordEvent(
  eventName: InstrumentationEventName,
  payload: Record<string, unknown> = {},
  source?: 'app' | 'learn' | 'practice' | 'quiz' | 'streak',
): void {
  if (!initialized || !state) {
    throw new Error('Instrumentation runtime not initialized. Call initInstrumentationRuntime first.');
  }

  const now = new Date().toISOString();
  const localDate = new Date().toISOString().split('T')[0];
  const sessionId = state.currentSessionId || 'session-unknown';

  const event = {
    id: 0, // Will be assigned by reducer
    name: eventName,
    timestamp: now,
    localDate,
    sessionId,
    source,
    payload,
  };

  state = recordInstrumentationEvent(state, event);
  persistState();
}

/**
 * Start a new session and record it in state.
 * Returns the sessionId.
 */
export function startSession(startScreen: string, cardsInitial: number = 0): string {
  if (!initialized || !state) {
    throw new Error('Instrumentation runtime not initialized. Call initInstrumentationRuntime first.');
  }

  const now = new Date().toISOString();
  const localDate = new Date().toISOString().split('T')[0];
  const sessionId = 'session-' + Math.random().toString(36).substring(2, 15);

  state = startInstrumentationSession(state, {
    sessionId,
    timestamp: now,
    localDate,
    startScreen,
  });

  // Seed the session's initial card count (drives completion-rate aggregation).
  const summary = state.sessionSummaries[sessionId];
  if (summary) {
    state = {
      ...state,
      sessionSummaries: {
        ...state.sessionSummaries,
        [sessionId]: { ...summary, cardsInitial },
      },
    };
  }

  persistState();
  return sessionId;
}

/**
 * Record that a due card was reviewed in the current session (first presentation).
 */
export function recordCardReviewed(): void {
  if (!initialized || !state || !state.currentSessionId) return;
  const summary = state.sessionSummaries[state.currentSessionId];
  if (!summary) return;
  state = {
    ...state,
    sessionSummaries: {
      ...state.sessionSummaries,
      [state.currentSessionId]: { ...summary, cardsReviewed: summary.cardsReviewed + 1 },
    },
  };
  persistState();
}

/**
 * Complete the current session.
 */
export function completeSession(endScreen: string): void {
  if (!initialized || !state || !state.currentSessionId) {
    return;
  }

  const now = new Date().toISOString();

  state = completeInstrumentationSession(state, {
    sessionId: state.currentSessionId,
    timestamp: now,
    endScreen,
  });

  persistState();
}

/**
 * Abandon the current session.
 */
export function abandonSession(endScreen: string, lastStep: string): void {
  if (!initialized || !state || !state.currentSessionId) {
    return;
  }

  const now = new Date().toISOString();

  state = abandonInstrumentationSession(state, {
    sessionId: state.currentSessionId,
    timestamp: now,
    endScreen,
    lastStep,
  });

  persistState();
}

/**
 * Record activity for today (retention tracking).
 */
export function recordActivityForToday(): void {
  if (!initialized || !state) {
    throw new Error('Instrumentation runtime not initialized. Call initInstrumentationRuntime first.');
  }

  const today = new Date().toISOString().split('T')[0];
  state = recordActiveDate(state, today);
  persistState();
}

/**
 * Get a snapshot of the current instrumentation state.
 */
export function snapshot(): InstrumentationSnapshot {
  if (!initialized || !state) {
    throw new Error('Instrumentation runtime not initialized. Call initInstrumentationRuntime first.');
  }

  const today = new Date().toISOString().split('T')[0];
  return summarizeInstrumentation(state, today);
}

/**
 * Get the full state (for testing/debugging).
 */
export function getState(): InstrumentationState | null {
  return state;
}

/**
 * Reset state to initial (for testing).
 */
export function resetRuntime(): void {
  state = null;
  initialized = false;
  mmkvStorage.removeItem(INSTRUMENTATION_KEY);
}

/**
 * Persist state to storage.
 */
function persistState(): void {
  if (!state) return;
  try {
    mmkvStorage.setItem(INSTRUMENTATION_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to persist instrumentation state:', err);
  }
}
