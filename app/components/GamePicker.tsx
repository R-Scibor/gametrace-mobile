import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameLadder } from '../hooks/useGameLadder';
import Cover from './Cover';
import ErrorBanner from './ErrorBanner';
import { colors } from '../theme/colors';
import { bodyFont, displayFont } from '../theme/fonts';
import { common } from '../theme/styles';

type Props = {
    value: number | null;
    onChange: (gameId: number) => void;
    initialQuery?: string;
    disabled?: boolean;
};

export default function GamePicker({ value, onChange, initialQuery, disabled }: Props) {
    const { t } = useTranslation('library');
    const { t: tSessions } = useTranslation('sessions');
    const ladder = useGameLadder(onChange);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const { setQuery, reset } = ladder;

    // Mount-only. Deliberately NOT re-applied when the prop changes, so a
    // re-render cannot overwrite what the user has since typed.
    const seeded = useRef(false);
    useEffect(() => {
        if (seeded.current || !initialQuery) return;
        seeded.current = true;
        setQuery(initialQuery);
        setOpen(true);
    }, [initialQuery, setQuery]);

    const trimmed = ladder.query.trim();
    const isBrowse = ladder.mode === 'browse';

    const selectedName = useMemo(() => {
        if (value == null) return null;
        // selectedMeta names a game just created via POST /games, which is not in
        // the owned list yet; the lookup names one arriving via prefill.gameId.
        if (ladder.selectedMeta?.id === value) return ladder.selectedMeta.primary_name;
        return ladder.pickerGames.find(g => g.id === value)?.primary_name ?? null;
    }, [value, ladder.selectedMeta, ladder.pickerGames]);

    const closeAfterSelect = () => { setOpen(false); setEditing(false); };

    if (selectedName && !editing) {
        return (
            <TouchableOpacity
                style={styles.chip}
                onPress={() => { reset(); setEditing(true); setOpen(true); }}
                disabled={disabled}
                activeOpacity={0.8}
            >
                <View style={styles.chipRule} />
                <Text style={styles.chipName} numberOfLines={1}>{selectedName}</Text>
                <Text style={styles.chipAction}>{t('select.change')}</Text>
            </TouchableOpacity>
        );
    }

    const nothingInBrowse =
        isBrowse && ladder.libraryMatches.length === 0 && ladder.catalogMatches.length === 0;

    return (
        <View>
            {ladder.pickerError && (
                <ErrorBanner message={tSessions('errors.gamesLoad')} style={styles.banner} />
            )}

            <View style={common.inputWrapper}>
                <View style={common.orangeBar} />
                <TextInput
                    ref={inputRef}
                    style={common.input}
                    placeholder={t('select.placeholder')}
                    placeholderTextColor={colors.text3}
                    value={ladder.query}
                    onChangeText={setQuery}
                    onFocus={() => setOpen(true)}
                    editable={!disabled && !ladder.isPickerLoading && !ladder.isCreating}
                    autoCorrect={false}
                />
            </View>

            {open && (
                <View style={styles.dropdown}>
                    <ScrollView
                        style={styles.list}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                    >
                        {isBrowse && ladder.libraryMatches.length > 0 && (
                            <>
                                <Text style={styles.groupHeader}>{t('select.groupLibrary')}</Text>
                                {ladder.libraryMatches.map(game => (
                                    <TouchableOpacity
                                        key={`lib-${game.id}`}
                                        style={styles.row}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            void ladder.select({ kind: 'library', game });
                                            closeAfterSelect();
                                        }}
                                    >
                                        <Text style={styles.rowText} numberOfLines={1}>
                                            {game.primary_name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}

                        {isBrowse && ladder.catalogMatches.length > 0 && (
                            <>
                                <Text style={styles.groupHeader}>{t('select.groupCatalog')}</Text>
                                {ladder.catalogMatches.map(suggestion => (
                                    <TouchableOpacity
                                        key={`cat-${suggestion.game_id}`}
                                        style={styles.row}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            void ladder.select({ kind: 'catalog', suggestion });
                                            closeAfterSelect();
                                        }}
                                    >
                                        <Text style={styles.rowText} numberOfLines={1}>
                                            {suggestion.primary_name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}

                        {ladder.mode === 'online' && ladder.candidates.map(candidate => (
                            <TouchableOpacity
                                key={`igdb-${candidate.igdb_id}`}
                                style={styles.candidateRow}
                                activeOpacity={0.7}
                                onPress={() => {
                                    void ladder.select({ kind: 'candidate', candidate })
                                        .then(id => { if (id != null) closeAfterSelect(); });
                                }}
                            >
                                {/*
                                  gameId={null} is load-bearing: Cover reads
                                  localCoversStore.covers[gameId], and an IGDB candidate
                                  has no internal id until POST /games. A synthetic id
                                  could surface another game's cached cover.
                                */}
                                <Cover
                                    gameId={null}
                                    fallbackUri={candidate.cover_url}
                                    placeholderChar={candidate.name[0]}
                                    style={styles.candidateCover}
                                />
                                <Text style={styles.rowText} numberOfLines={1}>{candidate.name}</Text>
                                {candidate.year != null && (
                                    <Text style={styles.candidateYear}>{String(candidate.year)}</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {nothingInBrowse && !ladder.isSuggesting && (
                        <Text style={styles.status}>{t('select.noResults')}</Text>
                    )}
                    {ladder.mode === 'searching' && (
                        <Text style={styles.status}>{t('select.searching')}</Text>
                    )}
                    {ladder.mode === 'online' && ladder.candidates.length === 0 && (
                        <Text style={styles.status}>{t('select.onlineNoResults')}</Text>
                    )}
                    {ladder.error && (
                        <Text style={styles.error}>{t(ladder.error.key)}</Text>
                    )}

                    {isBrowse && trimmed.length > 0 && (
                        <TouchableOpacity
                            style={styles.footerAction}
                            onPress={() => ladder.searchOnline()}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.footerActionText}>{t('select.searchOnline')}</Text>
                        </TouchableOpacity>
                    )}
                    {ladder.mode === 'error' && (
                        <TouchableOpacity
                            style={styles.footerAction}
                            onPress={() => ladder.searchOnline()}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.footerActionText}>{t('select.retry')}</Text>
                        </TouchableOpacity>
                    )}
                    {ladder.mode === 'online' && trimmed.length > 0 && (
                        <TouchableOpacity
                            style={styles.footerAction}
                            onPress={() => {
                                void ladder.select({ kind: 'unrecognized' })
                                    .then(id => { if (id != null) closeAfterSelect(); });
                            }}
                            disabled={ladder.isCreating}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.footerActionText}>
                                {ladder.isCreating
                                    ? t('select.creating')
                                    : t('select.addUnrecognized', { name: trimmed })}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.bg2,
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 2, overflow: 'hidden',
    },
    chipRule: { width: 2, alignSelf: 'stretch', backgroundColor: colors.orange },
    chipName: {
        flex: 1, paddingHorizontal: 14, paddingVertical: 12,
        fontFamily: bodyFont.medium, fontSize: 15, color: colors.text,
    },
    chipAction: {
        fontFamily: displayFont.regular, fontSize: 11, letterSpacing: 1,
        color: colors.text3, paddingRight: 14,
    },
    dropdown: {
        marginTop: 2,
        backgroundColor: colors.bg2,
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 2,
    },
    row: { paddingHorizontal: 14, paddingVertical: 12 },
    rowText: { flex: 1, fontFamily: bodyFont.regular, fontSize: 15, color: colors.text },

    banner: { marginBottom: 8 },
    list: { maxHeight: 260 },
    groupHeader: {
        fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 2.5,
        color: colors.text3, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6,
    },
    candidateRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 14, paddingVertical: 10,
        borderTopWidth: 1, borderTopColor: colors.border,
    },
    candidateCover: { width: 32, height: 42, borderRadius: 2 },
    candidateYear: { fontFamily: bodyFont.regular, fontSize: 13, color: colors.text3 },
    status: {
        fontFamily: bodyFont.regular, fontSize: 13, color: colors.text3,
        paddingHorizontal: 14, paddingVertical: 12,
    },
    error: {
        fontFamily: bodyFont.regular, fontSize: 13, color: colors.warn,
        paddingHorizontal: 14, paddingVertical: 12,
    },
    footerAction: {
        borderTopWidth: 1, borderTopColor: colors.border,
        paddingHorizontal: 14, paddingVertical: 13,
    },
    footerActionText: {
        fontFamily: displayFont.bold, fontSize: 11, letterSpacing: 2, color: colors.orange,
    },
});
