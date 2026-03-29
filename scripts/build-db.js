#!/usr/bin/env node
// scripts/build-db.js — Kalima Data Pipeline
// Run: node scripts/build-db.js
// Output: assets/db/kalima.db, scripts/gaps-report.json
//
// Data sources:
//   - AlQuran Cloud API (quran-uthmani.json) — Uthmani Arabic text with full tashkeel
//   - Quranic Arabic Corpus v0.4 (quranic-corpus-morphology.txt) — root, POS, lemma
//   - Tanzil.net (en.sahih.txt) — Sahih International English translation

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const RAW_DIR = path.join(__dirname, 'data', 'raw');
const OUT_DB = path.join(__dirname, '..', 'assets', 'db', 'kalima.db');
const GAPS_REPORT = path.join(__dirname, 'gaps-report.json');
const LEVEL_CONFIG = require('./level-config.json');
const CHECKSUMS_PATH = path.join(RAW_DIR, 'checksums.sha256');

// ===== Transliteration mapping (Buckwalter-like to readable) =====
const ARABIC_TO_TRANSLITERATION = {
  '\u0627': 'a',     // alif
  '\u0628': 'b',     // ba
  '\u062A': 't',     // ta
  '\u062B': 'th',    // tha
  '\u062C': 'j',     // jim
  '\u062D': 'H',     // ha
  '\u062E': 'kh',    // kha
  '\u062F': 'd',     // dal
  '\u0630': 'dh',    // dhal
  '\u0631': 'r',     // ra
  '\u0632': 'z',     // zayn
  '\u0633': 's',     // sin
  '\u0634': 'sh',    // shin
  '\u0635': 'S',     // sad
  '\u0636': 'D',     // dad
  '\u0637': 'T',     // ta (emphatic)
  '\u0638': 'Z',     // za (emphatic)
  '\u0639': '\'',    // ayn
  '\u063A': 'gh',    // ghayn
  '\u0641': 'f',     // fa
  '\u0642': 'q',     // qaf
  '\u0643': 'k',     // kaf
  '\u0644': 'l',     // lam
  '\u0645': 'm',     // mim
  '\u0646': 'n',     // nun
  '\u0647': 'h',     // ha
  '\u0648': 'w',     // waw
  '\u064A': 'y',     // ya
  '\u0621': '\'',    // hamza
  '\u0623': 'a',     // alif with hamza above
  '\u0625': 'i',     // alif with hamza below
  '\u0624': 'u',     // waw with hamza
  '\u0626': 'y',     // ya with hamza
  '\u0629': 'h',     // ta marbuta
  '\u0649': 'a',     // alif maqsura
  '\u0671': 'a',     // alif wasla
  '\u0670': 'a',     // superscript alif (alif khanjariyya)
  // Diacritics — skip in transliteration
  '\u064E': 'a',     // fatha
  '\u064F': 'u',     // damma
  '\u0650': 'i',     // kasra
  '\u064B': 'an',    // fathatan
  '\u064C': 'un',    // dammatan
  '\u064D': 'in',    // kasratan
  '\u0651': '',      // shadda (handled separately)
  '\u0652': '',      // sukun
};

function transliterate(arabic) {
  let result = '';
  const chars = [...arabic];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const mapped = ARABIC_TO_TRANSLITERATION[ch];
    if (mapped !== undefined) {
      // If shadda, double the previous consonant
      if (ch === '\u0651' && result.length > 0) {
        // Find last consonant
        const lastChar = result[result.length - 1];
        result += lastChar;
      } else {
        result += mapped;
      }
    }
    // Skip unknown characters (tatweel, special marks, etc.)
  }
  // Clean up double vowels and normalize
  result = result.replace(/aa+/g, 'aa').replace(/ii+/g, 'ii').replace(/uu+/g, 'uu');
  return result || arabic;
}

// ===== Buckwalter root to Arabic =====
const BUCKWALTER_TO_ARABIC = {
  'A': '\u0627', 'b': '\u0628', 't': '\u062A', 'v': '\u062B', 'j': '\u062C',
  'H': '\u062D', 'x': '\u062E', 'd': '\u062F', '*': '\u0630', 'r': '\u0631',
  'z': '\u0632', 's': '\u0633', '$': '\u0634', 'S': '\u0635', 'D': '\u0636',
  'T': '\u0637', 'Z': '\u0638', 'E': '\u0639', 'g': '\u063A', 'f': '\u0641',
  'q': '\u0642', 'k': '\u0643', 'l': '\u0644', 'm': '\u0645', 'n': '\u0646',
  'h': '\u0647', 'w': '\u0648', 'y': '\u064A', '\'': '\u0621', '>': '\u0623',
  '<': '\u0625', '&': '\u0624', '}': '\u0626', 'p': '\u0629', 'Y': '\u0649',
  '{': '\u0671', '`': '\u0670',
};

