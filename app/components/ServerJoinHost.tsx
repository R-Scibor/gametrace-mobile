import { Linking } from 'react-native';
import ConfirmSheet from './ConfirmSheet';
import { useServerJoinStore } from '../store/serverJoinStore';
import { DISCORD_INVITE_URL } from '../config';

// Prompts a freshly-logged-in Discord user to add the GameTrace bot to their
// server so presence tracking produces data. Non-blocking — they're already in.
export default function ServerJoinHost() {
    const visible = useServerJoinStore((s) => s.visible);
    const hide = useServerJoinStore((s) => s.hide);

    return (
        <ConfirmSheet
            visible={visible}
            title="Dodaj bota do serwera"
            message="Aby GameTrace śledził Twoją rozgrywkę, dodaj bota do swojego serwera Discord."
            confirmLabel="Dodaj bota"
            cancelLabel="Później"
            onConfirm={() => {
                if (DISCORD_INVITE_URL) Linking.openURL(DISCORD_INVITE_URL);
                hide();
            }}
            onCancel={hide}
        />
    );
}
