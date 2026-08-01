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
  is_admin: boolean;
  needs_server_join?: boolean; // OAuth only; absent/false for link + username login
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
  total_seconds: number;
  last_played: string | null;
}

export interface GameListResponse {
  total: number;
  items: Game[];
}

export type GameSort = 'name' | 'playtime' | 'last_played';

export type LibraryFilter = {
  type: 'genre' | 'theme' | 'developer' | 'publisher' | 'release_decade';
  value: string;
};

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
  window_start: string | null;   // null for all-time (days=0)
  window_end: string;
  total_seconds: number;
  previous_total_seconds: number; // COMPLETED total over the preceding equal window; 0 for all-time
  avg_session_seconds: number;
  longest_session_seconds: number;
  longest_session_game_id: number | null;
  longest_session_game_name: string | null;
  new_games_count: number;
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

// Heatmap: 7x24 grid, dow 0=Mon..6=Sun, hour 0..23
export interface HeatmapCell {
  dow: number;
  hour: number;
  seconds: number;
}

export interface HeatmapResponse {
  days: number;
  cells: HeatmapCell[];
}

export interface StreakResponse {
  current_streak: number;
  longest_streak: number;
}

export type TrendGranularity = 'day' | 'week' | 'month';

export interface TrendBucket {
  bucket_start: string;   // the day / the Monday / the 1st, in user tz
  total_seconds: number;
}

export interface TrendResponse {
  granularity: TrendGranularity;
  buckets: TrendBucket[];  // contiguous, zero-filled, chronological
}

export interface GenreEntry {
  genre: string;
  total_seconds: number;
}

export interface GenresResponse {
  items: GenreEntry[];
}

export interface ThemeEntry {
  theme: string;
  total_seconds: number;
}

export interface ThemesResponse {
  items: ThemeEntry[];
}

export type CompanyRole = 'developer' | 'publisher';

export interface CompanyEntry {
  name: string;
  total_seconds: number;
  game_count: number;
}

export interface CompaniesResponse {
  items: CompanyEntry[];
}

export interface ReleaseYearEntry {
  decade: string;
  total_seconds: number;
}

export interface ReleaseYearsResponse {
  items: ReleaseYearEntry[];
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
  language?: string | null;
  notifications_enabled: boolean;
  is_admin: boolean;
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
