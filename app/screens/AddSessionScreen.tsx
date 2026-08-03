import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { TabParamList } from '../navigation/types';
import DateTimeField from '../components/DateTimeField';
import GamePicker from '../components/GamePicker';
import { createSession } from '../api/sessions';
import { useSessionsStore } from '../store/sessionsStore';
import { colors } from '../theme/colors';
import { common } from '../theme/styles';
import AlertSheet from '../components/AlertSheet';

function combineDateTime(date?: string | null, time?: string | null): Date | null {
    if (!date || !time) return null;
    const d = new Date(`${date}T${time}:00`);
    return isNaN(d.getTime()) ? null : d;
}

export default function AddSessionScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<TabParamList, 'AddSession'>>();
    const prefill = route.params;
    const { t } = useTranslation('sessions');

    const [gameId, setGameId] = useState<number | null>(prefill?.gameId ?? null);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);
    const [notes, setNotes] = useState(prefill?.note ?? '');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const start = combineDateTime(prefill?.date, prefill?.startTime);
        const end = combineDateTime(prefill?.date, prefill?.endTime);
        if (start) setStartTime(start);
        if (end) setEndTime(end);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async () => {
        if (loading) return;
        if (!gameId || !startTime || !endTime) {
            setErrorMsg(t('validation'));
            return;
        }
        setLoading(true);
        try {
            await createSession({
                game_id: gameId,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                notes: notes.trim() || undefined,
            });
            useSessionsStore.getState().invalidate();
            navigation.goBack();
        } catch (e: any) {
            if (__DEV__) console.log('createSession failed', e?.response?.status, e?.response?.data, e?.message);
            const detail = e?.response?.data?.detail;
            const msg = typeof detail === 'string' ? detail : detail?.detail ?? t('errors.createFailed');
            setErrorMsg(msg);
        }
        setLoading(false);
    };

    return (
        <SafeAreaView style={common.safe} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                {/* Header */}
                <View style={styles.header}>
                    <Text style={common.eyebrow}>◈ GAMETRACE</Text>
                    <Text style={common.title}>{t('addTitle')}</Text>
                </View>

                {/* Game picker */}
                <Text style={common.label}>{t('gameLabel')}</Text>
                <GamePicker
                    value={gameId}
                    onChange={setGameId}
                    initialQuery={prefill?.gameName}
                    disabled={loading}
                />

                {/* Start time */}
                <Text style={common.label}>{t('startLabel')}</Text>
                <DateTimeField value={startTime} onChange={setStartTime} />

                {/* End time */}
                <Text style={common.label}>{t('endLabel')}</Text>
                <DateTimeField value={endTime} onChange={setEndTime} />

                {/* Notes */}
                <Text style={common.label}>{t('notesLabel')}</Text>
                <View style={common.inputWrapper}>
                    <View style={common.orangeBar} />
                    <TextInput
                        style={[common.input, styles.textArea]}
                        placeholder={t('notesPlaceholder')}
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
                        {loading ? t('saving') : t('saveSession')}
                    </Text>
                </TouchableOpacity>

                {/* Voice */}
                <TouchableOpacity
                    style={common.secondaryButton}
                    onPress={() => navigation.navigate('Voice')}
                    activeOpacity={0.7}
                >
                    <Text style={common.secondaryButtonText}>{t('recordVoice')}</Text>
                </TouchableOpacity>

            </ScrollView>

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
    header: { paddingTop: 0, paddingBottom: 20 },
    textArea: { height: 80, paddingTop: 12 },
});
