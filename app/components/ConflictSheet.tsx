import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet, sheetStyles } from './BottomSheet';
import Cover from './Cover';
import type { ConflictResponse, ConflictingSession } from '../types/api';
import i18n from '../i18n';
import { intlLocale } from '../i18n/resolve';
import { colors } from '../theme/colors';
import { bodyFont, displayFont } from '../theme/fonts';

function formatRange(startIso: string, endIso: string | null): string {
    const fmt = (iso: string) =>
        new Date(iso).toLocaleString(intlLocale(i18n.language), {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    return endIso ? `${fmt(startIso)} – ${fmt(endIso)}` : fmt(startIso);
}

export default function ConflictSheet({
    conflict,
    onDismiss,
    onEdit,
}: {
    conflict: ConflictResponse;
    onDismiss: () => void;
    onEdit: (session: ConflictingSession) => void;
}) {
    const { t } = useTranslation('common');
    const session = conflict.conflicting_session;
    const editable = session.status === 'COMPLETED' || session.status === 'ERROR';

    return (
        <BottomSheet visible onClose={onDismiss} title={t('conflict.heading')}>
            <Text style={[sheetStyles.message, { marginBottom: 16 }]}>{conflict.detail}</Text>
            <View style={styles.row}>
                <Cover
                    gameId={session.game_id}
                    fallbackUri={session.game.cover_image_url}
                    style={styles.cover}
                    placeholderChar={session.game.primary_name[0]}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.name} numberOfLines={1}>{session.game.primary_name}</Text>
                    <Text style={styles.times}>{formatRange(session.start_time, session.end_time)}</Text>
                </View>
            </View>
            {editable ? (
                <TouchableOpacity style={sheetStyles.primaryRow} onPress={() => onEdit(session)} activeOpacity={0.7}>
                    <Text style={sheetStyles.primaryRowText}>{t('conflict.edit')}</Text>
                </TouchableOpacity>
            ) : null}
            <TouchableOpacity
                style={editable ? [sheetStyles.row, sheetStyles.rowLast] : sheetStyles.primaryRow}
                onPress={onDismiss}
                activeOpacity={0.7}
            >
                <Text style={editable ? [sheetStyles.rowText, sheetStyles.rowMuted] : sheetStyles.primaryRowText}>
                    {t('actions.understood')}
                </Text>
            </TouchableOpacity>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    cover: { width: 32, height: 44, borderRadius: 2, backgroundColor: colors.bg3 },
    name: { fontFamily: bodyFont.medium, fontSize: 14, color: colors.text },
    times: { fontFamily: displayFont.regular, fontSize: 11, color: colors.text3, marginTop: 2 },
});
