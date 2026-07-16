import { useState } from 'react';
import { getProfile, updateSettings } from '../api/profile';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';

// Bridges the local settingsStore (display/persistence) with the backend,
// which is the source of truth for the user's timezone. select() updates
// optimistically and reverts on failure; sync() seeds the store from the
// server and also refreshes isAdmin, since profile is fetched here anyway.
export function useTimezone() {
    const timezone = useSettingsStore((s) => s.timezone);
    const setTimezone = useSettingsStore((s) => s.setTimezone);
    const [error, setError] = useState(false);

    const sync = async () => {
        try {
            const profile = await getProfile();
            setTimezone(profile.timezone);
            useAuthStore.getState().setIsAdmin(profile.is_admin);
        } catch {
            // Backend unreachable — keep the persisted local value.
        }
    };

    const select = async (zone: string) => {
        const previous = useSettingsStore.getState().timezone;
        if (zone === previous) return;
        setTimezone(zone);
        try {
            await updateSettings({ timezone: zone });
        } catch {
            setTimezone(previous);
            setError(true);
        }
    };

    return { timezone, select, sync, error, clearError: () => setError(false) };
}
