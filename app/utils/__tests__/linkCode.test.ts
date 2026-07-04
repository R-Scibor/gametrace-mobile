import { normalizeLinkCode, formatLinkCode, isCompleteLinkCode } from '../linkCode';

describe('normalizeLinkCode', () => {
  test('strips spaces and non-digits', () => {
    expect(normalizeLinkCode('231 996')).toBe('231996');
    expect(normalizeLinkCode('2a3b1c')).toBe('231');
  });

  test('caps at 6 digits', () => {
    expect(normalizeLinkCode('12345678')).toBe('123456');
  });
});

describe('formatLinkCode', () => {
  test('groups as XXX XXX once past three digits', () => {
    expect(formatLinkCode('231996')).toBe('231 996');
    expect(formatLinkCode('231')).toBe('231');
    expect(formatLinkCode('2319')).toBe('231 9');
  });

  test('normalizes before grouping', () => {
    expect(formatLinkCode('231 996')).toBe('231 996');
  });
});

describe('isCompleteLinkCode', () => {
  test('true only for exactly six digits', () => {
    expect(isCompleteLinkCode('231 996')).toBe(true);
    expect(isCompleteLinkCode('231996')).toBe(true);
    expect(isCompleteLinkCode('2319')).toBe(false);
    expect(isCompleteLinkCode('1234567')).toBe(true); // capped to 6 first
  });
});
