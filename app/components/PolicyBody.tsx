import { ScrollView, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';

// The single shared rendering of the full privacy policy: first-run Welcome
// link, the official-server Accept screen, and the Settings row all use this.
// It is a component rather than a route because the setup stack is unmounted
// once serverUrl is set. Caps its own height — BottomSheet does not.
export default function PolicyBody({ maxHeight = 320, showTitle = true }: {
    maxHeight?: number;
    showTitle?: boolean;
}) {
    const { t } = useTranslation('onboarding');
    return (
        <>
            {showTitle && <Text style={styles.title}>{t('policy.fullTitle')}</Text>}
            <ScrollView style={[styles.scroll, { maxHeight }]}>
                <Text style={styles.body}>{t('policy.fullBody')}</Text>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    title: {
        fontFamily: displayFont.bold, fontSize: 11, letterSpacing: 1,
        color: colors.text3, marginBottom: 8,
    },
    scroll: { alignSelf: 'stretch' },
    body: {
        fontFamily: bodyFont.regular, fontSize: 13, lineHeight: 20, color: colors.text2,
    },
});
