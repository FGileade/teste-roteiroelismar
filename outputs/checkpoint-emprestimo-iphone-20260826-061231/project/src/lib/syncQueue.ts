/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * syncQueue.ts — Fila de sincronização offline para o Firestore.
 */

import {
  getSyncRevision,
  persistLocalSyncRevision,
  resolveBaseRevision,
} from './syncRevision';

export { getSyncRevision } from './syncRevision';

export interface SyncOperation {
  operationId: string;
  userId: string;
  entityType: 'clients' | 'visits' | 'negotiations' | 'voiceNotes' | 'events' | 'loans';
  entityId: string;
  operationType: 'set' | 'delete';
  payload: any;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  baseRevision: number | null;
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  lastError?: string;
}

const QUEUE_KEY = 'roteiro_pet_sync_queue';
const CHANGE_AWARE_SYNC_ENABLED = import.meta.env.VITE_FIRESTORE_CHANGE_AWARE_SYNC === 'true';
const INCREMENTAL_SYNC_ENABLED = import.meta.env.VITE_FIRESTORE_INCREMENTAL_SYNC === 'true';
const INCREMENTAL_SYNC_PILOT_UIDS = new Set(
  String(import.meta.env.VITE_FIRESTORE_INCREMENTAL_SYNC_PILOT_UIDS || '')
    .split(',')
    .map(uid => uid.trim())
    .filter(Boolean),
);

function isIncrementalSyncEnabledForUser(userId: string): boolean {
  return INCREMENTAL_SYNC_ENABLED && (
    INCREMENTAL_SYNC_PILOT_UIDS.size === 0 || INCREMENTAL_SYNC_PILOT_UIDS.has(userId)
  );
}

export function getSyncQueue(): SyncOperation[] {
  const data = localStorage.getItem(QUEUE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing sync queue:', e);
    return [];
  }
}

