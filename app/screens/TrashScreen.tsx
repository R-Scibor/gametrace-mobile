import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getTrashedSessions, restoreSession, hardDeleteSession } from '../api/sessions';
import { TrashedSession } from '../types/api';
import { useSessionsStore } from '../store/sessionsStore';
import { useGamesStore } from '../store/gamesStore';
import Cover from '../components/Cover';
import ErrorBanner from '../components/ErrorBanner';
import { BottomSheet, sheetStyles } from '../components/BottomSheet';
import ConfirmSheet from '../components/ConfirmSheet';
import AlertSheet from '../components/AlertSheet';
import { apiErrorMessage } from '../utils/apiError';
import { colors } from '../theme/colors';
import { bodyFont, displayFont } from '../theme/fonts';
import { common } from '../theme/styles';

const PAGE_SIZE = 20;

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pl', { day: '2-digit', month: 'short', year: 'numeric' });

const purgeLabel = (iso?: string): string => {
    if (!iso) return '';
    const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
    if (Number.isNaN(days)) return '';
    if (days <= 0) return 'usuwane wkrótce';
    if (days === 1) return 'usuwane jutro';
    return `usuwane za ${days} dni`;
};

export default function TrashScreen() {
    const navigation = useNavigation();
    const [sessions, setSessions] = useState<TrashedSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [menuSession, setMenuSession] = useState<TrashedSession | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<TrashedSession | null>(null);
    const [busy, setBusy] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const loadMore = async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            const page = await getTrashedSessions(sessions.length, PAGE_SIZE);
            setSessions(prev => [...prev, ...page]);
            if (page.length < PAGE_SIZE) setHasMore(false);
            setLoadError(false);
        } catch {
            setLoadError(true);
        }
        setLoading(false);
    };

    useEffect(() => { loadMore(); }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            const page = await getTrashedSessions(0, PAGE_SIZE);
            setSessions(page);
            setHasMore(page.length === PAGE_SIZE);
            setLoadError(false);
        } catch {
            setLoadError(true);
        }
        setRefreshing(false);
    };

    const doRestore = async (s: TrashedSession) => {
        if (busy) return;
        setBusy(true);
        try {
            await restoreSession(s.id);
            setSessions(prev => prev.filter(x => x.id !== s.id));
            useSessionsStore.getState().invalidate();
            useGamesStore.getState().invalidate();
        } catch (e) {
            setErrorMsg(apiErrorMessage(e, 'Nie udało się przywrócić sesji'));
        } finally {
            setBusy(false);
            setMenuSession(null);
        }
    };

    const doHardDelete = async (s: TrashedSession) => {
        if (busy) return;
        setBusy(true);
        try {
            await hardDeleteSession(s.id);
            setSessions(prev => prev.filter(x => x.id !== s.id));
        } catch (e) {
            setErrorMsg(apiErrorMessage(e, 'Nie udało się usunąć sesji'));
        } finally {
            setBusy(false);
            setConfirmDelete(null);
        }
    };

    return (
        <SafeAreaView style={common.safe} edges={['top']}>
            <View style={styles.header}>
                <View style={common.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
                        <Text style={common.back}>← COFNIJ</Text>
                    </TouchableOpacity>
                    <Text style={common.eyebrow}>◈ GAMETRACE</Text>
                </View>
                <Text style={common.title}>Kosz</Text>
                <Text style={styles.subtitle}>Odrzucone sesje są przechowywane 7 dni, potem znikają na stałe.</Text>
            </View>

            {loadError && <View style={styles.errorWrap}><ErrorBanner /></View>}

            <FlatList
                data={sessions}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={!loading ? <Text style={styles.empty}>Kosz jest pusty</Text> : null}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => setMenuSession(item)}>
                        <Cover
                            gameId={item.game_id}
                            fallbackUri={item.game.cover_image_url}
                            style={styles.cover}
                            placeholderChar={item.game.primary_name?.[0]}
                        />
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.name} numberOfLines={1}>{item.game.primary_name}</Text>
                            <Text style={styles.meta}>Sesja z {fmtDate(item.start_time)}</Text>
                        </View>
                        <Text style={styles.purge}>{purgeLabel(item.purges_at)}</Text>
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

            <BottomSheet
                visible={!!menuSession}
                onClose={() => setMenuSession(null)}
                title={menuSession?.game.primary_name ?? 'SESJA'}
            >
                <TouchableOpacity style={sheetStyles.row} activeOpacity={0.7} disabled={busy} onPress={() => menuSession && doRestore(menuSession)}>
                    <Text style={sheetStyles.rowText}>Przywróć sesję</Text>
                    <Text style={sheetStyles.rowDesc}>Wróci do historii i statystyk</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={sheetStyles.row}
                    activeOpacity={0.7}
                    disabled={busy}
                    onPress={() => { const s = menuSession; setMenuSession(null); setConfirmDelete(s); }}
                >
                    <Text style={[sheetStyles.rowText, sheetStyles.rowWarn]}>Usuń trwale</Text>
                    <Text style={sheetStyles.rowDesc}>Nieodwracalne usunięcie sesji</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[sheetStyles.row, sheetStyles.rowLast]} activeOpacity={0.7} onPress={() => setMenuSession(null)}>
                    <Text style={[sheetStyles.rowText, sheetStyles.rowMuted]}>Anuluj</Text>
                </TouchableOpacity>
            </BottomSheet>

            <ConfirmSheet
                visible={!!confirmDelete}
                title="Usunąć trwale?"
                message="Sesja zostanie usunięta na stałe. Tej operacji nie można cofnąć."
                confirmLabel="Usuń trwale"
                destructive
                onConfirm={() => confirmDelete && doHardDelete(confirmDelete)}
                onCancel={() => setConfirmDelete(null)}
            />

            <AlertSheet visible={errorMsg != null} message={errorMsg ?? undefined} onDismiss={() => setErrorMsg(null)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 12 },
    subtitle: { fontFamily: bodyFont.regular, fontSize: 12, color: colors.text3, marginTop: 8 },
    errorWrap: { marginHorizontal: 20, marginBottom: 4 },
    listContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 4 },

    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    cover: { width: 32, height: 44, borderRadius: 2, backgroundColor: colors.bg3 },
    name: { fontFamily: bodyFont.medium, fontSize: 14, color: colors.text },
    meta: { fontFamily: bodyFont.regular, fontSize: 11, color: colors.text3, marginTop: 2 },
    purge: { fontFamily: displayFont.regular, fontSize: 11, color: colors.text3, textAlign: 'right' },

    empty: {
        textAlign: 'center', paddingVertical: 40,
        fontFamily: bodyFont.regular, fontSize: 12, color: colors.text3,
    },
});
