import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WelcomeScreen from '../WelcomeScreen';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

async function renderScreen(props: { onOfficial?: () => void; onCustom?: () => void } = {}) {
  return render(
    <SafeAreaProvider>
      <WelcomeScreen onOfficial={props.onOfficial ?? jest.fn()} onCustom={props.onCustom ?? jest.fn()} />
    </SafeAreaProvider>
  );
}

test('primary CTA calls onOfficial', async () => {
  const onOfficial = jest.fn();
  const { getByText } = await renderScreen({ onOfficial });
  await fireEvent.press(getByText('UŻYJ OFICJALNEGO SERWERA'));
  expect(onOfficial).toHaveBeenCalledTimes(1);
});

test('secondary CTA calls onCustom', async () => {
  const onCustom = jest.fn();
  const { getByText } = await renderScreen({ onCustom });
  await fireEvent.press(getByText('Użyj własnego serwera'));
  expect(onCustom).toHaveBeenCalledTimes(1);
});

test('privacy policy link opens the shared policy body', async () => {
  const { getByText, queryByText, findByText } = await renderScreen();
  expect(queryByText('POLITYKA PRYWATNOŚCI')).toBeNull();
  await fireEvent.press(getByText('Polityka prywatności'));
  expect(await findByText('POLITYKA PRYWATNOŚCI')).toBeTruthy();
});
