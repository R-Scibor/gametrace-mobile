import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import PolicyBody from '../components/PolicyBody';
import { resolveServer } from '../api/resolveServer';
import { useServerStore } from '../store/serverStore';
import { OFFICIAL_SERVER_HOST } from '../config';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';

const BULLET_KEYS = ['selfHost', 'bestEffort', 'data', 'auth'] as const;

export default function OfficialPolicyScreen({ onBack }: { onBack: () => void }) {
    const { t } = useTranslation('onboarding');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const setServerUrl = useServerStore((s) => s.setServerUrl);

    const onAccept = async () => {
        if (loading) return;
        setError(null);
        setLoading(true);
        try {
            // Explicit https: the official server must use TLS, and the scheme
            // also keeps resolveServer out of its plain-HTTP fallback branch.
            const result = await resolveServer(`https://${OFFICIAL_SERVER_HOST}`);
            if (result.status === 'ok') {
                setServerUrl(result.baseUrl);
            } else {
                // 'insecure' cannot occur with an explicit scheme; folded in defensively.
                setError(t('policy.error'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <TouchableOpacity style={styles.backRow} onPress={onBack} activeOpacity={0.7}>
                    <Text style={styles.back}>{t('policy.back')}</Text>
                </TouchableOpacity>

                <Text style={styles.title}>{t('policy.title')}</Text>
                <Text style={styles.intro}>{t('policy.intro')}</Text>

                <View style={styles.bullets}>
                    {BULLET_KEYS.map((key) => (
                        <View key={key} style={styles.bulletRow}>
                            <Text style={styles.bulletDot}>—</Text>
                            <Text style={styles.bulletText}>{t(`policy.bullets.${key}`)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.policyBlock}>
                    <PolicyBody maxHeight={220} />
                </View>

                <View style={styles.errorSlot}>
                    {error && <Text style={styles.errorText}>{error}</Text>}
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={onAccept}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.buttonText, loading && styles.buttonTextDisabled]}>
                        {loading ? t('policy.connecting') : t('policy.accept')}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 28, paddingVertical: 20 },
    backRow: { paddingVertical: 8, alignSelf: 'flex-start' },
    back: { fontFamily: displayFont.regular, fontSize: 12, letterSpacing: 1, color: colors.text3 },
    title: { fontFamily: displayFont.bold, fontSize: 22, letterSpacing: -0.5, color: colors.text, marginTop: 12 },
    intro: { fontFamily: bodyFont.regular, fontSize: 13, color: colors.text2, marginTop: 8 },
    bullets: { marginTop: 16, gap: 10 },
    bulletRow: { flexDirection: 'row', gap: 8 },
    bulletDot: { fontFamily: bodyFont.regular, fontSize: 13, color: colors.orange, lineHeight: 20 },
    bulletText: { flex: 1, fontFamily: bodyFont.regular, fontSize: 13, lineHeight: 20, color: colors.text2 },
    policyBlock: {
        marginTop: 24, paddingTop: 16,
        borderTopWidth: 1, borderTopColor: colors.border,
    },
    errorSlot: { minHeight: 20, justifyContent: 'center', marginTop: 12 },
    errorText: { fontFamily: bodyFont.regular, fontSize: 12, lineHeight: 18, color: colors.orange, textAlign: 'center' },
    button: { backgroundColor: colors.orange, borderRadius: 2, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
    buttonDisabled: { backgroundColor: colors.bg4 },
    buttonText: { fontFamily: displayFont.bold, fontSize: 14, letterSpacing: 2, color: colors.buttonTextOnOrange },
    buttonTextDisabled: { color: colors.text3 },
});
