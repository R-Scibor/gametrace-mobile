import { useEffect, useState } from 'react';
import { Linking, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet, sheetStyles } from './BottomSheet';
import { getProfile, updateSettings } from '../api/profile';
import { DISCORD_INVITE_URL, DISCORD_SERVER_INVITE_URL } from '../config';
import { useServerJoinStore } from '../store/serverJoinStore';
import { useAlertStore } from '../store/alertStore';
import { markReminderShown, reminderShownToday, reminderWanted, snoozeUntilIso } from '../utils/botReminder';

type Shown = { discordId: string; timeZone: string };

// "The bot cannot see you" sheet. Checks the profile once per app start while
// signed in. Rules live in utils/botReminder. The post-login server join sheet
// wins when both would show at the same time.
export default function BotReminderHost() {
    const { t } = useTranslation('server');
    const joinVisible = useServerJoinStore((s) => s.visible);
    const [shown, setShown] = useState<Shown | null>(null);
    const [snoozing, setSnoozing] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const profile = await getProfile();
                const wanted = reminderWanted({
                    botCanSeeUser: profile.bot_can_see_user,
                    enabled: profile.bot_visibility_reminders_enabled,
                    snoozedUntil: profile.bot_visibility_reminder_snoozed_until,
                });
                if (!wanted || cancelled) return;
                if (await reminderShownToday(profile.discord_id, profile.timezone)) return;
                if (!cancelled) setShown({ discordId: profile.discord_id, timeZone: profile.timezone });
            } catch {
                // No profile, no reminder.
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (!shown || joinVisible) return null;

    const close = () => {
        void markReminderShown(shown.discordId, shown.timeZone);
        setShown(null);
    };

    const open = (url: string) => {
        void Linking.openURL(url);
        close();
    };

    const snooze = async () => {
        if (snoozing) return;
        setSnoozing(true);
        try {
            await updateSettings({ bot_visibility_reminder_snoozed_until: snoozeUntilIso() });
        } catch {
            useAlertStore.getState().showAlert(t('botReminder.snoozeFailedTitle'), t('botReminder.snoozeFailed'));
        }
        setSnoozing(false);
        close();
    };

    return (
        <BottomSheet visible onClose={close} title={t('botReminder.title')}>
            <Text style={[sheetStyles.message, { marginBottom: 24 }]}>{t('botReminder.message')}</Text>
            {DISCORD_SERVER_INVITE_URL ? (
                <TouchableOpacity style={sheetStyles.primaryRow} onPress={() => open(DISCORD_SERVER_INVITE_URL)} activeOpacity={0.7}>
                    <Text style={sheetStyles.primaryRowText}>{t('botReminder.join')}</Text>
                </TouchableOpacity>
            ) : null}
            {DISCORD_INVITE_URL ? (
                <TouchableOpacity
                    style={DISCORD_SERVER_INVITE_URL ? sheetStyles.row : sheetStyles.primaryRow}
                    onPress={() => open(DISCORD_INVITE_URL)}
                    activeOpacity={0.7}
                >
                    <Text style={DISCORD_SERVER_INVITE_URL ? sheetStyles.rowText : sheetStyles.primaryRowText}>
                        {t('botReminder.addBot')}
                    </Text>
                </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={sheetStyles.row} onPress={() => void snooze()} disabled={snoozing} activeOpacity={0.7}>
                <Text style={sheetStyles.rowText}>{t('botReminder.snooze')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[sheetStyles.row, sheetStyles.rowLast]} onPress={close} activeOpacity={0.7}>
                <Text style={[sheetStyles.rowText, sheetStyles.rowMuted]}>{t('botReminder.close')}</Text>
            </TouchableOpacity>
        </BottomSheet>
    );
}
