import {
  ayahAudioUrl,
  DEFAULT_RECITER_ID,
  getReciterById,
  RECITERS,
  wbwAudioUrl,
} from '../audioSource';

describe('audioSource', () => {
  it('builds zero-padded everyayah URLs', () => {
    const reciter = getReciterById(DEFAULT_RECITER_ID);

    expect(ayahAudioUrl(reciter, 1, 1)).toBe(
      'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
    );
    expect(ayahAudioUrl(reciter, 114, 6)).toBe(
      'https://everyayah.com/data/Alafasy_128kbps/114006.mp3',
    );
  });

  it('uses each reciter folder in the URL', () => {
    for (const reciter of RECITERS) {
      expect(ayahAudioUrl(reciter, 2, 255)).toBe(
        `https://everyayah.com/data/${reciter.folder}/002255.mp3`,
      );
    }
  });

  it('falls back to the default reciter for unknown ids', () => {
    expect(getReciterById('missing-reciter')).toEqual(getReciterById(DEFAULT_RECITER_ID));
  });

  it('builds zero-padded quran.com WBW URLs', () => {
    expect(wbwAudioUrl(1, 1, 1)).toBe(
      'https://audio.qurancdn.com/wbw/001_001_001.mp3',
    );
    expect(wbwAudioUrl(2, 255, 10)).toBe(
      'https://audio.qurancdn.com/wbw/002_255_010.mp3',
    );
  });
});
