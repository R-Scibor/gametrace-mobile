import React from 'react';
import { render } from '@testing-library/react-native';
import PolicyBody from '../PolicyBody';

test('renders the policy title and body', async () => {
  const { getByText, queryByText } = await render(<PolicyBody />);
  expect(getByText('POLITYKA PRYWATNOŚCI')).toBeTruthy();
  // draft marker from the placeholder body; asserts the body itself rendered
  expect(queryByText(/WERSJA ROBOCZA/)).toBeTruthy();
});

test('hides the title when showTitle is false but still renders the body', async () => {
  const { queryByText } = await render(<PolicyBody showTitle={false} />);
  expect(queryByText('POLITYKA PRYWATNOŚCI')).toBeNull();
  expect(queryByText(/WERSJA ROBOCZA/)).toBeTruthy();
});
