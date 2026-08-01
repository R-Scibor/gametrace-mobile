import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import ConfirmSheet from './ConfirmSheet';
import { useServerJoinStore } from '../store/serverJoinStore';
import { DISCORD_INVITE_URL } from '../config';

// Prompts a freshly-logged-in Discord user to add the GameTrace bot to their
// server so presence tracking produces data. Non-blocking — they're already in.
export default function ServerJoinHost() {
    const { t } = useTranslation('server');
    const visible = useServerJoinStore((s) => s.visible);
    const hide = useServerJoinStore((s) => s.hide);

    return (
        <ConfirmSheet
            visible={visible}
            title={t('join.title')}
            message={t('join.message')}
            confirmLabel={t('join.confirm')}
            cancelLabel={t('join.cancel')}
            onConfirm={() => {
                if (DISCORD_INVITE_URL) Linking.openURL(DISCORD_INVITE_URL);
                hide();
            }}
            onCancel={hide}
        />
    );
}
