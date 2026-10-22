import { render, fireEvent } from '@testing-library/react-native';
import TimezonePicker from '../TimezonePicker';

async function renderPicker(value = 'Europe/Warsaw', onSelect = jest.fn()) {
  const utils = await render(<TimezonePicker value={value} onSelect={onSelect} />);
  return { ...utils, onSelect };
}

test('shows the current zone as a chip until change is pressed', async () => {
  const { getByText, getByTestId, queryByTestId } = await renderPicker();
  expect(getByText('Europe/Warsaw')).toBeTruthy();
  expect(queryByTestId('timezone-search')).toBeNull();

  await fireEvent.press(getByTestId('timezone-chip'));
  expect(getByTestId('timezone-search')).toBeTruthy();
  expect(getByText('CZĘSTE')).toBeTruthy();
  expect(getByText('Europe/London')).toBeTruthy();
});

test('typing filters the full list and hides the common group', async () => {
  const { getByText, getByTestId, queryByText } = await renderPicker();
  await fireEvent.press(getByTestId('timezone-chip'));
  await fireEvent.changeText(getByTestId('timezone-search'), 'tokyo');

  expect(getByText('Asia/Tokyo')).toBeTruthy();
  expect(queryByText('CZĘSTE')).toBeNull();
  expect(queryByText('Europe/London')).toBeNull();
});

test('a space in the query matches underscores in the zone id', async () => {
  const { getByText, getByTestId } = await renderPicker();
  await fireEvent.press(getByTestId('timezone-chip'));
  await fireEvent.changeText(getByTestId('timezone-search'), 'new york');
  expect(getByText('America/New York')).toBeTruthy();
});

test('selecting a zone reports it and returns to the chip', async () => {
  const { getByText, getByTestId, queryByTestId, onSelect } = await renderPicker();
  await fireEvent.press(getByTestId('timezone-chip'));
  await fireEvent.changeText(getByTestId('timezone-search'), 'tokyo');
  await fireEvent.press(getByText('Asia/Tokyo'));

  expect(onSelect).toHaveBeenCalledWith('Asia/Tokyo');
  expect(queryByTestId('timezone-search')).toBeNull();
});

test('tapping the current zone closes without saving again', async () => {
  const { getByText, getByTestId, queryByTestId, onSelect } = await renderPicker();
  await fireEvent.press(getByTestId('timezone-chip'));
  await fireEvent.press(getByText('Europe/Warsaw'));

  expect(onSelect).not.toHaveBeenCalled();
  expect(queryByTestId('timezone-search')).toBeNull();
});

test('an unknown query shows the empty state', async () => {
  const { getByText, getByTestId } = await renderPicker();
  await fireEvent.press(getByTestId('timezone-chip'));
  await fireEvent.changeText(getByTestId('timezone-search'), 'not-a-zone');
  expect(getByText('Brak wyników')).toBeTruthy();
});
