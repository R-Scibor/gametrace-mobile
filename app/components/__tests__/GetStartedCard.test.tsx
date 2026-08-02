import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import GetStartedCard from '../GetStartedCard';

jest.mock('../../config', () => ({ DISCORD_INVITE_URL: 'https://discord.example/invite' }));

const handlers = () => ({
  onAddBot: jest.fn(),
  onAddSession: jest.fn(),
  onVoice: jest.fn(),
});

test('renders all three steps and fires the matching handler', async () => {
  const h = handlers();
  const { getByText } = await render(<GetStartedCard {...h} />);

  await fireEvent.press(getByText('Dodaj bota do serwera Discord'));
  expect(h.onAddBot).toHaveBeenCalled();

  await fireEvent.press(getByText('Albo dodaj sesję ręcznie'));
  expect(h.onAddSession).toHaveBeenCalled();

  await fireEvent.press(getByText('Wypróbuj sesję głosową'));
  expect(h.onVoice).toHaveBeenCalled();
});

test('hides the bot step when no invite URL is configured', async () => {
  const config = require('../../config');
  config.DISCORD_INVITE_URL = '';

  const { queryByText, getByText } = await render(<GetStartedCard {...handlers()} />);

  expect(queryByText('Dodaj bota do serwera Discord')).toBeNull();
  expect(getByText('Albo dodaj sesję ręcznie')).toBeTruthy();
});
