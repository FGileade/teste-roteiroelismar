/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Edit2,
  ArrowLeft, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  Clock, 
  MessageCircle, 
  ExternalLink,
  CheckCircle,
  XCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Client, RouteFrequency, WeekDay, NegotiationHistory } from '../types';
import { WEEKDAYS_PT, FREQUENCIES_PT } from '../data/initialData';
import { formatCurrency, formatDate, getWhatsAppUrl, getGoogleMapsUrl, getWazeUrl } from '../utils';

const formatBrazilianPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

interface ClientManagementProps {
  clients: Client[];
  negotiations: NegotiationHistory[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt' | 'routeOrder'>) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onUpdateNegotiation: (neg: NegotiationHistory) => void;
  onDeleteNegotiation: (id: string) => void;
}

export default function ClientManagement({
  clients,
  negotiations,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onUpdateNegotiation,
  onDeleteNegotiation,
}: ClientManagementProps) {
  const [search, setSearch] = useState('');
  const [filterWeekday, setFilterWeekday] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Negotiation Editing State
  const [editingNegId, setEditingNegId] = useState<string | null>(null);
  const [editingNegNotes, setEditingNegNotes] = useState('');

  // Form States
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Vitória');
  const [frequency, setFrequency] = useState<RouteFrequency>('weekly');
  const [weekday, setWeekday] = useState<WeekDay | ''>('monday');
  const [weekOffset, setWeekOffset] = useState<0 | 1>(0);

  // Split address sub-fields
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [state, setState] = useState('ES');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepError, setCepError] = useState('');

  const parseAddress = (fullAddress: string) => {
    let parsedCep = '';
    let parsedStreet = '';
    let parsedNumber = '';
    let parsedCity = '';
    let parsedState = 'ES';

    // 1. Try to extract CEP
    const cepMatch = fullAddress.match(/(\d{5}-\d{3})|(\d{8})/);
    if (cepMatch) {
      parsedCep = cepMatch[0];
    }

    // Remove CEP and trailing whitespace/commas
    let remaining = fullAddress.replace(/,?\s*(?:\d{5}-\d{3}|\d{8})\s*$/, '').trim();

    // 2. Try our standard generated format: "Street, Number - City - State"
    const partsByHyphen = remaining.split(' - ');
    if (partsByHyphen.length >= 3) {
      parsedState = partsByHyphen[partsByHyphen.length - 1].trim();
      parsedCity = partsByHyphen[partsByHyphen.length - 2].trim();
      
      const streetAndNum = partsByHyphen.slice(0, partsByHyphen.length - 2).join(' - ');
      const commaIndex = streetAndNum.lastIndexOf(',');
      if (commaIndex !== -1) {
        parsedStreet = streetAndNum.slice(0, commaIndex).trim();
        parsedNumber = streetAndNum.slice(commaIndex + 1).trim();
      } else {
        parsedStreet = streetAndNum;
      }
    } else {
      // Fallback parser for default seeds
      const stateMatch = remaining.match(/-\s*([A-Z]{2})\s*$/);
      if (stateMatch) {
        parsedState = stateMatch[1];
        remaining = remaining.replace(/-\s*[A-Z]{2}\s*$/, '').trim();
      }

      const commaParts = remaining.split(',');
      if (commaParts.length >= 2) {
        const lastPart = commaParts[commaParts.length - 1].trim();
        if (lastPart.includes('-')) {
          const sub = lastPart.split('-');
          parsedCity = sub[sub.length - 1].trim();
        } else {
          parsedCity = lastPart;
        }

        const streetAndNum = commaParts.slice(0, commaParts.length - 1).join(',').trim();
        const numberMatch = streetAndNum.match(/,\s*(\d+)/);
        if (numberMatch) {
          parsedNumber = numberMatch[1];
          parsedStreet = streetAndNum.split(`, ${parsedNumber}`)[0].trim();
        } else {
          const endNumMatch = streetAndNum.match(/\s+(\d+)\s*$/);
          if (endNumMatch) {
            parsedNumber = endNumMatch[1];
            parsedStreet = streetAndNum.slice(0, streetAndNum.lastIndexOf(parsedNumber)).trim();
          } else {
            parsedStreet = streetAndNum;
          }
        }
      } else {
        parsedStreet = remaining;
      }
    }

    return {
      cep: parsedCep,
      street: parsedStreet,
      number: parsedNumber,
      city: parsedCity || 'Vitória',
      state: parsedState || 'ES'
    };
  };

