import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import {
    getCompanies,
    getGenres,
    getHeatmap,
    getReleaseYears,
    getStatsSummary,
    getStreak,
    getThemes,
    getWeeklyTrend,
} from '../api/stats';
import {
    CompaniesResponse,
    CompanyRole,
    GenresResponse,
    HeatmapResponse,
    ReleaseYearsResponse,
    StatsSummary,
    StreakResponse,
    ThemesResponse,
    WeeklyTrendResponse,
} from '../types/api';
import { colors } from '../theme/colors';
import { bodyFont, displayFont } from '../theme/fonts';
import { common } from '../theme/styles';
import ErrorBanner from '../components/ErrorBanner';

const PERIODS = [7, 30, 90] as const;
type Period = typeof PERIODS[number];

const ROLES: readonly CompanyRole[] = ['developer', 'publisher'] as const;
const ROLE_LABELS: Record<CompanyRole, string> = {
    developer: 'DEWELOPERZY',
    publisher: 'WYDAWCY',
};

const DOW_LABELS = ['PN', 'WT', 'ŚR', 'CZ', 'PT', 'SB', 'ND'];

// Rank-as-heat: most-played tag is the hottest orange, fading to deep ember.
const TAG_HEAT = ['#ff7a1a', '#f2691a', '#d9591b', '#b8491a', '#8f3a18'];

const TOP_N = 5;

