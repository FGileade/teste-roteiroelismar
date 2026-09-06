/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  writeBatch,
  query,
  getDoc,
  limit,
  increment,
  serverTimestamp,
  where,
  orderBy,
  startAfter,
  documentId,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Client, Visit, NegotiationHistory, VoiceNote, AgendaEvent, ProductLoan } from '../types';
import { normalizeProductLoan } from './productLoans';

// UIDs que compartilham o mesmo banco de dados (acesso idêntico)
const MASTER_UID = 'OJtAzjEd9BhU9LQN9R52hP7gjkb2';
const SHARED_UIDS: string[] = ['KQBu6SfAcMSCKBrgp6dlxkQ2Zna2'];
const SYNC_STATE_DOC = 'syncState';
const LOCAL_SYNC_VERSION_PREFIX = 'roteiro_pet_firestore_sync_version:';
const LOCAL_CURSOR_PREFIX = 'roteiro_pet_firestore_cursor:';

// Safe rollout flag: keep the legacy flow until the change-aware flow is validated.
export const CHANGE_AWARE_SYNC_ENABLED = import.meta.env.VITE_FIRESTORE_CHANGE_AWARE_SYNC === 'true';
export const INCREMENTAL_SYNC_ENABLED = import.meta.env.VITE_FIRESTORE_INCREMENTAL_SYNC === 'true';

type SyncCursor = {
  updatedAtMillis: number;
  documentId: string;
};

type SyncRecord = {
  _sync?: {
    revision?: number;
    updatedAt?: Timestamp;
    updatedBy?: string;
    deletedAt?: Timestamp | null;
  };
};

export type IncrementalUserData = {
  clients: Client[];
  visits: Visit[];
  negotiations: NegotiationHistory[];
  voiceNotes: VoiceNote[];
  agendaEvents: AgendaEvent[];
  loans: ProductLoan[];
  initializedDates: string[];
};

/**
 * Resolve o UID efetivo para acesso ao Firestore.
 * UIDs secundários são redirecionados para o MASTER_UID, compartilhando os mesmos dados.
 */
export function resolveUserId(uid: string): string {
  return SHARED_UIDS.includes(uid) ? MASTER_UID : uid;
}

function syncStateRef(userId: string) {
  return doc(db, 'users', userId, 'config', SYNC_STATE_DOC);
}

function localSyncVersionKey(userId: string) {
  return `${LOCAL_SYNC_VERSION_PREFIX}${userId}`;
}

function localCursorKey(userId: string, collectionName: string) {
  return `${LOCAL_CURSOR_PREFIX}${userId}:${collectionName}`;
}

function readLocalCursor(userId: string, collectionName: string): SyncCursor | null {
  const raw = localStorage.getItem(localCursorKey(userId, collectionName));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SyncCursor;
    if (
      Number.isFinite(parsed.updatedAtMillis) &&
      typeof parsed.documentId === 'string' &&
      parsed.documentId.length > 0
    ) {
      return parsed;
    }
  } catch {
    // Ignore malformed cursors and force a safe collection refresh.
  }

  return null;
}

function saveLocalCursor(userId: string, collectionName: string, cursor: SyncCursor) {
  localStorage.setItem(localCursorKey(userId, collectionName), JSON.stringify(cursor));
}

function isTombstone(data: SyncRecord) {
  return Boolean(data._sync?.deletedAt);
}

function mergeIncrementalItems<T extends { id: string }>(currentItems: T[], changes: T[]): T[] {
  const itemsById = new Map(currentItems.map(item => [item.id, item]));

  for (const item of changes) {
    if (isTombstone(item as T & SyncRecord)) {
      itemsById.delete(item.id);
    } else {
      itemsById.set(item.id, item);
    }
  }

  return Array.from(itemsById.values());
}

async function readIncrementalCollection<T extends { id: string }>(
  userId: string,
  collectionName: string,
  cursor: SyncCursor | null,
  pageSize = 200,
): Promise<{ changes: T[]; cursor: SyncCursor | null }> {
  const colRef = collection(db, 'users', userId, collectionName);
  const changes: T[] = [];
  let nextCursor = cursor;

  while (true) {
    const constraints = [
      where('_sync.updatedAt', '>=', Timestamp.fromMillis(nextCursor?.updatedAtMillis || 0)),
      orderBy('_sync.updatedAt', 'asc'),
      orderBy(documentId(), 'asc'),
      limit(pageSize),
    ];

    const pageQuery = nextCursor
      ? query(
          colRef,
          ...constraints.slice(0, 3),
          startAfter(Timestamp.fromMillis(nextCursor.updatedAtMillis), nextCursor.documentId),
          constraints[3],
        )
      : query(colRef, ...constraints);
    const snapshot = await getDocs(pageQuery);

    if (snapshot.empty) break;

    for (const snapshotDoc of snapshot.docs) {
      const data = snapshotDoc.data() as T & SyncRecord;
      const updatedAt = data._sync?.updatedAt;
      if (!updatedAt || typeof updatedAt.toMillis !== 'function') continue;

      changes.push({ ...data, id: snapshotDoc.id } as T);
      nextCursor = {
        updatedAtMillis: updatedAt.toMillis(),
        documentId: snapshotDoc.id,
      };
    }

    if (snapshot.size < pageSize || !nextCursor) break;
  }

  return { changes, cursor: nextCursor };
}

