import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import StatsScreen from '../StatsScreen';

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

beforeEach(() => {
  mockNavigate.mockReset();
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
