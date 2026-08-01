import { resolveLanguage, isLanguage, intlLocale } from '../resolve';

describe('resolveLanguage', () => {
  it('prefers a valid profile language over everything', () => {
    expect(resolveLanguage({ profileLanguage: 'en', cached: 'pl', navigatorLanguage: 'pl-PL' })).toBe('en');
  });
  it('falls back to the cached choice when no profile language', () => {
    expect(resolveLanguage({ cached: 'en', navigatorLanguage: 'pl-PL' })).toBe('en');
  });
  it('uses device locale when no profile or cache', () => {
    expect(resolveLanguage({ navigatorLanguage: 'pl-PL' })).toBe('pl');
    expect(resolveLanguage({ navigatorLanguage: 'PL' })).toBe('pl');
    expect(resolveLanguage({ navigatorLanguage: 'fr-FR' })).toBe('en');
  });
  it('falls back to English when nothing matches', () => {
    expect(resolveLanguage({})).toBe('en');
    expect(resolveLanguage({ profileLanguage: 'de', cached: 'xx', navigatorLanguage: null })).toBe('en');
  });
  it('isLanguage guards the union', () => {
    expect(isLanguage('pl')).toBe(true);
    expect(isLanguage('en')).toBe(true);
    expect(isLanguage('de')).toBe(false);
    expect(isLanguage(undefined)).toBe(false);
  });
  it('intlLocale maps pl and en-GB', () => {
    expect(intlLocale('pl')).toBe('pl-PL');
    expect(intlLocale('en')).toBe('en-GB');
    expect(intlLocale('xx')).toBe('en-GB');
  });
});
