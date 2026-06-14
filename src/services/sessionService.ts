// src/services/sessionService.ts
// PURE session builder: composes new words, due reviews, and checks into a finite daily session

import type { WordWithVerses } from './wordService';
import type { DueCard } from './practiceService';

/**
 * A single item in a session: a word + metadata about why it's here.
 */
export interface SessionItem {
  wordId: number;
  type: 'new' | 'review' | 'check';
  reviewCount: number; // incremented on each retry/re-grade within session
  dueDate: string | null; // null for new items
  word: WordWithVerses;
  sm2: {
    easeFactor: number;
    interval: number;
    repetitions: number;
    status: string;
  } | null; // null for new items (not yet in spaced rep), set for reviews
}

/**
 * Ordered sequence of items for a single session.
 */
export interface SessionSequence {
  items: SessionItem[];
  totalCount: number;
  newCount: number;
  reviewCount: number;
  checkCount: number;
}

/**
 * Configuration for session composition.
 */
export interface SessionConfig {
  dailyNewTarget: number; // max new words to introduce today
  maxSessionSize: number; // hard cap on total items
}

/**
 * Compute new word items (up to dailyNewTarget).
 */
export function computeNewWords(
  availableNew: WordWithVerses[],
  cfg: SessionConfig,
): SessionItem[] {
  const count = Math.min(cfg.dailyNewTarget, availableNew.length);
  return availableNew.slice(0, count).map((word) => ({
    wordId: word.id,
    type: 'new',
    reviewCount: 0,
    dueDate: null,
    word,
    sm2: null,
  }));
}

/**
 * Compute due-for-review items (capped by remaining session capacity).
 */
export function computeDueReviews(
  due: DueCard[],
  cfg: SessionConfig,
  newItemsCount: number,
): SessionItem[] {
  const remainingCapacity = cfg.maxSessionSize - newItemsCount;
  const count = Math.min(remainingCapacity, due.length);

  return due.slice(0, count).map((card) => ({
    wordId: card.id,
    type: 'review',
    reviewCount: 0,
    dueDate: null, // dueDate is not on DueCard; would come from wordProgress context
    word: card,
    sm2: {
      easeFactor: card.easeFactor,
      interval: card.interval,
      repetitions: card.repetitions,
      status: card.status,
    },
  }));
}

/**
 * Compute quick-check items: the new words asked again, ungraded (Phase 1).
 */
export function computeChecks(newItems: SessionItem[]): SessionItem[] {
  // In Phase 1, checks are simple re-shows of new words (ungraded).
  // Each check item is a copy of the corresponding new item with type='check'.
  return newItems.map((newItem) => ({
    ...newItem,
    type: 'check',
    dueDate: null,
  }));
}

/**
 * Compose all item types into a single ordered sequence.
 * Order: new → review → check, capped at maxSessionSize.
 * All pure: no mutation, no external state, no Date/random.
 */
export function composeSessionSequence(
  newItems: SessionItem[],
  reviewItems: SessionItem[],
  checkItems: SessionItem[],
  cfg: SessionConfig,
): SessionSequence {
  // Flatten into single sequence in order: new, then review, then check
  const allItems = [...newItems, ...reviewItems, ...checkItems];

  // Cap at maxSessionSize
  const cappedItems = allItems.slice(0, cfg.maxSessionSize);

  // Count by type
  const counts = cappedItems.reduce(
    (acc, item) => {
      if (item.type === 'new') acc.newCount += 1;
      else if (item.type === 'review') acc.reviewCount += 1;
      else if (item.type === 'check') acc.checkCount += 1;
      return acc;
    },
    { newCount: 0, reviewCount: 0, checkCount: 0 },
  );

  return {
    items: cappedItems,
    totalCount: cappedItems.length,
    newCount: counts.newCount,
    reviewCount: counts.reviewCount,
    checkCount: counts.checkCount,
  };
}

/**
 * Top-level builder: orchestrates the full session composition.
 * Pure, deterministic, always terminates with finite output ≤ maxSessionSize.
 */
export function buildTodaySession(
  due: DueCard[],
  availableNew: WordWithVerses[],
  cfg: SessionConfig,
): SessionSequence {
  // Step 1: compute new word items
  const newItems = computeNewWords(availableNew, cfg);

  // Step 2: compute due reviews (capped by remaining capacity after new items)
  const reviewItems = computeDueReviews(due, cfg, newItems.length);

  // Step 3: compute checks from new items
  const checkItems = computeChecks(newItems);

  // Step 4: compose and cap
  return composeSessionSequence(newItems, reviewItems, checkItems, cfg);
}

/**
 * Helper: re-insert an item at the end of a session (for mistake recovery/retry).
 * Increments reviewCount. If reviewCount exceeds maxRetries, drops the item.
 * Returns a NEW sequence (no mutation of input).
 */
export function reinsertAtEnd(
  seq: SessionSequence,
  item: SessionItem,
  maxRetries: number = 2,
): SessionSequence {
  const newItem = { ...item, reviewCount: item.reviewCount + 1 };

  // If retried too many times, drop it
  if (newItem.reviewCount > maxRetries) {
    return seq;
  }

  // Append to end and recount
  const newItems = [...seq.items, newItem];
  const newCounts = newItems.reduce(
    (acc, i) => {
      if (i.type === 'new') acc.newCount += 1;
      else if (i.type === 'review') acc.reviewCount += 1;
      else if (i.type === 'check') acc.checkCount += 1;
      return acc;
    },
    { newCount: 0, reviewCount: 0, checkCount: 0 },
  );

  return {
    items: newItems,
    totalCount: newItems.length,
    newCount: newCounts.newCount,
    reviewCount: newCounts.reviewCount,
    checkCount: newCounts.checkCount,
  };
}
