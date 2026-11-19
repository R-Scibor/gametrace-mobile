import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    markReminderShown,
    reminderShownToday,
    reminderStorageKey,
    reminderWanted,
    snoozeUntilIso,
    todayInZone,
} from '../botReminder';

beforeEach(async () => {
    await AsyncStorage.clear();
});

describe('reminderWanted', () => {
    const now = new Date('2026-11-17T12:00:00Z');

    test('only when the bot reports it cannot see the user', () => {
        expect(reminderWanted({ botCanSeeUser: false, enabled: true, now })).toBe(true);
        expect(reminderWanted({ botCanSeeUser: true, enabled: true, now })).toBe(false);
        expect(reminderWanted({ botCanSeeUser: null, enabled: true, now })).toBe(false);
        expect(reminderWanted({ enabled: true, now })).toBe(false);
    });

    test('respects the opt-out', () => {
        expect(reminderWanted({ botCanSeeUser: false, enabled: false, now })).toBe(false);
    });

    test('hidden while snoozed, shown once the snooze has passed', () => {
        expect(
            reminderWanted({ botCanSeeUser: false, enabled: true, snoozedUntil: '2026-11-20T00:00:00+00:00', now }),
        ).toBe(false);
        expect(
            reminderWanted({ botCanSeeUser: false, enabled: true, snoozedUntil: '2026-11-10T00:00:00+00:00', now }),
        ).toBe(true);
    });
});

test('todayInZone uses the user timezone', () => {
    const late = new Date('2026-11-17T23:30:00Z');
    expect(todayInZone('Europe/Warsaw', late)).toBe('2026-11-18');
    expect(todayInZone('UTC', late)).toBe('2026-11-17');
});

test('todayInZone falls back on a bad zone', () => {
    expect(todayInZone('Not/AZone', new Date('2026-11-17T12:00:00Z'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test('shown at most once per local day', async () => {
    const day1 = new Date('2026-11-17T10:00:00Z');
    const day2 = new Date('2026-11-18T10:00:00Z');
    expect(await reminderShownToday('42', 'Europe/Warsaw', day1)).toBe(false);
    await markReminderShown('42', 'Europe/Warsaw', day1);
    expect(await reminderShownToday('42', 'Europe/Warsaw', day1)).toBe(true);
    expect(await reminderShownToday('42', 'Europe/Warsaw', day2)).toBe(false);
    expect(await reminderShownToday('7', 'Europe/Warsaw', day1)).toBe(false);
    expect(await AsyncStorage.getItem(reminderStorageKey('42'))).toBe('2026-11-17');
});

test('snooze is seven days ahead with an explicit offset', () => {
    const now = Date.parse('2026-11-17T12:00:00Z');
    expect(snoozeUntilIso(now)).toBe('2026-11-24T12:00:00.000+00:00');
});
