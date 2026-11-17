import { useEffect, useState } from 'react';
import { getProfile, updateSettings } from '../api/profile';

// Opt-out for the "bot cannot see you" reminder. null until the profile loads,
// and stays null on a server that does not know the setting, so the row hides.
export function useBotReminderSetting() {
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const profile = await getProfile();
                if (!cancelled && typeof profile.bot_visibility_reminders_enabled === 'boolean') {
                    setEnabled(profile.bot_visibility_reminders_enabled);
                }
            } catch {
                // Leave the row hidden.
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const toggle = async (next: boolean) => {
        const previous = enabled;
        setEnabled(next);
        try {
            await updateSettings({ bot_visibility_reminders_enabled: next });
        } catch {
            setEnabled(previous);
            setError(true);
        }
    };

    return { enabled, toggle, error, clearError: () => setError(false) };
}
