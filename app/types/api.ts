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

export type EnrichmentStatus = 'PENDING' | 'ENRICHED' | 'NEEDS_REVIEW';
export type CoverSource = 'EXTERNAL' | 'CUSTOM';

export interface Game {
  id: number;
  primary_name: string;
  cover_image_url: string | null;
  cover_source: CoverSource;
  enrichment_status: EnrichmentStatus;
  is_ignored: boolean;
  is_accepted: boolean | null;
}

export interface GameListResponse {
  total: number;
  items: Game[];
}

export interface UserPreference {
  game_id: number;
  is_ignored: boolean;
  is_accepted: boolean | null;
  custom_tag: string | null;
}

// Sessions
export type SessionStatus = 'ONGOING' | 'COMPLETED' | 'ERROR';
export type SessionSource = 'BOT' | 'MANUAL';

export interface Session {
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
}

export interface TrashedSession extends Session {
  purges_at: string;
}

export interface ConflictResponse {
  detail: string;
  conflicting_session: Session;
}

// Stats
export interface GameStatEntry {
  game_id: number;
  game_name: string;
  cover_image_url: string | null;
  total_seconds: number;
}

export interface GameStats {
  game_id: number;
  total_seconds: number;
  session_count: number;
  first_played: string;
  last_played: string;
}

export interface PendingErrorEntry {
  id: number;
  game_id: number;
  game_name: string;
  start_time: string;
  notes: string | null;
}

export interface StatsSummary {
  days: number;
  window_start: string;
  window_end: string;
  total_seconds: number;
  per_game: GameStatEntry[];
  pending_errors: PendingErrorEntry[];
}

export interface ActiveSessionBrief {
  id: number;
  game_id: number;
  game_name: string;
  cover_image_url: string | null;
  start_time: string;
}

export interface DashboardSummary {
  total_seconds_today: number;
  total_seconds_7d: number;
  total_seconds_30d: number;
  active_session: ActiveSessionBrief | null;
  pending_errors: PendingErrorEntry[];
}

export type ProfileSettings = {
  timezone: string;
  language: 'pl' | 'en';
  notifications_enabled: boolean;
};

export interface ProfileMe {
  discord_id: string;
  username: string;
  timezone: string;
  notifications_enabled: boolean;
}

export type BotStatus = 'online' | 'offline' | 'unknown';

export interface HealthResponse {
  status: string;
  version: string;
  commit_sha: string;
  build_time: string;
  api: { uptime_seconds: number };
  bot: {
    status: BotStatus;
    uptime_seconds: number | null;
    last_heartbeat_seconds_ago: number | null;
  };
}

// Voice
export interface TranscribeResponse {
  game: string | null;
  date: string | null;          // YYYY-MM-DD
  start_time: string | null;    // HH:MM (24h)
  end_time: string | null;      // HH:MM (24h)
  duration_minutes: number | null;
  raw_transcript: string;
}

export interface GameResolveResponse {
  game_id: number;
  name: string;
}

export interface AddSessionPrefill {
  gameId?: number;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  note?: string;
}
