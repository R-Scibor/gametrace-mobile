export type MergeCandidateGameRef = {
  id: number;
  name: string;
};

const MESSAGE_MAX = 4000;

function normalizeName(name: string): string {
  return name.replace(/\s+/g, ' ').trim() || '—';
}

export function composeMergeCandidateMessage(args: {
  source: MergeCandidateGameRef;
  target: MergeCandidateGameRef;
  note?: string;
}): string {
  const sourceName = normalizeName(args.source.name);
  const targetName = normalizeName(args.target.name);
  const footer = [
    '---',
    `source_id: ${args.source.id}`,
    `target_id: ${args.target.id}`,
    `source_name: ${sourceName}`,
    `target_name: ${targetName}`,
    'kind: merge_candidate',
  ].join('\n');

  const header = [
    'Zgłoszenie duplikatu gry',
    '',
    `Źródło: ${sourceName}`,
    `Kandydat: ${targetName}`,
  ].join('\n');

  const note = (args.note ?? '').trim();
  let body = note ? `${header}\n\n${note}\n\n${footer}` : `${header}\n\n${footer}`;

  if (body.length > MESSAGE_MAX) {
    const overhead = body.length - note.length;
    const maxNote = Math.max(0, MESSAGE_MAX - overhead);
    const truncated = note.slice(0, maxNote);
    body = truncated
      ? `${header}\n\n${truncated}\n\n${footer}`
      : `${header}\n\n${footer}`;
    if (body.length > MESSAGE_MAX) {
      body = body.slice(0, MESSAGE_MAX);
    }
  }
  return body;
}
