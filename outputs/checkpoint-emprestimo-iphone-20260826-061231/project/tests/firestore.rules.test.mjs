import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test, before, after } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const PROJECT_ID = 'roteiroelismar-rules-test';
const MASTER_UID = 'OJtAzjEd9BhU9LQN9R52hP7gjkb2';
const SHARED_UID = 'KQBu6SfAcMSCKBrgp6dlxkQ2Zna2';
const UNKNOWN_UID = 'uid-not-authorized';

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

test('nega leitura sem autenticação', async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'users', MASTER_UID, 'clients', 'unauthenticated')));
});

test('nega usuário autenticado que não está autorizado', async () => {
  const db = testEnv.authenticatedContext(UNKNOWN_UID).firestore();
  await assertFails(setDoc(doc(db, 'users', UNKNOWN_UID, 'clients', 'blocked'), { name: 'blocked' }));
});

test('permite o usuário Master no caminho compartilhado', async () => {
  const db = testEnv.authenticatedContext(MASTER_UID).firestore();
  await assertSucceeds(setDoc(doc(db, 'users', MASTER_UID, 'clients', 'master'), { name: 'master' }));
});

test('permite o usuário compartilhado no caminho do Master', async () => {
  const sharedDb = testEnv.authenticatedContext(SHARED_UID).firestore();
  const masterDb = testEnv.authenticatedContext(MASTER_UID).firestore();
  const clientRef = doc(masterDb, 'users', MASTER_UID, 'clients', 'shared-read');

  await assertSucceeds(setDoc(clientRef, { name: 'shared' }));
  await assertSucceeds(getDoc(doc(sharedDb, 'users', MASTER_UID, 'clients', 'shared-read')));
});

test('não permite o Master acessar o caminho individual do usuário compartilhado', async () => {
  const db = testEnv.authenticatedContext(MASTER_UID).firestore();
  await assertFails(getDoc(doc(db, 'users', SHARED_UID, 'clients', 'private')));
});

test('não permite o usuário compartilhado acessar o caminho individual do usuário desconhecido', async () => {
  const db = testEnv.authenticatedContext(SHARED_UID).firestore();
  await assertFails(getDoc(doc(db, 'users', UNKNOWN_UID, 'clients', 'private')));
});

test('mantém a regra explicitamente fechada para caminhos fora de users', async () => {
  const db = testEnv.authenticatedContext(MASTER_UID).firestore();
  await assertFails(setDoc(doc(db, 'publicData', 'blocked'), { value: true }));
  assert.ok(true);
});
