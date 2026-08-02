import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Wordmark from '../components/Wordmark';
import PolicyBody from '../components/PolicyBody';
import InfoButton from '../components/InfoButton';
import { BottomSheet } from '../components/BottomSheet';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';

// First screen on a clean install. Play users take the official server; the
// self-host path stays one tap away and skips the official policy gate.
export default function WelcomeScreen({ onOfficial, onCustom }: {
    onOfficial: () => void;
    onCustom: () => void;
}) {
    const { t } = useTranslation('onboarding');
    const [policyOpen, setPolicyOpen] = useState(false);

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <View style={styles.center}>
                <Wordmark tagline={t('welcome.tagline')} />

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.button} onPress={onOfficial} activeOpacity={0.8}>
                        <Text style={styles.buttonText}>{t('welcome.official')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkRow} onPress={onCustom} activeOpacity={0.7}>
                        <Text style={styles.link}>{t('welcome.custom')}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.summary}>{t('welcome.summary')}</Text>

                <View style={styles.infoRow}>
                    <InfoButton
                        title={t('welcome.infoTitle')}
                        body={t('welcome.infoBody')}
                        label={t('welcome.infoTitle')}
                    />
                </View>
            </View>

            <TouchableOpacity
                style={styles.policyLinkRow}
                onPress={() => setPolicyOpen(true)}
                activeOpacity={0.7}
            >
                <Text style={styles.policyLink}>{t('welcome.policyLink')}</Text>
            </TouchableOpacity>

            <BottomSheet
                visible={policyOpen}
                onClose={() => setPolicyOpen(false)}
                title={t('policy.fullTitle')}
            >
                <PolicyBody showTitle={false} />
            </BottomSheet>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
    actions: { width: '100%', gap: 12, marginTop: 12 },
    button: { backgroundColor: colors.orange, borderRadius: 2, paddingVertical: 15, alignItems: 'center' },
    buttonText: { fontFamily: displayFont.bold, fontSize: 14, letterSpacing: 2, color: colors.buttonTextOnOrange },
    linkRow: { paddingVertical: 10, alignItems: 'center' },
    link: { fontFamily: bodyFont.regular, fontSize: 14, color: colors.text2 },
    summary: {
        fontFamily: bodyFont.regular, fontSize: 13, lineHeight: 19, color: colors.text3,
        textAlign: 'center', marginTop: 24,
    },
    infoRow: { marginTop: 4, alignItems: 'center' },
    policyLinkRow: { paddingVertical: 16, alignItems: 'center' },
    policyLink: { fontFamily: bodyFont.regular, fontSize: 12, color: colors.text3 },
});
