import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('configuração PWA contém manifest, ícones e service worker', async () => {
  const manifest = JSON.parse(await readFile(new URL('public/manifest.json', root), 'utf8'));
  const index = await readFile(new URL('index.html', root), 'utf8');
  const main = await readFile(new URL('src/main.tsx', root), 'utf8');
  const serviceWorker = await readFile(new URL('public/sw.js', root), 'utf8');

  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  assert.ok(manifest.name);
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 1);
  assert.match(index, /rel=["']manifest["']/);
  assert.match(main, /serviceWorker\.register\(['"]\/sw\.js['"]\)/);
  assert.match(serviceWorker, /addEventListener\(['"]install['"]/);
  assert.match(serviceWorker, /addEventListener\(['"]fetch['"]/);
});

