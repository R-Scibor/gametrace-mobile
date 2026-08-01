import fs from 'fs';
import path from 'path';

function flatten(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return prefix ? [prefix] : [];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') return [p];
    return flatten(v, p);
  });
}

function getByPath(obj: unknown, keyPath: string): unknown {
  return keyPath.split('.').reduce<unknown>((acc, part) => {
    if (acc === null || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[part];
  }, obj);
}

const localesDir = path.join(__dirname, '..', 'locales');

test('pl and en locale files have identical key paths', () => {
  const plDir = path.join(localesDir, 'pl');
  const enDir = path.join(localesDir, 'en');
  const plFiles = fs.readdirSync(plDir).filter((f) => f.endsWith('.json')).sort();
  const enFiles = fs.readdirSync(enDir).filter((f) => f.endsWith('.json')).sort();
  expect(enFiles).toEqual(plFiles);
  for (const file of plFiles) {
    const pl = JSON.parse(fs.readFileSync(path.join(plDir, file), 'utf8'));
    const en = JSON.parse(fs.readFileSync(path.join(enDir, file), 'utf8'));
    const plKeys = flatten(pl).sort();
    const enKeys = flatten(en).sort();
    expect(enKeys).toEqual(plKeys);
    for (const key of enKeys) {
      const plVal = getByPath(pl, key);
      const enVal = getByPath(en, key);
      expect(typeof plVal).toBe('string');
      expect(typeof enVal).toBe('string');
      expect((plVal as string).length).toBeGreaterThan(0);
      expect((enVal as string).length).toBeGreaterThan(0);
    }
  }
});
