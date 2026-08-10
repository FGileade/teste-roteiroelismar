/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  X, 
  MapPin, 
  Navigation, 
  Calendar, 
  Plus, 
  Search, 
  Phone, 
  DollarSign, 
  FileText, 
  User,
  CheckCircle,
  XCircle,
  MessageCircle,
  Clock,
  Compass,
  ArrowRight,
  TrendingUp,
  ShoppingCart,
  Mic,
  MicOff,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Client, Visit, NegotiationHistory, PetFoodProduct } from '../types';
import { INITIAL_PRODUCTS, WEEKDAYS_PT } from '../data/initialData';
import { 
  formatCurrency, 
  formatDate,
  formatFriendlyDate, 
  getGoogleMapsUrl, 
  getWazeUrl, 
  getWhatsAppUrl,
  getDistanceInKm,
  getLocalTodayString 
} from '../utils';

interface DashboardProps {
  clients: Client[];
  visits: Visit[];
  negotiations: NegotiationHistory[];
  selectedDate: string;
  onSetSelectedDate: (date: string) => void;
  onConfirmVisit: (visitId: string, notes: string, value: number, items: { name: string; qty: number; price: number }[]) => void;
  onCancelVisit: (visitId: string, reason: string) => void;
  onAddExtraVisit: (clientId: string) => void;
  onRemoveExtraVisit: (visitId: string) => void;
  onRescheduleVisit: (visitId: string, newDate: string) => void;
}