async function readCloudSyncVersion(userId: string): Promise<number | null> {
  const snapshot = await getDoc(syncStateRef(userId));
  if (!snapshot.exists()) return null;

  const version = snapshot.data().version;
  return typeof version === 'number' && Number.isFinite(version) ? version : 0;
}

/**
 * Returns null for legacy users without a sync marker.
 * A true value means the full cloud snapshot must be refreshed.
 */
export async function shouldRefreshUserData(userId: string): Promise<boolean | null> {
  const cloudVersion = await readCloudSyncVersion(userId);
  if (cloudVersion === null) return null;

  const localVersion = localStorage.getItem(localSyncVersionKey(userId));
  return localVersion === null || Number(localVersion) !== cloudVersion;
}

/**
 * Records the current cloud marker after a verified full synchronization.
 * Legacy accounts receive the marker once, without changing application data.
 */
export async function rememberCloudSyncVersion(userId: string): Promise<void> {
  let cloudVersion = await readCloudSyncVersion(userId);
  if (cloudVersion === null) {
    await setDoc(syncStateRef(userId), {
      version: 0,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    }, { merge: true });
    cloudVersion = 0;
  }

  localStorage.setItem(localSyncVersionKey(userId), String(cloudVersion));
}

/**
 * Touches the marker atomically with a write batch so another device can detect changes.
 */
export async function touchCloudSyncState(userId: string): Promise<void> {
  if (!CHANGE_AWARE_SYNC_ENABLED && !INCREMENTAL_SYNC_ENABLED) return;

  await setDoc(syncStateRef(userId), {
    version: increment(1),
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  }, { merge: true });
}

/**
 * Checks if the user already has data stored in Firestore.
 */
export async function hasCloudData(userId: string): Promise<boolean> {
  try {
    const clientsCol = collection(db, 'users', userId, 'clients');
    const snapshot = await getDocs(query(clientsCol, limit(1)));
    return !snapshot.empty;
  } catch (e) {
    console.error('Error checking cloud data:', e);
    // Um erro de rede/permissão nunca pode ser interpretado como banco vazio.
    // Propagar o erro impede um upload inicial que poderia sobrescrever dados.
    throw e;
  }
}

/**
 * Downloads all data for a specific user from Firestore.
 */
export async function downloadUserData(userId: string) {
  try {
    // 1. Get Clients
    const clientsCol = collection(db, 'users', userId, 'clients');
    const clientsSnap = await getDocs(clientsCol);
    const clients: Client[] = [];
    clientsSnap.forEach(doc => {
      const data = doc.data();
      if (!isTombstone(data)) clients.push(data as Client);
    });

    // 2. Get Visits
    const visitsCol = collection(db, 'users', userId, 'visits');
    const visitsSnap = await getDocs(visitsCol);
    const visits: Visit[] = [];
    visitsSnap.forEach(doc => {
      const data = doc.data();
      if (!isTombstone(data)) visits.push(data as Visit);
    });

    // 3. Get Negotiations
    const negsCol = collection(db, 'users', userId, 'negotiations');
    const negsSnap = await getDocs(negsCol);
    const negotiations: NegotiationHistory[] = [];
    negsSnap.forEach(doc => {
      const data = doc.data();
      if (!isTombstone(data)) negotiations.push(data as NegotiationHistory);
    });

    // 4. Get Voice Notes
    const voiceCol = collection(db, 'users', userId, 'voiceNotes');
    const voiceSnap = await getDocs(voiceCol);
    const voiceNotes: VoiceNote[] = [];
    voiceSnap.forEach(doc => {
      const data = doc.data();
      if (!isTombstone(data)) voiceNotes.push(data as VoiceNote);
    });

    // 4.5. Get Agenda Events
    const eventsCol = collection(db, 'users', userId, 'events');
    const eventsSnap = await getDocs(eventsCol);
    const agendaEvents: AgendaEvent[] = [];
    eventsSnap.forEach(doc => {
      const data = doc.data();
      if (!isTombstone(data)) agendaEvents.push(data as AgendaEvent);
    });

    // 4.6. Get Product Loans
    const loansCol = collection(db, 'users', userId, 'loans');
    const loansSnap = await getDocs(loansCol);
    const loans: ProductLoan[] = [];
    loansSnap.forEach(doc => {
      const data = doc.data();
      if (isTombstone(data)) return;
      const loan = normalizeProductLoan(data);
      if (loan) loans.push(loan);
    });

    // 5. Get Initialized Dates
    const configDoc = doc(db, 'users', userId, 'config', 'dates');
    const configSnap = await getDoc(configDoc);
    let initializedDates: string[] = [];
    if (configSnap.exists()) {
      initializedDates = configSnap.data().dates || [];
    }

    return {
      clients: clients.sort((a, b) => a.routeOrder - b.routeOrder),
      visits,
      negotiations,
      voiceNotes,
      agendaEvents,
      loans,
      initializedDates
    };
  } catch (e) {
    console.error('Error downloading user data from cloud:', e);
    throw e;
  }
}

