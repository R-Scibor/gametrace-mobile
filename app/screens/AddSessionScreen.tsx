import { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimeField from '../components/DateTimeField';
import { createSession } from '../api/sessions';
import { getGames } from '../api/games';
import { Game } from '../types/api';
import { useSessionsStore } from '../store/sessionsStore';

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
        <ScrollView style={styles.container}>
            <Text style={styles.label}>Gra</Text>
            {selectedGame ? (
                <TouchableOpacity
                    style={styles.selectedGame}
                    onPress={() => { setSelectedGame(null); setGameQuery(''); }}
                >
                    <Text style={styles.selectedGameText}>{selectedGame.primary_name}</Text>
                    <Text style={styles.changeLink}>Zmień</Text>
                </TouchableOpacity>
            ) : (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="Szukaj gry..."
                        value={gameQuery}
                        onChangeText={setGameQuery}
                    />
                    {filteredGames.map(game => (
                        <TouchableOpacity
                            key={game.id}
                            style={styles.gameRow}
                            onPress={() => setSelectedGame(game)}
                        >
                            <Text>{game.primary_name}</Text>
                        </TouchableOpacity>
                    ))}
                </>
            )}

            <Text style={styles.label}>Rozpoczęcie</Text>
            <DateTimeField value={startTime} onChange={setStartTime} />

            <Text style={styles.label}>Zakończenie</Text>
            <DateTimeField value={endTime} onChange={setEndTime} />

            <Text style={styles.label}>Notatki (opcjonalne)</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Np. sesja z kolegami..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Zapisywanie...' : 'Zapisz sesję'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Camera')}>
                <Text style={styles.secondaryButtonText}>Nagraj głosowo</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 4, marginTop: 12 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
    textArea: { height: 80, textAlignVertical: 'top' },
    gameRow: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
    selectedGame: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#5865F2', borderRadius: 8, padding: 12 },
    selectedGameText: { fontSize: 16, fontWeight: '600' },
    changeLink: { color: '#5865F2' },
    button: { backgroundColor: '#5865F2', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 24, marginBottom: 12 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
    secondaryButton: { borderWidth: 1, borderColor: '#5865F2', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 40 },
    secondaryButtonText: { color: '#5865F2', fontSize: 16, fontWeight: '600' },
});
