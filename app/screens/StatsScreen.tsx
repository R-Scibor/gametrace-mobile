import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
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

// 5 distinct warm tones + a muted neutral for "Other".
const DONUT_PALETTE = ['#ff7a1a', '#ffb04d', '#dcb95c', '#b85a14', '#7a5230'];
const DONUT_OTHER = '#3d362f';

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
                        <View style={styles.trendBars}>
                            {trend.weeks.map(w => {
                                const heightPct = trendMax > 0 ? (w.total_seconds / trendMax) * 100 : 0;
                                return (
                                    <View key={w.week_start} style={styles.trendCol}>
                                        <View style={styles.trendBarTrack}>
                                            <View
                                                style={[
                                                    styles.trendBarFill,
                                                    { height: `${heightPct}%` },
                                                ]}
                                            />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
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
                    summary.per_game.map((item, i) => (
                        <View
                            key={item.game_id}
                            style={[styles.row, i < summary.per_game.length - 1 && styles.rowBorder]}
                        >
                            <Text style={styles.rank}>{String(i + 1).padStart(2, '0')}</Text>
                            <Text style={styles.gameName} numberOfLines={1}>{item.game_name}</Text>
                            <Text style={styles.gameTime}>{formatHours(item.total_seconds)}</Text>
                        </View>
                    ))
                )}

                {/* Genres donut */}
                <Text style={common.label}>GATUNKI</Text>
                <DonutSection
                    items={genres ? genres.items.map(g => ({ label: g.genre, seconds: g.total_seconds })) : null}
                />

                {/* Themes donut */}
                <Text style={common.label}>MOTYWY</Text>
                <DonutSection
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
                    companies.items.map((item, i) => (
                        <View
                            key={item.name}
                            style={[styles.row, i < companies.items.length - 1 && styles.rowBorder]}
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
                    ))
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

type DonutItem = { label: string; seconds: number };
type DonutSlice = DonutItem & { color: string; pct: number };

function DonutSection({ items }: { items: DonutItem[] | null }) {
    if (!items) {
        return <Text style={styles.empty}>—</Text>;
    }
    if (items.length === 0) {
        return <Text style={styles.empty}>Brak danych</Text>;
    }

    // Top N + aggregated "Inne" for the rest.
    const sorted = [...items].sort((a, b) => b.seconds - a.seconds);
    const top = sorted.slice(0, TOP_N);
    const rest = sorted.slice(TOP_N);
    const restTotal = rest.reduce((s, x) => s + x.seconds, 0);
    const total = sorted.reduce((s, x) => s + x.seconds, 0);

    const slices: DonutSlice[] = top.map((item, i) => ({
        ...item,
        color: DONUT_PALETTE[i],
        pct: total > 0 ? item.seconds / total : 0,
    }));
    if (restTotal > 0) {
        slices.push({
            label: 'Inne',
            seconds: restTotal,
            color: DONUT_OTHER,
            pct: total > 0 ? restTotal / total : 0,
        });
    }

    // TODO: a single game can carry multiple genres/themes — each session counts
    // toward every tag on its game ("exposure", not a partition), so slice
    // percentages don't sum to share-of-playtime. Rethink: normalize per-game,
    // pick a primary tag per game, or relabel so the donut isn't misread.
    return (
        <View style={styles.donutSection}>
            <DonutChart slices={slices} />
            <View style={styles.legend}>
                {slices.map(s => (
                    <View key={s.label} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                        <Text style={styles.legendLabel} numberOfLines={1}>{s.label}</Text>
                        <Text style={styles.legendValue}>{Math.round(s.pct * 100)}%</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const DONUT_SIZE = 120;
const DONUT_R_OUTER = 56;
const DONUT_R_INNER = 36;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
    cx: number, cy: number, rOuter: number, rInner: number,
    startAngle: number, endAngle: number,
) {
    const startOuter = polarToCartesian(cx, cy, rOuter, endAngle);
    const endOuter = polarToCartesian(cx, cy, rOuter, startAngle);
    const startInner = polarToCartesian(cx, cy, rInner, startAngle);
    const endInner = polarToCartesian(cx, cy, rInner, endAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    return [
        `M ${startOuter.x} ${startOuter.y}`,
        `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
        `L ${startInner.x} ${startInner.y}`,
        `A ${rInner} ${rInner} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
        'Z',
    ].join(' ');
}

function DonutChart({ slices }: { slices: DonutSlice[] }) {
    const cx = DONUT_SIZE / 2;
    const cy = DONUT_SIZE / 2;

    // SVG arc can't draw a single 360° slice — render full ring as a Circle stroke.
    const isFullCircle = slices.length === 1 && slices[0].pct >= 0.999;

    let cursor = 0;
    return (
        <View style={styles.donutWrapper}>
            <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
                {isFullCircle ? (
                    <Circle
                        cx={cx}
                        cy={cy}
                        r={(DONUT_R_OUTER + DONUT_R_INNER) / 2}
                        stroke={slices[0].color}
                        strokeWidth={DONUT_R_OUTER - DONUT_R_INNER}
                        fill="none"
                    />
                ) : (
                    slices.map((s) => {
                        const start = cursor;
                        const end = cursor + s.pct * 360;
                        cursor = end;
                        if (end - start <= 0) return null;
                        return (
                            <Path
                                key={s.label}
                                d={arcPath(cx, cy, DONUT_R_OUTER, DONUT_R_INNER, start, end)}
                                fill={s.color}
                            />
                        );
                    })
                )}
            </Svg>
        </View>
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
    trendBars: {
        flexDirection: 'row',
        height: 100,
        alignItems: 'flex-end',
        gap: 4,
    },
    trendCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
    trendBarTrack: { height: '100%', justifyContent: 'flex-end' },
    trendBarFill: {
        backgroundColor: colors.orange,
        borderRadius: 1,
        minHeight: 2,
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

    donutSection: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.bg3,
        borderWidth: 1, borderColor: colors.borderBright,
        borderRadius: 2,
        padding: 14, gap: 14,
    },
    donutWrapper: {
        width: DONUT_SIZE, height: DONUT_SIZE,
        alignItems: 'center', justifyContent: 'center',
    },
    legend: { flex: 1, gap: 6 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: {
        flex: 1, fontFamily: bodyFont.medium, fontSize: 13, color: colors.text,
    },
    legendValue: {
        fontFamily: displayFont.bold, fontSize: 12, letterSpacing: 0.5,
        color: colors.text2,
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

    empty: { fontFamily: bodyFont.regular, fontSize: 14, color: colors.text3, marginTop: 8 },
    errorWrap: { marginTop: 16 },
});
