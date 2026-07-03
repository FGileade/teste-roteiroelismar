/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Bell,
  FileText,
  User,
  Save,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { AgendaEvent, EventType, Client } from '../types';

// ─── Color palette per event type ────────────────────────────────────────────
export const EVENT_COLORS: Record<EventType, { bg: string; border: string; text: string; badge: string; dot: string }> = {
  reuniao:      { bg: 'bg-purple-50',  border: 'border-purple-400', text: 'text-purple-700',  badge: 'bg-purple-100 text-purple-700 border-purple-200',  dot: 'bg-purple-500' },
  campanha:     { bg: 'bg-orange-50',  border: 'border-orange-400', text: 'text-orange-700',  badge: 'bg-orange-100 text-orange-700 border-orange-200',  dot: 'bg-orange-500' },
  treinamento:  { bg: 'bg-cyan-50',    border: 'border-cyan-400',   text: 'text-cyan-700',    badge: 'bg-cyan-100 text-cyan-700 border-cyan-200',        dot: 'bg-cyan-500'   },
  compromisso:  { bg: 'bg-pink-50',    border: 'border-pink-400',   text: 'text-pink-700',    badge: 'bg-pink-100 text-pink-700 border-pink-200',        dot: 'bg-pink-500'   },
  outro:        { bg: 'bg-slate-50',   border: 'border-slate-400',  text: 'text-slate-600',   badge: 'bg-slate-100 text-slate-600 border-slate-200',     dot: 'bg-slate-400'  },
};

export const EVENT_LABELS: Record<EventType, string> = {
  reuniao:     '🤝 Reunião',
  campanha:    '📣 Campanha',
  treinamento: '📚 Treinamento',
  compromisso: '📌 Compromisso Pessoal',
  outro:       '📋 Outro',
};

