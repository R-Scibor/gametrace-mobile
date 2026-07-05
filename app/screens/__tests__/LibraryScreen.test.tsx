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
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), []);
  },
}));

beforeEach(() => {
  (getGames as jest.Mock).mockReset();
  (getGames as jest.Mock).mockResolvedValue({ total: 0, items: [] });
  mockSetParams.mockReset();
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
