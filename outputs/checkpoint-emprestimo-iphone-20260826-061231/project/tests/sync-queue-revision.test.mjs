import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getLocalSyncRevision,
  hasCompleteLocalSyncSnapshot,
  persistLocalSyncRevision,
  resolveBaseRevision,
} from '../src/lib/syncRevision.ts';
import { normalizeProductLoan } from '../src/lib/productLoans.ts';

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test('segunda alteração reutiliza a revisão local após a primeira gravação', () => {
  globalThis.localStorage = createStorage();
  localStorage.setItem('roteiro_pet_clients', JSON.stringify([
    { id: 'client-1', name: 'Cliente de teste' },
  ]));

  persistLocalSyncRevision('clients', 'client-1', 1, 'set', 'user-1');

  assert.equal(getLocalSyncRevision('clients', 'client-1'), 1);
  assert.equal(
    resolveBaseRevision('clients', 'client-1', { id: 'client-1', name: 'Nome alterado' }, null),
    1,
  );
});

test('snapshot incompleto não pode manter o marcador incremental como válido', () => {
  globalThis.localStorage = createStorage();
  const collections = ['clients', 'visits', 'negotiations', 'voiceNotes', 'events', 'loans'];

  for (const collection of collections) {
    localStorage.setItem(`roteiro_pet_${collection === 'voiceNotes' ? 'voice_notes' : collection}`, '[]');
  }

  assert.equal(hasCompleteLocalSyncSnapshot(), true);

  localStorage.removeItem('roteiro_pet_events');
  assert.equal(hasCompleteLocalSyncSnapshot(), false);
});

test('normalização de empréstimo preserva a revisão do Firestore', () => {
  const loan = normalizeProductLoan({
    id: 'loan-1',
    originClientId: 'client-1',
    originClientName: 'Origem',
    destClientId: 'client-2',
    destClientName: 'Destino',
    items: [{ id: 'item-1', productName: 'Ração teste', quantity: '1', status: 'pending' }],
    date: '2026-08-23',
    createdAt: '2026-08-23T00:00:00.000Z',
    _sync: { revision: 7, updatedBy: 'user-1', deletedAt: null },
  });

  assert.equal(loan?._sync?.revision, 7);
});
