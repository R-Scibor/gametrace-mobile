import type { ConflictResponse, ConflictingSession, SessionStatus } from '../types/api';
import { apiErrorMessage } from './apiError';

export type SaveError =
  | { kind: 'conflict'; conflict: ConflictResponse }
  | { kind: 'message'; message: string };

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

export function sessionSaveError(e: unknown, fallback: string): SaveError {
  const conflict = parseConflict(e);
  return conflict
    ? { kind: 'conflict', conflict }
    : { kind: 'message', message: apiErrorMessage(e, fallback) };
}
