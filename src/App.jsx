import React, { useState, useEffect, useRef } from 'react';
import { Map, Sparkles, Users, Calendar, User, ShieldCheck, Lock, MapPin, Trash2, Check, X, AlertTriangle, Target, Compass, Bell, Sliders, Phone, DollarSign, GraduationCap, CheckSquare, RotateCcw, Info, CheckCircle, XCircle, BookOpen } from 'lucide-react';

// Banco de dados em memória mock local sincronizado
const SEED_CLIENTS = [
  { id: 'cli-1', name: 'Pet Shop Cão Feliz', sector: 'Pet Shop', lat: -20.3750, lng: -40.3650, frequency: '4x por Mês', lastVisitDate: '2026-06-03', contact: 'Maria Helena', phone: '(27) 9988-1234' },
  { id: 'cli-2', name: 'Agropecuária Sul', sector: 'Agropecuária', lat: -20.3900, lng: -40.3800, frequency: '2x por Mês', lastVisitDate: '2026-05-18', contact: 'Sr. José', phone: '(27) 3255-9876' },
  { id: 'cli-3', name: 'Clínica Veterinária São Francisco', sector: 'Clínica Veterinária', lat: -20.3680, lng: -40.3580, frequency: '1x por Mês', lastVisitDate: '2026-06-05', contact: 'Dra. Cláudia', phone: '(27) 9911-5544' }
];

