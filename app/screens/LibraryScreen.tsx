import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, RefreshControl, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute, RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { getGames } from '../api/games';
import { Game, GameListResponse, GameSort, LibraryFilter } from '../types/api';
import { TabParamList, RootStackParamList } from '../navigation/types';
import { useGamesStore } from '../store/gamesStore';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';
import Cover from '../components/Cover';
import ErrorBanner from '../components/ErrorBanner';
import { useCachedFetch } from '../hooks/useCachedFetch';
import StaleBanner from '../components/StaleBanner';
import SamplePreviewBanner from '../components/SamplePreviewBanner';
import { useEmptyAccountStore } from '../store/emptyAccountStore';
import { SAMPLE_GAMES } from '../utils/sampleData';

const PAGE_SIZE = 20;
const EMPTY_PAGE: GameListResponse = { total: 0, items: [] };
const SORT_KEYS: GameSort[] = ['name', 'playtime', 'last_played'];
const GRID_PADDING = 14;
const CELL_MARGIN = 6;
const CELL_PADDING = 6;
const TARGET_CELL_WIDTH = 190; // desired outer cell width; column count derived from it

// Pure grid math: derive column count + cover size from the live window width so
// the grid tracks phone size / orientation instead of a stale module constant.
export function computeGrid(width: number) {
    const available = width - GRID_PADDING * 2;
    const columns = Math.max(2, Math.floor(available / TARGET_CELL_WIDTH));
    const cellOuter = available / columns;
    const cellWidth = cellOuter - (CELL_MARGIN + CELL_PADDING) * 2;
    const cellHeight = Math.round(cellWidth * 362 / 264); // IGDB cover aspect
    return { columns, cellWidth, cellHeight };
}

type Tab = 'all' | 'other';

type LibraryNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'Library'>,
    NativeStackNavigationProp<RootStackParamList>
>;

