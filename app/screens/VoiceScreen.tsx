import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useVoiceRecord } from '../hooks/useVoiceRecord';
import { transcribeAudio } from '../api/voice';
import { resolveGame } from '../api/games';

export default function VoiceScreen() {
    const navigation = useNavigation<any>();
    const { isRecording, start, stop } = useVoiceRecord();
    const [processing, setProcessing] = useState(false);

    const handlePress = async () => {
        if (processing) return;

        if (!isRecording) {
            try {
                await start();
            } catch (e: any) {
                if (e?.message === 'PERMISSION_DENIED') {
                    Alert.alert('Brak dostępu', 'Zezwól na mikrofon w ustawieniach.');
                } else {
                    Alert.alert('Błąd', 'Nagrywanie nie powiodło się.');
                }
            }
            return;
        }

        let uri: string;
        try {
            uri = await stop();
        } catch {
            Alert.alert('Błąd', 'Nagrywanie nie powiodło się.');
            return;
        }

        setProcessing(true);
        try {
            const result = await transcribeAudio(uri);
            const match = result.game ? await resolveGame(result.game) : null;

            navigation.navigate('Main', {
                screen: 'AddSession',
                params: {
                    gameId: match?.game_id,
                    date: result.date,
                    startTime: result.start_time,
                    endTime: result.end_time,
                    note: result.raw_transcript,
                },
            });
        } catch (e: any) {
            console.log('transcribe failed', e?.response?.status, e?.response?.data, e?.message);
            const detail = e?.response?.data?.detail;
            const msg = typeof detail === 'string' ? detail : 'Nie udało się wysłać nagrania.';
            Alert.alert('Błąd', msg);
        } finally {
            setProcessing(false);
        }
    };

    const label = processing
        ? 'Przetwarzanie...'
        : isRecording
            ? 'Zatrzymaj'
            : 'Nagraj sesję';

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sesja głosowa</Text>
            <Text style={styles.subtitle}>
                Nagraj co grałeś — Whisper rozpozna grę i doda sesję automatycznie.
            </Text>
            <TouchableOpacity
                style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                onPress={handlePress}
                disabled={processing}
                activeOpacity={0.8}
            >
                <Text style={styles.recordIcon}>🎙️</Text>
                <Text style={styles.recordLabel}>{label}</Text>
            </TouchableOpacity>
            <Text style={styles.coming}>
                {isRecording ? 'Mów teraz — kliknij ponownie, aby zakończyć.' : ' '}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
    subtitle: { fontSize: 15, color: '#718096', textAlign: 'center', marginBottom: 48 },
    recordButton: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: '#5865F2', justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
    },
    recordButtonActive: { backgroundColor: '#E53E3E' },
    recordIcon: { fontSize: 36 },
    recordLabel: { color: 'white', fontSize: 13, fontWeight: '600', marginTop: 4 },
    coming: { fontSize: 12, color: '#a0aec0', marginTop: 8, height: 16 },
});
