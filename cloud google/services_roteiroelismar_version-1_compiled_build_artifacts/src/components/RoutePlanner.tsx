/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  Plus, 
  Trash2, 
  Users, 
  UserPlus, 
  MapPin, 
  Search, 
  X, 
  Check, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Client, Visit, WeekDay, RouteFrequency } from '../types';
import { WEEKDAYS_PT, FREQUENCIES_PT } from '../data/initialData';

interface RoutePlannerProps {
  clients: Client[];
  visits: Visit[];
  onUpdateClientRoute: (clientId: string, weekday: WeekDay | undefined, frequency: RouteFrequency, order: number) => void;
  onReorderRoute: (weekday: WeekDay, reorderedClients: Client[]) => void;
  onAddVisitForDate: (clientId: string, dateStr: string) => void;
  onDeleteVisit: (visitId: string) => void;
  initializedDates: string[];
  onInitializeDates: (datesToInit: string[]) => void;
  onConfirmVisit: (visitId: string, notes: string, value: number, items: { name: string; qty: number; price: number }[]) => void;
  onCancelVisit: (visitId: string, reason: string) => void;
  onRescheduleVisit: (visitId: string, newDate: string) => void;
}

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

// Helper to get Monday-Saturday dates for the week containing refDateStr
const getWeekDates = (refDateStr: string): { dateStr: string; weekday: WeekDay; label: string; formattedDate: string }[] => {
  const ref = new Date(refDateStr + 'T12:00:00');
  const day = ref.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diffToMonday = day === 0 ? 1 : 1 - day;
  
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + diffToMonday);

  const weekdays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const labels = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  return weekdays.map((w, index) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);
    const dateStr = d.toISOString().split('T')[0];
    const parts = dateStr.split('-');
    const formattedDate = `${parts[2]}/${parts[1]}`;
    return {
      dateStr,
      weekday: w,
      label: labels[index],
      formattedDate
    };
  });
};

