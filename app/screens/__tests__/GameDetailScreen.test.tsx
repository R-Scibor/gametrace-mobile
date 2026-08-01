import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: false })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true })),
}));

jest.mock('../../api/games', () => ({
  getGameSessions: jest.fn(async () => []),
  updateGamePreference: jest.fn(),
  getGameStats: jest.fn(async () => ({ total_seconds: 0, session_count: 0 })),
  getGames: jest.fn(async () => ({ total: 0, items: [] })),
}));

jest.mock('../../api/reports', () => ({ submitReport: jest.fn() }));

jest.mock('../../components/Cover', () => {
  const { View } = require('react-native');
  return () => <View testID="cover" />;
});

jest.mock('../../components/MergeCandidateSheet', () => {
  const { Text } = require('react-native');
  return function MockMergeCandidateSheet({
    visible,
    source,
  }: {
    visible: boolean;
    onClose: () => void;
    source: { id: number; name: string };
  }) {
    if (!visible) return null;
    return (
      <Text>
        merge-sheet:{source.id}:{source.name}
      </Text>
    );
  };
});

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
let mockRouteParams: {
  gameId: number;
  gameName?: string;
  coverImageUrl?: string | null;
  enrichmentStatus?: string;
  isAccepted?: boolean | null;
  isIgnored?: boolean;
} = {
  gameId: 42,
  gameName: '  Elden Ring  ',
  coverImageUrl: null,
  enrichmentStatus: 'ENRICHED',
  isAccepted: true,
  isIgnored: false,
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
  useRoute: () => ({ params: mockRouteParams }),
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), [cb]);
  },
}));

import GameDetailScreen from '../GameDetailScreen';

beforeEach(async () => {
  await AsyncStorage.clear();
  useServerStore.setState({ serverUrl: 'https://s.example/api/v1' });
  useAuthStore.setState({
    token: 't',
    user: { discordId: '1', username: 'u' },
    isAdmin: false,
    isAuthenticated: true,
  });
  mockGoBack.mockReset();
  mockNavigate.mockReset();
  mockRouteParams = {
    gameId: 42,
    gameName: '  Elden Ring  ',
    coverImageUrl: null,
    enrichmentStatus: 'ENRICHED',
    isAccepted: true,
    isIgnored: false,
  };
});

function renderScreen() {
  return render(
    <SafeAreaProvider>
      <GameDetailScreen />
    </SafeAreaProvider>,
  );
}

test('game menu shows Zgłoś duplikat after cover actions and opens merge sheet with trimmed name', async () => {
  const { getByText, queryByText } = await renderScreen();

  expect(queryByText('Zgłoś duplikat')).toBeNull();

  await fireEvent.press(getByText('⋯'));

  expect(getByText('Zgłoś duplikat')).toBeTruthy();
  expect(getByText('Ta sama gra podzielona na dwa wpisy')).toBeTruthy();
  expect(getByText('Anuluj')).toBeTruthy();

  await fireEvent.press(getByText('Zgłoś duplikat'));

  await waitFor(() => {
    expect(getByText('merge-sheet:42:Elden Ring')).toBeTruthy();
  });
  // Menu closed after opening the sheet entry point
  expect(queryByText('OPCJE')).toBeNull();
});

test('merge sheet source name falls back to em dash when gameName missing', async () => {
  mockRouteParams = {
    gameId: 7,
    gameName: '   ',
    coverImageUrl: null,
    enrichmentStatus: 'ENRICHED',
    isAccepted: true,
    isIgnored: false,
  };

  const { getByText } = await renderScreen();
  await fireEvent.press(getByText('⋯'));
  await fireEvent.press(getByText('Zgłoś duplikat'));

  await waitFor(() => {
    expect(getByText('merge-sheet:7:—')).toBeTruthy();
  });
});
