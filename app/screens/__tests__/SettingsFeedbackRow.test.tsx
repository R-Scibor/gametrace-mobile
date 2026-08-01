jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn(), create: jest.fn(() => ({ interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } })) } }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));

import { render, fireEvent } from '@testing-library/react-native';
import SettingsScreen from '../SettingsScreen';
import { useReportStore } from '../../store/reportStore';
import { setActiveLanguage } from '../../i18n';

beforeEach(async () => {
  useReportStore.setState({ isOpen: false });
  await setActiveLanguage('pl');
});

test('feedback row opens the report store', async () => {
  const { getByText } = await render(<SettingsScreen />);
  await fireEvent.press(getByText('Wyślij opinię'));
  expect(useReportStore.getState().isOpen).toBe(true);
});

test('title follows active language', async () => {
  await setActiveLanguage('en');
  const { getByText, queryByText } = await render(<SettingsScreen />);
  expect(getByText('Settings')).toBeTruthy();
  expect(queryByText('Ustawienia')).toBeNull();
});
