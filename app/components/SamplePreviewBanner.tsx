import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';

type Props = {
    onDismiss: () => void;
    onAddSession: () => void;
    style?: StyleProp<ViewStyle>;
};

// Labels the fabricated preview on Dashboard / Library / Stats. Dismissal is the
// owning screen's local state — per screen, per app run, never persisted.
export default function SamplePreviewBanner({ onDismiss, onAddSession, style }: Props) {
    const { t } = useTranslation('common');

    return (
        <View style={[styles.banner, style]}>
            <View style={styles.rule} />
            <View style={styles.body}>
                <Text style={styles.label}>{t('sample.label')}</Text>
                <Text style={styles.text}>{t('sample.text')}</Text>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={onAddSession} activeOpacity={0.85}>
                        <Text style={styles.cta}>{t('sample.cta')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onDismiss} activeOpacity={0.85}>
                        <Text style={styles.dismiss}>{t('sample.dismiss')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row', overflow: 'hidden',
        backgroundColor: colors.bg2, borderRadius: 4,
        borderWidth: 1, borderColor: colors.border,
    },
    rule: { width: 3, backgroundColor: colors.orange, opacity: 0.7 },
    body: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
    label: {
        fontFamily: displayFont.bold, fontSize: 9, letterSpacing: 2, color: colors.orange,
    },
    text: {
        fontFamily: bodyFont.regular, fontSize: 12, color: colors.text3, marginTop: 4,
    },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
    cta: {
        fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 1.5, color: colors.orange,
    },
    dismiss: { fontFamily: bodyFont.regular, fontSize: 11, color: colors.text3 },
});
