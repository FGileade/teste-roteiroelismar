/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RouteFrequency = 'weekly' | 'biweekly' | 'monthly' | 'adhoc';

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export interface Client {
  id: string;
  name: string; // Nome Fantasia
  legalName?: string; // Razão Social
  displayNameType?: 'name' | 'legalName'; // Qual nome exibir nos cards
  buyerName: string; // Nome do Comprador
  phone: string; // Telefone / WhatsApp
  address: string; // Endereço completo
  city?: string;
  latitude?: number;
  longitude?: number;
  // Route Configuration
  frequency: RouteFrequency;
  weekday?: WeekDay; // Monday to Saturday
  weekOffset?: 0 | 1; // Used for "every 2 weeks" (bi-weekly rotation)
  monthWeek?: 1 | 2 | 3 | 4 | 5; // Used for monthly rotation (1st to 5th week of the month)
  routeOrder: number; // Order sequence in the route of that day
  createdAt: string;
  externalCode?: string;
}

export type VisitStatus = 'pending' | 'completed' | 'canceled';

export interface Visit {
  id: string;
  clientId: string;
  clientName: string; // Snapshotted name for safety
  address: string; // Snapshotted address
  date: string; // YYYY-MM-DD
  status: VisitStatus;
  checkInTime?: string;
  notes?: string; // Negotiation details or cancel reason
  saleValue?: number; // Total sold in R$
  itemsSold?: { name: string; qty: number; price: number }[]; // Detailed order details
  isExtra?: boolean; // If added on the fly
}

export interface NegotiationHistory {
  id: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  notes: string;
  value: number;
  items?: { name: string; qty: number; price: number }[];
}

export interface PetFoodProduct {
  id: string;
  name: string;
  price: number; // Standard cost per bag / unit
  category: 'dog' | 'cat' | 'bird' | 'other';
}

export interface VoiceNote {
  id: string;
  text: string;
  createdAt: string;
  clientId?: string;
  clientName?: string;
}

export type EventType = 'reuniao' | 'campanha' | 'treinamento' | 'compromisso' | 'outro';

export interface AgendaEvent {
  id: string;
  userId: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  allDay: boolean;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  location?: string;
  notes?: string;
  clientId?: string;
  clientName?: string;
  reminderMinutes?: number; // minutes before event to notify
  notificationScheduledAt?: string; // ISO timestamp when notif was scheduled
  status?: 'agendado' | 'concluido' | 'cancelado';
  createdAt: string;
}

export interface ProductLoan {
  id: string;
  originClientId: string;
  originClientName: string;
  destClientId: string;
  destClientName: string;
  productName: string;
  quantity: string;
  date: string;
  status: 'pending' | 'resolved';
  notes?: string;
  returnDate?: string;
  returnNotes?: string;
  createdAt: string;
}
