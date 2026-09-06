/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client, Visit, NegotiationHistory, WeekDay, RouteFrequency, VoiceNote, AgendaEvent, ProductLoan } from './types';
import { getLoanStatus, normalizeProductLoans } from './lib/productLoans';

import { getDayNameFromDate } from './data/initialData';
import Dashboard from './components/Dashboard';
import ClientManagement from './components/ClientManagement';
import Settings from './components/Settings';
import Login from './components/Login';
import BottomNavBar from './components/BottomNavBar';
import VoiceNotesModal from './components/VoiceNotesModal';
import { getLocalTodayString, getClientDisplayName } from './utils';
import VersiculoBanner from './components/VersiculoBanner';
import EventModal from './components/EventModal';
import { requestNotificationPermission, scheduleEventNotification } from './components/EventModal';
import EventsManagerModal from './components/EventsManagerModal';
import { ExcelImportReport } from './lib/excelService';

import { Compass, Wifi, Cloud, CloudOff, AlertCircle } from 'lucide-react';
import { auth, signOut } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  hasCloudData,
  downloadUserData,
  uploadAllUserData,
  uploadCollection,
  saveInitializedDatesToCloud,
  resolveUserId,
  CHANGE_AWARE_SYNC_ENABLED,
  isIncrementalSyncEnabledForUser,
  isIncrementalSyncReady,
  shouldRefreshUserData,
  downloadIncrementalUserData,
  rememberCloudSyncVersion,
  clearLocalSyncState,
} from './lib/firebaseSync';
import { addToQueue, getSyncRevision, processQueue } from './lib/syncQueue';
import { hasCompleteLocalSyncSnapshot } from './lib/syncRevision';

type TabType = 'agenda' | 'clientes' | 'emprestimos' | 'configuracoes';

// Safe helper to calculate bi-weekly week offset (0 or 1) based on standard ISO week
const getWeekOffsetForDate = (dateStr: string): 0 | 1 => {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return (weekNum % 2 === 0 ? 1 : 0);
  } catch (e) {
    return 0;
  }
};