const VERSES = [
  { text: "O Senhor é o meu pastor; de nada terei falta. Deita-me em verdes pastos e guia-me mansamente a águas tranquilas.", ref: "Salmos 23:1-2" },
  { text: "Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.", ref: "Provérbios 16:3" },
  { text: "Seja forte e corajoso! Não se apavore, nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar.", ref: "Josué 1:9" }
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('elismar:auth') === 'true');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [currentTab, setCurrentTab] = useState('hoje');
  const [clients, setClients] = useState(() => JSON.parse(localStorage.getItem('elismar:clients')) || SEED_CLIENTS);
  const [todayRoute, setTodayRoute] = useState(() => JSON.parse(localStorage.getItem('elismar:todayRoute')) || ['cli-1', 'cli-3']);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('elismar:history')) || []);
  const [reminders, setReminders] = useState(() => JSON.parse(localStorage.getItem('elismar:reminders')) || []);
  const [search, setSearch] = useState('');

  // Estados do Banner de Versículo
  const [showVerse, setShowVerse] = useState(true);
  const [currentVerse, setCurrentVerse] = useState({ text: '', ref: '' });
  const [readingTime, setReadingTime] = useState(0);

  // Estados do Perfil e Modais
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem('elismar:profile')) || { name: 'Elismar', email: 'elismar@gileade.com', phone: '(27) 99122-3344', region: 'Viana, ES', id: 'GIL-REP-90210' });
  const [showRepModal, setShowRepModal] = useState(false);
  const [pendingClient, setPendingClient] = useState(null);
  const [toasts, setToasts] = useState([]);
  const canvasRef = useRef(null);

  // Seleção diária automática do versículo baseada no dia do mês
  useEffect(() => {
    const day = new Date().getDate();
    const verse = VERSES[day % VERSES.length];
    setCurrentVerse(verse);
    
    // Cálculo do tempo de leitura (Média de 200 palavras por minuto -> ~3.3 palavras por segundo)
    const wordsCount = verse.text.split(' ').length;
    const estimatedSeconds = Math.max(Math.ceil(wordsCount / 3.3), 3);
    setReadingTime(estimatedSeconds);
  }, []);

  // Contador regressivo do tempo de leitura
  useEffect(() => {
    if (!showVerse || readingTime <= 0) return;
    const timer = setInterval(() => {
      setReadingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showVerse, readingTime]);

  // Persistência de Dados
  useEffect(() => {
    localStorage.setItem('elismar:clients', JSON.stringify(clients));
    localStorage.setItem('elismar:todayRoute', JSON.stringify(todayRoute));
    localStorage.setItem('elismar:history', JSON.stringify(history));
    localStorage.setItem('elismar:reminders', JSON.stringify(reminders));
    localStorage.setItem('elismar:profile', JSON.stringify(profile));
    if (isAuthenticated && currentTab === 'hoje') drawMap();
  }, [clients, todayRoute, history, reminders, profile, isAuthenticated, currentTab]);

  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginUser === 'Elismar' && loginPass === 'elismar123') {
      setIsAuthenticated(true);
      localStorage.setItem('elismar:auth', 'true');
      addToast('Acesso autorizado com sucesso.');
    } else {
      addToast('Credenciais de acesso incorretas.', 'error');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('elismar:auth', 'false');
  };

  const tryAddRoute = (id) => {
    if (todayRoute.includes(id)) {
      setTodayRoute(prev => prev.filter(cId => cId !== id));
      addToast('Visita removida da rota do dia.');
      return;
    }
    const client = clients.find(c => c.id === id);
    // Anti-repetição estrito se visitado há menos de 7 dias
    const lastVisit = client.lastVisitDate ? Math.ceil(Math.abs(new Date('2026-06-09') - new Date(client.lastVisitDate)) / (1000 * 60 * 60 * 24)) : 99;
    if (lastVisit < 7) {
      setPendingClient(id);
      setShowRepModal(true);
    } else {
      setTodayRoute(prev => [...prev, id]);
      addToast('Visita integrada ao roteiro.');
    }
  };

  const confirmRepetition = () => {
    setTodayRoute(prev => [...prev, pendingClient]);
    setShowRepModal(false);
    addToast('Urgência comercial aceita e inserida no roteiro.', 'warning');
  };

  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Malha urbana simplificada
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for(let i=0; i<canvas.width; i+=40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Trajeto da rota ativa
    if (todayRoute.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 3;
      clients.forEach((c, idx) => {
        if (todayRoute.includes(c.id)) {
          const x = 150 + (c.lng + 40.3700) * 8000;
          const y = 100 - (c.lat + 20.3800) * 8000;
          if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col justify-between p-6">
        <div className="my-auto max-w-sm w-full mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg">E</div>
            <h2 className="text-xl font-bold tracking-tight">Elismar Rotas Premium</h2>
            <p className="text-xs text-slate-400">Gileade Application Engine System</p>
          </div>

          <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Usuário</label>
              <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-white" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Senha</label>
              <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-white" />
            </div>
            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition uppercase tracking-wider">Entrar no Painel</button>
          </form>
        </div>

        {/* Assinatura Obrigatória Conforme Especificação */}
        <div className="text-center text-[10px] text-slate-500">
          Developed by <a href="https://gileade-hub.vercel.app/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Gileade Application</a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-between relative">
      {/* HEADER DE MONITORIZAÇÃO */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center font-bold text-slate-950 text-xs">E</div>
          <h1 className="text-xs font-bold uppercase tracking-wider">Elismar Rota Premium</h1>
        </div>
        <span className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">GPS Ativo: Viana, ES</span>
      </header>

      {/* BANNER FLUTUANTE DE VERSÍCULO DIÁRIO INTELIGENTE */}
      {showVerse && (
        <div className="absolute top-14 inset-x-3 bg-slate-900/95 border border-emerald-500/30 p-3.5 rounded-2xl shadow-2xl backdrop-blur z-50 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Versículo de Hoje</span>
            </div>
            <button onClick={() => setShowVerse(false)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed italic">"{currentVerse.text}"</p>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
            <span>{currentVerse.ref}</span>
            {readingTime > 0 ? (
              <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">Leitura estimada: {readingTime}s</span>
            ) : (
              <span className="text-emerald-500 font-bold flex items-center gap-0.5"><Check className="w-3 h-3" /> Lido</span>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE BLOQUEIO / INTERCEPTOR ANTI-REPETIÇÃO */}
      {showRepModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl w-full max-w-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold">Visita Feita Recentemente</h3>
            </div>
            <p className="text-xs text-slate-300">Este cliente já recebeu uma visita comercial na última semana. Tem certeza de que necessita duplicar o roteiro?</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowRepModal(false)} className="bg-slate-800 text-xs py-2 rounded-xl">Cancelar</button>
              <button onClick={confirmRepetition} className="bg-amber-500 text-slate-950 text-xs font-bold py-2 rounded-xl">Forçar Rota</button>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL REATIVO */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {currentTab === 'hoje' && (
          <div className="space-y-4">
            <div className="border border-slate-800 rounded-2xl bg-slate-900 overflow-hidden relative aspect-[16/10]">
              <canvas ref={canvasRef} width="350" height="200" className="w-full h-full" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Roteiro do Dia Ativo</div>
            <div className="space-y-2">
              {clients.filter(c => todayRoute.includes(c.id)).map(c => (
                <div key={c.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold">{c.name}</h4>
                    <p className="text-[10px] text-slate-400">{c.sector} • {c.contact}</p>
                  </div>
                  <button onClick={() => tryAddRoute(c.id)} className="text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'clientes' && (
          <div className="space-y-3">
            <input type="text" placeholder="Filtrar base de clientes..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white" />
            <div className="space-y-2">
              {clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(c => (
                <div key={c.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold">{c.name}</h4>
                    <p className="text-[10px] text-slate-400">Recorrência: {c.frequency} (Última: {c.lastVisitDate})</p>
                  </div>
                  <button onClick={() => tryAddRoute(c.id)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${todayRoute.includes(c.id) ? 'bg-slate-800 text-red-400' : 'bg-emerald-500 text-slate-950'}`}>
                    {todayRoute.includes(c.id) ? 'Remover' : 'Adicionar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'sistema' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <User className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 class="text-xs font-bold">{profile.name}</h3>
                <p className="text-[10px] text-slate-400">Licença ID: {profile.id}</p>
              </div>
            </div>
            <div class="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Região Comercial de Cobertura</label>
              <input type="text" value={profile.region} onChange={e => setProfile({...profile, region: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none text-white" />
            </div>
            <button onClick={handleLogout} className="w-full bg-red-950/40 text-red-400 border border-red-900/40 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">Desconectar Sistema</button>
          </div>
        )}
      </main>

      {/* TOAST SYSTEM FEEDBACK */}
      <div className="fixed bottom-16 right-4 left-4 z-50 flex flex-col gap-1.5 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-[11px] flex items-center gap-2 shadow-xl animate-fade-in">
            {t.type === 'error' ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* BOTTOM CONTROL SYSTEM */}
      <nav className="fixed bottom-0 inset-x-0 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-md p-2 flex justify-around items-center z-40">
        <button onClick={() => setCurrentTab('hoje')} className={`flex flex-col items-center flex-1 py-1 ${currentTab === 'hoje' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <Map className="w-4 h-4 mb-0.5" />
          <span className="text-[9px]">Hoje</span>
        </button>
        <button onClick={() => setCurrentTab('clientes')} className={`flex flex-col items-center flex-1 py-1 ${currentTab === 'clientes' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <Users className="w-4 h-4 mb-0.5" />
          <span className="text-[9px]">Clientes</span>
        </button>
        <button onClick={() => setCurrentTab('sistema')} className={`flex flex-col items-center flex-1 py-1 ${currentTab === 'sistema' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <User className="w-4 h-4 mb-0.5" />
          <span className="text-[9px]">Sistema</span>
        </button>
      </nav>
    </div>
  );
}