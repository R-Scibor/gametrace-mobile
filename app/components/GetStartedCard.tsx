import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';
import { DISCORD_INVITE_URL } from '../config';

type Props = {
    onAddBot: () => void;
    onAddSession: () => void;
    onVoice: () => void;
    style?: StyleProp<ViewStyle>;
};

// Occupies the dashboard hero slot while the account has no tracked history.
// Shown for ERROR-only accounts too, so it keys off the store flag rather than
// the sample-preview condition.
export default function GetStartedCard({ onAddBot, onAddSession, onVoice, style }: Props) {
    const { t } = useTranslation('onboarding');

    const steps = [
        DISCORD_INVITE_URL ? { key: 'bot', label: t('getStarted.bot'), onPress: onAddBot } : null,
        { key: 'session', label: t('getStarted.session'), onPress: onAddSession },
        { key: 'voice', label: t('getStarted.voice'), onPress: onVoice },
    ].filter((s): s is { key: string; label: string; onPress: () => void } => s != null);

    return (
        <View style={[styles.card, style]}>
            <Text style={styles.title}>{t('getStarted.title')}</Text>
            <Text style={styles.intro}>{t('getStarted.intro')}</Text>
            {steps.map((step, index) => (
                <TouchableOpacity
                    key={step.key}
                    onPress={step.onPress}
                    activeOpacity={0.85}
                    style={styles.step}
                >
                    <Text style={styles.stepNum}>{index + 1}</Text>
                    <Text style={styles.stepLabel}>{step.label}</Text>
                    <Text style={styles.stepArrow}>→</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 20, marginTop: 4, marginBottom: 12,
        backgroundColor: colors.bg2, borderRadius: 4,
        borderWidth: 1, borderColor: colors.orange,
        paddingHorizontal: 14, paddingVertical: 12,
    },
    title: {
        fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 2, color: colors.orange,
    },
    intro: {
        fontFamily: bodyFont.regular, fontSize: 12, color: colors.text2,
        marginTop: 4, marginBottom: 10,
    },
    step: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border,
    },
    stepNum: {
        fontFamily: displayFont.bold, fontSize: 11, color: colors.orange,
        width: 14, textAlign: 'center',
    },
    stepLabel: { flex: 1, fontFamily: bodyFont.medium, fontSize: 13, color: colors.text },
    stepArrow: { fontFamily: displayFont.regular, fontSize: 13, color: colors.text3 },
});
