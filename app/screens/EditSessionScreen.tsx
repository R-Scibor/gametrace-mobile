import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import DateTimeField from '../components/DateTimeField';
import { getSession, patchSession } from '../api/sessions';

export default function EditSessionScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { sessionId, status } = route.params;

    const [endTime, setEndTime] = useState<Date | null>(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === 'ONGOING') return;
        (async () => {
            try {
                const s = await getSession(sessionId);
                if (s.end_time) setEndTime(new Date(s.end_time));
                if (s.notes) setNotes(s.notes);
            } catch {
                // TODO
            }
        })();
    }, [sessionId]);

    if (status === 'ONGOING') {
        return (
            <View style={styles.center}>
                <Text>Nie można edytować aktywnej sesji</Text>
            </View>
        );
    }

    const handleSave = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await patchSession(sessionId, {
                end_time: endTime ? endTime.toISOString() : undefined,
                notes: notes.trim() || undefined,
            });
            navigation.goBack();
        } catch (e: any) {
            console.log('patchSession failed', e?.response?.status, e?.response?.data, e?.message);
            const detail = e?.response?.data?.detail;
            const msg = typeof detail === 'string' ? detail : detail?.detail ?? 'Nie udało się zapisać zmian';
            Alert.alert('Błąd', msg);
        }
        setLoading(false);
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>Czas zakończenia</Text>
            <DateTimeField value={endTime} onChange={setEndTime} />

            <Text style={styles.label}>Notatki</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
            />

            <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Zapisywanie...' : 'Zapisz zmiany'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 4, marginTop: 12 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
    textArea: { height: 80, textAlignVertical: 'top' },
    button: { backgroundColor: '#5865F2', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 24, marginBottom: 40 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
