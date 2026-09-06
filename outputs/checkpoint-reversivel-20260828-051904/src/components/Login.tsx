/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, LogIn, AlertCircle, Compass, Eye, EyeOff } from 'lucide-react';
import { auth, signInWithEmailAndPassword, signInWithPopup, googleProvider } from '../lib/firebase';

interface LoginProps {
  onLoginSuccess: (email: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try to authenticate using Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      if (userCredential.user && userCredential.user.email) {
        localStorage.setItem('roteiro_pet_is_logged_in', 'true');
        localStorage.setItem('roteiro_pet_user_email', userCredential.user.email);
        localStorage.removeItem('roteiro_pet_offline_mode');
        onLoginSuccess(userCredential.user.email);
        setIsLoading(false);
        return;
      }
    } catch (firebaseErr: any) {
      console.warn('Firebase login error:', firebaseErr);
      
      // Handle specific Firebase Auth errors nicely
      let userFriendlyMsg = 'E-mail ou senha incorretos. Tente novamente.';
      if (firebaseErr.code === 'auth/network-request-failed') {
        userFriendlyMsg = 'É necessário conectar-se à internet para realizar o primeiro acesso neste dispositivo.';
      } else if (firebaseErr.code === 'auth/invalid-credential' || firebaseErr.code === 'auth/wrong-password' || firebaseErr.code === 'auth/user-not-found') {
        userFriendlyMsg = 'Credenciais incorretas ou inexistentes. Verifique os dados.';
      } else if (firebaseErr.message) {
        userFriendlyMsg = `Erro: ${firebaseErr.message}`;
      }

      setError(userFriendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user && result.user.email) {
        localStorage.setItem('roteiro_pet_is_logged_in', 'true');
        localStorage.setItem('roteiro_pet_user_email', result.user.email);
        localStorage.removeItem('roteiro_pet_offline_mode');
        onLoginSuccess(result.user.email);
      }
    } catch (e: any) {
      console.error('Google login error:', e);
      let errorMsg = 'Não foi possível entrar com o Google.';
      if (e.code === 'auth/popup-closed-by-user') {
        errorMsg = 'A janela de login com o Google foi fechada.';
      } else if (e.message) {
        errorMsg = e.message;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-6 lg:px-8 select-none font-sans relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* App Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform rotate-6 hover:rotate-0 transition-all duration-300">
            <Compass className="w-8 h-8 animate-pulse" />
          </div>
        </div>

        <h2 className="text-center text-3xl font-extrabold tracking-tight text-white">
          Roteiro Elismar
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/50 backdrop-blur-md">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                E-mail
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="login_email_input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  className="w-full text-sm pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 text-white transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Senha
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="login_password_input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full text-sm pl-10 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 text-white transition-all font-medium"
                  required
                />
                <button
                  id="toggle_password_visibility"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  title={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <button
              id="login_submit_btn"
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold py-3 px-4 rounded-xl shadow-lg transition-all transform active:scale-95 cursor-pointer ${
                isLoading ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Entrando...' : 'Entrar no Sistema'}</span>
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-slate-400 font-bold">ou</span>
              </div>
            </div>

            <button
              id="login_google_btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="mt-4 w-full flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-950 text-white text-sm font-bold py-3 px-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.125C18.29 1.83 15.45 1 12.24 1 5.48 1 0 6.48 0 13.24s5.48 12.24 12.24 12.24c7.05 0 11.75-4.97 11.75-11.96 0-.805-.085-1.415-.19-1.97-.005.005-11.56.005-11.56.005z"
                />
              </svg>
              <span>Entrar com o Google</span>
            </button>
          </div>



        </div>
      </div>
    </div>
  );
}