export async function isIncrementalSyncReady(userId: string): Promise<boolean> {
  const snapshot = await getDoc(syncStateRef(userId));
  return snapshot.exists() && snapshot.data().incrementalReady === true;
}

/**
 * Reads only documents changed after each local cursor.
 * Documents without _sync metadata are intentionally ignored until migration.
 */
export async function downloadIncrementalUserData(
  userId: string,
  currentData: IncrementalUserData,
): Promise<IncrementalUserData> {
  const collectionDefinitions = [
    { name: 'clients', current: currentData.clients },
    { name: 'visits', current: currentData.visits },
    { name: 'negotiations', current: currentData.negotiations },
    { name: 'voiceNotes', current: currentData.voiceNotes },
    { name: 'events', current: currentData.agendaEvents },
    { name: 'loans', current: currentData.loans },
  ] as const;

  const changesByCollection = new Map<string, unknown[]>();
  const nextCursors = new Map<string, SyncCursor>();

  for (const definition of collectionDefinitions) {
    const cursor = readLocalCursor(userId, definition.name);
    const result = await readIncrementalCollection(userId, definition.name, cursor);
    if (result.cursor) nextCursors.set(definition.name, result.cursor);
    changesByCollection.set(definition.name, result.changes);
  }

  const datesSnapshot = await getDoc(doc(db, 'users', userId, 'config', 'dates'));
  const initializedDates = datesSnapshot.exists()
    ? (datesSnapshot.data().dates || [])
    : currentData.initializedDates;

  const clients = mergeIncrementalItems(
    currentData.clients,
    (changesByCollection.get('clients') || []) as Client[],
  ).sort((a, b) => a.routeOrder - b.routeOrder);
  const visits = mergeIncrementalItems(
    currentData.visits,
    (changesByCollection.get('visits') || []) as Visit[],
  );
  const negotiations = mergeIncrementalItems(
    currentData.negotiations,
    (changesByCollection.get('negotiations') || []) as NegotiationHistory[],
  );
  const voiceNotes = mergeIncrementalItems(
    currentData.voiceNotes,
    (changesByCollection.get('voiceNotes') || []) as VoiceNote[],
  );
  const agendaEvents = mergeIncrementalItems(
    currentData.agendaEvents,
    (changesByCollection.get('events') || []) as AgendaEvent[],
  );
  const loans = mergeIncrementalItems(
    currentData.loans,
    (changesByCollection.get('loans') || []) as ProductLoan[],
  ).map(normalizeProductLoan).filter((loan): loan is ProductLoan => Boolean(loan));

  // Só avança os cursores depois que todas as coleções foram lidas e mescladas.
  // Assim, uma falha intermediária força a repetição segura da página na próxima tentativa.
  for (const [collectionName, cursor] of nextCursors) {
    saveLocalCursor(userId, collectionName, cursor);
  }

  return {
    clients,
    visits,
    negotiations,
    voiceNotes,
    agendaEvents,
    loans,
    initializedDates,
  };
}

/**
 * One-time metadata migration. It never replaces application fields and must run only
 * after a verified backup. The function is intentionally not called during login.
 */
