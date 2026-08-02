import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DashboardScreen from '../DashboardScreen';
import { useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';
import { useEmptyAccountStore } from '../../store/emptyAccountStore';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: (cb: () => void) => { const React = require('react'); React.useEffect(cb, []); },
}));

// getDashboardSummary lives in api/stats; getGameStats lives in api/games
// (useGameStats.ts:1). Mocking them from the wrong module leaves the real axios
// client in play and the test hangs on a network call.
jest.mock('../../api/stats', () => ({ getDashboardSummary: jest.fn() }));
jest.mock('../../api/games', () => ({ getGameStats: jest.fn() }));
jest.mock('../../api/sessions', () => ({ listSessions: jest.fn() }));

import { getDashboardSummary } from '../../api/stats';
import { getGameStats } from '../../api/games';
import { listSessions } from '../../api/sessions';

const EMPTY_SUMMARY = {
  total_seconds_today: 0, total_seconds_7d: 0, total_seconds_30d: 0,
  active_session: null, pending_errors: [],
};

const completedSession = {
  id: 1, game_id: 5, game: { id: 5, primary_name: 'Hollow Knight', cover_image_url: null },
  start_time: new Date().toISOString(), end_time: new Date().toISOString(),
  duration_seconds: 3600, status: 'COMPLETED', source: 'MANUAL', notes: null,
  created_at: new Date().toISOString(),
};

const errorSession = { ...completedSession, id: 2, status: 'ERROR', duration_seconds: null };

beforeEach(async () => {
  await AsyncStorage.clear();
  useServerStore.setState({ serverUrl: 'https://s.example/api/v1' });
  useAuthStore.setState({ token: 't', user: { discordId: '1', username: 'u' }, isAdmin: false, isAuthenticated: true });
  useEmptyAccountStore.setState({ isEmpty: null });
  mockNavigate.mockReset();
  (getDashboardSummary as jest.Mock).mockResolvedValue(EMPTY_SUMMARY);
  (getGameStats as jest.Mock).mockResolvedValue(null);
  (listSessions as jest.Mock).mockResolvedValue([]);
});

function renderScreen() {
  return render(
    <SafeAreaProvider>
      <DashboardScreen />
    </SafeAreaProvider>
  );
}

test('an empty account publishes the flag and shows guidance plus the sample preview', async () => {
  const { getByText, getByTestId } = await renderScreen();

  await waitFor(() => expect(useEmptyAccountStore.getState().isEmpty).toBe(true));
  await fireEvent(getByTestId('listRegion'), 'layout', { nativeEvent: { layout: { height: 400 } } });
  expect(getByText('PIERWSZE KROKI')).toBeTruthy();
  expect(getByText('PRZYKŁADOWE DANE')).toBeTruthy();
  expect(getByText("Baldur's Gate 3")).toBeTruthy();
});

test('an account with history publishes false and shows neither', async () => {
  (listSessions as jest.Mock).mockResolvedValue([completedSession]);

  const { queryByText, getAllByText, getByTestId } = await renderScreen();

  await waitFor(() => expect(useEmptyAccountStore.getState().isEmpty).toBe(false));
  await fireEvent(getByTestId('listRegion'), 'layout', { nativeEvent: { layout: { height: 400 } } });
  expect(queryByText('PIERWSZE KROKI')).toBeNull();
  expect(queryByText('PRZYKŁADOWE DANE')).toBeNull();
  // Hollow Knight is both the hero spotlight and the (only) row in the list below it.
  expect(getAllByText('Hollow Knight')).toHaveLength(2);
});

test('stays undetermined while recents are still loading', async () => {
  // A promise that never settles: the dashboard resolves, recents do not.
  (listSessions as jest.Mock).mockReturnValue(new Promise(() => {}));

  const { queryByText } = await renderScreen();

  await waitFor(() => expect(getDashboardSummary).toHaveBeenCalled());
  // recents still hold their `initialData: []`, which must NOT be read as empty
  expect(useEmptyAccountStore.getState().isEmpty).toBeNull();
  expect(queryByText('PRZYKŁADOWE DANE')).toBeNull();
});

test('ERROR-only recents keep their real rows and get no sample overlay', async () => {
  (listSessions as jest.Mock).mockResolvedValue([errorSession]);

  const { getByText, queryByText, getByTestId } = await renderScreen();

  await waitFor(() => expect(getByText('PIERWSZE KROKI')).toBeTruthy());
  await fireEvent(getByTestId('listRegion'), 'layout', { nativeEvent: { layout: { height: 400 } } });
  expect(queryByText('PRZYKŁADOWE DANE')).toBeNull();
  expect(queryByText("Baldur's Gate 3")).toBeNull();
  expect(getByText('BŁĄD')).toBeTruthy();
});
