import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStatsSummary } from '../api/stats';
import { StatsSummary } from '../types/api';
import { colors } from '../theme/colors';
import { bodyFont, displayFont } from '../theme/fonts';
import { common } from '../theme/styles';
import ErrorBanner from '../components/ErrorBanner';

const PERIODS = [7, 30, 90] as const;
type Period = typeof PERIODS[number];

function formatHours(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function StatsScreen() {
    const [days, setDays] = useState<Period>(7);
    const [data, setData] = useState<StatsSummary | null>(null);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const summary = await getStatsSummary(days);
                setData(summary);
                setLoadError(false);
            } catch {
                setLoadError(true);
            }
        })();
    }, [days]);

    return (
        <SafeAreaView style={common.safe} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={common.eyebrow}>◈ GAMETRACE</Text>
                    <Text style={common.title}>Statystyki</Text>
                </View>

                {/* Period selector */}
                <Text style={common.label}>OKRES</Text>
                <View style={styles.periodRow}>
                    {PERIODS.map(p => {
                        const active = days === p;
                        return (
                            <TouchableOpacity
                                key={p}
                                style={[styles.period, active && styles.periodActive]}
                                onPress={() => setDays(p)}
                                activeOpacity={0.85}
                            >
                                <Text style={[styles.periodText, active && styles.periodTextActive]}>
                                    {p} DNI
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {loadError && <ErrorBanner message="Nie udało się pobrać statystyk." style={styles.errorWrap} />}

                {/* Total */}
                <Text style={common.label}>ŁĄCZNIE</Text>
                <Text style={styles.totalValue}>{data ? formatHours(data.total_seconds) : '—'}</Text>
                <Text style={styles.totalSub}>w ciągu ostatnich {days} dni</Text>

                {/* Ranking */}
                <Text style={common.label}>RANKING GIER</Text>
                {!data || data.per_game.length === 0 ? (
                    <Text style={styles.empty}>Brak sesji w tym okresie</Text>
                ) : (
                    data.per_game.map((item, i) => (
                        <View
                            key={item.game_id}
                            style={[styles.row, i < data.per_game.length - 1 && styles.rowBorder]}
                        >
                            <Text style={styles.rank}>{String(i + 1).padStart(2, '0')}</Text>
                            <Text style={styles.gameName} numberOfLines={1}>{item.game_name}</Text>
                            <Text style={styles.gameTime}>{formatHours(item.total_seconds)}</Text>
                        </View>
                    ))
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    header: { paddingTop: 16, paddingBottom: 20 },

    periodRow: { flexDirection: 'row', gap: 8 },
    period: {
        flex: 1,
        backgroundColor: colors.bg3,
        borderWidth: 1, borderColor: colors.borderBright,
        borderRadius: 2,
        paddingVertical: 12,
        alignItems: 'center',
    },
    periodActive: { backgroundColor: colors.orange, borderColor: colors.orange },
    periodText: {
        fontFamily: displayFont.bold, fontSize: 12, letterSpacing: 2,
        color: colors.text3,
    },
    periodTextActive: { color: colors.buttonTextOnOrange },

    totalValue: {
        fontFamily: displayFont.bold, fontSize: 44, letterSpacing: -1,
        color: colors.orange,
    },
    totalSub: {
        fontFamily: bodyFont.regular, fontSize: 13, color: colors.text3,
        marginTop: 2,
    },

    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12,
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    rank: {
        width: 32,
        fontFamily: displayFont.bold, fontSize: 14, letterSpacing: 1,
        color: colors.text3,
    },
    gameName: { flex: 1, fontFamily: bodyFont.medium, fontSize: 15, color: colors.text },
    gameTime: { fontFamily: bodyFont.medium, fontSize: 14, color: colors.text2 },

    empty: { fontFamily: bodyFont.regular, fontSize: 14, color: colors.text3, marginTop: 8 },
    errorWrap: { marginTop: 16 },
});
