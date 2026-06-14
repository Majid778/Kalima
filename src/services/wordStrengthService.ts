// src/services/wordStrengthService.ts
// Pure word strength classifier mapping SM-2 state to display strength (new/shaky/strong/mastered)

/**
 * StrengthInput: the relevant subset of SM2State needed to classify word strength.
 */
export interface StrengthInput {
  status: 'new' | 'learning' | 'review';
  interval: number;
  repetitions: number;
}

/**
 * WordStrength: the four-state display classification.
 */
export type WordStrength = 'new' | 'shaky' | 'strong' | 'mastered';

/**
 * Display labels for each strength state.
 */
export const STRENGTH_LABELS: Record<WordStrength, string> = {
  new: 'New',
  shaky: 'Shaky',
  strong: 'Strong',
  mastered: 'Mastered',
};

/**
 * Pure function: maps SM-2 state (status + interval) to word strength.
 * 
 * Mapping (MUST align with sm2.computeStatus boundary at interval >= 21):
 * - status === 'new' OR interval === 0 → 'new'
 * - status === 'review' → 'mastered' (implies interval >= 21 per sm2.computeStatus)
 * - status === 'learning' && interval < 6 → 'shaky'
 * - status === 'learning' && interval >= 6 → 'strong'
 */
export function getWordStrength(input: StrengthInput): WordStrength {
  // Handle new state: either explicitly marked 'new' or interval is 0
  if (input.status === 'new' || input.interval === 0) {
    return 'new';
  }

  // If status is 'review', word has interval >= 21 per sm2.computeStatus
  if (input.status === 'review') {
    return 'mastered';
  }

  // For 'learning' status, split on interval 6 boundary
  if (input.status === 'learning') {
    if (input.interval < 6) {
      return 'shaky';
    } else {
      return 'strong';
    }
  }

  // Exhaustive check: TypeScript ensures we cover all status values
  // If we reach here, TypeScript would have caught a missing branch
  const _exhaustive: never = input.status;
  throw new Error(`Unexpected status: ${_exhaustive}`);
}

/**
 * Thin wrapper: accepts SM2State or SM2Result and returns strength.
 */
export function strengthFromSM2(state: { status: 'new' | 'learning' | 'review'; interval: number; repetitions: number }): WordStrength {
  return getWordStrength({
    status: state.status,
    interval: state.interval,
    repetitions: state.repetitions,
  });
}