# Raw Quran Data Sources

This directory contains the raw data files used by `scripts/build-db.js` to generate `assets/db/kalima.db`.

## Files

### quran-uthmani.json
- **Source:** AlQuran Cloud API (`https://api.alquran.cloud/v1/quran/quran-uthmani`)
- **Content:** Complete Quran text in Uthmani script with full tashkeel (diacritical marks)
- **Format:** JSON with nested surahs/ayahs structure
- **Download date:** 2026-03-29
- **License:** Quran text is in the public domain; API provided by Islamic Network

### quranic-corpus-morphology.txt
- **Source:** Quranic Arabic Corpus v0.4 by Kais Dukes, via CLTK GitHub mirror (`https://github.com/cltk/arabic_morphology_quranic-corpus`)
- **Content:** Word-by-word morphological analysis including root letters, lemma, and part of speech
- **Format:** Tab-separated with location format `(surah:ayah:word:segment)`
- **Download date:** 2026-03-29
- **License:** GNU General Public License (see file header)

### en.sahih.txt
- **Source:** Tanzil.net (`https://tanzil.net/trans/en.sahih`)
- **Content:** Sahih International English translation of the Quran
- **Format:** Pipe-delimited text (`surah|ayah|translation_text`), one line per ayah
- **Download date:** 2026-03-29
- **License:** Creative Commons (see Tanzil.net terms)

## Data Pipeline

Run `node scripts/build-db.js` from the project root to process these files into `assets/db/kalima.db`.

## Notes

- The AlQuran Cloud API was used instead of direct Tanzil.net XML download because the Tanzil download endpoint requires browser-based access.
- The Quranic Arabic Corpus has known gaps in root mappings for certain non-noun word forms. These gaps are logged to `scripts/gaps-report.json`.
- English meanings for vocabulary words are sourced from a built-in dictionary in the build script. Many words currently have placeholder meanings that will be curated in future updates.
