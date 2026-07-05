import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getGames } from '../api/games';
import { Game, GameSort } from '../types/api';
import { useGamesStore } from '../store/gamesStore';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';
import Cover from '../components/Cover';
import ErrorBanner from '../components/ErrorBanner';

const PAGE_SIZE = 20;
const SORTS: { key: GameSort; label: string }[] = [
    { key: 'name', label: 'NAZWA' },
    { key: 'playtime', label: 'CZAS GRY' },
    { key: 'last_played', label: 'OSTATNIO GRANE' },
];
const GRID_COLUMNS = 2;
const GRID_PADDING = 14;
const CELL_MARGIN = 6;
const CELL_PADDING = 6;
const SCREEN_W = Dimensions.get('window').width;
const CELL_OUTER = (SCREEN_W - GRID_PADDING * 2) / GRID_COLUMNS;
const CELL_WIDTH = CELL_OUTER - (CELL_MARGIN + CELL_PADDING) * 2;
const CELL_HEIGHT = Math.round(CELL_WIDTH * 362 / 264); // IGDB cover aspect

type Tab = 'all' | 'other';

export default function LibraryScreen() {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<Tab>('all');
    const [games, setGames] = useState<Game[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [loadError, setLoadError] = useState(false);
    const [reloadNonce, setReloadNonce] = useState(0);
    const [sort, setSort] = useState<GameSort>('name');

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

    // Fetch the first page whenever the tab/search changes (skip resets to 0), or when
    // a preference change elsewhere bumps reloadNonce
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await getGames({ skip: 0, limit: PAGE_SIZE, q: debouncedQuery || undefined, inLibrary, sort });
                if (cancelled) return;
                setGames(res.items);
                setTotal(res.total);
                setLoadError(false);
            } catch {
                if (!cancelled) setLoadError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [inLibrary, debouncedQuery, reloadNonce, sort]);

    // Refresh on focus if a game's accept/ignore state changed on another screen
    useFocusEffect(
        useCallback(() => {
            if (gamesStale) {
                markGamesFresh();
                setReloadNonce((n) => n + 1);
            }
        }, [gamesStale, markGamesFresh])
    );

    const loadMore = async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            const res = await getGames({ skip: games.length, limit: PAGE_SIZE, q: debouncedQuery || undefined, inLibrary, sort });
            setGames(prev => [...prev, ...res.items]);
            setTotal(res.total);
            setLoadError(false);
        } catch {
            setLoadError(true);
        }
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            const res = await getGames({ skip: 0, limit: PAGE_SIZE, q: debouncedQuery || undefined, inLibrary, sort });
            setGames(res.items);
            setTotal(res.total);
            setLoadError(false);
        } catch {
            setLoadError(true);
        }
        setRefreshing(false);
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.eyebrow}>◈ GAMETRACE</Text>
                    <Text style={styles.title}>Biblioteka</Text>
                </View>
                <Text style={styles.headerCount}>{total} GIER</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TabButton
                    label="MOJE GRY"
                    active={activeTab === 'all'}
                    onPress={() => setActiveTab('all')}
                />
                <TabButton
                    label="INNE"
                    active={activeTab === 'other'}
                    onPress={() => setActiveTab('other')}
                />
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
                <View style={styles.orangeBar} />
                <TextInput
                    style={styles.search}
                    placeholder="Szukaj gry..."
                    placeholderTextColor={colors.text3}
                    value={query}
                    onChangeText={setQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            {/* Sort */}
            <View style={styles.sortRow}>
                {SORTS.map(({ key, label }) => {
                    const active = sort === key;
                    return (
                        <TouchableOpacity
                            key={key}
                            style={[styles.sortPill, active && styles.sortPillActive]}
                            onPress={() => setSort(key)}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.sortPillText, active && styles.sortPillTextActive]}>{label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {loadError && (
                <View style={styles.errorWrap}>
                    <ErrorBanner />
                </View>
            )}

            <FlatList
                data={games}
                keyExtractor={(item) => item.id.toString()}
                numColumns={GRID_COLUMNS}
                contentContainerStyle={styles.gridContent}
                columnWrapperStyle={styles.gridRow}
                ListEmptyComponent={
                    !loading ? (
                        <Text style={styles.emptyText}>
                            {activeTab === 'other' ? 'Brak gier poza biblioteką' : 'Brak gier do wyświetlenia'}
                        </Text>
                    ) : null
                }
                renderItem={({ item }) => {
                    const needsReview = item.enrichment_status === 'NEEDS_REVIEW' && item.is_accepted !== true && !item.is_ignored;
                    return (
                        <TouchableOpacity
                            activeOpacity={0.85}
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
                            <View style={styles.coverWrap}>
                                <Cover
                                    gameId={item.id}
                                    fallbackUri={item.cover_image_url}
                                    style={styles.cover}
                                    placeholderChar={item.primary_name[0]}
                                />
                                {needsReview && (
                                    <View style={styles.reviewBadge}>
                                        <Text style={styles.reviewBadgeText}>⚠</Text>
                                    </View>
                                )}
                                {item.is_ignored && (
                                    <View style={styles.ignoredBadge}>
                                        <Text style={styles.ignoredBadgeText}>UKRYTE</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.cellName} numberOfLines={2}>{item.primary_name}</Text>
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
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
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
    coverWrap: { width: CELL_WIDTH, height: CELL_HEIGHT, position: 'relative' },
    cover: { width: CELL_WIDTH, height: CELL_HEIGHT, borderRadius: 3, backgroundColor: colors.bg3 },
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
        marginTop: 8, fontSize: 12, width: CELL_WIDTH,
        fontFamily: bodyFont.medium, color: colors.text, textAlign: 'center',
    },

    emptyText: {
        textAlign: 'center', paddingVertical: 32,
        fontFamily: bodyFont.regular, fontSize: 12, color: colors.text3,
    },

    errorWrap: { marginHorizontal: 20, marginTop: 4, marginBottom: 4 },
});
