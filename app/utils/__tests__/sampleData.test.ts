import {
    SAMPLE_PERIOD_DAYS, SAMPLE_SESSIONS, SAMPLE_GAMES, SAMPLE_GAME_STATS,
    SAMPLE_DASHBOARD, SAMPLE_STATS_SUMMARY, SAMPLE_GENRES, SAMPLE_TREND,
} from '../sampleData';

const DAY_MS = 24 * 60 * 60 * 1000;

test('every id is negative so it can never collide with a real one', () => {
    expect(SAMPLE_GAMES.every((g) => g.id < 0)).toBe(true);
    expect(SAMPLE_SESSIONS.every((s) => s.id < 0 && s.game_id < 0)).toBe(true);
});

test('sessions are newest-first', () => {
    const starts = SAMPLE_SESSIONS.map((s) => Date.parse(s.start_time));
    expect([...starts].sort((a, b) => b - a)).toEqual(starts);
});

test('every session falls inside the advertised sample window', () => {
    const oldest = Math.min(...SAMPLE_SESSIONS.map((s) => Date.parse(s.start_time)));
    expect(Date.now() - oldest).toBeLessThan(SAMPLE_PERIOD_DAYS * DAY_MS);
    expect(SAMPLE_STATS_SUMMARY.days).toBe(SAMPLE_PERIOD_DAYS);
});

test('per-game totals equal the sum of that game\'s sessions', () => {
    for (const game of SAMPLE_GAMES) {
        const expected = SAMPLE_SESSIONS
            .filter((s) => s.game_id === game.id)
            .reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
        expect(game.total_seconds).toBe(expected);
    }
});

test('SAMPLE_GAME_STATS agrees with the session list', () => {
    const game = SAMPLE_GAMES[0];
    const stats = SAMPLE_GAME_STATS(game.id);
    const sessions = SAMPLE_SESSIONS.filter((s) => s.game_id === game.id);

    expect(stats).toBeDefined();
    expect(stats!.session_count).toBe(sessions.length);
    expect(stats!.total_seconds).toBe(game.total_seconds);
});

test('SAMPLE_GAME_STATS returns undefined for an unknown game', () => {
    expect(SAMPLE_GAME_STATS(-999)).toBeUndefined();
});

test('dashboard tiles are non-zero so the preview never looks empty', () => {
    expect(SAMPLE_DASHBOARD.total_seconds_30d).toBeGreaterThan(0);
    expect(SAMPLE_DASHBOARD.total_seconds_7d).toBeGreaterThan(0);
    expect(SAMPLE_DASHBOARD.active_session).toBeNull();
});

test('summary total covers every session in the window', () => {
    const all = SAMPLE_SESSIONS.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
    expect(SAMPLE_STATS_SUMMARY.total_seconds).toBe(all);
    expect(SAMPLE_STATS_SUMMARY.per_game.length).toBe(SAMPLE_GAMES.length);
});

test('breakdowns are sorted descending by playtime', () => {
    const seconds = SAMPLE_GENRES.items.map((i) => i.total_seconds);
    expect([...seconds].sort((a, b) => b - a)).toEqual(seconds);
    expect(SAMPLE_TREND.buckets.length).toBeGreaterThan(0);
});
