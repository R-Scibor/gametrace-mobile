jest.mock('../../api/games', () => ({ getGames: jest.fn() }));
jest.mock('../../api/reports', () => ({ submitReport: jest.fn() }));
jest.mock('../../utils/reportContext', () => ({
  buildReportContext: () => ({
    screen: 'GameDetail',
    platform: 'android',
    osVersion: '14',
    appVersion: '1.0.0',
  }),
}));

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MergeCandidateSheet from '../MergeCandidateSheet';
import { getGames } from '../../api/games';
import { submitReport } from '../../api/reports';
import { useAlertStore } from '../../store/alertStore';
import { Game } from '../../types/api';

function makeGame(id: number, name: string): Game {
  return {
    id,
    primary_name: name,
    cover_image_url: null,
    cover_source: 'EXTERNAL',
    enrichment_status: 'ENRICHED',
    is_ignored: false,
    is_accepted: true,
    total_seconds: 0,
    last_played: null,
  };
}

const SOURCE = { id: 1, name: 'Elden Ring' };
const TARGET = makeGame(2, 'Elden Ring (alt)');
const OTHER = makeGame(3, 'Dark Souls');

const defaultOnClose = jest.fn();

async function renderSheet(
  overrides: Partial<{
    visible: boolean;
    onClose: () => void;
    source: { id: number; name: string };
  }> = {},
) {
  return render(
    <MergeCandidateSheet
      visible
      onClose={defaultOnClose}
      source={SOURCE}
      {...overrides}
    />,
  );
}

beforeEach(() => {
  (getGames as jest.Mock).mockReset();
  (submitReport as jest.Mock).mockReset();
  defaultOnClose.mockReset();
  useAlertStore.setState({ alert: null });
  (getGames as jest.Mock).mockImplementation((opts: { inLibrary?: boolean } = {}) => {
    if (opts.inLibrary === false) {
      return Promise.resolve({ total: 1, items: [TARGET] });
    }
    return Promise.resolve({ total: 2, items: [makeGame(1, 'Elden Ring'), OTHER] });
  });
});

test('on open calls getGames twice for main library and out-of-library', async () => {
  await renderSheet();

  await waitFor(() => expect(getGames).toHaveBeenCalledTimes(2));

  expect(getGames).toHaveBeenCalledWith(
    expect.objectContaining({ limit: 100, sort: 'name' }),
  );
  expect(getGames).toHaveBeenCalledWith(
    expect.objectContaining({ limit: 100, sort: 'name', inLibrary: false }),
  );

  const calls = (getGames as jest.Mock).mock.calls.map((c) => c[0] ?? {});
  const mainCall = calls.find((c) => c.inLibrary !== false);
  const outCall = calls.find((c) => c.inLibrary === false);
  expect(mainCall).toBeTruthy();
  expect(mainCall.inLibrary).not.toBe(false);
  expect(outCall).toEqual(expect.objectContaining({ limit: 100, sort: 'name', inLibrary: false }));
});

test('does not list a game whose id equals source.id', async () => {
  (getGames as jest.Mock).mockImplementation((opts: { inLibrary?: boolean } = {}) => {
    if (opts.inLibrary === false) {
      return Promise.resolve({ total: 1, items: [TARGET] });
    }
    // Source id=1 with a distinct name so leakage into the candidate list is detectable
    return Promise.resolve({
      total: 2,
      items: [makeGame(1, 'SOURCE SHOULD NOT SHOW'), OTHER],
    });
  });

  const { queryByText, findByText } = await renderSheet();

  expect(await findByText('Dark Souls')).toBeTruthy();
  expect(await findByText('Elden Ring (alt)')).toBeTruthy();
  expect(queryByText('SOURCE SHOULD NOT SHOW')).toBeNull();
});

test('shows load error when either getGames rejects', async () => {
  (getGames as jest.Mock).mockImplementation((opts: { inLibrary?: boolean } = {}) => {
    if (opts.inLibrary === false) {
      return Promise.reject(new Error('network'));
    }
    return Promise.resolve({ total: 1, items: [OTHER] });
  });

  const { findByText } = await renderSheet();
  expect(await findByText(/nie udało/i)).toBeTruthy();
});

test('selecting a target then WYŚLIJ submits merge_candidate message once', async () => {
  (submitReport as jest.Mock).mockResolvedValue(undefined);
  const { findByText, getByText } = await renderSheet();

  await findByText('Elden Ring (alt)');
  await fireEvent.press(getByText('Elden Ring (alt)'));
  await fireEvent.press(getByText('WYŚLIJ'));

  await waitFor(() => expect(submitReport).toHaveBeenCalledTimes(1));
  const [message, context] = (submitReport as jest.Mock).mock.calls[0];
  expect(message).toContain('source_id: 1');
  expect(message).toContain('target_id: 2');
  expect(message).toContain('kind: merge_candidate');
  expect(context).toEqual(
    expect.objectContaining({ screen: 'GameDetail', platform: 'android' }),
  );
});

test('on success shows DZIĘKI alert and calls onClose', async () => {
  (submitReport as jest.Mock).mockResolvedValue(undefined);
  const { findByText, getByText } = await renderSheet();

  await findByText('Dark Souls');
  await fireEvent.press(getByText('Dark Souls'));
  await fireEvent.press(getByText('WYŚLIJ'));

  await waitFor(() => {
    expect(useAlertStore.getState().alert).toEqual({
      title: 'DZIĘKI',
      message: 'Sprawdzimy i scalimy, jeśli to ta sama gra.',
    });
  });
  expect(defaultOnClose).toHaveBeenCalled();
});

test('on submit failure keeps UI open and shows inline send error', async () => {
  (submitReport as jest.Mock).mockRejectedValue(new Error('network'));
  const { findByText, getByText } = await renderSheet();

  await findByText('Dark Souls');
  await fireEvent.press(getByText('Dark Souls'));
  await fireEvent.press(getByText('WYŚLIJ'));

  expect(await findByText('Nie udało się wysłać. Spróbuj ponownie.')).toBeTruthy();
  expect(defaultOnClose).not.toHaveBeenCalled();
  expect(useAlertStore.getState().alert).toBeNull();
});
