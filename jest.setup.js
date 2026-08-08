jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'pl', languageTag: 'pl-PL' }],
}));

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: (component) => component,
  setUser: jest.fn(),
}));
