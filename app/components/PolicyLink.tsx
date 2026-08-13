import { Linking, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PRIVACY_POLICY_URL } from '../config';
import { colors } from '../theme/colors';
import { bodyFont } from '../theme/fonts';

// Sends the reader to the full privacy notice in the browser. Rendered on its
// own by the official-server gate, whose bullets already summarise the terms,
// and underneath the summary by PolicyBody everywhere else.
export default function PolicyLink() {
    const { t } = useTranslation('onboarding');
    return (
        <TouchableOpacity
            testID="policyLink"
            style={styles.row}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            activeOpacity={0.7}
        >
            <Text style={styles.text}>{t('policy.openFull')}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: { paddingVertical: 10, alignSelf: 'flex-start' },
    text: { fontFamily: bodyFont.regular, fontSize: 13, lineHeight: 20, color: colors.orange },
});
