/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client, Visit, NegotiationHistory, WeekDay, RouteFrequency, VoiceNote } from './types';
import { INITIAL_CLIENTS, INITIAL_NEGOTIATIONS, getDayNameFromDate } from './data/initialData';
import Dashboard from './components/Dashboard';
import ClientManagement from './components/ClientManagement';
import RoutePlanner from './components/RoutePlanner';
import Settings from './components/Settings';
import Login from './components/Login';
import BottomNavBar from './components/BottomNavBar';
import VoiceNotesModal from './components/VoiceNotesModal';
import { getLocalTodayString } from './utils';
import { Compass, Wifi, Cloud, CloudOff } from 'lucide-react';
import { auth, signOut } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  hasCloudData,
  downloadUserData,
  uploadAllUserData,
  uploadCollection,
  saveInitializedDatesToCloud
} from './lib/firebaseSync';

type TabType = 'agenda' | 'clientes' | 'rotas' | 'configuracoes';

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
        return currentWeekOffset === 0;
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
          clientName: client.name,
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
              clientName: client.name,
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

  // Cloud Sync Status States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSyncingWithCloud, setIsSyncingWithCloud] = useState<boolean>(false);

  const syncDataFromCloud = async (userId: string) => {
    setIsSyncingWithCloud(true);
    try {
      const hasCloud = await hasCloudData(userId);
      if (!hasCloud) {
        console.log('No data found in cloud. Uploading current local state as initial baseline...');
        
        const storedClients = localStorage.getItem('roteiro_pet_clients');
        const storedVisits = localStorage.getItem('roteiro_pet_visits');
        const storedNegs = localStorage.getItem('roteiro_pet_negotiations');
        const storedVoiceNotes = localStorage.getItem('roteiro_pet_voice_notes');
        const storedDates = localStorage.getItem('roteiro_pet_initialized_dates');

        const localClients = storedClients ? JSON.parse(storedClients) : INITIAL_CLIENTS;
        const localVisits = storedVisits ? JSON.parse(storedVisits) : [];
        const localNegs = storedNegs ? JSON.parse(storedNegs) : INITIAL_NEGOTIATIONS;
        const localVoiceNotes = storedVoiceNotes ? JSON.parse(storedVoiceNotes) : [];
        const localDates = storedDates ? JSON.parse(storedDates) : [];

        await uploadAllUserData(userId, {
          clients: localClients,
          visits: localVisits,
          negotiations: localNegs,
          voiceNotes: localVoiceNotes,
          initializedDates: localDates
        });

        setClients(localClients);
        setVisits(localVisits);
        setNegotiations(localNegs);
        setVoiceNotes(localVoiceNotes);
        setInitializedDates(localDates);
      } else {
        console.log('Found cloud data. Downloading to local state...');
        const cloud = await downloadUserData(userId);
        
        setClients(cloud.clients);
        setVisits(cloud.visits);
        setNegotiations(cloud.negotiations);
        setVoiceNotes(cloud.voiceNotes);
        setInitializedDates(cloud.initializedDates);

        localStorage.setItem('roteiro_pet_clients', JSON.stringify(cloud.clients));
        localStorage.setItem('roteiro_pet_visits', JSON.stringify(cloud.visits));
        localStorage.setItem('roteiro_pet_negotiations', JSON.stringify(cloud.negotiations));
        localStorage.setItem('roteiro_pet_voice_notes', JSON.stringify(cloud.voiceNotes));
        localStorage.setItem('roteiro_pet_initialized_dates', JSON.stringify(cloud.initializedDates));
      }
    } catch (e) {
      console.error('Error syncing with cloud:', e);
    } finally {
      setIsSyncingWithCloud(false);
    }
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        localStorage.setItem('roteiro_pet_is_logged_in', 'true');
        localStorage.setItem('roteiro_pet_user_email', user.email);
        setIsLoggedIn(true);
        setUserEmail(user.email);
        setCurrentUser(user);
        
        // Let state hydrate from localStorage first, then sync up/down
        setTimeout(() => {
          syncDataFromCloud(user.uid);
        }, 150);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 1. Initial State Hydration from localStorage or Seeds
  useEffect(() => {
    const storedClients = localStorage.getItem('roteiro_pet_clients');
    const storedNegotiations = localStorage.getItem('roteiro_pet_negotiations');
    const storedVisits = localStorage.getItem('roteiro_pet_visits');
    const storedVoiceNotes = localStorage.getItem('roteiro_pet_voice_notes');

    if (storedClients) {
      const parsed = JSON.parse(storedClients);
      // Automatically migrate to the new Cariacica dataset if previous mock items or capitals exist
      const hasOldCapitals = parsed.some((c: any) => 
        c.id === 'c1' || 
        c.id === 'c2' || 
        c.id === 'c3' ||
        c.city === 'Vitória' || 
        c.city === 'Vila Velha' || 
        c.city === 'São Paulo' || 
        c.address.includes('São Paulo') || 
        c.address.includes('Vitória') || 
        c.address.includes('Vila Velha')
      );
      if (hasOldCapitals) {
        setClients(INITIAL_CLIENTS);
        localStorage.setItem('roteiro_pet_clients', JSON.stringify(INITIAL_CLIENTS));
        setNegotiations(INITIAL_NEGOTIATIONS);
        localStorage.setItem('roteiro_pet_negotiations', JSON.stringify(INITIAL_NEGOTIATIONS));
        setVisits([]);
        localStorage.removeItem('roteiro_pet_visits');
      } else {
        setClients(parsed);
      }
    } else {
      setClients(INITIAL_CLIENTS);
      localStorage.setItem('roteiro_pet_clients', JSON.stringify(INITIAL_CLIENTS));
    }

    if (storedNegotiations) {
      setNegotiations(JSON.parse(storedNegotiations));
    } else {
      setNegotiations(INITIAL_NEGOTIATIONS);
      localStorage.setItem('roteiro_pet_negotiations', JSON.stringify(INITIAL_NEGOTIATIONS));
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
  }, []);

  // 2. State-to-Storage Sync Hooks
  const saveClientsAndVisitsToStorage = (updatedClients: Client[], updatedVisits: Visit[]) => {
    setClients(updatedClients);
    localStorage.setItem('roteiro_pet_clients', JSON.stringify(updatedClients));
    setVisits(updatedVisits);
    localStorage.setItem('roteiro_pet_visits', JSON.stringify(updatedVisits));

    if (currentUser) {
      uploadCollection(currentUser.uid, 'clients', updatedClients).catch(console.error);
      uploadCollection(currentUser.uid, 'visits', updatedVisits).catch(console.error);
    }
  };

  const saveClientsToStorage = (updatedClients: Client[]) => {
    const syncedVisits = syncVisitsWithClients(updatedClients, visits, initializedDates);
    saveClientsAndVisitsToStorage(updatedClients, syncedVisits);
  };

  const saveNegotiationsToStorage = (updatedNegs: NegotiationHistory[]) => {
    setNegotiations(updatedNegs);
    localStorage.setItem('roteiro_pet_negotiations', JSON.stringify(updatedNegs));

    if (currentUser) {
      uploadCollection(currentUser.uid, 'negotiations', updatedNegs).catch(console.error);
    }
  };

  const saveVisitsToStorage = (updatedVisits: Visit[]) => {
    setVisits(updatedVisits);
    localStorage.setItem('roteiro_pet_visits', JSON.stringify(updatedVisits));

    if (currentUser) {
      uploadCollection(currentUser.uid, 'visits', updatedVisits).catch(console.error);
    }
  };

  const saveVoiceNotesToStorage = (updatedNotes: VoiceNote[]) => {
    setVoiceNotes(updatedNotes);
    localStorage.setItem('roteiro_pet_voice_notes', JSON.stringify(updatedNotes));

    if (currentUser) {
      uploadCollection(currentUser.uid, 'voiceNotes', updatedNotes).catch(console.error);
    }
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
          // For simple demo, monthly clients are visited on the 1st week of month (offset 0)
          return currentWeekOffset === 0;
        }

        return false;
      });

      // Sort by assigned route order
      const sortedScheduled = scheduledClientsForDay.sort((a, b) => a.routeOrder - b.routeOrder);

      // Create pending visits
      const newVisits: Visit[] = sortedScheduled.map((c, idx) => ({
        id: `v_${selectedDate}_${c.id}`,
        clientId: c.id,
        clientName: c.name,
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
      saveVisitsToStorage(mergedVisits);

      if (!initializedDates.includes(selectedDate)) {
        const updatedInitDates = [...initializedDates, selectedDate];
        setInitializedDates(updatedInitDates);
        localStorage.setItem('roteiro_pet_initialized_dates', JSON.stringify(updatedInitDates));
        if (currentUser) {
          saveInitializedDatesToCloud(currentUser.uid, updatedInitDates).catch(console.error);
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
          clientName: updatedClient.name,
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

  const handleDeleteClient = (clientId: string) => {
    const updated = clients.filter(c => c.id !== clientId);
    // Filter out related pending visits
    const visitsWithoutDeletedPending = visits.filter(v => !(v.clientId === clientId && v.status === 'pending'));
    
    // Sync remaining visits
    const syncedVisits = syncVisitsWithClients(updated, visitsWithoutDeletedPending, initializedDates);
    
    // Save both Atomically
    saveClientsAndVisitsToStorage(updated, syncedVisits);
  };

  const handleUpdateClientRoute = (
    clientId: string,
    weekday: WeekDay | undefined,
    frequency: RouteFrequency,
    order: number
  ) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const updatedClient: Client = {
      ...client,
      weekday,
      frequency,
      routeOrder: order
    };

    handleUpdateClient(updatedClient);
  };

  const handleReorderRoute = (weekday: WeekDay, reorderedClients: Client[]) => {
    const updated = clients.map(c => {
      if (c.weekday === weekday) {
        const matching = reorderedClients.find(rc => rc.id === c.id);
        if (matching) {
          return { ...c, routeOrder: matching.routeOrder };
        }
      }
      return c;
    });
    saveClientsToStorage(updated);
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
          checkInTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
      }
      return v;
    });

    saveVisitsToStorage(updatedVisits);

    // Record this completed visit directly in the client negotiation ledger
    const targetVisit = visits.find(v => v.id === visitId);
    if (targetVisit) {
      const newNegotiation: NegotiationHistory = {
        id: `n_${Date.now()}`,
        clientId: targetVisit.clientId,
        date: targetVisit.date,
        notes: notes || 'Visita concluída com sucesso.',
        value,
        items: items.length > 0 ? items : undefined
      };

      const updatedNegs = [newNegotiation, ...negotiations];
      saveNegotiationsToStorage(updatedNegs);
    }
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
      clientName: client.name,
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
    <div className="flex flex-col h-screen text-slate-800 bg-slate-50 antialiased overflow-hidden">
      
      {/* Offline & Cloud Status indicator tag */}
      <div className="bg-indigo-950 text-indigo-100 px-4 py-2 flex items-center justify-between text-[11px] font-semibold shrink-0 border-b border-indigo-900 shadow-sm">
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span>Banco Local Ativo (Offline-First)</span>
        </div>
        <div className="flex items-center gap-2">
          {currentUser ? (
            isSyncingWithCloud ? (
              <div className="flex items-center gap-1.5 text-blue-300">
                <span className="w-2 h-2 border border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                <span>Sincronizando com Firestore...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Cloud className="w-3.5 h-3.5" />
                <span>Nuvem Conectada e Sincronizada ({currentUser.email})</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-1.5 text-amber-400" title="Suas alterações estão salvas no navegador. Faça login para backup na nuvem.">
              <CloudOff className="w-3.5 h-3.5" />
              <span>Modo Local • Sem Backup na Nuvem</span>
            </div>
          )}
          <span className="h-3 w-[1px] bg-indigo-800 mx-1"></span>
          <span className="opacity-75 font-mono text-[10px]">v1.5.0</span>
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
          />
        )}

        {currentTab === 'clientes' && (
          <ClientManagement
            clients={clients}
            negotiations={negotiations}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
          />
        )}

        {currentTab === 'rotas' && (
          <RoutePlanner
            clients={clients}
            visits={visits}
            onUpdateClientRoute={handleUpdateClientRoute}
            onReorderRoute={handleReorderRoute}
            onAddVisitForDate={(clientId, dateStr) => {
              const client = clients.find(c => c.id === clientId);
              if (!client) return;
              const extraVisit: Visit = {
                id: `v_extra_${Date.now()}_${clientId}`,
                clientId: client.id,
                clientName: client.name,
                address: client.address,
                date: dateStr,
                status: 'pending',
                isExtra: true
              };
              const updated = [...visits, extraVisit];
              saveVisitsToStorage(updated);
            }}
            onDeleteVisit={(visitId) => {
              const updated = visits.filter(v => v.id !== visitId);
              saveVisitsToStorage(updated);
            }}
            initializedDates={initializedDates}
            onInitializeDates={(datesToInit) => {
              let newInitDates = [...initializedDates];
              let currentVisits = [...visits];
              let changed = false;

              datesToInit.forEach(dateStr => {
                if (!newInitDates.includes(dateStr)) {
                  const date = new Date(dateStr + 'T12:00:00');
                  const weekday = getDayNameFromDate(date);
                  const currentWeekOffset = getWeekOffsetForDate(dateStr);

                  const scheduledClientsForDay = clients.filter(c => {
                    if (c.weekday !== weekday) return false;
                    if (c.frequency === 'weekly') return true;
                    if (c.frequency === 'biweekly') return c.weekOffset === currentWeekOffset;
                    if (c.frequency === 'monthly') return currentWeekOffset === 0;
                    return false;
                  });

                  const sortedScheduled = scheduledClientsForDay.sort((a, b) => a.routeOrder - b.routeOrder);

                  const newVisits: Visit[] = sortedScheduled.map(c => ({
                    id: `v_${dateStr}_${c.id}`,
                    clientId: c.id,
                    clientName: c.name,
                    address: c.address,
                    date: dateStr,
                    status: 'pending',
                    isExtra: false
                  }));

                  const existingVisitsForDate = currentVisits.filter(v => v.date === dateStr);
                  const uniqueNewVisits = newVisits.filter(
                    nv => !existingVisitsForDate.some(ev => ev.clientId === nv.clientId)
                  );

                  currentVisits = [...currentVisits, ...uniqueNewVisits];
                  newInitDates.push(dateStr);
                  changed = true;
                }
              });

              if (changed) {
                saveVisitsToStorage(currentVisits);
                setInitializedDates(newInitDates);
                localStorage.setItem('roteiro_pet_initialized_dates', JSON.stringify(newInitDates));
              }
            }}
            onConfirmVisit={handleConfirmVisit}
            onCancelVisit={handleCancelVisit}
            onRescheduleVisit={handleRescheduleVisit}
          />
        )}

        {currentTab === 'configuracoes' && (
          <Settings
            userEmail={userEmail}
            onUpdateEmail={(email) => setUserEmail(email)}
            onLogout={async () => {
              try {
                await signOut(auth);
              } catch (e) {
                console.warn('Firebase signOut error:', e);
              }
              localStorage.setItem('roteiro_pet_is_logged_in', 'false');
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
    </div>
  );
}
