jest.mock('../../api/reports', () => ({ submitReport: jest.fn() }));
jest.mock('../../utils/reportContext', () => ({
  buildReportContext: () => ({ screen: 'Test', platform: 'ios', osVersion: '17', appVersion: '1.0.0' }),
}));

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ReportSheet from '../ReportSheet';
import { submitReport } from '../../api/reports';
import { useReportStore } from '../../store/reportStore';
import { useAlertStore } from '../../store/alertStore';

beforeEach(() => {
  (submitReport as jest.Mock).mockReset();
  useReportStore.setState({ isOpen: true, submitting: false });
  useAlertStore.setState({ alert: null });
});

test('does not submit when message is empty', async () => {
  const { getByText } = await render(<ReportSheet />);
  await fireEvent.press(getByText('WYŚLIJ'));
  expect(submitReport).not.toHaveBeenCalled();
});

test('submits, closes, and shows a thank-you alert on success', async () => {
  (submitReport as jest.Mock).mockResolvedValue(undefined);
  const { getByText, getByPlaceholderText } = await render(<ReportSheet />);
  await fireEvent.changeText(getByPlaceholderText('Co możemy poprawić? Błąd, pomysł, cokolwiek.'), 'nice app');
  await fireEvent.press(getByText('WYŚLIJ'));

  await waitFor(() => expect(submitReport).toHaveBeenCalledWith('nice app', expect.objectContaining({ screen: 'Test' })));
  expect(useReportStore.getState().isOpen).toBe(false);
  expect(useAlertStore.getState().alert).toEqual({ title: 'DZIĘKI', message: 'Twoja opinia została wysłana.' });
});

test('keeps text and shows error on failure', async () => {
  (submitReport as jest.Mock).mockRejectedValue(new Error('network'));
  const { getByText, getByPlaceholderText, findByText } = await render(<ReportSheet />);
  await fireEvent.changeText(getByPlaceholderText('Co możemy poprawić? Błąd, pomysł, cokolwiek.'), 'broken');
  await fireEvent.press(getByText('WYŚLIJ'));

  expect(await findByText('Nie udało się wysłać. Spróbuj ponownie.')).toBeTruthy();
  expect(useReportStore.getState().isOpen).toBe(true);
  expect(getByPlaceholderText('Co możemy poprawić? Błąd, pomysł, cokolwiek.').props.value).toBe('broken');
});
