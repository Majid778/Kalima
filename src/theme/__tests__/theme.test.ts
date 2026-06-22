import { motionValue } from '../motion';
import { darkTheme, mushafTheme, themes } from '../theme';
import { typeScale } from '../typography';

const sortedKeys = (value: object) => Object.keys(value).sort();

describe('theme tokens', () => {
  it('darkTheme and mushafTheme define the same top-level token groups', () => {
    expect(sortedKeys(darkTheme)).toEqual(sortedKeys(mushafTheme));
  });

  it('darkTheme and mushafTheme define the same role keys in each token group', () => {
    for (const group of Object.keys(darkTheme) as Array<keyof typeof darkTheme>) {
      expect(sortedKeys(darkTheme[group])).toEqual(sortedKeys(mushafTheme[group]));
    }
  });

  it('exports the named themes through the themes record', () => {
    expect(themes.dark).toBe(darkTheme);
    expect(themes.mushaf).toBe(mushafTheme);
  });
});

describe('motion primitives', () => {
  it('motionValue chooses instant value when reduced motion is enabled', () => {
    expect(motionValue(true, 'a', 'b')).toBe('b');
  });

  it('motionValue chooses animated value when reduced motion is disabled', () => {
    expect(motionValue(false, 'a', 'b')).toBe('a');
  });
});

describe('typeScale', () => {
  it('defines numeric fontSize and lineHeight for every Latin role', () => {
    for (const role of Object.values(typeScale)) {
      expect(typeof role.fontSize).toBe('number');
      expect(typeof role.lineHeight).toBe('number');
    }
  });
});
