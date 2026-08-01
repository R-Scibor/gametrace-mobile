import { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { BottomSheet, sheetStyles } from './BottomSheet';
import { getGames } from '../api/games';
import { submitReport } from '../api/reports';
import { buildReportContext } from '../utils/reportContext';
import { composeMergeCandidateMessage } from '../utils/composeMergeCandidateMessage';
import { useAlertStore } from '../store/alertStore';
import { Game } from '../types/api';
import { colors } from '../theme/colors';
import { bodyFont, displayFont } from '../theme/fonts';

export type MergeCandidateSheetProps = {
    visible: boolean;
    onClose: () => void;
    source: { id: number; name: string };
};

const SEARCH_DEBOUNCE_MS = 300;
const NOTE_MAX = 1000;
const LOAD_ERROR = 'Nie udało się pobrać listy gier. Spróbuj ponownie.';
const SUBMIT_ERROR = 'Nie udało się wysłać. Spróbuj ponownie.';
const EXPLAINER =
    'Wybierz drugą grę, która wygląda na to samo. Sprawdzimy zgłoszenie — to nie scala od razu.';
const EMPTY_LIST = 'Brak innych gier w bibliotece.';

function mergeGameLists(a: Game[], b: Game[], sourceId: number): Game[] {
    const byId = new Map<number, Game>();
    for (const g of a) byId.set(g.id, g);
    for (const g of b) byId.set(g.id, g);
    byId.delete(sourceId);
    return Array.from(byId.values()).sort((x, y) =>
        x.primary_name.localeCompare(y.primary_name, 'pl'),
    );
}

export default function MergeCandidateSheet({ visible, onClose, source }: MergeCandidateSheetProps) {
    const showAlert = useAlertStore((s) => s.showAlert);

    const [query, setQuery] = useState('');
    const [unscopedGames, setUnscopedGames] = useState<Game[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [selected, setSelected] = useState<Game | null>(null);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const sourceIdRef = useRef(source.id);
    sourceIdRef.current = source.id;
    const unscopedRef = useRef<Game[]>([]);
    unscopedRef.current = unscopedGames;
    const selectedRef = useRef<Game | null>(null);
    selectedRef.current = selected;
    const requestIdRef = useRef(0);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetForm = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
        requestIdRef.current += 1;
        setQuery('');
        setUnscopedGames([]);
        setGames([]);
        setSelected(null);
        setNote('');
        setLoading(false);
        setSearching(false);
        setLoadError(null);
        setSubmitError(null);
        setSubmitting(false);
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    const fetchDual = useCallback(async (q?: string) => {
        const base = { limit: 100 as const, sort: 'name' as const };
        const [main, out] = await Promise.all([
            getGames(q ? { ...base, q } : base),
            getGames(q ? { ...base, q, inLibrary: false } : { ...base, inLibrary: false }),
        ]);
        return mergeGameLists(main.items, out.items, sourceIdRef.current);
    }, []);

    const loadUnscoped = useCallback(async () => {
        const reqId = ++requestIdRef.current;
        setLoading(true);
        setLoadError(null);
        try {
            const merged = await fetchDual();
            if (reqId !== requestIdRef.current) return;
            setUnscopedGames(merged);
            setGames(merged);
            const sel = selectedRef.current;
            if (sel && !merged.some((g) => g.id === sel.id)) {
                setSelected(null);
            }
        } catch {
            if (reqId !== requestIdRef.current) return;
            setLoadError(LOAD_ERROR);
            setUnscopedGames([]);
            setGames([]);
        } finally {
            if (reqId === requestIdRef.current) setLoading(false);
        }
    }, [fetchDual]);

    // Load candidates when sheet opens
    useEffect(() => {
        if (!visible) return;
        loadUnscoped();
    }, [visible, loadUnscoped]);

    const runSearch = useCallback(
        async (trimmed: string) => {
            if (!trimmed) {
                setGames(unscopedRef.current);
                setSearching(false);
                setLoadError(null);
                return;
            }
            const reqId = ++requestIdRef.current;
            setSearching(true);
            setLoadError(null);
            try {
                const merged = await fetchDual(trimmed);
                if (reqId !== requestIdRef.current) return;
                setGames(merged);
                // Keep selection by id even if absent from this search result
            } catch {
                if (reqId !== requestIdRef.current) return;
                setLoadError(LOAD_ERROR);
            } finally {
                if (reqId === requestIdRef.current) setSearching(false);
            }
        },
        [fetchDual],
    );

    const handleQueryChange = (text: string) => {
        setQuery(text);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            debounceTimerRef.current = null;
            runSearch(text.trim());
        }, SEARCH_DEBOUNCE_MS);
    };

    const handleRetry = () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
        const trimmed = query.trim();
        if (trimmed) {
            runSearch(trimmed);
        } else {
            loadUnscoped();
        }
    };

    const canSend =
        !!selected &&
        selected.id !== source.id &&
        !submitting &&
        !loading &&
        !loadError;

    const handleSend = async () => {
        if (!selected || selected.id === source.id || submitting) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            const message = composeMergeCandidateMessage({
                source: { id: source.id, name: source.name },
                target: { id: selected.id, name: selected.primary_name },
                note,
            });
            await submitReport(message, buildReportContext());
            resetForm();
            onClose();
            showAlert('DZIĘKI', 'Sprawdzimy i scalimy, jeśli to ta sama gra.');
        } catch {
            setSubmitting(false);
            setSubmitError(SUBMIT_ERROR);
        }
    };

    const sourceDisplay = source.name.trim() || '—';

    return (
        <BottomSheet visible={visible} onClose={handleClose} title="DUPLIKAT" keyboardAware>
            <Text style={sheetStyles.message}>{EXPLAINER}</Text>

            <Text style={styles.sourceLabel}>ŹRÓDŁO</Text>
            <Text style={styles.sourceName} numberOfLines={2}>
                {sourceDisplay}
            </Text>

            <Text style={styles.fieldLabel}>DRUGA GRA</Text>

            {loadError ? (
                <View style={styles.loadErrorBlock}>
                    <Text style={styles.error}>{loadError}</Text>
                    <TouchableOpacity onPress={handleRetry} activeOpacity={0.7} style={styles.retryBtn}>
                        <Text style={styles.retryText}>SPRÓBUJ PONOWNIE</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {!loadError ? (
                <>
                    <View style={styles.inputWrapper}>
                        <View style={styles.orangeBar} />
                        <TextInput
                            style={styles.searchInput}
                            value={query}
                            onChangeText={handleQueryChange}
                            placeholder="Szukaj gry..."
                            placeholderTextColor={colors.text3}
                            autoCorrect={false}
                            autoCapitalize="none"
                        />
                    </View>

                    {selected ? (
                        <View style={styles.selectedChip}>
                            <Text style={styles.selectedChipText} numberOfLines={1}>
                                {selected.primary_name}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setSelected(null)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Text style={styles.clearSelection}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    {loading || searching ? (
                        <View style={styles.loadingRow}>
                            <ActivityIndicator color={colors.orange} size="small" />
                        </View>
                    ) : games.length === 0 ? (
                        <Text style={styles.empty}>
                            {query.trim() ? 'Brak wyników.' : EMPTY_LIST}
                        </Text>
                    ) : (
                        <ScrollView
                            style={styles.list}
                            keyboardShouldPersistTaps="handled"
                            nestedScrollEnabled
                        >
                            {games.map((g) => {
                                const isSelected = selected?.id === g.id;
                                return (
                                    <TouchableOpacity
                                        key={g.id}
                                        style={[styles.gameRow, isSelected && styles.gameRowSelected]}
                                        onPress={() => {
                                            setSelected(g);
                                            setSubmitError(null);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.gameRowText,
                                                isSelected && styles.gameRowTextSelected,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {g.primary_name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}
                </>
            ) : null}

            <Text style={styles.fieldLabel}>NOTATKA (OPCJONALNIE)</Text>
            <View style={[styles.inputWrapper, styles.noteWrapper]}>
                <View style={styles.orangeBar} />
                <TextInput
                    style={styles.noteInput}
                    value={note}
                    onChangeText={setNote}
                    placeholder="Np. te same okładki / ten sam serwer Discord"
                    placeholderTextColor={colors.text3}
                    multiline
                    maxLength={NOTE_MAX}
                    textAlignVertical="top"
                />
            </View>

            {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

            <TouchableOpacity
                style={[sheetStyles.row, sheetStyles.rowLast]}
                onPress={handleSend}
                disabled={!canSend}
                activeOpacity={0.7}
            >
                <Text style={[sheetStyles.rowText, !canSend && sheetStyles.rowMuted]}>
                    {submitting ? 'WYSYŁANIE...' : 'WYŚLIJ'}
                </Text>
            </TouchableOpacity>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    sourceLabel: {
        fontFamily: displayFont.bold,
        fontSize: 10,
        letterSpacing: 2,
        color: colors.text3,
        marginTop: 4,
        textAlign: 'center',
    },
    sourceName: {
        fontFamily: bodyFont.regular,
        fontSize: 15,
        color: colors.text,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 8,
    },
    fieldLabel: {
        fontFamily: displayFont.bold,
        fontSize: 10,
        letterSpacing: 2,
        color: colors.text3,
        marginTop: 12,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        backgroundColor: colors.bg3,
        borderWidth: 1,
        borderColor: colors.borderBright,
        borderRadius: 2,
        overflow: 'hidden',
    },
    orangeBar: { width: 2, backgroundColor: colors.orange },
    searchInput: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontFamily: bodyFont.regular,
        fontSize: 15,
        color: colors.text,
    },
    noteWrapper: { minHeight: 72 },
    noteInput: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontFamily: bodyFont.regular,
        fontSize: 15,
        color: colors.text,
        minHeight: 72,
    },
    selectedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,122,26,0.12)',
        borderWidth: 1,
        borderColor: colors.orange,
        borderRadius: 2,
        gap: 8,
    },
    selectedChipText: {
        flex: 1,
        fontFamily: bodyFont.regular,
        fontSize: 14,
        color: colors.orange,
    },
    clearSelection: {
        fontFamily: displayFont.bold,
        fontSize: 14,
        color: colors.text3,
        paddingHorizontal: 4,
    },
    list: {
        maxHeight: 180,
        marginTop: 8,
    },
    gameRow: {
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    gameRowSelected: {
        backgroundColor: 'rgba(255,122,26,0.08)',
    },
    gameRowText: {
        fontFamily: bodyFont.regular,
        fontSize: 14,
        color: colors.text,
    },
    gameRowTextSelected: {
        color: colors.orange,
    },
    empty: {
        fontFamily: bodyFont.regular,
        fontSize: 13,
        color: colors.text3,
        marginTop: 12,
        textAlign: 'center',
    },
    loadingRow: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    error: {
        fontFamily: bodyFont.regular,
        fontSize: 12,
        color: colors.orange,
        marginTop: 8,
    },
    loadErrorBlock: {
        marginTop: 4,
        marginBottom: 4,
        alignItems: 'center',
    },
    retryBtn: {
        marginTop: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    retryText: {
        fontFamily: displayFont.bold,
        fontSize: 12,
        letterSpacing: 1,
        color: colors.orange,
    },
});
