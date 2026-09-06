import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { test } from 'node:test';

const distAssets = new URL('../dist/assets/', import.meta.url);
const distAssetsPath = fileURLToPath(distAssets);
const forbiddenPatterns = [
  '-----BEGIN PRIVATE KEY-----',
  'client_secret',
  'secret_key',
  'elismar123',
  'VITE_FIREBASE_API_KEY=',
];

test('bundle não contém segredos privados ou senha legada', async () => {
  const files = (await readdir(distAssets)).filter(file => file.endsWith('.js'));
  assert.ok(files.length > 0, 'o build precisa gerar arquivos JavaScript');

  const bundle = (await Promise.all(
    files.map(file => readFile(join(distAssetsPath, file), 'utf8')),
  )).join('\n');

  for (const pattern of forbiddenPatterns) {
    assert.equal(bundle.includes(pattern), false, `padrão proibido encontrado: ${pattern}`);
  }
});
