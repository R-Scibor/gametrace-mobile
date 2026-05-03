export const FALLBACK_ZONES = [
    'UTC',
    'Europe/Warsaw', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Madrid', 'Europe/Rome', 'Europe/Moscow', 'Europe/Istanbul',
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Toronto', 'America/Mexico_City', 'America/Sao_Paulo', 'America/Buenos_Aires',
    'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore', 'Asia/Seoul', 'Asia/Bangkok', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Jakarta',
    'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth',
    'Pacific/Auckland',
    'Africa/Cairo', 'Africa/Johannesburg',
];

export function getAllZones(): string[] {
    try {
        const fn = (Intl as any).supportedValuesOf;
        if (typeof fn === 'function') return fn('timeZone');
    } catch {
        // TODO
    }
    return FALLBACK_ZONES;
}
