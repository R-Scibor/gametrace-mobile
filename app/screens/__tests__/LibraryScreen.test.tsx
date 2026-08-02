import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LibraryScreen, { computeGrid } from '../LibraryScreen';
import { getGames } from '../../api/games';
import { useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';
import { useEmptyAccountStore } from '../../store/emptyAccountStore';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('../../api/games', () => ({ getGames: jest.fn() }));

const mockNavigate = jest.fn();
const mockSetParams = jest.fn();
let mockRouteParams: any = undefined;
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, setParams: mockSetParams }),
  useRoute: () => ({ params: mockRouteParams }),
  // Re-runs (cleanup then callback) whenever the memoized callback's identity
  // changes, matching @react-navigation/core's real useFocusEffect behavior.
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), [cb]);
  },
}));

beforeEach(async () => {
  await AsyncStorage.clear();
  useServerStore.setState({ serverUrl: 'https://s.example/api/v1' });
  useAuthStore.setState({ token: 't', user: { discordId: '1', username: 'u' }, isAdmin: false, isAuthenticated: true });
  (getGames as jest.Mock).mockReset();
  (getGames as jest.Mock).mockResolvedValue({ total: 0, items: [] });
  mockNavigate.mockReset();
  mockSetParams.mockReset();
  mockSetParams.mockImplementation((updates: any) => {
    mockRouteParams = { ...mockRouteParams, ...updates };
  });
  mockRouteParams = undefined;
  useEmptyAccountStore.setState({ isEmpty: null });
});

function renderScreen() {
  return render(
    <SafeAreaProvider>
      <LibraryScreen />
    </SafeAreaProvider>
  );
}

describe('computeGrid', () => {
  test('keeps 2 columns across the phone width range', () => {
    expect(computeGrid(320).columns).toBe(2); // small Android
    expect(computeGrid(390).columns).toBe(2); // typical phone
    expect(computeGrid(440).columns).toBe(2); // large phone
  });

  test('adds columns on tablet-width viewports', () => {
    expect(computeGrid(768).columns).toBe(3);
    expect(computeGrid(1024).columns).toBe(5);
  });

  test('cover fills its share of the row width and keeps IGDB aspect', () => {
    const { columns, cellWidth, cellHeight } = computeGrid(390);
    // 390 - 28 padding = 362 available, /2 cols = 181 outer, -24 margin+pad = 157
    expect(cellWidth).toBe(157);
    expect(cellHeight).toBe(Math.round(157 * 362 / 264));
    expect(columns).toBe(2);
  });
});

test('tapping the playtime sort pill refetches sorted by playtime', async () => {
  const { getByText } = await renderScreen();

  await fireEvent.press(getByText('CZAS GRY'));

  await waitFor(() => expect(getGames).toHaveBeenCalledWith(expect.objectContaining({ sort: 'playtime', skip: 0 })));
});

test('arriving with a filter param shows the chip and sorts by playtime', async () => {
  mockRouteParams = { filter: { type: 'genre', value: 'Role-playing (RPG)' } };

  const { getByText } = await renderScreen();

  expect(getByText('Gatunek: Role-playing (RPG)')).toBeTruthy();
  await waitFor(() => expect(getGames).toHaveBeenCalledWith(expect.objectContaining({
    sort: 'playtime',
    filter: { type: 'genre', value: 'Role-playing (RPG)' },
  })));
  expect(mockSetParams).toHaveBeenCalledWith({ filter: undefined });
});

test('dismissing the chip refetches without the filter', async () => {
  mockRouteParams = { filter: { type: 'developer', value: 'FromSoftware' } };

  const { getByText, queryByText } = await renderScreen();
  (getGames as jest.Mock).mockClear();

  await fireEvent.press(getByText('✕'));

  expect(queryByText('Deweloper: FromSoftware')).toBeNull();
  await waitFor(() => expect(getGames).toHaveBeenCalledWith(expect.objectContaining({ filter: undefined })));
});

test('regression: drill-down filter survives the setParams round-trip', async () => {
  mockRouteParams = { filter: { type: 'genre', value: 'RPG' } };

  const { getByText, rerender } = await renderScreen();

  expect(getByText('Gatunek: RPG')).toBeTruthy();

  // Mirrors what @react-navigation/core does after setParams({ filter: undefined })
  // resolves: route.params?.filter changes X -> undefined, which is what churns
  // the intake callback's identity and re-runs the focus effect's cleanup.
  await rerender(
    <SafeAreaProvider>
      <LibraryScreen />
    </SafeAreaProvider>
  );

  expect(getByText('Gatunek: RPG')).toBeTruthy();
  await waitFor(() => expect(getGames).toHaveBeenLastCalledWith(expect.objectContaining({
    filter: { type: 'genre', value: 'RPG' },
  })));
});