function buckwalterToArabic(bw) {
  return [...bw].map(c => BUCKWALTER_TO_ARABIC[c] || c).join('');
}

// ===== POS tag mapping =====
const POS_MAP = {
  'N': 'noun', 'PN': 'proper noun', 'ADJ': 'adjective',
  'V': 'verb', 'IMPV': 'verb', 'PV': 'verb', 'IV': 'verb',
  'P': 'preposition', 'CONJ': 'conjunction', 'DET': 'determiner',
  'PRO': 'pronoun', 'DEM': 'demonstrative', 'REL': 'relative pronoun',
  'PRON': 'pronoun', 'NEG': 'negative particle', 'INTG': 'interrogative',
  'T': 'time adverb', 'LOC': 'location adverb', 'ACC': 'accusative particle',
  'COND': 'conditional', 'CERT': 'certainty particle', 'RES': 'restriction particle',
  'EXP': 'explanation particle', 'SUR': 'surprise particle', 'AVR': 'aversion particle',
  'EXH': 'exhortation particle', 'ANS': 'answer particle', 'INC': 'inceptive particle',
  'AMD': 'amendment particle', 'RET': 'retraction particle', 'SUP': 'supplemental particle',
  'INL': 'interrog particle', 'FUT': 'future particle', 'CIRC': 'circumstantial particle',
  'SUB': 'subordinating conjunction', 'VOC': 'vocative particle',
};

// ===== Simple English meaning dictionary for most common Quran words =====
// We provide meanings for the most frequently occurring lemmas.
// This is a curated baseline; corpus data does not include English meanings.
const WORD_MEANINGS = {};

// We'll load meanings from a generated dictionary below.

