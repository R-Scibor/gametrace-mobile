import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import StatsScreen from '../StatsScreen';
import { useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';
import { useEmptyAccountStore } from '../../store/emptyAccountStore';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../api/stats', () => ({
  getStatsSummary: jest.fn(),
  getHeatmap: jest.fn(),
  getTrend: jest.fn(),
  getGenres: jest.fn(),
  getThemes: jest.fn(),
  getReleaseYears: jest.fn(),
  getCompanies: jest.fn(),
}));

import {
  getStatsSummary, getHeatmap, getTrend, getGenres, getThemes, getReleaseYears, getCompanies,
} from '../../api/stats';

beforeEach(async () => {
  await AsyncStorage.clear();
  useServerStore.setState({ serverUrl: 'https://s.example/api/v1' });
  useAuthStore.setState({ token: 't', user: { discordId: '1', username: 'u' }, isAdmin: false, isAuthenticated: true });
  mockNavigate.mockReset();
  useEmptyAccountStore.setState({ isEmpty: null });
  (getStatsSummary as jest.Mock).mockResolvedValue({
    days: 7, window_start: null, window_end: '', total_seconds: 0, previous_total_seconds: 0,
    avg_session_seconds: 0, longest_session_seconds: 0, longest_session_game_id: null,
    longest_session_game_name: null, new_games_count: 0, per_game: [], pending_errors: [],
  });
  (getHeatmap as jest.Mock).mockResolvedValue({ days: 7, cells: [] });
  (getTrend as jest.Mock).mockResolvedValue({ granularity: 'day', buckets: [] });
  (getGenres as jest.Mock).mockResolvedValue({ items: [{ genre: 'Adventure', total_seconds: 3600 }] });
  (getThemes as jest.Mock).mockResolvedValue({ items: [] });
  (getReleaseYears as jest.Mock).mockResolvedValue({ items: [] });
  (getCompanies as jest.Mock).mockResolvedValue({ items: [] });
});

function renderScreen() {
  return render(
    <SafeAreaProvider>
      <StatsScreen />
    </SafeAreaProvider>
  );
}

test('tapping a genre bar drills into the Library filtered by that genre', async () => {
  const { getByText } = await renderScreen();

  await fireEvent.press(getByText('Adventure'));

  expect(mockNavigate).toHaveBeenCalledWith('Main', {
    screen: 'Library',
    params: { filter: { type: 'genre', value: 'Adventure' } },
  });
});

test('tapping a top-games row opens that game detail', async () => {
  (getStatsSummary as jest.Mock).mockResolvedValue({
    days: 7, window_start: null, window_end: '', total_seconds: 3600, previous_total_seconds: 0,
    avg_session_seconds: 3600, longest_session_seconds: 0, longest_session_game_id: null,
    longest_session_game_name: null, new_games_count: 1, pending_errors: [],
    per_game: [{ game_id: 42, game_name: 'Hollow Knight', cover_image_url: '/covers/42.png', total_seconds: 3600 }],
  });

  const { getByText } = await renderScreen();

  await fireEvent.press(getByText('Hollow Knight'));

  expect(mockNavigate).toHaveBeenCalledWith('GameDetail', {
    gameId: 42, gameName: 'Hollow Knight', coverImageUrl: '/covers/42.png',
  });
});

test('tapping the longest-session record card opens that game detail', async () => {
  (getStatsSummary as jest.Mock).mockResolvedValue({
    days: 7, window_start: null, window_end: '', total_seconds: 7200, previous_total_seconds: 0,
    avg_session_seconds: 3600, longest_session_seconds: 7200, longest_session_game_id: 7,
    longest_session_game_name: 'Celeste', new_games_count: 1, pending_errors: [],
    per_game: [{ game_id: 7, game_name: 'Celeste', cover_image_url: '/covers/7.png', total_seconds: 7200 }],
  });

  const { getByText } = await renderScreen();

  await fireEvent.press(getByText('REKORD · NAJDŁUŻSZA SESJA'));

  expect(mockNavigate).toHaveBeenCalledWith('GameDetail', {
    gameId: 7, gameName: 'Celeste', coverImageUrl: '/covers/7.png',
  });
});

