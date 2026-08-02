import React from 'react';
import { render } from '@testing-library/react-native';
import PolicyBody from '../PolicyBody';

test('renders the policy title and body', async () => {
  const { getByText, queryByText } = await render(<PolicyBody />);
  expect(getByText('POLITYKA PRYWATNOŚCI')).toBeTruthy();
  // draft marker from the placeholder body; asserts the body itself rendered
  expect(queryByText(/WERSJA ROBOCZA/)).toBeTruthy();
});