function buildMeaningDictionary() {
  // Core meanings for the most common Arabic word forms in the Quran.
  // Keys are stripped Arabic (no diacritics) to enable fuzzy matching.
  const meanings = {
    // Most frequent words
    '\u0627\u0644\u0644\u0647': 'Allah (God)',
    '\u0641\u064A': 'in',
    '\u0645\u0646': 'from, of',
    '\u0645\u0627': 'what, not',
    '\u0625\u0646': 'indeed, verily',
    '\u0639\u0644\u0649': 'upon, on',
    '\u0625\u0644\u0649': 'to, toward',
    '\u0623\u0646': 'that',
    '\u0644\u0627': 'no, not',
    '\u0647\u0645': 'they, them',
    '\u0647\u0648': 'he',
    '\u0643\u0627\u0646': 'was, to be',
    '\u0642\u0627\u0644': 'said, to say',
    '\u0630\u0644\u0643': 'that',
    '\u0647\u0630\u0627': 'this',
    '\u0627\u0644\u0630\u064A\u0646': 'those who',
    '\u0627\u0644\u0630\u064A': 'who, which',
    '\u0648': 'and',
    '\u0628': 'with, by',
    '\u0644': 'for, to',
    '\u0643': 'as, like',
    '\u064A\u0627': 'O (vocative)',
  };

  // Lemma-based meanings (from Buckwalter lemma to meaning)
  const lemmaMeanings = {
    '{ll~ah': 'Allah (God)',
    'rab~': 'Lord',
    'qaAl': 'to say',
    'kaAn': 'to be, was',
    'Ealim': 'to know',
    'jaEal': 'to make',
    '>amar': 'to command',
    'raHiym': 'merciful',
    'r~aHoma`n': 'Most Gracious',
    'kitaAb': 'book',
    '>ayap': 'sign, verse',
    'naAs': 'people, mankind',
    'yawom': 'day',
    '>aroD': 'earth',
    'samaA\'': 'sky, heaven',
    'jan~ap': 'garden, paradise',
    'naAr': 'fire, hellfire',
    'Eabod': 'servant, to worship',
    'Hamod': 'praise',
    'Ea`lamiyn': 'worlds',
    'SiraAT': 'path',
    'hud': 'guidance',
    'hudY': 'guidance',
    '>amana': 'to believe',
    '<iymAn': 'faith, belief',
    'kaAfir': 'disbeliever',
    'kufor': 'disbelief',
    'SalaAp': 'prayer',
    'zakaAp': 'charity',
    'Sawom': 'fasting',
    'Haj~': 'pilgrimage',
    'jihaAd': 'striving',
    'tawobap': 'repentance',
    'mawot': 'death',
    'HayaAp': 'life',
    'Haq~': 'truth, right',
    'baATil': 'falsehood',
    'Euquwbap': 'punishment',
    'vawAb': 'reward',
    'xayar': 'good',
    '$ar~': 'evil',
    'Ealayo': 'upon',
    'mino': 'from',
    '<ilaY': 'toward',
    'fiY': 'in',
    'EalaY': 'upon',
    'min': 'from',
    'maA': 'what, not',
    '<in~a': 'indeed',
    'laA': 'no, not',
    'huwa': 'he',
    'hum': 'they',
    'Ea*aAb': 'punishment',
    'qawom': 'people, nation',
    'dunyaA': 'worldly life',
    '>aAxirap': 'hereafter',
    'mala`~ikap': 'angels',
    'nabiy~': 'prophet',
    'rasuWl': 'messenger',
    'muWsaY': 'Moses',
    'EiysaY': 'Jesus',
    '<iboraAhiym': 'Abraham',
    'nuWH': 'Noah',
    'maryam': 'Mary',
    '{bono': 'son',
    '>ab': 'father',
    '>um~': 'mother',
    'zawoj': 'spouse, pair',
    'walad': 'child',
    '>axo': 'brother',
    'maA\'': 'water',
    'laylon': 'night',
    'nahaAr': 'day (daytime)',
    '$amos': 'sun',
    'qamar': 'moon',
    'najom': 'star',
    'baHor': 'sea',
    'jabal': 'mountain',
    '$ajar': 'tree',
    'riyzq': 'provision',
    'maAl': 'wealth',
    'Eadol': 'justice',
    'Zuolm': 'oppression',
    'Sabor': 'patience',
    '$ukor': 'gratitude',
    'taqowaY': 'God-consciousness',
    'riDowaAn': 'pleasure (divine)',
    'EahoD': 'covenant',
    'niEomap': 'blessing',
    '{som': 'name',
    'qabol': 'before',
    'baEod': 'after',
    'bayona': 'between',
    'fawoq': 'above',
    'taHot': 'beneath',
    'Einod': 'with, at',
    'kulol': 'all, every',
    'baEoD': 'some',
    'gayar': 'other than',
    'mival': 'like, example',
    'nuur': 'light',
    'Zulumap': 'darkness',
    'Hukm': 'judgment, ruling',
    'suloTaAn': 'authority',
    'Eilom': 'knowledge',
    'Hikomap': 'wisdom',
    'kalimAp': 'word',
    'qurA`n': 'Quran',
    'tawraAp': 'Torah',
    '<injiyl': 'Gospel',
    'diin': 'religion',
    '<islaAm': 'Islam',
    '>amn': 'security',
    'xawof': 'fear',
    'rajaA\'': 'hope',
    'Hub~': 'love',
    'bago': 'desire wrongfully',
    'Hasad': 'envy',
    'kibar': 'pride',
    'tawaADuE': 'humility',
    '>akal': 'to eat',
    '$arib': 'to drink',
    'qaEad': 'to sit',
    'qaAm': 'to stand',
    'ma$aY': 'to walk',
    'raka': 'to ride',
    'dakala': 'to enter',
    'xaraja': 'to exit',
    'ra>aY': 'to see',
    'samiE': 'to hear',
    'Eaqal': 'to reason',
    'fakar': 'to think',
    '*akar': 'to remember',
    'nasiY': 'to forget',
    'fataH': 'to open',
    'xatam': 'to seal',
    'HafiZ': 'to guard, protect',
    'nasara': 'to help',
    'kataba': 'to write',
    'qara>a': 'to read, recite',
    'Hamala': 'to carry',
    'waDaE': 'to place',
    '>axad': 'to take',
    '>aETaY': 'to give',
    'razaqa': 'to provide',
    '>anofaqa': 'to spend',
    '>akala': 'to eat',
    'Dalal': 'misguidance',
    'Eaduw~': 'enemy',
    'waliy~': 'ally, protector',
    'naSiyr': 'helper',
    '$ahiyd': 'witness, martyr',
    'Siddiyq': 'truthful',
    'munaAfiq': 'hypocrite',
    'ZaAlim': 'wrongdoer',
    'muHosin': 'doer of good',
    'muttaqiy': 'God-conscious',
    'Sabar': 'to be patient',
    'tawab': 'to repent',
    '$akar': 'to be grateful',
    'xalaqa': 'to create',
    'razaq': 'to provide',
    '>arosal': 'to send',
    '>anzal': 'to reveal',
    'hadaY': 'to guide',
    '>aDal~': 'to mislead',
    'gafar': 'to forgive',
    'raHim': 'to have mercy',
    '>aHab~': 'to love',
    'waEad': 'to promise',
    '>awaAd': 'to threaten',
    'ba$~ar': 'to give glad tidings',
    '>an*ar': 'to warn',
    'Hakam': 'to judge',
    'fasal': 'to decide',
    'wasaE': 'to encompass',
    '>aHaAT': 'to surround',
    'qadara': 'to decree',
    '$aA\'': 'to will',
    'sajaD': 'to prostrate',
    'rakaE': 'to bow',
    'Saf~': 'to line up',
    'tasabiyH': 'glorification',
    'daEaA': 'to call, invoke',
    '*ikorY': 'remembrance',
    'du': 'possessor of',
    'Saadiq': 'truthful',
    'bayin': 'clear evidence',
    'bayyinap': 'clear proof',
    'burohaAn': 'proof',
    'EaAqibap': 'consequence',
    'jahannam': 'Hell',
    'jannap': 'Paradise, Garden',
    'firo': 'Pharaoh',
    'diin': 'religion, faith',
    'Eamal': 'deed, action',
    'SaAliH': 'righteous',
    'Saalih': 'righteous',
    'su\'': 'evil',
    'Hasanap': 'good deed',
    'sayyi\'ap': 'bad deed',
    'rabb': 'Lord',
    'malik': 'king, owner',
    'Eaziz': 'mighty',
    'Hakim': 'wise',
    'waahid': 'one',
    'samad': 'eternal, self-sufficient',
    'gafuwr': 'forgiving',
    'raHiym': 'merciful',
    'rahmaan': 'Most Gracious',
    'qadyr': 'able, powerful',
    'laTiyf': 'subtle, kind',
    'xabiyr': 'aware',
    'samiE': 'hearing',
    'baSiyr': 'seeing',
    'Ealiy': 'Most High',
    'Eazym': 'magnificent',
    'kariym': 'generous',
    'shakuwr': 'appreciative',
    'Haliym': 'forbearing',
    'tawwab': 'acceptor of repentance',
    'qahhar': 'irresistible',
    'wahhaab': 'bestower',
    'razzaaq': 'provider',
    'fattaaH': 'opener',
  };

  return { formMeanings: meanings, lemmaMeanings };
}

