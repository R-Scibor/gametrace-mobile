import React from 'react';
import { Linking } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import PolicyBody from '../PolicyBody';

beforeEach(() => {
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders the policy title and summary', async () => {
  const { getByText, queryByText } = await render(<PolicyBody />);
  expect(getByText('POLITYKA PRYWATNOŚCI')).toBeTruthy();
  expect(queryByText(/przechowuje Twoją tożsamość Discord/)).toBeTruthy();
});

test('hides the title when showTitle is false but still renders the summary', async () => {
  const { queryByText } = await render(<PolicyBody showTitle={false} />);
  expect(queryByText('POLITYKA PRYWATNOŚCI')).toBeNull();
  expect(queryByText(/przechowuje Twoją tożsamość Discord/)).toBeTruthy();
});

test('the summary carries a link out to the full notice on the web', async () => {
  const { getByText } = await render(<PolicyBody />);
  await fireEvent.press(getByText('Przeczytaj pełną politykę prywatności'));
  expect(Linking.openURL).toHaveBeenCalledWith('https://gametrace.rscibor.dev/privacy');
});
