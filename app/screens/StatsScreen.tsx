import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
    getCompanies,
    getGenres,
    getHeatmap,
    getReleaseYears,
    getStatsSummary,
    getThemes,
    getTrend,
} from '../api/stats';
import {
    CompaniesResponse,
    CompanyRole,
    GenresResponse,
    HeatmapResponse,
    LibraryFilter,
    ReleaseYearsResponse,
    StatsSummary,
    ThemesResponse,
    TrendBucket,
    TrendGranularity,
    TrendResponse,
} from '../types/api';
import { TabParamList, RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { bodyFont, displayFont } from '../theme/fonts';
import { common } from '../theme/styles';
import ErrorBanner from '../components/ErrorBanner';
import StaleBanner from '../components/StaleBanner';
import SamplePreviewBanner from '../components/SamplePreviewBanner';
import { useCachedFetch } from '../hooks/useCachedFetch';
import Cover from '../components/Cover';
import { InfoLabel } from '../components/InfoButton';
import { NightIcon, MorningIcon, AfternoonIcon, EveningIcon } from '../components/icons/TimeIcons';
import i18n from '../i18n';
import { intlLocale } from '../i18n/resolve';
import { useEmptyAccountStore } from '../store/emptyAccountStore';
import {
    SAMPLE_PERIOD_DAYS, SAMPLE_STATS_SUMMARY, SAMPLE_HEATMAP, SAMPLE_TREND,
    SAMPLE_GENRES, SAMPLE_THEMES, SAMPLE_RELEASE_YEARS,
    SAMPLE_COMPANIES_DEVELOPER, SAMPLE_COMPANIES_PUBLISHER,
} from '../utils/sampleData';

const PERIODS = [7, 30, 90, 0] as const; // 0 = all-time (days=0)
type Period = typeof PERIODS[number];

type SummaryPayload = { summary: StatsSummary; heatmap: HeatmapResponse };
type BreakdownPayload = { genres: GenresResponse; themes: ThemesResponse; releaseYears: ReleaseYearsResponse };

const ROLES: readonly CompanyRole[] = ['developer', 'publisher'] as const;

// Even 6h time-of-day buckets; `start` is the first hour each covers. Icon shows in
// the column header; label comes from stats:heat.* at render.
const HEAT_BUCKETS = [
    { key: 'night', start: 0, Icon: NightIcon },
    { key: 'morning', start: 6, Icon: MorningIcon },
    { key: 'afternoon', start: 12, Icon: AfternoonIcon },
    { key: 'evening', start: 18, Icon: EveningIcon },
] as const;

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


type StatsNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'Stats'>,
    NativeStackNavigationProp<RootStackParamList>
>;

export default function StatsScreen() {
    const navigation = useNavigation<StatsNavigationProp>();
    const { t } = useTranslation('stats');

    const [days, setDays] = useState<Period>(7);
    const [role, setRole] = useState<CompanyRole>('developer');

    // Ranked lists are capped at TOP_N; these expand them to the full fetched set.
    const [gamesExpanded, setGamesExpanded] = useState(false);
    const [companiesExpanded, setCompaniesExpanded] = useState(false);

    const isEmpty = useEmptyAccountStore((s) => s.isEmpty);
    const [sampleDismissed, setSampleDismissed] = useState(false);
    const preview = isEmpty === true && !sampleDismissed;

    // The sample set is one fixed window, so the pills and the caption follow it
    // rather than the live selector. Fetch keys keep using `days` — their results
    // are discarded during preview anyway.
    const effectiveDays = preview ? SAMPLE_PERIOD_DAYS : days;

    const drill = (type: LibraryFilter['type'], value: string) => {
        if (preview) return;
        navigation.navigate('Main', { screen: 'Library', params: { filter: { type, value } } });
    };
    const openGame = (gameId: number, gameName: string | null, coverImageUrl: string | null | undefined) => {
        if (preview) return;
        navigation.navigate('GameDetail', { gameId, gameName: gameName ?? undefined, coverImageUrl: coverImageUrl ?? null });
    };

    // Period-bound: summary + heatmap share the user-selected window (one cache entry).
    const summaryQ = useCachedFetch<SummaryPayload>(
        `stats-summary:days=${days}`,
        async () => {
            const [summary, heatmap] = await Promise.all([getStatsSummary(days), getHeatmap(days)]);
            return { summary, heatmap };
        },
    );

    // Trend buckets by the selected period (server-derived granularity).
    const trendQ = useCachedFetch<TrendResponse>(`stats-trend:days=${days}`, () => getTrend(days));

    // Period-bound breakdowns.
    const breakdownQ = useCachedFetch<BreakdownPayload>(
        `stats-breakdown:days=${days}`,
        async () => {
            const [genres, themes, releaseYears] = await Promise.all([
                getGenres(days), getThemes(days), getReleaseYears(days),
            ]);
            return { genres, themes, releaseYears };
        },
    );

    // Companies: role and period are both part of the key.
    const companiesQ = useCachedFetch<CompaniesResponse>(
        `stats-companies:days=${days}&role=${role}`,
        () => getCompanies(role, 10, days),
    );

    const summary = preview ? SAMPLE_STATS_SUMMARY : (summaryQ.data?.summary ?? null);
    const heatmap = preview ? SAMPLE_HEATMAP : (summaryQ.data?.heatmap ?? null);
    const trend = preview ? SAMPLE_TREND : trendQ.data;
    const genres = preview ? SAMPLE_GENRES : (breakdownQ.data?.genres ?? null);
    const themes = preview ? SAMPLE_THEMES : (breakdownQ.data?.themes ?? null);
    const releaseYears = preview ? SAMPLE_RELEASE_YEARS : (breakdownQ.data?.releaseYears ?? null);
    const companies = preview
        ? (role === 'developer' ? SAMPLE_COMPANIES_DEVELOPER : SAMPLE_COMPANIES_PUBLISHER)
        : companiesQ.data;

    const groups = [summaryQ, trendQ, breakdownQ, companiesQ];
    // One flag per fetch group so a partial failure can't be cleared by another
    // group's success; the banner shows if any group failed with no snapshot.
    const loadError = groups.some((g) => g.error != null);
    const staleSyncTimes = groups
        .filter((g) => g.isStale && g.lastSyncTime != null)
        .map((g) => g.lastSyncTime as number);

    const trendMax = trend
        ? trend.buckets.reduce((m, b) => Math.max(m, b.total_seconds), 0)
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
                    <Text style={common.title}>{t('title')}</Text>
                </View>

                {/* Period selector */}
                <Text style={common.label}>{t('period.label')}</Text>
                <View style={styles.pillRow}>
                    {PERIODS.map(p => {
                        const active = effectiveDays === p;
                        return (
                            <TouchableOpacity
                                key={p}
                                style={[styles.pill, active && styles.pillActive]}
                                onPress={() => setDays(p)}
                                disabled={preview}
                                activeOpacity={0.85}
                            >
                                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                    {p === 0 ? t('period.max') : t('period.days', { days: p })}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {!preview && staleSyncTimes.length > 0 && (
                    <StaleBanner lastSyncTime={Math.min(...staleSyncTimes)} style={styles.errorWrap} />
                )}
                {!preview && loadError && <ErrorBanner message={t('errors.load')} style={styles.errorWrap} />}

                {preview && (
                    <SamplePreviewBanner
                        onDismiss={() => setSampleDismissed(true)}
                        onAddSession={() => navigation.navigate('Main', { screen: 'AddSession' })}
                        style={styles.errorWrap}
                    />
                )}

                {/* ── PRZEGLĄD ── */}
                <SectionHeader label={t('sections.overview')} />
                <View style={styles.totalCard}>
                    <View style={styles.totalRule} />
                    <View style={styles.totalBody}>
                        <Text style={styles.totalLabel}>{t('overview.total')}</Text>
                        <Text style={styles.totalValue}>{summary ? formatHours(summary.total_seconds) : '—'}</Text>
                        <View style={styles.totalMeta}>
                            {summary && (
                                <DeltaMetric total={summary.total_seconds} previous={summary.previous_total_seconds} />
                            )}
                            <Text style={styles.totalSub}>
                                {effectiveDays === 0 ? t('overview.subtitleAll') : t('overview.subtitleDays', { days: effectiveDays })}
                            </Text>
                        </View>
                    </View>
                </View>
                {summary && (
                    <View style={styles.tilesRow}>
                        <Tile label={t('overview.avgSession')} value={formatHours(summary.avg_session_seconds)} />
                        <Tile label={t('overview.newGames')} value={String(summary.new_games_count)} />
                    </View>
                )}

                {/* Record: longest single session — mirrors the dashboard active-session card.
                    Tap opens the game's detail screen. */}
                {summary && summary.longest_session_seconds > 0 && (
                    <TouchableOpacity
                        style={styles.recordCard}
                        activeOpacity={0.7}
                        disabled={summary.longest_session_game_id == null}
                        onPress={() => summary.longest_session_game_id != null && openGame(
                            summary.longest_session_game_id,
                            summary.longest_session_game_name,
                            summary.per_game.find(g => g.game_id === summary.longest_session_game_id)?.cover_image_url,
                        )}
                    >
                        <View style={styles.recordRow}>
                            <View style={styles.recordCoverWrap}>
                                <Cover
                                    gameId={summary.longest_session_game_id}
                                    fallbackUri={summary.per_game.find(g => g.game_id === summary.longest_session_game_id)?.cover_image_url}
                                    style={styles.recordCover}
                                    placeholderChar={summary.longest_session_game_name?.[0]}
                                />
                            </View>
                            <View style={styles.recordMeta}>
                                <Text style={styles.recordLabel}>{t('overview.recordLabel')}</Text>
                                {summary.longest_session_game_name && (
                                    <Text style={styles.recordGame} numberOfLines={2}>{summary.longest_session_game_name}</Text>
                                )}
                                <Text style={styles.recordValue}>{formatHours(summary.longest_session_seconds)}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}

                {/* ── GRY ── */}
                <SectionHeader label={t('sections.games')} />
                {!summary || summary.per_game.length === 0 ? (
                    <Text style={styles.empty}>{t('empty.sessions')}</Text>
                ) : (
                    (() => {
                        const rows = gamesExpanded ? summary.per_game : summary.per_game.slice(0, TOP_N);
                        return (
                            <>
                                {rows.map((item, i) => (
                                    <TouchableOpacity
                                        key={item.game_id}
                                        activeOpacity={0.7}
                                        onPress={() => openGame(item.game_id, item.game_name, item.cover_image_url)}
                                        style={[styles.row, i < rows.length - 1 && styles.rowBorder]}
                                    >
                                        <Text style={styles.rank}>{String(i + 1).padStart(2, '0')}</Text>
                                        <Text style={styles.gameName} numberOfLines={1}>{item.game_name}</Text>
                                        <Text style={styles.gameTime}>{formatHours(item.total_seconds)}</Text>
                                    </TouchableOpacity>
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

                {/* ── KIEDY GRASZ ── */}
                <SectionHeader label={t('sections.whenYouPlay')} />
                <InfoLabel label={t('labels.activity')} title={t('labels.activityTitle')} body={t('info.activity')} />
                <Heatmap data={heatmap} />
                <InfoLabel
                    label={trend
                        ? t('labels.trendsWithGranularity', { granularity: t(`granularity.${trend.granularity}`) })
                        : t('labels.trends')}
                    title={t('labels.trends')}
                    body={t('info.trend')}
                />
                {!trend || trendMax === 0 ? (
                    <Text style={styles.empty}>{t('empty.data')}</Text>
                ) : (
                    <View style={styles.trend}>
                        <TrendLine key={days} buckets={trend.buckets} granularity={trend.granularity} max={trendMax} />
                    </View>
                )}

                {/* ── TWÓJ GUST ── */}
                <SectionHeader label={t('sections.yourTaste')} />
                {/* Genres — a game carries multiple genres, so each session counts
                    toward every genre on its game. Bars are share-of-exposure (overlap
                    allowed), not a partition; longest bar = most-played genre. */}
                <InfoLabel label={t('labels.genres')} body={t('info.genres')} />
                <BreakdownList
                    items={genres ? genres.items.map(g => ({ label: g.genre, seconds: g.total_seconds })) : null}
                    onItemPress={(label) => drill('genre', label)}
                />

                {/* Themes — same overlap caveat as genres above. */}
                <InfoLabel label={t('labels.themes')} body={t('info.themes')} />
                <BreakdownList
                    items={themes ? themes.items.map(item => ({ label: item.theme, seconds: item.total_seconds })) : null}
                    onItemPress={(label) => drill('theme', label)}
                />

                {/* Release years */}
                <InfoLabel label={t('labels.decades')} body={t('info.decades')} />
                {!releaseYears || releaseYears.items.length === 0 ? (
                    <Text style={styles.empty}>{t('empty.data')}</Text>
                ) : (
                    releaseYears.items.map(item => (
                        <BreakdownBar
                            key={item.decade}
                            label={item.decade}
                            seconds={item.total_seconds}
                            max={decadeMax}
                            onPress={() => drill('release_decade', item.decade)}
                        />
                    ))
                )}

                {/* ── TWÓRCY ── */}
                <SectionHeader label={t('sections.creators')} />
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
                                    {t(`roles.${r}`)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                {!companies || companies.items.length === 0 ? (
                    <Text style={styles.empty}>{t('empty.data')}</Text>
                ) : (
                    (() => {
                        const rows = companiesExpanded ? companies.items : companies.items.slice(0, TOP_N);
                        return (
                            <>
                                {rows.map((item, i) => (
                                    <TouchableOpacity
                                        key={item.name}
                                        activeOpacity={0.7}
                                        onPress={() => drill(role, item.name)}
                                        style={[styles.row, i < rows.length - 1 && styles.rowBorder]}
                                    >
                                        <Text style={styles.rank}>{String(i + 1).padStart(2, '0')}</Text>
                                        <View style={styles.companyMain}>
                                            <Text style={styles.gameName} numberOfLines={1}>{item.name}</Text>
                                            <Text style={styles.companyMeta}>
                                                {item.game_count === 1
                                                    ? t('gameCountOne', { count: item.game_count })
                                                    : t('gameCountOther', { count: item.game_count })}
                                            </Text>
                                        </View>
                                        <Text style={styles.gameTime}>{formatHours(item.total_seconds)}</Text>
                                        <Text style={styles.chevron}>›</Text>
                                    </TouchableOpacity>
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
function BreakdownList({ items, onItemPress }: { items: BreakdownItem[] | null; onItemPress?: (label: string) => void }) {
    const { t } = useTranslation('stats');
    if (!items) {
        return <Text style={styles.empty}>—</Text>;
    }
    if (items.length === 0) {
        return <Text style={styles.empty}>{t('empty.data')}</Text>;
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
                    onPress={onItemPress ? () => onItemPress(item.label) : undefined}
                />
            ))}
        </>
    );
}

// Group divider — small caps label + hairline rule, mirrors the dashboard's section
// headers. Brighter than the per-stat sub-labels (common.label) to read as a tier above.
function SectionHeader({ label }: { label: string }) {
    return (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionRule} />
            <Text style={styles.sectionLabel}>{label}</Text>
            <View style={styles.sectionRule} />
        </View>
    );
}

// Short "↑23%" delta + trailing dot for the inline metrics row. Renders nothing when
// there's no prior window to compare (previous=0), which also covers all-time.
// Up = orange, down = muted; arrow signs it.
function DeltaMetric({ total, previous }: { total: number; previous: number }) {
    if (previous <= 0) return null;
    const delta = (total - previous) / previous;
    const up = delta >= 0;
    return (
        <>
            <Text style={[styles.metricItem, { color: up ? colors.orange : colors.text2 }]}>
                {up ? '↑' : '↓'}{Math.abs(Math.round(delta * 100))}%
            </Text>
            <Text style={styles.metricDot}>·</Text>
        </>
    );
}

// Compact stat tile (orange left rule, caps label, big orange value) — matches the
// dashboard's StatTile. Kept local for now; extract to shared if reused further.
function Tile({ label, value, unit }: { label: string; value: string; unit?: string }) {
    return (
        <View style={styles.tile}>
            <View style={styles.tileRule} />
            <View style={styles.tileBody}>
                <Text style={styles.tileLabel}>{label}</Text>
                <View style={styles.tileValueRow}>
                    <Text style={styles.tileValue}>{value}</Text>
                    {!!unit && <Text style={styles.tileUnit}>{unit}</Text>}
                </View>
            </View>
        </View>
    );
}

// 7 day-rows × 4 time-of-day buckets. Tapping a cell shows its slot + hours in a
// readout above the grid; defaults to the peak cell so it always reads something.
function Heatmap({ data }: { data: HeatmapResponse | null }) {
    const { t } = useTranslation('stats');
    const [selected, setSelected] = useState<{ dow: number; b: number } | null>(null);

    // Sum each (dow, hour) cell into its 6h bucket → 7×4 matrix.
    const grid: number[][] = Array.from({ length: 7 }, () => [0, 0, 0, 0]);
    if (data) {
        for (const c of data.cells) {
            grid[c.dow][Math.floor(c.hour / 6)] += c.seconds;
        }
    }
    let max = 0;
    let peak = { dow: 0, b: 0 };
    for (let d = 0; d < 7; d++) {
        for (let b = 0; b < 4; b++) {
            if (grid[d][b] > max) { max = grid[d][b]; peak = { dow: d, b }; }
        }
    }

    if (!data || max === 0) {
        return <Text style={styles.empty}>{t('empty.data')}</Text>;
    }

    const sel = selected ?? peak;

    return (
        <View style={styles.heatmap}>
            <View style={styles.heatReadout}>
                <Text style={styles.heatReadoutSlot} numberOfLines={1}>
                    {t(`dow.full.${sel.dow}`)} · {t(`heat.${HEAT_BUCKETS[sel.b].key}`)}
                </Text>
                <Text style={styles.heatReadoutValue}>{formatHours(grid[sel.dow][sel.b])}</Text>
            </View>
            <View style={styles.heatHeaderRow}>
                <View style={styles.heatDowSpacer} />
                <View style={styles.heatCells}>
                    {HEAT_BUCKETS.map(bk => (
                        <View key={bk.key} style={styles.heatColIcon}>
                            <bk.Icon color={colors.text2} size={16} />
                        </View>
                    ))}
                </View>
            </View>
            {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
                <View key={dow} style={styles.heatRow}>
                    <Text style={styles.heatDow}>{t(`dow.short.${dow}`)}</Text>
                    <View style={styles.heatCells}>
                        {HEAT_BUCKETS.map((bk, b) => {
                            const seconds = grid[dow][b];
                            const intensity = seconds / max;
                            const isSel = sel.dow === dow && sel.b === b;
                            return (
                                <TouchableOpacity
                                    key={bk.key}
                                    activeOpacity={0.8}
                                    onPress={() => setSelected({ dow, b })}
                                    style={[
                                        styles.heatCell,
                                        { backgroundColor: seconds === 0 ? colors.bg3 : `rgba(255, 122, 26, ${0.15 + intensity * 0.85})` },
                                        isSel && styles.heatCellSelected,
                                    ]}
                                />
                            );
                        })}
                    </View>
                </View>
            ))}
        </View>
    );
}

// Card width = screen - screen padding (20*2) - card padding (16*2). Computed
// once from Dimensions; this app doesn't support rotation.
const TREND_W = Dimensions.get('window').width - 40 - 32;
const TREND_H = 140;
// Insets so peaks/markers and the end points get room instead of touching the edges.
const TREND_PAD_TOP = 14;
const TREND_PAD_BOTTOM = 10;
const TREND_PAD_X = 10;
const TREND_BASE = TREND_H - TREND_PAD_BOTTOM;          // y of the zero line
const TREND_PLOT = TREND_H - TREND_PAD_TOP - TREND_PAD_BOTTOM;
const TREND_PLOT_W = TREND_W - TREND_PAD_X * 2;         // usable horizontal range

const TREND_MIN_SPACING = 30; // px between points; below this we scroll instead of crowd

// bucket_start → axis label per granularity: day "DD.MM", week "DD.MM–DD.MM", month via Intl.
function formatBucket(granularity: TrendGranularity, iso: string) {
    const d = new Date(iso);
    const locale = intlLocale(i18n.language);
    const f = (x: Date) => `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}`;
    if (granularity === 'day') return f(d);
    if (granularity === 'week') {
        const end = new Date(d);
        end.setDate(d.getDate() + 6);
        return `${f(d)}–${f(end)}`;
    }
    return d.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
}

function TrendLine({ buckets, granularity, max }: { buckets: TrendBucket[]; granularity: TrendGranularity; max: number }) {
    const [selected, setSelected] = useState<number | null>(null);
    const scrollRef = useRef<ScrollView>(null);

    const n = buckets.length;
    // Fill the card when points are few; drop to a min spacing (overflow → scroll) when many.
    const fitSpacing = n > 1 ? TREND_PLOT_W / (n - 1) : 0;
    const spacing = Math.max(TREND_MIN_SPACING, fitSpacing);
    const chartW = Math.max(TREND_W, TREND_PAD_X * 2 + (n - 1) * spacing);

    // Land on the most recent bucket first.
    useEffect(() => {
        scrollRef.current?.scrollToEnd({ animated: false });
    }, [chartW]);

    if (n === 0 || max === 0) return null;

    const points = buckets.map((b, i) => ({
        x: TREND_PAD_X + i * spacing,
        y: TREND_PAD_TOP + (1 - b.total_seconds / max) * TREND_PLOT,
    }));
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

    const sel = selected ?? n - 1;
    const selBucket = buckets[sel];
    const selPoint = points[sel];

    return (
        <View>
            <View style={styles.trendReadout}>
                <Text style={styles.trendReadoutDate}>{formatBucket(granularity, selBucket.bucket_start)}</Text>
                <Text style={styles.trendReadoutValue}>{formatHours(selBucket.total_seconds)}</Text>
            </View>
            <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} style={{ width: TREND_W }}>
                <Svg width={chartW} height={TREND_H}>
                    {/* Neon glow: stacked strokes — wide+faint halo underneath, bright core,
                        then a near-white hot inner line on top. (RN-svg has no blur filter.) */}
                    <Path d={linePath} stroke={colors.orange} strokeWidth={10} opacity={0.07} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                    <Path d={linePath} stroke={colors.orange} strokeWidth={6} opacity={0.13} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                    <Path d={linePath} stroke={colors.orange} strokeWidth={3.5} opacity={0.35} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                    <Path d={linePath} stroke={colors.orange} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                    <Path d={linePath} stroke="#ffd9b3" strokeWidth={1} opacity={0.9} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                    <Line
                        x1={selPoint.x} y1={0} x2={selPoint.x} y2={TREND_BASE}
                        stroke={colors.orange} strokeWidth={1} strokeDasharray="2 3" opacity={0.5}
                    />
                    {/* selected node gets an orange glow halo so it pops */}
                    <Circle cx={selPoint.x} cy={selPoint.y} r={8} fill={colors.orange} opacity={0.3} />
                    {/* lit nodes: bright near-white dots on the orange line */}
                    {points.map((p, i) => (
                        <Circle key={`pt${i}`} cx={p.x} cy={p.y} r={i === sel ? 3.5 : 2} fill="#ffe2c2" />
                    ))}
                    {/* Full-column tap targets so the whole width selects, not just the dot. */}
                    {points.map((p, i) => (
                        <Rect
                            key={`hit-${i}`}
                            x={p.x - spacing / 2} y={0} width={spacing} height={TREND_H}
                            fill="transparent"
                            onPress={() => setSelected(i)}
                        />
                    ))}
                </Svg>
            </ScrollView>
        </View>
    );
}

function BreakdownBar({ label, seconds, max, onPress }: { label: string; seconds: number; max: number; onPress?: () => void }) {
    const widthPct = max > 0 ? (seconds / max) * 100 : 0;
    const body = (
        <View style={styles.breakdown}>
            <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownLabel} numberOfLines={1}>{label}</Text>
                <View style={styles.breakdownRight}>
                    <Text style={styles.breakdownValue}>{formatHoursShort(seconds)}</Text>
                    {onPress && <Text style={styles.chevron}>›</Text>}
                </View>
            </View>
            <View style={styles.breakdownTrack}>
                <View style={[styles.breakdownFill, { width: `${widthPct}%` }]} />
            </View>
        </View>
    );
    return onPress ? <TouchableOpacity activeOpacity={0.7} onPress={onPress}>{body}</TouchableOpacity> : body;
}

// Thick colored bar with the tag name set on the fill. Short fills leave the name
// over the dark track, so the text carries a dark halo to stay legible either way.
function TagBar({ label, seconds, max, color, onPress }: { label: string; seconds: number; max: number; color: string; onPress?: () => void }) {
    // Floor at a sliver so a tiny tag still shows a colored stub under its name.
    const widthPct = max > 0 ? Math.max((seconds / max) * 100, 8) : 0;
    const body = (
        <View style={styles.tagTrack}>
            <View style={[styles.tagFill, { width: `${widthPct}%`, backgroundColor: color }]} />
            <View style={styles.tagOverlay}>
                <Text style={styles.tagLabel} numberOfLines={1}>{label}</Text>
                <View style={styles.tagRight}>
                    <Text style={styles.tagValue}>{formatHoursShort(seconds)}</Text>
                    {onPress && <Text style={styles.tagChevron}>›</Text>}
                </View>
            </View>
        </View>
    );
    return onPress ? <TouchableOpacity activeOpacity={0.8} onPress={onPress}>{body}</TouchableOpacity> : body;
}

function ShowMoreToggle({ expanded, onPress }: { expanded: boolean; onPress: () => void }) {
    const { t } = useTranslation('stats');
    return (
        <TouchableOpacity style={styles.showMore} onPress={onPress} activeOpacity={0.7}>
            <Text style={styles.showMoreText}>{expanded ? t('showLess') : t('showMore')}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    header: { paddingTop: 0, paddingBottom: 20 },

    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        marginTop: 28, marginBottom: 8,
    },
    sectionLabel: {
        fontFamily: displayFont.bold, fontSize: 13, letterSpacing: 2, color: colors.text,
        paddingLeft: 2, // offset letterSpacing's trailing space so the glyphs truly center
    },
    sectionRule: { flex: 1, height: 1, backgroundColor: colors.text },

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

    totalCard: {
        flexDirection: 'row',
        backgroundColor: colors.bg2, borderRadius: 4,
        borderWidth: 1, borderColor: colors.borderBright,
        overflow: 'hidden',
    },
    totalRule: { width: 3, backgroundColor: colors.orange, opacity: 0.7 },
    totalBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
    totalLabel: {
        fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 2, color: colors.text3,
        marginBottom: 6,
    },
    totalValue: {
        fontFamily: displayFont.bold, fontSize: 44, letterSpacing: -1,
        color: colors.orange,
    },
    totalMeta: {
        flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline',
        gap: 6, marginTop: 8,
    },
    totalSub: { fontFamily: bodyFont.regular, fontSize: 13, color: colors.text3 },
    metricItem: { fontFamily: bodyFont.medium, fontSize: 13, color: colors.text },
    metricDot: { fontFamily: bodyFont.medium, fontSize: 13, color: colors.text3 },

    tilesRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    tile: {
        flex: 1, flexDirection: 'row',
        backgroundColor: colors.bg2, borderRadius: 4,
        borderWidth: 1, borderColor: colors.border,
        overflow: 'hidden',
    },
    tileRule: { width: 3, backgroundColor: colors.orange, opacity: 0.7 },
    tileBody: { flex: 1, paddingHorizontal: 10, paddingVertical: 10 },
    tileLabel: {
        fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 2, color: colors.text3,
        marginBottom: 6,
    },
    tileValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
    tileValue: {
        fontFamily: displayFont.bold, fontSize: 32, letterSpacing: -1, color: colors.orange, lineHeight: 34,
    },
    tileUnit: { fontFamily: displayFont.regular, fontSize: 14, color: colors.text3 },

    recordCard: {
        marginTop: 16,
        backgroundColor: colors.bg2, borderRadius: 4, overflow: 'hidden',
        borderWidth: 1, borderColor: colors.borderBright,
    },
    recordRow: { flexDirection: 'row' },
    recordCoverWrap: { alignSelf: 'stretch', aspectRatio: 264 / 362, backgroundColor: colors.bg3 },
    recordCover: { width: '100%', height: '100%' },
    recordMeta: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 4, justifyContent: 'center' },
    recordLabel: {
        fontFamily: displayFont.bold, fontSize: 9, letterSpacing: 2, color: colors.orange,
    },
    recordGame: {
        fontFamily: displayFont.bold, fontSize: 15, color: colors.text, lineHeight: 18,
    },
    recordValue: {
        fontFamily: displayFont.bold, fontSize: 22, letterSpacing: 1, color: colors.orange,
        marginTop: 2,
    },

    heatmap: {
        backgroundColor: colors.bg2,
        borderWidth: 1, borderColor: colors.borderBright,
        borderRadius: 4,
        padding: 10,
    },
    heatReadout: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 12,
    },
    heatReadoutSlot: {
        flex: 1, fontFamily: displayFont.bold, fontSize: 12, letterSpacing: 1,
        color: colors.text2,
    },
    heatReadoutValue: {
        fontFamily: displayFont.bold, fontSize: 16, letterSpacing: -0.3,
        color: colors.orange, marginLeft: 8,
    },
    heatHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    heatDowSpacer: { width: 26 },
    heatColIcon: { flex: 1, alignItems: 'center' },
    heatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    heatDow: {
        width: 26,
        fontFamily: displayFont.bold, fontSize: 9, letterSpacing: 1,
        color: colors.text3,
    },
    heatCells: { flex: 1, flexDirection: 'row', gap: 3 },
    heatCell: { flex: 1, height: 28, borderRadius: 2 },
    heatCellSelected: { borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.9)' },

    trend: {
        backgroundColor: colors.bg2,
        borderWidth: 1, borderColor: colors.borderBright,
        borderRadius: 4,
        padding: 16,
    },
    trendReadout: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 8,
    },
    trendReadoutDate: {
        fontFamily: displayFont.bold, fontSize: 12, letterSpacing: 1, color: colors.text2,
    },
    trendReadoutValue: {
        fontFamily: displayFont.bold, fontSize: 16, letterSpacing: -0.3, color: colors.orange,
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
    breakdownRight: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    chevron: { fontFamily: displayFont.bold, fontSize: 14, color: colors.text3 },

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
        fontFamily: bodyFont.medium, fontSize: 12, color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 3,
    },
    tagRight: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
    tagChevron: { fontFamily: displayFont.bold, fontSize: 15, color: '#fff', opacity: 0.85 },

    empty: { fontFamily: bodyFont.regular, fontSize: 14, color: colors.text3, marginTop: 8 },
    errorWrap: { marginTop: 16 },
});
