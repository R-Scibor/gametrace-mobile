// Single source of truth for "Xh Ym" playtime/duration display.
// Floors to the minute (consistent across dashboard, library, stats, edit).
export const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
