import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  startAfter,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

const PROJECT_ID = 'roteiroelismar-incremental-test';
const USER_ID = 'OJtAzjEd9BhU9LQN9R52hP7gjkb2';
const COLLECTION = 'clients';

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

function incrementalQuery(db, cursor, pageSize = 2) {
  const collectionRef = collection(db, 'users', USER_ID, COLLECTION);
  const constraints = [
    where('_sync.updatedAt', '>=', Timestamp.fromMillis(cursor?.updatedAtMillis || 0)),
    orderBy('_sync.updatedAt', 'asc'),
    orderBy('__name__', 'asc'),
    limit(pageSize),
  ];

  return cursor
    ? query(
        collectionRef,
        ...constraints.slice(0, 3),
        startAfter(Timestamp.fromMillis(cursor.updatedAtMillis), cursor.documentId),
        constraints[3],
      )
    : query(collectionRef, ...constraints);
}

test('pagina o cursor de forma estável quando timestamps são iguais', async () => {
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    const sameTime = Timestamp.fromMillis(1_700_000_000_000);
    const laterTime = Timestamp.fromMillis(1_700_000_001_000);
    const batch = writeBatch(db);

    batch.set(doc(db, 'users', USER_ID, COLLECTION, 'a'), { id: 'a', _sync: { updatedAt: sameTime } });
    batch.set(doc(db, 'users', USER_ID, COLLECTION, 'b'), { id: 'b', _sync: { updatedAt: sameTime } });
    batch.set(doc(db, 'users', USER_ID, COLLECTION, 'c'), { id: 'c', _sync: { updatedAt: laterTime } });
    await batch.commit();

    const firstPage = await getDocs(incrementalQuery(db, null, 2));
    assert.deepEqual(firstPage.docs.map(snapshot => snapshot.id), ['a', 'b']);

    const last = firstPage.docs.at(-1);
    const cursor = {
      updatedAtMillis: last.data()._sync.updatedAt.toMillis(),
      documentId: last.id,
    };
    const secondPage = await getDocs(incrementalQuery(db, cursor, 2));

    assert.deepEqual(secondPage.docs.map(snapshot => snapshot.id), ['c']);
  });
});

test('tombstone remove o item local sem apagar o restante', () => {
  const current = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
  ];
  const changes = [
    { id: 'a', _sync: { deletedAt: Timestamp.now() } },
    { id: 'c', name: 'C' },
  ];
  const byId = new Map(current.map(item => [item.id, item]));

  for (const item of changes) {
    if (item._sync?.deletedAt) byId.delete(item.id);
    else byId.set(item.id, item);
  }

  assert.deepEqual(Array.from(byId.keys()), ['b', 'c']);
});

test('transação não sobrescreve documento quando a revisão remota mudou', async () => {
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    const ref = doc(db, 'users', USER_ID, COLLECTION, 'conflict');

    await setDoc(ref, {
      id: 'conflict',
      name: 'remoto',
      _sync: { revision: 2 },
    });

    const result = await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(ref);
      const remoteRevision = snapshot.data()?._sync?.revision ?? null;
      const baseRevision = 1;

      if (remoteRevision !== baseRevision) {
        return { conflict: true };
      }

      transaction.set(ref, {
        name: 'local',
        _sync: { revision: remoteRevision + 1 },
      }, { merge: true });
      return { conflict: false };
    });

    assert.deepEqual(result, { conflict: true });
    const after = await getDoc(ref);
    assert.equal(after.data().name, 'remoto');
    assert.equal(after.data()._sync.revision, 2);
  });
});
