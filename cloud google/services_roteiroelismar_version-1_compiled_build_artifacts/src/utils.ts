/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a number as Brazilian Real (R$) currency.
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formats a YYYY-MM-DD date string to DD/MM/YYYY.
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

/**
 * Formats a YYYY-MM-DD date string to a human friendly format like "Quinta, 02 de Julho".
 */
export const formatFriendlyDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    }).replace(/^\w/, (c) => c.toUpperCase());
  } catch (e) {
    return dateStr;
  }
};

/**
 * Generates the deep link for Google Maps navigation.
 */
export const getGoogleMapsUrl = (address: string, latitude?: number, longitude?: number): string => {
  if (latitude && longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
};

/**
 * Generates the deep link for Waze navigation.
 */
export const getWazeUrl = (address: string, latitude?: number, longitude?: number): string => {
  if (latitude && longitude) {
    return `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
  }
  return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
};

/**
 * Generates a WhatsApp API link with a pre-written message.
 */
export const getWhatsAppUrl = (phone: string, clientName: string): string => {
  // Clean phone number (keep only digits)
  const cleanPhone = phone.replace(/\D/g, '');
  // Format international prefix if not present (assuming Brazil +55)
  const formattedPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
  
  const text = `Olá, tudo bem? Aqui é o vendedor da distribuidora de rações. Estou organizando minha rota de visitas e passarei em breve na ${clientName}! Até logo.`;
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;
};

/**
 * Calculates distance in kilometers between two sets of GPS coordinates (Haversine formula).
 */
export const getDistanceInKm = (
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number
): number | null => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
  
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Number(d.toFixed(1));
};

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Returns the current local date as a YYYY-MM-DD string.
 */
export const getLocalTodayString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
