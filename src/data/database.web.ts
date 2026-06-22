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
  const yesterday = getLocalDate(-1);
  const twoDaysAgo = getLocalDate(-2);
  const fourDaysAgo = getLocalDate(-4);
  const nextWeek = getLocalDate(7);
  const nextMonth = getLocalDate(30);

  sqlite.run(
    `
      INSERT OR IGNORE INTO word_progress (
        word_id, ease_factor, interval, repetitions, due_date, last_reviewed, status
      ) VALUES
        (?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      1, 2.5, 0, 0, today, null, 'new',
      2, 2.55, 1, 1, today, yesterday, 'learning',
      3, 2.6, 3, 2, yesterday, twoDaysAgo, 'learning',
      4, 2.7, 7, 3, nextWeek, fourDaysAgo, 'learning',
      5, 2.85, 21, 6, nextMonth, getLocalDate(-21), 'known',
      6, 2.9, 30, 8, nextMonth, getLocalDate(-30), 'known',
      7, 2.5, 0, 0, today, null, 'new',
      8, 2.55, 2, 1, today, yesterday, 'learning',
    ],
  );

  sqlite.run(
    `
      INSERT OR IGNORE INTO level_progress (
        level_id, unlocked, best_quiz_score, completed_at
      ) VALUES
        (?, ?, ?, ?),
        (?, ?, ?, ?),
        (?, ?, ?, ?)
    `,
    [
      1, 1, 0.95, getLocalDate(-10),
      2, 1, 0.62, null,
      3, 0, null, null,
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
