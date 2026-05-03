import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

/**
 * Formats uptime seconds into a human-readable tactical format (e.g. "14d 2h" or "5h 30m").
 */
export function formatUptime(s: number | null): string {
    if (s == null) return '—';
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

/**
 * Returns the status color style for the bot.
 */
export function botColor(status: string) {
    if (status === 'online') return botStyles.statusOnline;
    if (status === 'offline') return botStyles.statusOffline;
    return botStyles.statusUnknown;
}

const botStyles = StyleSheet.create({
    statusOnline: { color: colors.orange },
    statusOffline: { color: colors.warn },
    statusUnknown: { color: colors.text3 },
});
