import {
  SESSION_FUTURE_GRACE_MS,
  SESSION_MAX_DURATION_MS,
  SESSION_MAX_LOOKBACK_MS,
  boundsCodeFromDetail,
  boundsMessage,
  emptyEndSeed,
  sessionBounds,
  toApiInstant,
} from '../sessionBounds';

const now = new Date('2026-11-13T12:00:00.000Z');

test('toApiInstant always emits a Zulu timestamp', () => {
  expect(toApiInstant(new Date('2026-08-02T18:00:00.000Z'))).toBe('2026-08-02T18:00:00.000Z');
});

test('create rejects 49h, a start older than 30 days, and times past the 5 minute grace', () => {
  const duration = sessionBounds(
    new Date(now.getTime() - SESSION_MAX_DURATION_MS - 60_000),
    now,
    { create: true, now },
  );
  expect(duration).toBe('duration');
  expect(boundsMessage(duration!)).toBe('Sesja nie może trwać dłużej niż 48 godzin.');

  const lookback = sessionBounds(
    new Date(now.getTime() - SESSION_MAX_LOOKBACK_MS - 60_000),
    new Date(now.getTime() - SESSION_MAX_LOOKBACK_MS + 60 * 60_000),
    { create: true, now },
  );
  expect(lookback).toBe('lookback');

  const futureStart = sessionBounds(
    new Date(now.getTime() + SESSION_FUTURE_GRACE_MS + 60_000),
    new Date(now.getTime() + SESSION_FUTURE_GRACE_MS + 120_000),
    { create: true, now },
  );
  expect(futureStart).toBe('futureStart');

  const futureEnd = sessionBounds(
    new Date(now.getTime() - 60 * 60_000),
    new Date(now.getTime() + SESSION_FUTURE_GRACE_MS + 60_000),
    { create: true, now },
  );
  expect(futureEnd).toBe('futureEnd');
});

test('exactly 48h, exactly 30 days, and exactly 5 minutes of grace are allowed', () => {
  expect(sessionBounds(
    new Date(now.getTime() - SESSION_MAX_DURATION_MS),
    now,
    { create: true, now },
  )).toBeNull();

  const start = new Date(now.getTime() - SESSION_MAX_LOOKBACK_MS);
  expect(sessionBounds(start, new Date(start.getTime() + 60 * 60_000), { create: true, now })).toBeNull();

  expect(sessionBounds(
    new Date(now.getTime() - 60 * 60_000),
    new Date(now.getTime() + SESSION_FUTURE_GRACE_MS),
    { create: true, now },
  )).toBeNull();
});

test('patch skips lookback and future-start, and still caps duration and future end', () => {
  const oldStart = new Date(now.getTime() - SESSION_MAX_LOOKBACK_MS - 24 * 60 * 60_000);
  expect(sessionBounds(oldStart, new Date(oldStart.getTime() + 2 * 60 * 60_000), { create: false, now })).toBeNull();

  const futureStart = new Date(now.getTime() + SESSION_FUTURE_GRACE_MS + 60_000);
  expect(sessionBounds(
    futureStart,
    new Date(futureStart.getTime() + 60_000),
    { create: true, now },
  )).toBe('futureStart');
  expect(sessionBounds(
    futureStart,
    new Date(futureStart.getTime() + 60_000),
    { create: false, now },
  )).toBe('futureEnd');

  expect(sessionBounds(
    new Date(now.getTime() - SESSION_MAX_DURATION_MS - 60_000),
    now,
    { create: false, now },
  )).toBe('duration');
});

test('an ERROR start older than 48h seeds the latest legal end, not now', () => {
  const start = new Date(now.getTime() - SESSION_MAX_DURATION_MS - 60 * 60_000);
  expect(emptyEndSeed(start, now)?.toISOString()).toBe(
    new Date(start.getTime() + SESSION_MAX_DURATION_MS).toISOString(),
  );
  expect(emptyEndSeed(new Date(now.getTime() - 60 * 60_000), now)).toBeNull();
});

test('bounds 422 strings map to copy and pydantic lists do not', () => {
  expect(boundsCodeFromDetail('session duration exceeds 48 hours')).toBe('duration');
  expect(boundsCodeFromDetail([{ msg: 'datetime must include a timezone offset' }])).toBeNull();
});
