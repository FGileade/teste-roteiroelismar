/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * syncQueue.ts — Fila de sincronização offline para o Firestore.
 */

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
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  lastError?: string;
}

const QUEUE_KEY = 'roteiro_pet_sync_queue';

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
  payload: any
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

export async function processQueue(userId: string, onStatusChange?: (status: string) => void) {
  // Clear existing timeout to debounce rapid additions to the queue
  if (processTimeout) {
    clearTimeout(processTimeout);
  }

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
      const { doc, writeBatch } = await import('firebase/firestore');

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
          batch.set(docRef, op.payload);
        } else if (op.operationType === 'delete') {
          batch.delete(docRef);
        }

        batchCount++;
        if (batchCount === 400) {
          try {
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
    }
  }, 400); // 400ms debounce window to accumulate rapid updates (e.g. route initialization)
}
