import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import DateTimeField from '../components/DateTimeField';
import Cover from '../components/Cover';
import ConfirmSheet from '../components/ConfirmSheet';
import AlertSheet from '../components/AlertSheet';
import { formatDuration } from '../utils/duration';
import { apiErrorMessage } from '../utils/apiError';
import { getSession, patchSession, deleteSession } from '../api/sessions';
import { Session } from '../types/api';
import { useSessionsStore } from '../store/sessionsStore';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';
import { common } from '../theme/styles';
import ErrorBanner from '../components/ErrorBanner';

const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString('pl', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function EditSessionScreen() {
    const route = useRoute<RouteProp<RootStackParamList, 'EditSession'>>();
    const navigation = useNavigation();
    const { sessionId, status } = route.params;

    const [session, setSession] = useState<Session | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [discardVisible, setDiscardVisible] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'ONGOING') return;
        (async () => {
            try {
                const s = await getSession(sessionId);
                setSession(s);
                if (s.end_time) setEndTime(new Date(s.end_time));
                if (s.notes) setNotes(s.notes);
            } catch {
                setLoadError(true);
            }
        })();
    }, [sessionId]);

    if (status === 'ONGOING') {
        return (
            <SafeAreaView style={common.safe} edges={['top']}>
                <View style={styles.center}>
                    <Text style={styles.blockedText}>Nie można edytować aktywnej sesji</Text>
                </View>
            </SafeAreaView>
        );
    }

    const doSave = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await patchSession(sessionId, {
                end_time: endTime ? endTime.toISOString() : undefined,
                notes: notes.trim(),
            });
            useSessionsStore.getState().invalidate();
            navigation.goBack();
        } catch (e: any) {
            if (__DEV__) console.log('[patchSession] save failed', e?.response?.status, e?.response?.data, e?.message);
            setErrorMsg(apiErrorMessage(e, 'Nie udało się zapisać zmian'));
        }
        setLoading(false);
    };

    const handleSave = () => {
        if (session?.source === 'BOT') {
            setConfirmVisible(true);
            return;
        }
        doSave();
    };

    const doDiscard = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await deleteSession(sessionId);
            useSessionsStore.getState().invalidate();
            navigation.goBack();
        } catch (e: any) {
            if (__DEV__) console.log('[discard] DELETE failed', e?.response?.status, JSON.stringify(e?.response?.data), e?.message);
            setErrorMsg(apiErrorMessage(e, 'Nie udało się odrzucić sesji'));
        }
        setLoading(false);
    };

    const rawDuration = session && endTime
        ? Math.round((endTime.getTime() - new Date(session.start_time).getTime()) / 1000)
        : null;
    const durationValid = rawDuration != null && rawDuration >= 0;
    const endBeforeStart = rawDuration != null && rawDuration < 0;
    const saveDisabled = loading || endBeforeStart;

    return (
        <SafeAreaView style={common.safe} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                {/* Header */}
                <View style={styles.header}>
                    <View style={common.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
                            <Text style={common.back}>← COFNIJ</Text>
                        </TouchableOpacity>
                        <Text style={common.eyebrow}>◈ GAMETRACE</Text>
                    </View>
                    <Text style={common.title}>Edytuj sesję</Text>
                </View>

                {loadError && <ErrorBanner message="Nie udało się pobrać sesji do edycji." style={styles.errorWrap} />}

                {/* Session context */}
                {session && (
                    <View style={styles.contextCard}>
                        <View style={styles.gameRow}>
                            <Cover
                                gameId={session.game_id}
                                fallbackUri={session.game.cover_image_url}
                                style={styles.cover}
                                placeholderChar={session.game.primary_name?.[0]}
                            />
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={styles.gameName} numberOfLines={2}>{session.game.primary_name}</Text>
                                <View style={styles.badgeRow}>
                                    <Text style={styles.sourceText}>
                                        {session.source === 'BOT' ? '⬡ BOT' : '✎ RĘCZNA'}
                                    </Text>
                                    {session.status === 'ERROR' && <Text style={styles.errorBadge}>BŁĄD</Text>}
                                </View>
                            </View>
                        </View>
                        <View style={styles.metaRow}>
                            <View style={styles.metaCell}>
                                <Text style={styles.metaLabel}>ROZPOCZĘCIE</Text>
                                <Text style={styles.metaValue}>{fmtDateTime(session.start_time)}</Text>
                            </View>
                            <View style={styles.metaCell}>
                                <Text style={styles.metaLabel}>CZAS TRWANIA</Text>
                                <Text style={[styles.metaValue, styles.metaDuration]}>
                                    {durationValid ? formatDuration(rawDuration) : '—'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* End time */}
                <Text style={common.label}>ZAKOŃCZENIE</Text>
                <DateTimeField value={endTime} onChange={setEndTime} />
                {endBeforeStart && (
                    <Text style={styles.warnText}>Zakończenie nie może być przed rozpoczęciem</Text>
                )}

                {/* Notes */}
                <Text style={common.label}>NOTATKI (OPCJONALNE)</Text>
                <View style={common.inputWrapper}>
                    <View style={common.orangeBar} />
                    <TextInput
                        style={[common.input, styles.textArea]}
                        placeholder="Dodatkowe informacje"
                        placeholderTextColor={colors.text3}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </View>

                {/* Submit */}
                <TouchableOpacity
                    style={[common.button, saveDisabled && common.buttonDisabled]}
                    onPress={handleSave}
                    disabled={saveDisabled}
                    activeOpacity={0.85}
                >
                    <Text style={[common.buttonText, saveDisabled && common.buttonTextDisabled]}>
                        {loading ? 'ZAPISYWANIE...' : 'ZAPISZ ZMIANY'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.discardButton}
                    onPress={() => setDiscardVisible(true)}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    <Text style={styles.discardButtonText}>ODRZUĆ SESJĘ</Text>
                </TouchableOpacity>

            </ScrollView>

            <ConfirmSheet
                visible={confirmVisible}
                title="Zmiana źródła sesji"
                message="Zapisanie zmieni źródło sesji na ręczne (użytkownik). Może nie liczyć się do niektórych statystyk społeczności, ale w pełni zadziała w Twoich własnych statystykach."
                confirmLabel="Zapisz mimo to"
                onConfirm={() => { setConfirmVisible(false); doSave(); }}
                onCancel={() => setConfirmVisible(false)}
            />

            <ConfirmSheet
                visible={discardVisible}
                title="Odrzucić sesję?"
                message="Sesja zostanie odrzucona i nie będzie wliczana do statystyk."
                confirmLabel="Odrzuć sesję"
                destructive
                onConfirm={() => { setDiscardVisible(false); doDiscard(); }}
                onCancel={() => setDiscardVisible(false)}
            />

            <AlertSheet
                visible={errorMsg != null}
                message={errorMsg ?? undefined}
                onDismiss={() => setErrorMsg(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    header: { paddingTop: 16, paddingBottom: 20 },
    textArea: { height: 80, paddingTop: 12 },
    errorWrap: { marginBottom: 4 },

    contextCard: {
        backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border,
        borderRadius: 4, padding: 14,
    },
    gameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cover: { width: 40, height: 54, borderRadius: 2, backgroundColor: colors.bg3 },
    gameName: { fontFamily: displayFont.bold, fontSize: 16, color: colors.text },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
    sourceText: { fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 1.5, color: colors.text3 },
    errorBadge: { fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 2, color: colors.warn },
    metaRow: {
        flexDirection: 'row', marginTop: 14, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: colors.border,
    },
    metaCell: { flex: 1 },
    metaLabel: { fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 2, color: colors.text3, marginBottom: 4 },
    metaValue: { fontFamily: bodyFont.regular, fontSize: 14, color: colors.text },
    metaDuration: { fontFamily: displayFont.bold, color: colors.orange },
    warnText: { fontFamily: bodyFont.regular, fontSize: 12, color: colors.warn, marginTop: 6 },
    discardButton: {
        borderWidth: 1, borderColor: colors.warnBorder, borderRadius: 2,
        paddingVertical: 13, alignItems: 'center', marginTop: 10,
    },
    discardButtonText: {
        fontFamily: displayFont.bold, fontSize: 13, letterSpacing: 2, color: colors.warn,
    },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    blockedText: {
        fontFamily: displayFont.bold, fontSize: 13, letterSpacing: 2,
        color: colors.text3, textAlign: 'center',
    },
});
