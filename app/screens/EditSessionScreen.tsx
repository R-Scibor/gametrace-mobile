import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import DateTimeField from '../components/DateTimeField';
import { getSession, patchSession } from '../api/sessions';
import { useSessionsStore } from '../store/sessionsStore';
import { colors } from '../theme/colors';
import { displayFont } from '../theme/fonts';
import { common } from '../theme/styles';
import ErrorBanner from '../components/ErrorBanner';

export default function EditSessionScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { sessionId, status } = route.params;

    const [endTime, setEndTime] = useState<Date | null>(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        if (status === 'ONGOING') return;
        (async () => {
            try {
                const s = await getSession(sessionId);
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

    const handleSave = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await patchSession(sessionId, {
                end_time: endTime ? endTime.toISOString() : undefined,
                notes: notes.trim() || undefined,
            });
            useSessionsStore.getState().invalidate();
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
                    onPress={handleSave}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    <Text style={[common.buttonText, loading && common.buttonTextDisabled]}>
                        {loading ? 'ZAPISYWANIE...' : 'ZAPISZ ZMIANY'}
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    header: { paddingTop: 16, paddingBottom: 20 },
    textArea: { height: 80, paddingTop: 12 },
    errorWrap: { marginBottom: 4 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    blockedText: {
        fontFamily: displayFont.bold, fontSize: 13, letterSpacing: 2,
        color: colors.text3, textAlign: 'center',
    },
});
