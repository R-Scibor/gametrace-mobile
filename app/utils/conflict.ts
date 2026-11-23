import type { ConflictResponse, ConflictingSession, SessionStatus } from '../types/api';
import i18n from '../i18n';
import { apiErrorMessage } from './apiError';
import { boundsCodeFromDetail, boundsMessage } from './sessionBounds';

export type SaveError =
  | { kind: 'conflict'; conflict: ConflictResponse }
  | { kind: 'message'; message: string };

/** Backend 409 `detail` strings are frozen English. Map them to copy keys and
 *  never render them raw. Anything unknown reads as the common overlap case. */
export const WRITER_CONFLICT_DETAIL = 'Session was updated by another writer';

export function conflictCopyKeys(detail: string): { heading: string; message: string } {
  if (detail === WRITER_CONFLICT_DETAIL) {
    return { heading: 'conflict.staleHeading', message: 'conflict.staleMessage' };
  }
  return { heading: 'conflict.heading', message: 'conflict.overlapMessage' };
}

function isSessionStatus(value: unknown): value is SessionStatus {
  return value === 'ONGOING' || value === 'COMPLETED' || value === 'ERROR';
}

function isConflictSession(value: unknown): value is ConflictingSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Record<string, unknown>;
  if (typeof session.id !== 'number') return false;
  if (!isSessionStatus(session.status)) return false;
  if (typeof session.game_id !== 'number') return false;
  if (typeof session.start_time !== 'string') return false;
  if (!session.game || typeof session.game !== 'object') return false;
  const game = session.game as Record<string, unknown>;
  if (typeof game.primary_name !== 'string') return false;
  if (game.cover_image_url !== null && typeof game.cover_image_url !== 'string') return false;
  return true;
}

export function parseConflict(error: unknown): ConflictResponse | null {
  if (!error || typeof error !== 'object') return null;
  const response = (error as { response?: { status?: number; data?: { detail?: unknown } } }).response;
  if (response?.status !== 409) return null;

  const body = response.data?.detail;
  if (!body || typeof body !== 'object') return null;
  const rec = body as Record<string, unknown>;
  if (typeof rec.detail !== 'string') return null;
  if (!isConflictSession(rec.conflicting_session)) return null;
  const session = rec.conflicting_session;
  return {
    detail: rec.detail,
    conflicting_session: {
      id: session.id,
      status: session.status,
      game_id: session.game_id,
      game: {
        primary_name: session.game.primary_name,
        cover_image_url: session.game.cover_image_url,
      },
      start_time: session.start_time,
      end_time: typeof session.end_time === 'string' ? session.end_time : null,
    },
  };
}

function responseDetail(error: unknown): { status?: number; detail?: unknown } {
  if (!error || typeof error !== 'object') return {};
  const response = (error as { response?: { status?: number; data?: { detail?: unknown } } }).response;
  return { status: response?.status, detail: response?.data?.detail };
}

export function sessionSaveError(e: unknown, fallback: string): SaveError {
  const { status, detail } = responseDetail(e);

  if (status === 409) {
    const conflict = parseConflict(e);
    if (conflict) return { kind: 'conflict', conflict };
    // A 409 we could not parse into a blocker is still a conflict, not a generic failure.
    return { kind: 'message', message: i18n.t('common:conflict.incompleteMessage') };
  }

  if (status === 422) {
    const code = boundsCodeFromDetail(detail);
    if (code) return { kind: 'message', message: boundsMessage(code) };
  }

  return { kind: 'message', message: apiErrorMessage(e, fallback) };
}
