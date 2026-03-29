const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'assets', 'db', 'kalima.db');
const GAPS_REPORT_PATH = path.join(__dirname, '..', 'scripts', 'gaps-report.json');

describe('Data Pipeline (DATA-01): Database exists and is valid', () => {
  test('kalima.db exists at assets/db/kalima.db', () => {
    expect(fs.existsSync(DB_PATH)).toBe(true);
  });

  test('kalima.db is not empty (> 100KB)', () => {
    const stats = fs.statSync(DB_PATH);
    expect(stats.size).toBeGreaterThan(100 * 1024);
  });
});

describe('Data Pipeline (DATA-02): Word entries have required fields', () => {
  let db;
  beforeAll(() => {
    const Database = require('better-sqlite3');
    db = new Database(DB_PATH, { readonly: true });
  });
  afterAll(() => db?.close());

  test('words table has rows', () => {
    const count = db.prepare('SELECT COUNT(*) as c FROM words').get();
    expect(count.c).toBeGreaterThan(0);
  });

  test('all words have arabic, transliteration, meaning, frequency_rank, occurrence_count', () => {
    const nulls = db.prepare(
      `SELECT COUNT(*) as c FROM words
       WHERE arabic IS NULL OR transliteration IS NULL OR meaning IS NULL
       OR frequency_rank IS NULL OR occurrence_count IS NULL`
    ).get();
    expect(nulls.c).toBe(0);
  });

  test('words with missing root/POS have NULL values (not empty strings) per D-04', () => {
    const emptyStrings = db.prepare(
      `SELECT COUNT(*) as c FROM words WHERE root = '' OR part_of_speech = ''`
    ).get();
    expect(emptyStrings.c).toBe(0);
  });
});

describe('Data Pipeline (DATA-03): Example verses linked', () => {
  let db;
  beforeAll(() => {
    const Database = require('better-sqlite3');
    db = new Database(DB_PATH, { readonly: true });
  });
  afterAll(() => db?.close());

  test('word_verses table has rows', () => {
    const count = db.prepare('SELECT COUNT(*) as c FROM word_verses').get();
    expect(count.c).toBeGreaterThan(0);
  });

  test('every word has at least 1 linked verse', () => {
    const orphans = db.prepare(
      `SELECT COUNT(*) as c FROM words w
       LEFT JOIN word_verses wv ON w.id = wv.word_id
       WHERE wv.id IS NULL`
    ).get();
    expect(orphans.c).toBe(0);
  });
});

describe('Data Pipeline (DATA-04): Levels structure', () => {
  let db;
  beforeAll(() => {
    const Database = require('better-sqlite3');
    db = new Database(DB_PATH, { readonly: true });
  });
  afterAll(() => db?.close());

  test('approximately 30 levels exist (25-35 range)', () => {
    const count = db.prepare('SELECT COUNT(*) as c FROM levels').get();
    expect(count.c).toBeGreaterThanOrEqual(25);
    expect(count.c).toBeLessThanOrEqual(35);
  });

  test('each level has 25-50 words', () => {
    const levels = db.prepare(
      'SELECT id, word_count FROM levels'
    ).all();
    levels.forEach(level => {
      expect(level.word_count).toBeGreaterThanOrEqual(25);
      expect(level.word_count).toBeLessThanOrEqual(50);
    });
  });

  test('cumulative coverage is monotonically increasing', () => {
    const levels = db.prepare(
      'SELECT cumulative_coverage FROM levels ORDER BY id'
    ).all();
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i].cumulative_coverage).toBeGreaterThan(levels[i-1].cumulative_coverage);
    }
  });

  test('final cumulative coverage is <= 1.0', () => {
    const last = db.prepare(
      'SELECT cumulative_coverage FROM levels ORDER BY id DESC LIMIT 1'
    ).get();
    expect(last.cumulative_coverage).toBeLessThanOrEqual(1.0);
  });
});

describe('Data Pipeline (DATA-05): Gaps report', () => {
  test('gaps-report.json exists', () => {
    expect(fs.existsSync(GAPS_REPORT_PATH)).toBe(true);
  });

  test('gaps-report.json has valid structure', () => {
    const report = JSON.parse(fs.readFileSync(GAPS_REPORT_PATH, 'utf8'));
    expect(report).toHaveProperty('generated');
    expect(report).toHaveProperty('totalWords');
    expect(report).toHaveProperty('gapsCount');
    expect(report).toHaveProperty('gaps');
    expect(Array.isArray(report.gaps)).toBe(true);
  });
});
