import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import * as ImagePicker from 'expo-image-picker';
import { getGameSessions, updateGamePreference } from '../api/games';
import { Session, SessionStatus } from '../types/api';
import { useGamesStore } from '../store/gamesStore';
import { useSessionsStore } from '../store/sessionsStore';
import { useGameStats } from '../hooks/useGameStats';
import { BottomSheet, sheetStyles } from '../components/BottomSheet';
import { formatDuration } from '../utils/duration';
import { colors } from '../theme/colors';
import { bodyFont, displayFont } from '../theme/fonts';
import { common } from '../theme/styles';
import Cover from '../components/Cover';
import ErrorBanner from '../components/ErrorBanner';
import AlertSheet from '../components/AlertSheet';
import MergeCandidateSheet from '../components/MergeCandidateSheet';
import { useLocalCoversStore } from '../store/localCoversStore';
import { useCachedFetch } from '../hooks/useCachedFetch';
import StaleBanner from '../components/StaleBanner';
import i18n from '../i18n';
import { intlLocale } from '../i18n/resolve';

const COVER_WIDTH = 264;
const COVER_HEIGHT = 362;
const PAGE_SIZE = 20;
const EMPTY_SESSIONS: Session[] = [];

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(intlLocale(i18n.language), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

// The detail cover renders large (264px logical → upscaled on retina), so request a
// higher-res IGDB rendition. Steam (library_600x900) and local covers have no size
// token and are left untouched.
const upgradeIgdbCover = (url: string | null): string | null =>
    url && url.includes('igdb.com') ? url.replace(/\/t_[a-z0-9_]+\//, '/t_1080p/') : url;

export default function GameDetailScreen() {
    const route = useRoute<RouteProp<RootStackParamList, 'GameDetail'>>();
    const navigation = useNavigation();
    const { t } = useTranslation('gameDetail');
    const { gameId, gameName, coverImageUrl, enrichmentStatus, isAccepted: initialAccepted, isIgnored: initialIgnored } = route.params;

    const statusLabel = (status: SessionStatus): string | null => {
        if (status === 'ONGOING') return t('status.ongoing');
        if (status === 'ERROR') return t('status.error');
        return null;
    };

    const [sessions, setSessions] = useState<Session[]>([]);
    const [loadingMore, setLoadingMore] = useState(false);
    const [paginationError, setPaginationError] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [isIgnored, setIsIgnored] = useState(initialIgnored ?? false);
    const [isAccepted, setIsAccepted] = useState<boolean | null>(initialAccepted ?? null);
    const [gameMenu, setGameMenu] = useState(false);
    const [dupSheet, setDupSheet] = useState(false);
    const [prefBusy, setPrefBusy] = useState(false);
    const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);
    const invalidateGames = useGamesStore((s) => s.invalidate);
    const sessionsStale = useSessionsStore((s) => s.stale);
    const markSessionsFresh = useSessionsStore((s) => s.markFresh);

    const {
        data: sessionsPage, isLoading: sessionsLoading, isStale: sessionsIsStale,
        lastSyncTime: sessionsSyncTime, error: sessionsError, refetch: refetchSessions,
    } = useCachedFetch<Session[]>(
        `game-sessions-${gameId}`,
        () => getGameSessions(gameId, 0, PAGE_SIZE),
        { initialData: EMPTY_SESSIONS, onSuccess: markSessionsFresh, enabled: gameId != null },
    );

    // Page 0 lives in the cache hook; mirror it into the visible list. Any
    // successful page-0 refetch resets appended pages (same as the old reload()).
    useEffect(() => {
        const page = sessionsPage ?? EMPTY_SESSIONS;
        setSessions(page);
        setHasMore(page.length === PAGE_SIZE);
    }, [sessionsPage]);

    const canAccept = enrichmentStatus === 'NEEDS_REVIEW' && isAccepted !== true;

    const applyPref = async (
        pref: { is_ignored?: boolean; is_accepted?: boolean },
        apply: () => void,
    ) => {
        if (prefBusy) return;
        setPrefBusy(true);
        try {
            await updateGamePreference(gameId, pref);
            apply();
            invalidateGames();
            setGameMenu(false);
        } catch {
            setAlert({ title: t('alerts.errorTitle'), message: t('alerts.prefSaveFailed') });
        } finally {
            setPrefBusy(false);
        }
    };

    const handleAccept = () => applyPref({ is_ignored: false, is_accepted: true }, () => {
        setIsAccepted(true);
        setIsIgnored(false);
    });
    const handleIgnore = () => applyPref({ is_ignored: true }, () => setIsIgnored(true));
    const handleRestore = () => applyPref({ is_ignored: false }, () => setIsIgnored(false));

    const loadMore = async () => {
        if (loadingMore || sessionsLoading || !hasMore) return;
        setLoadingMore(true);
        try {
            const page = await getGameSessions(gameId, sessions.length, PAGE_SIZE);
            setSessions(prev => [...prev, ...page]);
            if (page.length < PAGE_SIZE) setHasMore(false);
            setPaginationError(false);
        } catch {
            setPaginationError(true);
        }
        setLoadingMore(false);
    };

    const {
        data: stats, isStale: statsIsStale, lastSyncTime: statsSyncTime, refresh: refreshStats,
    } = useGameStats(gameId);
    const totalSeconds = stats?.total_seconds ?? 0;
    const sessionCount = stats?.session_count ?? 0;
    const avgSeconds = sessionCount ? Math.round(totalSeconds / sessionCount) : 0;
    const cover = upgradeIgdbCover(sessions[0]?.game?.cover_image_url ?? coverImageUrl ?? null);

    // Reload page 0 of sessions + stats together
    const reload = useCallback(async () => {
        await Promise.all([refetchSessions(), refreshStats()]);
    }, [refetchSessions, refreshStats]);

    const onRefresh = async () => {
        setRefreshing(true);
        await reload();
        setRefreshing(false);
    };

    // Refetch when returning after a session was edited/discarded elsewhere.
    // Fresh is marked on network success — a failed reload retries next focus.
    useFocusEffect(
        useCallback(() => {
            if (sessionsStale) {
                reload();
            }
        }, [sessionsStale, reload])
    );

    const localCover = useLocalCoversStore((s) => s.covers[gameId]);
    const setLocalCover = useLocalCoversStore((s) => s.setCover);
    const clearLocalCover = useLocalCoversStore((s) => s.clearCover);

    const pickPhoto = async () => {
        try {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
                setAlert({ title: t('alerts.noPermissionTitle'), message: t('alerts.noPermissionMessage') });
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                quality: 0.7,
                allowsEditing: true,
                aspect: [264, 362],
            });
            if (result.canceled || !result.assets?.[0]) return;
            await setLocalCover(gameId, result.assets[0].uri);
        } catch {
            setAlert({ title: t('alerts.errorTitle'), message: t('alerts.photoSaveFailed') });
        }
    };

    const handleChangeCover = () => {
        setGameMenu(false);
        pickPhoto();
    };

    const handleRestoreCover = () => {
        setGameMenu(false);
        clearLocalCover(gameId);
    };

    const staleSyncTimes = [
        sessionsIsStale ? sessionsSyncTime : null,
        statsIsStale ? statsSyncTime : null,
    ].filter((t): t is number => t != null);

    const header = (
        <View style={styles.headerWrap}>
            <View style={[common.headerTop, styles.headerTopRow]}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
                    <Text style={common.back}>{t('back')}</Text>
                </TouchableOpacity>
                <Text style={common.eyebrow}>◈ GAMETRACE</Text>
            </View>
            <View style={styles.titleRow}>
                <Text style={common.title}>{t('title')}</Text>
                <TouchableOpacity style={styles.menuButton} onPress={() => setGameMenu(true)} hitSlop={12}>
                    <Text style={styles.menuDots}>⋯</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.coverWrap}>
                <View style={styles.coverFrame}>
                    <Cover
                        gameId={gameId}
                        fallbackUri={cover}
                        style={styles.cover}
                        placeholderStyle={styles.coverPlaceholder}
                        placeholderTextStyle={styles.placeholderText}
                        placeholderChar={gameName?.[0]}
                    />
                </View>
            </View>

            <Text style={styles.gameTitle} numberOfLines={2}>{gameName}</Text>

            {(isAccepted === true || isIgnored) && (
                <View style={styles.tagsRow}>
                    {isAccepted === true && <Text style={[styles.tag, styles.tagAccepted]}>{t('accepted')}</Text>}
                    {isIgnored && <Text style={[styles.tag, styles.tagIgnored]}>{t('ignored')}</Text>}
                </View>
            )}

            <View style={styles.statsRow}>
                <View style={styles.statCell}>
                    <Text style={styles.statValue}>{sessionCount}</Text>
                    <Text style={styles.statLabel}>{t('stats.sessions')}</Text>
                </View>
                <View style={styles.statCellMid}>
                    <Text style={styles.statValue}>{formatDuration(totalSeconds)}</Text>
                    <Text style={styles.statLabel}>{t('stats.total')}</Text>
                </View>
                <View style={styles.statCell}>
                    <Text style={styles.statValue}>{formatDuration(avgSeconds)}</Text>
                    <Text style={styles.statLabel}>{t('stats.average')}</Text>
                </View>
            </View>

            <Text style={[common.label, styles.historyLabel]}>{t('history')}</Text>
            {staleSyncTimes.length > 0 && (
                <StaleBanner lastSyncTime={Math.min(...staleSyncTimes)} style={styles.errorWrap} />
            )}
            {(sessionsError != null || paginationError) && (
                <ErrorBanner message={t('sessionsLoadError')} style={styles.errorWrap} />
            )}
        </View>
    );

    return (
        <SafeAreaView style={common.safe} edges={['top']}>
            <FlatList
                data={sessions}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={header}
                contentContainerStyle={styles.listContent}
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
                renderItem={({ item }) => {
                    const label = statusLabel(item.status);
                    const duration = formatDuration(item.duration_seconds);
                    return (
                        <TouchableOpacity
                            style={styles.sessionRow}
                            onPress={() => navigation.navigate('EditSession', { sessionId: item.id, status: item.status })}
                            activeOpacity={0.7}
                        >
                            <View style={styles.sessionTop}>
                                <Text style={styles.sessionDate}>{formatDate(item.start_time)}</Text>
                                <Text style={styles.sessionDuration}>{duration}</Text>
                            </View>
                            {label && (
                                <Text style={[
                                    styles.sessionStatus,
                                    item.status === 'ERROR' && styles.sessionStatusError,
                                ]}>
                                    {label}
                                </Text>
                            )}
                            {item.notes && <Text style={styles.sessionNotes} numberOfLines={2}>{item.notes}</Text>}
                        </TouchableOpacity>
                    );
                }}
            />

            <BottomSheet visible={gameMenu} onClose={() => setGameMenu(false)} title={t('menu.title')}>
                {canAccept && (
                    <TouchableOpacity style={sheetStyles.row} onPress={handleAccept} activeOpacity={0.7} disabled={prefBusy}>
                        <Text style={sheetStyles.rowText}>{t('menu.accept')}</Text>
                        <Text style={sheetStyles.rowDesc}>{t('menu.acceptDesc')}</Text>
                    </TouchableOpacity>
                )}
                {isIgnored ? (
                    <TouchableOpacity style={sheetStyles.row} onPress={handleRestore} activeOpacity={0.7} disabled={prefBusy}>
                        <Text style={sheetStyles.rowText}>{t('menu.restore')}</Text>
                        <Text style={sheetStyles.rowDesc}>{t('menu.restoreDesc')}</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={sheetStyles.row} onPress={handleIgnore} activeOpacity={0.7} disabled={prefBusy}>
                        <Text style={[sheetStyles.rowText, sheetStyles.rowWarn]}>{t('menu.ignore')}</Text>
                        <Text style={sheetStyles.rowDesc}>{t('menu.ignoreDesc')}</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={sheetStyles.row} onPress={handleChangeCover} activeOpacity={0.7}>
                    <Text style={sheetStyles.rowText}>{t('menu.changeCover')}</Text>
                    <Text style={sheetStyles.rowDesc}>{t('menu.changeCoverDesc')}</Text>
                </TouchableOpacity>
                {localCover && (
                    <TouchableOpacity style={sheetStyles.row} onPress={handleRestoreCover} activeOpacity={0.7}>
                        <Text style={sheetStyles.rowText}>{cover ? t('menu.restoreCover') : t('menu.removeCover')}</Text>
                        <Text style={sheetStyles.rowDesc}>{cover ? t('menu.restoreCoverDesc') : t('menu.removeCoverDesc')}</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={sheetStyles.row}
                    onPress={() => {
                        setGameMenu(false);
                        setDupSheet(true);
                    }}
                    activeOpacity={0.7}
                >
                    <Text style={sheetStyles.rowText}>{t('menu.reportDuplicate')}</Text>
                    <Text style={sheetStyles.rowDesc}>{t('menu.reportDuplicateDesc')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[sheetStyles.row, sheetStyles.rowLast]} onPress={() => setGameMenu(false)} activeOpacity={0.7}>
                    <Text style={[sheetStyles.rowText, sheetStyles.rowMuted]}>{t('menu.cancel')}</Text>
                </TouchableOpacity>
            </BottomSheet>

            <MergeCandidateSheet
                visible={dupSheet}
                onClose={() => setDupSheet(false)}
                source={{ id: gameId, name: gameName?.trim() || '—' }}
            />

            <AlertSheet
                visible={alert != null}
                title={alert?.title}
                message={alert?.message}
                onDismiss={() => setAlert(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    listContent: { paddingBottom: 40 },
    headerWrap: { paddingHorizontal: 20, paddingTop: 0 },

    coverWrap: { alignItems: 'center', paddingTop: 20, paddingBottom: 16 },
    cover: { width: COVER_WIDTH, height: COVER_HEIGHT, borderRadius: 2, backgroundColor: colors.bg3 },
    coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    placeholderText: { fontFamily: displayFont.bold, fontSize: 64, color: colors.text3 },

    coverFrame: {
        width: COVER_WIDTH,
        height: COVER_HEIGHT,
        position: 'relative',
    },
    gameTitle: {
        fontFamily: displayFont.bold, fontSize: 22, letterSpacing: -0.5,
        color: colors.text, textAlign: 'center', marginBottom: 16,
    },

    headerTopRow: { justifyContent: 'space-between' },
    titleRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 8,
    },
    menuButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border,
        alignItems: 'center', justifyContent: 'center',
    },
    menuDots: { fontFamily: displayFont.bold, fontSize: 22, color: colors.text, marginBottom: 2 },

    tagsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: -4, marginBottom: 16 },
    tag: {
        fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 2,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2,
        borderWidth: 1, overflow: 'hidden',
    },
    tagAccepted: { color: colors.orange, borderColor: colors.orange },
    tagIgnored: { color: colors.text3, borderColor: colors.border },

    statsRow: {
        flexDirection: 'row',
        borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border,
        paddingVertical: 14,
    },
    statCell: { flex: 1, alignItems: 'center' },
    statCellMid: { flex: 1, alignItems: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
    statValue: { fontFamily: displayFont.bold, fontSize: 20, color: colors.text },
    statLabel: {
        fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 2,
        color: colors.text3, marginTop: 4,
    },

    historyLabel: { marginTop: 24, marginBottom: 4 },
    errorWrap: { marginTop: 8 },

    sessionRow: {
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    sessionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    sessionDate: { fontFamily: bodyFont.medium, fontSize: 14, color: colors.text },
    sessionDuration: { fontFamily: bodyFont.regular, fontSize: 14, color: colors.text2 },
    sessionStatus: {
        fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 2,
        color: colors.orange, marginTop: 4,
    },
    sessionStatusError: { color: colors.warn },
    sessionNotes: { fontFamily: bodyFont.regular, fontSize: 13, color: colors.text3, marginTop: 6 },
});