export default function Dashboard({
  clients,
  visits,
  negotiations,
  selectedDate,
  onSetSelectedDate,
  onConfirmVisit,
  onCancelVisit,
  onAddExtraVisit,
  onRemoveExtraVisit,
  onRescheduleVisit,
}: DashboardProps) {
  // UI Panels State
  const [isConfirmingId, setIsConfirmingId] = useState<string | null>(null);
  const [isCancelingId, setIsCancelingId] = useState<string | null>(null);
  const [isReschedulingId, setIsReschedulingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [isAddingExtra, setIsAddingExtra] = useState(false);
  const [selectedClientHistoryId, setSelectedClientHistoryId] = useState<string | null>(null);

  const handlePrevDay = () => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() - 1);
    onSetSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + 1);
    onSetSelectedDate(current.toISOString().split('T')[0]);
  };



  // GPS Proximity Simulation State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Form check-in details
  const [checkInNotes, setCheckInNotes] = useState('');

  // Voice Input (Speech Recognition) State
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startSpeechRecognition = () => {
    setSpeechError('');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSpeechError('Seu navegador não suporta reconhecimento de voz.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Permissão para microfone negada. Verifique as configurações do navegador.');
        } else {
          setSpeechError(`Erro no reconhecimento: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setCheckInNotes(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalTranscript.trim()}` : finalTranscript.trim();
          });
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setSpeechError('Não foi possível iniciar o microfone.');
      setIsListening(false);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleToggleVoiceInput = () => {
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  // Form cancel details
  const [cancelReason, setCancelReason] = useState('Sem Estoque/Sem Interesse');

  // Load user geolocation simulator (or real geolocation if granted)
  useEffect(() => {
    const savedOffice = localStorage.getItem('roteiro_pet_office_location');
    if (savedOffice) {
      try {
        const parsed = JSON.parse(savedOffice);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          setUserCoords({ lat: parsed.lat, lng: parsed.lng });
          return;
        }
      } catch (e) {
        console.error('Error loading office location from local storage:', e);
      }
    }
    // Let's set a default central Vila Velha/Cariacica simulator coordinate
    setUserCoords({ lat: -20.363489, lng: -40.405351 });
  }, []);

  const handleRequestRealLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        (err) => {
          console.warn("Location permission denied or unavailable. Using simulated GPS.");
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  // Calculations for current selected date visits, sorted dynamically by client's route order
  const dailyVisits = visits
    .filter(v => v.date === selectedDate)
    .sort((a, b) => {
      const clientA = clients.find(c => c.id === a.clientId);
      const clientB = clients.find(c => c.id === b.clientId);
      const orderA = clientA ? clientA.routeOrder : 999;
      const orderB = clientB ? clientB.routeOrder : 999;
      return orderA - orderB;
    });
  const totalScheduled = dailyVisits.length;
  const totalCompleted = dailyVisits.filter(v => v.status === 'completed').length;
  const totalCanceled = dailyVisits.filter(v => v.status === 'canceled').length;

  // Open confirmation drawer reset states
  const handleOpenConfirm = (visitId: string) => {
    setIsConfirmingId(visitId);
    setCheckInNotes('');
    setSpeechError('');
    setIsListening(false);
  };

  // Submit visit completion
  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmingId) return;

    const noteText = checkInNotes.trim() || 'Visita concluída com sucesso.';

    onConfirmVisit(isConfirmingId, noteText, 0, []);
    stopSpeechRecognition();
    setIsConfirmingId(null);
  };

  // Submit cancelation
  const handleCancelSubmit = (visitId: string) => {
    const finalReason = cancelReason === 'Outro' ? 'Ignorado/Não visitado' : cancelReason;
    onCancelVisit(visitId, finalReason);
    setIsCancelingId(null);
  };

  // Quick Client Negotiation Search Helper
  const getClientLastNegotiation = (clientId: string) => {
    const clientNegs = negotiations
      .filter(n => n.clientId === clientId)
      .sort((a, b) => b.date.localeCompare(a.date));
    return clientNegs.length > 0 ? clientNegs[0] : null;
  };

  const getClientNegotiationHistory = (clientId: string) => {
    return negotiations
      .filter(n => n.clientId === clientId)
      .sort((a, b) => b.date.localeCompare(a.date));
  };

  // Calculate client list sorted by proximity to simulated location
  const getClientsSortedByDistance = (): { client: Client; distance: number | null }[] => {
    if (!userCoords) return clients.map(c => ({ client: c, distance: null }));
    return clients
      .map(c => {
        const d = getDistanceInKm(userCoords.lat, userCoords.lng, c.latitude, c.longitude);
        return { client: c, distance: d };
      })
      .sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      
      {/* 1. TOP STATS BAR & QUICK DATE SWIPER */}
      <div className="bg-white border-b border-slate-200 shrink-0 shadow-sm">
        <div className="max-w-4xl mx-auto w-full px-4 py-3 space-y-3">
          
          {/* Header Greeting & Real-time Info */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                roteiroelismar
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Modo Offline Ativo"></span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Distribuição Pet & Ração</p>
            </div>

            {/* Quick date shortcuts */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                id="select_prev_day_btn"
                type="button"
                onClick={handlePrevDay}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all"
                title="Dia Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                id="select_today_btn"
                onClick={() => {
                  onSetSelectedDate(getLocalTodayString());
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedDate === getLocalTodayString()
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Hoje
              </button>

              <button
                id="select_next_day_btn"
                type="button"
                onClick={handleNextDay}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all"
                title="Avanço de Dia"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>

              <input
                id="agenda_date_picker"
                type="date"
                value={selectedDate}
                onChange={(e) => onSetSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none px-2 py-1 cursor-pointer"
              />
            </div>
          </div>

          {/* Progress and Route Metrics Summary Card */}
          <div className="bg-slate-900 rounded-xl p-4 text-white flex items-center justify-between gap-4 shadow-sm relative overflow-hidden">
            <div className="space-y-1.5 z-10 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Desempenho da Rota</p>
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                {totalCompleted} de {totalScheduled} Concluídos 
                {totalCanceled > 0 && <span className="text-xs text-slate-400 font-medium">({totalCanceled} ignorados)</span>}
              </h2>
              
              {/* Simple progress bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-500" 
                  style={{ width: `${totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="text-right z-10 bg-slate-800 px-3 py-2 rounded-xl border border-slate-700 shrink-0">
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Aproveitamento</p>
              <p className="text-base font-black font-mono tracking-tight text-blue-400">
                {totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0}%
              </p>
            </div>
          </div>



          {/* Subtitle / Day Information */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {formatFriendlyDate(selectedDate)}
            </span>
            <button
              id="open_extra_visit_drawer"
              onClick={() => setIsAddingExtra(true)}
              className="flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-800"
            >
              <Plus className="w-4 h-4" />
              <span>Visita Extra</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. MAIN VISITS FEED */}
      <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 py-4 space-y-3.5 pb-24">
        {dailyVisits.length > 0 ? (
          dailyVisits.map((visit, index) => {
            const client = clients.find(c => c.id === visit.clientId);
            const lastNeg = getClientLastNegotiation(visit.clientId);
            const isPending = visit.status === 'pending';
            const isCompleted = visit.status === 'completed';
            const isCanceled = visit.status === 'canceled';

            return (
              <div
                id={`visit_card_${visit.id}`}
                key={visit.id}
                className={`bg-white rounded-xl border p-4 shadow-xs hover:shadow-md transition-all space-y-3.5 relative ${
                  isCompleted 
                    ? 'border-emerald-200 bg-emerald-50/10 border-l-4 border-l-emerald-500' 
                    : isCanceled 
                      ? 'border-slate-200 bg-slate-100/30 opacity-75 border-l-4 border-l-slate-400' 
                      : 'border-slate-200/80 border-l-4 border-l-blue-500 hover:border-blue-400'
                }`}
              >
                {/* Upper row: Sequence, Title, Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                        {index + 1}ª Parada {visit.isExtra ? '• Extra' : ''}
                      </span>
                      {isCompleted && (
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-emerald-200">
                          <Check className="w-3 h-3" /> Visitado
                        </span>
                      )}
                      {isCanceled && (
                        <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-rose-200">
                          <X className="w-3 h-3" /> Cancelado
                        </span>
                      )}
                    </div>
                    
                    {/* Interactive client name - opens history */}
                    <h3 
                      id={`client_title_link_${visit.clientId}`}
                      onClick={() => setSelectedClientHistoryId(visit.clientId)}
                      className="font-extrabold text-slate-800 text-base leading-tight hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1"
                      title="Ver Histórico Completo"
                    >
                      {visit.clientName}
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                    </h3>

                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {visit.address}
                    </p>
                  </div>

                  {/* Contact & Delete Shortcuts */}
                  {isPending && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {client && (
                        <a
                          id={`whatsapp_visit_${visit.id}`}
                          href={getWhatsAppUrl(client.phone, client.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors"
                          title="Enviar mensagem a caminho"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        id={`remove_visit_${visit.id}`}
                        onClick={() => {
                          if (confirm(`Tem certeza de que deseja desmarcar/excluir a visita de "${visit.clientName}"?`)) {
                            onRemoveExtraVisit(visit.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 border border-slate-100 hover:border-rose-100 bg-slate-50/50 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir/Desmarcar Visita"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* ULTIMA NEGOCIAÇÃO - ALWAYS HIGHLIGHTED IN ROYAL BLUE FOR STRATEGIC PREPARATION */}
                <div 
                  id={`visit_last_neg_${visit.id}`}
                  onClick={() => setSelectedClientHistoryId(visit.clientId)}
                  className="bg-blue-50/50 hover:bg-blue-50 border-l-2 border-blue-400 p-2.5 rounded-r-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors cursor-pointer"
                  title="Clique para ver todo o histórico"
                >
                  <div className="text-slate-700 leading-relaxed max-w-xl">
                    <span className="font-extrabold text-blue-800">Última Visita / Negociação: </span>
                    {lastNeg ? `"${lastNeg.notes}"` : 'Nenhum histórico registrado'}
                  </div>
                </div>



                {/* Visit action results notes (If completed or canceled) */}
                {(isCompleted || isCanceled) && (
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-lg text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-slate-500">
                      <span>Resultado da Visita:</span>
                    </div>
                    <p className="text-slate-600 italic">"{visit.notes}"</p>
                  </div>
                )}

                {/* Bottom interactive buttons row (only if pending) */}
                {isPending && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100">
                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-1.5 flex-1">
                      {/* Waze Link */}
                      <a
                        id={`waze_nav_${visit.id}`}
                        href={getWazeUrl(visit.address, client?.latitude, client?.longitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#10b1e6] text-white py-2 px-3 rounded-lg text-xs font-bold hover:brightness-95 shadow-sm flex items-center justify-center gap-1"
                      >
                        <Navigation className="w-3.5 h-3.5 rotate-45 shrink-0" />
                        <span>Chamar Waze</span>
                      </a>
                      {/* Google Maps Link */}
                      <a
                        id={`maps_nav_${visit.id}`}
                        href={getGoogleMapsUrl(visit.address, client?.latitude, client?.longitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#4285F4] text-white py-2 px-3 rounded-lg text-xs font-bold hover:brightness-95 shadow-sm flex items-center justify-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>Chamar Maps</span>
                      </a>
                    </div>

                    {/* Completion Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        id={`reschedule_btn_${visit.id}`}
                        onClick={() => {
                          setIsReschedulingId(visit.id);
                          setRescheduleDate(visit.date);
                        }}
                        className="py-2 px-3 border border-blue-200 hover:border-blue-300 bg-blue-50/40 text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                        title="Reagendar esta visita para outra data"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Reagendar</span>
                      </button>

                      <button
                        id={`cancel_btn_${visit.id}`}
                        onClick={() => setIsCancelingId(visit.id)}
                        className="py-2 px-3 border border-rose-200 hover:border-rose-300 bg-rose-50/40 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg transition-all"
                      >
                        Pular / Cancelar
                      </button>
                      
                      <button
                        id={`confirm_btn_${visit.id}`}
                        onClick={() => handleOpenConfirm(visit.id)}
                        className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Concluir Visita</span>
                      </button>
                    </div>
                  </div>
                )}
                


              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 space-y-3">
            <Calendar className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-extrabold text-slate-600 text-base">Sem visitas nesta data!</p>
            <p className="text-xs max-w-xs mx-auto">Não há visitas pré-programadas para este dia da semana ou você completou toda a rota.</p>
            <button
              id="no_visit_add_extra"
              onClick={() => setIsAddingExtra(true)}
              className="mt-2 inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              Adicionar Visita Extra
            </button>
          </div>
        )}
      </div>

      {/* 3. CONFIRM CHECK-IN / SALE DRAWER MODAL */}
      {isConfirmingId && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Concluir Visita e Registrar Negociação
              </h2>
              <p className="text-xs text-slate-400">Insira as observações sobre a conversa com o cliente para o histórico.</p>
            </div>
            <button
              id="close_confirm_drawer"
              onClick={() => {
                stopSpeechRecognition();
                setIsConfirmingId(null);
              }}
              className="text-slate-500 hover:text-slate-800 font-bold text-xs px-3 py-1.5 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
          </div>
 
          <form onSubmit={handleConfirmSubmit} className="max-w-xl mx-auto w-full px-4 py-5 space-y-5">
            {/* Notes details */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600 block">Observações da Visita / Negociação *</label>
                
                {/* Voice Typing / Speech Recognition Button */}
                <button
                  id="voice_input_toggle_btn"
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-500 text-white border-rose-500 animate-pulse shadow-md shadow-rose-500/20'
                      : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 animate-bounce" />
                      <span>Parar Gravação por Voz</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                      <span>Digitação por Voz</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <textarea
                  id="form_notes_text"
                  rows={5}
                  required
                  value={checkInNotes}
                  onChange={(e) => setCheckInNotes(e.target.value)}
                  placeholder="Ex: Conversado com o comprador. Deixou agendado para entregar mercadoria na próxima semana. Demonstrou interesse na linha premium."
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all bg-slate-50/50 text-sm ${
                    isListening ? 'border-rose-400 ring-2 ring-rose-500/15' : 'border-slate-200'
                  }`}
                />
                
                {isListening && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-bounce shadow-md">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                    <span>Gravando Voz... fale agora</span>
                  </div>
                )}
              </div>
              
              {speechError && (
                <p className="text-[11px] text-rose-500 font-bold bg-rose-50 p-2 rounded-lg border border-rose-100">{speechError}</p>
              )}
            </div>
 
            <div className="pt-4">
              <button
                id="submit_confirm_visit"
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-5 h-5" />
                <span>Salvar Histórico e Concluir Visita</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. CANCEL REASON DRAWER */}
      {isCancelingId && (
        <div className="fixed inset-0 z-55 flex items-end justify-center bg-black/60 p-4">
          <div className="bg-white rounded-t-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">Cancelar Visita</h3>
              <button
                id="close_cancel_dialog"
                onClick={() => setIsCancelingId(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-400 font-semibold">Selecione o motivo da dispensa ou reagendamento:</p>
              
              <div className="grid grid-cols-1 gap-2">
                {[
                  'Sem Estoque/Sem Interesse',
                  'Loja Fechada / Feriado',
                  'Comprador Principal Ausente',
                  'Solicitou reagendamento',
                  'Outro'
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setCancelReason(reason)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all ${
                      cancelReason === reason
                        ? 'border-blue-500 bg-blue-50/40 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                id="submit_cancel_visit"
                onClick={() => handleCancelSubmit(isCancelingId)}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
              >
                Confirmar Cancelamento
              </button>
              <button
                id="dismiss_cancel"
                onClick={() => setIsCancelingId(null)}
                className="px-4 py-3 text-slate-500 hover:bg-slate-100 text-xs font-bold rounded-xl"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4.5 RESCHEDULE DRAWER */}
      {isReschedulingId && (
        <div className="fixed inset-0 z-55 flex items-end justify-center bg-black/60 p-4">
          <div className="bg-white rounded-t-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-blue-600" />
                Reagendar Visita
              </h3>
              <button
                id="close_reschedule_dialog"
                onClick={() => setIsReschedulingId(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Escolha a nova data para a visita deste cliente. A visita será movida e ficará pendente na data selecionada:
              </p>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Nova Data da Visita *</label>
                <input
                  id="form_reschedule_date"
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-shadow bg-slate-50/50 font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                id="submit_reschedule_visit"
                onClick={() => {
                  if (!rescheduleDate) {
                    alert('Por favor, selecione uma data válida.');
                    return;
                  }
                  onRescheduleVisit(isReschedulingId, rescheduleDate);
                  setIsReschedulingId(null);
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
              >
                Confirmar Reagendamento
              </button>
              <button
                id="dismiss_reschedule"
                onClick={() => setIsReschedulingId(null)}
                className="px-4 py-3 text-slate-500 hover:bg-slate-100 text-xs font-bold rounded-xl"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ADD EXTRA VISIT DRAWER (Proximity Helper!) */}
      {isAddingExtra && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <Compass className="w-5 h-5 text-blue-600" />
                Adicionar Visita Extra
              </h2>
              <p className="text-xs text-slate-400">Adicione qualquer cliente do seu catálogo à agenda de hoje.</p>
            </div>
            <button
              id="close_extra_drawer"
              onClick={() => setIsAddingExtra(false)}
              className="text-slate-500 hover:text-slate-800 font-bold text-xs px-3 py-1.5 hover:bg-slate-100 rounded-lg"
            >
              Fechar
            </button>
          </div>

          <div className="max-w-xl mx-auto w-full px-4 py-4 space-y-4">
            
            {/* GPS Proximity Section (Smart suggestion) */}
            <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Compass className="w-4.5 h-4.5 text-emerald-400 animate-spin-slow" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Localização por Proximidade</span>
                </div>
                <button
                  id="request_gps"
                  onClick={handleRequestRealLocation}
                  disabled={isLocating}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded-lg font-bold transition-all text-slate-300"
                >
                  {isLocating ? 'Obtendo GPS...' : 'Atualizar GPS'}
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Mostrando os clientes mais próximos de você para aproveitar visitas rápidas no mesmo bairro.
              </p>
            </div>

            {/* Sorted proximity list */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selecione para Adicionar</h3>
              
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {getClientsSortedByDistance().map(({ client, distance }) => {
                  // Check if client is already in today's list
                  const alreadyScheduled = dailyVisits.some(v => v.clientId === client.id);
                  
                  return (
                    <div key={client.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-800 text-xs truncate">{client.name}</h4>
                          {distance !== null && (
                            <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                              A {distance} km
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{client.address}</p>
                      </div>

                      <button
                        id={`add_extra_item_${client.id}`}
                        onClick={() => {
                          onAddExtraVisit(client.id);
                          setIsAddingExtra(false);
                        }}
                        disabled={alreadyScheduled}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          alreadyScheduled
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-white border-blue-200 hover:bg-blue-50 text-blue-600 shadow-xs'
                        }`}
                      >
                        {alreadyScheduled ? 'Na Agenda' : 'Adicionar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. INDLINE CLIENT HISTORY OVERLAY */}
      {selectedClientHistoryId && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between z-10">
            <button 
              id="close_inline_history"
              onClick={() => setSelectedClientHistoryId(null)}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors text-sm"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
              <span>Voltar para Agenda</span>
            </button>
          </div>

          <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
            {/* Identity */}
            {clients.find(c => c.id === selectedClientHistoryId) && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {clients.find(c => c.id === selectedClientHistoryId)!.name}
                  </h1>
                  <p className="text-xs text-slate-400 font-medium">Histórico rápido acessado pela agenda.</p>
                </div>

                {/* HIGHLIGHTED LAST NEGOTIATION */}
                <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <TrendingUp className="w-32 h-32 -mr-10 -mt-10" />
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Última Visita / Negociação</span>
                    </div>
                  </div>
                  
                  {getClientLastNegotiation(selectedClientHistoryId) ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-100 italic leading-relaxed">
                        "{getClientLastNegotiation(selectedClientHistoryId)!.notes}"
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">Nenhum histórico de visita cadastrado ainda.</div>
                  )}
                </div>

                {/* Info summary */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm space-y-2">
                  <p className="font-bold text-slate-700">Detalhes de Contato:</p>
                  <p className="text-slate-600">Comprador: <strong className="text-slate-800">{clients.find(c => c.id === selectedClientHistoryId)!.buyerName}</strong></p>
                  <p className="text-slate-600">WhatsApp: <strong className="text-slate-800 font-mono">{clients.find(c => c.id === selectedClientHistoryId)!.phone}</strong></p>
                  <p className="text-slate-600">Endereço: <strong className="text-slate-800">{clients.find(c => c.id === selectedClientHistoryId)!.address}</strong></p>
                </div>

                {/* History Timeline */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 text-base">Histórico de Visitas Recentes</h3>
                  <div className="space-y-3">
                    {getClientNegotiationHistory(selectedClientHistoryId).length > 0 ? (
                      getClientNegotiationHistory(selectedClientHistoryId).map((neg) => (
                        <div key={neg.id} className="relative pl-6 pb-4 border-l border-slate-200 last:pb-0">
                          <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 border border-white"></div>
                          
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-400 font-mono">{formatDate(neg.date)}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">"{neg.notes}"</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        Nenhuma visita anterior cadastrada.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
