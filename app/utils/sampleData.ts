import type {
    Game,
    GameBrief,
    Session,
    GameStats,
    DashboardSummary,
    StatsSummary,
    GameStatEntry,
    HeatmapResponse,
    HeatmapCell,
    TrendResponse,
    TrendBucket,
    GenresResponse,
    ThemesResponse,
    CompaniesResponse,
    ReleaseYearsResponse,
} from '../types/api';

// Fabricated data for the empty-account preview. Never fetched, never written.
// All ids are negative so a sample row can never be confused with a real record.
const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.now();

// The window the preview claims to cover. Every seed below sits inside it, so the
// period caption on Stats stays truthful; 90 is also a real value in the Stats
// period pills, so the highlighted pill matches the data.
export const SAMPLE_PERIOD_DAYS = 90;

type GameFacets = {
    genre: string;
    theme: string;
    developer: string;
    publisher: string;
    decade: string;
};

type SampleGameSeed = {
    id: number;
    name: string;
    /** Hardcoded IGDB CDN cover so the preview works offline and on a fresh clone. */
    cover_image_url: string;
    facets: GameFacets;
};

const GAME_SEEDS: SampleGameSeed[] = [
    { id: -1, name: "Baldur's Gate 3", cover_image_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co670h.jpg', facets: { genre: 'RPG', theme: 'Fantasy', developer: 'Larian Studios', publisher: 'Larian Studios', decade: '2020s' } },
    { id: -2, name: 'Helldivers 2', cover_image_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/coabbf.jpg', facets: { genre: 'Shooter', theme: 'Sci-Fi', developer: 'Arrowhead Game Studios', publisher: 'Sony Interactive Entertainment', decade: '2020s' } },
    { id: -3, name: 'Factorio', cover_image_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tfy.jpg', facets: { genre: 'Simulator', theme: 'Sci-Fi', developer: 'Wube Software', publisher: 'Wube Software', decade: '2020s' } },
    { id: -4, name: 'Hades', cover_image_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/cob9kr.jpg', facets: { genre: 'Hack and slash', theme: 'Fantasy', developer: 'Supergiant Games', publisher: 'Supergiant Games', decade: '2020s' } },
    { id: -5, name: 'Wiedźmin 3', cover_image_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/coaarl.jpg', facets: { genre: 'RPG', theme: 'Fantasy', developer: 'CD Projekt Red', publisher: 'CD Projekt', decade: '2010s' } },
    { id: -6, name: 'Celeste', cover_image_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/cob9dh.jpg', facets: { genre: 'Platform', theme: 'Drama', developer: 'Maddy Makes Games', publisher: 'Maddy Makes Games', decade: '2010s' } },
    { id: -7, name: 'Stardew Valley', cover_image_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/coa93h.jpg', facets: { genre: 'Simulator', theme: 'Slice of life', developer: 'ConcernedApe', publisher: 'ConcernedApe', decade: '2010s' } },
    { id: -8, name: 'Return of the Obra Dinn', cover_image_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co27j9.jpg', facets: { genre: 'Puzzle', theme: 'Mystery', developer: 'Lucas Pope', publisher: 'Lucas Pope', decade: '2010s' } },
];

type SessionSeed = {
    gameId: number;
    daysAgo: number;
    hour: number;
    durationHours: number;
};

const SESSION_SEEDS: SessionSeed[] = [
    { gameId: -1, daysAgo: 2, hour: 20, durationHours: 3 },
    { gameId: -1, daysAgo: 5, hour: 19, durationHours: 2.5 },
    { gameId: -1, daysAgo: 9, hour: 21, durationHours: 3 },
    { gameId: -1, daysAgo: 16, hour: 20, durationHours: 2 },
    { gameId: -1, daysAgo: 23, hour: 18, durationHours: 2 },
    { gameId: -1, daysAgo: 30, hour: 20, durationHours: 1.5 },
    { gameId: -2, daysAgo: 1, hour: 21, durationHours: 2 },
    { gameId: -2, daysAgo: 4, hour: 22, durationHours: 1.5 },
    { gameId: -2, daysAgo: 11, hour: 20, durationHours: 2 },
    { gameId: -2, daysAgo: 18, hour: 21, durationHours: 1.5 },
    { gameId: -2, daysAgo: 27, hour: 19, durationHours: 2 },
    { gameId: -3, daysAgo: 3, hour: 15, durationHours: 3 },
    { gameId: -3, daysAgo: 6, hour: 14, durationHours: 2 },
    { gameId: -3, daysAgo: 10, hour: 16, durationHours: 2 },
    { gameId: -3, daysAgo: 17, hour: 15, durationHours: 2 },
    { gameId: -3, daysAgo: 24, hour: 13, durationHours: 2 },
    { gameId: -4, daysAgo: 0, hour: 22, durationHours: 1.5 },
    { gameId: -4, daysAgo: 7, hour: 23, durationHours: 1 },
    { gameId: -4, daysAgo: 14, hour: 21, durationHours: 1.5 },
    { gameId: -4, daysAgo: 21, hour: 22, durationHours: 1 },
    { gameId: -4, daysAgo: 35, hour: 20, durationHours: 1 },
    { gameId: -5, daysAgo: 6, hour: 19, durationHours: 2 },
    { gameId: -5, daysAgo: 13, hour: 20, durationHours: 2 },
    { gameId: -5, daysAgo: 20, hour: 18, durationHours: 2 },
    { gameId: -5, daysAgo: 40, hour: 19, durationHours: 2 },
    { gameId: -6, daysAgo: 2, hour: 17, durationHours: 1 },
    { gameId: -6, daysAgo: 15, hour: 16, durationHours: 1 },
    { gameId: -6, daysAgo: 45, hour: 17, durationHours: 1 },
    { gameId: -7, daysAgo: 8, hour: 12, durationHours: 1.5 },
    { gameId: -7, daysAgo: 19, hour: 13, durationHours: 1.5 },
    { gameId: -7, daysAgo: 33, hour: 11, durationHours: 1 },
    { gameId: -7, daysAgo: 50, hour: 12, durationHours: 1 },
    { gameId: -8, daysAgo: 12, hour: 21, durationHours: 1 },
    { gameId: -8, daysAgo: 38, hour: 20, durationHours: 1 },
];

function gameSeedById(id: number): SampleGameSeed {
    const found = GAME_SEEDS.find((g) => g.id === id);
    if (!found) throw new Error(`Unknown sample game id ${id}`);
    return found;
}

function seedToSession(seed: SessionSeed, index: number, game: SampleGameSeed): Session {
    const start = new Date(NOW - seed.daysAgo * DAY_MS);
    start.setHours(seed.hour, 0, 0, 0);
    const end = new Date(start.getTime() + seed.durationHours * 60 * 60 * 1000);
    const brief: GameBrief = { id: game.id, primary_name: game.name, cover_image_url: game.cover_image_url };
    return {
        id: -(100 + index),
        game_id: game.id,
        game: brief,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_seconds: Math.round(seed.durationHours * 3600),
        status: 'COMPLETED',
        source: index % 3 === 0 ? 'BOT' : 'MANUAL',
        notes: null,
        created_at: end.toISOString(),
    };
}

export const SAMPLE_SESSIONS: Session[] = SESSION_SEEDS
    .map((seed, index) => seedToSession(seed, index, gameSeedById(seed.gameId)))
    .sort((a, b) => Date.parse(b.start_time) - Date.parse(a.start_time));

function withinDays(iso: string, days: number): boolean {
    return NOW - Date.parse(iso) < days * DAY_MS;
}

export const SAMPLE_GAMES: Game[] = GAME_SEEDS.map((seed) => {
    const sessions = SAMPLE_SESSIONS.filter((s) => s.game_id === seed.id);
    const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
    const lastPlayed = sessions.reduce<string | null>((latest, s) => {
        const end = s.end_time ?? s.start_time;
        return latest == null || Date.parse(end) > Date.parse(latest) ? end : latest;
    }, null);
    return {
        id: seed.id,
        primary_name: seed.name,
        cover_image_url: seed.cover_image_url,
        cover_source: 'EXTERNAL',
        enrichment_status: 'ENRICHED',
        is_ignored: false,
        is_accepted: true,
        total_seconds: totalSeconds,
        last_played: lastPlayed,
    };
});

export function SAMPLE_GAME_STATS(gameId: number): GameStats | undefined {
    const sessions = SAMPLE_SESSIONS.filter((s) => s.game_id === gameId);
    if (sessions.length === 0) return undefined;
    const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
    const starts = sessions.map((s) => Date.parse(s.start_time));
    const ends = sessions.map((s) => Date.parse(s.end_time ?? s.start_time));
    return {
        game_id: gameId,
        total_seconds: totalSeconds,
        session_count: sessions.length,
        first_played: new Date(Math.min(...starts)).toISOString(),
        last_played: new Date(Math.max(...ends)).toISOString(),
    };
}

export const SAMPLE_LAST_SESSION: Session = SAMPLE_SESSIONS[0];

export const SAMPLE_DASHBOARD: DashboardSummary = {
    total_seconds_today: SAMPLE_SESSIONS.filter((s) => withinDays(s.start_time, 1))
        .reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0),
    total_seconds_7d: SAMPLE_SESSIONS.filter((s) => withinDays(s.start_time, 7))
        .reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0),
    total_seconds_30d: SAMPLE_SESSIONS.filter((s) => withinDays(s.start_time, 30))
        .reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0),
    active_session: null,
    pending_errors: [],
};

const PER_GAME_ENTRIES: GameStatEntry[] = SAMPLE_GAMES
    .map((g) => ({ game_id: g.id, game_name: g.primary_name, cover_image_url: g.cover_image_url, total_seconds: g.total_seconds }))
    .sort((a, b) => b.total_seconds - a.total_seconds);

const LONGEST_SESSION = SAMPLE_SESSIONS.reduce(
    (longest, s) => ((s.duration_seconds ?? 0) > (longest.duration_seconds ?? 0) ? s : longest),
    SAMPLE_SESSIONS[0],
);

const TOTAL_ALL_SECONDS = SAMPLE_SESSIONS.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);

export const SAMPLE_STATS_SUMMARY: StatsSummary = {
    days: SAMPLE_PERIOD_DAYS,
    window_start: new Date(NOW - SAMPLE_PERIOD_DAYS * DAY_MS).toISOString(),
    window_end: new Date(NOW).toISOString(),
    total_seconds: TOTAL_ALL_SECONDS,
    avg_session_seconds: Math.round(TOTAL_ALL_SECONDS / SAMPLE_SESSIONS.length),
    longest_session_seconds: LONGEST_SESSION.duration_seconds ?? 0,
    longest_session_game_id: LONGEST_SESSION.game_id,
    longest_session_game_name: LONGEST_SESSION.game.primary_name,
    previous_total_seconds: Math.round(TOTAL_ALL_SECONDS * 0.82),
    new_games_count: 2,
    per_game: PER_GAME_ENTRIES,
    pending_errors: [],
};

function dowMondayFirst(jsDay: number): number {
    return (jsDay + 6) % 7;
}

function computeHeatmap(): HeatmapResponse {
    const cellMap = new Map<string, HeatmapCell>();
    for (const s of SAMPLE_SESSIONS) {
        const start = new Date(s.start_time);
        const dow = dowMondayFirst(start.getDay());
        const hour = start.getHours();
        const key = `${dow}-${hour}`;
        const seconds = (cellMap.get(key)?.seconds ?? 0) + (s.duration_seconds ?? 0);
        cellMap.set(key, { dow, hour, seconds });
    }
    return { days: SAMPLE_PERIOD_DAYS, cells: [...cellMap.values()] };
}

export const SAMPLE_HEATMAP: HeatmapResponse = computeHeatmap();

function isoWeekStart(iso: string): string {
    const d = new Date(iso);
    const dow = dowMondayFirst(d.getDay());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - dow);
    return d.toISOString().slice(0, 10);
}

function computeTrend(): TrendResponse {
    const bucketMap = new Map<string, number>();
    for (const s of SAMPLE_SESSIONS) {
        const bucket = isoWeekStart(s.start_time);
        bucketMap.set(bucket, (bucketMap.get(bucket) ?? 0) + (s.duration_seconds ?? 0));
    }
    const buckets: TrendBucket[] = [...bucketMap.entries()]
        .sort(([a], [b]) => Date.parse(a) - Date.parse(b))
        .map(([bucket_start, total_seconds]) => ({ bucket_start, total_seconds }));
    return { granularity: 'week', buckets };
}

export const SAMPLE_TREND: TrendResponse = computeTrend();

function aggregateBy(pick: (facets: GameFacets) => string): Map<string, number> {
    const map = new Map<string, number>();
    for (const game of SAMPLE_GAMES) {
        const key = pick(gameSeedById(game.id).facets);
        map.set(key, (map.get(key) ?? 0) + game.total_seconds);
    }
    return map;
}

export const SAMPLE_GENRES: GenresResponse = {
    items: [...aggregateBy((f) => f.genre).entries()]
        .sort(([, a], [, b]) => b - a)
        .map(([genre, total_seconds]) => ({ genre, total_seconds })),
};

export const SAMPLE_THEMES: ThemesResponse = {
    items: [...aggregateBy((f) => f.theme).entries()]
        .sort(([, a], [, b]) => b - a)
        .map(([theme, total_seconds]) => ({ theme, total_seconds })),
};

export const SAMPLE_RELEASE_YEARS: ReleaseYearsResponse = {
    items: [...aggregateBy((f) => f.decade).entries()]
        .sort(([, a], [, b]) => b - a)
        .map(([decade, total_seconds]) => ({ decade, total_seconds })),
};

function aggregateCompanies(role: 'developer' | 'publisher'): CompaniesResponse {
    const map = new Map<string, { total_seconds: number; game_count: number }>();
    for (const game of SAMPLE_GAMES) {
        const facets = gameSeedById(game.id).facets;
        const name = role === 'developer' ? facets.developer : facets.publisher;
        const entry = map.get(name) ?? { total_seconds: 0, game_count: 0 };
        entry.total_seconds += game.total_seconds;
        entry.game_count += 1;
        map.set(name, entry);
    }
    return {
        items: [...map.entries()]
            .sort(([, a], [, b]) => b.total_seconds - a.total_seconds)
            .map(([name, v]) => ({ name, total_seconds: v.total_seconds, game_count: v.game_count })),
    };
}

export const SAMPLE_COMPANIES_DEVELOPER: CompaniesResponse = aggregateCompanies('developer');
export const SAMPLE_COMPANIES_PUBLISHER: CompaniesResponse = aggregateCompanies('publisher');
