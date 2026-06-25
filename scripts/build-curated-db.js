#!/usr/bin/env node
// scripts/build-curated-db.js — build assets/db/kalima.db from a curated word list.
// Words + meanings are hand-curated (scripts/curated-levels.json); example ayat,
// translations, occurrence counts and coverage come from the real Quran sources in
// scripts/data/raw. Run: node scripts/build-curated-db.js

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const RAW_DIR = path.join(__dirname, 'data', 'raw');
const OUT_DB = path.join(__dirname, '..', 'assets', 'db', 'kalima.db');
const CURATED = require('./curated-levels.json');

// Normalise Arabic for matching: drop diacritics/marks/tatweel, fold alef + hamza
// + alef-maqsura + ta-marbuta. Applied identically to curated words and ayah tokens.
function norm(s) {
  return s
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭ]/g, '')
    .replace(/ـ/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/ى/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ءؤئ]/g, '')
    .trim();
}
// Remove one leading clitic letter and/or a leading definite article.
function destem(t) {
  return t.replace(/^(?:و|ف|ب|ك|ل|س)/, '').replace(/^ال/, '');
}

console.log('=== Kalima curated DB build ===');

// --- Load sources ---
const quran = JSON.parse(fs.readFileSync(path.join(RAW_DIR, 'quran-uthmani.json'), 'utf8'));
const translations = {};
for (const line of fs.readFileSync(path.join(RAW_DIR, 'en.sahih.txt'), 'utf8').split('\n')) {
  const p = line.split('|');
  if (p.length >= 3) translations[`${p[0].trim()}:${p[1].trim()}`] = p.slice(2).join('|').trim();
}

// --- Flatten every ayah token once ---
const ayahText = {};            // "s:a" -> full ayah text
const tokens = [];              // { s, a, pos, n (norm), d (destemmed), len }
let totalTokens = 0;
for (const surah of quran.data.surahs) {
  for (const ayah of surah.ayahs) {
    const text = ayah.text.replace(/﻿/g, '').trim();
    const key = `${surah.number}:${ayah.numberInSurah}`;
    ayahText[key] = text;
    const parts = text.split(/\s+/);
    parts.forEach((tok, i) => {
      const n = norm(tok);
      if (!n) return;
      totalTokens++;
      tokens.push({ s: surah.number, a: ayah.numberInSurah, pos: i, n, d: destem(n), len: text.length });
    });
  }
}
console.log(`  loaded ${Object.keys(ayahText).length} ayat, ${totalTokens} tokens`);

// --- For each curated word: occurrence count + best example ayah ---
// tier 1 = exact (destemmed) match, 2 = starts-with, 3 = substring. Prefer lower tier, then shorter ayah.
function matchTier(tok, core) {
  if (tok.n === core || tok.d === core) return 1;
  if (tok.n.startsWith(core) || tok.d.startsWith(core)) return 2;
  if (tok.n.includes(core) || tok.d.includes(core)) return 3;
  return 0;
}

const words = [];               // flat, with level + order
for (const level of CURATED.levels) {
  level.words.forEach((w, idx) => {
    const core = destem(norm(w.arabic));
    let best = null;            // { tier, len, s, a, pos }
    for (const tok of tokens) {
      const tier = matchTier(tok, core);
      if (!tier) continue;
      if (!best || tier < best.tier || (tier === best.tier && tok.len < best.len)) {
        best = { tier, len: tok.len, s: tok.s, a: tok.a, pos: tok.pos };
      }
    }
    words.push({
      arabic: w.arabic, transliteration: w.translit, meaning: w.meaning, root: w.root || null,
      levelId: level.id, levelOrder: idx + 1, core, occurrenceCount: 0, verse: best,
    });
  });
}

