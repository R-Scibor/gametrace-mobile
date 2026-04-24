import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createSession } from '../api/sessions';

export default function AddSessionScreen() {
    const navigation = useNavigation<any>();
    const [gameId, setGameId] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await createSession({
                game_id: Number(gameId),
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString(),
                notes: notes.trim() || undefined,
            });
            navigation.goBack();
        } catch {
            Alert.alert('Błąd', 'Nie udało się zapisać sesji');
            // TODO
        }
        setLoading(false);
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>ID Gry</Text>
            <TextInput
                style={styles.input}
                placeholder="np. 42"
                keyboardType="numeric"
                value={gameId}
                onChangeText={setGameId}
            />

            <Text>Data w tym formacie: 2024-01-15T18:00</Text>

            <Text style={styles.label}>Rozpoczęcie</Text>
            <TextInput
                style={styles.input}
                value={startTime}
                onChangeText={setStartTime}
            />

            <Text style={styles.label}>Zakończenie</Text>
            <TextInput
                style={styles.input}
                value={endTime}
                onChangeText={setEndTime}
            />

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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 4, marginTop: 12 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
    textArea: { height: 80, textAlignVertical: 'top' },
    button: { backgroundColor: '#5865F2', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 24, marginBottom: 40 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
