/**
 * Helpers for keeping incremental-sync revisions consistent between the
 * Firestore queue and the browser's local datasets.
 */

export type SyncEntityType = 'clients' | 'visits' | 'negotiations' | 'voiceNotes' | 'events' | 'loans';

type SyncPayload = {
  id?: string;
  _sync?: {
    revision?: number;
    updatedAt?: unknown;
    updatedBy?: string;
    deletedAt?: unknown;
  };
};

const LOCAL_STORAGE_KEYS: Record<SyncEntityType, string> = {
  clients: 'roteiro_pet_clients',
  visits: 'roteiro_pet_visits',
  negotiations: 'roteiro_pet_negotiations',
  voiceNotes: 'roteiro_pet_voice_notes',
  events: 'roteiro_pet_events',
  loans: 'roteiro_pet_loans',
};

const LOCAL_SYNC_ENTITY_TYPES: SyncEntityType[] = [
  'clients',
  'visits',
  'negotiations',
  'voiceNotes',
  'events',
  'loans',
];

export function getSyncRevision(payload: unknown): number | null {
  const revision = (payload as SyncPayload | null | undefined)?._sync?.revision;
  return typeof revision === 'number' && Number.isFinite(revision) ? revision : null;
}

export function getLocalSyncRevision(entityType: SyncEntityType, entityId: string): number | null {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEYS[entityType]);
  if (!raw) return null;

  try {
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return null;
    const item = items.find((candidate) => candidate?.id === entityId);
    return getSyncRevision(item);
  } catch {
    return null;
  }
}

/**
 * Detects stale local data left by an older session or by a legacy snapshot.
 * Incremental cursors are only safe when every local collection is present
 * and every local item carries the revision written by Firestore.
 */
export function hasCompleteLocalSyncSnapshot(): boolean {
  return LOCAL_SYNC_ENTITY_TYPES.every((entityType) => {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS[entityType]);
    if (raw === null) return false;

    try {
      const items = JSON.parse(raw);
      return Array.isArray(items) && items.every((item) => getSyncRevision(item) !== null);
    } catch {
      return false;
    }
  });
}

/**
 * Uses the local revision when the React state predates the server metadata.
 * This is essential after creating an item and editing it again in the same
 * session, before React has rehydrated from Firestore.
 */
export function resolveBaseRevision(
  entityType: SyncEntityType,
  entityId: string,
  payload: unknown,
  baseRevision?: number | null,
): number | null {
  if (baseRevision !== null && baseRevision !== undefined) return baseRevision;
  return getLocalSyncRevision(entityType, entityId) ?? getSyncRevision(payload);
}

export function persistLocalSyncRevision(
  entityType: SyncEntityType,
  entityId: string,
  revision: number,
  operationType: 'set' | 'delete',
  userId: string,
): void {
  const storageKey = LOCAL_STORAGE_KEYS[entityType];
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;

  try {
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return;

    const updatedItems = operationType === 'delete'
      ? items.filter((item) => item?.id !== entityId)
      : items.map((item) => item?.id === entityId
        ? {
            ...item,
            _sync: {
              ...(item._sync || {}),
              revision,
              updatedBy: userId,
              deletedAt: null,
            },
          }
        : item);

    localStorage.setItem(storageKey, JSON.stringify(updatedItems));
  } catch {
    // A malformed local dataset will be rebuilt by the next cloud download.
  }
}
