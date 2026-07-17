import React from 'react';
import { render } from '@testing-library/react-native';
import StaleBanner, { formatLastSync } from '../StaleBanner';

test('same-day timestamps show time only', () => {
    const now = new Date(2026, 6, 16, 15, 0);
    const ts = new Date(2026, 6, 16, 14, 32).getTime();

    expect(formatLastSync(ts, now)).toBe('14:32');
});

test('other-day timestamps include the short date', () => {
    const now = new Date(2026, 6, 16, 15, 0);
    const ts = new Date(2026, 6, 12, 14, 32).getTime();

    // Locale-resilient: "12 lip, 14:32" on device; month text may vary in CI ICU.
    expect(formatLastSync(ts, now)).toMatch(/^12 .+, 14:32$/);
});

test('renders the offline copy with the sync time', async () => {
    const { getByText } = await render(<StaleBanner lastSyncTime={Date.now()} />);

    expect(getByText(/Dane offline · ostatnia synchronizacja/)).toBeTruthy();
});
