/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  FileText,
  AlertCircle,
  ArrowRightLeft,
  RotateCcw
} from 'lucide-react';
import { Client, RouteFrequency, WeekDay, NegotiationHistory, ProductLoan } from '../types';
import { WEEKDAYS_PT, FREQUENCIES_PT } from '../data/initialData';
import { formatCurrency, formatDate, getWhatsAppUrl, getGoogleMapsUrl, getWazeUrl, getLocalTodayString, getClientDisplayName } from '../utils';

export const MONTH_WEEKS_PT = {
  1: 'Primeira semana do mês',
  2: 'Segunda semana do mês',
  3: 'Terceira semana do mês',
  4: 'Quarta semana do mês',
  5: 'Quinta semana do mês',
};

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
  loans: ProductLoan[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt' | 'routeOrder'>) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onUpdateNegotiation: (neg: NegotiationHistory) => void;
  onDeleteNegotiation: (id: string) => void;
  onAddLoan: (loan: ProductLoan) => void;
  onUpdateLoan: (loan: ProductLoan) => void;
  onDeleteLoan: (id: string) => void;
  activeSubTab?: 'carteira' | 'emprestimos';
  onActiveSubTabChange?: (tab: 'carteira' | 'emprestimos') => void;
}

export default function ClientManagement({
  clients,
  negotiations,
  loans,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onUpdateNegotiation,
  onDeleteNegotiation,
  onAddLoan,
  onUpdateLoan,
  onDeleteLoan,
  activeSubTab: propActiveSubTab,
  onActiveSubTabChange,
}: ClientManagementProps) {
  const [search, setSearch] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'carteira' | 'emprestimos'>('carteira');

  useEffect(() => {
    if (propActiveSubTab) {
      setActiveSubTab(propActiveSubTab);
    }
  }, [propActiveSubTab]);

  const handleSubTabChange = (tab: 'carteira' | 'emprestimos') => {
    setActiveSubTab(tab);
    if (onActiveSubTabChange) {
      onActiveSubTabChange(tab);
    }
  };

  // Loan Search and Filters
  const [loanSearch, setLoanSearch] = useState('');
  const [loanFilterStatus, setLoanFilterStatus] = useState<'all' | 'pending' | 'resolved'>('all');

  // Loan Form State
  const [isAddingLoan, setIsAddingLoan] = useState(false);
  const [isEditingLoan, setIsEditingLoan] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [originClientId, setOriginClientId] = useState('');
  const [destClientId, setDestClientId] = useState('');
  const [loanOriginSearch, setLoanOriginSearch] = useState('');
  const [loanDestSearch, setLoanDestSearch] = useState('');
  const [loanProductName, setLoanProductName] = useState('');
  const [loanQuantity, setLoanQuantity] = useState('');
  const [loanDate, setLoanDate] = useState(() => getLocalTodayString());
  const [loanNotes, setLoanNotes] = useState('');

  // Loan Devolução Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returningLoan, setReturningLoan] = useState<ProductLoan | null>(null);
  const [returnDate, setReturnDate] = useState(() => getLocalTodayString());
  const [returnNotes, setReturnNotes] = useState('');

  // Loan Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportFilterStatus, setReportFilterStatus] = useState<'all' | 'pending' | 'resolved'>('all');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportSearch, setReportSearch] = useState('');

  const openReportModal = (status: 'all' | 'pending' | 'resolved') => {
    setReportFilterStatus(status);
    setReportStartDate('');
    setReportEndDate('');
    setReportSearch('');
    setIsReportModalOpen(true);
  };

  const resetLoanForm = () => {
    setIsAddingLoan(false);
    setIsEditingLoan(false);
    setEditingLoanId(null);
    setOriginClientId('');
    setDestClientId('');
    setLoanOriginSearch('');
    setLoanDestSearch('');
    setLoanProductName('');
    setLoanQuantity('');
    setLoanDate(getLocalTodayString());
    setLoanNotes('');
  };

  const handleOpenEditLoan = (loan: ProductLoan) => {
    setEditingLoanId(loan.id);
    setOriginClientId(loan.originClientId);
    setDestClientId(loan.destClientId);
    setLoanProductName(loan.productName);
    setLoanQuantity(loan.quantity);
    setLoanDate(loan.date);
    setLoanNotes(loan.notes || '');
    setIsEditingLoan(true);
  };

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!originClientId || !destClientId || !loanProductName || !loanQuantity) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (originClientId === destClientId) {
      alert('O cliente de origem não pode ser o mesmo do de destino.');
      return;
    }

    const originClient = clients.find(c => c.id === originClientId);
    const destClient = clients.find(c => c.id === destClientId);

    if (!originClient || !destClient) return;

    if (isEditingLoan && editingLoanId) {
      const existing = loans.find(l => l.id === editingLoanId);
      if (!existing) return;
      onUpdateLoan({
        ...existing,
        originClientId,
        originClientName: originClient.name,
        destClientId,
        destClientName: destClient.name,
        productName: loanProductName,
        quantity: loanQuantity,
        date: loanDate,
        notes: loanNotes,
      });
    } else {
      onAddLoan({
        id: `loan_${Date.now()}`,
        originClientId,
        originClientName: originClient.name,
        destClientId,
        destClientName: destClient.name,
        productName: loanProductName,
        quantity: loanQuantity,
        date: loanDate,
        status: 'pending',
        notes: loanNotes,
        createdAt: new Date().toISOString()
      });
    }
    resetLoanForm();
  };

  const handleOpenReturnModal = (loan: ProductLoan) => {
    setReturningLoan(loan);
    setReturnDate(getLocalTodayString());
    setReturnNotes('');
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningLoan) return;

    onUpdateLoan({
      ...returningLoan,
      status: 'resolved',
      returnDate,
      returnNotes
    });

    setIsReturnModalOpen(false);
    setReturningLoan(null);
  };

  const handleReopenLoan = (loan: ProductLoan) => {
    if (confirm('Deseja reabrir este empréstimo como pendente?')) {
      onUpdateLoan({
        ...loan,
        status: 'pending',
        returnDate: undefined,
        returnNotes: undefined
      });
    }
  };

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
  const [displayNameType, setDisplayNameType] = useState<'name' | 'legalName'>('name');
  const [externalCode, setExternalCode] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Vitória');
  const [frequency, setFrequency] = useState<RouteFrequency>('weekly');
  const [weekday, setWeekday] = useState<WeekDay | ''>('monday');
  const [weekOffset, setWeekOffset] = useState<0 | 1>(0);
  const [monthWeek, setMonthWeek] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Split address sub-fields
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [state, setState] = useState('ES');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepError, setCepError] = useState('');

  const parseAddress = (fullAddress: string) => {
    let parsedCep = '';
    let parsedStreet = '';
    let parsedNumber = '';
    let parsedNeighborhood = '';
    let parsedCity = '';
    let parsedState = 'ES';

    // 1. Try to extract CEP
    const cepMatch = fullAddress.match(/(\d{5}-\d{3})|(\d{8})/);
    if (cepMatch) {
      parsedCep = cepMatch[0];
    }

    // Remove CEP and trailing whitespace/commas
    let remaining = fullAddress.replace(/,?\s*(?:\d{5}-\d{3}|\d{8})\s*$/, '').trim();

    // 2. Try to parse "Street, Number - Neighborhood, City - State" or similar
    const partsByHyphen = remaining.split(' - ');
    if (partsByHyphen.length >= 3) {
      parsedState = partsByHyphen[partsByHyphen.length - 1].trim();
      
      // If we have 4 parts, it is likely "Street, Number - Neighborhood - City - State"
      if (partsByHyphen.length === 4) {
        parsedCity = partsByHyphen[2].trim();
        parsedNeighborhood = partsByHyphen[1].trim();
      } else {
        parsedCity = partsByHyphen[partsByHyphen.length - 2].trim();
      }
      
      const streetAndNum = partsByHyphen[0].trim();
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

      // Check if there is neighborhood inside (e.g. "RUA COLATINA - Nº393, BELA AURORA, CARIACICA")
      const commaParts = remaining.split(',');
      if (commaParts.length >= 3) {
        // e.g. ["RUA COLATINA - Nº393", " BELA AURORA", " CARIACICA"]
        parsedCity = commaParts[commaParts.length - 1].trim();
        parsedNeighborhood = commaParts[commaParts.length - 2].trim();
        const streetAndNum = commaParts.slice(0, commaParts.length - 2).join(',').trim();
        
        const numMatch = streetAndNum.match(/(?:Nº|Nº\s*|,\s*)(\d+)/i);
        if (numMatch) {
          parsedNumber = numMatch[1];
          parsedStreet = streetAndNum.replace(/(?:,\s*Nº\s*\d+|-\s*Nº\s*\d+|Nº\s*\d+|\s+\d+)$/i, '').trim();
        } else {
          parsedStreet = streetAndNum;
        }
      } else if (commaParts.length === 2) {
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
      neighborhood: parsedNeighborhood,
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
            setNeighborhood(data.bairro || '');
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
      (c.legalName && c.legalName.toLowerCase().includes(search.toLowerCase())) ||
      c.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase()) ||
      (c.externalCode && c.externalCode.toLowerCase().includes(search.toLowerCase()));
    
    const matchesFilter = filterWeekday === 'all' || c.weekday === filterWeekday;
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => getClientDisplayName(a).localeCompare(getClientDisplayName(b), 'pt-BR'));

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
    setDisplayNameType('name');
    setExternalCode('');
    setBuyerName('');
    setPhone('');
    setAddress('');
    setCity('Vitória');
    setCep('');
    setStreet('');
    setNumber('');
    setNeighborhood('');
    setState('ES');
    setCepError('');
    setIsLoadingCep(false);
    setFrequency('weekly');
    setWeekday('monday');
    setWeekOffset(0);
    setMonthWeek(1);
    setIsAdding(false);
    setIsEditing(false);
  };

  const handleOpenEdit = (client: Client) => {
    setName(client.name);
    setLegalName(client.legalName || '');
    setDisplayNameType(client.displayNameType || 'name');
    setExternalCode(client.externalCode || '');
    setBuyerName(client.buyerName);
    setPhone(client.phone);
    setAddress(client.address);
    setCity(client.city || 'Vitória');

    // Parse existing address
    const parsed = parseAddress(client.address);
    setCep(parsed.cep);
    setStreet(parsed.street);
    setNumber(parsed.number);
    setNeighborhood(parsed.neighborhood);
    setCity(client.city || parsed.city || 'Vitória');
    setState(parsed.state || 'ES');
    setCepError('');

    setFrequency(client.frequency);
    setWeekday(client.weekday || '');
    setWeekOffset(client.weekOffset || 0);
    setMonthWeek(client.monthWeek || 1);
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
    const neighborhoodSegment = neighborhood.trim();
    const citySegment = city.trim() || 'Vitória';
    const stateSegment = state.trim() || 'ES';
    
    const compiledAddress = `${streetSegment}, ${numberSegment}${neighborhoodSegment ? ` - ${neighborhoodSegment}` : ''} - ${citySegment} - ${stateSegment}${cep ? `, ${cep.trim()}` : ''}`;

    const clientData = {
      name: name.trim(),
      legalName: legalName.trim() || undefined,
      displayNameType,
      externalCode: externalCode.trim() || undefined,
      buyerName: buyerName.trim() || 'Não Informado',
      phone: phone.trim() || 'Não Informado',
      address: compiledAddress,
      city: citySegment,
      frequency,
      weekday: frequency === 'adhoc' ? undefined : (weekday as WeekDay),
      weekOffset: frequency === 'biweekly' ? weekOffset : 0,
      monthWeek: frequency === 'monthly' ? monthWeek : undefined,
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
        monthWeek: clientData.monthWeek as any,
      });
      // Update local selection context
      setSelectedClient({
        ...selectedClient,
        ...clientData,
        weekday: clientData.weekday,
        weekOffset: clientData.weekOffset as any,
        monthWeek: clientData.monthWeek as any,
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
                  {(selectedClient.legalName || selectedClient.externalCode) && (
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      {selectedClient.legalName || ''}
                      {selectedClient.legalName && selectedClient.externalCode ? ' - ' : ''}
                      {selectedClient.externalCode ? `Cód. Externo: ${selectedClient.externalCode}` : ''}
                    </p>
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
                        Semana: {selectedClient.weekOffset === 0 ? 'A' : 'B'}
                      </span>
                    )}
                    {selectedClient.frequency === 'monthly' && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-amber-100">
                        Semana: {selectedClient.monthWeek || 1}ª do mês
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

              {/* Razão Social e Código Externo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Código Externo (Opcional)</label>
                  <input
                    id="form_client_external_code"
                    type="text"
                    value={externalCode}
                    onChange={(e) => setExternalCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    placeholder="Ex: COD123"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-shadow bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Nome a Exibir nos Cards */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Nome a ser exibido nos Cards</label>
                <select
                  id="form_client_display_name_type"
                  value={displayNameType}
                  onChange={(e) => setDisplayNameType(e.target.value as 'name' | 'legalName')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-shadow bg-slate-50/50"
                >
                  <option value="name">Nome Fantasia ({name || 'Não preenchido'})</option>
                  <option value="legalName">Razão Social ({legalName || 'Não preenchida'})</option>
                </select>
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

              {/* Bairro Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Bairro</label>
                <input
                  id="form_client_neighborhood"
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ex: Jardim da Penha"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-shadow bg-slate-50/50"
                />
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
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quinzenal</option>
                  <option value="monthly">Mensal</option>
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
                        <option value={0}>Semana A</option>
                        <option value={1}>Semana B</option>
                      </select>
                    </div>
                  )}

                  {/* Month Week (For monthly) */}
                  {frequency === 'monthly' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">Semana Preferencial</label>
                      <select
                        id="form_client_month_week"
                        value={monthWeek}
                        onChange={(e) => setMonthWeek(Number(e.target.value) as any)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-shadow bg-white"
                      >
                        <option value={1}>Primeira semana do mês</option>
                        <option value={2}>Segunda semana do mês</option>
                        <option value={3}>Terceira semana do mês</option>
                        <option value={4}>Quarta semana do mês</option>
                        <option value={5}>Quinta semana do mês</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Real-time Matching Route Alert Box */}
              {frequency !== 'adhoc' && (
                (() => {
                  const matching = clients.filter(c => {
                    if (selectedClient && isEditing && c.id === selectedClient.id) return false;
                    if (c.frequency !== frequency) return false;
                    if (c.weekday !== weekday) return false;
                    if (frequency === 'biweekly') return c.weekOffset === weekOffset;
                    if (frequency === 'monthly') return (c.monthWeek || 1) === monthWeek;
                    return true;
                  });

                  const configLabel = frequency === 'weekly' 
                    ? `Semanal (${WEEKDAYS_PT[weekday as WeekDay]})`
                    : frequency === 'biweekly' 
                      ? `Quinzenal (${WEEKDAYS_PT[weekday as WeekDay]} - Semana ${weekOffset === 0 ? 'A' : 'B'})`
                      : `Mensal (${WEEKDAYS_PT[weekday as WeekDay]} - ${MONTH_WEEKS_PT[monthWeek]})`;

                  return (
                    <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl flex gap-3 text-slate-800">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <p className="text-xs font-extrabold text-amber-900 leading-snug">
                          Configuração da Rota Atual: <span className="underline decoration-amber-500/50">{configLabel}</span>
                        </p>
                        <p className="text-xs text-amber-800/90 font-semibold leading-relaxed">
                          Há {matching.length} {matching.length === 1 ? 'outro cliente cadastrado' : 'outros clientes cadastrados'} com este mesmo padrão de rota (excluindo este que está sendo editado).
                        </p>
                        
                        {matching.length > 0 && (
                          <div className="bg-amber-100/30 rounded-xl p-3 mt-2 border border-amber-200/20">
                            <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider mb-2">Clientes nessa rota:</p>
                            <div className="max-h-24 overflow-y-auto pr-1 flex flex-wrap gap-1.5 scrollbar-thin scrollbar-thumb-amber-200">
                              {matching.map(c => (
                                <span 
                                  key={c.id} 
                                  className="inline-flex items-center bg-amber-100/60 border border-amber-200/80 text-amber-900 text-[10px] px-2.5 py-1 rounded-lg font-bold"
                                >
                                  {c.name} {c.city ? `(${c.city})` : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
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
      <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full px-3 sm:px-4 pt-2 pb-20">
        
        {/* Navigation Tabs */}
        <div className="flex bg-white p-0.5 rounded-xl mb-2 border border-slate-200 shadow-sm shrink-0">
          <button
            onClick={() => handleSubTabChange('carteira')}
            className={`flex-1 flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-lg font-bold text-sm transition-all cursor-pointer ${
              activeSubTab === 'carteira'
                ? 'bg-slate-100 text-slate-850'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="sm:hidden">Clientes</span>
            <span className="hidden sm:inline">Carteira de Clientes</span>
          </button>
          <button
            onClick={() => handleSubTabChange('emprestimos')}
            className={`flex-1 flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-lg font-bold text-sm transition-all cursor-pointer ${
              activeSubTab === 'emprestimos'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span className="sm:hidden">Empréstimos</span>
            <span className="hidden sm:inline">Empréstimo de Ração</span>
          </button>
        </div>

        {activeSubTab === 'carteira' ? (
          <>
            {/* Title Block */}
            <div className="flex items-center justify-between mb-2">
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
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Cliente</span>
              </button>
            </div>

            {/* Search and Filters bar */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
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
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
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
                          <h3 className="font-bold text-slate-800 text-base leading-tight group-hover:text-blue-600 transition-colors flex items-center gap-1.5 flex-wrap">
                            {client.externalCode && (
                              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-normal">
                                #{client.externalCode}
                              </span>
                            )}
                            <span>{getClientDisplayName(client)}</span>
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

                        {/* LAST NEGOTIATION PREVIEW */}
                        <div className="bg-slate-50 border-l-2 border-blue-500 p-2 rounded-r-md mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                          <div className="text-slate-600 truncate max-w-lg">
                            <span className="font-bold text-slate-700">Última Negociação: </span>
                            {lastNeg ? `"${lastNeg.notes}"` : 'Nenhuma registrada'}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
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
          </>
        ) : (
          <>
            {/* Title Block Empréstimos */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-lg font-bold text-slate-900">Empréstimos de Ração</h1>
                <p className="hidden sm:block text-[11px] text-slate-400 font-medium">Controle os produtos ou rações emprestados entre clientes.</p>
              </div>
              <button
                onClick={() => {
                  resetLoanForm();
                  setIsAddingLoan(true);
                }}
                className="flex items-center gap-1.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="sm:hidden">Novo</span>
                <span className="hidden sm:inline">Novo Empréstimo</span>
              </button>
            </div>

  <div className="grid grid-cols-3 gap-2 mb-2 shrink-0">
    <button 
      onClick={() => openReportModal('all')}
      className="bg-white hover:bg-slate-50 min-h-[52px] p-2 rounded-xl border border-slate-200 shadow-sm text-center transition-all cursor-pointer group"
    >
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block group-hover:text-blue-600">Total</span>
      <span className="text-base font-extrabold text-slate-800 group-hover:text-blue-600">{loans.length}</span>
    </button>
    <button 
      onClick={() => openReportModal('pending')}
      className="bg-amber-50/50 hover:bg-amber-100/60 min-h-[52px] p-2 rounded-xl border border-amber-200/60 shadow-sm text-center transition-all cursor-pointer group"
    >
      <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider block">Pendentes</span>
      <span className="text-base font-extrabold text-amber-700">{loans.filter(l => l.status === 'pending').length}</span>
    </button>
    <button 
      onClick={() => openReportModal('resolved')}
      className="bg-emerald-50/50 hover:bg-emerald-100/60 min-h-[52px] p-2 rounded-xl border border-emerald-200/60 shadow-sm text-center transition-all cursor-pointer group"
    >
      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Devolvidos</span>
      <span className="text-base font-extrabold text-emerald-700">{loans.filter(l => l.status === 'resolved').length}</span>
    </button>
  </div>

            {/* Search and Filters bar */}
            <div className="flex flex-row items-center gap-2 mb-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={loanSearch}
                  onChange={(e) => setLoanSearch(e.target.value)}
                  placeholder="Buscar por produto, cliente..."
                  className="w-full min-h-[44px] pl-9 pr-2 sm:pr-4 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
                <select
                  value={loanFilterStatus}
                  onChange={(e) => setLoanFilterStatus(e.target.value as any)}
                  className="w-[8.5rem] sm:w-auto min-h-[44px] px-2 sm:px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700 font-bold"
                >
                  <option value="all">Filtro: Todos</option>
                  <option value="pending">Pendentes</option>
                  <option value="resolved">Devolvidos</option>
                </select>
              </div>
            </div>

            {/* Product Loans Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {(() => {
                const filteredLoans = loans.filter(l => {
                  const term = loanSearch.toLowerCase();
                  const matchesSearch = 
                    l.productName.toLowerCase().includes(term) ||
                    l.originClientName.toLowerCase().includes(term) ||
                    l.destClientName.toLowerCase().includes(term) ||
                    (l.notes && l.notes.toLowerCase().includes(term));
                  
                  if (loanFilterStatus === 'all') return matchesSearch;
                  return matchesSearch && l.status === loanFilterStatus;
                });

                return filteredLoans.length > 0 ? (
                  filteredLoans.map((loan) => (
                    <div
                      key={loan.id}
                      className={`bg-white border rounded-xl p-2.5 shadow-sm transition-all flex flex-col gap-1.5 ${
                        loan.status === 'resolved' ? 'border-slate-100 opacity-90' : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {/* Header: Date and Status */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-bold">
                          Acerto: {formatDate(loan.date)}
                        </span>

                        {/* Status Badge */}
                        {loan.status === 'pending' ? (
                          <span className="inline-flex min-h-[30px] items-center gap-1 px-2 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>Pendente</span>
                          </span>
                        ) : (
                          <span className="inline-flex min-h-[30px] items-center gap-1 px-2 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 shrink-0" />
                            <span>Devolvido</span>
                          </span>
                        )}
                      </div>

                      {/* Flow details (Origin -> Destination) */}
                      <div className="bg-slate-50 border border-slate-200/50 rounded-lg p-2 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-left">Origem</span>
                          <strong className="text-xs text-slate-700 truncate block text-left" title={loan.originClientName}>{loan.originClientName}</strong>
                        </div>
                        <ArrowRightLeft className="w-3.5 h-3.5 text-slate-300 shrink-0 mx-1" aria-hidden="true" />
                        <div className="flex-1 min-w-0 text-right">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-right">Destino</span>
                          <strong className="text-xs text-slate-700 truncate block text-right" title={loan.destClientName}>{loan.destClientName}</strong>
                        </div>
                      </div>

                      {/* Product and quantity */}
                      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-1.5">
                        <h3 className="font-extrabold text-slate-800 text-sm leading-tight truncate" title={loan.productName}>
                          {loan.productName}
                        </h3>
                        <span className="inline-flex items-center min-h-[30px] px-2 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                          Qtd: {loan.quantity}
                        </span>
                      </div>

                      {/* Observations / Devolução info */}
                      {loan.notes && (
                          <p className="text-[11px] text-slate-500 leading-relaxed italic bg-slate-50/50 p-1.5 rounded-lg border border-dashed border-slate-200">
                          <strong>Obs:</strong> {loan.notes}
                        </p>
                      )}

                      {loan.status === 'resolved' && (
                        <div className="bg-emerald-50 border-l-2 border-emerald-500 p-1.5 rounded-r-lg space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Devolvido em</span>
                            <span className="text-[10px] text-emerald-700 font-mono font-bold">
                              {loan.returnDate ? formatDate(loan.returnDate) : ''}
                            </span>
                          </div>
                          {loan.returnNotes && (
                            <p className="text-xs text-emerald-700 italic">
                              <strong>Notas de retorno:</strong> {loan.returnNotes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-0.5">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditLoan(loan)}
                            className="text-xs font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 min-h-[44px] px-2.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Deseja excluir permanentemente este registro de empréstimo?')) {
                                onDeleteLoan(loan.id);
                              }
                            }}
                            className="text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 min-h-[44px] px-2.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Excluir
                          </button>
                        </div>

                        {loan.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReturnModal(loan)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold min-h-[44px] px-3 rounded-lg shadow-sm transition-colors cursor-pointer"
                          >
                            Marcar Devolvido
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReopenLoan(loan)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 min-h-[44px] px-3 rounded-lg transition-colors cursor-pointer"
                          >
                            Reabrir Empréstimo
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 space-y-2">
                    <ArrowRightLeft className="w-12 h-12 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">Nenhum empréstimo registrado.</p>
                    <p className="text-xs">Clique em "Novo Empréstimo" para registrar a primeira transação.</p>
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>

      {/* Loan Form Modal */}
      {(isAddingLoan || isEditingLoan) && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-y-auto pt-[env(safe-area-inset-top)]">
          <div className="sticky top-0 bg-white border-b border-slate-100 px-3 sm:px-4 py-3 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-slate-900">
              {isEditingLoan ? 'Editar Registro de Empréstimo' : 'Novo Registro de Empréstimo'}
            </h2>
            <button
              type="button"
              onClick={resetLoanForm}
              className="text-slate-500 hover:text-slate-800 font-semibold text-sm min-h-[44px] px-3 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleLoanSubmit} className="max-w-2xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dados do Empréstimo</h3>

              {/* Clients: origin and destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="loan_origin_search" className="text-[11px] font-bold text-slate-600 block">Cliente de origem *</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    id="loan_origin_search"
                    type="text"
                    aria-label="Buscar cliente de origem"
                    autoComplete="off"
                    placeholder="Buscar cliente..."
                    value={loanOriginSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLoanOriginSearch(val);
                      const filtered = clients.filter(c => {
                        return c.name.toLowerCase().includes(val.toLowerCase()) ||
                          (c.legalName && c.legalName.toLowerCase().includes(val.toLowerCase()));
                      });
                      if (filtered.length === 1) setOriginClientId(filtered[0].id);
                    }}
                    className="w-full min-h-[44px] pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <select
                  id="loan_origin_client"
                  aria-label="Cliente de origem"
                  autoComplete="off"
                  value={originClientId}
                  onChange={(e) => setOriginClientId(e.target.value)}
                  className="w-full min-h-[44px] px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  <option value="">Selecione o cliente de origem...</option>
                  {clients
                    .filter(c => {
                      return c.name.toLowerCase().includes(loanOriginSearch.toLowerCase()) ||
                        (c.legalName && c.legalName.toLowerCase().includes(loanOriginSearch.toLowerCase()));
                    })
                    .sort((a, b) => {
                      return getClientDisplayName(a).localeCompare(getClientDisplayName(b), 'pt-BR');
                    })
                    .map(c => {
                      return <option key={c.id} value={c.id}>{getClientDisplayName(c)}</option>;
                    })}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="loan_dest_search" className="text-[11px] font-bold text-slate-600 block">Cliente de destino *</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    id="loan_dest_search"
                    type="text"
                    aria-label="Buscar cliente de destino"
                    autoComplete="off"
                    placeholder="Buscar cliente..."
                    value={loanDestSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLoanDestSearch(val);
                      const filtered = clients.filter(c => {
                        return c.name.toLowerCase().includes(val.toLowerCase()) ||
                          (c.legalName && c.legalName.toLowerCase().includes(val.toLowerCase()));
                      });
                      if (filtered.length === 1) setDestClientId(filtered[0].id);
                    }}
                    className="w-full min-h-[44px] pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <select
                  id="loan_dest_client"
                  aria-label="Cliente de destino"
                  autoComplete="off"
                  value={destClientId}
                  onChange={(e) => setDestClientId(e.target.value)}
                  className="w-full min-h-[44px] px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  <option value="">Selecione o cliente de destino...</option>
                  {clients
                    .filter(c => {
                      return c.name.toLowerCase().includes(loanDestSearch.toLowerCase()) ||
                        (c.legalName && c.legalName.toLowerCase().includes(loanDestSearch.toLowerCase()));
                    })
                    .sort((a, b) => {
                      return getClientDisplayName(a).localeCompare(getClientDisplayName(b), 'pt-BR');
                    })
                    .map(c => {
                      return <option key={c.id} value={c.id}>{getClientDisplayName(c)}</option>;
                    })}
                </select>
              </div>
              </div>

              {/* Product and quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_12rem] gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="loan_product_name" className="text-[11px] font-bold text-slate-600 block">Produto emprestado *</label>
                  <input
                    id="loan_product_name"
                    type="text"
                    aria-label="Produto emprestado"
                    autoComplete="off"
                    value={loanProductName}
                    onChange={(e) => setLoanProductName(e.target.value)}
                    placeholder="Ex.: ração Golden 15 kg"
                    className="w-full min-h-[44px] px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="loan_quantity" className="text-[11px] font-bold text-slate-600 block">Quantidade *</label>
                  <input
                    id="loan_quantity"
                    type="text"
                    aria-label="Quantidade do produto"
                    autoComplete="off"
                    value={loanQuantity}
                    onChange={(e) => setLoanQuantity(e.target.value)}
                    placeholder="Ex.: 3 sacos"
                    className="w-full min-h-[44px] px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>

              {/* Date Input */}
              <div className="space-y-1.5">
                <label htmlFor="loan_date" className="text-[11px] font-bold text-slate-600 block">Data do acerto</label>
                <input
                  id="loan_date"
                  type="date"
                  inputMode="numeric"
                  aria-label="Data do acerto"
                  autoComplete="off"
                  value={loanDate}
                  onChange={(e) => setLoanDate(e.target.value)}
                  className="w-full min-h-[44px] px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                  required
                />
              </div>

              {/* Notes Input */}
              <div className="space-y-1.5">
                <label htmlFor="loan_notes" className="text-[11px] font-bold text-slate-600 block">Observação</label>
                <textarea
                  id="loan_notes"
                  aria-label="Observação do empréstimo"
                  autoComplete="off"
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  placeholder="Notas adicionais sobre o empréstimo..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isEditingLoan ? 'Salvar Alterações' : 'Confirmar e Registrar Empréstimo'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Return Confirmation Modal */}
      {isReturnModalOpen && returningLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Registrar Devolução</h3>
            <p className="text-sm text-slate-500">
              Confirme que o produto <strong>{returningLoan.productName} ({returningLoan.quantity})</strong> foi devolvido ou acertado.
            </p>
            <form onSubmit={handleConfirmReturn} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Data da Devolução</label>
                <input
                  type="date"
                  inputMode="numeric"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Observações Extras de Devolução</label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Ex: Devolvido com saco fechado de lote idêntico..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setIsReturnModalOpen(false); setReturningLoan(null); }}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer"
                >
                  Confirmar Devolução
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOAN REPORT OVERLAY MODAL */}
      {isReportModalOpen && (
        <div id="loan_report_modal_backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6 backdrop-blur-xs">
          <div className="printable-loan-report bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="loan-report-header bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 no-print">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">Relatório de Empréstimos de Ração</h2>
                  <p className="text-xs text-slate-400">Consolidado e movimentações por período</p>
                </div>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="print-only-report-meta">
              <span>Empréstimos de ração</span>
              <span>Gerado em {formatDate(new Date().toISOString().slice(0, 10))}</span>
            </div>

            {/* Filter Bar inside Modal */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3 shrink-0 no-print">
              {/* Row 1: Status pills & Search */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* Status Selector */}
                <div className="flex bg-slate-200/70 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setReportFilterStatus('all')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      reportFilterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todos ({loans.length})
                  </button>
                  <button
                    onClick={() => setReportFilterStatus('pending')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      reportFilterStatus === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pendentes ({loans.filter(l => l.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setReportFilterStatus('resolved')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      reportFilterStatus === 'resolved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Devolvidos ({loans.filter(l => l.status === 'resolved').length})
                  </button>
                </div>

                {/* Text Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder="Filtrar por produto ou nome do cliente..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>
              </div>

              {/* Row 2: Date Range Filter (Data Início e Data Fim) */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 text-xs">
                <span className="font-bold text-slate-600 flex items-center gap-1 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Período:
                </span>

                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-slate-500 font-medium">De:</label>
                  <input
                    type="date"
                    inputMode="numeric"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-slate-500 font-medium">Até:</label>
                  <input
                    type="date"
                    inputMode="numeric"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                {(reportStartDate || reportEndDate || reportSearch) && (
                  <button
                    onClick={() => {
                      setReportStartDate('');
                      setReportEndDate('');
                      setReportSearch('');
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline ml-auto cursor-pointer"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body: Report Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {(() => {
                const reportLoans = loans.filter(l => {
                  const term = reportSearch.toLowerCase();
                  const matchesSearch = 
                    l.productName.toLowerCase().includes(term) ||
                    l.originClientName.toLowerCase().includes(term) ||
                    l.destClientName.toLowerCase().includes(term) ||
                    (l.notes && l.notes.toLowerCase().includes(term));

                  const matchesStatus = reportFilterStatus === 'all' || l.status === reportFilterStatus;

                  const matchesStart = !reportStartDate || l.date >= reportStartDate;
                  const matchesEnd = !reportEndDate || l.date <= reportEndDate;

                  return matchesSearch && matchesStatus && matchesStart && matchesEnd;
                }).sort((a, b) => b.date.localeCompare(a.date));

                return (
                  <>

                    {/* Detailed List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Movimentações Detalhadas ({reportLoans.length})
                        </h3>
                        {(reportStartDate || reportEndDate) && (
                          <span className="text-xs font-medium text-slate-500">
                            Exibindo período de <strong className="text-slate-800">{reportStartDate ? formatDate(reportStartDate) : 'Início'}</strong> até <strong className="text-slate-800">{reportEndDate ? formatDate(reportEndDate) : 'Hoje'}</strong>
                          </span>
                        )}
                      </div>

                      {reportLoans.length > 0 ? (
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                                <tr>
                                  <th className="py-3 px-4">Data Acerto</th>
                                  <th className="py-3 px-4">Produto / Ração</th>
                                  <th className="py-3 px-4">Qtd</th>
                                  <th className="py-3 px-4">Origem (Emprestador)</th>
                                  <th className="py-3 px-4">Destino (Recebedor)</th>
                                  <th className="py-3 px-4">Status</th>
                                  <th className="py-3 px-4">Obs</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/70 bg-white">
                                {reportLoans.map((l) => (
                                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="py-3 px-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                                      {formatDate(l.date)}
                                    </td>
                                    <td className="py-3 px-4 font-bold text-slate-800">
                                      {l.productName}
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="px-2 py-0.5 bg-slate-100 rounded-md font-bold text-slate-700">
                                        {l.quantity}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 font-semibold text-slate-700">
                                      {l.originClientName}
                                    </td>
                                    <td className="py-3 px-4 font-semibold text-slate-700">
                                      {l.destClientName}
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                      {l.status === 'pending' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                          <Clock className="w-3 h-3" />
                                          Pendente
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          <CheckCircle className="w-3 h-3" />
                                          Devolvido
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                                      {l.notes || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-1">
                          <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                          <p className="font-semibold text-slate-600 text-xs">Nenhuma movimentação de empréstimo encontrada.</p>
                          <p className="text-[11px]">Tente ajustar os filtros de busca, datas ou status.</p>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-end shrink-0 no-print">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
              >
                Fechar Relatório
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