export async function migrateLegacyDataForIncrementalSync(userId: string): Promise<{ migrated: number }> {
  const collectionNames = ['clients', 'visits', 'negotiations', 'voiceNotes', 'events', 'loans'];
  let batch = writeBatch(db);
  let batchCount = 0;
  let migrated = 0;

  const commitBatch = async () => {
    if (batchCount === 0) return;
    await batch.commit();
    batch = writeBatch(db);
    batchCount = 0;
  };

  for (const collectionName of collectionNames) {
    const snapshot = await getDocs(collection(db, 'users', userId, collectionName));
    for (const snapshotDoc of snapshot.docs) {
      const data = snapshotDoc.data() as SyncRecord;
      if (data._sync?.updatedAt) continue;

      batch.set(doc(db, 'users', userId, collectionName, snapshotDoc.id), {
        _sync: {
          revision: 1,
          updatedAt: serverTimestamp(),
          updatedBy: userId,
          deletedAt: null,
        },
      }, { merge: true });
      batchCount++;
      migrated++;

      if (batchCount === 400) await commitBatch();
    }
  }

  await commitBatch();
  await setDoc(syncStateRef(userId), {
    incrementalReady: true,
    schemaVersion: 1,
    version: increment(1),
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  }, { merge: true });

  return { migrated };
}

/**
 * Uploads (fully overwrites) a collection in Firestore for a user.
 * Efficiently batches the writes.
 */
export async function uploadCollection<T extends { id: string }>(
  userId: string,
  collectionName: string,
  items: T[]
) {
  try {
    const colRef = collection(db, 'users', userId, collectionName);
    
    // First, retrieve existing docs to clean up any removed ones
    const existingSnap = await getDocs(colRef);
    const existingIds = new Set(existingSnap.docs.map(doc => doc.id));
    const newItemIds = new Set(items.map(item => item.id));

    // Batch delete removed items
    let deleteBatch = writeBatch(db);
    let deleteCount = 0;
    for (const id of existingIds) {
      if (!newItemIds.has(id)) {
        const existingDocRef = doc(db, 'users', userId, collectionName, id);
        if (INCREMENTAL_SYNC_ENABLED) {
          deleteBatch.set(existingDocRef, {
            _sync: {
              revision: increment(1),
              updatedAt: serverTimestamp(),
              updatedBy: userId,
              deletedAt: serverTimestamp(),
            },
          }, { merge: true });
        } else {
          deleteBatch.delete(existingDocRef);
        }
        deleteCount++;
        if (deleteCount === 400) {
          await deleteBatch.commit();
          deleteBatch = writeBatch(db);
          deleteCount = 0;
        }
      }
    }
    if (deleteCount > 0) {
      await deleteBatch.commit();
    }

    // Batch write/update current items
    let writeBatchInstance = writeBatch(db);
    let writeCount = 0;
    for (const item of items) {
      const docRef = doc(db, 'users', userId, collectionName, item.id);
      writeBatchInstance.set(docRef, INCREMENTAL_SYNC_ENABLED
        ? {
            ...item,
            _sync: {
              revision: increment(1),
              updatedAt: serverTimestamp(),
              updatedBy: userId,
              deletedAt: null,
            },
          }
        : item);
      writeCount++;
      if (writeCount === 400) {
        await writeBatchInstance.commit();
        writeBatchInstance = writeBatch(db);
        writeCount = 0;
      }
    }
    if (writeCount > 0) {
      await writeBatchInstance.commit();
    }
  } catch (e) {
    console.error(`Error uploading collection ${collectionName}:`, e);
    throw e;
  }
}

/**
 * Uploads all data to Firestore (used during onboarding / migration).
 */
export async function uploadAllUserData(
  userId: string,
  data: {
    clients: Client[];
    visits: Visit[];
    negotiations: NegotiationHistory[];
    voiceNotes: VoiceNote[];
    agendaEvents: AgendaEvent[];
    loans: ProductLoan[];
    initializedDates: string[];
  }
) {
  try {
    await uploadCollection(userId, 'clients', data.clients);
    await uploadCollection(userId, 'visits', data.visits);
    await uploadCollection(userId, 'negotiations', data.negotiations);
    await uploadCollection(userId, 'voiceNotes', data.voiceNotes);
    await uploadCollection(userId, 'events', data.agendaEvents);
    await uploadCollection(userId, 'loans', data.loans);
    
    const configDoc = doc(db, 'users', userId, 'config', 'dates');
    await setDoc(configDoc, { dates: data.initializedDates });
    await touchCloudSyncState(userId);
  } catch (e) {
    console.error('Error uploading all user data to cloud:', e);
    throw e;
  }
}

/**
 * Saves initialized dates specifically.
 */
