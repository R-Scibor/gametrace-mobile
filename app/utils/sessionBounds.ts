import i18n from '../i18n';

export const SESSION_MAX_DURATION_MS = 48 * 60 * 60 * 1000;
export const SESSION_MAX_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_FUTURE_GRACE_MS = 5 * 60 * 1000;

/** Frozen POST/PATCH 422 strings. Parse failures stay Pydantic lists. */
const BOUNDS_DETAIL: Record<string, SessionBoundsCode> = {
  'end_time must be after start_time': 'endBeforeStart',
  'start_time is older than 30 days': 'lookback',
  'session duration exceeds 48 hours': 'duration',
  'start_time cannot be in the future': 'futureStart',
  'end_time cannot be in the future': 'futureEnd',
};

export type SessionBoundsCode =
  | 'endBeforeStart'
  | 'lookback'
  | 'duration'
  | 'futureStart'
  | 'futureEnd';

export function sessionBounds(
  start: Date,
  end: Date,
  options: { create: boolean; now?: Date },
): SessionBoundsCode | null {
  const nowMs = (options.now ?? new Date()).getTime();
  const startMs = start.getTime();
  const endMs = end.getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || Number.isNaN(nowMs)) return null;
  if (endMs <= startMs) return 'endBeforeStart';
  if (options.create && startMs < nowMs - SESSION_MAX_LOOKBACK_MS) return 'lookback';
  if (endMs - startMs > SESSION_MAX_DURATION_MS) return 'duration';
  if (options.create && startMs > nowMs + SESSION_FUTURE_GRACE_MS) return 'futureStart';
  if (endMs > nowMs + SESSION_FUTURE_GRACE_MS) return 'futureEnd';
  return null;
}

export function boundsCodeFromDetail(detail: unknown): SessionBoundsCode | null {
  if (typeof detail !== 'string') return null;
  return BOUNDS_DETAIL[detail] ?? null;
}

export function boundsI18nKey(code: SessionBoundsCode): string {
  return code === 'endBeforeStart' ? 'endBeforeStart' : `bounds.${code}`;
}

export function boundsMessage(code: SessionBoundsCode): string {
  return i18n.t(`sessions:${boundsI18nKey(code)}`);
}

/** ISO-8601 with a Z suffix. Never a naive local timestamp. */
export function toApiInstant(date: Date): string {
  const iso = date.toISOString();
  if (!iso.endsWith('Z')) throw new Error('session timestamp missing offset');
  return iso;
}

/**
 * When an ERROR row started more than 48h ago, the end picker must not seed
 * "now" — that end is already over the cap. Seed the latest legal end instead.
 * Null means the sheet may keep its default (now).
 */
export function emptyEndSeed(start: Date, now = new Date()): Date | null {
  const startMs = start.getTime();
  const nowMs = now.getTime();
  if (Number.isNaN(startMs) || Number.isNaN(nowMs)) return null;
  if (nowMs - startMs > SESSION_MAX_DURATION_MS) {
    return new Date(startMs + SESSION_MAX_DURATION_MS);
  }
  return null;
}
