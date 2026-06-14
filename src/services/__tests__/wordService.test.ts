import { highlightWordInVerse } from '../wordService';

describe('highlightWordInVerse', () => {
  // 4 tokens at positions 0..3
  const verse = 'بسم الله الرحمن الرحيم';

  it('splits a verse into before / target / after around the target token', () => {
    const r = highlightWordInVerse(verse, 1);
    expect(r).not.toBeNull();
    expect(r!.before).toBe('بسم');
    expect(r!.target).toBe('الله');
    expect(r!.after).toBe('الرحمن الرحيم');
  });

  it('handles the first token (empty before)', () => {
    const r = highlightWordInVerse(verse, 0);
    expect(r!.before).toBe('');
    expect(r!.target).toBe('بسم');
    expect(r!.after).toBe('الله الرحمن الرحيم');
  });

  it('handles the last token (empty after)', () => {
    const r = highlightWordInVerse(verse, 3);
    expect(r!.before).toBe('بسم الله الرحمن');
    expect(r!.target).toBe('الرحيم');
    expect(r!.after).toBe('');
  });

  it('returns null when wordPosition is null (so the caller can show plain Arabic)', () => {
    expect(highlightWordInVerse(verse, null)).toBeNull();
  });

  it('returns null for a negative index', () => {
    expect(highlightWordInVerse(verse, -1)).toBeNull();
  });

  it('returns null for an out-of-bounds index', () => {
    expect(highlightWordInVerse(verse, 99)).toBeNull();
  });

  it('collapses multiple internal spaces when tokenizing', () => {
    const r = highlightWordInVerse('alpha   beta  gamma', 1);
    expect(r!.before).toBe('alpha');
    expect(r!.target).toBe('beta');
    expect(r!.after).toBe('gamma');
  });
});
