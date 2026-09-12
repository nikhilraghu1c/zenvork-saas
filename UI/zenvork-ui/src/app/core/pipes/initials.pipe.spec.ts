import { InitialsPipe } from './initials.pipe';

describe('InitialsPipe', () => {
  const pipe = new InitialsPipe();

  it('uses the first and last words of a name', () => {
    expect(pipe.transform('Priya Sharma')).toBe('PS');
    expect(pipe.transform('John Michael Doe')).toBe('JD');
  });

  it('returns one initial for a single-word name', () => {
    expect(pipe.transform('anne')).toBe('A');
  });

  it('normalizes surrounding and repeated whitespace', () => {
    expect(pipe.transform('  priya \t sharma \n')).toBe('PS');
  });

  it('returns an empty string for missing or blank names', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform('   ')).toBe('');
  });

  it('supports accented and non-Latin names', () => {
    expect(pipe.transform('Élodie Martin')).toBe('ÉM');
    expect(pipe.transform('李 明')).toBe('李明');
  });
});
