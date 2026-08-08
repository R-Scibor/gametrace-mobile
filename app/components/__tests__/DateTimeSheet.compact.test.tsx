jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(() => ({ width: 360, height: 640, scale: 2, fontScale: 1 })),
}));

import { render, fireEvent } from '@testing-library/react-native';
import { DateTimeSheetBody, pickMetrics } from '../DateTimeSheet';

const seeded = new Date(2026, 5, 1, 9, 30, 0, 0); // 2026-06-01 09:30

test('a tall window keeps the default metrics', () => {
  expect(pickMetrics(1334)).toEqual({
    dayCell: 38, itemH: 40, dividerMargin: 14, navPadding: 6, labelMargin: 8, actionPadding: 14,
  });
});

test('a short window switches to compact metrics', () => {
  expect(pickMetrics(640)).toEqual({
    dayCell: 30, itemH: 32, dividerMargin: 8, navPadding: 3, labelMargin: 4, actionPadding: 10,
  });
});

test('the threshold is exclusive at 700', () => {
  expect(pickMetrics(700).itemH).toBe(40);
  expect(pickMetrics(699).itemH).toBe(32);
});

test('compact mode snaps the hour wheel on the compact item height', async () => {
  const onConfirm = jest.fn();
  const { getByTestId, getByText } = await render(
    <DateTimeSheetBody value={seeded} onConfirm={onConfirm} onCancel={() => {}} />,
  );

  // Compact ITEM_H is 32, so offset 352 snaps to index 11 → hour 11.
  await fireEvent(getByTestId('wheel-hours'), 'momentumScrollEnd', {
    nativeEvent: { contentOffset: { x: 0, y: 352 } },
  });
  await fireEvent.press(getByText('Potwierdź'));

  const d: Date = onConfirm.mock.calls[0][0];
  expect(d.getHours()).toBe(11);
  expect(d.getMinutes()).toBe(30);
});

test('compact mode still commits a picked day', async () => {
  const onConfirm = jest.fn();
  const { getByTestId, getByText } = await render(
    <DateTimeSheetBody value={seeded} onConfirm={onConfirm} onCancel={() => {}} />,
  );

  await fireEvent.press(getByTestId('day-15'));
  await fireEvent.press(getByText('Potwierdź'));

  expect(onConfirm.mock.calls[0][0].getDate()).toBe(15);
});
