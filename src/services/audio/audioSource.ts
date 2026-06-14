export type Reciter = {
  id: string;
  name: string;
  folder: string;
};

export const DEFAULT_RECITER_ID = 'alafasy';

// Streams ayah-level audio from everyayah.com. Production must confirm reciter licensing before release.
// Future word-level audio requires licensed word recordings; track as a P5 item before adding it.
export const RECITERS: Reciter[] = [
  { id: 'alafasy', name: 'Mishary Alafasy', folder: 'Alafasy_128kbps' },
  { id: 'husary', name: 'Mahmoud Al-Husary', folder: 'Husary_128kbps' },
  { id: 'abdul-basit', name: 'Abdul Basit', folder: 'Abdul_Basit_Murattal_128kbps' },
];

function padQuranRef(value: number): string {
  return String(value).padStart(3, '0');
}

export function ayahAudioUrl(
  reciter: Reciter,
  surahNumber: number,
  ayahNumber: number,
): string {
  return `https://everyayah.com/data/${reciter.folder}/${padQuranRef(surahNumber)}${padQuranRef(ayahNumber)}.mp3`;
}

// Word-by-word audio from quran.com's public CDN.
// Each segment (surah, ayah, word) is zero-padded to 3 digits.
// Production should confirm availability and licensing of the quran.com WBW audio CDN before release.
export function wbwAudioUrl(
  surahNumber: number,
  ayahNumber: number,
  wordNumber: number,
): string {
  return `https://audio.qurancdn.com/wbw/${padQuranRef(surahNumber)}_${padQuranRef(ayahNumber)}_${padQuranRef(wordNumber)}.mp3`;
}

export function getReciterById(id: string): Reciter {
  return RECITERS.find((reciter) => reciter.id === id) ?? RECITERS[0];
}
