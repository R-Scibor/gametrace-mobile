import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RootNavigator from '../RootNavigator';
import { useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';

// silence axios fetch-adapter load via transitively imported API modules; not a behavior expectation
jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn(), create: jest.fn(() => ({ interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } })) } }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('../TabNavigator', () => () => null);
jest.mock('../../screens/GameDetailScreen', () => () => null);
jest.mock('../../screens/EditSessionScreen', () => () => null);
jest.mock('../../screens/TrashScreen', () => () => null);
jest.mock('../../screens/VoiceScreen', () => () => null);
jest.mock('../../screens/DeleteAccountScreen', () => () => null);
// AuthScreen renders for real here; stub the OAuth hook so its expo-auth-session
// import chain (ESM) is never loaded in this suite.
jest.mock('../../hooks/useDiscordOAuth', () => ({ useDiscordOAuth: () => ({ ready: true, promptDiscord: jest.fn() }) }));

test('shows the welcome choice when no serverUrl', async () => {
  useServerStore.setState({ serverUrl: null });
  useAuthStore.setState({ isAuthenticated: false, token: null, user: null });
  const { findByText } = await render(<RootNavigator />);
  expect(await findByText('UŻYJ OFICJALNEGO SERWERA')).toBeTruthy();
});

test('pressing official CTA on Welcome navigates to the official policy screen', async () => {
  useServerStore.setState({ serverUrl: null });
  useAuthStore.setState({ isAuthenticated: false, token: null, user: null });
  const { findByText } = await render(<RootNavigator />);
  const officialButton = await findByText('UŻYJ OFICJALNEGO SERWERA');
  await fireEvent.press(officialButton);
  expect(await findByText('OFICJALNY SERWER')).toBeTruthy();
});

test('shows auth when serverUrl set but not authenticated', async () => {
  useServerStore.setState({ serverUrl: 'https://h:8010/api/v1' });
  useAuthStore.setState({ isAuthenticated: false, token: null, user: null });
  const { findByText } = await render(<RootNavigator />);
  expect(await findByText('— SIGN IN —')).toBeTruthy();
});
