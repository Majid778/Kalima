import * as schema from './schema';

// IMPORTANT: do NOT open a connection at import time.
//
// `openDatabaseSync('kalima.db')` at module-eval would create an empty
// SQLite/kalima.db *before* <SQLiteProvider assetSource> (in App.tsx) gets a
// chance to copy the bundled, pre-populated 1.6 MB database. SQLiteProvider
// never overwrites an existing file (user progress tables live in the same
// db), so that empty file would permanently shadow the real data → every
// data-driven screen renders blank.
//
// Instead the singleton is initialized from the provider's already
// asset-copied connection via setDb() (called by the DbGate in App.tsx),
// before any screen mounts.

let db: any;

export function setDb(sqlite: any): void {
  const { drizzle } = require('drizzle-orm/expo-sqlite');
  db = drizzle(sqlite, { schema });
}

export { db };
