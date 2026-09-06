import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const backupPath = path.resolve(
  'backup_pre_correcao',
  'backup-roteiroelismar-20260822-221408.json',
);

const collectionNames = [
  'clients',
  'visits',
  'negotiations',
  'voiceNotes',
  'events',
  'loans',
  'initializedDates',
];

test('backup protegido possui estrutura restaurável', async () => {
  const backup = JSON.parse(await readFile(backupPath, 'utf8'));

  assert.equal(backup.projectId, 'roteiroelismar');
  assert.ok(backup.tenantId);
  assert.ok(backup.collections);

  for (const collectionName of collectionNames) {
    assert.ok(Array.isArray(backup.collections[collectionName]), collectionName);
  }

  for (const collectionName of collectionNames.filter(name => name !== 'initializedDates')) {
    assert.ok(
      backup.collections[collectionName].every(item => typeof item?.id === 'string' && item.id.length > 0),
      `IDs inválidos em ${collectionName}`,
    );
  }

  assert.ok(
    backup.collections.initializedDates.every(date => typeof date === 'string'),
    'initializedDates deve conter apenas strings',
  );
});
