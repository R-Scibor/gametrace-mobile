import { composeMergeCandidateMessage } from '../composeMergeCandidateMessage';

const source = { id: 45, name: 'Kingdom Hearts ReMIX' };
const target = { id: 33, name: 'Kingdom Hearts Remix' };

test('includes Polish header, names, footer ids and kind with note', () => {
  const msg = composeMergeCandidateMessage({
    source,
    target,
    note: '  ta sama gra  ',
  });
  expect(msg).toContain('Zgłoszenie duplikatu gry');
  expect(msg).toContain('Źródło: Kingdom Hearts ReMIX');
  expect(msg).toContain('Kandydat: Kingdom Hearts Remix');
  expect(msg).toContain('ta sama gra');
  expect(msg).toMatch(/source_id:\s*45/);
  expect(msg).toMatch(/target_id:\s*33/);
  expect(msg).toMatch(/kind:\s*merge_candidate/);
  expect(msg).toContain('---');
});

test('omits note paragraph when note empty', () => {
  const msg = composeMergeCandidateMessage({ source, target, note: '   ' });
  expect(msg).not.toMatch(/\n\n\n/);
  // no free-text body between name block and footer other than blank line before ---
  expect(msg).toContain('Kandydat: Kingdom Hearts Remix');
  expect(msg).toContain('---');
  expect(msg.indexOf('ta sama')).toBe(-1);
});

test('collapses newlines in names', () => {
  const msg = composeMergeCandidateMessage({
    source: { id: 1, name: 'Foo\nBar' },
    target: { id: 2, name: 'Baz  Qux' },
  });
  expect(msg).toContain('Źródło: Foo Bar');
  expect(msg).not.toMatch(/Źródło: Foo\nBar/);
});

test('truncates overlong note so total length <= 4000 and footer remains', () => {
  const note = 'x'.repeat(5000);
  const msg = composeMergeCandidateMessage({ source, target, note });
  expect(msg.length).toBeLessThanOrEqual(4000);
  expect(msg).toMatch(/source_id:\s*45/);
  expect(msg).toMatch(/kind:\s*merge_candidate/);
});
