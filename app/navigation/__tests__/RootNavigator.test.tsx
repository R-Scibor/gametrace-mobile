import React from 'react';
import { render } from '@testing-library/react-native';
import RootNavigator from '../RootNavigator';
import { useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';

// silence axios fetch-adapter load via transitively imported API modules; not a behavior expectation
jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn(), create: jest.fn(() => ({ interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } })) } }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaInsetsContext: { Provider: ({ children }) => children },
}));
jest.mock('../TabNavigator', () => () => null);
jest.mock('../../screens/GameDetailScreen', () => () => null);
jest.mock('../../screens/EditSessionScreen', () => () => null);
jest.mock('../../screens/TrashScreen', () => () => null);
jest.mock('../../screens/VoiceScreen', () => () => null);

test('shows server setup when no serverUrl', async () => {
  useServerStore.setState({ serverUrl: null });
  useAuthStore.setState({ isAuthenticated: false, token: null, user: null });
  const { findByText } = await render(<RootNavigator />);
  expect(await findByText('— POŁĄCZ Z SERWEREM —')).toBeTruthy();
});

test('shows auth when serverUrl set but not authenticated', async () => {
  useServerStore.setState({ serverUrl: 'https://h:8010/api/v1' });
  useAuthStore.setState({ isAuthenticated: false, token: null, user: null });
  const { findByText } = await render(<RootNavigator />);
  expect(await findByText('— SIGN IN —')).toBeTruthy();
});
