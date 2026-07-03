/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Client, Visit, NegotiationHistory, VoiceNote, AgendaEvent } from '../types';

/**
 * Checks if the user already has data stored in Firestore.
 */
export async function hasCloudData(userId: string): Promise<boolean> {
  try {
    const clientsCol = collection(db, 'users', userId, 'clients');
    const snapshot = await getDocs(query(clientsCol));
    return !snapshot.empty;
  } catch (e) {
    console.error('Error checking cloud data:', e);
    return false;
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
      clients.push(doc.data() as Client);
    });

    // 2. Get Visits
    const visitsCol = collection(db, 'users', userId, 'visits');
    const visitsSnap = await getDocs(visitsCol);
    const visits: Visit[] = [];
    visitsSnap.forEach(doc => {
      visits.push(doc.data() as Visit);
    });

    // 3. Get Negotiations
    const negsCol = collection(db, 'users', userId, 'negotiations');
    const negsSnap = await getDocs(negsCol);
    const negotiations: NegotiationHistory[] = [];
    negsSnap.forEach(doc => {
      negotiations.push(doc.data() as NegotiationHistory);
    });

    // 4. Get Voice Notes
    const voiceCol = collection(db, 'users', userId, 'voiceNotes');
    const voiceSnap = await getDocs(voiceCol);
    const voiceNotes: VoiceNote[] = [];
    voiceSnap.forEach(doc => {
      voiceNotes.push(doc.data() as VoiceNote);
    });

    // 4.5. Get Agenda Events
    const eventsCol = collection(db, 'users', userId, 'events');
    const eventsSnap = await getDocs(eventsCol);
    const agendaEvents: AgendaEvent[] = [];
    eventsSnap.forEach(doc => {
      agendaEvents.push(doc.data() as AgendaEvent);
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
      initializedDates
    };
  } catch (e) {
    console.error('Error downloading user data from cloud:', e);
    throw e;
  }
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
        deleteBatch.delete(doc(db, 'users', userId, collectionName, id));
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
      writeBatchInstance.set(docRef, item);
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
    initializedDates: string[];
  }
) {
  try {
    await uploadCollection(userId, 'clients', data.clients);
    await uploadCollection(userId, 'visits', data.visits);
    await uploadCollection(userId, 'negotiations', data.negotiations);
    await uploadCollection(userId, 'voiceNotes', data.voiceNotes);
    await uploadCollection(userId, 'events', data.agendaEvents);
    
    const configDoc = doc(db, 'users', userId, 'config', 'dates');
    await setDoc(configDoc, { dates: data.initializedDates });
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
    await setDoc(configDoc, { dates });
  } catch (e) {
    console.error('Error saving initialized dates to cloud:', e);
  }
}
