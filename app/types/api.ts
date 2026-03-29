// Auth
export interface LoginRequest {
  username: string;
  timezone?: string;
}

export interface LoginResponse {
  token: string;
  discord_id: string;
  username: string;
  timezone: string;
}

// Games
export interface GameBrief {
  id: number;
  primary_name: string;
  cover_image_url: string | null;
}

// Sessions
export type SessionStatus = 'ONGOING' | 'COMPLETED' | 'ERROR';
export type SessionSource = 'BOT' | 'MANUAL';

export interface SessionResponse {
  id: number;
  game_id: number;
  game: GameBrief;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  status: SessionStatus;
  source: SessionSource;
  notes: string | null;
  created_at: string;
}

export interface SessionCreate {
  game_id: number;
  start_time: string;
  end_time: string;
  notes?: string;
}

export interface SessionPatch {
  end_time?: string;
  notes?: string;
  discard?: boolean;
}

export interface ConflictResponse {
  detail: string;
  conflicting_session: SessionResponse;
}

// Stats
export interface GameStatEntry {
  game_id: number;
  game_name: string;
  cover_image_url: string | null;
  total_seconds: number;
}

export interface PendingErrorEntry {
  id: number;
  game_id: number;
  game_name: string;
  start_time: string;
  notes: string | null;
}

export interface StatsSummaryResponse {
  days: number;
  window_start: string;
  window_end: string;
  total_seconds: number;
  per_game: GameStatEntry[];
  pending_errors: PendingErrorEntry[];
}
