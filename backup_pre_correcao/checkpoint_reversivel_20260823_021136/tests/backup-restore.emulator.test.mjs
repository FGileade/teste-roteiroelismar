import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

const PROJECT_ID = 'roteiroelismar-backup-test';
const USER_ID = 'OJtAzjEd9BhU9LQN9R52hP7gjkb2';
const BACKUP_PATH = new URL(
  '../backup_pre_correcao/backup-roteiroelismar-20260822-221408.json',
  import.meta.url,
);
const COLLECTIONS = ['clients', 'visits', 'negotiations', 'voiceNotes', 'events', 'loans'];

let testEnv;

before(async () => {
  const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });
});

after(async () => {
  await testEnv.cleanup();
});

async function restoreCollection(db, collectionName, items) {
  let batch = writeBatch(db);
  let count = 0;

  for (const item of items) {
    if (!item?.id) continue;
    batch.set(doc(db, 'users', USER_ID, collectionName, item.id), item);
    count++;

    if (count === 400) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }

  if (count > 0) await batch.commit();
}

test('backup restaura no Emulator sem alterar contagens ou IDs', async () => {
  const backup = JSON.parse(await readFile(BACKUP_PATH, 'utf8'));
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();

    for (const collectionName of COLLECTIONS) {
      await restoreCollection(db, collectionName, backup.collections[collectionName]);
    }
    await setDoc(doc(db, 'users', USER_ID, 'config', 'dates'), {
      dates: backup.collections.initializedDates,
    });

    for (const collectionName of COLLECTIONS) {
      const restored = await getDocs(collection(db, 'users', USER_ID, collectionName));
      const expected = backup.collections[collectionName];
      const restoredIds = restored.docs.map(snapshotDoc => snapshotDoc.id).sort();
      const expectedIds = expected.map(item => item.id).sort();

      assert.equal(restored.size, expected.length, collectionName);
      assert.deepEqual(restoredIds, expectedIds, `IDs divergentes em ${collectionName}`);
    }

    const dates = await getDocs(collection(db, 'users', USER_ID, 'config'));
    assert.equal(dates.size, 1);
    assert.deepEqual(dates.docs[0].data().dates, backup.collections.initializedDates);
  });
});
