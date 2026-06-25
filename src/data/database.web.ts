// Web-only database implementation.
// Native builds use src/data/database.ts (expo-sqlite).

import { Asset } from 'expo-asset';
import * as schema from './schema';

type SqlJsDatabase = {
  exec: (sql: string) => unknown[];
  run: (sql: string, params?: unknown[]) => unknown;
  close?: () => void;
};

type SqlJsModule = {
  Database: new (data?: Uint8Array) => SqlJsDatabase;
};

let realDb: any = null;
let sqlDb: SqlJsDatabase | null = null;
let initPromise: Promise<void> | null = null;

const databaseAsset = require('../../assets/db/kalima.db');

function getLocalDate(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function ensureUserTables(sqlite: SqlJsDatabase): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS word_progress (
      word_id INTEGER PRIMARY KEY NOT NULL,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      interval INTEGER NOT NULL DEFAULT 0,
      repetitions INTEGER NOT NULL DEFAULT 0,
      due_date TEXT NOT NULL DEFAULT '1970-01-01',
      last_reviewed TEXT,
      status TEXT NOT NULL DEFAULT 'new'
    );
    CREATE INDEX IF NOT EXISTS idx_word_progress_due ON word_progress (due_date);
    CREATE INDEX IF NOT EXISTS idx_word_progress_status ON word_progress (status);
    CREATE TABLE IF NOT EXISTS level_progress (
      level_id INTEGER PRIMARY KEY NOT NULL,
      unlocked INTEGER NOT NULL DEFAULT 0,
      best_quiz_score REAL,
      completed_at TEXT
    );
  `);
}

function seedProgressTables(sqlite: SqlJsDatabase): void {
  const today = getLocalDate();
  // Realistic mid-journey state: the two highest-frequency levels (~100 words)
  // mastered so the comprehension % is motivating and consistent with "2 levels
  // done", a band of in-progress learning words, and a few brand-new — so the
  // Today loop still has new + due items.
  const rows: Array<[number, number, number, number, string, string | null, string]> = [];
  // The DB has 110 words across 5 levels (level 1 = ids 1-22). Leave a few level-1
  // words unseeded so the daily session has brand-new cards; the rest are learned
  // (review), with a front band due today so the session also surfaces reviews.
  for (let id = 1; id <= 88; id += 1) {
    if (id >= 19 && id <= 22) continue; // 4 brand-new level-1 words for the session
    // 'review' is the status getQuranPercent counts as "understood" (occurrence-weighted).
    const due = id <= 18 ? today : getLocalDate(14 + (id % 21));
    rows.push([id, 2.7, 20 + (id % 20), 6, due, getLocalDate(-((id % 12) + 1)), 'review']);
  }
  for (let id = 89; id <= 110; id += 1) {
    rows.push([id, 2.5, (id % 5) + 1, 2, getLocalDate((id % 4) - 1), getLocalDate(-1), 'learning']);
  }

  const placeholders = rows.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(',\n');
  sqlite.run(
    `INSERT OR IGNORE INTO word_progress (
        word_id, ease_factor, interval, repetitions, due_date, last_reviewed, status
      ) VALUES ${placeholders}`,
    rows.flat(),
  );

  sqlite.run(
    `
      INSERT OR IGNORE INTO level_progress (
        level_id, unlocked, best_quiz_score, completed_at
      ) VALUES
        (?, ?, ?, ?),
        (?, ?, ?, ?),
        (?, ?, ?, ?),
        (?, ?, ?, ?),
        (?, ?, ?, ?)
    `,
    [
      1, 1, 0.95, getLocalDate(-12),
      2, 1, 0.88, getLocalDate(-5),
      3, 1, 0.7, null,
      4, 1, null, null,
      5, 1, null, null,
    ],
  );
}

function setDrizzleDb(sqlite: SqlJsDatabase): void {
  ensureUserTables(sqlite);
  seedProgressTables(sqlite);

  const { drizzle } = require('drizzle-orm/sql-js');
  realDb = drizzle(sqlite, { schema });
  sqlDb = sqlite;
}

async function fetchBundledDatabase(): Promise<Uint8Array> {
  const asset = Asset.fromModule(databaseAsset);
  await asset.downloadAsync();

  const uri = asset.localUri ?? asset.uri;
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to load bundled database: ${response.status} ${response.statusText}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function initializeDatabase(): Promise<void> {
  if (realDb !== null) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const initSqlJs = require('sql.js');
    const SQL: SqlJsModule = await initSqlJs({
      locateFile: () => '/sql-wasm.wasm',
    });

    const bytes = await fetchBundledDatabase();
    setDrizzleDb(new SQL.Database(bytes));
  })();

  return initPromise;
}

export function setDb(sqlite: SqlJsDatabase): void {
  setDrizzleDb(sqlite);
}

export function getSqlJsDatabase(): SqlJsDatabase | null {
  return sqlDb;
}

export const db: any = new Proxy(
  {},
  {
    get(_target, prop) {
      if (realDb === null) {
        throw new Error(
          'Database accessed before initialization (initializeDatabase must run in DatabaseProvider first)',
        );
      }
      const value = realDb[prop];
      return typeof value === 'function' ? value.bind(realDb) : value;
    },
  },
);
