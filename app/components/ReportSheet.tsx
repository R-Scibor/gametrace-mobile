import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheet, sheetStyles } from './BottomSheet';
import { useReportStore } from '../store/reportStore';
import { useAlertStore } from '../store/alertStore';
import { buildReportContext } from '../utils/reportContext';
import { submitReport } from '../api/reports';
import { colors } from '../theme/colors';
import { bodyFont } from '../theme/fonts';

const PLACEHOLDER = 'Co możemy poprawić? Błąd, pomysł, cokolwiek.';

export default function ReportSheet() {
    const isOpen = useReportStore((s) => s.isOpen);
    const submitting = useReportStore((s) => s.submitting);
    const close = useReportStore((s) => s.close);
    const setSubmitting = useReportStore((s) => s.setSubmitting);
    const showAlert = useAlertStore((s) => s.showAlert);

    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const canSend = message.trim().length > 0 && !submitting;

    const handleClose = () => {
        setError(null);
        close();
    };

    const handleSend = async () => {
        if (!canSend) return;
        setSubmitting(true);
        setError(null);
        try {
            await submitReport(message.trim(), buildReportContext());
            setMessage('');
            close();
            showAlert('DZIĘKI', 'Twoja opinia została wysłana.');
        } catch {
            setSubmitting(false);
            setError('Nie udało się wysłać. Spróbuj ponownie.');
        }
    };

    return (
        <BottomSheet visible={isOpen} onClose={handleClose} title="OPINIA" keyboardAware>
            <View style={styles.inputWrapper}>
                <View style={styles.orangeBar} />
                <TextInput
                    style={styles.input}
                    value={message}
                    onChangeText={setMessage}
                    placeholder={PLACEHOLDER}
                    placeholderTextColor={colors.text3}
                    multiline
                    autoFocus
                    maxLength={1000}
                    textAlignVertical="top"
                />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
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
    inputWrapper: {
        flexDirection: 'row', backgroundColor: colors.bg3, borderWidth: 1,
        borderColor: colors.borderBright, borderRadius: 2, overflow: 'hidden',
        marginTop: 12, minHeight: 96,
    },
    orangeBar: { width: 2, backgroundColor: colors.orange },
    input: {
        flex: 1, paddingHorizontal: 14, paddingVertical: 12,
        fontFamily: bodyFont.regular, fontSize: 15, color: colors.text,
    },
    error: { fontFamily: bodyFont.regular, fontSize: 12, color: colors.orange, marginTop: 8 },
});