export default function RoutePlanner({
  clients,
  visits,
  onUpdateClientRoute,
  onReorderRoute,
  onAddVisitForDate,
  onDeleteVisit,
  initializedDates,
  onInitializeDates,
  onConfirmVisit,
  onCancelVisit,
  onRescheduleVisit,
}: RoutePlannerProps) {
  // Set baseline reference date to today
  const [baselineDate, setBaselineDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Week A / Week B recurrence filter ('all' | '0' | '1')
  const [cycleFilter, setCycleFilter] = useState<'all' | '0' | '1'>('all');

  // Search filter for clients modal
  const [searchQuery, setSearchQuery] = useState('');

  // States for adding a visit dialog
  const [activeAddDate, setActiveAddDate] = useState<{ dateStr: string; label: string } | null>(null);

  // States for assigning permanent fixed route
  const [activeAssignClient, setActiveAssignClient] = useState<Client | null>(null);
  const [assignDay, setAssignDay] = useState<WeekDay>('monday');
  const [assignFreq, setAssignFreq] = useState<RouteFrequency>('weekly');

  // States for Visit Actions modal
  const [selectedVisitForActions, setSelectedVisitForActions] = useState<Visit | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionValue, setCompletionValue] = useState<number>(0);
  const [cancelReason, setCancelReason] = useState('Ignorado/Não visitado');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [actionTab, setActionTab] = useState<'complete' | 'cancel' | 'reschedule'>('complete');

  const weekDates = getWeekDates(baselineDate);

  // Auto-initialize standard visits for all dates in the current week view
  useEffect(() => {
    if (onInitializeDates) {
      const datesToInit = weekDates.map(d => d.dateStr);
      onInitializeDates(datesToInit);
    }
  }, [baselineDate, clients]);

  // Navigate baseline date week-by-week
  const handlePrevWeek = () => {
    const d = new Date(baselineDate + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    setBaselineDate(d.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const d = new Date(baselineDate + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    setBaselineDate(d.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setBaselineDate(new Date().toISOString().split('T')[0]);
  };

  const handleMoveVisitOrder = (
    weekday: WeekDay,
    clientId: string,
    direction: 'up' | 'down'
  ) => {
    const dayClients = clients
      .filter(c => c.weekday === weekday)
      .sort((a, b) => a.routeOrder - b.routeOrder);

    const index = dayClients.findIndex(c => c.id === clientId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= dayClients.length) return;

    const reordered = [...dayClients];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const updatedWithOrder = reordered.map((c, idx) => ({
      ...c,
      routeOrder: idx
    }));

    onReorderRoute(weekday, updatedWithOrder);
  };

  // Determine current baseline ISO week offset (A = 0, B = 1)
  const currentWeekOffset = getWeekOffsetForDate(baselineDate);

  // Filter clients who have no fixed routes (Ad-hoc)
  const unassignedClients = clients.filter(c => !c.weekday || c.frequency === 'adhoc');

  // Helper to format date range for header
  const getWeekRangeLabel = () => {
    if (weekDates.length === 0) return '';
    const start = weekDates[0];
    const end = weekDates[weekDates.length - 1];
    
    const startParts = start.dateStr.split('-');
    const endParts = end.dateStr.split('-');
    
    const startYear = startParts[0];
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    const startMonth = months[parseInt(startParts[1]) - 1];
    const endMonth = months[parseInt(endParts[1]) - 1];

    if (startMonth === endMonth) {
      return `${startParts[2]} a ${endParts[2]} de ${startMonth}, ${startYear}`;
    }
    return `${startParts[2]} de ${startMonth} a ${endParts[2]} de ${endMonth}, ${startYear}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden max-w-6xl mx-auto w-full px-4 pt-4 pb-24">
      
      {/* Header and Controls Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-1.5">
            <Calendar className="w-5 h-5 text-blue-600" />
            Rota Semanal
          </h1>
          <p className="text-xs text-slate-500 font-medium">Visualização integrada das visitas programadas de segunda a sábado.</p>
        </div>

        {/* Navigation Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Week offset indicator */}
          <div className="bg-slate-100 border border-slate-200/60 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Semana {currentWeekOffset === 0 ? 'A (Ímpar)' : 'B (Par)'}</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center gap-1">
            <button
              id="prev_week_btn"
              onClick={handlePrevWeek}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
              title="Semana Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="today_week_btn"
              onClick={handleSetToday}
              className="px-2.5 py-1 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 transition-colors"
            >
              Hoje
            </button>
            <button
              id="next_week_btn"
              onClick={handleNextWeek}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
              title="Próxima Semana"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Date Picker Input to directly jump */}
          <input
            id="baseline_date_picker"
            type="date"
            value={baselineDate}
            onChange={(e) => {
              if (e.target.value) setBaselineDate(e.target.value);
            }}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            title="Ir para outra data"
          />
        </div>
      </div>

      {/* Week Title Range & Cycle Filter Row */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-sm">
        <p className="text-sm font-extrabold text-slate-800">
          {getWeekRangeLabel()}
        </p>

        {/* Recurrence Filter buttons (Semana A / B Filter) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            id="filter_cycle_all"
            onClick={() => setCycleFilter('all')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              cycleFilter === 'all'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Todas as Visitas
          </button>
          <button
            id="filter_cycle_a"
            onClick={() => setCycleFilter('0')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              cycleFilter === '0'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semana A
          </button>
          <button
            id="filter_cycle_b"
            onClick={() => setCycleFilter('1')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              cycleFilter === '1'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semana B
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT: Day lists (1 column on mobile, 2 on tablet, 3 on desktop) */}
      <div className="flex-1 overflow-y-auto mb-6 pr-0.5 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {weekDates.map(({ dateStr, weekday, label, formattedDate }) => {
            // Get all initialized visits for this day, sorted dynamically by client's route order
            const rawDayVisits = visits
              .filter(v => v.date === dateStr)
              .sort((a, b) => {
                const clientA = clients.find(c => c.id === a.clientId);
                const clientB = clients.find(c => c.id === b.clientId);
                const orderA = clientA ? clientA.routeOrder : 999;
                const orderB = clientB ? clientB.routeOrder : 999;
                return orderA - orderB;
              });

            // Apply cycle filter if not 'all'
            const dayVisits = rawDayVisits.filter(v => {
              if (cycleFilter === 'all') return true;
              
              // Find matching client to check schedule frequency
              const client = clients.find(c => c.id === v.clientId);
              if (!client) return true;

              if (client.frequency === 'weekly') return true;
              if (client.frequency === 'biweekly') {
                return client.weekOffset === (cycleFilter === '0' ? 0 : 1);
              }
              if (client.frequency === 'monthly') {
                return cycleFilter === '0'; // Monthlies map to cycle A
              }
              return true; // Keep extras/adhoc
            });

            const isToday = dateStr === todayStr;

            return (
              <div
                key={dateStr}
                className={`bg-white border rounded-2xl flex flex-col overflow-hidden transition-shadow hover:shadow-md ${
                  isToday 
                    ? 'border-emerald-400 ring-2 ring-emerald-500/10' 
                    : 'border-slate-200'
                }`}
              >
                {/* Day Header */}
                <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
                  isToday ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/50 border-slate-100'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800 text-sm">{label}</span>
                    <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {formattedDate}
                    </span>
                  </div>

                  {isToday && (
                    <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                      Hoje
                    </span>
                  )}
                </div>

                {/* Day Visits List */}
                <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[220px] min-h-[140px] scrollbar-none">
                  {dayVisits.length > 0 ? (
                    dayVisits.map((visit) => {
                      const client = clients.find(c => c.id === visit.clientId);
                      const freqLabel = client ? (
                        client.frequency === 'biweekly' 
                          ? `Quinzenal ${client.weekOffset === 0 ? 'A' : 'B'}`
                          : client.frequency === 'weekly' ? 'Semanal' : 'Mensal'
                      ) : null;

                      let statusStyle = 'bg-slate-100 text-slate-600';
                      let statusText = 'Pendente';
                      if (visit.status === 'completed') {
                        statusStyle = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                        statusText = 'Visita Concluída';
                      } else if (visit.status === 'canceled') {
                        statusStyle = 'bg-rose-50 text-rose-700 border-rose-100';
                        statusText = 'Cancelada';
                      }

                      return (
                        <div
                          id={`route_visit_card_${visit.id}`}
                          key={visit.id}
                          onClick={() => {
                            setSelectedVisitForActions(visit);
                            setCompletionNotes(visit.notes || '');
                            setCompletionValue(visit.saleValue || 0);
                            setCancelReason(visit.notes || 'Ignorado/Não visitado');
                            setRescheduleDate(visit.date);
                            setActionTab(visit.status === 'completed' ? 'complete' : visit.status === 'canceled' ? 'cancel' : 'complete');
                          }}
                          className="p-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 rounded-xl flex items-center justify-between gap-3 group transition-all cursor-pointer select-none"
                          title="Clique para realizar ações (Concluir, Reagendar, Cancelar ou Excluir)"
                        >
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-xs truncate" title={visit.clientName}>
                              {visit.clientName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {/* Status indicator */}
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${statusStyle}`}>
                                {statusText}
                              </span>

                              {/* Frequency indicator */}
                              {freqLabel && (
                                <span className="text-[9px] text-slate-400 bg-white border border-slate-200 px-1 py-0.5 rounded font-medium">
                                  {freqLabel}
                                </span>
                              )}

                              {visit.isExtra && (
                                <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                                  Avulso
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {/* Sequence order Up / Down controls */}
                            {!visit.isExtra && client && client.weekday && (
                              <div className="flex flex-col gap-0.5 mr-1">
                                <button
                                  id={`reorder_up_${visit.id}`}
                                  type="button"
                                  onClick={() => handleMoveVisitOrder(weekday, visit.clientId, 'up')}
                                  className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-blue-600 transition-colors"
                                  title="Subir na ordem"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  id={`reorder_down_${visit.id}`}
                                  type="button"
                                  onClick={() => handleMoveVisitOrder(weekday, visit.clientId, 'down')}
                                  className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-blue-600 transition-colors"
                                  title="Descer na ordem"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                            <span 
                              onClick={() => {
                                setSelectedVisitForActions(visit);
                                setCompletionNotes(visit.notes || '');
                                setCompletionValue(visit.saleValue || 0);
                                setCancelReason(visit.notes || 'Ignorado/Não visitado');
                                setRescheduleDate(visit.date);
                                setActionTab(visit.status === 'completed' ? 'complete' : visit.status === 'canceled' ? 'cancel' : 'complete');
                              }}
                              className="p-1 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-colors cursor-pointer"
                              title="Ações da visita"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-6 text-slate-300">
                      <Calendar className="w-7 h-7 stroke-[1.5] mb-1" />
                      <p className="text-[10px] font-bold">Sem visitas marcadas</p>
                    </div>
                  )}
                </div>

                {/* Add Scheduled Visit Button */}
                <div className="p-2.5 bg-slate-50/50 border-t border-slate-100 shrink-0">
                  <button
                    id={`add_visit_btn_${dateStr}`}
                    onClick={() => setActiveAddDate({ dateStr, label })}
                    className="w-full py-1.5 border border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Inserir Agendamento</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* CLIENTS WITH NO FIXED ROUTE SECTION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                Clientes Sem Rota Fixa
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Clientes configurados sem dia fixo na semana. Atualiza automaticamente quando novos clientes são cadastrados.</p>
            </div>
            
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {unassignedClients.length} {unassignedClients.length === 1 ? 'cliente' : 'clientes'} avulso(s)
              </span>
            </div>
          </div>

          {unassignedClients.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {unassignedClients.map((client) => (
                <div 
                  key={client.id}
                  className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex flex-col justify-between gap-3.5 hover:border-slate-300 transition-colors"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-800 text-xs truncate">{client.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{client.address}</span>
                    </p>
                    {client.buyerName && (
                      <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                        Comprador: {client.buyerName}
                      </p>
                    )}
                  </div>

                  {/* Actions for unassigned clients */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50">
                    {/* Add to current week quick button */}
                    <button
                      id={`quick_schedule_btn_${client.id}`}
                      onClick={() => {
                        // Default to the first day of the week or Monday
                        if (weekDates.length > 0) {
                          setActiveAddDate({ dateStr: weekDates[0].dateStr, label: weekDates[0].label });
                          // Pre-fill search field with this client's name to make it instantly selectable
                          setSearchQuery(client.name);
                        }
                      }}
                      className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-extrabold rounded-lg transition-colors border border-blue-100 text-center"
                    >
                      Agendar nesta Semana
                    </button>

                    {/* Make permanent route link */}
                    <button
                      id={`make_permanent_btn_${client.id}`}
                      onClick={() => {
                        setActiveAssignClient(client);
                        setAssignDay('monday');
                        setAssignFreq('weekly');
                      }}
                      className="px-2.5 py-1.5 hover:bg-slate-200/60 text-slate-500 hover:text-slate-700 text-[10px] font-bold rounded-lg transition-colors border border-transparent"
                      title="Definir rota fixa permanente"
                    >
                      Fixar Rota
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
              Nenhum cliente sem rota fixa cadastrado. Todos estão alocados em rotas recorrentes.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD / SCHEDULE A CLIENT ON A SPECIFIC DATE */}
      {activeAddDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Agendar Cliente</h3>
                <p className="text-[11px] text-slate-400 font-bold">
                  Data: {activeAddDate.label} ({activeAddDate.dateStr.split('-').reverse().join('/')})
                </p>
              </div>
              <button
                id="close_add_visit_dialog"
                onClick={() => {
                  setActiveAddDate(null);
                  setSearchQuery('');
                }}
                className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                id="search_modal_clients_input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente para agendar..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* Scrollable list of schedulable clients */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
              {(() => {
                const alreadyScheduledIds = visits
                  .filter(v => v.date === activeAddDate.dateStr)
                  .map(v => v.clientId);

                const filtered = clients.filter(c => {
                  const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (c.buyerName && c.buyerName.toLowerCase().includes(searchQuery.toLowerCase()));
                  const notAlreadyScheduled = !alreadyScheduledIds.includes(c.id);
                  return matchesSearch && notAlreadyScheduled;
                });

                if (filtered.length > 0) {
                  return filtered.map((client) => (
                    <button
                      id={`select_client_to_schedule_${client.id}`}
                      key={client.id}
                      onClick={() => {
                        onAddVisitForDate(client.id, activeAddDate.dateStr);
                        setActiveAddDate(null);
                        setSearchQuery('');
                      }}
                      className="w-full text-left p-2.5 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-100 rounded-xl transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-xs group-hover:text-blue-700 truncate">{client.name}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{client.address}</p>
                      </div>
                      <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg shrink-0 group-hover:bg-blue-100 transition-colors">
                        Selecionar
                      </span>
                    </button>
                  ));
                }

                return (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Nenhum cliente disponível encontrado para os termos da busca.
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                id="close_schedule_footer_btn"
                onClick={() => {
                  setActiveAddDate(null);
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN FIXED WEEKDAY ROUTE PERMANENTLY */}
      {activeAssignClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Definir Rota Fixa</h3>
                <p className="text-[11px] text-slate-400 font-bold truncate max-w-[240px]">
                  {activeAssignClient.name}
                </p>
              </div>
              <button
                id="close_assign_dialog"
                onClick={() => setActiveAssignClient(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase">Dia da Semana Fixo</label>
                <select
                  id="assign_weekday_select"
                  value={assignDay}
                  onChange={(e) => setAssignDay(e.target.value as WeekDay)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 text-slate-700 bg-slate-50/50 font-medium"
                >
                  <option value="monday">Segunda-feira</option>
                  <option value="tuesday">Terça-feira</option>
                  <option value="wednesday">Quarta-feira</option>
                  <option value="thursday">Quinta-feira</option>
                  <option value="friday">Sexta-feira</option>
                  <option value="saturday">Sábado</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase">Frequência da Visita</label>
                <select
                  id="assign_frequency_select"
                  value={assignFreq}
                  onChange={(e) => setAssignFreq(e.target.value as RouteFrequency)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 text-slate-700 bg-slate-50/50 font-medium"
                >
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quinzenal (A cada 2 semanas)</option>
                  <option value="monthly">Mensal (A cada 4 semanas)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                id="confirm_permanent_assign"
                onClick={() => {
                  onUpdateClientRoute(activeAssignClient.id, assignDay, assignFreq, 999);
                  setActiveAssignClient(null);
                  alert(`O cliente "${activeAssignClient.name}" agora tem uma visita fixa programada para as ${WEEKDAYS_PT[assignDay]}s.`);
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all text-center shadow-sm"
              >
                Salvar Rota
              </button>
              <button
                id="cancel_permanent_assign"
                onClick={() => setActiveAssignClient(null)}
                className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 text-xs font-bold rounded-xl transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: VISIT ACTIONS (COMPLETE, CANCEL, RESCHEDULE, DELETE) */}
      {selectedVisitForActions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="min-w-0 pr-4">
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                  Ações de Visita
                </span>
                <h3 className="font-extrabold text-slate-800 text-base truncate mt-1">
                  {selectedVisitForActions.clientName}
                </h3>
                <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                  Data agendada: {selectedVisitForActions.date.split('-').reverse().join('/')}
                </p>
              </div>
              <button
                id="close_visit_actions_modal"
                onClick={() => setSelectedVisitForActions(null)}
                className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Status Badge if completed or canceled */}
            {selectedVisitForActions.status !== 'pending' && (
              <div className={`p-3 rounded-xl border text-xs ${
                selectedVisitForActions.status === 'completed'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <span className="font-bold uppercase tracking-wider block mb-0.5">Visita já {selectedVisitForActions.status === 'completed' ? 'Concluída' : 'Cancelada'}</span>
                <p className="italic">Nota/Motivo: "{selectedVisitForActions.notes || 'Sem observações'}"</p>
                {selectedVisitForActions.status === 'completed' && selectedVisitForActions.saleValue !== undefined && (
                  <p className="font-bold mt-1">Valor Venda: R$ {selectedVisitForActions.saleValue.toFixed(2)}</p>
                )}
              </div>
            )}

            {/* Tabs for pending visits */}
            {selectedVisitForActions.status === 'pending' ? (
              <>
                {/* Tabs bar */}
                <div className="flex border-b border-slate-100 shrink-0">
                  <button
                    id="tab_action_complete"
                    type="button"
                    onClick={() => setActionTab('complete')}
                    className={`flex-1 pb-2.5 text-xs font-bold border-b-2 text-center transition-all ${
                      actionTab === 'complete'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Concluir
                  </button>
                  <button
                    id="tab_action_cancel"
                    type="button"
                    onClick={() => setActionTab('cancel')}
                    className={`flex-1 pb-2.5 text-xs font-bold border-b-2 text-center transition-all ${
                      actionTab === 'cancel'
                        ? 'border-rose-500 text-rose-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Pular/Cancelar
                  </button>
                  <button
                    id="tab_action_reschedule"
                    type="button"
                    onClick={() => setActionTab('reschedule')}
                    className={`flex-1 pb-2.5 text-xs font-bold border-b-2 text-center transition-all ${
                      actionTab === 'reschedule'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Reagendar
                  </button>
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto space-y-4 py-2 min-h-[160px]">
                  {actionTab === 'complete' && (
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase">Observações da Visita</label>
                        <textarea
                          id="completion_notes_input"
                          rows={3}
                          value={completionNotes}
                          onChange={(e) => setCompletionNotes(e.target.value)}
                          placeholder="Digite como foi a visita..."
                          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 text-slate-700 bg-slate-50/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase">Valor Fechado de Venda (R$)</label>
                        <input
                          id="completion_value_input"
                          type="number"
                          step="0.01"
                          value={completionValue || ''}
                          onChange={(e) => setCompletionValue(parseFloat(e.target.value) || 0)}
                          placeholder="Ex: 150.00 (opcional)"
                          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 text-slate-700 bg-slate-50/50"
                        />
                      </div>
                      <button
                        id="submit_complete_action"
                        type="button"
                        onClick={() => {
                          onConfirmVisit(selectedVisitForActions.id, completionNotes || 'Visita concluída com sucesso.', completionValue, []);
                          setSelectedVisitForActions(null);
                        }}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Concluir Visita e Salvar</span>
                      </button>
                    </div>
                  )}

                  {actionTab === 'cancel' && (
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase">Motivo do Cancelamento / Pular</label>
                        <select
                          id="cancel_reason_select"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-400 text-slate-700 bg-slate-50/50"
                        >
                          <option value="Ignorado/Não visitado">Ignorado/Não visitado</option>
                          <option value="Estabelecimento Fechado">Estabelecimento Fechado</option>
                          <option value="Sem Estoque/Sem Interesse">Sem Estoque/Sem Interesse</option>
                          <option value="Comprador Ausente">Comprador Ausente</option>
                          <option value="Outro">Outro Motivo</option>
                        </select>
                      </div>
                      {cancelReason === 'Outro' && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500 uppercase">Escreva o Motivo</label>
                          <input
                            id="custom_cancel_reason_input"
                            type="text"
                            placeholder="Escreva o motivo..."
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-400 text-slate-700 bg-slate-50/50"
                          />
                        </div>
                      )}
                      <button
                        id="submit_cancel_action"
                        type="button"
                        onClick={() => {
                          onCancelVisit(selectedVisitForActions.id, cancelReason || 'Ignorado/Não visitado');
                          setSelectedVisitForActions(null);
                        }}
                        className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                      >
                        Salvar Visita como Cancelada
                      </button>
                    </div>
                  )}

                  {actionTab === 'reschedule' && (
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase">Nova Data para a Visita</label>
                        <input
                          id="reschedule_date_input"
                          type="date"
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 text-slate-700 bg-slate-50/50 font-mono font-bold"
                          required
                        />
                      </div>
                      <button
                        id="submit_reschedule_action"
                        type="button"
                        onClick={() => {
                          if (!rescheduleDate) {
                            alert('Por favor, selecione uma data válida.');
                            return;
                          }
                          onRescheduleVisit(selectedVisitForActions.id, rescheduleDate);
                          setSelectedVisitForActions(null);
                          alert('Visita reagendada com sucesso!');
                        }}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Confirmar Reagendamento</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Re-open/Restore to pending option if already completed/canceled
              <div className="pt-2">
                <button
                  id="reopen_visit_btn"
                  type="button"
                  onClick={() => {
                    if (confirm('Deseja reabrir esta visita e marcá-la como pendente novamente?')) {
                      onRescheduleVisit(selectedVisitForActions.id, selectedVisitForActions.date);
                      setSelectedVisitForActions(null);
                    }
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-all"
                >
                  Reabrir / Restaurar para Pendente
                </button>
              </div>
            )}

            {/* Permanent deletion button at the bottom (Excluir/Desmarcar) */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 shrink-0">
              <button
                id="submit_delete_action"
                type="button"
                onClick={() => {
                  if (confirm(`Deseja realmente desmarcar e excluir permanentemente a visita de "${selectedVisitForActions.clientName}"?`)) {
                    onDeleteVisit(selectedVisitForActions.id);
                    setSelectedVisitForActions(null);
                  }
                }}
                className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                title="Remove a visita completamente da agenda"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir / Desmarcar</span>
              </button>
              <button
                id="close_visit_actions_modal_footer"
                type="button"
                onClick={() => setSelectedVisitForActions(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