// Honest coverage: assign each Quran token to at most ONE word (longest matching
// core wins) so the per-word counts sum to <= total tokens (coverage <= 100%).
const byLen = words.map((w, i) => ({ i, core: w.core })).sort((a, b) => b.core.length - a.core.length);
for (const tok of tokens) {
  for (const wc of byLen) {
    const c = wc.core;
    // Exact match only (after clitic/article stripping) so the coverage % counts
    // the actual word, not every inflection that merely begins with it.
    if (tok.n === c || tok.d === c) { words[wc.i].occurrenceCount++; break; }
  }
}

// frequency rank by descending occurrence
[...words].sort((x, y) => y.occurrenceCount - x.occurrenceCount).forEach((w, i) => { w.frequencyRank = i + 1; });

const unmatched = words.filter((w) => !w.verse);
console.log(`  matched a real ayah for ${words.length - unmatched.length}/${words.length} words`);
if (unmatched.length) console.log('  NO AYAH (check spelling):', unmatched.map((w) => w.arabic).join(', '));

// --- Level rows with real cumulative coverage ---
const levelRows = [];
let cum = 0;
for (const level of CURATED.levels) {
  const lw = words.filter((w) => w.levelId === level.id);
  cum += lw.reduce((s, w) => s + w.occurrenceCount, 0);
  levelRows.push({ id: level.id, name: level.name, wordCount: lw.length, cumulativeCoverage: cum / totalTokens });
}
console.log(`  5 levels, cumulative coverage to L5: ${(levelRows[levelRows.length - 1].cumulativeCoverage * 100).toFixed(1)}%`);

// --- Write DB ---
(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(`
    CREATE TABLE levels (id INTEGER PRIMARY KEY, name TEXT NOT NULL, word_count INTEGER NOT NULL, cumulative_coverage REAL NOT NULL);
    CREATE TABLE words (id INTEGER PRIMARY KEY, arabic TEXT NOT NULL, transliteration TEXT NOT NULL, meaning TEXT NOT NULL,
      root TEXT, part_of_speech TEXT, frequency_rank INTEGER NOT NULL, occurrence_count INTEGER NOT NULL,
      level_id INTEGER NOT NULL REFERENCES levels(id), level_order INTEGER NOT NULL);
    CREATE TABLE word_verses (id INTEGER PRIMARY KEY, word_id INTEGER NOT NULL REFERENCES words(id),
      surah_number INTEGER NOT NULL, ayah_number INTEGER NOT NULL, arabic_text TEXT NOT NULL, translation TEXT NOT NULL, word_position INTEGER);
    CREATE INDEX idx_words_level ON words(level_id);
    CREATE INDEX idx_words_frequency ON words(frequency_rank);
    CREATE INDEX idx_word_verses_word ON word_verses(word_id);
  `);

  const il = db.prepare('INSERT INTO levels (id,name,word_count,cumulative_coverage) VALUES (?,?,?,?)');
  for (const l of levelRows) il.run([l.id, l.name, l.wordCount, l.cumulativeCoverage]);
  il.free();

  const iw = db.prepare(`INSERT INTO words (id,arabic,transliteration,meaning,root,part_of_speech,frequency_rank,occurrence_count,level_id,level_order)
    VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const iv = db.prepare(`INSERT INTO word_verses (word_id,surah_number,ayah_number,arabic_text,translation,word_position) VALUES (?,?,?,?,?,?)`);
  let id = 0, verses = 0;
  for (const w of words) {
    id++;
    iw.run([id, w.arabic, w.transliteration, w.meaning, w.root, null, w.frequencyRank, w.occurrenceCount, w.levelId, w.levelOrder]);
    if (w.verse) {
      const key = `${w.verse.s}:${w.verse.a}`;
      iv.run([id, w.verse.s, w.verse.a, ayahText[key], translations[key] || '(translation unavailable)', w.verse.pos]);
      verses++;
    }
  }
  iw.free(); iv.free();

  fs.writeFileSync(OUT_DB, Buffer.from(db.export()));
  db.close();
  console.log(`  wrote ${id} words, ${verses} verses -> ${path.relative(process.cwd(), OUT_DB)}`);
  console.log('=== done ===');
})().catch((e) => { console.error(e); process.exit(1); });
