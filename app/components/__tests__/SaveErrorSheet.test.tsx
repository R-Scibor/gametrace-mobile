import { render, fireEvent } from '@testing-library/react-native';
import SaveErrorSheet from '../SaveErrorSheet';
import type { ConflictResponse, ConflictingSession } from '../../types/api';

const session: ConflictingSession = {
  id: 99,
  status: 'COMPLETED',
  game_id: 5,
  game: { primary_name: 'Wiedźmin 3', cover_image_url: null },
  start_time: '2026-08-02T18:00:00.000Z',
  end_time: '2026-08-02T20:00:00.000Z',
};

const conflict: ConflictResponse = {
  detail: 'Session overlaps with an existing session',
  conflicting_session: session,
};

test('message kind shows the alert text', async () => {
  const { getByText, queryByText } = await render(
    <SaveErrorSheet
      error={{ kind: 'message', message: '409: Session overlaps with an existing session' }}
      onDismiss={jest.fn()}
      onEdit={jest.fn()}
    />,
  );
  expect(getByText('409: Session overlaps with an existing session')).toBeTruthy();
  expect(queryByText('Wiedźmin 3')).toBeNull();
  expect(queryByText('Nakładające się sesje')).toBeNull();
});

test('conflict kind shows the blocker and Edit fires onEdit', async () => {
  const onEdit = jest.fn();
  const { getByText } = await render(
    <SaveErrorSheet
      error={{ kind: 'conflict', conflict }}
      onDismiss={jest.fn()}
      onEdit={onEdit}
    />,
  );
  expect(getByText('Nakładające się sesje')).toBeTruthy();
  expect(getByText('Wiedźmin 3')).toBeTruthy();
  expect(getByText('Session overlaps with an existing session')).toBeTruthy();

  const start = new Date(session.start_time).toLocaleString('pl-PL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const end = new Date(session.end_time!).toLocaleString('pl-PL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  expect(getByText(`${start} – ${end}`)).toBeTruthy();

  await fireEvent.press(getByText('Edytuj →'));
  expect(onEdit).toHaveBeenCalledWith(session);
});

test('an ONGOING blocker shows times but no Edit', async () => {
  const onEdit = jest.fn();
  const { getByText, queryByText } = await render(
    <SaveErrorSheet
      error={{
        kind: 'conflict',
        conflict: {
          ...conflict,
          conflicting_session: { ...session, status: 'ONGOING', end_time: null },
        },
      }}
      onDismiss={jest.fn()}
      onEdit={onEdit}
    />,
  );
  expect(getByText('Wiedźmin 3')).toBeTruthy();
  expect(queryByText('Edytuj →')).toBeNull();
  expect(getByText('ROZUMIEM')).toBeTruthy();
});

