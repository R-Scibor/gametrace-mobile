import { apiErrorMessage } from '../apiError';

function httpError(status: number, data: unknown) {
  return { response: { status, data } };
}

test('a string detail never reaches the UI, the translated fallback does', () => {
  expect(apiErrorMessage(httpError(400, { detail: 'Cannot delete an ONGOING session' }), 'Nie udało się usunąć sesji'))
    .toBe('Nie udało się usunąć sesji');
});

test('a pydantic 422 list is not joined into the message', () => {
  expect(apiErrorMessage(httpError(422, { detail: [{ msg: 'field required' }] }), 'Nie udało się zapisać zmian'))
    .toBe('Nie udało się zapisać zmian');
});

test('a nested detail and a network error both fall back', () => {
  expect(apiErrorMessage(httpError(500, { detail: { detail: 'boom' } }), 'fallback')).toBe('fallback');
  expect(apiErrorMessage(new Error('Network Error'), 'fallback')).toBe('fallback');
  expect(apiErrorMessage(undefined, 'fallback')).toBe('fallback');
});

test('no status code prefix is ever added', () => {
  expect(apiErrorMessage(httpError(503, { detail: 'down' }), 'fallback')).not.toMatch(/\d{3}/);
});