export async function saveInitializedDatesToCloud(userId: string, dates: string[]) {
  try {
    const configDoc = doc(db, 'users', userId, 'config', 'dates');
    if (CHANGE_AWARE_SYNC_ENABLED || INCREMENTAL_SYNC_ENABLED) {
      const batch = writeBatch(db);
      batch.set(configDoc, { dates });
      batch.set(syncStateRef(userId), {
        version: increment(1),
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      }, { merge: true });
      await batch.commit();
    } else {
      await setDoc(configDoc, { dates });
    }
  } catch (e) {
    console.error('Error saving initialized dates to cloud:', e);
  }
}

/**
 * Sincroniza a diferença incremental entre dois arrays de itens para o Firestore.
 * Não realiza leituras no banco de dados e grava/deleta apenas os documentos modificados.
 */
export async function syncArrayToCloud<T extends { id: string }>(
  userId: string,
  collectionName: string,
  oldItems: T[],
  newItems: T[]
) {
  try {
    const oldMap = new Map(oldItems.map(item => [item.id, item]));
    const newMap = new Map(newItems.map(item => [item.id, item]));

    const toSet: T[] = [];
    const toDelete: string[] = [];

    // Identificar itens novos ou atualizados
    for (const item of newItems) {
      const oldItem = oldMap.get(item.id);
      if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
        toSet.push(item);
      }
    }

    // Identificar itens removidos
    for (const item of oldItems) {
      if (!newMap.has(item.id)) {
        toDelete.push(item.id);
      }
    }

    // Se nenhuma modificação foi feita, sai prematuramente (0 operações)
    if (toSet.length === 0 && toDelete.length === 0) {
      return;
    }

    const colRef = collection(db, 'users', userId, collectionName);

    // Se houver apenas 1 alteração simples, usa um lote de uma operação.
    if (toSet.length + toDelete.length === 1) {
      const batch = writeBatch(db);
      if (toSet.length === 1) {
        const item = toSet[0];
        batch.set(doc(colRef, item.id), INCREMENTAL_SYNC_ENABLED
          ? {
              ...item,
              _sync: {
                revision: increment(1),
                updatedAt: serverTimestamp(),
                updatedBy: userId,
                deletedAt: null,
              },
            }
          : item);
      } else {
        const id = toDelete[0];
        const itemRef = doc(colRef, id);
        if (INCREMENTAL_SYNC_ENABLED) {
          batch.set(itemRef, {
            _sync: {
              revision: increment(1),
              updatedAt: serverTimestamp(),
              updatedBy: userId,
              deletedAt: serverTimestamp(),
            },
          }, { merge: true });
        } else {
          batch.delete(itemRef);
        }
      }
      if (CHANGE_AWARE_SYNC_ENABLED || INCREMENTAL_SYNC_ENABLED) {
        batch.set(syncStateRef(userId), {
          version: increment(1),
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        }, { merge: true });
      }
      await batch.commit();
      return;
    }

    // Para múltiplas alterações, agrupa as operações em lotes atômicos (limite de 400 por lote)
    let batch = writeBatch(db);
    let count = 0;

    for (const id of toDelete) {
      const itemRef = doc(colRef, id);
      if (INCREMENTAL_SYNC_ENABLED) {
        batch.set(itemRef, {
          _sync: {
            revision: increment(1),
            updatedAt: serverTimestamp(),
            updatedBy: userId,
            deletedAt: serverTimestamp(),
          },
        }, { merge: true });
      } else {
        batch.delete(itemRef);
      }
      count++;
      if (count === 400) {
        if (CHANGE_AWARE_SYNC_ENABLED || INCREMENTAL_SYNC_ENABLED) {
          batch.set(syncStateRef(userId), {
            version: increment(1),
            updatedAt: serverTimestamp(),
            updatedBy: userId,
          }, { merge: true });
        }
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }

    for (const item of toSet) {
      batch.set(doc(colRef, item.id), INCREMENTAL_SYNC_ENABLED
        ? {
            ...item,
            _sync: {
              revision: increment(1),
              updatedAt: serverTimestamp(),
              updatedBy: userId,
              deletedAt: null,
            },
          }
        : item);
      count++;
      if (count === 400) {
        if (CHANGE_AWARE_SYNC_ENABLED || INCREMENTAL_SYNC_ENABLED) {
          batch.set(syncStateRef(userId), {
            version: increment(1),
            updatedAt: serverTimestamp(),
            updatedBy: userId,
          }, { merge: true });
        }
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }

    if (count > 0) {
      if (CHANGE_AWARE_SYNC_ENABLED || INCREMENTAL_SYNC_ENABLED) {
        batch.set(syncStateRef(userId), {
          version: increment(1),
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        }, { merge: true });
      }
      await batch.commit();
    }
  } catch (e) {
    console.error(`Erro ao sincronizar coleção ${collectionName} por deltas:`, e);
  }
}
