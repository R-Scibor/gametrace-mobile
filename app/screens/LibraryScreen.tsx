import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Image, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getGames, getNeedsReviewGames } from '../api/games';
import { Game } from '../types/api';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';

const PAGE_SIZE = 20;
const GRID_COLUMNS = 2;
const GRID_PADDING = 14;
const CELL_MARGIN = 6;
const CELL_PADDING = 6;
const SCREEN_W = Dimensions.get('window').width;
const CELL_OUTER = (SCREEN_W - GRID_PADDING * 2) / GRID_COLUMNS;
const CELL_WIDTH = CELL_OUTER - (CELL_MARGIN + CELL_PADDING) * 2;
const CELL_HEIGHT = Math.round(CELL_WIDTH * 362 / 264); // IGDB cover aspect

type Tab = 'all' | 'needs_review';

export default function LibraryScreen() {
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState<Tab>('all');
    const [allGames, setAllGames] = useState<Game[]>([]);
    const [reviewGames, setReviewGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState('');

    const loadMore = async () => {
        if (loading) return;
        setLoading(true);
        try {
            if (activeTab === 'all') {
                const data = await getGames(allGames.length, PAGE_SIZE, 'ENRICHED');
                setAllGames([...allGames, ...data]);
            } else {
                const data = await getNeedsReviewGames(reviewGames.length, PAGE_SIZE);
                setReviewGames([...reviewGames, ...data]);
            }
        } catch {
            // TODO
        }
        setLoading(false);
    };

    useEffect(() => { loadMore(); }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            if (activeTab === 'all') {
                const data = await getGames(0, PAGE_SIZE, 'ENRICHED');
                setAllGames(data);
            } else {
                const data = await getNeedsReviewGames(0, PAGE_SIZE);
                setReviewGames(data);
            }
        } catch {
            // TODO
        }
        setRefreshing(false);
    };

    const games = activeTab === 'all' ? allGames : reviewGames;
    const filtered = query.trim()
        ? games.filter(g => g.primary_name.toLowerCase().includes(query.toLowerCase()))
        : games;

    const isReview = activeTab === 'needs_review';

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.eyebrow}>◈ GAMETRACE</Text>
                    <Text style={styles.title}>Biblioteka</Text>
                </View>
                <Text style={styles.headerCount}>{filtered.length} GIER</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TabButton
                    label="WSZYSTKIE"
                    active={activeTab === 'all'}
                    onPress={() => setActiveTab('all')}
                />
                <TabButton
                    label="NIEROZPOZNANE"
                    active={activeTab === 'needs_review'}
                    onPress={() => setActiveTab('needs_review')}
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

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id.toString()}
                numColumns={GRID_COLUMNS}
                contentContainerStyle={styles.gridContent}
                columnWrapperStyle={styles.gridRow}
                ListEmptyComponent={
                    !loading ? (
                        <Text style={styles.emptyText}>
                            {isReview ? 'Brak nierozpoznanych gier' : 'Brak gier do wyświetlenia'}
                        </Text>
                    ) : null
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={[styles.cell, isReview && styles.cellReview]}
                        onPress={() => navigation.navigate('GameDetail', {
                            gameId: item.id,
                            gameName: item.primary_name,
                        })}
                    >
                        <View style={styles.coverWrap}>
                            {item.cover_image_url ? (
                                <Image source={{ uri: item.cover_image_url }} style={styles.cover} />
                            ) : (
                                <View style={[styles.cover, styles.coverPlaceholder]}>
                                    <Text style={styles.placeholderText}>{item.primary_name[0]}</Text>
                                </View>
                            )}
                            {isReview && (
                                <View style={styles.reviewBadge}>
                                    <Text style={styles.reviewBadgeText}>⚠</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.cellName} numberOfLines={2}>{item.primary_name}</Text>
                    </TouchableOpacity>
                )}
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
    tab: { paddingVertical: 10 },
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
    cellName: {
        marginTop: 8, fontSize: 12, width: CELL_WIDTH,
        fontFamily: bodyFont.medium, color: colors.text, textAlign: 'center',
    },

    emptyText: {
        textAlign: 'center', paddingVertical: 32,
        fontFamily: bodyFont.regular, fontSize: 12, color: colors.text3,
    },
});
