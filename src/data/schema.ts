import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

// --- Static tables (pre-populated by build-db.js) ---

export const levels = sqliteTable('levels', {
  id: integer('id').primaryKey(),           // 1-based (D-07)
  name: text('name').notNull(),             // e.g., "The Essentials" (D-06)
  wordCount: integer('word_count').notNull(),
  cumulativeCoverage: real('cumulative_coverage').notNull(), // 0.0-1.0 fraction
});

export const words = sqliteTable('words', {
  id: integer('id').primaryKey(),
  arabic: text('arabic').notNull(),          // Full tashkeel from Tanzil
  transliteration: text('transliteration').notNull(),
  meaning: text('meaning').notNull(),        // Primary English meaning
  root: text('root'),                        // nullable — D-04 gap handling
  partOfSpeech: text('part_of_speech'),      // nullable — D-04 gap handling
  frequencyRank: integer('frequency_rank').notNull(),
  occurrenceCount: integer('occurrence_count').notNull(),
  levelId: integer('level_id').notNull().references(() => levels.id),
  levelOrder: integer('level_order').notNull(), // position within level
}, (table) => [
  index('idx_words_level').on(table.levelId),
  index('idx_words_frequency').on(table.frequencyRank),
]);

export const wordVerses = sqliteTable('word_verses', {
  id: integer('id').primaryKey(),
  wordId: integer('word_id').notNull().references(() => words.id),
  surahNumber: integer('surah_number').notNull(),
  ayahNumber: integer('ayah_number').notNull(),
  arabicText: text('arabic_text').notNull(),  // Full ayah text with tashkeel
  translation: text('translation').notNull(), // Sahih International
  wordPosition: integer('word_position'),     // Token index within ayah (nullable)
}, (table) => [
  index('idx_word_verses_word').on(table.wordId),
]);

// --- User tables (empty at install, written at runtime) ---

export const wordProgress = sqliteTable('word_progress', {
  wordId: integer('word_id').primaryKey().references(() => words.id),
  easeFactor: real('ease_factor').notNull().default(2.5),
  interval: integer('interval').notNull().default(0),
  repetitions: integer('repetitions').notNull().default(0),
  dueDate: text('due_date').notNull().default('1970-01-01'),
  lastReviewed: text('last_reviewed'),
  status: text('status').notNull().default('new'),
}, (table) => [
  index('idx_word_progress_due').on(table.dueDate),
  index('idx_word_progress_status').on(table.status),
]);

export const levelProgress = sqliteTable('level_progress', {
  levelId: integer('level_id').primaryKey().references(() => levels.id),
  unlocked: integer('unlocked').notNull().default(0),
  bestQuizScore: real('best_quiz_score'),
  completedAt: text('completed_at'),
});
