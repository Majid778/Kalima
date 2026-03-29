#!/usr/bin/env node
// scripts/validate-db.js — Post-build database validation
// Run: node scripts/validate-db.js
// Exit code: 0 = valid, 1 = errors found

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'assets', 'db', 'kalima.db');
const GAPS_PATH = path.join(__dirname, 'gaps-report.json');

let errors = 0;

function check(name, condition, detail) {
  if (condition) {
    console.log(`  PASS: ${name}`);
  } else {
    console.error(`  FAIL: ${name} — ${detail}`);
    errors++;
  }
}

function query(db, sql) {
  const result = db.exec(sql);
  if (!result.length) return [];
  return result[0].values.map(row => {
    const obj = {};
    result[0].columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function queryOne(db, sql) {
  const rows = query(db, sql);
  return rows.length > 0 ? rows[0] : null;
}

async function main() {
  console.log('Kalima Database Validation\n');

  // Check 1: DB file exists and is not empty
  check('DB exists', fs.existsSync(DB_PATH), `${DB_PATH} not found`);
  if (!fs.existsSync(DB_PATH)) {
    console.log(`\nValidation complete: ${errors} errors`);
    process.exit(1);
  }

  const stats = fs.statSync(DB_PATH);
  check('DB size > 100KB', stats.size > 100 * 1024, `Size: ${stats.size} bytes`);

  const SQL = await initSqlJs();
  const buf = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buf);

  // Check 2: Table counts
  const wordCount = queryOne(db, 'SELECT COUNT(*) as c FROM words').c;
  check('Words > 500', wordCount > 500, `Got ${wordCount}`);

  const levelCount = queryOne(db, 'SELECT COUNT(*) as c FROM levels').c;
  check('Levels 25-35', levelCount >= 25 && levelCount <= 35, `Got ${levelCount}`);

  const verseCount = queryOne(db, 'SELECT COUNT(*) as c FROM word_verses').c;
  check('Verses > 500', verseCount > 500, `Got ${verseCount}`);

  // Check 3: No empty string roots/POS (must be NULL per D-04)
  const emptyRoots = queryOne(db, "SELECT COUNT(*) as c FROM words WHERE root = ''").c;
  check('No empty root strings', emptyRoots === 0, `Found ${emptyRoots} empty root strings`);

  const emptyPOS = queryOne(db, "SELECT COUNT(*) as c FROM words WHERE part_of_speech = ''").c;
  check('No empty POS strings', emptyPOS === 0, `Found ${emptyPOS} empty POS strings`);

  // Check 4: Required fields not null
  const nullRequired = queryOne(db,
    `SELECT COUNT(*) as c FROM words
     WHERE arabic IS NULL OR transliteration IS NULL OR meaning IS NULL
     OR frequency_rank IS NULL OR occurrence_count IS NULL`
  ).c;
  check('No null required fields', nullRequired === 0, `Found ${nullRequired} with null required fields`);

  // Check 5: Every word has at least 1 verse
  const orphanWords = queryOne(db,
    `SELECT COUNT(*) as c FROM words w
     LEFT JOIN word_verses wv ON w.id = wv.word_id
     WHERE wv.id IS NULL`
  ).c;
  check('No orphan words', orphanWords === 0, `Found ${orphanWords} words without verses`);

  // Check 6: Level word counts in range
  const badLevels = query(db,
    'SELECT id, word_count FROM levels WHERE word_count < 25 OR word_count > 50'
  );
  check('Level word counts 25-50', badLevels.length === 0,
    `Levels out of range: ${badLevels.map(l => `${l.id}:${l.word_count}`).join(', ')}`);

  // Check 7: Cumulative coverage monotonically increasing
  const coverages = query(db, 'SELECT cumulative_coverage FROM levels ORDER BY id');
  let monotonic = true;
  for (let i = 1; i < coverages.length; i++) {
    if (coverages[i].cumulative_coverage <= coverages[i-1].cumulative_coverage) {
      monotonic = false;
      break;
    }
  }
  check('Coverage monotonically increasing', monotonic, 'Coverage not strictly increasing');
  check('Final coverage <= 1.0', coverages[coverages.length-1].cumulative_coverage <= 1.0,
    `Final coverage: ${coverages[coverages.length-1].cumulative_coverage}`);

  // Check 8: Gaps report exists
  check('gaps-report.json exists', fs.existsSync(GAPS_PATH), `${GAPS_PATH} not found`);
  if (fs.existsSync(GAPS_PATH)) {
    const report = JSON.parse(fs.readFileSync(GAPS_PATH, 'utf8'));
    check('Gaps report has structure', report.totalWords > 0 && Array.isArray(report.gaps),
      'Invalid gaps report structure');
  }

  db.close();

  console.log(`\nValidation complete: ${errors} errors`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Validation error:', err.message);
  process.exit(1);
});
