/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Home
} from 'lucide-react';
import { updateEmail, updatePassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface SettingsProps {
  onLogout: () => void;
  userEmail: string;
  onUpdateEmail: (newEmail: string) => void;
}

export default function Settings({
  onLogout,
  userEmail,
  onUpdateEmail,
}: SettingsProps) {
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

    // Validation
    const savedPassword = localStorage.getItem('roteiro_pet_user_password') || 'elismar123';
    
    if (!currentPassword) {
      setAccessError('Por favor, informe sua senha atual para salvar as alterações.');
      return;
    }

    if (currentPassword !== savedPassword) {
      setAccessError('A senha atual inserida está incorreta.');
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
        localStorage.setItem('roteiro_pet_user_password', newPassword.trim());
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

