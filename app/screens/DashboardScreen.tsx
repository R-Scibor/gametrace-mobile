import { useCallback, useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
    RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDashboard } from '../hooks/useDashboard';
import { useRecentSessions } from '../hooks/useRecentSessions';
import LiveTimer from '../components/LiveTimer';
import { Session } from '../types/api';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';

const fmtHours = (seconds: number) => (seconds / 3600).toFixed(1);

const fmtDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtTimeShort = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('pl', { hour: '2-digit', minute: '2-digit' });
};

const fmtDateShort = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pl', { day: '2-digit', month: 'short' });
};

const fmtHeaderDate = () => {
    const d = new Date();
    return d.toLocaleDateString('pl', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase();
};

export default function DashboardScreen() {
    const navigation = useNavigation<any>();
    const { data, loading, error, refresh } = useDashboard();
    const { data: recents, refresh: refreshRecents } = useRecentSessions(data?.active_session?.id ?? null);
    const [refreshing, setRefreshing] = useState(false);

    const onPullRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refresh(), refreshRecents()]);
        setRefreshing(false);
    }, [refresh, refreshRecents]);

    const openActive = () => {
        if (data?.active_session) {
            navigation.navigate('GameDetail', { gameId: data.active_session.game_id });
        }
    };

    const openErrors = () => {
        const first = data?.pending_errors?.[0];
        if (first) navigation.navigate('EditSession', { sessionId: first.id, status: 'ERROR' });
    };

    const openSession = (s: Session) => {
        if (s.status === 'ERROR') {
            navigation.navigate('EditSession', { sessionId: s.id, status: 'ERROR' });
        } else {
            navigation.navigate('GameDetail', { gameId: s.game_id });
        }
    };

    if (loading && !data) {
        return (
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.center}>
                    <ActivityIndicator color={colors.orange} />
                </View>
            </SafeAreaView>
        );
    }

    if (error && !data) {
        return (
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
                        <Text style={styles.retryText}>SPRÓBUJ PONOWNIE</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const today = data?.total_seconds_today ?? 0;
    const week = data?.total_seconds_7d ?? 0;
    const month = data?.total_seconds_30d ?? 0;
    const avgPerDay = week / 7;

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onPullRefresh}
                        tintColor={colors.orange}
                        colors={[colors.orange]}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.eyebrow}>◈ GAMETRACE</Text>
                        <Text style={styles.title}>Dashboard</Text>
                    </View>
                    <Text style={styles.headerDate}>{fmtHeaderDate()}</Text>
                </View>

                {/* Active session */}
                {data?.active_session && (
                    <TouchableOpacity activeOpacity={0.85} onPress={openActive} style={styles.activeCard}>
                        <View style={styles.activeRow}>
                            <View style={styles.coverWrap}>
                                {data.active_session.cover_image_url ? (
                                    <Image
                                        source={{ uri: data.active_session.cover_image_url }}
                                        style={styles.cover}
                                    />
                                ) : (
                                    <View style={[styles.cover, styles.coverPlaceholder]} />
                                )}
                            </View>
                            <View style={styles.activeMeta}>
                                <View style={styles.liveRow}>
                                    <View style={styles.liveDot} />
                                    <Text style={styles.liveLabel}>AKTYWNA SESJA</Text>
                                </View>
                                <Text style={styles.activeName} numberOfLines={1}>
                                    {data.active_session.game_name}
                                </Text>
                                <LiveTimer
                                    startIso={data.active_session.start_time}
                                    style={styles.timer}
                                />
                                <Text style={styles.activeStartedAt}>
                                    od {fmtTimeShort(data.active_session.start_time)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.activeFooter}>
                            <Text style={styles.activeFooterLabel}>⬡ WYKRYTO PRZEZ BOTA</Text>
                            <Text style={styles.activeFooterAction}>szczegóły →</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* Error banner */}
                {data?.pending_errors && data.pending_errors.length > 0 && (
                    <TouchableOpacity activeOpacity={0.85} onPress={openErrors} style={styles.errorBanner}>
                        <Text style={styles.errorIcon}>⚠</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.errorTitle}>
                                {data.pending_errors.length} {data.pending_errors.length === 1 ? 'nieudana sesja wymaga uwagi' : 'nieudane sesje wymagają uwagi'}
                            </Text>
                            <Text style={styles.errorSub}>Bot mógł zostawić otwarte sesje</Text>
                        </View>
                        <Text style={styles.errorAction}>Napraw →</Text>
                    </TouchableOpacity>
                )}

                {/* Stat tiles */}
                <View style={styles.tilesRow}>
                    <StatTile label="DZIŚ" value={fmtHours(today)} unit="h" />
                    <StatTile label="OSTATNIE 7 DNI" value={fmtHours(week)} unit="h"
                        sub={`Ø ${avgPerDay.toFixed(1)} h/dzień`} />
                    <StatTile label="OSTATNIE 30 DNI" value={fmtHours(month)} unit="h" />
                </View>

                {/* Recent sessions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>OSTATNIE SESJE</Text>
                    <View style={styles.sectionRule} />
                </View>

                {recents.length === 0 ? (
                    <Text style={styles.emptyText}>Brak sesji do wyświetlenia</Text>
                ) : (
                    recents.map((s) => (
                        <TouchableOpacity
                            key={s.id}
                            onPress={() => openSession(s)}
                            activeOpacity={0.85}
                            style={[styles.sessionRow, s.status === 'ERROR' && styles.sessionRowError]}
                        >
                            {s.game.cover_image_url ? (
                                <Image source={{ uri: s.game.cover_image_url }} style={styles.sessionCover} />
                            ) : (
                                <View style={[styles.sessionCover, styles.coverPlaceholder]} />
                            )}
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={styles.sessionName} numberOfLines={1}>{s.game.primary_name}</Text>
                                <Text style={styles.sessionMeta}>
                                    {s.source === 'BOT' ? '⬡' : '✎'}  {fmtDateShort(s.start_time)}
                                </Text>
                            </View>
                            {s.status === 'ERROR' ? (
                                <Text style={styles.errorBadge}>BŁĄD</Text>
                            ) : (
                                <Text style={styles.sessionDuration}>{fmtDuration(s.duration_seconds)}</Text>
                            )}
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function StatTile({ label, value, unit, sub }: { label: string; value: string; unit: string; sub?: string }) {
    return (
        <View style={styles.tile}>
            <View style={styles.tileRule} />
            <Text style={styles.tileLabel}>{label}</Text>
            <View style={styles.tileValueRow}>
                <Text style={styles.tileValue}>{value}</Text>
                <Text style={styles.tileUnit}>{unit}</Text>
            </View>
            {sub && <Text style={styles.tileSub}>{sub}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    content: { paddingBottom: 32 },

    // Header
    header: {
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    },
    eyebrow: {
        fontFamily: displayFont.bold, fontSize: 11, letterSpacing: 3,
        color: colors.orange, marginBottom: 4,
    },
    title: {
        fontFamily: displayFont.bold, fontSize: 22, letterSpacing: -0.5,
        color: colors.text,
    },
    headerDate: {
        fontFamily: displayFont.regular, fontSize: 11, letterSpacing: 1,
        color: colors.text3,
    },

    // Active session card
    activeCard: {
        marginHorizontal: 20, marginTop: 4, marginBottom: 12,
        backgroundColor: colors.bg2, borderRadius: 4, overflow: 'hidden',
        borderWidth: 1, borderColor: colors.orange,
        shadowColor: colors.orange, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 0 },
        elevation: 6,
    },
    activeRow: { flexDirection: 'row' },
    coverWrap: { width: 72, height: 100 },
    cover: { width: '100%', height: '100%' },
    coverPlaceholder: { backgroundColor: colors.bg3 },
    activeMeta: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
    liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.orange },
    liveLabel: {
        fontFamily: displayFont.bold, fontSize: 9, letterSpacing: 2, color: colors.orange,
    },
    activeName: {
        fontFamily: displayFont.bold, fontSize: 15, color: colors.text, lineHeight: 18,
    },
    timer: {
        fontFamily: displayFont.bold, fontSize: 22, letterSpacing: 1, color: colors.orange,
        marginTop: 2, fontVariant: ['tabular-nums'],
    },
    activeStartedAt: {
        fontFamily: bodyFont.regular, fontSize: 11, color: colors.text3,
    },
    activeFooter: {
        borderTopWidth: 1, borderTopColor: colors.orange,
        backgroundColor: 'rgba(255, 122, 26, 0.05)',
        paddingHorizontal: 14, paddingVertical: 6,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    activeFooterLabel: {
        fontFamily: displayFont.regular, fontSize: 10, letterSpacing: 1, color: colors.orangeDim,
    },
    activeFooterAction: {
        fontFamily: bodyFont.regular, fontSize: 10, color: colors.text3,
    },

    // Error banner
    errorBanner: {
        marginHorizontal: 20, marginBottom: 12,
        backgroundColor: colors.warnTint, borderColor: colors.warnBorder, borderWidth: 1,
        borderRadius: 4, paddingHorizontal: 14, paddingVertical: 10,
        flexDirection: 'row', alignItems: 'center', gap: 10,
    },
    errorIcon: { fontSize: 16, color: colors.warn },
    errorTitle: { fontFamily: displayFont.regular, fontSize: 12, color: colors.warn },
    errorSub: { fontFamily: bodyFont.regular, fontSize: 11, color: colors.text3, marginTop: 2 },
    errorAction: {
        fontFamily: displayFont.regular, fontSize: 11, color: colors.warn, letterSpacing: 0.5,
    },

    // Stat tiles
    tilesRow: {
        flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 16,
    },
    tile: {
        flex: 1, backgroundColor: colors.bg2, borderRadius: 4, borderWidth: 1, borderColor: colors.border,
        paddingHorizontal: 12, paddingVertical: 14, overflow: 'hidden', position: 'relative',
    },
    tileRule: {
        position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
        backgroundColor: colors.orange, opacity: 0.6,
    },
    tileLabel: {
        fontFamily: displayFont.bold, fontSize: 9, letterSpacing: 2, color: colors.text3, marginBottom: 8,
    },
    tileValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
    tileValue: {
        fontFamily: displayFont.bold, fontSize: 28, letterSpacing: -1, color: colors.orange, lineHeight: 30,
    },
    tileUnit: {
        fontFamily: displayFont.regular, fontSize: 13, color: colors.text3,
    },
    tileSub: {
        fontFamily: bodyFont.regular, fontSize: 10, color: colors.text3, marginTop: 6,
    },

    // Section header
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 20, marginBottom: 8,
    },
    sectionLabel: {
        fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 2, color: colors.text3,
    },
    sectionRule: { flex: 1, height: 1, backgroundColor: colors.border },

    // Recent session rows
    sessionRow: {
        marginHorizontal: 20, marginBottom: 4,
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 10, paddingVertical: 8, borderRadius: 3,
        borderWidth: 1, borderColor: 'transparent',
    },
    sessionRowError: { backgroundColor: colors.warnTint, borderColor: colors.warnBorder },
    sessionCover: { width: 32, height: 44, borderRadius: 2, backgroundColor: colors.bg3 },
    sessionName: { fontFamily: bodyFont.medium, fontSize: 13, color: colors.text },
    sessionMeta: { fontFamily: bodyFont.regular, fontSize: 11, color: colors.text3, marginTop: 2 },
    sessionDuration: { fontFamily: displayFont.regular, fontSize: 13, color: colors.text2 },
    errorBadge: {
        fontFamily: displayFont.bold, fontSize: 9, letterSpacing: 2, color: colors.warn,
    },

    emptyText: {
        textAlign: 'center', paddingVertical: 24,
        fontFamily: bodyFont.regular, fontSize: 12, color: colors.text3,
    },
    errorText: {
        fontFamily: bodyFont.regular, fontSize: 14, color: colors.orange,
        textAlign: 'center', marginBottom: 16,
    },
    retryBtn: { borderColor: colors.orange, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 2 },
    retryText: { fontFamily: displayFont.bold, fontSize: 12, letterSpacing: 2, color: colors.orange },
});
