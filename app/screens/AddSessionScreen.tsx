import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimeField from '../components/DateTimeField';
import { createSession } from '../api/sessions';
import { getGames } from '../api/games';
import { Game } from '../types/api';
import { useSessionsStore } from '../store/sessionsStore';
import { colors } from '../theme/colors';
import { bodyFont, displayFont } from '../theme/fonts';
import { common } from '../theme/styles';

export default function AddSessionScreen() {
    const navigation = useNavigation<any>();
    const [games, setGames] = useState<Game[]>([]);
    const [gameQuery, setGameQuery] = useState('');
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const data = await getGames(0, 100);
                setGames(data);
            } catch {
                // TODO
            }
        })();
    }, []);

    const filteredGames = selectedGame
        ? []
        : gameQuery.trim()
            ? games.filter(g => g.primary_name.toLowerCase().includes(gameQuery.toLowerCase()))
            : [];

    const handleSubmit = async () => {
        if (loading) return;
        if (!selectedGame || !startTime || !endTime) {
            Alert.alert('Błąd', 'Wybierz grę oraz daty rozpoczęcia i zakończenia');
            return;
        }
        setLoading(true);
        try {
            await createSession({
                game_id: selectedGame.id,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                notes: notes.trim() || undefined,
            });
            useSessionsStore.getState().invalidate();
            navigation.goBack();
        } catch (e: any) {
            console.log('createSession failed', e?.response?.status, e?.response?.data, e?.message);
            const detail = e?.response?.data?.detail;
            const msg = typeof detail === 'string' ? detail : detail?.detail ?? 'Nie udało się zapisać sesji';
            Alert.alert('Błąd', msg);
        }
        setLoading(false);
    };

    return (
        <SafeAreaView style={common.safe} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                {/* Header */}
                <View style={styles.header}>
                    <Text style={common.eyebrow}>◈ GAMETRACE</Text>
                    <Text style={common.title}>Dodaj sesję</Text>
                </View>

                {/* Game picker */}
                <Text style={common.label}>GRA</Text>
                {selectedGame ? (
                    <TouchableOpacity
                        style={styles.selectedGame}
                        onPress={() => { setSelectedGame(null); setGameQuery(''); }}
                        activeOpacity={0.8}
                    >
                        <View style={styles.selectedGameRule} />
                        <Text style={styles.selectedGameText} numberOfLines={1}>{selectedGame.primary_name}</Text>
                        <Text style={styles.changeLink}>Zmień →</Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        <View style={common.inputWrapper}>
                            <View style={common.orangeBar} />
                            <TextInput
                                style={common.input}
                                placeholder="Szukaj gry..."
                                placeholderTextColor={colors.text3}
                                value={gameQuery}
                                onChangeText={setGameQuery}
                                autoCorrect={false}
                            />
                        </View>
                        {filteredGames.length > 0 && (
                            <View style={styles.dropdown}>
                                {filteredGames.map((game, i) => (
                                    <TouchableOpacity
                                        key={game.id}
                                        style={[styles.dropdownRow, i < filteredGames.length - 1 && styles.dropdownRowBorder]}
                                        onPress={() => setSelectedGame(game)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.dropdownText}>{game.primary_name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </>
                )}

                {/* Start time */}
                <Text style={common.label}>ROZPOCZĘCIE</Text>
                <DateTimeField value={startTime} onChange={setStartTime} />

                {/* End time */}
                <Text style={common.label}>ZAKOŃCZENIE</Text>
                <DateTimeField value={endTime} onChange={setEndTime} />

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
                    style={[common.button, loading && common.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    <Text style={[common.buttonText, loading && common.buttonTextDisabled]}>
                        {loading ? 'ZAPISYWANIE...' : 'ZAPISZ SESJĘ'}
                    </Text>
                </TouchableOpacity>

                {/* Voice */}
                <TouchableOpacity
                    style={common.secondaryButton}
                    onPress={() => navigation.navigate('Camera')}
                    activeOpacity={0.7}
                >
                    <Text style={common.secondaryButtonText}>NAGRAJ GŁOSOWO</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    header: { paddingTop: 16, paddingBottom: 20 },
    textArea: { height: 80, paddingTop: 12 },

    dropdown: {
        marginTop: 2,
        backgroundColor: colors.bg2,
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 2,
    },
    dropdownRow: { paddingHorizontal: 14, paddingVertical: 12 },
    dropdownRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    dropdownText: { fontFamily: bodyFont.regular, fontSize: 15, color: colors.text },

    selectedGame: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.bg2,
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 2, overflow: 'hidden',
    },
    selectedGameRule: { width: 2, alignSelf: 'stretch', backgroundColor: colors.orange },
    selectedGameText: {
        flex: 1, paddingHorizontal: 14, paddingVertical: 12,
        fontFamily: bodyFont.medium, fontSize: 15, color: colors.text,
    },
    changeLink: {
        fontFamily: displayFont.regular, fontSize: 11, letterSpacing: 1,
        color: colors.text3, paddingRight: 14,
    },
});
