import { render, fireEvent } from '@testing-library/react-native';
import { DateTimeSheetBody } from '../DateTimeSheet';

const seeded = new Date(2026, 5, 1, 9, 30, 0, 0); // 2026-06-01 09:30

test('selecting a day and confirming commits that day with the seeded time', async () => {
  const onConfirm = jest.fn();
  const { getByTestId, getByText } = await render(
    <DateTimeSheetBody value={seeded} onConfirm={onConfirm} onCancel={() => {}} />,
  );

  await fireEvent.press(getByTestId('day-15'));
  await fireEvent.press(getByText('Potwierdź'));

  expect(onConfirm).toHaveBeenCalledTimes(1);
  const d: Date = onConfirm.mock.calls[0][0];
  expect(d.getFullYear()).toBe(2026);
  expect(d.getMonth()).toBe(5);
  expect(d.getDate()).toBe(15);
  expect(d.getHours()).toBe(9);
  expect(d.getMinutes()).toBe(30);
});

test('scrolling the hour wheel updates the committed hour', async () => {
  const onConfirm = jest.fn();
  const { getByTestId, getByText } = await render(
    <DateTimeSheetBody value={seeded} onConfirm={onConfirm} onCancel={() => {}} />,
  );

  // ITEM_H is 40, so offset 440 snaps to index 11 → hour 11.
  await fireEvent(getByTestId('wheel-hours'), 'momentumScrollEnd', {
    nativeEvent: { contentOffset: { x: 0, y: 440 } },
  });
  await fireEvent.press(getByText('Potwierdź'));

  const d: Date = onConfirm.mock.calls[0][0];
  expect(d.getHours()).toBe(11);
  expect(d.getMinutes()).toBe(30); // untouched
});

test('cancel commits nothing', async () => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  const { getByText } = await render(
    <DateTimeSheetBody value={seeded} onConfirm={onConfirm} onCancel={onCancel} />,
  );

  await fireEvent.press(getByText('Anuluj'));

  expect(onConfirm).not.toHaveBeenCalled();
  expect(onCancel).toHaveBeenCalledTimes(1);
});