function mockAllStatsRejected() {
  const err = new Error('net');
  (getStatsSummary as jest.Mock).mockRejectedValue(err);
  (getHeatmap as jest.Mock).mockRejectedValue(err);
  (getTrend as jest.Mock).mockRejectedValue(err);
  (getGenres as jest.Mock).mockRejectedValue(err);
  (getThemes as jest.Mock).mockRejectedValue(err);
  (getReleaseYears as jest.Mock).mockRejectedValue(err);
  (getCompanies as jest.Mock).mockRejectedValue(err);
}

test('offline revisit shows cached stats with the stale banner', async () => {
  const first = await renderScreen();
  await waitFor(() => expect(first.getByText('Adventure')).toBeTruthy());
  await waitFor(async () => {
    const keys = await AsyncStorage.getAllKeys();
    expect(keys.some((k) => k.includes('stats-breakdown'))).toBe(true);
  });
  await first.unmount();

  mockAllStatsRejected();
  const { getByText } = await renderScreen();

  await waitFor(() => expect(getByText(/Dane offline/)).toBeTruthy());
  expect(getByText('Adventure')).toBeTruthy(); // cached genre bar still renders
});

test('shows both banners when one group is cached-stale and another never loaded', async () => {
  (getCompanies as jest.Mock).mockRejectedValue(new Error('net')); // companies never snapshot
  const first = await renderScreen();
  await waitFor(() => expect(first.getByText('Adventure')).toBeTruthy());
  await waitFor(async () => {
    const keys = await AsyncStorage.getAllKeys();
    expect(keys.some((k) => k.includes('stats-breakdown'))).toBe(true);
  });
  await first.unmount();

  mockAllStatsRejected();
  const { getByText } = await renderScreen();

  await waitFor(() => expect(getByText(/Dane offline/)).toBeTruthy());
  expect(getByText('Nie udało się pobrać statystyk.')).toBeTruthy();
});

test('period change does not show the previous period payload under the new label', async () => {
  const first = await renderScreen();
  await waitFor(() => expect(first.getByText('Adventure')).toBeTruthy());
  await first.unmount();

  mockAllStatsRejected();
  const { getByText, queryByText } = await renderScreen();
  await waitFor(() => expect(getByText(/Dane offline/)).toBeTruthy());

  await fireEvent.press(getByText('30 DNI')); // days=30 — a key never cached

  await waitFor(() => expect(queryByText('Adventure')).toBeNull());
});

test('an empty account sees sample stats captioned with the sample window', async () => {
  useEmptyAccountStore.setState({ isEmpty: true });

  const { getByText } = await renderScreen();

  await waitFor(() => expect(getByText('PRZYKŁADOWE DANE')).toBeTruthy());
  expect(getByText('RPG')).toBeTruthy();          // sample genre, not the mocked 'Adventure'
  expect(getByText('90 DNI')).toBeTruthy();       // sample window pill
});

test('sample rows never navigate', async () => {
  useEmptyAccountStore.setState({ isEmpty: true });

  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText('RPG')).toBeTruthy());

  await fireEvent.press(getByText('RPG'));

  expect(mockNavigate).not.toHaveBeenCalled();
});

test('sample game row tap does not navigate during preview', async () => {
  useEmptyAccountStore.setState({ isEmpty: true });

  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText('Factorio')).toBeTruthy());

  await fireEvent.press(getByText('Factorio'));

  expect(mockNavigate).not.toHaveBeenCalled();
});

test('an empty account overview caption shows the sample 90-day window', async () => {
  useEmptyAccountStore.setState({ isEmpty: true });

  const { getByText } = await renderScreen();

  await waitFor(() => expect(getByText('w ciągu ostatnich 90 dni')).toBeTruthy());
});

test('a non-empty account keeps the live stats untouched', async () => {
  useEmptyAccountStore.setState({ isEmpty: false });

  const { getByText, queryByText } = await renderScreen();

  await waitFor(() => expect(getByText('Adventure')).toBeTruthy());
  expect(queryByText('PRZYKŁADOWE DANE')).toBeNull();
});
