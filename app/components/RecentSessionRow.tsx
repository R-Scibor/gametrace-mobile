import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Cover from './Cover';
import { Session } from '../types/api';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';
import { formatDuration } from '../utils/duration';
import i18n from '../i18n';
import { intlLocale } from '../i18n/resolve';

const fmtDateShort = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(intlLocale(i18n.language), { day: '2-digit', month: 'short' });
};

type Props = {
    session: Session;
    /** Omitted for sample-preview rows, which must not be pressable at all. */
    onPress?: () => void;
};

export default function RecentSessionRow({ session, onPress }: Props) {
    const { t } = useTranslation('dashboard');
    const isError = session.status === 'ERROR';

    const body = (
        <>
            <Cover
                gameId={session.game_id}
                fallbackUri={session.game.cover_image_url}
                style={styles.sessionCover}
                placeholderChar={session.game.primary_name?.[0]}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.sessionName} numberOfLines={1}>{session.game.primary_name}</Text>
                <Text style={styles.sessionMeta}>
                    {session.source === 'BOT' ? '⬡' : '✎'}  {fmtDateShort(session.start_time)}
                </Text>
            </View>
            {isError ? (
                <Text style={styles.errorBadge}>{t('errorBadge')}</Text>
            ) : (
                <Text style={styles.sessionDuration}>{formatDuration(session.duration_seconds)}</Text>
            )}
        </>
    );

    const style = [styles.sessionRow, isError && styles.sessionRowError];

    if (!onPress) return <View style={style}>{body}</View>;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={style}>
            {body}
        </TouchableOpacity>
    );
}

// Keep ROW_HEIGHT in DashboardScreen in sync with these paddings.
const styles = StyleSheet.create({
    sessionRow: {
        marginHorizontal: 20, marginBottom: 4,
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 10, paddingVertical: 8, borderRadius: 3,
        borderWidth: 1, borderColor: 'transparent',
    },
    sessionRowError: { backgroundColor: colors.warnTint, borderColor: colors.warnBorder },
    sessionCover: { width: 32, height: 44, borderRadius: 2, backgroundColor: colors.bg3 },
    sessionName: { fontFamily: bodyFont.medium, fontSize: 13, color: colors.text },
    sessionMeta: { fontFamily: bodyFont.regular, fontSize: 11, color: colors.text3, marginTop: 2 },
    sessionDuration: { fontFamily: displayFont.regular, fontSize: 13, color: colors.text2 },
    errorBadge: {
        fontFamily: displayFont.bold, fontSize: 9, letterSpacing: 2, color: colors.warn,
    },
});
