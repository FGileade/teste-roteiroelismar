/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import BackupRestore from './BackupRestore';
import { 
  Mail, 
  Lock, 
  MapPin, 
  Save, 
  LogOut, 
  Compass, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  Edit2,
  Home,
  RefreshCw,
  RotateCw
} from 'lucide-react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Client } from '../types';
import { exportClientsToExcel, ExcelImportReport, importClientsFromExcel } from '../lib/excelService';

interface SettingsProps {
  onLogout: () => void;
  userEmail: string;
  onUpdateEmail: (newEmail: string) => void;
  userId?: string;
  clients: Client[];
  onImportClients: (report: ExcelImportReport) => void;
}

export default function Settings({
  onLogout,
  userEmail,
  onUpdateEmail,
  userId = 'local',
  clients,
  onImportClients,
}: SettingsProps) {
  const [isImportingClients, setIsImportingClients] = useState(false);
  const [excelMessage, setExcelMessage] = useState('');
  const [excelError, setExcelError] = useState('');
  // Access and Auth state
  const [currentEmail, setCurrentEmail] = useState(userEmail);
  const [newEmail, setNewEmail] = useState('');
  const [confirmNewEmail, setConfirmNewEmail] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Edit states
  const [isEditingAccess, setIsEditingAccess] = useState(false);
  const [isSavingAccess, setIsSavingAccess] = useState(false);
  const [accessSuccess, setAccessSuccess] = useState('');
  const [accessError, setAccessError] = useState('');

  // Office Location / My Address state
  const [officeAddress, setOfficeAddress] = useState('Av. Fernando Ferrari, 1105 - Jardim da Penha, Vitória - ES, 29060-300');
  const [officeLat, setOfficeLat] = useState('-20.278917');
  const [officeLng, setOfficeLng] = useState('-40.300583');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState('');
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Rotation preference state
  const [allowRotation, setAllowRotation] = useState<boolean>(() => {
    const saved = localStorage.getItem('roteiro_pet_allow_rotation');
    return saved !== 'false';
  });

  const applyOrientation = (allowed: boolean) => {
    try {
      if (allowed) {
        if (screen.orientation && typeof screen.orientation.unlock === 'function') {
          screen.orientation.unlock();
        }
      } else {
        if (screen.orientation && typeof (screen.orientation as any).lock === 'function') {
          (screen.orientation as any).lock('portrait').catch((err: any) => {
            console.warn('Orientation lock failed:', err);
          });
        }
      }
    } catch (e) {
      console.warn('Screen orientation API not fully supported:', e);
    }
  };

  const handleToggleRotation = () => {
    const newVal = !allowRotation;
    setAllowRotation(newVal);
    localStorage.setItem('roteiro_pet_allow_rotation', String(newVal));
    applyOrientation(newVal);
  };

  // Update states
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'up-to-date' | 'found' | 'downloading' | 'updating-files' | 'clearing-cache' | 'applying' | 'restarting' | 'success'>('idle');
  const [updateMessage, setUpdateMessage] = useState('');

  // Remove legacy plaintext password data from older application versions.
  useEffect(() => {
    localStorage.removeItem('roteiro_pet_user_password');
  }, []);

  // Check if we just updated on mount
  useEffect(() => {
    const justUpdated = localStorage.getItem('app_just_updated');
    if (justUpdated === 'true') {
      setUpdateStatus('success');
      setUpdateMessage('✅ Aplicação atualizada com sucesso.');
      localStorage.removeItem('app_just_updated');
      
      const timer = setTimeout(() => {
        setUpdateStatus('idle');
        setUpdateMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const runUpdateSequence = async () => {
    const steps = [
      { status: 'found', msg: '⬇ Encontramos uma nova versão.' },
      { status: 'downloading', msg: '⬇ Baixando atualização...' },
      { status: 'updating-files', msg: '⚙ Atualizando arquivos...' },
      { status: 'clearing-cache', msg: '🧹 Atualizando cache...' },
      { status: 'applying', msg: '♻ Aplicando atualização...' },
      { status: 'restarting', msg: '🔄 Reiniciando aplicação...' }
    ] as const;

    for (const step of steps) {
      setUpdateStatus(step.status);
      setUpdateMessage(step.msg);
      
      if (step.status === 'clearing-cache') {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        } catch (e) {
          console.warn('Erro ao limpar cache:', e);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 800));
    }

    localStorage.setItem('app_just_updated', 'true');
    window.location.reload();
  };

  const handleCheckUpdates = async () => {
    if (!('serviceWorker' in navigator)) {
      setUpdateStatus('checking');
      setUpdateMessage('🔍 Procurando atualizações...');
      setTimeout(() => {
        setUpdateStatus('up-to-date');
        setUpdateMessage('✔ Você já está utilizando a versão mais recente.');
      }, 1500);
      return;
    }

    try {
      setUpdateStatus('checking');
      setUpdateMessage('🔍 Procurando atualizações...');

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setTimeout(() => {
          setUpdateStatus('up-to-date');
          setUpdateMessage('✔ Você já está utilizando a versão mais recente.');
        }, 1500);
        return;
      }

      let updateFound = false;

      const onUpdateFound = () => {
        updateFound = true;
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            // skipWaiting() faz o SW ir direto para activating/activated,
            // nunca passando por 'installed' (waiting). Escutar os estados corretos:
            if (
              installingWorker.state === 'activating' ||
              installingWorker.state === 'activated'
            ) {
              runUpdateSequence();
            }
          };
        }
      };

      registration.addEventListener('updatefound', onUpdateFound);

      await registration.update();

      // Aumentado para 4s para cobrir conexões lentas
      setTimeout(() => {
        registration.removeEventListener('updatefound', onUpdateFound);
        if (!updateFound && !registration.waiting && !registration.installing) {
          setUpdateStatus('up-to-date');
          setUpdateMessage('✔ Você já está utilizando a versão mais recente.');
        } else if (registration.waiting) {
          // SW em waiting: forçar skip via mensagem
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          runUpdateSequence();
        }
      }, 4000);

    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      setUpdateStatus('up-to-date');
      setUpdateMessage('✔ Você já está utilizando a versão mais recente.');
    }
  };

  // Load saved credentials and office location on mount
  useEffect(() => {
    setCurrentEmail(userEmail);

    const savedOffice = localStorage.getItem('roteiro_pet_office_location');
    if (savedOffice) {
      try {
        const parsed = JSON.parse(savedOffice);
        setOfficeAddress(parsed.address || '');
        setOfficeLat(parsed.lat?.toString() || '');
        setOfficeLng(parsed.lng?.toString() || '');
      } catch (e) {
        console.error('Error parsing stored office location', e);
      }
    }
  }, [userEmail]);

  // Handle access credentials save
  const handleSaveAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccessSuccess('');
    setAccessError('');

    // If we're not currently editing, clicking simply enables edit mode
    if (!isEditingAccess) {
      setIsEditingAccess(true);
      return;
    }

    if (!currentPassword) {
      setAccessError('Por favor, informe sua senha atual para salvar as alterações.');
      return;
    }

    // Email update checks
    const hasEmailChange = newEmail.trim() !== '';
    if (hasEmailChange) {
      const emailToValidate = newEmail.trim();
      if (!emailToValidate.includes('@')) {
        setAccessError('Por favor, insira um novo e-mail válido.');
        return;
      }
      if (emailToValidate === currentEmail) {
        setAccessError('O novo e-mail deve ser diferente do e-mail atual.');
        return;
      }
      if (emailToValidate !== confirmNewEmail.trim()) {
        setAccessError('A confirmação do novo e-mail não coincide.');
        return;
      }
    }

    // Password update checks
    const hasPasswordChange = newPassword.trim() !== '';
    if (hasPasswordChange) {
      if (newPassword.length < 6) {
        setAccessError('A nova senha deve conter pelo menos 6 caracteres.');
        return;
      }
      if (newPassword === currentPassword) {
        setAccessError('A nova senha deve ser diferente da senha atual.');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setAccessError('A confirmação da nova senha não coincide.');
        return;
      }
    }

    if (!hasEmailChange && !hasPasswordChange) {
      setAccessError('Modifique o e-mail ou a senha para poder salvar.');
      return;
    }

    setIsSavingAccess(true);

    try {
      // 1. Try Firebase Auth updates if logged in
      const user = auth.currentUser;
      if (user) {
        if (user.email && user.providerData.some(({ providerId }) => providerId === 'password')) {
          await reauthenticateWithCredential(
            user,
            EmailAuthProvider.credential(user.email, currentPassword),
          );
        }
        if (hasEmailChange) {
          await updateEmail(user, newEmail.trim());
        }
        if (hasPasswordChange) {
          await updatePassword(user, newPassword.trim());
        }
      }

      // 2. Local fallback / updates
      if (hasEmailChange) {
        localStorage.setItem('roteiro_pet_user_email', newEmail.trim());
        onUpdateEmail(newEmail.trim());
        setCurrentEmail(newEmail.trim());
      }
      if (hasPasswordChange) {
        localStorage.removeItem('roteiro_pet_user_password');
      }

      // Clear input fields for safety
      setNewEmail('');
      setConfirmNewEmail('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      setAccessSuccess('Credenciais atualizadas com sucesso!');
      setIsEditingAccess(false);
      setTimeout(() => setAccessSuccess(''), 5000);

    } catch (firebaseErr: any) {
      console.error('Firebase Auth update error:', firebaseErr);
      if (firebaseErr.code === 'auth/requires-recent-login') {
        setAccessError(
          'Para sua segurança, esta ação requer login recente. Por favor, saia do aplicativo e faça login novamente para salvar.'
        );
      } else {
        setAccessError(`Erro ao atualizar na nuvem: ${firebaseErr.message || firebaseErr}`);
      }
    } finally {
      setIsSavingAccess(false);
    }
  };

  // Handle office / my address location save
  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    setLocationSuccess('');
    setLocationError('');

    if (!isEditingLocation) {
      setIsEditingLocation(true);
      return;
    }

    const latNum = parseFloat(officeLat);
    const lngNum = parseFloat(officeLng);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setLocationError('Por favor, insira uma latitude válida (-90 a 90).');
      return;
    }

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setLocationError('Por favor, insira uma longitude válida (-180 a 180).');
      return;
    }

    if (!officeAddress.trim()) {
      setLocationError('Por favor, insira o endereço.');
      return;
    }

    const officeData = {
      address: officeAddress.trim(),
      lat: latNum,
      lng: lngNum
    };

    // Save to localStorage
    localStorage.setItem('roteiro_pet_office_location', JSON.stringify(officeData));

    setLocationSuccess('Endereço atualizado com sucesso no banco local!');
    setIsEditingLocation(false);
    setTimeout(() => setLocationSuccess(''), 4000);
  };

  // Auto detect current location to pre-fill coordinates
  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    setLocationSuccess('');
    setLocationError('');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOfficeLat(pos.coords.latitude.toFixed(6));
          setOfficeLng(pos.coords.longitude.toFixed(6));
          setIsLocating(false);
          setLocationSuccess('Coordenadas capturadas via GPS! Clique em salvar para gravar.');
        },
        (err) => {
          setLocationError('Não foi possível obter a localização. Permissão negada ou sinal fraco.');
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLocationError('Seu navegador não suporta geolocalização.');
      setIsLocating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto max-w-2xl mx-auto w-full px-4 pt-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Configurações</h1>
        <p className="text-xs text-slate-400 font-medium">Gerencie suas credenciais de login e o seu endereço principal.</p>
      </div>

      <div className="space-y-6">
        
        {/* ACCESS CREDENTIALS FORM */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-800 text-sm">Credenciais de Acesso</h2>
            </div>
            {!isEditingAccess && (
              <button
                id="toggle_edit_access_top_btn"
                onClick={() => setIsEditingAccess(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSaveAccess} className="space-y-4">
            {/* E-mail Atual */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">E-mail Atual</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="settings_current_email"
                  type="email"
                  value={currentEmail}
                  disabled={true}
                  className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            {isEditingAccess && (
              <>
                {/* Novo E-mail */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Novo E-mail</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      id="settings_new_email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Deixe em branco se não quiser alterar"
                      className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 text-slate-700 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Confirmar E-mail */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Confirmar E-mail</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      id="settings_confirm_email"
                      type="email"
                      value={confirmNewEmail}
                      onChange={(e) => setConfirmNewEmail(e.target.value)}
                      placeholder="Repita o novo e-mail"
                      className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 text-slate-700 transition-all font-medium"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Senha Atual */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Senha Atual {isEditingAccess && <span className="text-rose-500 font-bold">*</span>}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="settings_current_password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={!isEditingAccess}
                  placeholder={isEditingAccess ? "Sua senha atual para validar" : "••••••••"}
                  className={`w-full text-sm pl-10 pr-10 py-2.5 border rounded-xl text-slate-700 transition-all font-medium focus:outline-none ${
                    isEditingAccess 
                      ? 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500' 
                      : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                />
                {isEditingAccess && (
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {isEditingAccess && (
              <>
                {/* Nova Senha */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nova Senha</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="settings_new_password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      className="w-full text-sm pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 text-slate-700 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Senha */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Confirmar Senha</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="settings_confirm_password"
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full text-sm pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 text-slate-700 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {accessError && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{accessError}</span>
              </div>
            )}

            {accessSuccess && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-xl">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{accessSuccess}</span>
              </div>
            )}

            <div className="flex gap-2">
              {isEditingAccess && (
                <button
                  id="cancel_edit_access_btn"
                  type="button"
                  onClick={() => {
                    setIsEditingAccess(false);
                    setNewEmail('');
                    setConfirmNewEmail('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setAccessError('');
                  }}
                  className="w-1/3 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                id="save_access_btn"
                type="submit"
                disabled={isSavingAccess}
                className={`flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer ${
                  isSavingAccess ? 'opacity-70 cursor-wait' : ''
                }`}
              >
                {isSavingAccess ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  isEditingAccess ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />
                )}
                <span>{isEditingAccess ? 'Salvar Credenciais' : 'Editar Credenciais'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* MY ADDRESS LOCATION FORM */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800 text-sm">Meu Endereço</h2>
            </div>
            {!isEditingLocation && (
              <button
                id="toggle_edit_location_top_btn"
                onClick={() => setIsEditingLocation(true)}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-bold transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSaveLocation} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Endereço Completo</label>
              <div className="relative">
                <span className="absolute top-3 left-3 text-slate-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <textarea
                  id="settings_office_address"
                  rows={2}
                  value={officeAddress}
                  onChange={(e) => setOfficeAddress(e.target.value)}
                  disabled={!isEditingLocation}
                  placeholder="Rua, Número, Bairro, Cidade - Estado"
                  className={`w-full text-sm pl-10 pr-4 py-2.5 border rounded-xl text-slate-700 transition-all font-medium resize-none focus:outline-none ${
                    isEditingLocation 
                      ? 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500' 
                      : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Latitude</label>
                <input
                  id="settings_office_lat"
                  type="text"
                  value={officeLat}
                  onChange={(e) => setOfficeLat(e.target.value)}
                  disabled={!isEditingLocation}
                  placeholder="-20.278917"
                  className={`w-full text-sm px-4 py-2.5 border rounded-xl text-slate-700 transition-all font-mono font-medium focus:outline-none ${
                    isEditingLocation 
                      ? 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500' 
                      : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Longitude</label>
                <input
                  id="settings_office_lng"
                  type="text"
                  value={officeLng}
                  onChange={(e) => setOfficeLng(e.target.value)}
                  disabled={!isEditingLocation}
                  placeholder="-40.300583"
                  className={`w-full text-sm px-4 py-2.5 border rounded-xl text-slate-700 transition-all font-mono font-medium focus:outline-none ${
                    isEditingLocation 
                      ? 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500' 
                      : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            {isEditingLocation && (
              <div className="flex justify-end">
                <button
                  id="get_gps_coords_btn"
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isLocating}
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-xs bg-blue-50 hover:bg-blue-100/80 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Buscando GPS...' : 'Usar Minha Localização Atual'}</span>
                </button>
              </div>
            )}

            {locationError && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{locationError}</span>
              </div>
            )}

            {locationSuccess && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-xl">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{locationSuccess}</span>
              </div>
            )}

            <div className="flex gap-2">
              {isEditingLocation && (
                <button
                  id="cancel_edit_location_btn"
                  type="button"
                  onClick={() => {
                    setIsEditingLocation(false);
                    setLocationError('');
                    const savedOffice = localStorage.getItem('roteiro_pet_office_location');
                    if (savedOffice) {
                      try {
                        const parsed = JSON.parse(savedOffice);
                        setOfficeAddress(parsed.address || '');
                        setOfficeLat(parsed.lat?.toString() || '');
                        setOfficeLng(parsed.lng?.toString() || '');
                      } catch (e) {}
                    }
                  }}
                  className="w-1/3 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                id="save_office_location_btn"
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isEditingLocation ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                <span>{isEditingLocation ? 'Salvar Endereço' : 'Editar Endereço'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* SCREEN ORIENTATION BOX */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <RotateCw className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800 text-sm">Tela e Orientação</h2>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Rotacionar tela</h3>
              <p className="text-[11px] text-slate-400 font-medium">Permitir que a tela gire automaticamente para o modo paisagem.</p>
            </div>
            <button
              id="toggle_rotation_btn"
              type="button"
              onClick={handleToggleRotation}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                allowRotation ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  allowRotation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* UPDATE BOX */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-800 text-sm">Atualizações</h2>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-medium">
              Mantenha sua aplicação sempre atualizada.
            </p>

            {updateMessage && (
              <div className={`flex items-center gap-2 border text-xs p-3 rounded-xl ${
                updateStatus === 'success' || updateStatus === 'up-to-date'
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  : 'bg-blue-50 border-blue-100 text-blue-700 font-medium'
              }`}>
                {updateStatus === 'success' || updateStatus === 'up-to-date' ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></span>
                )}
                <span className="font-semibold">{updateMessage}</span>
              </div>
            )}

            <button
              id="check_updates_btn"
              type="button"
              onClick={handleCheckUpdates}
              disabled={updateStatus !== 'idle' && updateStatus !== 'success' && updateStatus !== 'up-to-date'}
              className={`w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer ${
                (updateStatus !== 'idle' && updateStatus !== 'success' && updateStatus !== 'up-to-date') ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${(updateStatus !== 'idle' && updateStatus !== 'success' && updateStatus !== 'up-to-date') ? 'animate-spin' : ''}`} />
              <span>Procurar Atualizações</span>
            </button>
          </div>
        </div>

        {/* BACKUP & RESTORE */}
        <BackupRestore userId={userId} />

        {/* EXCEL SYNC */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Sincronização de Planilha</h2>
              <p className="text-[11px] text-slate-400 mt-1">Importe a aba CARIACICA_VIANA ou exporte a base atual.</p>
            </div>
          </div>
          <input
            id="clients_excel_upload"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-blue-700"
            disabled={isImportingClients}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setExcelMessage(''); setExcelError(''); setIsImportingClients(true);
              try {
                const report = await importClientsFromExcel(file, clients);
                onImportClients(report);
                setExcelMessage(`Importação concluída: ${report.created} criados, ${report.updated} atualizados e ${report.ignored} ignorados.`);
                if (report.warnings.length) setExcelError(report.warnings.slice(0, 3).join(' '));
              } catch (error: any) {
                setExcelError(error?.message || 'Não foi possível importar a planilha.');
              } finally {
                setIsImportingClients(false);
                event.target.value = '';
              }
            }}
            aria-label="Selecionar planilha Excel de clientes"
          />
          {excelMessage && <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-xl"><CheckCircle className="w-4 h-4 shrink-0" /><span>{excelMessage}</span></div>}
          {excelError && <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-700 text-xs p-3 rounded-xl"><AlertCircle className="w-4 h-4 shrink-0" /><span>{excelError}</span></div>}
          <button type="button" onClick={() => exportClientsToExcel(clients)} className="w-full mt-3 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition-colors" disabled={!clients.length}>
            <Save className="w-4 h-4" /> Baixar Planilha Atualizada (.xlsx)
          </button>
        </div>

        {/* LOGOUT BOX */}
        <div className="bg-slate-100 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="text-sm font-bold text-slate-700">Sair da Conta</h4>
            <p className="text-[11px] text-slate-500">Desconectar seu usuário com segurança deste dispositivo.</p>
          </div>
          <button
            id="logout_action_btn"
            onClick={onLogout}
            className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 text-xs font-bold py-2.5 px-5 rounded-xl transition-colors cursor-pointer w-full sm:w-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Aplicativo</span>
          </button>
        </div>

      </div>
    </div>
  );
}