const syncVisitsWithClients = (
  currentClients: Client[],
  currentVisits: Visit[],
  activeDates: string[]
): Visit[] => {
  let updatedVisits = [...currentVisits];

  for (const dateStr of activeDates) {
    const d = new Date(dateStr + 'T12:00:00');
    const weekday = getDayNameFromDate(d);
    const currentWeekOffset = getWeekOffsetForDate(dateStr);

    // Get all clients that SHOULD be visited on this date
    const scheduledClients = currentClients.filter(c => {
      if (c.weekday !== weekday) return false;
      if (c.frequency === 'weekly') return true;
      if (c.frequency === 'biweekly') {
        return c.weekOffset === currentWeekOffset;
      }
      if (c.frequency === 'monthly') {
        const monthWeek = c.monthWeek || 1;
        const dateMonthWeek = Math.ceil(d.getDate() / 7);
        return dateMonthWeek === monthWeek;
      }
      return false;
    });

    // 1. Add missing visits for scheduled clients on this date
    for (const client of scheduledClients) {
      const hasVisit = updatedVisits.some(v => v.clientId === client.id && v.date === dateStr);
      if (!hasVisit) {
        // Create pending visit
        updatedVisits.push({
          id: `v_${dateStr}_${client.id}`,
          clientId: client.id,
          clientName: getClientDisplayName(client),
          address: client.address,
          date: dateStr,
          status: 'pending',
          isExtra: false
        });
      } else {
        // Update details of existing visit if pending
        updatedVisits = updatedVisits.map(v => {
          if (v.clientId === client.id && v.date === dateStr && v.status === 'pending') {
            return {
              ...v,
              clientName: getClientDisplayName(client),
              address: client.address
            };
          }
          return v;
        });
      }
    }

    // 2. Remove pending visits for clients that are no longer scheduled for this date (and are NOT extra)
    updatedVisits = updatedVisits.filter(v => {
      if (v.date !== dateStr) return true;
      if (v.status !== 'pending') return true; // Don't remove completed/canceled visits
      if (v.isExtra) return true; // Don't remove extra visits manually added

      // Check if client is still scheduled on this date
      const isScheduled = scheduledClients.some(c => c.id === v.clientId);
      return isScheduled;
    });
  }

  return updatedVisits;
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('roteiro_pet_is_logged_in') === 'true';
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('roteiro_pet_user_email') || 'elismar.bolzani@gmail.com';
  });

  const [currentTab, setCurrentTab] = useState<TabType>('agenda');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to local current date in YYYY-MM-DD format
    return getLocalTodayString();
  });

  // Core Storage States
  const [clients, setClients] = useState<Client[]>([]);
  const [negotiations, setNegotiations] = useState<NegotiationHistory[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [isVoiceNotesModalOpen, setIsVoiceNotesModalOpen] = useState(false);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEventsManagerOpen, setIsEventsManagerOpen] = useState(false);
  const [shouldReopenManager, setShouldReopenManager] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [loans, setLoans] = useState<ProductLoan[]>([]);

  const [initializedDates, setInitializedDates] = useState<string[]>(() => {
    const stored = localStorage.getItem('roteiro_pet_initialized_dates');
    if (stored) return JSON.parse(stored);
    try {
      const storedVisitsStr = localStorage.getItem('roteiro_pet_visits');
      if (storedVisitsStr) {
        const storedVisits = JSON.parse(storedVisitsStr) as Visit[];
        const uniqueDates = Array.from(new Set(storedVisits.map(v => v.date)));
        return uniqueDates;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [isSyncingWithCloud, setIsSyncingWithCloud] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);

  /**
   * Merge de eventos: mantém eventos com createdAt mais recente.
   * Eventos que existem só localmente (não chegaram ao cloud ainda) são preservados
   * e agendados para upload.
   * BUG 2 fix: evita sobrescrita cega de dados locais mais recentes.
   */
  const mergeAgendaEvents = (
    localEvents: AgendaEvent[],
    cloudEvents: AgendaEvent[]
  ): { merged: AgendaEvent[]; onlyLocal: AgendaEvent[] } => {
    const cloudMap = new Map(cloudEvents.map(e => [e.id, e]));
    const localMap = new Map(localEvents.map(e => [e.id, e]));
    const merged: AgendaEvent[] = [];
    const onlyLocal: AgendaEvent[] = [];

    // Para cada evento do cloud, verificar se há versão local mais recente
    for (const cloudEv of cloudEvents) {
      const localEv = localMap.get(cloudEv.id);
      if (localEv) {
        // Manter o mais recente por createdAt
        const localDate = new Date(localEv.createdAt).getTime();
        const cloudDate = new Date(cloudEv.createdAt).getTime();
        merged.push(localDate > cloudDate ? localEv : cloudEv);
      } else {
        merged.push(cloudEv);
      }
    }

    // Eventos que existem só localmente ainda não chegaram ao Firestore
    for (const localEv of localEvents) {
      if (!cloudMap.has(localEv.id)) {
        merged.push(localEv);
        onlyLocal.push(localEv);
      }
    }

    return { merged, onlyLocal };
  };

  const syncDataFromCloud = async (userId: string) => {
    setSyncError(null);
    setIsSyncingWithCloud(true);
    try {
      // BUG 1 fix: processar fila offline pendente ANTES de baixar do Firestore.
      // Garante que operações salvas localmente antes da auth ser confirmada
      // cheguem ao Firestore antes de qualquer download sobrescrever o estado.
      await processQueue(userId);

      if (isIncrementalSyncEnabledForUser(userId) && await isIncrementalSyncReady(userId)) {
        const shouldRefresh = await shouldRefreshUserData(userId);
        const hasCompleteLocalSnapshot = hasCompleteLocalSyncSnapshot();
        if (shouldRefresh === false && hasCompleteLocalSnapshot) {
          console.log('Incremental sync marker unchanged; keeping local state.');
          return;
        }

        if (!hasCompleteLocalSnapshot) {
          console.warn('Local incremental snapshot incomplete; forcing a safe cloud rehydration.');
          clearLocalSyncState(userId);
        }

        const localData = {
          clients: JSON.parse(localStorage.getItem('roteiro_pet_clients') || '[]'),
          visits: JSON.parse(localStorage.getItem('roteiro_pet_visits') || '[]'),
          negotiations: JSON.parse(localStorage.getItem('roteiro_pet_negotiations') || '[]'),
          voiceNotes: JSON.parse(localStorage.getItem('roteiro_pet_voice_notes') || '[]'),
          agendaEvents: JSON.parse(localStorage.getItem('roteiro_pet_events') || '[]'),
          loans: normalizeProductLoans(JSON.parse(localStorage.getItem('roteiro_pet_loans') || '[]')),
          initializedDates: JSON.parse(localStorage.getItem('roteiro_pet_initialized_dates') || '[]'),
        };
        const cloud = await downloadIncrementalUserData(userId, localData);

        setClients(cloud.clients);
        setVisits(cloud.visits);
        setNegotiations(cloud.negotiations);
        setVoiceNotes(cloud.voiceNotes);
        setAgendaEvents(cloud.agendaEvents);
        setLoans(cloud.loans);
        setInitializedDates(cloud.initializedDates);

        localStorage.setItem('roteiro_pet_clients', JSON.stringify(cloud.clients));
        localStorage.setItem('roteiro_pet_visits', JSON.stringify(cloud.visits));
        localStorage.setItem('roteiro_pet_negotiations', JSON.stringify(cloud.negotiations));
        localStorage.setItem('roteiro_pet_voice_notes', JSON.stringify(cloud.voiceNotes));
        localStorage.setItem('roteiro_pet_events', JSON.stringify(cloud.agendaEvents));
        localStorage.setItem('roteiro_pet_loans', JSON.stringify(cloud.loans));
        localStorage.setItem('roteiro_pet_initialized_dates', JSON.stringify(cloud.initializedDates));
        await rememberCloudSyncVersion(userId);
        return;
      }

      if (CHANGE_AWARE_SYNC_ENABLED) {
        const shouldRefresh = await shouldRefreshUserData(userId);
        if (shouldRefresh === false) {
          console.log('Cloud sync marker unchanged; keeping local state.');
          return;
        }
      }

      const hasCloud = await hasCloudData(userId);
      if (!hasCloud) {
        console.log('No data found in cloud. Uploading current local state as initial baseline...');
        
        const storedClients = localStorage.getItem('roteiro_pet_clients');
        const storedVisits = localStorage.getItem('roteiro_pet_visits');
        const storedNegs = localStorage.getItem('roteiro_pet_negotiations');
        const storedVoiceNotes = localStorage.getItem('roteiro_pet_voice_notes');
        const storedEvents = localStorage.getItem('roteiro_pet_events');
        const storedDates = localStorage.getItem('roteiro_pet_initialized_dates');
        const storedLoans = localStorage.getItem('roteiro_pet_loans');

        const localClients = storedClients ? JSON.parse(storedClients) : [];
        const localVisits = storedVisits ? JSON.parse(storedVisits) : [];
        const localNegs = storedNegs ? JSON.parse(storedNegs) : [];
        const localVoiceNotes = storedVoiceNotes ? JSON.parse(storedVoiceNotes) : [];
        const localEvents = storedEvents ? JSON.parse(storedEvents) : [];
        const localLoans = normalizeProductLoans(storedLoans ? JSON.parse(storedLoans) : []);
        const localDates = storedDates ? JSON.parse(storedDates) : [];

        await uploadAllUserData(userId, {
          clients: localClients,
          visits: localVisits,
          negotiations: localNegs,
          voiceNotes: localVoiceNotes,
          agendaEvents: localEvents,
          loans: localLoans,
          initializedDates: localDates
        });
        if (CHANGE_AWARE_SYNC_ENABLED || isIncrementalSyncEnabledForUser(userId)) await rememberCloudSyncVersion(userId);

        setClients(localClients);
        setVisits(localVisits);
        setNegotiations(localNegs);
        setVoiceNotes(localVoiceNotes);
        setAgendaEvents(localEvents);
        setLoans(localLoans);
        setInitializedDates(localDates);
      } else {
        console.log('Found cloud data. Downloading and merging with local state...');
        const cloud = await downloadUserData(userId);

        // BUG 2 fix: merge inteligente de eventos — local mais recente vence.
        // Eventos só locais (não chegaram ao cloud) são preservados e re-enviados.
        const storedEventsRaw = localStorage.getItem('roteiro_pet_events');
        const localEvents: AgendaEvent[] = storedEventsRaw ? JSON.parse(storedEventsRaw) : [];
        const { merged: mergedEvents, onlyLocal } = mergeAgendaEvents(localEvents, cloud.agendaEvents || []);

        // Se houver eventos só locais, subi-los ao Firestore agora
        if (onlyLocal.length > 0) {
          console.log(`Uploading ${onlyLocal.length} local-only event(s) to Firestore...`);
          for (const ev of onlyLocal) {
            addToQueue(userId, 'events', ev.id, 'set', ev);
          }
          processQueue(userId);
        }
        
        setClients(cloud.clients);
        setVisits(cloud.visits);
        setNegotiations(cloud.negotiations);
        setVoiceNotes(cloud.voiceNotes);
        setAgendaEvents(mergedEvents);
        const normalizedCloudLoans = normalizeProductLoans(cloud.loans || []);
        setLoans(normalizedCloudLoans);
        setInitializedDates(cloud.initializedDates);

        localStorage.setItem('roteiro_pet_clients', JSON.stringify(cloud.clients));
        localStorage.setItem('roteiro_pet_visits', JSON.stringify(cloud.visits));
        localStorage.setItem('roteiro_pet_negotiations', JSON.stringify(cloud.negotiations));
        localStorage.setItem('roteiro_pet_voice_notes', JSON.stringify(cloud.voiceNotes));
        localStorage.setItem('roteiro_pet_events', JSON.stringify(mergedEvents));
        localStorage.setItem('roteiro_pet_loans', JSON.stringify(normalizedCloudLoans));
        localStorage.setItem('roteiro_pet_initialized_dates', JSON.stringify(cloud.initializedDates));
        if (CHANGE_AWARE_SYNC_ENABLED || isIncrementalSyncEnabledForUser(userId)) await rememberCloudSyncVersion(userId);
      }
    } catch (e: any) {
      console.error('Error syncing with cloud:', e);
      setSyncError(e.message || 'Erro de conexão/permissão ao sincronizar com Firestore.');
    } finally {
      setIsSyncingWithCloud(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        localStorage.setItem('roteiro_pet_is_logged_in', 'true');
        localStorage.setItem('roteiro_pet_user_email', user.email);
        // BUG 1 fix: persistir UID para uso na fila offline quando currentUser ainda é null
        localStorage.setItem('roteiro_pet_user_uid', user.uid);
        setIsLoggedIn(true);
        setUserEmail(user.email);
        setCurrentUser(user);
        
        // Request notification permission on first login
        if (localStorage.getItem('notif_permission_asked') !== 'true') {
          localStorage.setItem('notif_permission_asked', 'true');
          setTimeout(() => requestNotificationPermission(), 2000);
        }
        
        // BUG 1 fix: aumentar timeout para 800ms no iOS — Firebase Auth
        // leva mais tempo para restaurar sessão no Safari/PWA instalado.
        // Isso garante que operações offline pendentes não colidam com
        // o download do Firestore durante o cold start.
        setTimeout(() => {
          syncDataFromCloud(resolveUserId(user.uid));
        }, 800);

      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Apply Screen Orientation preference
  useEffect(() => {
    const allowRotation = localStorage.getItem('roteiro_pet_allow_rotation') !== 'false';
    try {
      if (!allowRotation) {
        if (screen.orientation && typeof (screen.orientation as any).lock === 'function') {
          (screen.orientation as any).lock('portrait').catch((err: any) => {
            console.warn('Orientation lock failed on init:', err);
          });
        }
      } else {
        if (screen.orientation && typeof screen.orientation.unlock === 'function') {
          screen.orientation.unlock();
        }
      }
    } catch (e) {
      console.warn('Screen orientation API not fully supported on init:', e);
    }
  }, []);

  // Resume offline sync when network connection is recovered
  useEffect(() => {
    const handleOnline = () => {
      if (currentUser) {
        setIsSyncingWithCloud(true);
        processQueue(resolveUserId(currentUser.uid), (status) => {
          if (status === 'syncing') {
            setIsSyncingWithCloud(true);
          } else {
            setIsSyncingWithCloud(false);
            if (status === 'failed') {
              setWriteError("Algumas alterações pendentes falharam ao sincronizar.");
            }
          }
        });
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [currentUser]);

  // BUG 3 fix: processar fila pendente ao app voltar ao foreground (iOS background suspension).
  // O iOS pode suspender timers JavaScript quando o app vai para background.
  // Ao retornar ao foreground (visibilitychange), garantimos que operações
  // pendentes sejam enviadas ao Firestore.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentUser && navigator.onLine) {
        processQueue(resolveUserId(currentUser.uid), (status) => {
          if (status !== 'syncing') setIsSyncingWithCloud(false);
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUser]);

  // 1. Initial State Hydration from localStorage or Seeds
  useEffect(() => {
    const storedClients = localStorage.getItem('roteiro_pet_clients');
    const storedNegotiations = localStorage.getItem('roteiro_pet_negotiations');
    const storedVisits = localStorage.getItem('roteiro_pet_visits');
    const storedVoiceNotes = localStorage.getItem('roteiro_pet_voice_notes');

    if (storedClients) {
      setClients(JSON.parse(storedClients));
    } else {
      setClients([]);
    }

    if (storedNegotiations) {
      setNegotiations(JSON.parse(storedNegotiations));
    } else {
      setNegotiations([]);
    }

    if (storedVisits) {
      setVisits(JSON.parse(storedVisits));
    } else {
      setVisits([]);
    }

    if (storedVoiceNotes) {
      setVoiceNotes(JSON.parse(storedVoiceNotes));
    } else {
      setVoiceNotes([]);
    }

    // Load events from localStorage
    const storedEvents = localStorage.getItem('roteiro_pet_events');
    if (storedEvents) {
      const parsed: AgendaEvent[] = JSON.parse(storedEvents);
      setAgendaEvents(parsed);
      // Re-schedule pending notifications
      parsed.forEach(ev => scheduleEventNotification(ev));
    }

    // Load loans from localStorage
    const storedLoans = localStorage.getItem('roteiro_pet_loans');
    if (storedLoans) {
      setLoans(normalizeProductLoans(JSON.parse(storedLoans)));
    } else {
      setLoans([]);
    }
  }, []);


  // 2. State-to-Storage Sync Hooks
  const syncWithCloud = async <T extends { id: string }>(
    collectionName: string,
    oldItems: T[],
    newItems: T[]
  ) => {
    if (!currentUser) return;
    try {
      setWriteError(null);
      const userId = resolveUserId(currentUser.uid);

      const oldMap = new Map(oldItems.map(item => [item.id, item]));
      const newMap = new Map(newItems.map(item => [item.id, item]));

      // Queue new/updated items
      for (const item of newItems) {
        const oldItem = oldMap.get(item.id);
        if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
          addToQueue(userId, collectionName as any, item.id, 'set', item, getSyncRevision(oldItem));
        }
      }

      // Queue deleted items
      for (const item of oldItems) {
        if (!newMap.has(item.id)) {
          addToQueue(userId, collectionName as any, item.id, 'delete', null, getSyncRevision(item));
        }
      }

      // Process the queue
      setIsSyncingWithCloud(true);
      await processQueue(userId, (status) => {
        if (status === 'syncing') {
          setIsSyncingWithCloud(true);
        } else {
          setIsSyncingWithCloud(false);
          if (status.startsWith('failed')) {
            const detail = status.startsWith('failed:') ? status.slice(7) : '';
            setWriteError(`Falha ao sincronizar ${collectionName}${detail ? `: ${detail}` : '.'}`);
          } else if (status.startsWith('conflict')) {
            const detail = status.startsWith('conflict:') ? status.slice(9) : '';
            setWriteError(`Conflito ao sincronizar ${collectionName}${detail ? `: ${detail}` : '.'} Atualize os dados antes de tentar novamente.`);
          }
        }
      });
    } catch (err: any) {
      console.error(err);
      setWriteError(`Erro ao sincronizar ${collectionName} com a nuvem.`);
      setIsSyncingWithCloud(false);
    }
  };

  const saveClientsAndVisitsToStorage = (updatedClients: Client[], updatedVisits: Visit[]) => {
    const oldClients = [...clients];
    const oldVisits = [...visits];

    setClients(updatedClients);
    localStorage.setItem('roteiro_pet_clients', JSON.stringify(updatedClients));
    setVisits(updatedVisits);
    localStorage.setItem('roteiro_pet_visits', JSON.stringify(updatedVisits));

    if (currentUser) {
      syncWithCloud('clients', oldClients, updatedClients);
      syncWithCloud('visits', oldVisits, updatedVisits);
    }
  };

  const saveClientsToStorage = (updatedClients: Client[]) => {
    const syncedVisits = syncVisitsWithClients(updatedClients, visits, initializedDates);
    saveClientsAndVisitsToStorage(updatedClients, syncedVisits);
  };

  const saveNegotiationsToStorage = (updatedNegs: NegotiationHistory[]) => {
    const oldNegs = [...negotiations];
    setNegotiations(updatedNegs);
    localStorage.setItem('roteiro_pet_negotiations', JSON.stringify(updatedNegs));

    if (currentUser) {
      syncWithCloud('negotiations', oldNegs, updatedNegs);
    }
  };

  const saveVisitsToStorage = (updatedVisits: Visit[]) => {
    const oldVisits = [...visits];
    setVisits(updatedVisits);
    localStorage.setItem('roteiro_pet_visits', JSON.stringify(updatedVisits));

    if (currentUser) {
      syncWithCloud('visits', oldVisits, updatedVisits);
    }
  };

  const saveVoiceNotesToStorage = (updatedNotes: VoiceNote[]) => {
    const oldNotes = [...voiceNotes];
    setVoiceNotes(updatedNotes);
    localStorage.setItem('roteiro_pet_voice_notes', JSON.stringify(updatedNotes));

    if (currentUser) {
      syncWithCloud('voiceNotes', oldNotes, updatedNotes);
    }
  };

  const saveEventsToStorage = (updatedEvents: AgendaEvent[]) => {
    const oldEvents = [...agendaEvents];
    setAgendaEvents(updatedEvents);
    localStorage.setItem('roteiro_pet_events', JSON.stringify(updatedEvents));
    if (currentUser) {
      syncWithCloud('events', oldEvents, updatedEvents);
    } else {
      // BUG 1 fix: se currentUser ainda não foi confirmado pelo Firebase Auth
      // (race condition comum no iOS), gravar na fila offline usando o userId
      // armazenado no localStorage. A fila será processada quando currentUser
      // for populado pelo onAuthStateChanged.
      const storedUserId = localStorage.getItem('roteiro_pet_user_uid');
      if (storedUserId) {
        const resolvedId = resolveUserId(storedUserId);
        const oldMap = new Map(oldEvents.map(e => [e.id, e]));
        const newMap = new Map(updatedEvents.map(e => [e.id, e]));
        for (const ev of updatedEvents) {
          const old = oldMap.get(ev.id);
          if (!old || JSON.stringify(old) !== JSON.stringify(ev)) {
            addToQueue(resolvedId, 'events', ev.id, 'set', ev, getSyncRevision(old));
          }
        }
        for (const ev of oldEvents) {
          if (!newMap.has(ev.id)) {
            addToQueue(resolvedId, 'events', ev.id, 'delete', null, getSyncRevision(ev));
          }
        }
      }
    }
  };

  const saveLoansToStorage = (updatedLoans: ProductLoan[]) => {
    const oldLoans = [...loans];
    setLoans(updatedLoans);
    localStorage.setItem('roteiro_pet_loans', JSON.stringify(updatedLoans));
    if (currentUser) {
      syncWithCloud('loans', oldLoans, updatedLoans);
    }
  };

  const handleSaveEvent = (event: AgendaEvent) => {
    const exists = agendaEvents.some(e => e.id === event.id);
    let updated: AgendaEvent[];
    if (exists) {
      updated = agendaEvents.map(e => e.id === event.id ? event : e);
    } else {
      // For new events, set status to 'agendado' by default if not set
      const newEvent = { ...event, status: event.status || 'agendado' };
      updated = [newEvent, ...agendaEvents];
    }
    saveEventsToStorage(updated);
  };

  const handleDeleteEvent = (eventId: string) => {
    const updated = agendaEvents.filter(e => e.id !== eventId);
    saveEventsToStorage(updated);
  };



  const createLoanOriginNegotiations = (loan: ProductLoan, items: ProductLoan['items']): NegotiationHistory[] => {
    return items.flatMap((item, index) => {
      const suffix = `${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
      const originNeg: NegotiationHistory = {
        id: `neg_loan_orig_${suffix}`,
        clientId: loan.originClientId,
        date: loan.date,
        notes: `[Empréstimo Cedido] Produto: ${item.productName}, Qtd: ${item.quantity}. Destinatário: ${loan.destClientName}. Obs: ${loan.notes || ''}`,
        value: 0
      };
      const destNeg: NegotiationHistory = {
        id: `neg_loan_dest_${suffix}`,
        clientId: loan.destClientId,
        date: loan.date,
        notes: `[Empréstimo Recebido] Produto: ${item.productName}, Qtd: ${item.quantity}. Remetente: ${loan.originClientName}. Obs: ${loan.notes || ''}`,
        value: 0
      };
      return [originNeg, destNeg];
    });
  };

  const handleAddLoan = (newLoan: ProductLoan) => {
    const normalizedLoan = { ...newLoan, status: getLoanStatus(newLoan.items) };
    const updatedLoans = [...loans, normalizedLoan];
    saveLoansToStorage(updatedLoans);

    const updatedNegs = [...negotiations, ...createLoanOriginNegotiations(normalizedLoan, normalizedLoan.items)];
    saveNegotiationsToStorage(updatedNegs);
  };

  const handleUpdateLoan = (updatedLoan: ProductLoan) => {
    const oldLoan = loans.find(l => l.id === updatedLoan.id);
    const normalizedLoan = { ...updatedLoan, status: getLoanStatus(updatedLoan.items) };
    const addedItems = oldLoan
      ? normalizedLoan.items.filter(item => !oldLoan.items.some(previousItem => previousItem.id === item.id))
      : [];
    const newlyResolvedItems = oldLoan
      ? normalizedLoan.items.filter(item => {
        const oldItem = oldLoan.items.find(previousItem => previousItem.id === item.id);
        return oldItem?.status === 'pending' && item.status === 'resolved';
      })
      : [];

    const updatedLoans = loans.map(l => l.id === normalizedLoan.id ? normalizedLoan : l);
    saveLoansToStorage(updatedLoans);

    const newItemNegotiations = addedItems.length > 0
      ? createLoanOriginNegotiations(normalizedLoan, addedItems)
      : [];
    const returnNegotiations = newlyResolvedItems.length > 0
      ? newlyResolvedItems.flatMap((item, index) => {
        const retDate = item.returnDate || getLocalTodayString();
        const suffix = `${Date.now()}_${index}_${item.id}`;
        const originNeg: NegotiationHistory = {
          id: `neg_loan_ret_orig_${suffix}`,
          clientId: normalizedLoan.originClientId,
          date: retDate,
          notes: `[Empréstimo Devolvido/Acertado] Produto: ${item.productName}, Qtd: ${item.quantity}. Destinatário: ${normalizedLoan.destClientName}. Obs Devolução: ${item.returnNotes || ''}`,
          value: 0
        };
        const destNeg: NegotiationHistory = {
          id: `neg_loan_ret_dest_${suffix}`,
          clientId: normalizedLoan.destClientId,
          date: retDate,
          notes: `[Empréstimo Devolvido/Acertado] Produto: ${item.productName}, Qtd: ${item.quantity}. Remetente: ${normalizedLoan.originClientName}. Obs Devolução: ${item.returnNotes || ''}`,
          value: 0
        };
        return [originNeg, destNeg];
      })
      : [];

    if (newItemNegotiations.length > 0 || returnNegotiations.length > 0) {
      saveNegotiationsToStorage([...negotiations, ...newItemNegotiations, ...returnNegotiations]);
    }
  };

  const handleDeleteLoan = (loanId: string) => {
    const updatedLoans = loans.filter(l => l.id !== loanId);
    saveLoansToStorage(updatedLoans);
  };

  const handleConfirmEvent = (eventId: string, notes?: string) => {
    const updated = agendaEvents.map(ev => {
      if (ev.id === eventId) {
        const updatedEv = { ...ev, status: 'concluido' as const, notes: notes || ev.notes };
        // If event has a client linked, record to negotiations history
        if (ev.clientId) {
          const newNeg: NegotiationHistory = {
            id: `n_ev_done_${Date.now()}`,
            clientId: ev.clientId,
            date: ev.date,
            notes: `[Evento Concluído] ${ev.title}. Obs: ${notes || 'Sem observações'}`,
            value: 0
          };
          saveNegotiationsToStorage([newNeg, ...negotiations]);
        }
        return updatedEv;
      }
      return ev;
    });
    saveEventsToStorage(updated);
  };

  const handleCancelEvent = (eventId: string) => {
    const updated = agendaEvents.map(ev => {
      if (ev.id === eventId) {
        return { ...ev, status: 'cancelado' as const };
      }
      return ev;
    });
    saveEventsToStorage(updated);
  };


  const handleAddVoiceNote = (text: string, clientId?: string, clientName?: string) => {
    const newNote: VoiceNote = {
      id: `vn_${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      clientId,
      clientName,
    };
    const updated = [newNote, ...voiceNotes];
    saveVoiceNotesToStorage(updated);
  };

  const handleUpdateVoiceNote = (noteId: string, text: string) => {
    const updated = voiceNotes.map(n => n.id === noteId ? { ...n, text } : n);
    saveVoiceNotesToStorage(updated);
  };

  const handleDeleteVoiceNote = (noteId: string) => {
    const updated = voiceNotes.filter(n => n.id !== noteId);
    saveVoiceNotesToStorage(updated);
  };

  const handleLinkVoiceNoteToClient = (noteId: string, clientId: string, clientName: string) => {
    const updated = voiceNotes.map(n => {
      if (n.id === noteId) {
        return {
          ...n,
          clientId,
          clientName,
        };
      }
      return n;
    });
    saveVoiceNotesToStorage(updated);

    // Copy to negotiation ledger under that client
    const targetNote = voiceNotes.find(n => n.id === noteId);
    const newNegotiation: NegotiationHistory = {
      id: `n_voice_${Date.now()}`,
      clientId,
      date: getLocalTodayString(),
      notes: `[Anotação de Voz] ${targetNote ? targetNote.text : 'Anotação associada'}`,
      value: 0
    };
    const updatedNegs = [newNegotiation, ...negotiations];
    saveNegotiationsToStorage(updatedNegs);
  };

  // 3. Dynamic route generator for selectedDate
  useEffect(() => {
    if (clients.length === 0) return;

    const hasVisitsForDate = visits.some(v => v.date === selectedDate);
    if (!initializedDates.includes(selectedDate) || !hasVisitsForDate) {
      const date = new Date(selectedDate + 'T12:00:00');
      const weekday = getDayNameFromDate(date);
      const currentWeekOffset = getWeekOffsetForDate(selectedDate);

      // Filter clients configured for this weekday and frequency cycle
      const scheduledClientsForDay = clients.filter(c => {
        if (c.weekday !== weekday) return false;
        
        if (c.frequency === 'weekly') return true;
        
        if (c.frequency === 'biweekly') {
          // Matches the bi-weekly Group offset (0 or 1)
          return c.weekOffset === currentWeekOffset;
        }

        if (c.frequency === 'monthly') {
          const monthWeek = c.monthWeek || 1;
          const dateMonthWeek = Math.ceil(date.getDate() / 7);
          return dateMonthWeek === monthWeek;
        }

        return false;
      });

      // Sort by assigned route order
      const sortedScheduled = scheduledClientsForDay.sort((a, b) => a.routeOrder - b.routeOrder);

      // Create pending visits
      const newVisits: Visit[] = sortedScheduled.map((c, idx) => ({
        id: `v_${selectedDate}_${c.id}`,
        clientId: c.id,
        clientName: getClientDisplayName(c),
        address: c.address,
        date: selectedDate,
        status: 'pending',
        isExtra: false
      }));

      // Merge with existing visits for this date, checking for duplicates
      const existingVisitsForDate = visits.filter(v => v.date === selectedDate);
      const uniqueNewVisits = newVisits.filter(
        nv => !existingVisitsForDate.some(ev => ev.clientId === nv.clientId)
      );

      const mergedVisits = [...visits, ...uniqueNewVisits];
      if (uniqueNewVisits.length > 0) {
        saveVisitsToStorage(mergedVisits);
      }

      if (!initializedDates.includes(selectedDate)) {
        const updatedInitDates = [...initializedDates, selectedDate];
        setInitializedDates(updatedInitDates);
        localStorage.setItem('roteiro_pet_initialized_dates', JSON.stringify(updatedInitDates));
        if (currentUser && !isSyncingWithCloud) {
          saveInitializedDatesToCloud(resolveUserId(currentUser.uid), updatedInitDates).catch(err => {
            console.error(err);
            setWriteError('Erro ao sincronizar datas inicializadas.');
          });
        }
      }
    }
  }, [selectedDate, clients, visits, initializedDates]);

  // --- Handlers for Clients ---
  
  const handleAddClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'routeOrder'>) => {
    const newId = `c_${Date.now()}`;
    
    // Find highest route order in that day to append
    const siblingClients = clients.filter(c => c.weekday === clientData.weekday);
    const maxOrder = siblingClients.reduce((max, c) => Math.max(max, c.routeOrder), -1);

    const newClient: Client = {
      ...clientData,
      id: newId,
      routeOrder: maxOrder + 1,
      createdAt: new Date().toISOString()
    };

    const updated = [...clients, newClient];
    saveClientsToStorage(updated);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    // If the weekday changed, we need to re-sort the order indices for the old and new weekday
    const oldClient = clients.find(c => c.id === updatedClient.id);
    let updated = [...clients];

    if (oldClient && oldClient.weekday !== updatedClient.weekday) {
      // Re-order old weekday siblings
      const oldSiblings = clients
        .filter(c => c.weekday === oldClient.weekday && c.id !== updatedClient.id)
        .sort((a, b) => a.routeOrder - b.routeOrder)
        .map((c, idx) => ({ ...c, routeOrder: idx }));

      // Append updated client to new weekday at the end
      const newSiblings = clients.filter(c => c.weekday === updatedClient.weekday);
      const maxOrder = newSiblings.reduce((max, c) => Math.max(max, c.routeOrder), -1);
      
      const adjustedClient = {
        ...updatedClient,
        routeOrder: maxOrder + 1
      };

      // Merge back
      updated = updated.map(c => {
        if (c.id === adjustedClient.id) return adjustedClient;
        const reorderedOld = oldSiblings.find(os => os.id === c.id);
        if (reorderedOld) return reorderedOld;
        return c;
      });
    } else {
      updated = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
    }

    // First update the name and address inside existing visits
    const visitsWithUpdatedDetails = visits.map(v => {
      if (v.clientId === updatedClient.id) {
        return {
          ...v,
          clientName: getClientDisplayName(updatedClient),
          address: updatedClient.address
        };
      }
      return v;
    });

    // Then, synchronize visits based on updated client configurations (new weekday / frequency)
    const syncedVisits = syncVisitsWithClients(updated, visitsWithUpdatedDetails, initializedDates);

    // Save both Atomically to prevent React async state overwrite
    saveClientsAndVisitsToStorage(updated, syncedVisits);
  };

  const handleImportClients = (report: ExcelImportReport) => {
    saveClientsToStorage(report.clients);
  };

  const handleDeleteClient = (clientId: string) => {
    const updated = clients.filter(c => c.id !== clientId);
    // Filter out related pending visits
    const visitsWithoutDeletedPending = visits.filter(v => !(v.clientId === clientId && v.status === 'pending'));
    
    // Sync remaining visits
    const syncedVisits = syncVisitsWithClients(updated, visitsWithoutDeletedPending, initializedDates);
    
    // Save both Atomically
    saveClientsAndVisitsToStorage(updated, syncedVisits);
  };

  // --- Handlers for Visits ---

  const handleConfirmVisit = (
    visitId: string,
    notes: string,
    value: number,
    items: { name: string; qty: number; price: number }[]
  ) => {
    const updatedVisits = visits.map(v => {
      if (v.id === visitId) {
        return {
          ...v,
          status: 'completed' as const,
          notes,
          saleValue: value,
          itemsSold: items,
          checkInTime: v.checkInTime || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
      }
      return v;
    });

    saveVisitsToStorage(updatedVisits);

    // Record this completed visit directly in the client negotiation ledger
    const targetVisit = visits.find(v => v.id === visitId);
    if (targetVisit) {
      const existingNegIndex = negotiations.findIndex(
        n => n.clientId === targetVisit.clientId && n.date === targetVisit.date
      );

      let updatedNegs;
      if (existingNegIndex > -1) {
        updatedNegs = negotiations.map((n, idx) => {
          if (idx === existingNegIndex) {
            return {
              ...n,
              notes: notes || 'Visita concluída com sucesso.',
              value,
              items: items.length > 0 ? items : undefined
            };
          }
          return n;
        });
      } else {
        const newNegotiation: NegotiationHistory = {
          id: `n_${Date.now()}`,
          clientId: targetVisit.clientId,
          date: targetVisit.date,
          notes: notes || 'Visita concluída com sucesso.',
          value,
          items: items.length > 0 ? items : undefined
        };
        updatedNegs = [newNegotiation, ...negotiations];
      }

      saveNegotiationsToStorage(updatedNegs);
    }
  };

  const handleUndoVisitStatus = (visitId: string) => {
    const targetVisit = visits.find(v => v.id === visitId);
    if (!targetVisit) return;

    const updatedVisits = visits.map(v => {
      if (v.id === visitId) {
        return {
          ...v,
          status: 'pending' as const,
          notes: undefined,
          saleValue: undefined,
          itemsSold: undefined,
          checkInTime: undefined
        };
      }
      return v;
    });
    saveVisitsToStorage(updatedVisits);

    // Also remove any negotiation matching this client and date
    const updatedNegs = negotiations.filter(
      n => !(n.clientId === targetVisit.clientId && n.date === targetVisit.date)
    );
    saveNegotiationsToStorage(updatedNegs);
  };

  const handleUpdateNegotiation = (updatedNeg: NegotiationHistory) => {
    const updated = negotiations.map(n => n.id === updatedNeg.id ? updatedNeg : n);
    saveNegotiationsToStorage(updated);
  };

  const handleDeleteNegotiation = (negId: string) => {
    const updated = negotiations.filter(n => n.id !== negId);
    saveNegotiationsToStorage(updated);
  };

  const handleCancelVisit = (visitId: string, reason: string) => {
    const updatedVisits = visits.map(v => {
      if (v.id === visitId) {
        return {
          ...v,
          status: 'canceled' as const,
          notes: reason
        };
      }
      return v;
    });
    saveVisitsToStorage(updatedVisits);
  };

  const handleRescheduleVisit = (visitId: string, newDate: string) => {
    const updatedVisits = visits.map(v => {
      if (v.id === visitId) {
        return {
          ...v,
          date: newDate,
          status: 'pending' as const,
          notes: undefined,
          saleValue: undefined,
          itemsSold: undefined,
          checkInTime: undefined
        };
      }
      return v;
    });
    saveVisitsToStorage(updatedVisits);
  };

  const handleAddExtraVisit = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    // Check if there is already a visit for this client today
    const exists = visits.some(v => v.clientId === clientId && v.date === selectedDate);
    if (exists) return;

    const extraVisit: Visit = {
      id: `v_extra_${Date.now()}_${clientId}`,
      clientId: client.id,
      clientName: getClientDisplayName(client),
      address: client.address,
      date: selectedDate,
      status: 'pending',
      isExtra: true
    };

    const updated = [...visits, extraVisit];
    saveVisitsToStorage(updated);
  };

  const handleRemoveExtraVisit = (visitId: string) => {
    const updated = visits.filter(v => v.id !== visitId);
    saveVisitsToStorage(updated);
  };

  // Counting pending items for tab badge count
  const todayDateStr = new Date().toISOString().split('T')[0];
  const pendingVisitsTodayCount = visits.filter(v => v.date === todayDateStr && v.status === 'pending').length;

  if (!isLoggedIn) {
    return <Login onLoginSuccess={(email) => {
      setUserEmail(email);
      setIsLoggedIn(true);
    }} />;
  }

  return (
    <div className="app-shell flex flex-col h-screen text-slate-800 bg-slate-50 antialiased overflow-hidden">
      
      {/* Offline & Cloud Status indicator tag */}
      <div className="bg-indigo-950 text-indigo-100 px-4 py-2 flex items-center justify-between text-[11px] font-semibold shrink-0 border-b border-indigo-900 shadow-sm">
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span>Banco Local Ativo (Offline-First)</span>
        </div>
        <div className="flex items-center gap-2">
          {localStorage.getItem('roteiro_pet_offline_mode') === 'true' && (
            <div className="flex items-center gap-1.5 text-rose-400 font-bold animate-pulse mr-2" title="Você entrou em modo offline. O aplicativo não sincroniza com o banco na nuvem.">
              <CloudOff className="w-3.5 h-3.5" />
              <span>Modo Offline (Não Sincronizado)</span>
            </div>
          )}
          {syncError && (
            <div className="flex items-center gap-1.5 text-rose-400 mr-2" title={syncError}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Erro de Sincronismo</span>
            </div>
          )}
          {writeError && (
            <div className="flex items-center gap-1.5 text-amber-400 mr-2" title={writeError}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Erro de Gravação</span>
            </div>
          )}
          {currentUser ? (
            isSyncingWithCloud ? (
              <div className="flex items-center gap-1.5 text-blue-300">
                <span className="w-2 h-2 border border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                <span>Sincronizando com Firestore...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Cloud className="w-3.5 h-3.5" />
                <span>Nuvem Conectada ({currentUser.email})</span>
              </div>
            )
          ) : (
            localStorage.getItem('roteiro_pet_offline_mode') !== 'true' && (
              <div className="flex items-center gap-1.5 text-amber-400" title="Suas alterações estão salvas no navegador. Faça login para backup na nuvem.">
                <CloudOff className="w-3.5 h-3.5" />
                <span>Modo Local • Sem Backup na Nuvem</span>
              </div>
            )
          )}
          <span className="h-3 w-[1px] bg-indigo-800 mx-1"></span>
          <span className="opacity-75 font-mono text-[10px]">v1.7</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-hidden relative pb-24">
        {currentTab === 'agenda' && (
          <Dashboard
            clients={clients}
            visits={visits}
            negotiations={negotiations}
            selectedDate={selectedDate}
            onSetSelectedDate={setSelectedDate}
            onConfirmVisit={handleConfirmVisit}
            onCancelVisit={handleCancelVisit}
            onAddExtraVisit={handleAddExtraVisit}
            onRemoveExtraVisit={handleRemoveExtraVisit}
            onRescheduleVisit={handleRescheduleVisit}
            onUndoVisitStatus={handleUndoVisitStatus}
            agendaEvents={agendaEvents}
            onOpenNewEvent={() => { setEditingEvent(null); setIsEventModalOpen(true); }}
            onEditEvent={(ev) => { setEditingEvent(ev); setIsEventModalOpen(true); }}
            onOpenEventsManager={() => setIsEventsManagerOpen(true)}
          />

        )}

        {(currentTab === 'clientes' || currentTab === 'emprestimos') && (
          <ClientManagement
            clients={clients}
            negotiations={negotiations}
            loans={loans}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            onUpdateNegotiation={handleUpdateNegotiation}
            onDeleteNegotiation={handleDeleteNegotiation}
            onAddLoan={handleAddLoan}
            onUpdateLoan={handleUpdateLoan}
            onDeleteLoan={handleDeleteLoan}
            activeSubTab={currentTab === 'emprestimos' ? 'emprestimos' : 'carteira'}
            onActiveSubTabChange={(tab) => {
              setCurrentTab(tab === 'emprestimos' ? 'emprestimos' : 'clientes');
            }}
          />
        )}


        {currentTab === 'configuracoes' && (
          <Settings
            clients={clients}
            onImportClients={handleImportClients}
            userEmail={userEmail}
            userId={currentUser ? resolveUserId(currentUser.uid) : 'local'}
            onUpdateEmail={(email) => setUserEmail(email)}
            onLogout={async () => {
              const storedUserId = localStorage.getItem('roteiro_pet_user_uid');
              const logoutUserId = currentUser?.uid
                ? resolveUserId(currentUser.uid)
                : storedUserId
                  ? resolveUserId(storedUserId)
                  : '';
              clearLocalSyncState(logoutUserId);

              try {
                await signOut(auth);
              } catch (e) {
                console.warn('Firebase signOut error:', e);
              }
              // Clear localStorage keys
              localStorage.removeItem('roteiro_pet_is_logged_in');
              localStorage.removeItem('roteiro_pet_user_email');
              localStorage.removeItem('roteiro_pet_clients');
              localStorage.removeItem('roteiro_pet_visits');
              localStorage.removeItem('roteiro_pet_negotiations');
              localStorage.removeItem('roteiro_pet_voice_notes');
              localStorage.removeItem('roteiro_pet_events');
              localStorage.removeItem('roteiro_pet_initialized_dates');
              localStorage.removeItem('notif_permission_asked');
              localStorage.removeItem('roteiro_pet_loans');
              localStorage.removeItem('roteiro_pet_offline_mode');
              localStorage.removeItem('roteiro_pet_user_uid');

              // Reset React States
              setClients([]);
              setVisits([]);
              setNegotiations([]);
              setVoiceNotes([]);
              setAgendaEvents([]);
              setInitializedDates([]);
              setLoans([]);
              setCurrentUser(null);
              setIsLoggedIn(false);
            }}
          />
        )}
      </div>

      {/* Persistent Bottom Mobile Nav Bar */}
      <BottomNavBar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        pendingCount={pendingVisitsTodayCount}
        onVoiceNotesClick={() => setIsVoiceNotesModalOpen(true)}
      />

      {/* Voice command notes assistant modal */}
      <VoiceNotesModal
        isOpen={isVoiceNotesModalOpen}
        onClose={() => setIsVoiceNotesModalOpen(false)}
        clients={clients}
        notes={voiceNotes}
        onAddNote={handleAddVoiceNote}
        onUpdateNote={handleUpdateVoiceNote}
        onDeleteNote={handleDeleteVoiceNote}
        onLinkNoteToClient={handleLinkVoiceNoteToClient}
      />

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          if (shouldReopenManager) {
            setIsEventsManagerOpen(true);
            setShouldReopenManager(false);
          }
        }}
        onSave={(ev) => {
          handleSaveEvent(ev);
          setIsEventModalOpen(false);
          if (shouldReopenManager) {
            setIsEventsManagerOpen(true);
            setShouldReopenManager(false);
          }
        }}
        onDelete={(id) => {
          handleDeleteEvent(id);
          setIsEventModalOpen(false);
          if (shouldReopenManager) {
            setIsEventsManagerOpen(true);
            setShouldReopenManager(false);
          }
        }}
        clients={clients}
        initialDate={selectedDate}
        userId={currentUser ? resolveUserId(currentUser.uid) : 'local'}
        editingEvent={editingEvent}
      />

      {/* Events Manager Modal */}
      <EventsManagerModal
        isOpen={isEventsManagerOpen}
        onClose={() => setIsEventsManagerOpen(false)}
        agendaEvents={agendaEvents}
        clients={clients}
        onOpenNewEvent={() => { 
          setEditingEvent(null); 
          setShouldReopenManager(true);
          setIsEventsManagerOpen(false);
          setIsEventModalOpen(true); 
        }}
        onEditEvent={(ev) => { 
          setEditingEvent(ev); 
          setShouldReopenManager(true);
          setIsEventsManagerOpen(false);
          setIsEventModalOpen(true); 
        }}
        onDeleteEvent={handleDeleteEvent}
        onConfirmEvent={handleConfirmEvent}
        onCancelEvent={handleCancelEvent}
      />

      {/* Versículo do Dia Banner */}
      <VersiculoBanner />
    </div>
  );
}
