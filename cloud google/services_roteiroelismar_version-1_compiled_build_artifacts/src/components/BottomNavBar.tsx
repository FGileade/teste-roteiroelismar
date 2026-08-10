/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, Users, Map, Settings, Mic } from 'lucide-react';
import { AppSignature } from './AppSignature';

type TabType = 'agenda' | 'clientes' | 'rotas' | 'configuracoes';

interface BottomNavBarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingCount?: number;
  onVoiceNotesClick: () => void;
}

export default function BottomNavBar({
  currentTab,
  onTabChange,
  pendingCount = 0,
  onVoiceNotesClick,
}: BottomNavBarProps) {
  const tabs = [
    {
      id: 'agenda' as TabType,
      label: 'Agenda',
      icon: Calendar,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'clientes' as TabType,
      label: 'Clientes',
      icon: Users,
    },
    {
      id: 'rotas' as TabType,
      label: 'Rotas',
      icon: Map,
    },
    {
      id: 'configuracoes' as TabType,
      label: 'Configurações',
      icon: Settings,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 shadow-xl select-none">
      <div className="max-w-md mx-auto flex flex-col">
        <div className="flex items-end justify-between relative py-1 px-2">
        {/* Left 2 tabs */}
        <div className="flex-1 flex justify-around">
          {tabs.slice(0, 2).map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                id={`nav_tab_${tab.id}`}
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center justify-center relative py-1.5 px-2 text-center rounded-xl transition-all active:scale-95 touch-manipulation flex-1"
              >
                <div className="relative">
                  <Icon 
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isActive ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
                    }`} 
                  />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white font-black font-mono text-[9px] px-1.5 py-0.5 rounded-full border border-white">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span 
                  className={`text-[9px] font-bold mt-1 tracking-tight transition-colors duration-200 ${
                    isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                </span>
                
                {isActive && (
                  <span className="absolute bottom-0 w-1 h-1 rounded-full bg-blue-600"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Center voice note button */}
        <div className="px-2 shrink-0 relative -top-3">
          <button
            id="nav_tab_voice_notes"
            onClick={onVoiceNotesClick}
            className="flex flex-col items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-white w-12 h-12 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all hover:scale-105 active:scale-95 focus:outline-none border-4 border-white relative z-50 touch-manipulation"
            title="Anotações por Voz"
          >
            <Mic className="w-5 h-5 animate-pulse" />
          </button>
          <span className="text-[9px] font-bold text-slate-500 text-center block mt-1">Anotações</span>
        </div>

        {/* Right 2 tabs */}
        <div className="flex-1 flex justify-around">
          {tabs.slice(2).map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                id={`nav_tab_${tab.id}`}
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center justify-center relative py-1.5 px-2 text-center rounded-xl transition-all active:scale-95 touch-manipulation flex-1"
              >
                <div className="relative">
                  <Icon 
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                    }`} 
                  />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white font-black font-mono text-[9px] px-1.5 py-0.5 rounded-full border border-white">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span 
                  className={`text-[9px] font-bold mt-1 tracking-tight transition-colors duration-200 ${
                    isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                </span>
                
                {isActive && (
                  <span className="absolute bottom-0 w-1 h-1 rounded-full bg-blue-600"></span>
                )}
              </button>
            );
          })}
        </div>
        </div>
        <AppSignature />
      </div>
    </div>
  );
}
