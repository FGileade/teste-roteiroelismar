/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BackupRestore.tsx — Componente UI de Backup e Restauração
 */

import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Lock,
  CheckCircle,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  Database,
  ShieldCheck,
} from 'lucide-react';
import {
  reauthUser,
  exportBackup,
  restoreBackup,
  validateBackupFile,
  BackupProgress,
  BackupReport,
  BackupFile,
} from '../lib/backupRestore';
import { resolveUserId } from '../lib/firebaseSync';
import { auth } from '../lib/firebase';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type ModalMode = 'export' | 'restore' | null;
type Step = 'auth' | 'confirm' | 'progress' | 'report';

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function ReportRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-bold text-slate-800">{value}</span>
    </div>
  );
}

// ─── Componente Principal ────────────────────────────────────────────────────

interface BackupRestoreProps {
  /** UID resolvido (já passado pelo resolveUserId) */
  userId: string;
}

export default function BackupRestore({ userId }: BackupRestoreProps) {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [step, setStep] = useState<Step>('auth');

  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [progress, setProgress] = useState<BackupProgress>({
    phase: 'idle', label: '', collection: '', percent: 0,
  });
  const [report, setReport] = useState<BackupReport | null>(null);
  const [opError, setOpError] = useState('');

  // Restore file
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<BackupFile | null>(null);
  const [fileError, setFileError] = useState('');

  // ── Open modal ──────────────────────────────────────────────────────────────

  function openModal(mode: ModalMode) {
    setModalMode(mode);
    setStep('auth');
    setPassword('');
    setAuthError('');
    setOpError('');
    setFileError('');
    setReport(null);
    setPendingBackup(null);
    setProgress({ phase: 'idle', label: '', collection: '', percent: 0 });
  }

  function closeModal() {
    setModalMode(null);
  }

  // ── Step 1: Reauth ──────────────────────────────────────────────────────────

  async function handleAuth() {
    if (!password) { setAuthError('Informe sua senha.'); return; }
    setIsAuthLoading(true);
    setAuthError('');
    try {
      await reauthUser(password);
      if (modalMode === 'restore') {
        // Abrir seletor de arquivo após auth
        fileInputRef.current?.click();
      } else {
        setStep('confirm');
      }
    } catch {
      setAuthError('Senha inválida. Operação cancelada.');
    } finally {
      setIsAuthLoading(false);
    }
  }

  // ── File picker (restore) ───────────────────────────────────────────────────

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string);
        const validated = validateBackupFile(raw);
        setPendingBackup(validated);
        setStep('confirm');
        setFileError('');
      } catch (err: unknown) {
        setFileError((err as Error).message || 'Arquivo inválido.');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  // ── Step 2: Confirm ─────────────────────────────────────────────────────────

  async function handleConfirm() {
    setStep('progress');
    setOpError('');
    try {
      const resolvedId = resolveUserId(auth.currentUser?.uid || userId);
      if (modalMode === 'export') {
        const rep = await exportBackup(resolvedId, setProgress);
        setReport(rep);
      } else if (modalMode === 'restore' && pendingBackup) {
        const rep = await restoreBackup(resolvedId, pendingBackup, setProgress);
        setReport(rep);
      }
      setStep('report');
    } catch (err: unknown) {
      setOpError((err as Error).message || 'Ocorreu um erro inesperado.');
      setStep('confirm');
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const isExport = modalMode === 'export';

  return (
    <>
      {/* ── Botões na aba Configurações ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-800">Backup & Restauração</h3>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Exporte todos os seus dados em um arquivo seguro ou restaure um backup anterior.
          Nenhuma informação será perdida — IDs, históricos e configurações são preservados integralmente.
        </p>

        <button
          id="backup_export_btn"
          onClick={() => openModal('export')}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Banco de Dados</span>
        </button>

        <button
          id="backup_restore_btn"
          onClick={() => openModal('restore')}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Restaurar Banco de Dados</span>
        </button>
      </div>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* ── Modal ── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4">

            {/* Header */}
            <div className={`flex items-center justify-between p-5 border-b border-slate-100 rounded-t-2xl ${isExport ? 'bg-indigo-50' : 'bg-amber-50'}`}>
              <div className="flex items-center gap-2">
                {isExport
                  ? <Download className="w-5 h-5 text-indigo-600" />
                  : <Upload className="w-5 h-5 text-amber-600" />
                }
                <h2 className="text-sm font-bold text-slate-800">
                  {isExport ? 'Exportar Banco de Dados' : 'Restaurar Banco de Dados'}
                </h2>
              </div>
              {step !== 'progress' && (
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* ── Step: Auth ── */}
            {step === 'auth' && (
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
                  <ShieldCheck className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Para sua segurança, confirme sua senha antes de continuar.
                  </p>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="backup_password_input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Sua senha atual"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setAuthError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleAuth()}
                    className="w-full pl-10 pr-10 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {authError && (
                  <div className="flex items-center gap-2 text-rose-600 text-xs bg-rose-50 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {fileError && (
                  <div className="flex items-center gap-2 text-rose-600 text-xs bg-rose-50 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{fileError}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="backup_auth_confirm_btn"
                    onClick={handleAuth}
                    disabled={isAuthLoading}
                    className={`flex-1 py-2.5 text-xs font-bold text-white rounded-xl transition-colors cursor-pointer ${
                      isExport
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-amber-500 hover:bg-amber-600'
                    } ${isAuthLoading ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    {isAuthLoading ? 'Verificando...' : 'Continuar'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step: Confirm ── */}
            {step === 'confirm' && (
              <div className="p-5 flex flex-col gap-4">
                <div className={`flex items-start gap-3 rounded-xl p-4 ${isExport ? 'bg-indigo-50' : 'bg-amber-50'}`}>
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isExport ? 'text-indigo-600' : 'text-amber-600'}`} />
                  <div>
                    {isExport ? (
                      <>
                        <p className="text-sm font-bold text-slate-800 mb-1">Exportar todos os dados?</p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Um arquivo <strong>.json</strong> será gerado com todos os seus clientes, visitas, negociações, agenda, empréstimos e configurações. Os IDs originais serão preservados integralmente.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-slate-800 mb-1">⚠ ATENÇÃO</p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Esta operação <strong>substituirá os dados atuais</strong> pelos dados do arquivo selecionado. Todos os registros existentes com o mesmo ID serão sobrescritos.
                        </p>
                        {pendingBackup && (
                          <div className="mt-3 bg-white rounded-lg p-3 border border-amber-200 text-xs text-slate-700 space-y-1">
                            <div className="flex justify-between"><span className="text-slate-500">Backup criado em:</span><span>{new Date(pendingBackup.createdAt).toLocaleString('pt-BR')}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Clientes:</span><span>{pendingBackup.collections.clients?.length || 0}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Visitas:</span><span>{pendingBackup.collections.visits?.length || 0}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Negociações:</span><span>{pendingBackup.collections.negotiations?.length || 0}</span></div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {opError && (
                  <div className="flex items-center gap-2 text-rose-600 text-xs bg-rose-50 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{opError}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="backup_execute_btn"
                    onClick={handleConfirm}
                    className={`flex-1 py-2.5 text-xs font-bold text-white rounded-xl transition-colors cursor-pointer ${
                      isExport
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-amber-500 hover:bg-amber-600'
                    }`}
                  >
                    {isExport ? 'Exportar' : 'Restaurar'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step: Progress ── */}
            {step === 'progress' && (
              <div className="p-5 flex flex-col gap-5">
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-800 mb-0.5">
                    {isExport ? 'Exportando...' : 'Restaurando...'}
                  </p>
                  <p className="text-xs text-slate-500">{progress.label}</p>
                  {progress.collection && (
                    <p className="text-[11px] text-slate-400 mt-0.5">Coleção: {progress.collection}</p>
                  )}
                </div>
                <ProgressBar percent={progress.percent} />
                <p className="text-center text-lg font-bold text-indigo-600">{progress.percent}%</p>
              </div>
            )}

            {/* ── Step: Report ── */}
            {step === 'report' && report && (
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                  <p className="text-sm font-bold">
                    {isExport ? 'Backup concluído com sucesso!' : 'Restauração concluída com sucesso!'}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl px-4 py-2 border border-slate-100">
                  <ReportRow label="Clientes" value={report.clients} />
                  <ReportRow label="Visitas" value={report.visits} />
                  <ReportRow label="Negociações" value={report.negotiations} />
                  <ReportRow label="Agenda" value={report.events} />
                  <ReportRow label="Empréstimos" value={report.loans} />
                  <ReportRow label="Notas de Voz" value={report.voiceNotes} />
                  <ReportRow label="Configurações" value="Restauradas" />
                  <ReportRow label="Tempo" value={report.duration} />
                  <ReportRow label="Arquivo" value={report.filename} />
                </div>

                <button
                  id="backup_close_report_btn"
                  onClick={closeModal}
                  className="w-full py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
