export type Reciter = {
  id: string;
  name: string;
  folder: string;
};

export const DEFAULT_RECITER_ID = 'alafasy';

// Streams ayah-level audio from everyayah.com. Production must confirm reciter licensing before release.
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

export function getReciterById(id: string): Reciter {
  return RECITERS.find((reciter) => reciter.id === id) ?? RECITERS[0];
}