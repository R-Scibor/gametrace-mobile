import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getGameSessions } from '../api/games';
import { Session, SessionStatus } from '../types/api';
import { colors } from '../theme/colors';
import { bodyFont, displayFont } from '../theme/fonts';
import { common } from '../theme/styles';
import Cover from '../components/Cover';
import ErrorBanner from '../components/ErrorBanner';
import { useLocalCoversStore } from '../store/localCoversStore';

const COVER_WIDTH = 264;
const COVER_HEIGHT = 362;

const STATUS_LABEL: Record<SessionStatus, string | null> = {
    COMPLETED: null,
    ONGOING: 'TRWA',
    ERROR: 'BŁĄD',
};

const formatHM = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('pl', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export default function GameDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { gameId, gameName } = route.params;

    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        (async () => {
            if (loading) return;
            setLoading(true);
            try {
                const all: Session[] = [];
                const PAGE = 100;
                while (true) {
                    const page = await getGameSessions(gameId, all.length, PAGE);
                    all.push(...page);
                    if (page.length < PAGE) break;
                }
                setSessions(all);
            } catch {
                setLoadError(true);
            }
            setLoading(false);
        })();
    }, []);

    const completed = sessions.filter(s => s.duration_seconds);
    const totalSeconds = completed.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    const avgSeconds = completed.length ? Math.round(totalSeconds / completed.length) : 0;
    const cover = sessions[0]?.game?.cover_image_url ?? null;

    const localCover = useLocalCoversStore((s) => s.covers[gameId]);
    const setLocalCover = useLocalCoversStore((s) => s.setCover);
    const clearLocalCover = useLocalCoversStore((s) => s.clearCover);

    const takePhoto = async () => {
        try {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
                Alert.alert('Brak uprawnień', 'Nie udało się uzyskać dostępu do aparatu.');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                quality: 0.7,
                allowsEditing: true,
                aspect: [264, 362],
            });
            if (result.canceled || !result.assets?.[0]) return;
            await setLocalCover(gameId, result.assets[0].uri);
        } catch {
            Alert.alert('Błąd', 'Nie udało się zapisać zdjęcia.');
        }
    };

    const promptRemovePhoto = () => {
        Alert.alert('Usuń zdjęcie', 'Przywrócić oryginalną okładkę?', [
            { text: 'Anuluj', style: 'cancel' },
            { text: 'Usuń', style: 'destructive', onPress: () => clearLocalCover(gameId) },
        ]);
    };

    const header = (
        <View style={styles.headerWrap}>
            <View style={common.headerTop}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
                    <Text style={common.back}>← COFNIJ</Text>
                </TouchableOpacity>
                <Text style={common.eyebrow}>◈ GAMETRACE</Text>
            </View>
            <Text style={common.title}>Szczegóły gry</Text>

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
                    <TouchableOpacity
                        style={styles.cameraButton}
                        onPress={takePhoto}
                        onLongPress={localCover ? promptRemovePhoto : undefined}
                        hitSlop={12}
                    >
                        <Text style={styles.cameraButtonText}>◉</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.gameTitle} numberOfLines={2}>{gameName}</Text>

            <View style={styles.statsRow}>
                <View style={styles.statCell}>
                    <Text style={styles.statValue}>{sessions.length}</Text>
                    <Text style={styles.statLabel}>SESJE</Text>
                </View>
                <View style={styles.statCellMid}>
                    <Text style={styles.statValue}>{formatHM(totalSeconds)}</Text>
                    <Text style={styles.statLabel}>ŁĄCZNIE</Text>
                </View>
                <View style={styles.statCell}>
                    <Text style={styles.statValue}>{formatHM(avgSeconds)}</Text>
                    <Text style={styles.statLabel}>ŚREDNIO</Text>
                </View>
            </View>

            <Text style={[common.label, styles.historyLabel]}>HISTORIA</Text>
            {loadError && <ErrorBanner message="Nie udało się pobrać sesji dla tej gry." style={styles.errorWrap} />}
        </View>
    );

    return (
        <SafeAreaView style={common.safe} edges={['top']}>
            <FlatList
                data={sessions}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={header}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const statusLabel = STATUS_LABEL[item.status];
                    const duration = item.duration_seconds
                        ? formatHM(item.duration_seconds)
                        : '—';
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
                            {statusLabel && (
                                <Text style={[
                                    styles.sessionStatus,
                                    item.status === 'ERROR' && styles.sessionStatusError,
                                ]}>
                                    {statusLabel}
                                </Text>
                            )}
                            {item.notes && <Text style={styles.sessionNotes} numberOfLines={2}>{item.notes}</Text>}
                        </TouchableOpacity>
                    );
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    listContent: { paddingBottom: 40 },
    headerWrap: { paddingHorizontal: 20, paddingTop: 16 },

    coverWrap: { alignItems: 'center', paddingTop: 20, paddingBottom: 16 },
    cover: { width: COVER_WIDTH, height: COVER_HEIGHT, borderRadius: 2, backgroundColor: colors.bg3 },
    coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    placeholderText: { fontFamily: displayFont.bold, fontSize: 64, color: colors.text3 },

    coverFrame: {
        width: COVER_WIDTH,
        height: COVER_HEIGHT,
        position: 'relative',
    },
    cameraButton: {
        position: 'absolute',
        right: 8,
        bottom: 8,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.bg2,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraButtonText: {
        fontFamily: displayFont.bold,
        fontSize: 20,
        color: colors.text,
    },

    gameTitle: {
        fontFamily: displayFont.bold, fontSize: 22, letterSpacing: -0.5,
        color: colors.text, textAlign: 'center', marginBottom: 16,
    },

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
