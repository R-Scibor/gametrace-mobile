import { parseConflict, sessionSaveError } from '../conflict';
import type { ConflictResponse, ConflictingSession } from '../../types/api';

const session: ConflictingSession = {
  id: 99,
  status: 'COMPLETED',
  game_id: 5,
  game: { primary_name: 'Wiedźmin 3', cover_image_url: null },
  start_time: '2026-08-02T18:00:00.000Z',
  end_time: '2026-08-02T20:00:00.000Z',
};

const conflictResponse: ConflictResponse = {
  detail: 'Session overlaps with an existing session',
  conflicting_session: session,
};

function httpError(status: number, data: unknown) {
  return { response: { status, data } };
}

test('parseConflict returns only the fields the overlap UI reads', () => {
  const fat = {
    detail: 'Session overlaps with an existing session',
    conflicting_session: {
      ...session,
      source: 'BOT',
      notes: null,
      created_at: '2026-08-02T20:00:00.000Z',
      duration_seconds: 7200,
      game: { id: 5, ...session.game },
    },
  };
  expect(parseConflict(httpError(409, { detail: fat }))).toEqual(conflictResponse);
});

test('parseConflict returns null for a 409 without a usable conflicting_session', () => {
  expect(
    parseConflict(httpError(409, { detail: 'Session overlaps with an existing session' })),
  ).toBeNull();
  expect(
    parseConflict(httpError(409, { detail: { detail: 'Session overlaps with an existing session' } })),
  ).toBeNull();
  expect(
    parseConflict(httpError(409, {
      detail: { detail: 'Session overlaps with an existing session', conflicting_session: null },
    })),
  ).toBeNull();
  expect(
    parseConflict(httpError(409, {
      detail: { detail: 'Session overlaps with an existing session', conflicting_session: { id: 1 } },
    })),
  ).toBeNull();
  expect(
    parseConflict(httpError(409, {
      detail: { ...conflictResponse, conflicting_session: { ...session, status: undefined } },
    })),
  ).toBeNull();
});

test('parseConflict coerces a missing end_time to null so an ONGOING 409 stays a conflict', () => {
  const live = {
    id: session.id,
    status: 'ONGOING',
    game_id: session.game_id,
    game: session.game,
    start_time: session.start_time,
  };
  expect(parseConflict(httpError(409, {
    detail: { detail: conflictResponse.detail, conflicting_session: live },
  }))).toEqual({
    detail: conflictResponse.detail,
    conflicting_session: { ...session, status: 'ONGOING', end_time: null },
  });
});

test('parseConflict returns null for non-409 errors', () => {
  expect(parseConflict(httpError(500, { detail: conflictResponse }))).toBeNull();
});

test('parseConflict returns null for non-http errors', () => {
  expect(parseConflict(new Error('nope'))).toBeNull();
});

test('sessionSaveError is a conflict when parseConflict matches', () => {
  expect(sessionSaveError(httpError(409, { detail: conflictResponse }), 'fallback')).toEqual({
    kind: 'conflict',
    conflict: conflictResponse,
  });
});

test('sessionSaveError is a prefixed message when the 409 body is incomplete', () => {
  expect(sessionSaveError(httpError(409, { detail: 'Session overlaps with an existing session' }), 'fallback')).toEqual({
    kind: 'message',
    message: '409: Session overlaps with an existing session',
  });
  expect(sessionSaveError(httpError(409, {
    detail: { detail: 'Session overlaps with an existing session', conflicting_session: null },
  }), 'fallback')).toEqual({
    kind: 'message',
    message: '409: Session overlaps with an existing session',
  });
});
