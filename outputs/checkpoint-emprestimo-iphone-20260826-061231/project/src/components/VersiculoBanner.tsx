import React, { useState, useEffect } from 'react';
import { VERSICULOS } from '../data/versiculos';
import './VersiculoBanner.css';

export default function VersiculoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [verse, setVerse] = useState<{ texto: string; ref: string } | null>(null);

  useEffect(() => {
    const localStorageKey = 'versiculo-do-dia-fechado';
    const hoje = new Date();
    const hojeStr = hoje.toDateString();

    // Check if user already closed it today
    if (localStorage.getItem(localStorageKey) !== hojeStr) {
      const indice = (
        hoje.getFullYear() * 1000 +
        hoje.getMonth() * 100 +
        hoje.getDate()
      ) % VERSICULOS.length;

      setVerse(VERSICULOS[indice]);
      setIsVisible(true);

      // Auto-close after 20 seconds
      const timer = setTimeout(() => {
        setIsVisible((prev) => {
          if (prev) {
            localStorage.setItem(localStorageKey, hojeStr);
            return false;
          }
          return false;
        });
      }, 20000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    const localStorageKey = 'versiculo-do-dia-fechado';
    const hojeStr = new Date().toDateString();
    localStorage.setItem(localStorageKey, hojeStr);
    setIsVisible(false);
  };

  if (!isVisible || !verse) return null;

  return (
    <div id="versiculo-banner" className="versiculo-banner text-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-5 md:left-6 md:bottom-20 z-50">
      <div className="versiculo-header flex justify-between items-center mb-3 font-bold text-indigo-600 dark:text-indigo-400">
        <span className="flex items-center gap-1.5 text-sm md:text-base">
          <span>📖</span> Versículo do Dia
        </span>
        <button 
          id="fechar-versiculo" 
          onClick={handleClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-bold"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <div id="versiculo-texto" className="text-slate-700 dark:text-slate-300 text-sm md:text-base italic mb-3 leading-relaxed">
        “{verse.texto}”
      </div>

      <div id="versiculo-ref" className="text-right font-semibold text-xs md:text-sm text-indigo-600 dark:text-indigo-400">
        {verse.ref}
      </div>
    </div>
  );
}
