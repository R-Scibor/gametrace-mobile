import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Cover from './Cover';
import { GameStats, Session } from '../types/api';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';
import i18n from '../i18n';
import { intlLocale } from '../i18n/resolve';

const fmtHours = (seconds: number) => (seconds / 3600).toFixed(1);

const fmtRecency = (iso: string) => {
    const then = new Date(iso);
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round((startOfDay(new Date()) - startOfDay(then)) / 86400000);
    if (days <= 0) return i18n.t('dashboard:hero.playedToday');
    if (days === 1) return i18n.t('dashboard:hero.playedYesterday');
    if (days < 7) return i18n.t('dashboard:hero.playedDaysAgo', { days });
    const date = then.toLocaleDateString(intlLocale(i18n.language), { day: '2-digit', month: 'short' });
    return i18n.t('dashboard:hero.playedOn', { date });
};

type Props = {
    session: Session;
    stats: GameStats | null;
    onPress: () => void;
    /** Sample-preview mode: render normally but swallow taps. */
    disabled?: boolean;
};

export default function HeroSpotlight({ session, stats, onPress, disabled }: Props) {
    const { t } = useTranslation('dashboard');
    const avgSeconds = stats && stats.session_count > 0
        ? stats.total_seconds / stats.session_count
        : null;

    return (
        <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={disabled} style={styles.card}>
            <View style={styles.row}>
                <View style={styles.coverWrap}>
                    <Cover
                        gameId={session.game_id}
                        fallbackUri={session.game.cover_image_url}
                        style={styles.cover}
                        placeholderChar={session.game.primary_name?.[0]}
                    />
                </View>
                <View style={styles.meta}>
                    <Text style={styles.name} numberOfLines={1}>{session.game.primary_name}</Text>
                    <Text style={styles.recency}>{fmtRecency(session.end_time ?? session.start_time)}</Text>
                    <View style={styles.bottom}>
                        <View>
                            <Text style={styles.statLabel}>{t('hero.total')}</Text>
                            <View style={styles.bigRow}>
                                <Text style={styles.big}>{stats ? fmtHours(stats.total_seconds) : '—'}</Text>
                                <Text style={styles.bigUnit}>h</Text>
                            </View>
                        </View>
                        <View style={styles.sideStats}>
                            <View>
                                <Text style={styles.statLabel}>{t('hero.sessions')}</Text>
                                <Text style={styles.statValue}>{stats ? stats.session_count : '—'}</Text>
                            </View>
                            <View>
                                <Text style={styles.statLabel}>{t('hero.avgSession')}</Text>
                                <Text style={styles.statValue}>{avgSeconds != null ? `${fmtHours(avgSeconds)}h` : '—'}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 20, marginTop: 4, marginBottom: 12,
        backgroundColor: colors.bg2, borderRadius: 4, overflow: 'hidden',
        borderWidth: 1, borderColor: colors.border,
    },
    row: { flexDirection: 'row', height: 124 },
    coverWrap: { height: '100%', aspectRatio: 264 / 362 },
    cover: { width: '100%', height: '100%' },
    meta: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
    name: { fontFamily: displayFont.bold, fontSize: 15, color: colors.text, lineHeight: 18 },
    recency: { fontFamily: bodyFont.regular, fontSize: 11, color: colors.text3 },
    bottom: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 'auto' },
    statLabel: {
        fontFamily: displayFont.bold, fontSize: 9, letterSpacing: 1.5, color: colors.text3, marginBottom: 3,
    },
    bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
    big: {
        fontFamily: displayFont.bold, fontSize: 26, letterSpacing: -0.5, color: colors.orange, lineHeight: 26,
    },
    bigUnit: { fontFamily: displayFont.regular, fontSize: 13, color: colors.text3 },
    sideStats: { marginLeft: 'auto', flexDirection: 'row', gap: 16, paddingBottom: 1 },
    statValue: { fontFamily: displayFont.bold, fontSize: 13, color: colors.text2 },
});