export default function LibraryScreen() {
    const navigation = useNavigation<LibraryNavigationProp>();
    const route = useRoute<RouteProp<TabParamList, 'Library'>>();
    const { t } = useTranslation('library');
    const { width } = useWindowDimensions();
    const grid = computeGrid(width);
    const [activeTab, setActiveTab] = useState<Tab>('all');
    const [games, setGames] = useState<Game[]>([]);
    const [total, setTotal] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [sort, setSort] = useState<GameSort>('name');
    const [filter, setFilter] = useState<LibraryFilter | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [paginationError, setPaginationError] = useState(false);
    const isEmpty = useEmptyAccountStore((s) => s.isEmpty);
    const [sampleDismissed, setSampleDismissed] = useState(false);

    const gamesStale = useGamesStore((s) => s.stale);
    const markGamesFresh = useGamesStore((s) => s.markFresh);

    // "Inne" = everything not in the main library (ignored + unaccepted NEEDS_REVIEW stubs)
    const inLibrary = activeTab === 'all' ? undefined : false;
    const hasMore = games.length < total;

    // Debounce the search box before hitting the server
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
        return () => clearTimeout(t);
    }, [query]);

    // Every input that changes the response is in the key; user text is escaped
    // so a q containing "&"/"=" can't collide with another combination.
    const feature = `library:tab=${activeTab}&sort=${sort}&q=${encodeURIComponent(debouncedQuery)}&filter=${filter ? encodeURIComponent(`${filter.type}:${filter.value}`) : ''}`;

    const {
        data: page0Data, isLoading: page0Loading, isStale: page0Stale,
        lastSyncTime: page0SyncTime, error: page0Error, refetch: refetchPage0,
    } = useCachedFetch<GameListResponse>(
        feature,
        () => getGames({ skip: 0, limit: PAGE_SIZE, q: debouncedQuery || undefined, inLibrary, sort, filter: filter ?? undefined }),
        { initialData: EMPTY_PAGE, onSuccess: markGamesFresh },
    );

    // Page 0 lives in the cache hook; mirror it into the visible list. Any
    // successful page-0 refetch resets appended pages (old reloadNonce behavior).
    useEffect(() => {
        const page = page0Data ?? EMPTY_PAGE;
        setGames(page.items);
        setTotal(page.total);
    }, [page0Data]);

    // The store flag means "no COMPLETED session", which is not the same as "no
    // games" — an account can hold bot-created or unaccepted stubs. The local
    // emptiness check is what stops the preview covering those real cells.
    const preview = isEmpty === true
        && activeTab === 'all'
        && !debouncedQuery
        && filter == null
        && !page0Loading
        && games.length === 0
        && !sampleDismissed;

    // Refresh page 0 on focus if a game's accept/ignore state changed elsewhere.
    useFocusEffect(
        useCallback(() => {
            if (gamesStale) {
                refetchPage0();
            }
        }, [gamesStale, refetchPage0])
    );

    // Drill-down intake: apply an incoming facet once (forcing playtime sort), then
    // clear the route param so it doesn't re-apply on a later plain re-focus.
    // No cleanup here — see the separate reset effect below. (A cleanup here would
    // fire when setParams changes this callback's identity, wiping the filter we
    // just applied.)
    useFocusEffect(
        useCallback(() => {
            const incoming = route.params?.filter;
            if (incoming) {
                setFilter(incoming);
                setSort('playtime');
                navigation.setParams({ filter: undefined });
            }
        }, [route.params?.filter, navigation])
    );

    // Ephemeral filter reset: stable deps → this callback's identity never changes,
    // so its cleanup runs only on a real blur/unmount, clearing the drill-down filter.
    // Sort is intentionally NOT reset here — a user-chosen (or drill-forced) sort
    // persists across leaving and returning to the Library.
    useFocusEffect(
        useCallback(() => () => {
            setFilter(null);
        }, [])
    );

    const loadMore = async () => {
        if (loadingMore || page0Loading || !hasMore) return;
        setLoadingMore(true);
        try {
            const res = await getGames({ skip: games.length, limit: PAGE_SIZE, q: debouncedQuery || undefined, inLibrary, sort, filter: filter ?? undefined });
            setGames(prev => [...prev, ...res.items]);
            setTotal(res.total);
            setPaginationError(false);
        } catch {
            setPaginationError(true);
        }
        setLoadingMore(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await refetchPage0();
        setRefreshing(false);
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.eyebrow}>◈ GAMETRACE</Text>
                    <Text style={styles.title}>{t('title')}</Text>
                </View>
                <Text style={styles.headerCount}>
                    {t('gameCount', { count: preview ? SAMPLE_GAMES.length : total })}
                </Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TabButton
                    label={t('tabs.mine')}
                    active={activeTab === 'all'}
                    onPress={() => setActiveTab('all')}
                />
                <TabButton
                    label={t('tabs.other')}
                    active={activeTab === 'other'}
                    onPress={() => setActiveTab('other')}
                />
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
                <View style={styles.orangeBar} />
                <TextInput
                    style={styles.search}
                    placeholder={t('searchPlaceholder')}
                    placeholderTextColor={colors.text3}
                    value={query}
                    onChangeText={setQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            {filter && (
                <View style={styles.chipRow}>
                    <View style={styles.chip}>
                        <Text style={styles.chipText} numberOfLines={1}>
                            {t(`filter.${filter.type}`)}: {filter.value}
                        </Text>
                        <TouchableOpacity onPress={() => setFilter(null)} hitSlop={8} accessibilityLabel={t('filter.clearAria')}>
                            <Text style={styles.chipClear}>✕</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Sort */}
            <View style={styles.sortRow}>
                {SORT_KEYS.map((key) => {
                    const active = sort === key;
                    return (
                        <TouchableOpacity
                            key={key}
                            style={[styles.sortPill, active && styles.sortPillActive]}
                            onPress={() => setSort(key)}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.sortPillText, active && styles.sortPillTextActive]}>
                                {t(`sort.${key}`)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {!preview && page0Stale && page0SyncTime != null && (
                <View style={styles.errorWrap}>
                    <StaleBanner lastSyncTime={page0SyncTime} />
                </View>
            )}
            {!preview && (page0Error != null || paginationError) && (
                <View style={styles.errorWrap}>
                    <ErrorBanner />
                </View>
            )}
            {preview && (
                <View style={styles.errorWrap}>
                    <SamplePreviewBanner
                        onDismiss={() => setSampleDismissed(true)}
                        onAddSession={() => navigation.navigate('Main', { screen: 'AddSession' })}
                    />
                </View>
            )}

            <FlatList
                data={preview ? SAMPLE_GAMES : games}
                key={grid.columns}
                keyExtractor={(item) => item.id.toString()}
                numColumns={grid.columns}
                contentContainerStyle={styles.gridContent}
                columnWrapperStyle={styles.gridRow}
                ListEmptyComponent={
                    !page0Loading ? (
                        <Text style={styles.emptyText}>
                            {activeTab === 'other' ? t('empty.other') : t('empty.default')}
                        </Text>
                    ) : null
                }
                renderItem={({ item }) => {
                    const needsReview = item.enrichment_status === 'NEEDS_REVIEW' && item.is_accepted !== true && !item.is_ignored;
                    return (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            disabled={preview}
                            style={[styles.cell, needsReview && styles.cellReview, item.is_ignored && styles.cellIgnored]}
                            onPress={() => navigation.navigate('GameDetail', {
                                gameId: item.id,
                                gameName: item.primary_name,
                                coverImageUrl: item.cover_image_url,
                                enrichmentStatus: item.enrichment_status,
                                isAccepted: item.is_accepted,
                                isIgnored: item.is_ignored,
                            })}
                        >
                            <View style={[styles.coverWrap, { width: grid.cellWidth, height: grid.cellHeight }]}>
                                <Cover
                                    gameId={item.id}
                                    fallbackUri={item.cover_image_url}
                                    style={[styles.cover, { width: grid.cellWidth, height: grid.cellHeight }]}
                                    placeholderChar={item.primary_name[0]}
                                />
                                {needsReview && (
                                    <View style={styles.reviewBadge}>
                                        <Text style={styles.reviewBadgeText}>⚠</Text>
                                    </View>
                                )}
                                {item.is_ignored && (
                                    <View style={styles.ignoredBadge}>
                                        <Text style={styles.ignoredBadgeText}>{t('hidden')}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.cellName, { width: grid.cellWidth }]} numberOfLines={2}>{item.primary_name}</Text>
                        </TouchableOpacity>
                    );
                }}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.orange}
                        colors={[colors.orange]}
                    />
                }
            />
        </SafeAreaView>
    );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.tab} onPress={onPress} activeOpacity={0.7}>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
            <View style={[styles.tabRule, active && styles.tabRuleActive]} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },

    header: {
        paddingHorizontal: 20, paddingTop: 0, paddingBottom: 12,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    },
    eyebrow: {
        fontFamily: displayFont.bold, fontSize: 11, letterSpacing: 3,
        color: colors.orange, marginBottom: 4,
    },
    title: {
        fontFamily: displayFont.bold, fontSize: 22, letterSpacing: -0.5, color: colors.text,
    },
    headerCount: {
        fontFamily: displayFont.regular, fontSize: 11, letterSpacing: 1, color: colors.text3,
    },

    // Tabs
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 20,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabLabel: {
        fontFamily: displayFont.bold, fontSize: 11, letterSpacing: 2, color: colors.text3,
    },
    tabLabelActive: { color: colors.text },
    tabRule: {
        position: 'absolute', left: 0, right: 0, bottom: -1,
        height: 2, backgroundColor: 'transparent',
    },
    tabRuleActive: { backgroundColor: colors.orange },

    // Search
    searchWrap: {
        flexDirection: 'row',
        marginHorizontal: 20, marginTop: 12, marginBottom: 8,
        backgroundColor: colors.bg3,
        borderWidth: 1, borderColor: colors.borderBright,
        borderRadius: 2, overflow: 'hidden',
    },
    orangeBar: { width: 2, backgroundColor: colors.orange },
    search: {
        flex: 1, paddingHorizontal: 12, paddingVertical: 10,
        fontFamily: bodyFont.regular, fontSize: 14, color: colors.text,
    },

    // Sort
    sortRow: { flexDirection: 'row', gap: 8, marginHorizontal: 20, marginBottom: 8 },
    sortPill: {
        flex: 1,
        backgroundColor: colors.bg3,
        borderWidth: 1, borderColor: colors.borderBright,
        borderRadius: 2,
        paddingVertical: 8,
        alignItems: 'center',
    },
    sortPillActive: { backgroundColor: colors.orange, borderColor: colors.orange },
    sortPillText: {
        fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 1, color: colors.text3,
    },
    sortPillTextActive: { color: colors.buttonTextOnOrange },

    // Filter chip
    chipRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 8 },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        alignSelf: 'flex-start', maxWidth: '100%',
        backgroundColor: colors.orange,
        borderRadius: 2, paddingHorizontal: 10, paddingVertical: 6,
    },
    chipText: {
        flexShrink: 1,
        fontFamily: displayFont.bold, fontSize: 11, letterSpacing: 0.5,
        color: colors.buttonTextOnOrange,
    },
    chipClear: {
        fontFamily: displayFont.bold, fontSize: 12, color: colors.buttonTextOnOrange,
    },

    // Grid
    gridContent: { paddingHorizontal: GRID_PADDING, paddingTop: 8, paddingBottom: 24 },
    gridRow: { justifyContent: 'flex-start' },
    cell: {
        margin: CELL_MARGIN, alignItems: 'center',
        padding: CELL_PADDING, borderRadius: 4,
        borderWidth: 1, borderColor: 'transparent',
        backgroundColor: colors.bg2,
    },
    cellReview: { borderColor: colors.warnBorder, backgroundColor: colors.warnTint },
    cellIgnored: { opacity: 0.6 },
    coverWrap: { position: 'relative' },
    cover: { borderRadius: 3, backgroundColor: colors.bg3 },
    coverPlaceholder: {
        backgroundColor: colors.bg3,
        alignItems: 'center', justifyContent: 'center',
    },
    placeholderText: {
        fontFamily: displayFont.bold, fontSize: 48, color: colors.text3,
    },
    reviewBadge: {
        position: 'absolute', top: 6, right: 6,
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.warn,
        alignItems: 'center', justifyContent: 'center',
    },
    reviewBadgeText: { fontSize: 12, color: colors.warn, lineHeight: 14 },
    ignoredBadge: {
        position: 'absolute', top: 6, left: 6,
        backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
        borderRadius: 2, paddingHorizontal: 4, paddingVertical: 2,
    },
    ignoredBadgeText: { fontFamily: displayFont.bold, fontSize: 8, letterSpacing: 1, color: colors.text3 },
    cellName: {
        marginTop: 8, fontSize: 12,
        fontFamily: bodyFont.medium, color: colors.text, textAlign: 'center',
    },

    emptyText: {
        textAlign: 'center', paddingVertical: 32,
        fontFamily: bodyFont.regular, fontSize: 12, color: colors.text3,
    },

    errorWrap: { marginHorizontal: 20, marginTop: 4, marginBottom: 4 },
});
