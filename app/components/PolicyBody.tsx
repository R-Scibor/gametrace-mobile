import { Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import PolicyLink from './PolicyLink';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';

// The in-app privacy summary: the first-run Welcome sheet and the Settings sheet
// both use this. Only a summary — the full notice is on the web (see PolicyLink),
// so it can be revised without an app build and cannot drift from the web copy.
// It is a component rather than a route because the setup stack is unmounted
// once serverUrl is set.
export default function PolicyBody({ showTitle = true }: { showTitle?: boolean }) {
    const { t } = useTranslation('onboarding');
    return (
        <>
            {showTitle && <Text style={styles.title}>{t('policy.fullTitle')}</Text>}
            <Text style={styles.body}>{t('policy.summary')}</Text>
            <PolicyLink />
        </>
    );
}

const styles = StyleSheet.create({
    title: {
        fontFamily: displayFont.bold, fontSize: 11, letterSpacing: 1,
        color: colors.text3, marginBottom: 8,
    },
    body: {
        fontFamily: bodyFont.regular, fontSize: 13, lineHeight: 20, color: colors.text2,
    },
});