const GAME = {
  id: 1, primary_name: 'Hollow Knight', cover_image_url: null,
  enrichment_status: 'ENRICHED', is_accepted: true, is_ignored: false,
};

test('offline revisit shows the cached first page with the stale banner', async () => {
  (getGames as jest.Mock).mockResolvedValue({ total: 1, items: [GAME] });
  const first = await renderScreen();
  await waitFor(() => expect(first.getByText('Hollow Knight')).toBeTruthy());
  await waitFor(async () => {
    const keys = await AsyncStorage.getAllKeys();
    expect(keys.some((k) => k.includes('library:tab='))).toBe(true);
  });
  await first.unmount();

  (getGames as jest.Mock).mockRejectedValue(new Error('net'));
  const { getByText } = await renderScreen();

  await waitFor(() => expect(getByText(/Dane offline/)).toBeTruthy());
  expect(getByText('Hollow Knight')).toBeTruthy();
});

test('an empty account sees the sample grid behind a banner', async () => {
  useEmptyAccountStore.setState({ isEmpty: true });
  (getGames as jest.Mock).mockResolvedValue({ total: 0, items: [] });

  const { getByText } = await renderScreen();

  await waitFor(() => expect(getByText('PRZYKŁADOWE DANE')).toBeTruthy());
  expect(getByText("Baldur's Gate 3")).toBeTruthy();
});

test('the header count follows the sample grid, not the live zero total', async () => {
  useEmptyAccountStore.setState({ isEmpty: true });
  (getGames as jest.Mock).mockResolvedValue({ total: 0, items: [] });

  const { getByText, queryByText } = await renderScreen();

  await waitFor(() => expect(getByText('PRZYKŁADOWE DANE')).toBeTruthy());
  // "0 GIER" sitting above eight sample covers contradicts itself
  expect(queryByText('0 GIER')).toBeNull();
  expect(getByText('8 GIER')).toBeTruthy();
});

test('real games always win over the preview', async () => {
  useEmptyAccountStore.setState({ isEmpty: true });
  (getGames as jest.Mock).mockResolvedValue({
    total: 1,
    items: [{
      id: 9, primary_name: 'Hollow Knight', cover_image_url: null, cover_source: 'EXTERNAL',
      enrichment_status: 'ENRICHED', is_ignored: false, is_accepted: true,
      total_seconds: 3600, last_played: new Date().toISOString(),
    }],
  });

  const { getByText, queryByText } = await renderScreen();

  await waitFor(() => expect(getByText('Hollow Knight')).toBeTruthy());
  expect(queryByText('PRZYKŁADOWE DANE')).toBeNull();
  expect(queryByText("Baldur's Gate 3")).toBeNull();
});

test('an undetermined flag suppresses the preview', async () => {
  useEmptyAccountStore.setState({ isEmpty: null });
  (getGames as jest.Mock).mockResolvedValue({ total: 0, items: [] });

  const { queryByText } = await renderScreen();

  await waitFor(() => expect(queryByText('PRZYKŁADOWE DANE')).toBeNull());
});

test('typing a search query hides the preview', async () => {
  useEmptyAccountStore.setState({ isEmpty: true });
  (getGames as jest.Mock).mockResolvedValue({ total: 0, items: [] });

  const { getByText, getByPlaceholderText, queryByText } = await renderScreen();

  await waitFor(() => expect(getByText('PRZYKŁADOWE DANE')).toBeTruthy());

  await fireEvent.changeText(getByPlaceholderText('Szukaj gry...'), 'zelda');

  await waitFor(() => expect(queryByText('PRZYKŁADOWE DANE')).toBeNull());
  expect(queryByText("Baldur's Gate 3")).toBeNull();
});

test('pressing a sample cell during preview does not navigate to GameDetail', async () => {
  useEmptyAccountStore.setState({ isEmpty: true });
  (getGames as jest.Mock).mockResolvedValue({ total: 0, items: [] });

  const { getByText } = await renderScreen();

  await waitFor(() => expect(getByText("Baldur's Gate 3")).toBeTruthy());
  await fireEvent.press(getByText("Baldur's Gate 3"));

  expect(mockNavigate).not.toHaveBeenCalledWith('GameDetail', expect.anything());
});
