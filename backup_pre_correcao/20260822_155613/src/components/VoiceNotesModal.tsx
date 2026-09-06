/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Search, Trash2, Edit2, Link2, Check, Sparkles, Volume2, Calendar } from 'lucide-react';
import { Client, VoiceNote, NegotiationHistory } from '../types';
import { getClientDisplayName } from '../utils';

interface VoiceNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  notes: VoiceNote[];
  onAddNote: (text: string, clientId?: string, clientName?: string) => void;
  onUpdateNote: (noteId: string, text: string) => void;
  onDeleteNote: (noteId: string) => void;
  onLinkNoteToClient: (noteId: string, clientId: string, clientName: string) => void;
}

export default function VoiceNotesModal({
  isOpen,
  onClose,
  clients,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onLinkNoteToClient,
}: VoiceNotesModalProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [noteText, setNoteText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [linkingNoteId, setLinkingNoteId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [noteClientSearch, setNoteClientSearch] = useState('');

  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setNoteText(prev => {
            const trimmed = prev.trim();
            const space = trimmed ? ' ' : '';
            const newText = trimmed + space + finalTranscript;

            // Voice Command Check: "salvar"
            if (newText.toLowerCase().includes('salvar')) {
              // Strip "salvar"
              const cleanText = newText.replace(/salvar/gi, '').trim();
              setTimeout(() => {
                handleSaveVoiceCommand(cleanText);
              }, 100);
              return cleanText;
            }

            return newText;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const handleSaveVoiceCommand = (textToSave: string) => {
    const finalVal = textToSave || noteText;
    if (!finalVal.trim()) return;

    onAddNote(finalVal.trim());
    setNoteText('');
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    alert('Anotação SALVA com sucesso via comando de voz!');
    setActiveTab('history');
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('O reconhecimento de voz não é suportado pelo seu navegador atual ou está bloqueado nas configurações de privacidade. Por favor, digite sua anotação no campo abaixo!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleManualSave = () => {
    if (!noteText.trim()) return;
    onAddNote(noteText.trim());
    setNoteText('');
    alert('Anotação salva!');
    setActiveTab('history');
  };

  const handleSimulateVoice = () => {
    const phrases = [
      "Visita no Pet shop Bicho Mania Cariacica, comprador interessado em 15 sacos de ração premium.",
      "Cliente Petz Cariacica solicitou reagendar para quinta-feira porque o comprador estará viajando.",
      "Cobasi Campo Grande efetuou a compra de 8 caixas de petiscos sabor carne. Entrega na próxima segunda.",
      "Pantanal Pet Campo Grande sem estoque de ração de gatos, mas sem verba para comprar esta semana. Retornar na semana que vem.",
      "Visita concluída com sucesso no Amigo Bicho Bela Aurora, sem pedidos novos hoje, estoque cheio."
    ];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    setNoteText(randomPhrase);
  };

  const handleSaveEdit = (noteId: string) => {
    if (!editingText.trim()) return;
    onUpdateNote(noteId, editingText.trim());
    setEditingNoteId(null);
  };

  const handleConfirmLink = () => {
    if (!linkingNoteId || !selectedClientId) return;
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;

    onLinkNoteToClient(linkingNoteId, client.id, getClientDisplayName(client));
    setLinkingNoteId(null);
    setSelectedClientId('');
    setNoteClientSearch('');
    alert(`Nota vinculada com sucesso ao histórico do cliente ${getClientDisplayName(client)}!`);
  };

  if (!isOpen) return null;

  const filteredNotes = notes.filter(n => 
    n.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.clientName && n.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[85vh] relative animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">Assistente de Notas</h3>
              <p className="text-xs text-slate-400 font-medium">Fale ou digite anotações e envie para o histórico do cliente</p>
            </div>
          </div>
          <button
            id="close_voice_notes_modal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5.5 h-5.5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 shrink-0 mt-2">
          <button
            id="tab_note_new"
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'new'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Mic className="w-4 h-4" />
            Nova Anotação
          </button>
          <button
            id="tab_note_history"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Histórico ({notes.length})
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto py-4 min-h-[300px]">
          {activeTab === 'new' ? (
            <div className="space-y-4 flex flex-col h-full justify-between">
              
              <div className="space-y-3">
                {/* Simulated Waveform or Active Banner */}
                <div className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center ${
                  isListening 
                    ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  {isListening ? (
                    <>
                      <div className="flex items-center gap-1 mb-2">
                        <span className="w-1.5 h-4 bg-rose-500 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-6 bg-rose-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-3 bg-rose-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        <span className="w-1.5 h-5 bg-rose-500 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                        <span className="w-1.5 h-2 bg-rose-500 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                      </div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-rose-600">GRAVANDO VIA VOZ...</p>
                      <p className="text-[11px] font-medium text-rose-500/80 mt-1 max-w-[280px]">
                        Fale sua anotação. Diga a palavra <strong className="font-bold text-rose-700">"SALVAR"</strong> no final para salvar automaticamente!
                      </p>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-6 h-6 text-slate-400 mb-1" />
                      <p className="text-xs font-bold text-slate-700">Comando de Voz Inteligente</p>
                      <p className="text-[10px] text-slate-400 font-medium max-w-[280px] mt-0.5">
                        Fale livremente. Ao dizer <strong className="font-bold text-slate-600">"Salvar"</strong>, o assistente grava na hora!
                      </p>
                    </>
                  )}
                </div>

                {/* Voice button / Mic controller */}
                <div className="flex items-center justify-center gap-3 py-1">
                  <button
                    id="btn_toggle_mic"
                    type="button"
                    onClick={toggleListening}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 ${
                      isListening
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-300'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-300'
                    }`}
                  >
                    {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                </div>

                {/* Note Editor Area */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Texto da Anotação</label>
                  <textarea
                    id="voice_note_editor"
                    rows={5}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Sua fala aparecerá aqui, ou digite livremente..."
                    className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Save Trigger */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  id="btn_clear_new_note"
                  type="button"
                  onClick={() => setNoteText('')}
                  className="px-4 py-2.5 text-xs text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Limpar
                </button>
                <button
                  id="btn_save_new_note"
                  type="button"
                  onClick={handleManualSave}
                  disabled={!noteText.trim()}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salvar Nota
                </button>
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              {/* Search note bar */}
              <div className="relative shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="note_search_input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar notas ou clientes..."
                  className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/50"
                />
              </div>

              {/* Note ledger list */}
              {filteredNotes.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-slate-400 text-xs font-semibold">Nenhuma anotação encontrada.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Fale uma nova nota na aba "Nova Anotação"!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                  {filteredNotes.map((note) => {
                    const isEditing = editingNoteId === note.id;
                    const isLinking = linkingNoteId === note.id;

                    return (
                      <div
                        id={`note_card_${note.id}`}
                        key={note.id}
                        className="p-3.5 border border-slate-200/80 rounded-xl bg-slate-50/40 hover:bg-slate-50/80 transition-all space-y-2 relative"
                      >
                        {/* Note text or Edit Input */}
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              id={`edit_note_text_${note.id}`}
                              rows={3}
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full text-xs p-2 border border-blue-400 rounded-lg focus:outline-none bg-white text-slate-800 font-medium"
                            />
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                id={`cancel_edit_note_${note.id}`}
                                onClick={() => setEditingNoteId(null)}
                                className="px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded"
                              >
                                Cancelar
                              </button>
                              <button
                                id={`save_edit_note_${note.id}`}
                                onClick={() => handleSaveEdit(note.id)}
                                className="px-3 py-1 text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-700 rounded"
                              >
                                Salvar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{note.text}</p>
                        )}

                        {/* Timestamp & metadata */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100/60 font-medium">
                          <span>
                            {new Date(note.createdAt).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          
                          {note.clientName && (
                            <span className="bg-blue-50 text-blue-600 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider text-[8px]">
                              <Link2 className="w-2.5 h-2.5" />
                              {note.clientName}
                            </span>
                          )}
                        </div>

                        {/* Action buttons (salvar, editar, excluir, vincular) */}
                        {!isEditing && !isLinking && (
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              id={`btn_link_note_${note.id}`}
                              onClick={() => {
                                setLinkingNoteId(note.id);
                                setSelectedClientId(note.clientId || '');
                              }}
                              className="text-[10px] text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-100 hover:border-blue-200 px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1"
                              title="Direcionar nota para o histórico do cliente"
                            >
                              <Link2 className="w-3 h-3" />
                              <span>{note.clientId ? 'Re-vincular Cliente' : 'Vincular a Cliente'}</span>
                            </button>
                            
                            <button
                              id={`btn_edit_note_${note.id}`}
                              onClick={() => {
                                setEditingNoteId(note.id);
                                setEditingText(note.text);
                              }}
                              className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                              title="Editar Anotação"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              id={`btn_delete_note_${note.id}`}
                              onClick={() => {
                                if (confirm('Tem certeza de que deseja excluir esta anotação permanente?')) {
                                  onDeleteNote(note.id);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                              title="Excluir Anotação"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Link to client panel dropdown */}
                        {isLinking && (
                          <div className="bg-slate-100 p-2.5 rounded-lg space-y-2 mt-2 border border-slate-200 animate-slide-down">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Escolha o Cliente para Direcionar a Nota</label>
                            <div className="relative mb-1">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Filtrar cliente..."
                                value={noteClientSearch}
                                onChange={(e) => setNoteClientSearch(e.target.value)}
                                className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <select
                              id="link_client_select"
                              value={selectedClientId}
                              onChange={(e) => setSelectedClientId(e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:outline-none"
                            >
                              <option value="">-- Selecione o Cliente --</option>
                               {clients
                                .filter(c => {
                                  return c.name.toLowerCase().includes(noteClientSearch.toLowerCase()) ||
                                    (c.legalName && c.legalName.toLowerCase().includes(noteClientSearch.toLowerCase()));
                                })
                                .sort((a, b) => getClientDisplayName(a).localeCompare(getClientDisplayName(b), 'pt-BR'))
                                .map(c => (
                                  <option key={c.id} value={c.id}>{getClientDisplayName(c)} ({c.city || 'Cariacica'})</option>
                                ))}
                            </select>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                id="cancel_link"
                                onClick={() => {
                                  setLinkingNoteId(null);
                                  setSelectedClientId('');
                                  setNoteClientSearch('');
                                }}
                                className="px-2 py-1 text-[9px] font-bold text-slate-500 hover:bg-slate-200 rounded"
                              >
                                Cancelar
                              </button>
                              <button
                                id="confirm_link"
                                onClick={handleConfirmLink}
                                disabled={!selectedClientId}
                                className="px-2.5 py-1 text-[9px] font-bold bg-blue-600 text-white hover:bg-blue-700 rounded disabled:opacity-50"
                              >
                                Confirmar Vínculo
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-end shrink-0">
          <button
            id="close_voice_notes_modal_footer"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
