import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LibraryScreen from '../LibraryScreen';
import { getGames } from '../../api/games';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('../../api/games', () => ({ getGames: jest.fn() }));

const mockSetParams = jest.fn();
let mockRouteParams: any = undefined;
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), setParams: mockSetParams }),
  useRoute: () => ({ params: mockRouteParams }),
  // Re-runs (cleanup then callback) whenever the memoized callback's identity
  // changes, matching @react-navigation/core's real useFocusEffect behavior.
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), [cb]);
  },
}));

beforeEach(() => {
  (getGames as jest.Mock).mockReset();
  (getGames as jest.Mock).mockResolvedValue({ total: 0, items: [] });
  mockSetParams.mockReset();
  mockSetParams.mockImplementation((updates: any) => {
    mockRouteParams = { ...mockRouteParams, ...updates };
  });
  mockRouteParams = undefined;
});

function renderScreen() {
  return render(
    <SafeAreaProvider>
      <LibraryScreen />
    </SafeAreaProvider>
  );
}

test('tapping the playtime sort pill refetches sorted by playtime', async () => {
  const { getByText } = await renderScreen();

  await fireEvent.press(getByText('CZAS GRY'));

  expect(getGames).toHaveBeenCalledWith(expect.objectContaining({ sort: 'playtime', skip: 0 }));
});

test('arriving with a filter param shows the chip and sorts by playtime', async () => {
  mockRouteParams = { filter: { type: 'genre', value: 'Role-playing (RPG)' } };

  const { getByText } = await renderScreen();

  expect(getByText('Gatunek: Role-playing (RPG)')).toBeTruthy();
  expect(getGames).toHaveBeenCalledWith(expect.objectContaining({
    sort: 'playtime',
    filter: { type: 'genre', value: 'Role-playing (RPG)' },
  }));
  expect(mockSetParams).toHaveBeenCalledWith({ filter: undefined });
});

test('dismissing the chip refetches without the filter', async () => {
  mockRouteParams = { filter: { type: 'developer', value: 'FromSoftware' } };

  const { getByText, queryByText } = await renderScreen();
  (getGames as jest.Mock).mockClear();

  await fireEvent.press(getByText('✕'));

  expect(queryByText('Deweloper: FromSoftware')).toBeNull();
  expect(getGames).toHaveBeenCalledWith(expect.objectContaining({ filter: undefined }));
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
  expect(getGames).toHaveBeenLastCalledWith(expect.objectContaining({
    filter: { type: 'genre', value: 'RPG' },
  }));
});
