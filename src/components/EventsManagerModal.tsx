import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  Check, 
  AlertTriangle, 
  Edit3, 
  Trash2,
  Filter
} from 'lucide-react';
import { AgendaEvent, Client, EventType } from '../types';
import { EVENT_COLORS, EVENT_LABELS } from './EventModal';
import { formatDate } from '../utils';

interface EventsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendaEvents: AgendaEvent[];
  clients: Client[];
  onOpenNewEvent: () => void;
  onEditEvent: (event: AgendaEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onConfirmEvent: (eventId: string, notes?: string) => void;
  onCancelEvent: (eventId: string) => void;
}

export default function EventsManagerModal({
  isOpen,
  onClose,
  agendaEvents,
  clients,
  onOpenNewEvent,
  onEditEvent,
  onDeleteEvent,
  onConfirmEvent,
  onCancelEvent
}: EventsManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'agendados' | 'concluidos'>('agendados');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Seletor de período/filtro de agendados
  // Opções: '7', '15', '30', 'todos'
  const [scheduledFilter, setScheduledFilter] = useState<'7' | '15' | '30' | 'todos'>('todos');
  
  // Seletor de período/filtro de concluídos
  // Opções: '7', '15', '30', 'todos'
  const [completedFilter, setCompletedFilter] = useState<'7' | '15' | '30' | 'todos'>('todos');

  const [confirmingNotesId, setConfirmingNotesId] = useState<string | null>(null);
  const [eventNotesInput, setEventNotesInput] = useState('');

  if (!isOpen) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const getFilteredEvents = () => {
    return agendaEvents.filter(ev => {
      // 1. Filtrar pelo status e pela aba ativa
      const status = ev.status || 'agendado';
      if (activeTab === 'agendados' && status !== 'agendado') return false;
      if (activeTab === 'concluidos' && status !== 'concluido' && status !== 'cancelado') return false;

      // 2. Filtrar pelo tipo de evento
      if (filterType !== 'all' && ev.type !== filterType) return false;

      // 3. Filtrar pelo período
      const evDate = new Date(ev.date + 'T12:00:00');
      const diffTime = evDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (activeTab === 'agendados') {
        if (scheduledFilter === '7' && (diffDays < 0 || diffDays > 7)) return false;
        if (scheduledFilter === '15' && (diffDays < 0 || diffDays > 15)) return false;
        if (scheduledFilter === '30' && (diffDays < 0 || diffDays > 30)) return false;
      } else {
        // Concluídos/Histórico (diferença negativa significa no passado)
        const pastDays = -diffDays;
        if (completedFilter === '7' && pastDays > 7) return false;
        if (completedFilter === '15' && pastDays > 15) return false;
        if (completedFilter === '30' && pastDays > 30) return false;
      }

      return true;
    }).sort((a, b) => {
      if (activeTab === 'agendados') {
        return a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || '');
      } else {
        return b.date.localeCompare(a.date) || (b.startTime || '').localeCompare(a.startTime || '');
      }
    });
  };

  const filtered = getFilteredEvents();

  const handleOpenConfirmDialog = (ev: AgendaEvent) => {
    setConfirmingNotesId(ev.id);
    setEventNotesInput(ev.notes || '');
  };

  const submitConfirm = (id: string) => {
    onConfirmEvent(id, eventNotesInput.trim());
    setConfirmingNotesId(null);
    setEventNotesInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-xs justify-end sm:justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-3xl w-full mx-auto flex flex-col h-[90vh] sm:h-[80vh] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-500" />
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Eventos e Compromissos</h2>
              <p className="text-[10px] text-slate-400 font-medium">Organize visitas, eventos e compromissos comerciais</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewEvent}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo Lançamento</span>
            </button>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs and Quick Filters */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex bg-slate-200/80 p-0.5 rounded-xl border border-slate-200 text-xs font-bold w-full sm:w-auto">
              <button
                onClick={() => {
                  setActiveTab('agendados');
                  setConfirmingNotesId(null);
                }}
                className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg transition-all ${
                  activeTab === 'agendados'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Agendados / Pendentes
              </button>
              <button
                onClick={() => {
                  setActiveTab('concluidos');
                  setConfirmingNotesId(null);
                }}
                className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg transition-all ${
                  activeTab === 'concluidos'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Concluídos / Histórico
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full sm:w-44 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white text-slate-700 shadow-xs"
              >
                <option value="all">Filtro: Todos os Tipos</option>
                <option value="reuniao">Reuniões</option>
                <option value="campanha">Campanhas</option>
                <option value="treinamento">Treinamentos</option>
                <option value="compromisso">Compromissos</option>
                <option value="outro">Outros</option>
              </select>
            </div>
          </div>

          {/* Time range selectors based on active tab */}
          <div className="pt-2 border-t border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              {activeTab === 'agendados' ? 'Filtro de Agendamento' : 'Filtro de Histórico'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeTab === 'agendados' ? (
                <>
                  {[
                    { label: 'Próximos 7 dias', value: '7' },
                    { label: 'Próximos 15 dias', value: '15' },
                    { label: 'Próximos 30 dias', value: '30' },
                    { label: 'Todos Agendados', value: 'todos' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setScheduledFilter(opt.value as any)}
                      className={`text-xs px-3.5 py-1.5 rounded-lg border font-bold transition-all ${
                        scheduledFilter === opt.value
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { label: 'Últimos 7 dias', value: '7' },
                    { label: 'Últimos 15 dias', value: '15' },
                    { label: 'Últimos 30 dias', value: '30' },
                    { label: 'Todos Concluídos', value: 'todos' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setCompletedFilter(opt.value as any)}
                      className={`text-xs px-3.5 py-1.5 rounded-lg border font-bold transition-all ${
                        completedFilter === opt.value
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <Calendar className="w-12 h-12 mx-auto text-slate-355" />
              <p className="text-sm font-bold">Nenhum evento ou compromisso encontrado.</p>
              <p className="text-xs text-slate-400">Tente ajustar seus filtros acima ou cadastre um novo compromisso.</p>
            </div>
          ) : (
            filtered.map(ev => {
              const colors = EVENT_COLORS[ev.type] || EVENT_COLORS.outro;
              const isConcluido = ev.status === 'concluido';
              const isCancelado = ev.status === 'cancelado';
              const isPend = !isConcluido && !isCancelado;
              
              return (
                <div 
                  key={ev.id} 
                  className={`bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs border-l-4 ${colors.border} space-y-3`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${colors.badge}`}>
                          {EVENT_LABELS[ev.type]?.replace(/^.{2}/, '') || 'Outro'}
                        </span>
                        
                        {isConcluido && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                            Concluído
                          </span>
                        )}

                        {isCancelado && (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                            Cancelado
                          </span>
                        )}

                        <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-bold px-2 py-0.5 rounded font-mono">
                          {formatDate(ev.date)} {ev.startTime && `às ${ev.startTime}`}
                        </span>
                      </div>
                      
                      <h3 className="font-extrabold text-slate-800 text-base leading-tight">
                        {ev.title}
                      </h3>
                    </div>

                    {/* Actions block */}
                    {isPend && (
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        <button
                          onClick={() => handleOpenConfirmDialog(ev)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirmar</span>
                        </button>
                        <button
                          onClick={() => onEditEvent(ev)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Reagendar</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Deseja realmente cancelar este compromisso?')) {
                              onCancelEvent(ev.id);
                            }
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => onEditEvent(ev)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                          title="Editar Detalhes"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Deseja realmente excluir permanentemente este compromisso?')) {
                              onDeleteEvent(ev.id);
                            }
                          }}
                          className="p-1.5 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {ev.location && (
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{ev.location}</span>
                    </p>
                  )}

                  {ev.clientName && (
                    <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-450" />
                      <span>Cliente: {ev.clientName}</span>
                    </div>
                  )}

                  {ev.notes && (
                    <div className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-150/60 leading-relaxed">
                      "{ev.notes}"
                    </div>
                  )}

                  {/* Inline Conclude Notes Dialog */}
                  {confirmingNotesId === ev.id && (
                    <div className="mt-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 animate-slide-up">
                      <label className="text-xs font-bold text-slate-650 block">Notas de Conclusão / Negociação (opcional):</label>
                      <textarea
                        value={eventNotesInput}
                        onChange={(e) => setEventNotesInput(e.target.value)}
                        placeholder="Adicione observações da conversa que serão registradas no histórico do cliente..."
                        rows={2}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                      />
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => setConfirmingNotesId(null)}
                          className="px-3 py-1.5 text-xs font-bold border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                          Voltar
                        </button>
                        <button
                          onClick={() => submitConfirm(ev.id)}
                          className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                        >
                          Concluir Evento
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-400 font-medium">Roteiro Pet Distribuição v1.5</span>
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Fechar Gerenciador
          </button>
        </div>

      </div>
    </div>
  );
}
