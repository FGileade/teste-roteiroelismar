/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * backupRestore.ts — Sistema de Backup e Restauração
 * Exporta/restaura todos os dados do usuário (Tenant) no Firestore.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  getDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { db, auth } from './firebase';
import { CHANGE_AWARE_SYNC_ENABLED, INCREMENTAL_SYNC_ENABLED } from './firebaseSync';

export const BACKUP_VERSION = '1.0.0';
export const APP_VERSION = '2.0.0';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface BackupProgress {
  phase: 'idle' | 'auth' | 'reading' | 'writing' | 'done' | 'error';
  label: string;
  collection: string;
  percent: number;
}

export interface BackupReport {
  clients: number;
  visits: number;
  negotiations: number;
  voiceNotes: number;
  events: number;
  loans: number;
  initializedDates: number;
  filename: string;
  duration: string;
}

export interface BackupFile {
  backupVersion: string;
  systemVersion: string;
  projectId: string;
  tenantId: string;
  tenantEmail: string;
  createdAt: string;
  createdBy: string;
  collections: {
    clients: unknown[];
    visits: unknown[];
    negotiations: unknown[];
    voiceNotes: unknown[];
    events: unknown[];
    loans: unknown[];
    initializedDates: string[];
  };
  audit: {
    userAgent: string;
    timestamp: string;
    operation: 'export' | 'restore';
  };
}

// ─── Reautenticação ──────────────────────────────────────────────────────────

export async function reauthUser(password: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Usuário não autenticado.');
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
}

// ─── Exportação ───────────────────────────────────────────────────────────────

const COLLECTIONS = [
  { key: 'clients',      label: 'Clientes',      col: 'clients' },
  { key: 'visits',       label: 'Visitas',        col: 'visits' },
  { key: 'negotiations', label: 'Negociações',    col: 'negotiations' },
  { key: 'voiceNotes',   label: 'Notas de Voz',  col: 'voiceNotes' },
  { key: 'events',       label: 'Agenda',         col: 'events' },
  { key: 'loans',        label: 'Empréstimos',    col: 'loans' },
];

export async function exportBackup(
  userId: string,
  onProgress: (p: BackupProgress) => void
): Promise<BackupReport> {
  const start = Date.now();
  const user = auth.currentUser!;
  const data: Record<string, unknown[]> = {};

  onProgress({ phase: 'reading', label: 'Lendo dados...', collection: '', percent: 0 });

  for (let i = 0; i < COLLECTIONS.length; i++) {
    const { key, label, col } = COLLECTIONS[i];
    onProgress({
      phase: 'reading',
      label: `Exportando ${label}...`,
      collection: label,
      percent: Math.round(((i) / (COLLECTIONS.length + 1)) * 90),
    });
    const snap = await getDocs(collection(db, 'users', userId, col));
    data[key] = snap.docs.map(d => d.data());
  }

  // Config/dates
  onProgress({ phase: 'reading', label: 'Exportando Configurações...', collection: 'Configurações', percent: 90 });
  const cfgSnap = await getDoc(doc(db, 'users', userId, 'config', 'dates'));
  const initializedDates: string[] = cfgSnap.exists() ? (cfgSnap.data().dates || []) : [];

  const now = new Date().toISOString();
  const backup: BackupFile = {
    backupVersion: BACKUP_VERSION,
    systemVersion: APP_VERSION,
    projectId: 'roteiroelismar',
    tenantId: userId,
    tenantEmail: user.email || '',
    createdAt: now,
    createdBy: user.uid,
    collections: {
      clients:       data['clients'] as unknown[],
      visits:        data['visits'] as unknown[],
      negotiations:  data['negotiations'] as unknown[],
      voiceNotes:    data['voiceNotes'] as unknown[],
      events:        data['events'] as unknown[],
      loans:         data['loans'] as unknown[],
      initializedDates,
    },
    audit: {
      userAgent: navigator.userAgent,
      timestamp: now,
      operation: 'export',
    },
  };

  onProgress({ phase: 'writing', label: 'Gerando arquivo...', collection: '', percent: 95 });

  const dt = now.replace(/[-:T]/g, '').slice(0, 15).replace('.', '');
  const filename = `backup-roteiroelismar-${dt.slice(0,8)}-${dt.slice(8,14)}.json`;
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  // Audit log
  await saveAuditLog(userId, 'export', true, filename);

  const duration = formatDuration(Date.now() - start);
  onProgress({ phase: 'done', label: 'Backup concluído!', collection: '', percent: 100 });

  return {
    clients:          (data['clients'] as unknown[]).length,
    visits:           (data['visits'] as unknown[]).length,
    negotiations:     (data['negotiations'] as unknown[]).length,
    voiceNotes:       (data['voiceNotes'] as unknown[]).length,
    events:           (data['events'] as unknown[]).length,
    loans:            (data['loans'] as unknown[]).length,
    initializedDates: initializedDates.length,
    filename,
    duration,
  };
}

