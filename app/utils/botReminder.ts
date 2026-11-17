import AsyncStorage from '@react-native-async-storage/async-storage';

// "The bot cannot see you" reminder. Same rules as the web app: shown only when
// the backend says the bot cannot see the user, reminders are enabled and not
// snoozed, and at most once per day in the user's timezone (kept on device).

const PREFIX = 'gt.botReminder.shownOn.';
const SNOOZE_DAYS = 7;

export function reminderStorageKey(discordId: string): string {
    return `${PREFIX}${discordId}`;
}

/** YYYY-MM-DD in the given IANA zone. Falls back to the device zone. */
export function todayInZone(timeZone: string, now = new Date()): string {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    try {
        return new Intl.DateTimeFormat('en-CA', { ...options, timeZone }).format(now);
    } catch {
        return new Intl.DateTimeFormat('en-CA', options).format(now);
    }
}

export async function markReminderShown(discordId: string, timeZone: string, now = new Date()): Promise<void> {
    await AsyncStorage.setItem(reminderStorageKey(discordId), todayInZone(timeZone, now));
}

export async function reminderShownToday(discordId: string, timeZone: string, now = new Date()): Promise<boolean> {
    return (await AsyncStorage.getItem(reminderStorageKey(discordId))) === todayInZone(timeZone, now);
}

export function snoozeUntilIso(now = Date.now()): string {
    return new Date(now + SNOOZE_DAYS * 86_400_000).toISOString().replace('Z', '+00:00');
}

/** Server-side conditions only; the once-a-day check is reminderShownToday. */
export function reminderWanted(input: {
    botCanSeeUser?: boolean | null;
    enabled?: boolean;
    snoozedUntil?: string | null;
    now?: Date;
}): boolean {
    if (input.botCanSeeUser !== false) return false;
    if (input.enabled === false) return false;
    if (input.snoozedUntil) {
        const until = Date.parse(input.snoozedUntil);
        const now = (input.now ?? new Date()).getTime();
        if (!Number.isNaN(until) && until > now) return false;
    }
    return true;
}