// Extra visit color (used by Dashboard card)
export const EXTRA_VISIT_COLOR = { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' };

// ─── Push Notification helper ────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function scheduleEventNotification(event: AgendaEvent) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!event.reminderMinutes || event.allDay) return;
  if (!event.startTime) return;

  const [h, m] = event.startTime.split(':').map(Number);
  const eventDateTime = new Date(`${event.date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
  const notifyAt = new Date(eventDateTime.getTime() - event.reminderMinutes * 60 * 1000);
  const now = new Date();
  const delay = notifyAt.getTime() - now.getTime();

  if (delay <= 0) return; // already past

  setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification(`🔔 ${event.title}`, {
        body: `Começa em ${event.reminderMinutes} min${event.location ? ` · ${event.location}` : ''}`,
        icon: '/icons/icon-192.png',
        tag: event.id,
      });
    }
  }, delay);
}

// ─── Component ───────────────────────────────────────────────────────────────
interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: AgendaEvent) => void;
  onDelete?: (eventId: string) => void;
  clients: Client[];
  initialDate: string;
  userId: string;
  editingEvent?: AgendaEvent | null;
}

const REMINDER_OPTIONS = [
  { label: 'Sem lembrete', value: 0 },
  { label: '10 min antes', value: 10 },
  { label: '15 min antes', value: 15 },
  { label: '30 min antes', value: 30 },
  { label: '1 hora antes', value: 60 },
  { label: '2 horas antes', value: 120 },
  { label: '1 dia antes', value: 1440 },
];

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  clients,
  initialDate,
  userId,
  editingEvent,
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('reuniao');
  const [date, setDate] = useState(initialDate);
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [clientId, setClientId] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notifGranted, setNotifGranted] = useState(Notification.permission === 'granted');

  // Populate fields when editing
  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setType(editingEvent.type);
      setDate(editingEvent.date);
      setAllDay(editingEvent.allDay);
      setStartTime(editingEvent.startTime || '09:00');
      setEndTime(editingEvent.endTime || '10:00');
      setLocation(editingEvent.location || '');
      setNotes(editingEvent.notes || '');
      setClientId(editingEvent.clientId || '');
      setReminderMinutes(editingEvent.reminderMinutes || 0);
    } else {
      setTitle('');
      setType('reuniao');
      setDate(initialDate);
      setAllDay(false);
      setStartTime('09:00');
      setEndTime('10:00');
      setLocation('');
      setNotes('');
      setClientId('');
      setReminderMinutes(0);
      setConfirmDelete(false);
    }
  }, [editingEvent, initialDate, isOpen]);

  const handleRequestNotifPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const linkedClient = clients.find(c => c.id === clientId);
    const event: AgendaEvent = {
      id: editingEvent?.id || `ev_${Date.now()}`,
      userId,
      title: title.trim(),
      type,
      date,
      allDay,
      startTime: allDay ? undefined : startTime,
      endTime: allDay ? undefined : endTime,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      clientId: clientId || undefined,
      clientName: linkedClient?.name || undefined,
      reminderMinutes: reminderMinutes || undefined,
      createdAt: editingEvent?.createdAt || new Date().toISOString(),
    };

    scheduleEventNotification(event);
    onSave(event);
    onClose();
  };

  if (!isOpen) return null;

  const colors = EVENT_COLORS[type];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-y-auto">
      {/* Header */}
      <div className={`sticky top-0 z-10 border-b px-4 py-4 flex items-center justify-between ${colors.bg} ${colors.border} border-b-2`}>
        <div>
          <h2 className={`text-base font-black ${colors.text} flex items-center gap-2`}>
            <Calendar className="w-5 h-5" />
            {editingEvent ? 'Editar Evento' : 'Novo Evento'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Anote compromissos, reuniões e campanhas na agenda.</p>
        </div>
        <button
          id="close_event_modal"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 hover:bg-white/70 p-2 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto w-full px-4 py-6 space-y-5">

        {/* Título */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 block">Título do Evento *</label>
          <input
            id="event_title"
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Reunião com gerente, Campanha de verão..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-slate-50/50"
          />
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600 block">Tipo de Evento</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(EVENT_LABELS) as EventType[]).map(t => {
              const c = EVENT_COLORS[t];
              const selected = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  id={`event_type_${t}`}
                  onClick={() => setType(t)}
                  className={`text-xs font-bold px-3 py-2.5 rounded-xl border-2 transition-all flex items-center gap-1.5 ${
                    selected
                      ? `${c.bg} ${c.border} ${c.text} shadow-sm`
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                  {EVENT_LABELS[t].replace(/^.{2}/, '').trim()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Data */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 block flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Data</label>
          <input
            id="event_date"
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-slate-50/50 font-mono"
          />
        </div>

        {/* All day toggle */}
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
          <button
            type="button"
            id="event_allday_toggle"
            onClick={() => setAllDay(v => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${allDay ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${allDay ? 'translate-x-5' : ''}`} />
          </button>
          <span className="text-xs font-bold text-slate-700">Evento do dia todo</span>
        </div>

        {/* Hora início / fim */}
        {!allDay && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Início</label>
              <input
                id="event_start_time"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-slate-50/50 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Fim</label>
              <input
                id="event_end_time"
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-slate-50/50 font-mono"
              />
            </div>
          </div>
        )}

        {/* Local */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 block flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Local (opcional)</label>
          <input
            id="event_location"
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Ex: Sala de reunião, Escritório cliente..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-slate-50/50"
          />
        </div>

        {/* Vincular Cliente */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 block flex items-center gap-1"><User className="w-3.5 h-3.5" /> Vincular Cliente (opcional)</label>
          <div className="relative">
            <select
              id="event_client_link"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-slate-50/50 appearance-none pr-8"
            >
              <option value="">— Nenhum cliente vinculado —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          {clientId && (
            <p className="text-[11px] text-slate-400">Este evento será registrado no histórico do cliente vinculado.</p>
          )}
        </div>

        {/* Lembrete / Push Notification */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600 block flex items-center gap-1"><Bell className="w-3.5 h-3.5" /> Lembrete</label>

          {!notifGranted && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
              <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-800">Ative as notificações para receber lembretes</p>
                <button
                  type="button"
                  id="enable_notifications_btn"
                  onClick={handleRequestNotifPermission}
                  className="mt-1.5 text-[11px] font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1 rounded-lg transition-all"
                >
                  Ativar Notificações
                </button>
              </div>
            </div>
          )}

          {notifGranted && (
            <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Notificações ativadas ✓
            </p>
          )}

          <div className="relative">
            <select
              id="event_reminder"
              value={reminderMinutes}
              onChange={e => setReminderMinutes(Number(e.target.value))}
              disabled={allDay}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-slate-50/50 appearance-none pr-8 disabled:opacity-50"
            >
              {REMINDER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          {allDay && <p className="text-[11px] text-slate-400">Lembretes não disponíveis para eventos do dia todo.</p>}
        </div>

        {/* Anotações */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 block flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Anotações (opcional)</label>
          <textarea
            id="event_notes"
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Detalhes, pautas, observações sobre o evento..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 bg-slate-50/50 text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            id="save_event_btn"
            className={`flex-1 py-3 font-bold text-sm rounded-xl transition-all shadow-sm text-white flex items-center justify-center gap-2 ${colors.dot.replace('bg-', 'bg-')} bg-blue-600 hover:bg-blue-700`}
            style={{ backgroundColor: type === 'reuniao' ? '#9333ea' : type === 'campanha' ? '#ea580c' : type === 'treinamento' ? '#0891b2' : type === 'compromisso' ? '#ec4899' : '#64748b' }}
          >
            <Save className="w-4 h-4" />
            {editingEvent ? 'Salvar Alterações' : 'Salvar Evento'}
          </button>

          {editingEvent && onDelete && (
            <button
              type="button"
              id="delete_event_btn"
              onClick={() => {
                if (confirmDelete) {
                  onDelete(editingEvent.id);
                  onClose();
                } else {
                  setConfirmDelete(true);
                  setTimeout(() => setConfirmDelete(false), 3000);
                }
              }}
              className={`px-4 py-3 rounded-xl font-bold text-xs border transition-all ${
                confirmDelete
                  ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                  : 'border-rose-200 text-rose-500 hover:bg-rose-50'
              }`}
            >
              {confirmDelete ? 'Confirmar?' : <Trash2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
