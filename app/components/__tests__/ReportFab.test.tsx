jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

import { render, fireEvent } from '@testing-library/react-native';
import ReportFab from '../ReportFab';
import { useReportStore } from '../../store/reportStore';

beforeEach(() => useReportStore.setState({ isOpen: false }));

test('pressing the FAB opens the report store', async () => {
  const { getByLabelText } = await render(<ReportFab />);
  await fireEvent.press(getByLabelText('Wyślij opinię'));
  expect(useReportStore.getState().isOpen).toBe(true);
});
