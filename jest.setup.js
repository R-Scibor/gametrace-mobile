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

// expo-constants has no native module in Jest, so Constants.expoConfig is
// otherwise an empty object; default it to the real app.json version so
// code reading it behaves like a real build unless a test mocks it itself.
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: require('./app.json').expo.version } },
}));

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: (component) => component,
  setUser: jest.fn(),
}));
