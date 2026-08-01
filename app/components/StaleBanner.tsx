import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { intlLocale } from '../i18n/resolve';
import { colors } from '../theme/colors';
import { bodyFont } from '../theme/fonts';

export function formatLastSync(ts: number, now: Date = new Date(), locale?: string): string {
    const loc = locale ?? intlLocale(i18n.language);
    const d = new Date(ts);
    const sameDay =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate();
    const time = d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
    if (sameDay) return time;
    const date = d.toLocaleDateString(loc, { day: '2-digit', month: 'short' });
    return `${date}, ${time}`;
}

type Props = {
    lastSyncTime: number;
    style?: StyleProp<ViewStyle>;
};

// Compact, purely informational — no retry button; each screen's existing
// triggers (poll, focus, pull-to-refresh) already refetch.
export default function StaleBanner({ lastSyncTime, style }: Props) {
    const { t } = useTranslation('common');
    return (
        <View style={[styles.container, style]}>
            <View style={styles.bar} />
            <Text style={styles.text}>
                {t('stale.message', { time: formatLastSync(lastSyncTime) })}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.bg2,
        borderWidth: 1, borderColor: colors.border,
    },
    bar: { width: 2, backgroundColor: colors.orange },
    text: {
        flex: 1, paddingHorizontal: 14, paddingVertical: 8,
        fontFamily: bodyFont.regular, fontSize: 12, color: colors.text3,
    },
});