// ===== Strip diacritics for comparison =====
function stripDiacritics(text) {
  // Remove Arabic diacritical marks (tashkeel)
  return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\uFE70-\uFEFF\uFBB2-\uFBC2]/g, '')
             .replace(/\uFEFF/g, '') // BOM
             .trim();
}

// ===== CHECKSUM VERIFICATION =====
function verifyChecksums() {
  console.log('Step 0: Verifying source data integrity...');

  if (!fs.existsSync(CHECKSUMS_PATH)) {
    console.error('ERROR: checksums.sha256 not found at', CHECKSUMS_PATH);
    console.error('This file contains known-good SHA-256 hashes for Quran source data.');
    process.exit(1);
  }

  const checksumLines = fs.readFileSync(CHECKSUMS_PATH, 'utf8')
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'));

  let allValid = true;
  const verified = [];

  for (const line of checksumLines) {
    const match = line.match(/^([a-f0-9]{64})\s+(.+)$/);
    if (!match) continue;

    const [, expectedHash, filename] = match;
    const filePath = path.join(RAW_DIR, filename.trim());

    if (!fs.existsSync(filePath)) {
      // Optional files (corpus, translation) may not exist — skip
      console.log(`  SKIP: ${filename} (not present)`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    if (actualHash === expectedHash) {
      console.log(`  PASS: ${filename}`);
      verified.push(filename);
    } else {
      console.error(`  CHECKSUM FAIL: ${filename}`);
      console.error(`    Expected: ${expectedHash}`);
      console.error(`    Actual:   ${actualHash}`);
      allValid = false;
    }
  }

  if (!allValid) {
    console.error('\nERROR: Source data integrity check failed.');
    console.error('Raw data files do not match known-good checksums.');
    console.error('Re-download source files or update checksums.sha256 if intentional.');
    process.exit(1);
  }

  // quran-uthmani.json is required — must have been verified
  if (!verified.includes('quran-uthmani.json')) {
    console.error('ERROR: quran-uthmani.json was not verified (missing from checksums or not present)');
    process.exit(1);
  }

  console.log(`  ${verified.length} file(s) verified\n`);
  return verified;
}

// ===== Main pipeline =====
async function main() {
  console.log('=== Kalima Data Pipeline ===\n');

  // --- Step 0: Checksum verification ---
  const verifiedFiles = verifyChecksums();

  // --- Check prerequisites ---
  const quranPath = path.join(RAW_DIR, 'quran-uthmani.json');
  const corpusPath = path.join(RAW_DIR, 'quranic-corpus-morphology.txt');
  const translationPath = path.join(RAW_DIR, 'en.sahih.txt');

  if (!fs.existsSync(quranPath)) {
    console.error('ERROR: Quran text file not found at', quranPath);
    console.error('Download from AlQuran Cloud API:');
    console.error('  curl -o scripts/data/raw/quran-uthmani.json "https://api.alquran.cloud/v1/quran/quran-uthmani"');
    process.exit(1);
  }

  if (!LEVEL_CONFIG || !LEVEL_CONFIG.levels) {
    console.error('ERROR: level-config.json is missing or invalid');
    process.exit(1);
  }

  let hasCorpus = fs.existsSync(corpusPath);
  if (!hasCorpus) {
    console.warn('WARNING: Corpus morphology file not found. All root/POS values will be NULL.');
  }

  let hasTranslation = fs.existsSync(translationPath);
  if (!hasTranslation) {
    console.warn('WARNING: Translation file not found. Example verses will have no translations.');
  }

  // --- Step 1: Parse Quran text ---
  console.log('Step 1: Parsing Quran text...');
  const quranData = JSON.parse(fs.readFileSync(quranPath, 'utf8'));
  const surahs = quranData.data.surahs;

  // Build ayah map: ayahs[surahNum][ayahNum] = { text, surahName }
  const ayahs = {};
  let totalTokenCount = 0;

  for (const surah of surahs) {
    ayahs[surah.number] = {};
    for (const ayah of surah.ayahs) {
      const text = ayah.text.replace(/\uFEFF/g, '').trim(); // Remove BOM
      ayahs[surah.number][ayah.numberInSurah] = {
        text,
        surahName: surah.englishName,
      };
    }
  }

  console.log(`  Loaded ${surahs.length} surahs, ${Object.values(ayahs).reduce((s, a) => s + Object.keys(a).length, 0)} ayahs`);

  // --- Step 2: Tokenize ayahs and count word frequencies ---
  console.log('Step 2: Tokenizing and counting frequencies...');

  // wordOccurrences: strippedForm -> { arabic (with tashkeel), count, locations: [{surah, ayah, pos}] }
  const wordOccurrences = new Map();

  for (const surah of surahs) {
    for (const ayah of surah.ayahs) {
      const text = ayah.text.replace(/\uFEFF/g, '').trim();
      const tokens = text.split(/\s+/);
      tokens.forEach((token, idx) => {
        totalTokenCount++;
        const stripped = stripDiacritics(token);
        if (!stripped) return;

        if (!wordOccurrences.has(stripped)) {
          wordOccurrences.set(stripped, {
            arabic: token, // Keep the first occurrence with tashkeel
            count: 0,
            locations: [],
          });
        }
        const entry = wordOccurrences.get(stripped);
        entry.count++;
        // Store up to 20 locations for verse linking (we only need 3 but want options)
        if (entry.locations.length < 20) {
          entry.locations.push({
            surah: surah.number,
            ayah: ayah.numberInSurah,
            pos: idx,
          });
        }
      });
    }
  }

  console.log(`  Total tokens: ${totalTokenCount}`);
  console.log(`  Unique word forms: ${wordOccurrences.size}`);

  // --- Step 3: Parse corpus morphology ---
  console.log('Step 3: Parsing corpus morphology...');

  // Build a map: strippedLemma -> { root, pos, lemma (Buckwalter) }
  // Also build: (surah,ayah,wordPos) -> { root, pos, lemma }
  const corpusByPosition = new Map(); // "surah:ayah:word" -> { root, pos, lemma }
  const lemmaInfo = new Map(); // lemma -> { root, pos, arabicRoot }

  if (hasCorpus) {
    const corpusLines = fs.readFileSync(corpusPath, 'utf8')
      .split('\n')
      .filter(l => l && !l.startsWith('#') && !l.startsWith('LOCATION'));

    let parsedCount = 0;
    for (const line of corpusLines) {
      const parts = line.trim().split('\t');
      if (parts.length < 4) continue;

      const locMatch = parts[0].match(/\((\d+):(\d+):(\d+):(\d+)\)/);
      if (!locMatch) continue;

      const [, surah, ayah, wordPos, segment] = locMatch;
      const features = parts[3];

      // Only process STEM segments (they have ROOT and LEM)
      if (!features.startsWith('STEM')) continue;

      const rootMatch = features.match(/ROOT:([^|]+)/);
      const lemMatch = features.match(/LEM:([^|]+)/);
      const posMatch = features.match(/POS:([^|]+)/);

      if (!rootMatch && !lemMatch && !posMatch) continue;

      const root = rootMatch ? rootMatch[1] : null;
      const lemma = lemMatch ? lemMatch[1] : null;
      const pos = posMatch ? posMatch[1] : null;
      const arabicRoot = root ? buckwalterToArabic(root) : null;

      const key = `${surah}:${ayah}:${wordPos}`;
      if (!corpusByPosition.has(key)) {
        corpusByPosition.set(key, { root: arabicRoot, pos: POS_MAP[pos] || pos, lemma });
        parsedCount++;
      }

      if (lemma && !lemmaInfo.has(lemma)) {
        lemmaInfo.set(lemma, { root: arabicRoot, pos: POS_MAP[pos] || pos });
      }
    }

    console.log(`  Parsed ${parsedCount} word positions from corpus`);
    console.log(`  Unique lemmas: ${lemmaInfo.size}`);
  }

  // --- Step 4: Load translations ---
  console.log('Step 4: Loading translations...');
  const translations = {}; // "surah:ayah" -> text

  if (hasTranslation) {
    const transLines = fs.readFileSync(translationPath, 'utf8').split('\n');
    for (const line of transLines) {
      const parts = line.split('|');
      if (parts.length >= 3) {
        const surah = parts[0].trim();
        const ayah = parts[1].trim();
        const text = parts.slice(2).join('|').trim();
        translations[`${surah}:${ayah}`] = text;
      }
    }
    console.log(`  Loaded ${Object.keys(translations).length} translation entries`);
  }

  // --- Step 5: Build meaning dictionary ---
  console.log('Step 5: Building meaning dictionary...');
  const { formMeanings, lemmaMeanings } = buildMeaningDictionary();

  // --- Step 6: Merge data and build word list ---
  console.log('Step 6: Merging data sources and building word list...');

  // Sort by frequency (most common first)
  const sortedWords = [...wordOccurrences.entries()]
    .sort((a, b) => b[1].count - a[1].count);

  // For each word, try to find corpus data via its first location
  const wordList = [];
  let meaningsMissing = 0;

  for (let rank = 0; rank < sortedWords.length; rank++) {
    const [stripped, data] = sortedWords[rank];
    const { arabic, count, locations } = data;

    // Try to get morphology from corpus via first location
    let root = null;
    let pos = null;
    let lemmaKey = null;

    for (const loc of locations) {
      const key = `${loc.surah}:${loc.ayah}:${loc.pos + 1}`; // corpus is 1-indexed
      const corpusEntry = corpusByPosition.get(key);
      if (corpusEntry) {
        root = corpusEntry.root || null;
        pos = corpusEntry.pos || null;
        lemmaKey = corpusEntry.lemma || null;
        break;
      }
    }

    // Find meaning
    let meaning = null;

    // 1. Try form-based lookup (stripped Arabic)
    if (formMeanings[stripped]) {
      meaning = formMeanings[stripped];
    }

    // 2. Try lemma-based lookup
    if (!meaning && lemmaKey && lemmaMeanings[lemmaKey]) {
      meaning = lemmaMeanings[lemmaKey];
    }

    // 3. Try fuzzy matching on lemma meanings
    if (!meaning && lemmaKey) {
      // Try without special chars
      const cleanLemma = lemmaKey.replace(/[{}`~]/g, '');
      for (const [k, v] of Object.entries(lemmaMeanings)) {
        if (k.replace(/[{}`~]/g, '') === cleanLemma) {
          meaning = v;
          break;
        }
      }
    }

    // 4. Use POS-based placeholder
    if (!meaning) {
      meaningsMissing++;
      if (pos) {
        meaning = `(${pos})`;
      } else {
        meaning = '(meaning pending)';
      }
    }

    // Generate transliteration
    const translit = transliterate(arabic);

    wordList.push({
      arabic,
      stripped,
      transliteration: translit,
      meaning,
      root: root || null,  // NULL not empty string (D-04)
      partOfSpeech: pos || null,  // NULL not empty string (D-04)
      occurrenceCount: count,
      frequencyRank: rank + 1,
      locations,
    });
  }

  console.log(`  Built ${wordList.length} word entries`);
  console.log(`  Meanings found: ${wordList.length - meaningsMissing}, missing: ${meaningsMissing}`);

  // --- Step 7: Assign words to levels ---
  console.log('Step 7: Assigning words to levels...');

  const levels = LEVEL_CONFIG.levels;
  const { min: minWords, max: maxWords } = LEVEL_CONFIG.wordsPerLevel;

  // Calculate how many words per level
  // We want to cover as many words as reasonable across 30 levels
  const totalLevelSlots = levels.length;
  // Target: fill each level with ~40 words, but respect min/max
  const targetPerLevel = Math.min(maxWords, Math.max(minWords, Math.floor(wordList.length / totalLevelSlots)));

  // Only include words up to what fits in our levels
  const maxTotalWords = totalLevelSlots * maxWords;
  const wordsToAssign = Math.min(wordList.length, maxTotalWords);

  const levelData = [];
  let wordIndex = 0;
  let cumulativeOccurrences = 0;

  for (let i = 0; i < totalLevelSlots && wordIndex < wordsToAssign; i++) {
    const remaining = wordsToAssign - wordIndex;
    const remainingLevels = totalLevelSlots - i;
    let levelWordCount = Math.min(
      maxWords,
      Math.max(minWords, Math.round(remaining / remainingLevels))
    );
    // Don't exceed remaining words
    levelWordCount = Math.min(levelWordCount, remaining);
    // Ensure minimum
    if (levelWordCount < minWords && remaining >= minWords) {
      levelWordCount = minWords;
    }
    if (levelWordCount < minWords) {
      // Not enough words for a full level — combine with previous if possible
      if (levelData.length > 0) {
        const prev = levelData[levelData.length - 1];
        // Add remaining to previous level if it doesn't exceed max
        if (prev.wordCount + remaining <= maxWords) {
          for (let j = wordIndex; j < wordIndex + remaining; j++) {
            wordList[j].levelId = prev.id;
            wordList[j].levelOrder = prev.wordCount + (j - wordIndex) + 1;
            cumulativeOccurrences += wordList[j].occurrenceCount;
          }
          prev.wordCount += remaining;
          prev.cumulativeCoverage = cumulativeOccurrences / totalTokenCount;
          wordIndex += remaining;
          break;
        }
      }
    }

    const level = levels[i];
    const levelWords = [];

    for (let j = 0; j < levelWordCount && wordIndex < wordsToAssign; j++, wordIndex++) {
      wordList[wordIndex].levelId = level.id;
      wordList[wordIndex].levelOrder = j + 1;
      levelWords.push(wordList[wordIndex]);
      cumulativeOccurrences += wordList[wordIndex].occurrenceCount;
    }

    levelData.push({
      id: level.id,
      name: level.name,
      wordCount: levelWords.length,
      cumulativeCoverage: cumulativeOccurrences / totalTokenCount,
    });
  }

  const assignedWords = wordList.filter(w => w.levelId);
  console.log(`  Assigned ${assignedWords.length} words across ${levelData.length} levels`);
  console.log(`  Final cumulative coverage: ${(levelData[levelData.length - 1].cumulativeCoverage * 100).toFixed(1)}%`);

  // --- Step 8: Write SQLite database (using sql.js) ---
  console.log('Step 8: Writing kalima.db...');

  // Ensure output directory exists
  const dbDir = path.dirname(OUT_DB);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Remove existing db
  if (fs.existsSync(OUT_DB)) {
    fs.unlinkSync(OUT_DB);
  }

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Create tables matching schema.ts
  db.run(`
    CREATE TABLE IF NOT EXISTS levels (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      word_count INTEGER NOT NULL,
      cumulative_coverage REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY,
      arabic TEXT NOT NULL,
      transliteration TEXT NOT NULL,
      meaning TEXT NOT NULL,
      root TEXT,
      part_of_speech TEXT,
      frequency_rank INTEGER NOT NULL,
      occurrence_count INTEGER NOT NULL,
      level_id INTEGER NOT NULL REFERENCES levels(id),
      level_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS word_verses (
      id INTEGER PRIMARY KEY,
      word_id INTEGER NOT NULL REFERENCES words(id),
      surah_number INTEGER NOT NULL,
      ayah_number INTEGER NOT NULL,
      arabic_text TEXT NOT NULL,
      translation TEXT NOT NULL,
      word_position INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_words_level ON words(level_id);
    CREATE INDEX IF NOT EXISTS idx_words_frequency ON words(frequency_rank);
    CREATE INDEX IF NOT EXISTS idx_word_verses_word ON word_verses(word_id);
  `);

  // Insert levels
  db.run('BEGIN TRANSACTION');
  const insertLevel = db.prepare(
    'INSERT INTO levels (id, name, word_count, cumulative_coverage) VALUES (?, ?, ?, ?)'
  );
  for (const level of levelData) {
    insertLevel.run([level.id, level.name, level.wordCount, level.cumulativeCoverage]);
  }
  insertLevel.free();
  db.run('COMMIT');
  console.log(`  Inserted ${levelData.length} levels`);

  // Insert words
  db.run('BEGIN TRANSACTION');
  const insertWord = db.prepare(
    `INSERT INTO words (id, arabic, transliteration, meaning, root, part_of_speech,
     frequency_rank, occurrence_count, level_id, level_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  let wordId = 0;
  const wordIdMap = new Map(); // wordIndex -> wordId (for verse linking)

  for (let i = 0; i < assignedWords.length; i++) {
    const w = assignedWords[i];
    wordId++;
    wordIdMap.set(i, wordId);
    insertWord.run([
      wordId,
      w.arabic,
      w.transliteration,
      w.meaning,
      w.root,        // NULL if missing (D-04)
      w.partOfSpeech, // NULL if missing (D-04)
      w.frequencyRank,
      w.occurrenceCount,
      w.levelId,
      w.levelOrder
    ]);
  }
  insertWord.free();
  db.run('COMMIT');
  console.log(`  Inserted ${wordId} words`);

  // Insert example verses
  db.run('BEGIN TRANSACTION');
  const insertVerse = db.prepare(
    `INSERT INTO word_verses (word_id, surah_number, ayah_number, arabic_text, translation, word_position)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  let verseCount = 0;
  for (let i = 0; i < assignedWords.length; i++) {
    const w = assignedWords[i];
    const wId = wordIdMap.get(i);

    // Select up to 3 example verses, prefer shorter ayahs
    const verseCandidates = w.locations
      .filter(loc => ayahs[loc.surah] && ayahs[loc.surah][loc.ayah])
      .map(loc => ({
        ...loc,
        ayahText: ayahs[loc.surah][loc.ayah].text,
        ayahLen: ayahs[loc.surah][loc.ayah].text.length,
      }))
      .sort((a, b) => a.ayahLen - b.ayahLen) // Prefer shorter ayahs
      .slice(0, 3);

    for (const v of verseCandidates) {
      const transKey = `${v.surah}:${v.ayah}`;
      const translation = translations[transKey] || '(translation not available)';
      insertVerse.run([wId, v.surah, v.ayah, v.ayahText, translation, v.pos]);
      verseCount++;
    }
  }
  insertVerse.free();
  db.run('COMMIT');
  console.log(`  Inserted ${verseCount} verse links`);

  // Export database to file
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(OUT_DB, buffer);
  db.close();

  const dbStats = fs.statSync(OUT_DB);
  console.log(`  Database size: ${(dbStats.size / 1024).toFixed(0)} KB`);

  // --- Step 9: Generate gaps report ---
  console.log('Step 9: Generating gaps report...');

  const gaps = [];
  for (let i = 0; i < assignedWords.length; i++) {
    const w = assignedWords[i];
    const missingFields = [];
    if (!w.root) missingFields.push('root');
    if (!w.partOfSpeech) missingFields.push('partOfSpeech');
    if (w.meaning === '(meaning pending)' || w.meaning.startsWith('(')) {
      missingFields.push('meaning');
    }

    if (missingFields.length > 0) {
      gaps.push({
        wordId: wordIdMap.get(i),
        arabic: w.arabic,
        frequencyRank: w.frequencyRank,
        missingFields,
        note: 'auto-detected gap',
      });
    }
  }

  const gapsReport = {
    generated: new Date().toISOString(),
    totalWords: assignedWords.length,
    gapsCount: gaps.length,
    gaps,
  };

  fs.writeFileSync(GAPS_REPORT, JSON.stringify(gapsReport, null, 2));
  console.log(`  ${gaps.length} words with gaps out of ${assignedWords.length} total`);

  // --- Step 10: Summary ---
  console.log('\n=== Pipeline Complete ===');
  console.log(`  Wrote ${assignedWords.length} words, ${levelData.length} levels, ${verseCount} verses to kalima.db`);
  console.log(`  Gaps report: ${GAPS_REPORT}`);
  console.log(`  Database: ${OUT_DB}`);
}

// ===== Run =====
main().catch(err => {
  console.error('\n=== Pipeline Error ===');
  console.error(err.message);
  console.error(err.stack);
  process.exit(1);
});