export function saveSyncQueue(queue: SyncOperation[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function addToQueue(
  userId: string,
  entityType: SyncOperation['entityType'],
  entityId: string,
  operationType: SyncOperation['operationType'],
  payload: any,
  baseRevision?: number | null,
) {
  const queue = getSyncQueue();
  const now = new Date().toISOString();
  
  // Overwrite any existing pending set operation for the same item to minimize transactions
  const existingIdx = queue.findIndex(
    op => op.userId === userId && 
          op.entityType === entityType && 
          op.entityId === entityId && 
          op.status === 'pending'
  );

  const operation: SyncOperation = {
    operationId: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    entityType,
    entityId,
    operationType,
    payload,
    createdAt: now,
    updatedAt: now,
    attempts: 0,
    baseRevision: resolveBaseRevision(entityType, entityId, payload, baseRevision),
    status: 'pending'
  };

  if (existingIdx !== -1) {
    queue[existingIdx] = operation;
  } else {
    queue.push(operation);
  }
  
  saveSyncQueue(queue);
  
  // Process immediately if online
  if (navigator.onLine) {
    processQueue(userId);
  }
}

let isProcessing = false;
let processTimeout: any = null;
let processAgain = false;
let processAgainUserId: string | null = null;
let processAgainStatusChange: ((status: string) => void) | undefined;

export async function processQueue(userId: string, onStatusChange?: (status: string) => void) {
  // Uma alteração pode entrar enquanto outra transação ainda está em curso.
  // Não podemos descartá-la: marcamos uma nova rodada para depois da atual.
  if (isProcessing) {
    processAgain = true;
    processAgainUserId = userId;
    processAgainStatusChange = onStatusChange;
    return;
  }

  // BUG 3 fix: verificar quantas operações pendentes existem para este usuário.
  // Se for apenas 1, executar sem debounce — evita que o iOS suspenda o app
  // antes do timeout de 400ms disparar (comportamento comum ao fechar o app logo após salvar).
  const immediateCheck = getSyncQueue().filter(
    op => op.userId === userId && (op.status === 'pending' || op.status === 'failed')
  );
  const useDebounce = immediateCheck.length > 1;

  // Clear existing timeout to debounce rapid additions to the queue
  if (processTimeout) {
    clearTimeout(processTimeout);
  }

  const delay = useDebounce ? 400 : 0; // 0ms para operação única, 400ms para rajada

  processTimeout = setTimeout(async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const queue = getSyncQueue();
      const userOps = queue.filter(op => op.userId === userId && (op.status === 'pending' || op.status === 'failed'));
      
      if (userOps.length === 0) {
        if (onStatusChange) onStatusChange('synced');
        isProcessing = false;
        return;
      }

      if (onStatusChange) onStatusChange('syncing');

      const { db } = await import('./firebase');
      const { doc, increment, runTransaction, serverTimestamp, writeBatch } = await import('firebase/firestore');
      const syncStateRef = doc(db, 'users', userId, 'config', 'syncState');

      const markBatchChanged = () => {
        if (!CHANGE_AWARE_SYNC_ENABLED && !isIncrementalSyncEnabledForUser(userId)) return;
        batch.set(syncStateRef, {
          version: increment(1),
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        }, { merge: true });
      };

      if (isIncrementalSyncEnabledForUser(userId)) {
        for (const op of userOps) {
          op.status = 'syncing';
          op.attempts++;
          const docRef = doc(db, 'users', userId, op.entityType, op.entityId);

          try {
            const result = await runTransaction(db, async transaction => {
              const remoteSnapshot = await transaction.get(docRef);
              const remoteData = remoteSnapshot.exists() ? remoteSnapshot.data() : null;
              const remoteRevision = getSyncRevision(remoteData);
              const baseRevision = op.baseRevision === undefined
                ? getSyncRevision(op.payload)
                : op.baseRevision;

              const conflict = remoteSnapshot.exists()
                ? baseRevision === null || remoteRevision === null || remoteRevision !== baseRevision
                : baseRevision !== null && baseRevision !== 0;

              if (conflict) {
                return {
                  conflict: true,
                  remoteRevision,
                };
              }

              const nextRevision = (remoteRevision || 0) + 1;
              const syncMetadata = {
                revision: nextRevision,
                updatedAt: serverTimestamp(),
                updatedBy: userId,
                deletedAt: op.operationType === 'delete' ? serverTimestamp() : null,
              };

              if (op.operationType === 'delete') {
                transaction.set(docRef, { _sync: syncMetadata }, { merge: true });
              } else {
                transaction.set(docRef, {
                  ...(op.payload || {}),
                  _sync: syncMetadata,
                }, { merge: true });
              }

              transaction.set(syncStateRef, {
                version: increment(1),
                updatedAt: serverTimestamp(),
                updatedBy: userId,
              }, { merge: true });

              return { conflict: false, remoteRevision, revision: nextRevision };
            });

            if (result.conflict) {
              op.status = 'conflict';
              op.lastError = `Conflito detectado: revisão remota ${result.remoteRevision ?? 'desconhecida'} diferente da revisão local ${op.baseRevision ?? 'desconhecida'}.`;
            } else {
              if (typeof result.revision === 'number') {
                if (op.operationType === 'set') {
                  op.payload = {
                    ...(op.payload || {}),
                    _sync: {
                      ...(op.payload?._sync || {}),
                      revision: result.revision,
                      updatedBy: userId,
                      deletedAt: null,
                    },
                  };
                }
                persistLocalSyncRevision(
                  op.entityType,
                  op.entityId,
                  result.revision,
                  op.operationType,
                  userId,
                );
              }
              op.status = 'synced';
              op.lastError = undefined;
            }
          } catch (err: any) {
            console.error('Failed to commit incremental sync operation:', err);
            op.status = 'failed';
            op.lastError = err.message || String(err);
          }

          saveSyncQueue(queue);
        }

        const conflictOperation = userOps.find(op => op.status === 'conflict');
        const failedOperation = userOps.find(op => op.status === 'failed');
        if (conflictOperation) {
          onStatusChange?.(`conflict:${conflictOperation.lastError || 'conflito detectado'}`);
        } else if (failedOperation) {
          onStatusChange?.(`failed:${failedOperation.lastError || 'erro desconhecido'}`);
        } else {
          onStatusChange?.('synced');
        }

        isProcessing = false;
        processTimeout = null;
        return;
      }

      // Process operations in batches of 400 (Firestore maximum is 500)
      let batch = writeBatch(db);
      let batchCount = 0;
      const processedOps: typeof userOps = [];

      for (const op of userOps) {
        op.status = 'syncing';
        op.attempts++;
        processedOps.push(op);

        const docRef = doc(db, 'users', userId, op.entityType, op.entityId);

        if (op.operationType === 'set') {
          if (isIncrementalSyncEnabledForUser(userId)) {
            batch.set(docRef, {
              ...(op.payload || {}),
              _sync: {
                revision: increment(1),
                updatedAt: serverTimestamp(),
                updatedBy: userId,
                deletedAt: null,
              },
            }, { merge: true });
          } else {
            batch.set(docRef, op.payload);
          }
        } else if (op.operationType === 'delete') {
          if (isIncrementalSyncEnabledForUser(userId)) {
            batch.set(docRef, {
              _sync: {
                revision: increment(1),
                updatedAt: serverTimestamp(),
                updatedBy: userId,
                deletedAt: serverTimestamp(),
              },
            }, { merge: true });
          } else {
            batch.delete(docRef);
          }
        }

        batchCount++;
        if (batchCount === 400) {
          try {
            markBatchChanged();
            await batch.commit();
            processedOps.forEach(o => o.status = 'synced');
          } catch (err: any) {
            console.error('Failed to commit sync batch:', err);
            processedOps.forEach(o => {
              o.status = 'failed';
              o.lastError = err.message || String(err);
            });
          }
          saveSyncQueue(queue);
          batch = writeBatch(db);
          batchCount = 0;
          processedOps.length = 0;
        }
      }

      // Commit any remaining operations in the final batch
      if (batchCount > 0) {
        try {
          markBatchChanged();
          await batch.commit();
          processedOps.forEach(o => o.status = 'synced');
        } catch (err: any) {
          console.error('Failed to commit final sync batch:', err);
          processedOps.forEach(o => {
            o.status = 'failed';
            o.lastError = err.message || String(err);
          });
        }
      }

      // Retain only unsynced or failed entries in the queue
      const updatedQueue = getSyncQueue().filter(op => op.status !== 'synced');
      saveSyncQueue(updatedQueue);

      const remainingPending = updatedQueue.filter(op => op.userId === userId && op.status !== 'failed').length;
      if (onStatusChange) {
        if (remainingPending === 0) {
          onStatusChange('synced');
        } else {
          const failedOperation = updatedQueue.find(op => op.userId === userId && op.status === 'failed');
          onStatusChange(`failed:${failedOperation?.lastError || 'erro desconhecido'}`);
        }
      }
    } catch (e) {
      console.error('Queue processing error:', e);
    } finally {
      isProcessing = false;
      processTimeout = null;

      if (processAgain && processAgainUserId) {
        const nextUserId = processAgainUserId;
        const nextStatusChange = processAgainStatusChange;
        processAgain = false;
        processAgainUserId = null;
        processAgainStatusChange = undefined;
        queueMicrotask(() => {
          void processQueue(nextUserId, nextStatusChange);
        });
      }
    }
  }, delay); // 0ms para operação única (iOS-safe), 400ms para múltiplas em rajada
}
