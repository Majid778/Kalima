import * as schema from './schema';

// IMPORTANT: do NOT open a connection at import time.
//
// `openDatabaseSync('kalima.db')` at module-eval would create an empty
// SQLite/kalima.db *before* <SQLiteProvider assetSource> (in App.tsx) gets a
// chance to copy the bundled, pre-populated 1.6 MB database. SQLiteProvider
// never overwrites an existing file (user progress tables share it), so that
// empty file would permanently shadow the real data → every data-driven
// screen renders blank.
//
// The real drizzle instance is created from the provider's already
// asset-copied connection via setDb() (called by the DbGate in App.tsx)
// before any screen mounts.
//
// `db` is exported as a STABLE Proxy rather than a reassigned `let`. A
// reassigned export does not reliably propagate to modules that did
// `import { db }` (Metro/React-Compiler may capture a stale binding), which
// left every screen holding an undefined db. The Proxy is a fixed reference
// that forwards every access to the live instance, so consumers always hit
// the initialized database with no call-site changes.

let realDb: any = null;

// The bundled kalima.db ships only the STATIC tables (words, levels,
// word_verses, populated by build-db.js). The USER tables are "empty at
// install" per schema.ts — but App.tsx runs no drizzle migrations, so they
// would never exist at runtime, and every progress query failed with
// "no such table: word_progress". We create them idempotently at init so a
// prepopulated DB and a runtime-created one converge. Indexes mirror schema.ts.
function ensureUserTables(sqlite: any): void {
  sqlite.execSync(`
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

export function setDb(sqlite: any): void {
  ensureUserTables(sqlite);
  const { drizzle } = require('drizzle-orm/expo-sqlite');
  realDb = drizzle(sqlite, { schema });
}

export const db: any = new Proxy(
  {},
  {
    get(_target, prop) {
      if (realDb === null) {
        throw new Error(
          'Database accessed before initialization (setDb must run in DbGate first)',
        );
      }
      const value = realDb[prop];
      return typeof value === 'function' ? value.bind(realDb) : value;
    },
  },
);
