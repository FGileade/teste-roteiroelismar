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
  routeOrder: number; // Order sequence in the route of that day
  createdAt: string;
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