function formatHours(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatHoursShort(seconds: number) {
    const h = seconds / 3600;
    if (h >= 10) return `${Math.round(h)}h`;
    return `${h.toFixed(1)}h`;
}

function formatWeekStart(iso: string) {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function StatsScreen() {
    const [days, setDays] = useState<Period>(7);
    const [role, setRole] = useState<CompanyRole>('developer');
    const [loadError, setLoadError] = useState(false);

    const [summary, setSummary] = useState<StatsSummary | null>(null);
    const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
    const [streak, setStreak] = useState<StreakResponse | null>(null);
    const [trend, setTrend] = useState<WeeklyTrendResponse | null>(null);
    const [genres, setGenres] = useState<GenresResponse | null>(null);
    const [themes, setThemes] = useState<ThemesResponse | null>(null);
    const [companies, setCompanies] = useState<CompaniesResponse | null>(null);
    const [releaseYears, setReleaseYears] = useState<ReleaseYearsResponse | null>(null);

    // Ranked lists are capped at TOP_N; these expand them to the full fetched set.
    const [gamesExpanded, setGamesExpanded] = useState(false);
    const [companiesExpanded, setCompaniesExpanded] = useState(false);

    // Period-bound: summary + heatmap share the user-selected window.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [s, h] = await Promise.all([getStatsSummary(days), getHeatmap(days)]);
                if (cancelled) return;
                setSummary(s);
                setHeatmap(h);
                setLoadError(false);
            } catch {
                setLoadError(true);
            }
        })();
        return () => { cancelled = true; };
    }, [days]);

    // Static breakdowns: fetched once.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [st, wt, g, t, ry] = await Promise.all([
                    getStreak(),
                    getWeeklyTrend(),
                    getGenres(),
                    getThemes(),
                    getReleaseYears(),
                ]);
                if (cancelled) return;
                setStreak(st);
                setTrend(wt);
                setGenres(g);
                setThemes(t);
                setReleaseYears(ry);
            } catch {
                // TODO
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Role-bound: companies refetches on toggle.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const c = await getCompanies(role, 10);
                if (cancelled) return;
                setCompanies(c);
            } catch {
                // TODO
            }
        })();
        return () => { cancelled = true; };
    }, [role]);

    const heatmapMax = heatmap
        ? heatmap.cells.reduce((m, c) => Math.max(m, c.seconds), 0)
        : 0;
    const trendMax = trend
        ? trend.weeks.reduce((m, w) => Math.max(m, w.total_seconds), 0)
        : 0;
    const decadeMax = releaseYears
        ? releaseYears.items.reduce((m, r) => Math.max(m, r.total_seconds), 0)
        : 0;

    return (
        <SafeAreaView style={common.safe} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={common.eyebrow}>◈ GAMETRACE</Text>
                    <Text style={common.title}>Statystyki</Text>
                </View>

                {/* Period selector */}
                <Text style={common.label}>OKRES</Text>
                <View style={styles.pillRow}>
                    {PERIODS.map(p => {
                        const active = days === p;
                        return (
                            <TouchableOpacity
                                key={p}
                                style={[styles.pill, active && styles.pillActive]}
                                onPress={() => setDays(p)}
                                activeOpacity={0.85}
                            >
                                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                    {p} DNI
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {loadError && <ErrorBanner message="Nie udało się pobrać statystyk." style={styles.errorWrap} />}

                {/* Total */}
                <Text style={common.label}>ŁĄCZNIE</Text>
                <Text style={styles.totalValue}>{summary ? formatHours(summary.total_seconds) : '—'}</Text>
                <Text style={styles.totalSub}>w ciągu ostatnich {days} dni</Text>

                {/* Streak */}
                <Text style={common.label}>PASSA</Text>
                <View style={styles.streakRow}>
                    <View style={styles.streakCell}>
                        <Text style={styles.streakValue}>{streak ? streak.current_streak : '—'}</Text>
                        <Text style={styles.streakSub}>obecna</Text>
                    </View>
                    <View style={styles.streakDivider} />
                    <View style={styles.streakCell}>
                        <Text style={styles.streakValue}>{streak ? streak.longest_streak : '—'}</Text>
                        <Text style={styles.streakSub}>najdłuższa</Text>
                    </View>
                </View>

                {/* Heatmap */}
                <Text style={common.label}>AKTYWNOŚĆ · DZIEŃ × GODZINA</Text>
                {!heatmap || heatmapMax === 0 ? (
                    <Text style={styles.empty}>Brak danych</Text>
                ) : (
                    <View style={styles.heatmap}>
                        {DOW_LABELS.map((label, dow) => (
                            <View key={dow} style={styles.heatRow}>
                                <Text style={styles.heatDow}>{label}</Text>
                                <View style={styles.heatCells}>
                                    {Array.from({ length: 24 }).map((_, hour) => {
                                        const cell = heatmap.cells.find(c => c.dow === dow && c.hour === hour);
                                        const seconds = cell ? cell.seconds : 0;
                                        const intensity = heatmapMax > 0 ? seconds / heatmapMax : 0;
                                        return (
                                            <View
                                                key={hour}
                                                style={[
                                                    styles.heatCell,
                                                    {
                                                        backgroundColor: intensity === 0
                                                            ? colors.bg3
                                                            : `rgba(255, 122, 26, ${0.15 + intensity * 0.85})`,
                                                    },
                                                ]}
                                            />
                                        );
                                    })}
                                </View>
                            </View>
                        ))}
                        <View style={styles.heatHourRow}>
                            <Text style={styles.heatHourLabel}>0</Text>
                            <Text style={styles.heatHourLabel}>6</Text>
                            <Text style={styles.heatHourLabel}>12</Text>
                            <Text style={styles.heatHourLabel}>18</Text>
                            <Text style={styles.heatHourLabel}>23</Text>
                        </View>
                    </View>
                )}

                {/* Weekly trend */}
                <Text style={common.label}>TRENDY · TYGODNIOWO</Text>
                {!trend || trendMax === 0 ? (
                    <Text style={styles.empty}>Brak danych</Text>
                ) : (
                    <View style={styles.trend}>
                        <TrendLine weeks={trend.weeks} max={trendMax} />
                        <View style={styles.trendLabels}>
                            <Text style={styles.trendLabel}>{formatWeekStart(trend.weeks[0].week_start)}</Text>
                            <Text style={styles.trendLabel}>{formatWeekStart(trend.weeks[trend.weeks.length - 1].week_start)}</Text>
                        </View>
                    </View>
                )}

                {/* Per-game ranking */}
                <Text style={common.label}>RANKING GIER</Text>
                {!summary || summary.per_game.length === 0 ? (
                    <Text style={styles.empty}>Brak sesji w tym okresie</Text>
                ) : (
                    (() => {
                        const rows = gamesExpanded ? summary.per_game : summary.per_game.slice(0, TOP_N);
                        return (
                            <>
                                {rows.map((item, i) => (
                                    <View
                                        key={item.game_id}
                                        style={[styles.row, i < rows.length - 1 && styles.rowBorder]}
                                    >
                                        <Text style={styles.rank}>{String(i + 1).padStart(2, '0')}</Text>
                                        <Text style={styles.gameName} numberOfLines={1}>{item.game_name}</Text>
                                        <Text style={styles.gameTime}>{formatHours(item.total_seconds)}</Text>
                                    </View>
                                ))}
                                {summary.per_game.length > TOP_N && (
                                    <ShowMoreToggle
                                        expanded={gamesExpanded}
                                        onPress={() => setGamesExpanded(v => !v)}
                                    />
                                )}
                            </>
                        );
                    })()
                )}

                {/* Genres — a game carries multiple genres, so each session counts
                    toward every genre on its game. Bars are share-of-exposure (overlap
                    allowed), not a partition; longest bar = most-played genre. */}
                <Text style={common.label}>GATUNKI</Text>
                <BreakdownList
                    items={genres ? genres.items.map(g => ({ label: g.genre, seconds: g.total_seconds })) : null}
                />

                {/* Themes — same overlap caveat as genres above. */}
                <Text style={common.label}>MOTYWY</Text>
                <BreakdownList
                    items={themes ? themes.items.map(t => ({ label: t.theme, seconds: t.total_seconds })) : null}
                />

                {/* Release years */}
                <Text style={common.label}>DEKADY WYDANIA</Text>
                {!releaseYears || releaseYears.items.length === 0 ? (
                    <Text style={styles.empty}>Brak danych</Text>
                ) : (
                    releaseYears.items.map(item => (
                        <BreakdownBar
                            key={item.decade}
                            label={item.decade}
                            seconds={item.total_seconds}
                            max={decadeMax}
                        />
                    ))
                )}

                {/* Companies (role toggle) — at the bottom */}
                <Text style={common.label}>STUDIA</Text>
                <View style={styles.pillRow}>
                    {ROLES.map(r => {
                        const active = role === r;
                        return (
                            <TouchableOpacity
                                key={r}
                                style={[styles.pill, active && styles.pillActive]}
                                onPress={() => setRole(r)}
                                activeOpacity={0.85}
                            >
                                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                    {ROLE_LABELS[r]}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                {!companies || companies.items.length === 0 ? (
                    <Text style={styles.empty}>Brak danych</Text>
                ) : (
                    (() => {
                        const rows = companiesExpanded ? companies.items : companies.items.slice(0, TOP_N);
                        return (
                            <>
                                {rows.map((item, i) => (
                                    <View
                                        key={item.name}
                                        style={[styles.row, i < rows.length - 1 && styles.rowBorder]}
                                    >
                                        <Text style={styles.rank}>{String(i + 1).padStart(2, '0')}</Text>
                                        <View style={styles.companyMain}>
                                            <Text style={styles.gameName} numberOfLines={1}>{item.name}</Text>
                                            <Text style={styles.companyMeta}>
                                                {item.game_count} {item.game_count === 1 ? 'gra' : 'gier'}
                                            </Text>
                                        </View>
                                        <Text style={styles.gameTime}>{formatHours(item.total_seconds)}</Text>
                                    </View>
                                ))}
                                {companies.items.length > TOP_N && (
                                    <ShowMoreToggle
                                        expanded={companiesExpanded}
                                        onPress={() => setCompaniesExpanded(v => !v)}
                                    />
                                )}
                            </>
                        );
                    })()
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

type BreakdownItem = { label: string; seconds: number };

// Ranked hour bars for overlapping tags (genres/themes). Each session counts
// toward every tag on its game, so these don't partition to 100% — the bars are
// scaled to the top tag, read as "most-played", not "share of total".
function BreakdownList({ items }: { items: BreakdownItem[] | null }) {
    if (!items) {
        return <Text style={styles.empty}>—</Text>;
    }
    if (items.length === 0) {
        return <Text style={styles.empty}>Brak danych</Text>;
    }

    const top = [...items].sort((a, b) => b.seconds - a.seconds).slice(0, TOP_N);
    const max = top.length > 0 ? top[0].seconds : 0;

    return (
        <>
            {top.map((item, i) => (
                <TagBar
                    key={item.label}
                    label={item.label}
                    seconds={item.seconds}
                    max={max}
                    color={TAG_HEAT[i]}
                />
            ))}
        </>
    );
}

// Card width = screen - screen padding (20*2) - card padding (12*2). Computed
// once from Dimensions; this app doesn't support rotation.
const TREND_W = Dimensions.get('window').width - 40 - 24;
const TREND_H = 90;

function TrendLine({ weeks, max }: { weeks: { week_start: string; total_seconds: number }[]; max: number }) {
    if (weeks.length === 0 || max === 0) return null;

    const stepX = weeks.length > 1 ? TREND_W / (weeks.length - 1) : 0;
    const points = weeks.map((w, i) => ({
        x: i * stepX,
        y: TREND_H - (w.total_seconds / max) * TREND_H,
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${TREND_W} ${TREND_H} L 0 ${TREND_H} Z`;

    return (
        <Svg width={TREND_W} height={TREND_H}>
            <Path d={areaPath} fill="rgba(255, 122, 26, 0.15)" />
            <Path d={linePath} stroke={colors.orange} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => (
                <Circle key={i} cx={p.x} cy={p.y} r={3} fill={colors.orange} />
            ))}
        </Svg>
    );
}

function BreakdownBar({ label, seconds, max }: { label: string; seconds: number; max: number }) {
    const widthPct = max > 0 ? (seconds / max) * 100 : 0;
    return (
        <View style={styles.breakdown}>
            <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownLabel} numberOfLines={1}>{label}</Text>
                <Text style={styles.breakdownValue}>{formatHoursShort(seconds)}</Text>
            </View>
            <View style={styles.breakdownTrack}>
                <View style={[styles.breakdownFill, { width: `${widthPct}%` }]} />
            </View>
        </View>
    );
}

// Thick colored bar with the tag name set on the fill. Short fills leave the name
// over the dark track, so the text carries a dark halo to stay legible either way.
function TagBar({ label, seconds, max, color }: { label: string; seconds: number; max: number; color: string }) {
    // Floor at a sliver so a tiny tag still shows a colored stub under its name.
    const widthPct = max > 0 ? Math.max((seconds / max) * 100, 8) : 0;
    return (
        <View style={styles.tagTrack}>
            <View style={[styles.tagFill, { width: `${widthPct}%`, backgroundColor: color }]} />
            <View style={styles.tagOverlay}>
                <Text style={styles.tagLabel} numberOfLines={1}>{label}</Text>
                <Text style={styles.tagValue}>{formatHoursShort(seconds)}</Text>
            </View>
        </View>
    );
}

function ShowMoreToggle({ expanded, onPress }: { expanded: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.showMore} onPress={onPress} activeOpacity={0.7}>
            <Text style={styles.showMoreText}>{expanded ? 'Pokaż mniej' : 'Pokaż więcej'}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    header: { paddingTop: 16, paddingBottom: 20 },

    pillRow: { flexDirection: 'row', gap: 8 },
    pill: {
        flex: 1,
        backgroundColor: colors.bg3,
        borderWidth: 1, borderColor: colors.borderBright,
        borderRadius: 2,
        paddingVertical: 12,
        alignItems: 'center',
    },
    pillActive: { backgroundColor: colors.orange, borderColor: colors.orange },
    pillText: {
        fontFamily: displayFont.bold, fontSize: 12, letterSpacing: 2,
        color: colors.text3,
    },
    pillTextActive: { color: colors.buttonTextOnOrange },

    totalValue: {
        fontFamily: displayFont.bold, fontSize: 44, letterSpacing: -1,
        color: colors.orange,
    },
    totalSub: {
        fontFamily: bodyFont.regular, fontSize: 13, color: colors.text3,
        marginTop: 2,
    },

    streakRow: {
        flexDirection: 'row',
        backgroundColor: colors.bg3,
        borderWidth: 1, borderColor: colors.borderBright,
        borderRadius: 2,
        paddingVertical: 16,
    },
    streakCell: { flex: 1, alignItems: 'center' },
    streakDivider: { width: 1, backgroundColor: colors.border },
    streakValue: {
        fontFamily: displayFont.bold, fontSize: 32, letterSpacing: -0.5,
        color: colors.orange,
    },
    streakSub: {
        fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 2,
        color: colors.text3, marginTop: 4,
    },

    heatmap: {
        backgroundColor: colors.bg3,
        borderWidth: 1, borderColor: colors.borderBright,
        borderRadius: 2,
        padding: 10,
    },
    heatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    heatDow: {
        width: 26,
        fontFamily: displayFont.bold, fontSize: 9, letterSpacing: 1,
        color: colors.text3,
    },
    heatCells: { flex: 1, flexDirection: 'row', gap: 1 },
    heatCell: { flex: 1, height: 14, borderRadius: 1 },
    heatHourRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        marginLeft: 26, marginTop: 4,
    },
    heatHourLabel: {
        fontFamily: displayFont.bold, fontSize: 9, letterSpacing: 1,
        color: colors.text3,
    },

    trend: {
        backgroundColor: colors.bg3,
        borderWidth: 1, borderColor: colors.borderBright,
        borderRadius: 2,
        padding: 12,
    },
    trendLabels: {
        flexDirection: 'row', justifyContent: 'space-between', marginTop: 8,
    },
    trendLabel: {
        fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 1,
        color: colors.text3,
    },

    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12,
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    showMore: { paddingVertical: 12, alignItems: 'center' },
    showMoreText: {
        fontFamily: displayFont.bold, fontSize: 11, letterSpacing: 1.5,
        textTransform: 'uppercase', color: colors.orange,
    },
    rank: {
        width: 32,
        fontFamily: displayFont.bold, fontSize: 14, letterSpacing: 1,
        color: colors.text3,
    },
    gameName: { flex: 1, fontFamily: bodyFont.medium, fontSize: 15, color: colors.text },
    gameTime: { fontFamily: bodyFont.medium, fontSize: 14, color: colors.text2 },

    companyMain: { flex: 1 },
    companyMeta: {
        fontFamily: bodyFont.regular, fontSize: 12, color: colors.text3,
        marginTop: 2,
    },

    breakdown: { marginBottom: 10 },
    breakdownHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'baseline', marginBottom: 4,
    },
    breakdownLabel: {
        flex: 1, fontFamily: bodyFont.medium, fontSize: 14, color: colors.text,
    },
    breakdownValue: {
        fontFamily: bodyFont.medium, fontSize: 13, color: colors.text2,
        marginLeft: 8,
    },
    breakdownTrack: {
        height: 4, backgroundColor: colors.bg3, borderRadius: 2, overflow: 'hidden',
    },
    breakdownFill: { height: '100%', backgroundColor: colors.orange },

    tagTrack: {
        height: 30, marginBottom: 8, borderRadius: 2,
        backgroundColor: colors.bg3, overflow: 'hidden', justifyContent: 'center',
    },
    tagFill: { ...StyleSheet.absoluteFillObject, right: undefined, borderRadius: 2 },
    tagOverlay: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    tagLabel: {
        flex: 1, fontFamily: displayFont.bold, fontSize: 13, letterSpacing: 1,
        color: '#fff', textTransform: 'uppercase',
        textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 3,
    },
    tagValue: {
        fontFamily: bodyFont.medium, fontSize: 12, color: '#fff', marginLeft: 8,
        textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 3,
    },

    empty: { fontFamily: bodyFont.regular, fontSize: 14, color: colors.text3, marginTop: 8 },
    errorWrap: { marginTop: 16 },
});
