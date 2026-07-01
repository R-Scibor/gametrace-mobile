import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BottomSheet } from '../BottomSheet';

test('renders title and children when keyboardAware', async () => {
  const { getByText } = await render(
    <BottomSheet visible onClose={() => {}} title="OPINIA" keyboardAware>
      <Text>body-content</Text>
    </BottomSheet>
  );
  expect(getByText('OPINIA')).toBeTruthy();
  expect(getByText('body-content')).toBeTruthy();
});

test('renders normally without keyboardAware (no regression)', async () => {
  const { getByText } = await render(
    <BottomSheet visible onClose={() => {}} title="BŁĄD">
      <Text>plain-body</Text>
    </BottomSheet>
  );
  expect(getByText('plain-body')).toBeTruthy();
});