// ─── Restauração ─────────────────────────────────────────────────────────────

export function validateBackupFile(raw: unknown): BackupFile {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Arquivo inválido ou corrompido.');
  }

  const b = raw as BackupFile;
  const collections = b.collections as unknown as Record<string, unknown> | undefined;
  const requiredCollections = ['clients', 'visits', 'negotiations', 'voiceNotes', 'events', 'loans', 'initializedDates'];

  if (b.projectId !== 'roteiroelismar' || !b.backupVersion || !b.tenantId || !collections) {
    throw new Error('Arquivo inválido ou corrompido.');
  }

  for (const collectionName of requiredCollections) {
    if (!Array.isArray(collections[collectionName])) {
      throw new Error(`Coleção ausente ou inválida no backup: ${collectionName}.`);
    }
  }

  for (const collectionName of requiredCollections.filter(name => name !== 'initializedDates')) {
    const items = collections[collectionName] as unknown[];
    if (items.some(item => (
      !item ||
      typeof item !== 'object' ||
      typeof (item as { id?: unknown }).id !== 'string' ||
      !(item as { id: string }).id.trim()
    ))) {
      throw new Error(`Documento sem ID válido no backup: ${collectionName}.`);
    }
  }

  if ((collections.initializedDates as unknown[]).some(date => typeof date !== 'string')) {
    throw new Error('Estrutura do backup incompleta.');
  }

  return b;
}

export async function restoreBackup(
  userId: string,
  backup: BackupFile,
  onProgress: (p: BackupProgress) => void
): Promise<BackupReport> {
  const start = Date.now();

  for (let i = 0; i < COLLECTIONS.length; i++) {
    const { key, label, col } = COLLECTIONS[i];
    onProgress({
      phase: 'writing',
      label: `Restaurando ${label}...`,
      collection: label,
      percent: Math.round(((i) / (COLLECTIONS.length + 1)) * 90),
    });

    const items = (backup.collections as Record<string, unknown[]>)[key] || [];
  await restoreCollection(userId, col, items as { id: string }[]);
  }

  // Restore config/dates
  onProgress({ phase: 'writing', label: 'Restaurando Configurações...', collection: 'Configurações', percent: 92 });
  const cfgDoc = doc(db, 'users', userId, 'config', 'dates');
  await setDoc(cfgDoc, { dates: backup.collections.initializedDates || [] });

  if (CHANGE_AWARE_SYNC_ENABLED || INCREMENTAL_SYNC_ENABLED) {
    await setDoc(doc(db, 'users', userId, 'config', 'syncState'), {
      version: increment(1),
      incrementalReady: INCREMENTAL_SYNC_ENABLED,
      schemaVersion: INCREMENTAL_SYNC_ENABLED ? 1 : 0,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    }, { merge: true });
  }

  // Audit log
  const filename = `restore-${new Date().toISOString().slice(0,19).replace(/[:-]/g, '')}`;
  await saveAuditLog(userId, 'restore', true, filename);

  const duration = formatDuration(Date.now() - start);
  onProgress({ phase: 'done', label: 'Restauração concluída!', collection: '', percent: 100 });

  return {
    clients:          backup.collections.clients?.length || 0,
    visits:           backup.collections.visits?.length || 0,
    negotiations:     backup.collections.negotiations?.length || 0,
    voiceNotes:       backup.collections.voiceNotes?.length || 0,
    events:           backup.collections.events?.length || 0,
    loans:            backup.collections.loans?.length || 0,
    initializedDates: backup.collections.initializedDates?.length || 0,
    filename: backup.collections.clients?.length ? 'Arquivo importado' : '-',
    duration,
  };
}

async function restoreCollection(
  userId: string,
  colName: string,
  items: { id: string }[]
) {
  if (!items.length) return;

  // Batch write — sets each doc by original ID (preserves IDs)
  let batch = writeBatch(db);
  let count = 0;
  for (const item of items) {
    if (!item.id) continue;
    const ref = doc(db, 'users', userId, colName, item.id);
    batch.set(ref, INCREMENTAL_SYNC_ENABLED
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
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }
  if (count > 0) await batch.commit();
}

// ─── Auditoria ───────────────────────────────────────────────────────────────

async function saveAuditLog(
  userId: string,
  operation: 'export' | 'restore',
  success: boolean,
  filename: string
) {
  try {
    const id = `${operation}-${Date.now()}`;
    await setDoc(doc(db, 'users', userId, 'audit', id), {
      id,
      userId,
      operation,
      success,
      filename,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      appVersion: APP_VERSION,
    });
  } catch (_) {
    // Auditoria não deve bloquear operação principal
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