  const handleCepChange = async (value: string) => {
    // Keep only digits
    const digitsOnly = value.replace(/\D/g, '');
    let formatted = digitsOnly;
    if (digitsOnly.length > 5) {
      formatted = `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 8)}`;
    }
    setCep(formatted.slice(0, 9)); // max 9 characters

    if (digitsOnly.length === 8) {
      setIsLoadingCep(true);
      setCepError('');
      try {
        const response = await fetch(`https://viacep.com.br/ws/${digitsOnly}/json/`);
        if (response.ok) {
          const data = await response.json();
          if (data.erro) {
            setCepError('CEP não encontrado.');
          } else {
            setStreet(data.logradouro || '');
            setCity(data.localidade || '');
            setState(data.uf || 'ES');
            // Auto focus number field
            setTimeout(() => {
              const numInput = document.getElementById('form_client_number');
              if (numInput) (numInput as HTMLInputElement).focus();
            }, 100);
          }
        } else {
          setCepError('Erro ao buscar CEP.');
        }
      } catch (err) {
        setCepError('Erro de conexão ao buscar CEP.');
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  // Filter and search
  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filterWeekday === 'all' || c.weekday === filterWeekday;
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

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

  const resetForm = () => {
    setName('');
    setLegalName('');
    setBuyerName('');
    setPhone('');
    setAddress('');
    setCity('Vitória');
    setCep('');
    setStreet('');
    setNumber('');
    setState('ES');
    setCepError('');
    setIsLoadingCep(false);
    setFrequency('weekly');
    setWeekday('monday');
    setWeekOffset(0);
    setIsAdding(false);
    setIsEditing(false);
  };

  const handleOpenEdit = (client: Client) => {
    setName(client.name);
    setLegalName(client.legalName || '');
    setBuyerName(client.buyerName);
    setPhone(client.phone);
    setAddress(client.address);
    setCity(client.city || 'Vitória');

    // Parse existing address
    const parsed = parseAddress(client.address);
    setCep(parsed.cep);
    setStreet(parsed.street);
    setNumber(parsed.number);
    setCity(client.city || parsed.city || 'Vitória');
    setState(parsed.state || 'ES');
    setCepError('');

    setFrequency(client.frequency);
    setWeekday(client.weekday || '');
    setWeekOffset(client.weekOffset || 0);
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, insira pelo menos o Nome Fantasia do cliente.');
      return;
    }

    // Compile complete address string for storage safely, allowing empty segments
    const streetSegment = street.trim() || 'Sem Rua';
    const numberSegment = number.trim() || 'S/N';
    const citySegment = city.trim() || 'Vitória';
    const stateSegment = state.trim() || 'ES';
    const compiledAddress = `${streetSegment}, ${numberSegment} - ${citySegment} - ${stateSegment}${cep ? `, ${cep.trim()}` : ''}`;

    const clientData = {
      name: name.trim(),
      legalName: legalName.trim() || undefined,
      buyerName: buyerName.trim() || 'Não Informado',
      phone: phone.trim() || 'Não Informado',
      address: compiledAddress,
      city: citySegment,
      frequency,
      weekday: frequency === 'adhoc' ? undefined : (weekday as WeekDay),
      weekOffset: frequency === 'biweekly' ? weekOffset : 0,
      // Simple geocoding simulation in Espírito Santo based on random delta
      latitude: -20.33 + (Math.random() - 0.5) * 0.08,
      longitude: -40.35 + (Math.random() - 0.5) * 0.08,
    };

    if (isEditing && selectedClient) {
      onUpdateClient({
        ...selectedClient,
        ...clientData,
        weekday: clientData.weekday,
        weekOffset: clientData.weekOffset as any,
      });
      // Update local selection context
      setSelectedClient({
        ...selectedClient,
        ...clientData,
        weekday: clientData.weekday,
        weekOffset: clientData.weekOffset as any,
      });
    } else {
      onAddClient(clientData);
    }

    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      onDeleteClient(id);
      setSelectedClient(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Dynamic Detail Sheet / Overlay */}
      {selectedClient && !isEditing && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between z-10">
            <button 
              id="back_to_list"
              onClick={() => setSelectedClient(null)}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                id={`edit_client_${selectedClient.id}`}
                onClick={() => handleOpenEdit(selectedClient)}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar Cadastro"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button
                id={`delete_client_${selectedClient.id}`}
                onClick={() => handleDelete(selectedClient.id)}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Excluir Cliente"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
            {/* Header Identity */}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{selectedClient.name}</h1>
                  {selectedClient.legalName && (
                    <p className="text-xs text-slate-400 mt-1 font-mono">{selectedClient.legalName}</p>
                  )}
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                  <Briefcase className="w-3.5 h-3.5" />
                  Pet & Rações
                </span>
              </div>
            </div>

            {/* ULTIMA NEGOCIAÇÃO - ALWAYS HIGHLIGHTED AT THE TOP */}
            <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <TrendingUp className="w-32 h-32 -mr-10 -mt-10" />
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Última Negociação</span>
                </div>
                {getClientLastNegotiation(selectedClient.id) && (
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                    {formatDate(getClientLastNegotiation(selectedClient.id)!.date)}
                  </span>
                )}
              </div>
              {getClientLastNegotiation(selectedClient.id) ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-200 leading-relaxed italic">
                    "{getClientLastNegotiation(selectedClient.id)!.notes}"
                  </p>
                </div>
              ) : (
                <div className="py-2 text-center text-slate-400 text-sm">
                  Nenhuma negociação registrada para este cliente ainda.
                </div>
              )}
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="grid grid-cols-3 gap-3">
              <a
                id="call_client"
                href={`tel:${selectedClient.phone}`}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-700 transition-colors gap-1.5"
              >
                <div className="p-2 bg-white rounded-full shadow-sm text-blue-600">
                  <Phone className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold">Ligar</span>
              </a>
              <a
                id="whatsapp_client"
                href={getWhatsAppUrl(selectedClient.phone, selectedClient.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-700 transition-colors gap-1.5"
              >
                <div className="p-2 bg-white rounded-full shadow-sm text-emerald-600">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold">WhatsApp</span>
              </a>
              <a
                id="maps_client"
                href={getGoogleMapsUrl(selectedClient.address, selectedClient.latitude, selectedClient.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-700 transition-colors gap-1.5"
              >
                <div className="p-2 bg-white rounded-full shadow-sm text-blue-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold">Navegar</span>
              </a>
            </div>

            {/* Basic Info and Scheduled Route Card */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/60 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Informações Cadastrais</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-medium">Comprador Principal</p>
                  <p className="font-semibold text-slate-700">{selectedClient.buyerName}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-medium">Telefone / Contato</p>
                  <p className="font-semibold text-slate-700 font-mono">{selectedClient.phone}</p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs text-slate-400 font-medium">Endereço de Entrega</p>
                  <p className="font-semibold text-slate-700 leading-snug">{selectedClient.address}</p>
                </div>

                <div className="space-y-1 sm:col-span-2 pt-2 border-t border-slate-200/60">
                  <p className="text-xs text-slate-400 font-medium mb-1">Agenda de Visitas Pré-Programada (Rota)</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-blue-100">
                      <Calendar className="w-3.5 h-3.5" />
                      Frequência: {FREQUENCIES_PT[selectedClient.frequency]}
                    </span>
                    {selectedClient.weekday && (
                      <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-violet-100">
                        <Clock className="w-3.5 h-3.5" />
                        Dia: {WEEKDAYS_PT[selectedClient.weekday]}
                      </span>
                    )}
                    {selectedClient.frequency === 'biweekly' && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-amber-100">
                        Semana: {selectedClient.weekOffset === 0 ? 'Ímpar (A)' : 'Par (B)'}
                      </span>
                    )}
                    {selectedClient.frequency === 'adhoc' && (
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-semibold">
                        Sem agendamento fixo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Negotiation History Log */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500" />
                Histórico de Negociações
              </h3>

              <div className="space-y-3">
                {getClientNegotiationHistory(selectedClient.id).length > 0 ? (
                  getClientNegotiationHistory(selectedClient.id).map((neg, idx) => (
                    <div key={neg.id} className="relative pl-6 pb-4 border-l border-slate-200 last:pb-0">
                      {/* Timeline Dot */}
                      <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 border border-white"></div>
                      
                      {editingNegId === neg.id ? (
                        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-blue-600 font-mono">{formatDate(neg.date)} (Editando)</span>
                          </div>
                          <textarea
                            id={`neg_edit_area_${neg.id}`}
                            value={editingNegNotes}
                            onChange={(e) => setEditingNegNotes(e.target.value)}
                            rows={3}
                            className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 bg-slate-50"
                          />
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              id={`neg_edit_cancel_${neg.id}`}
                              type="button"
                              onClick={() => setEditingNegId(null)}
                              className="text-[10px] font-extrabold px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 uppercase transition-all"
                            >
                              Cancelar
                            </button>
                            <button
                              id={`neg_edit_save_${neg.id}`}
                              type="button"
                              onClick={() => {
                                if (!editingNegNotes.trim()) return;
                                onUpdateNegotiation({ ...neg, notes: editingNegNotes.trim() });
                                setEditingNegId(null);
                              }}
                              className="text-[10px] font-extrabold px-2.5 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 uppercase transition-all"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-2 group">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-400 font-mono">{formatDate(neg.date)}</span>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button
                                id={`neg_action_edit_${neg.id}`}
                                type="button"
                                onClick={() => {
                                  setEditingNegId(neg.id);
                                  setEditingNegNotes(neg.notes);
                                }}
                                className="p-1 hover:text-blue-600 text-slate-400 rounded transition-colors"
                                title="Editar Histórico"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`neg_action_delete_${neg.id}`}
                                type="button"
                                onClick={() => {
                                  if (confirm('Tem certeza de que deseja remover este histórico permanentemente?')) {
                                    onDeleteNegotiation(neg.id);
                                  }
                                }}
                                className="p-1 hover:text-rose-600 text-slate-400 rounded transition-colors"
                                title="Excluir Histórico"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{neg.notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-xl text-slate-400 text-sm border border-dashed border-slate-300">
                    Nenhuma negociação gravada para este cliente.
                  </div>
                )}
              </div>
            </div>

            {/* Gerenciar Cadastro Action Card */}
            <div className="bg-slate-100 rounded-xl p-5 border border-slate-200/80 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-700">Ações de Gerenciamento</h3>
                <p className="text-xs text-slate-500 mt-1">Utilize os botões abaixo para editar as informações ou remover este cliente da sua carteira de forma definitiva.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  id={`detail_edit_btn_${selectedClient.id}`}
                  onClick={() => handleOpenEdit(selectedClient)}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar Cadastro</span>
                </button>
                <button
                  id={`detail_delete_btn_${selectedClient.id}`}
                  onClick={() => handleDelete(selectedClient.id)}
                  className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Cliente</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {(isAdding || isEditing) && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Editar Cadastro de Cliente' : 'Novo Cadastro de Cliente'}
            </h2>
            <button
              id="close_form_btn"
              onClick={resetForm}
              className="text-slate-500 hover:text-slate-800 font-semibold text-sm px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="max-w-xl mx-auto w-full px-4 py-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Dados Básicos</h3>

              {/* Nome Fantasia */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Nome Fantasia (Loja)</label>
                <input
                  id="form_client_name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Pet Shop Big Amigo"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-shadow bg-slate-50/50"
                />
              </div>

              {/* Razão Social */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Razão Social (Opcional)</label>
                <input
                  id="form_client_legal_name"
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Ex: Comercial Pet S.A."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-shadow bg-slate-50/50"
                />
              </div>

              {/* Nome do Comprador */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Nome do Comprador / Contato</label>
                <input
                  id="form_client_buyer"
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Ex: Seu Antunes"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-shadow bg-slate-50/50"
                />
              </div>

              {/* Telefone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">WhatsApp / Telefone (com DDD)</label>
                <input
                  id="form_client_phone"
                  type="tel"
                  maxLength={15}
                  value={phone}
                  onChange={(e) => setPhone(formatBrazilianPhone(e.target.value))}
                  placeholder="Ex: (27) 99999-9999"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-shadow bg-slate-50/50 font-mono"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Localização de Entrega</h3>
                {isLoadingCep && (
                  <span className="text-xs text-blue-600 font-bold animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                    Buscando CEP...
                  </span>
                )}
              </div>

              {/* CEP Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">CEP (Carregamento automático)</label>
                <input
                  id="form_client_cep"
                  type="text"
                  maxLength={9}
                  value={cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  placeholder="Ex: 29060-300"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-shadow bg-slate-50/50 font-mono"
                />
                {cepError && (
                  <p className="text-[11px] text-rose-500 font-bold">{cepError}</p>
                )}
              </div>

              {/* Rua & Número Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-600 block">Rua / Logradouro</label>
                  <input
                    id="form_client_street"
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Ex: Av. Fernando Ferrari"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-shadow bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Número</label>
                  <input
                    id="form_client_number"
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="Ex: 1105"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-shadow bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Cidade & Estado Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-600 block">Cidade</label>
                  <input
                    id="form_client_city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Vitória"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-shadow bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Estado</label>
                  <input
                    id="form_client_state"
                    type="text"
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    placeholder="Ex: ES"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-shadow bg-slate-50/50 font-mono text-center uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Configuração de Rota de Visitas</h3>

              {/* Frequência */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Frequência da Visita Recorrente</label>
                <select
                  id="form_client_frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RouteFrequency)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-shadow bg-white"
                >
                  <option value="weekly">Toda semana</option>
                  <option value="biweekly">A cada 2 semanas</option>
                  <option value="monthly">A cada 4 semanas</option>
                  <option value="adhoc">Avulso (Sem rota recorrente)</option>
                </select>
              </div>

              {frequency !== 'adhoc' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dia da Semana */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Dia da Semana Preferencial</label>
                    <select
                      id="form_client_weekday"
                      value={weekday}
                      onChange={(e) => setWeekday(e.target.value as WeekDay)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-shadow bg-white"
                    >
                      <option value="monday">Segunda-feira</option>
                      <option value="tuesday">Terça-feira</option>
                      <option value="wednesday">Quarta-feira</option>
                      <option value="thursday">Quinta-feira</option>
                      <option value="friday">Sexta-feira</option>
                      <option value="saturday">Sábado</option>
                    </select>
                  </div>

                  {/* Week Offset (For biweekly) */}
                  {frequency === 'biweekly' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">Rota Recorrente Semanal</label>
                      <select
                        id="form_client_week_offset"
                        value={weekOffset}
                        onChange={(e) => setWeekOffset(Number(e.target.value) as any)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-shadow bg-white"
                      >
                        <option value={0}>Semana Ímpar (Grupo A)</option>
                        <option value={1}>Semana Par (Grupo B)</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-6">
              <button
                id="submit_client_form"
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
              >
                <span>{isEditing ? 'Salvar Alterações' : 'Confirmar e Salvar Cliente'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main View: Client Directory */}
      <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full px-4 pt-4 pb-20">
        
        {/* Title Block */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Carteira de Clientes</h1>
            <p className="text-xs text-slate-400 font-medium">Gerencie e configure as rotas de seus clientes.</p>
          </div>
          <button
            id="open_add_client_form"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        </div>

        {/* Search and Filters bar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search_client"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, comprador ou endereço..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-colors"
            />
          </div>

          {/* Weekday filter selector */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              id="filter_client_weekday"
              value={filterWeekday}
              onChange={(e) => setFilterWeekday(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700"
            >
              <option value="all">Filtro: Todos os Dias</option>
              <option value="monday">Segunda-feira</option>
              <option value="tuesday">Terça-feira</option>
              <option value="wednesday">Quarta-feira</option>
              <option value="thursday">Quinta-feira</option>
              <option value="friday">Sexta-feira</option>
              <option value="saturday">Sábado</option>
              <option value="adhoc">Sem Rota Fixa</option>
            </select>
          </div>
        </div>

        {/* Client Cards List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => {
              const lastNeg = getClientLastNegotiation(client.id);
              return (
                <div
                  id={`client_card_${client.id}`}
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Left info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-800 text-base leading-tight group-hover:text-blue-600 transition-colors">
                        {client.name}
                      </h3>
                      {client.weekday && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {WEEKDAYS_PT[client.weekday]}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Comprador: <strong className="text-slate-600">{client.buyerName}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {client.phone}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 flex items-center gap-1 truncate max-w-xl">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {client.address}
                    </p>

                    {/* LAST NEGOTIATION PREVIEW - ALWAYS CLEARLY VISIBLE */}
                    <div className="bg-slate-50 border-l-2 border-blue-500 p-2 rounded-r-md mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="text-slate-600 truncate max-w-lg">
                        <span className="font-bold text-slate-700">Última Negociação: </span>
                        {lastNeg ? `"${lastNeg.notes}"` : 'Nenhuma registrada'}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions Short-Cuts */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <a
                      id={`whatsapp_shortcut_${client.id}`}
                      href={getWhatsAppUrl(client.phone, client.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 rounded-xl transition-all"
                      title="Chamar no WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </a>
                    <a
                      id={`maps_shortcut_${client.id}`}
                      href={getGoogleMapsUrl(client.address, client.latitude, client.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 rounded-xl transition-all"
                      title="Ver Rota de Navegação"
                    >
                      <MapPin className="w-5 h-5" />
                    </a>
                    <button
                      id={`edit_shortcut_${client.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClient(client);
                        handleOpenEdit(client);
                      }}
                      className="p-2.5 bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 rounded-xl transition-all cursor-pointer"
                      title="Editar Cadastro"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button
                      id={`delete_shortcut_${client.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(client.id);
                      }}
                      className="p-2.5 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                      title="Excluir Cliente"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 space-y-2">
              <User className="w-12 h-12 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600">Nenhum cliente encontrado.</p>
              <p className="text-xs">Tente mudar os filtros ou crie um novo cadastro.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
