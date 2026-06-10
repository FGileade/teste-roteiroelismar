import React, { useState, useEffect, useRef } from 'react';
import { 
  Map, Sparkles, Users, Calendar, User, ShieldCheck, Lock, MapPin, Trash2, Check, X, 
  AlertTriangle, Target, Compass, Bell, Sliders, Phone, DollarSign, GraduationCap, 
  CheckSquare, RotateCcw, Info, CheckCircle, XCircle, BookOpen, BarChart3, Database, 
  Download, Upload, Plus, Search, ChevronRight 
} from 'lucide-react';

// Base de dados real inicial de Viana / ES
const REAL_VIANA_CLIENTS = [
  { id: 'viana-1', name: 'Pet Shop AgroVila Viana', sector: 'Pet Shop', lat: -20.3175, lng: -40.3912, frequency: '4x por Mês', lastVisitDate: '2026-06-03', contact: 'Maria Helena', phone: '(27) 9988-1234', address: 'Av. Florentino Avidos, 10, Centro, Viana, ES', status: true },
  { id: 'viana-2', name: 'Agropecuária Sul Viana', sector: 'Agropecuária', lat: -20.3900, lng: -40.3800, frequency: '2x por Mês', lastVisitDate: '2026-05-18', contact: 'Sr. José', phone: '(27) 3255-9876', address: 'Rua Domingos Vicente, 45, Primavera, Viana, ES', status: true },
  { id: 'viana-3', name: 'Clínica Veterinária São Francisco', sector: 'Clínica Veterinária', lat: -20.3680, lng: -40.3580, frequency: '1x por Mês', lastVisitDate: '2026-06-05', contact: 'Dra. Cláudia', phone: '(27) 9911-5544', address: 'Av. Jerônimo Monteiro, 122, Marcílio de Noronha, Viana, ES', status: true },
  { id: 'viana-4', name: 'Casa de Ração Viana', sector: 'Agropecuária', lat: -20.3810, lng: -40.3720, frequency: '4x por Mês', lastVisitDate: '2026-05-29', contact: 'Carlos', phone: '(27) 9888-0011', address: 'Rua Aspásia Varejão, 8, Centro, Viana, ES', status: true },
  { id: 'viana-5', name: 'Hospital Veterinário Pet Viana', sector: 'Hospital Veterinário', lat: -20.3700, lng: -40.3750, frequency: '2x por Mês', lastVisitDate: '2026-06-06', contact: 'Dr. Lucas', phone: '(27) 3344-2211', address: 'Rua Getúlio Vargas, 300, Areinha, Viana, ES', status: true }
];

const VISITS_HISTORY = [
  { id: 'v-1', clientId: 'viana-1', date: '2026-06-03', summary: 'Abastecido portfólio comercial. Feita colocação de folhetos.', tags: ['Venda Concluída', 'Merchandising'] },
  { id: 'v-2', clientId: 'viana-3', date: '2026-06-05', summary: 'Entrega de material técnico da linha de produtos.', tags: ['Apresentação', 'Amostras'] },
  { id: 'v-3', clientId: 'viana-5', date: '2026-06-06', summary: 'Verificação rápida de níveis de gôndola e validade.', tags: ['Relacionamento', 'Estoque Cheio'] }
];

const INITIAL_REMINDERS = [
  { id: 'rem-1', title: 'Entregar amostras grátis da linha', type: 'Outro', clientId: 'viana-2', time: '10:30', completed: false },
  { id: 'rem-2', title: 'Confirmar pagamento do boleto', type: 'Cobrar', clientId: 'viana-1', time: '14:00', completed: false }
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
  
  // Navegação por abas
  const [currentTab, setCurrentTab] = useState('hoje');
  
  // Estados da aplicação
  const [clients, setClients] = useState(() => JSON.parse(localStorage.getItem('elismar:clients')) || REAL_VIANA_CLIENTS);
  const [todayRoute, setTodayRoute] = useState(() => JSON.parse(localStorage.getItem('elismar:todayRoute')) || ['viana-1', 'viana-3']);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('elismar:history')) || VISITS_HISTORY);
  const [reminders, setReminders] = useState(() => JSON.parse(localStorage.getItem('elismar:reminders')) || INITIAL_REMINDERS);
  const [search, setSearch] = useState('');
  
  // Rotas salvas
  const [savedRoutes, setSavedRoutes] = useState(() => JSON.parse(localStorage.getItem('elismar:savedRoutes')) || []);
  const [routeCustomName, setRouteCustomName] = useState('');

  // GPS Simulado (Viana, ES)
  const [simulatedGPS, setSimulatedGPS] = useState(() => JSON.parse(localStorage.getItem('elismar:gps')) || { lat: -20.3875, lng: -40.4950 });

  // Devocional Banner
  const [showVerse, setShowVerse] = useState(true);
  const [currentVerse, setCurrentVerse] = useState({ text: '', ref: '' });
  const [readingTime, setReadingTime] = useState(0);

  // Perfil e Modais
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem('elismar:profile')) || { name: 'Elismar', email: 'elismar@gileade.com', phone: '(27) 99122-3344', region: 'Viana, ES', id: 'GIL-REP-90210' });
  const [showRepModal, setShowRepModal] = useState(false);
  const [pendingClient, setPendingClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  // Campos de formulário do cliente
  const [clientFormName, setClientFormName] = useState('');
  const [clientFormSector, setClientFormSector] = useState('Pet Shop');
  const [clientFormFreq, setClientFormFreq] = useState('4x por Mês');
  const [clientFormAddress, setClientFormAddress] = useState('');
  const [clientFormLat, setClientFormLat] = useState('');
  const [clientFormLng, setClientFormLng] = useState('');
  const [clientFormContact, setClientFormContact] = useState('');
  const [clientFormStatus, setClientFormStatus] = useState('true');
  const [editClientId, setEditClientId] = useState(null);

  // Campos de formulário de lembrete
  const [reminderFormTitle, setReminderFormTitle] = useState('');
  const [reminderFormType, setReminderFormType] = useState('Ligar');
  const [reminderFormClientId, setReminderFormClientId] = useState('');
  const [reminderFormTime, setReminderFormTime] = useState('');

  // Configurações
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('elismar:geminiKey') || '');
  const [gpsSimLat, setGpsSimLat] = useState(simulatedGPS.lat);
  const [gpsSimLng, setGpsSimLng] = useState(simulatedGPS.lng);

  // Agente IA
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponseText, setAiResponseText] = useState('');
  const [aiActions, setAiActions] = useState([]);
  const [showAiResponseArea, setShowAiResponseArea] = useState(false);

  // Relatórios
  const [activeReportId, setActiveReportId] = useState(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportHeaders, setReportHeaders] = useState([]);
  const [reportRows, setReportRows] = useState([]);

  const canvasRef = useRef(null);

  // Devocional
  useEffect(() => {
    const day = new Date().getDate();
    const verse = VERSES[day % VERSES.length];
    setCurrentVerse(verse);
    const wordsCount = verse.text.split(' ').length;
    const estimatedSeconds = Math.max(Math.ceil(wordsCount / 3.3), 3);
    setReadingTime(estimatedSeconds);
  }, []);

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

  // Persistência
  useEffect(() => {
    localStorage.setItem('elismar:clients', JSON.stringify(clients));
    localStorage.setItem('elismar:todayRoute', JSON.stringify(todayRoute));
    localStorage.setItem('elismar:history', JSON.stringify(history));
    localStorage.setItem('elismar:reminders', JSON.stringify(reminders));
    localStorage.setItem('elismar:profile', JSON.stringify(profile));
    localStorage.setItem('elismar:savedRoutes', JSON.stringify(savedRoutes));
    localStorage.setItem('elismar:gps', JSON.stringify(simulatedGPS));
    localStorage.setItem('elismar:geminiKey', geminiKey);
    if (isAuthenticated && currentTab === 'hoje') drawMap();
  }, [clients, todayRoute, history, reminders, profile, savedRoutes, simulatedGPS, geminiKey, isAuthenticated, currentTab]);

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

  const getDaysSince = (dateString) => {
    const last = new Date(dateString);
    const today = new Date('2026-06-09');
    const diffTime = Math.abs(today - last);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const tryAddRoute = (id) => {
    if (todayRoute.includes(id)) {
      setTodayRoute(prev => prev.filter(cId => cId !== id));
      addToast('Visita removida da rota do dia.');
      return;
    }
    const client = clients.find(c => c.id === id);
    const lastVisit = client.lastVisitDate ? getDaysSince(client.lastVisitDate) : 99;
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

  // Google Maps Redirection
  const handleOpenGoogleMaps = () => {
    if (todayRoute.length === 0) {
      addToast('Nenhum cliente na rota hoje.', 'error');
      return;
    }
    const origin = `${simulatedGPS.lat},${simulatedGPS.lng}`;
    const sortedRouteClients = todayRoute.map(id => clients.find(c => c.id === id)).filter(Boolean);
    const destinationClient = sortedRouteClients[sortedRouteClients.length - 1];
    const destination = `${destinationClient.lat},${destinationClient.lng}`;
    
    let waypoints = '';
    if (sortedRouteClients.length > 1) {
      const waypointsClients = sortedRouteClients.slice(0, -1);
      waypoints = '&waypoints=' + waypointsClients.map(c => `${c.lat},${c.lng}`).join('|');
    }
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints}&travelmode=driving`;
    window.open(url, '_blank');
    addToast('Redirecionando para rota no Google Maps...');
  };

  // Desenhar Mapa
  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for(let i=0; i<canvas.width; i+=40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    const gpsToScreen = (lat, lng) => {
      const scale = 8000;
      const x = canvas.width / 2 + (lng - simulatedGPS.lng) * scale;
      const y = canvas.height / 2 - (lat - simulatedGPS.lat) * scale;
      return { x, y };
    };

    // Trajeto da rota ativa
    if (todayRoute.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      let first = true;
      todayRoute.forEach(cId => {
        const c = clients.find(cl => cl.id === cId);
        if (c) {
          const { x, y } = gpsToScreen(c.lat, c.lng);
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Vendedor
    const repScreen = gpsToScreen(simulatedGPS.lat, simulatedGPS.lng);
    ctx.beginPath();
    ctx.arc(repScreen.x, repScreen.y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#10b981';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    // Pins
    clients.forEach(c => {
      const { x, y } = gpsToScreen(c.lat, c.lng);
      const isRoute = todayRoute.includes(c.id);
      const lastDays = c.lastVisitDate ? getDaysSince(c.lastVisitDate) : 99;

      let color = '#f59e0b'; // amarelo
      if (lastDays < 7) color = '#10b981'; // verde
      else if (lastDays > 30) color = '#ef4444'; // vermelho

      if (isRoute) {
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, 2*Math.PI);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
    });
  };

  useEffect(() => {
    if (isAuthenticated && currentTab === 'hoje') {
      drawMap();
    }
  }, [clients, todayRoute, simulatedGPS, currentTab, isAuthenticated]);

  const handleMapResize = () => {
    drawMap();
  };

  useEffect(() => {
    window.addEventListener('resize', handleMapResize);
    return () => window.removeEventListener('resize', handleMapResize);
  }, []);

  // CRUD Clientes
  const openNewClient = () => {
    setEditClientId(null);
    setClientFormName('');
    setClientFormSector('Pet Shop');
    setClientFormFreq('4x por Mês');
    setClientFormAddress('');
    setClientFormLat((simulatedGPS.lat + (Math.random() - 0.5) * 0.02).toFixed(4));
    setClientFormLng((simulatedGPS.lng + (Math.random() - 0.5) * 0.02).toFixed(4));
    setClientFormContact('');
    setClientFormStatus('true');
    setShowClientModal(true);
  };

  const openEditClient = (c) => {
    setEditClientId(c.id);
    setClientFormName(c.name);
    setClientFormSector(c.sector);
    setClientFormFreq(c.frequency);
    setClientFormAddress(c.address || '');
    setClientFormLat(c.lat.toFixed(4));
    setClientFormLng(c.lng.toFixed(4));
    setClientFormContact(c.contact || '');
    setClientFormStatus(c.status === false ? 'false' : 'true');
    setShowClientModal(true);
  };

  const saveClient = (e) => {
    e.preventDefault();
    const newClientData = {
      id: editClientId || `cli-${Date.now()}`,
      name: clientFormName,
      sector: clientFormSector,
      frequency: clientFormFreq,
      address: clientFormAddress,
      lat: parseFloat(clientFormLat),
      lng: parseFloat(clientFormLng),
      contact: clientFormContact,
      phone: '(27) 99' + Math.floor(1000000 + Math.random() * 9000000),
      lastVisitDate: editClientId ? (clients.find(c => c.id === editClientId)?.lastVisitDate || '2026-05-10') : '2026-05-10',
      status: clientFormStatus === 'true'
    };

    if (editClientId) {
      setClients(prev => prev.map(c => c.id === editClientId ? newClientData : c));
      addToast('Cadastro do cliente atualizado.');
    } else {
      setClients(prev => [...prev, newClientData]);
      addToast('Cliente cadastrado com sucesso.');
    }
    setShowClientModal(false);
  };

  // Rotas salvas
  const saveCurrentRouteWithName = () => {
    if (!routeCustomName.trim()) {
      addToast('Digite um nome para a rota.', 'error');
      return;
    }
    const newRoute = {
      id: `route-${Date.now()}`,
      name: routeCustomName,
      route: [...todayRoute]
    };
    setSavedRoutes(prev => [...prev, newRoute]);
    setRouteCustomName('');
    addToast('Rota comercial gravada com sucesso.');
  };

  const loadSavedRoute = (routeList) => {
    setTodayRoute(routeList);
    addToast('Rota comercial carregada.');
  };

  const deleteSavedRoute = (id) => {
    setSavedRoutes(prev => prev.filter(r => r.id !== id));
    addToast('Rota comercial excluída.');
  };

  // Check-In / Check-Out
  const triggerCheckIn = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    // Distancia
    const getDistance = (p1, p2) => {
      const R = 6371e3;
      const phi1 = p1.lat * Math.PI/180;
      const phi2 = p2.lat * Math.PI/180;
      const dPhi = (p2.lat-p1.lat) * Math.PI/180;
      const dLam = (p2.lng-p1.lng) * Math.PI/180;
      const a = Math.sin(dPhi/2) * Math.sin(dPhi/2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLam/2) * Math.sin(dLam/2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    const dist = Math.round(getDistance(simulatedGPS, client));
    if (dist > 150) {
      addToast(`Check-in feito com ressalva de distância (${dist}m).`, 'warning');
    } else {
      addToast(`Check-in validado a ${dist}m.`);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newVisit = {
      id: `v-${Date.now()}`,
      clientId: clientId,
      date: todayStr,
      summary: 'Check-in concluído pelo GPS comercial da rota.',
      tags: ['Check-in GPS', 'Abastecimento']
    };

    setClients(prev => prev.map(c => c.id === clientId ? { ...c, lastVisitDate: todayStr } : c));
    setHistory(prev => [...prev, newVisit]);
  };

  // Reminders
  const saveReminder = (e) => {
    e.preventDefault();
    const newReminder = {
      id: `rem-${Date.now()}`,
      title: reminderFormTitle,
      type: reminderFormType,
      clientId: reminderFormClientId,
      time: reminderFormTime,
      completed: false
    };
    setReminders(prev => [...prev, newReminder]);
    setShowReminderModal(false);
    setReminderFormTitle('');
    setReminderFormTime('');
    addToast('Atividade agendada com sucesso.');
  };

  const toggleReminderCompleted = (id) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
    addToast('Status da atividade alterado.');
  };

  const deleteReminder = (id) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    addToast('Atividade removida.');
  };

  // GPS Simulado
  const updateSimulatedGPS = () => {
    const lat = parseFloat(gpsSimLat);
    const lng = parseFloat(gpsSimLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setSimulatedGPS({ lat, lng });
      setShowSettingsModal(false);
      addToast('Localização simulada do representante atualizada.');
    } else {
      addToast('Coordenadas inválidas.', 'error');
    }
  };

  // Agente IA
  const triggerAIRoutePlanning = () => {
    setAiLoading(true);
    setShowAiResponseArea(true);
    setAiActions([]);

    setTimeout(() => {
      // Ordena baseado em visitas mais distantes (heurística)
      const sorted = [...clients].sort((a,b) => getDaysSince(a.lastVisitDate) - getDaysSince(b.lastVisitDate)).reverse();
      const top = sorted.slice(0, 3);

      setAiResponseText("O assistente de inteligência local traçou a pré-rota com base no menor deslocamento e na urgência de reabastecimento. As seguintes visitas são prioritárias:");
      setAiActions(top.map((c, i) => ({
        clientId: c.id,
        reason: `Visita recomendada. Ponto sem check-in da Elismar há ${getDaysSince(c.lastVisitDate)} dias.`,
        order: i + 1,
        type: 'route'
      })));
      setAiLoading(false);
    }, 1200);
  };

  const triggerAIProspecting = () => {
    setAiLoading(true);
    setShowAiResponseArea(true);
    setAiActions([]);

    setTimeout(() => {
      setAiResponseText("Dentre a varredura regional de Viana, encontramos 2 estabelecimentos com alto potencial para compra e que não estão na sua carteira comercial ativa:");
      setAiActions([
        {
          name: "Agro Pet Primavera",
          type: "Pet Shop",
          address: "Rua Domingos Vicente, Primavera, Viana, ES",
          reason: "Distribuidor local focado em grandes sacarias e rações premium. Possui alta demanda na vizinhança.",
          lat: simulatedGPS.lat + 0.005,
          lng: simulatedGPS.lng - 0.003,
          actionType: 'prospect'
        },
        {
          name: "Vila Vet Clínica Integrada",
          type: "Clínica Veterinária",
          address: "Av. Florentino Avidos, Areinha, Viana, ES",
          reason: "Clínica com fluxo diário expressivo de proprietários de pets. Excelente para ativação da linha clínica.",
          lat: simulatedGPS.lat - 0.004,
          lng: simulatedGPS.lng + 0.006,
          actionType: 'prospect'
        }
      ]);
      setAiLoading(false);
    }, 1200);
  };

  const triggerAIRouteNegotiation = () => {
    setAiLoading(true);
    setShowAiResponseArea(true);
    setAiActions([]);

    setTimeout(() => {
      setAiResponseText("Estratégias de vendas formuladas para o dia de hoje:\n\n1. **Foco no Mix Clínico**: Utilize o argumento de que a linha de especialidades médicas possui margem 25% maior no balcão.\n2. **Gatilho de Reposição**: Demonstre aos clientes com pendência de visita que o estoque local de rações de giro médio deve durar apenas mais 4 dias.\n3. **Treinamento Exclusivo**: Ofereça 15 minutos de apresentação de produto para a equipe de vendas do pet shop para fechar o pedido de giro rápido.");
      setAiLoading(false);
    }, 1200);
  };

  const applyAIRoute = (id) => {
    if (!todayRoute.includes(id)) {
      setTodayRoute(prev => [...prev, id]);
      addToast('Cliente adicionado à rota comercial do dia.');
    } else {
      addToast('Cliente já consta na rota comercial.', 'warning');
    }
  };

  const quickRegisterProspect = (p) => {
    const newCli = {
      id: `cli-${Date.now()}`,
      name: p.name,
      sector: p.type,
      frequency: '1x por Mês',
      lat: p.lat,
      lng: p.lng,
      lastVisitDate: '2026-05-01',
      contact: 'Pendente primeiro contato',
      phone: '(27) 99999-0000',
      address: p.address,
      status: true
    };
    setClients(prev => [...prev, newCli]);
    setTodayRoute(prev => [...prev, newCli.id]);
    addToast(`${p.name} adicionado à carteira e à rota de hoje!`);
  };

  // Relatórios
  const loadReport = (id) => {
    setActiveReportId(id);
    if (id === 1) {
      setReportTitle("Cobertura Comercial da Carteira");
      setReportHeaders(["Cliente", "Ramo", "Frequência", "Visitas Realizadas", "Estado"]);
      setReportRows(clients.map(c => [
        c.name,
        c.sector,
        c.frequency,
        history.filter(h => h.clientId === c.id).length.toString(),
        c.status ? "Ativo" : "Inativo"
      ]));
    } else if (id === 2) {
      setReportTitle("Desempenho Logístico e Visitas");
      setReportHeaders(["Data", "Cliente", "Resumo das Notas", "Tags"]);
      setReportRows(history.map(h => {
        const c = clients.find(cl => cl.id === h.clientId);
        return [
          h.date,
          c ? c.name : "Desconhecido",
          h.summary,
          (h.tags || []).join(', ')
        ];
      }));
    } else if (id === 3) {
      setReportTitle("Escala e Recorrência Comercial");
      setReportHeaders(["Cliente", "Recorrência", "Visitas (Junho)", "Meta Atingida"]);
      setReportRows(clients.map(c => {
        let target = 1;
        if (c.frequency.includes('4x')) target = 4;
        if (c.frequency.includes('2x')) target = 2;
        const count = history.filter(h => h.clientId === c.id && h.date.startsWith('2026-06')).length;
        return [
          c.name,
          c.frequency,
          count.toString(),
          count >= target ? "Sim ✅" : "Não ❌"
        ];
      }));
    } else if (id === 4) {
      setReportTitle("Eficiência Logística de Itinerário");
      setReportHeaders(["Ordem", "Cliente", "Distância Estimada (GPS)"]);
      const getDistance = (p1, p2) => {
        const R = 6371e3;
        const phi1 = p1.lat * Math.PI/180;
        const phi2 = p2.lat * Math.PI/180;
        const dPhi = (p2.lat-p1.lat) * Math.PI/180;
        const dLam = (p2.lng-p1.lng) * Math.PI/180;
        const a = Math.sin(dPhi/2) * Math.sin(dPhi/2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLam/2) * Math.sin(dLam/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      };
      setReportRows(todayRoute.map((id, index) => {
        const c = clients.find(cl => cl.id === id);
        return [
          (index + 1).toString(),
          c ? c.name : "Desconhecido",
          c ? `${Math.round(getDistance(simulatedGPS, c))} metros` : "N/A"
        ];
      }));
    } else if (id === 5) {
      setReportTitle("Ficha Consolidada de Feedbacks");
      setReportHeaders(["Cliente", "Contacto Principal", "Feedback de Atendimento"]);
      setReportRows(clients.map(c => {
        const lastH = [...history].filter(h => h.clientId === c.id).reverse()[0];
        return [
          c.name,
          c.contact || "N/A",
          lastH ? lastH.summary : "Nenhuma anotação registrada."
        ];
      }));
    }
  };

  const exportCSV = () => {
    if (!activeReportId) return;
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += reportHeaders.join(";") + "\n";
    reportRows.forEach(row => {
      csvContent += row.join(";") + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_${activeReportId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Relatório exportado em formato CSV.');
  };

  const printPDF = () => {
    window.print();
  };

  // Backup e Restauração
  const exportSystemBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      clients,
      history,
      todayRoute,
      reminders,
      profile
    }));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "backup_gestor_rotas.json");
    dlAnchorElem.click();
    addToast('Backup do banco exportado.');
  };

  const importSystemBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.clients && data.history && data.todayRoute) {
          setClients(data.clients);
          setHistory(data.history);
          setTodayRoute(data.todayRoute);
          if (data.reminders) setReminders(data.reminders);
          if (data.profile) setProfile(data.profile);
          addToast('Banco de dados restaurado com sucesso!');
        } else {
          addToast('Arquivo de backup inválido.', 'error');
        }
      } catch (err) {
        addToast('Erro ao processar arquivo de backup.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Renderização de login
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col justify-between p-6 text-slate-100 select-none overflow-y-auto">
        <div className="my-auto max-w-md w-full mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-2xl shadow-xl shadow-emerald-500/10">
              E
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Elismar Rota Premium</h2>
              <p className="text-xs text-slate-400">Ativação e licenciamento de sistema comercial</p>
            </div>
            <div className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-[10px] text-slate-400">
              <span>Parceiro de Tecnologia:</span>
              <strong className="text-emerald-500 font-semibold">Gileade-hub</strong>
            </div>
          </div>

          <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Usuário / Login</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500 w-4.5 h-4.5"><User size={18} /></span>
                <input 
                  type="text" 
                  value={loginUser} 
                  onChange={e => setLoginUser(e.target.value)} 
                  required 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 text-sm placeholder-slate-600" 
                  placeholder="Digite seu usuário (Elismar)" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Senha de Acesso</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500 w-4.5 h-4.5"><Lock size={18} /></span>
                <input 
                  type="password" 
                  value={loginPass} 
                  onChange={e => setLoginPass(e.target.value)} 
                  required 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 text-sm placeholder-slate-600" 
                  placeholder="Digite sua senha (elismar123)" 
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold py-3.5 rounded-xl transition duration-150 text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10">
              <ShieldCheck size={18} /> Entrar no Sistema
            </button>
          </form>
        </div>

        <div className="text-center text-[10px] text-slate-600">
          Developed by <a href="https://gileade-hub.vercel.app/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Gileade Application</a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none relative">
      
      {/* TOASTS */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 w-11/12 max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 bg-slate-900 border p-4 rounded-2xl shadow-xl w-full pointer-events-auto transition duration-300 ${t.type === 'error' ? 'border-red-500/30' : t.type === 'warning' ? 'border-amber-500/30' : 'border-emerald-500/30'}`}>
            <div className={t.type === 'error' ? 'text-red-500' : t.type === 'warning' ? 'text-amber-500' : 'text-emerald-500'}>
              {t.type === 'error' ? <XCircle size={18} /> : t.type === 'warning' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            </div>
            <div className="flex-1 text-xs text-slate-200">{t.msg}</div>
          </div>
        ))}
      </div>

      {/* MODAL ANTI REPETICAO */}
      {showRepModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 glow-amber overflow-hidden">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <AlertTriangle size={32} />
              <h3 className="text-xl font-bold tracking-tight">Visita Recente Detetada!</h3>
            </div>
            <p className="text-sm text-slate-300 mb-4">
              Você já interagiu com <span className="font-semibold text-white">{clients.find(c => c.id === pendingClient)?.name}</span> recentemente. A recorrência configurada é de <span className="text-emerald-500 font-bold">{clients.find(c => c.id === pendingClient)?.frequency}</span>.
            </p>

            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/60 mb-6 text-xs space-y-3">
              <div className="flex justify-between text-slate-400 font-semibold border-b border-slate-800/80 pb-2">
                <span>ÚLTIMO CHECK-IN</span>
                <span>{clients.find(c => c.id === pendingClient)?.lastVisitDate ? new Date(clients.find(c => c.id === pendingClient).lastVisitDate).toLocaleDateString('pt-BR') : '--/--/----'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Notas do Último Check-in:</span>
                <p className="text-slate-200 italic">
                  "{history.filter(h => h.clientId === pendingClient).reverse()[0]?.summary || 'Nenhum relatório encontrado.'}"
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setShowRepModal(false); setPendingClient(null); }} className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-sm font-semibold py-3 px-4 rounded-xl transition">
                Cancelar Rota
              </button>
              <button onClick={confirmRepetition} className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-sm font-bold py-3 px-4 rounded-xl transition">
                Confirmar Urgência
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CADASTRO CLIENTE */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">{editClientId ? 'Editar Cliente Elismar' : 'Novo Cliente Elismar'}</h3>
              <button onClick={() => setShowClientModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            
            <form onSubmit={saveClient} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Nome Fantasia</label>
                <input type="text" value={clientFormName} onChange={e => setClientFormName(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="Ex: Pet Shop Cão Feliz" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Ramo de Atividade</label>
                  <select value={clientFormSector} onChange={e => setClientFormSector(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none">
                    <option value="Pet Shop">Pet Shop</option>
                    <option value="Clínica Veterinária">Clínica Veterinária</option>
                    <option value="Agropecuária">Agropecuária</option>
                    <option value="Hospital Veterinário">Hospital Vet</option>
                    <option value="Distribuidora de Rações">Distribuidora</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Frequência Planeada</label>
                  <select value={clientFormFreq} onChange={e => setClientFormFreq(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none">
                    <option value="4x por Mês">Semanal (4x/mês)</option>
                    <option value="2x por Mês">Quinzenal (2x/mês)</option>
                    <option value="1x por Mês">Mensal (1x/mês)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Endereço Completo (Manual)</label>
                <input type="text" value={clientFormAddress} onChange={e => setClientFormAddress(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="Rua, Número, Bairro, Viana, ES" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Localização Coordenadas</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" step="0.0001" value={clientFormLat} onChange={e => setClientFormLat(e.target.value)} required className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs" placeholder="Latitude" />
                  <input type="number" step="0.0001" value={clientFormLng} onChange={e => setClientFormLng(e.target.value)} required className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs" placeholder="Longitude" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Contacto Principal</label>
                  <input type="text" value={clientFormContact} onChange={e => setClientFormContact(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white focus:outline-none" placeholder="Ex: Dr. Roberto / Gerente" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Estado Operacional</label>
                  <select value={clientFormStatus} onChange={e => setClientFormStatus(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white focus:outline-none">
                    <option value="true">Ativo</option>
                    <option value="false">Inativo / Bloqueado</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-4 rounded-xl transition duration-150 mt-2">
                Salvar Dados do Cliente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LEMBRETE */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Criar Actividade / Lembrete</h3>
              <button onClick={() => setShowReminderModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={saveReminder} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">O que precisa fazer?</label>
                <input type="text" value={reminderFormTitle} onChange={e => setReminderFormTitle(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none" placeholder="Ex: Cobrar boleto, Treinamento Balcão..." />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Tipo de Actividade</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Ligar', 'Cobrar', 'Treinar', 'Outro'].map((t) => (
                    <label key={t} className={`flex flex-col items-center justify-center p-2.5 bg-slate-950 border rounded-xl cursor-pointer hover:border-emerald-500 transition ${reminderFormType === t ? 'border-emerald-500' : 'border-slate-800'}`}>
                      <input type="radio" name="reminder-type" value={t} checked={reminderFormType === t} onChange={() => setReminderFormType(t)} className="sr-only" />
                      {t === 'Ligar' && <Phone className="w-5 h-5 text-blue-400 mb-1" />}
                      {t === 'Cobrar' && <DollarSign className="w-5 h-5 text-amber-500 mb-1" />}
                      {t === 'Treinar' && <GraduationCap className="w-5 h-5 text-purple-400 mb-1" />}
                      {t === 'Outro' && <CheckSquare className="w-5 h-5 text-slate-500 mb-1" />}
                      <span className="text-[10px]">{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Vincular Cliente</label>
                  <select value={reminderFormClientId} onChange={e => setReminderFormClientId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs text-white">
                    <option value="">Nenhum</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Hora do Alerta</label>
                  <input type="time" value={reminderFormTime} onChange={e => setReminderFormTime(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white" />
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-4 rounded-xl transition duration-150 mt-2">
                Agendar Tarefa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACOES */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Compass className="text-emerald-500 w-5 h-5" />
                <h3 className="text-xl font-bold text-white">Configurações GPS</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Chave API do Gemini</label>
                <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none text-xs" placeholder="AIzaSy... (Deixe em branco para usar runtime local)" />
                <span className="text-[10px] text-slate-500 mt-1 block">Opcional. Se em branco, usará modelo local estruturado.</span>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Simular Localização Atual</h4>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-[10px] text-slate-500">Latitude</label>
                    <input type="number" step="0.0001" value={gpsSimLat} onChange={e => setGpsSimLat(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Longitude</label>
                    <input type="number" step="0.0001" value={gpsSimLng} onChange={e => setGpsSimLng(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white" />
                  </div>
                </div>
                <button onClick={updateSimulatedGPS} className="w-full bg-slate-800 text-xs text-white py-2 rounded-xl border border-slate-700">Atualizar Coordenadas</button>
              </div>

              <button onClick={() => setShowSettingsModal(false)} className="w-full bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-xl mt-4">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-slate-900/80 border-b border-slate-800/80 backdrop-blur px-4 py-3.5 flex items-center justify-between z-40 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-sm">
            E
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              Elismar Rota <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase">PREMIUM IA</span>
            </h1>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              GPS: Viana, ES
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => addToast("Agenda do Dia: Rota Elismar ativa em Viana.", "success")} className="p-2 bg-slate-800/60 border border-slate-700/50 text-slate-300 rounded-xl hover:text-white" title="Simular Notificação Diária">
            <Bell size={16} />
          </button>
          <button onClick={() => { setGpsSimLat(simulatedGPS.lat); setGpsSimLng(simulatedGPS.lng); setShowSettingsModal(true); }} className="p-2 bg-slate-800/60 border border-slate-700/50 text-slate-300 rounded-xl hover:text-white">
            <Compass size={16} />
          </button>
        </div>
      </header>

      {/* SCROLLABLE MAIN */}
      <main className="flex-1 overflow-y-auto relative pb-20">

        {/* TAB HOJE */}
        {currentTab === 'hoje' && (
          <section className="space-y-4">
            
            {/* DEVOCIONAL */}
            {showVerse && (
              <div className="mx-4 mt-4 bg-slate-900 border border-emerald-500/20 p-4 rounded-2xl relative shadow-xl">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold uppercase">
                    <BookOpen size={16} />
                    <span>Devocional do Dia</span>
                  </div>
                  <button onClick={() => setShowVerse(false)} className="text-slate-500 hover:text-slate-300">
                    <X size={16} />
                  </button>
                </div>
                <p className="text-xs text-slate-200 italic leading-relaxed">"{currentVerse.text}"</p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/60">
                  <span>{currentVerse.ref}</span>
                  {readingTime > 0 ? (
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">Estimativa: {readingTime}s</span>
                  ) : (
                    <span className="text-emerald-500 font-bold flex items-center gap-0.5"><Check className="w-3 h-3" /> Lido</span>
                  )}
                </div>
              </div>
            )}

            {/* MAPA CANVAS */}
            <div className="relative w-full aspect-[16/10] bg-slate-900 border-y border-slate-800 overflow-hidden flex flex-col justify-between">
              <canvas ref={canvasRef} width="400" height="250" className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800/80 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 glow-green"></span>
                <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">Mapa do Dia</span>
              </div>
              <div className="absolute bottom-3 right-3 flex flex-col gap-2">
                <button onClick={handleOpenGoogleMaps} className="p-2.5 bg-emerald-500 text-slate-950 rounded-xl shadow-lg hover:bg-emerald-600 font-bold flex items-center justify-center gap-1 text-xs">
                  <MapPin size={16} /> Abrir Rota
                </button>
                <button onClick={() => setSimulatedGPS({ lat: -20.3875, lng: -40.4950 })} className="p-2 bg-slate-950/90 border border-slate-800 text-white rounded-xl shadow-lg hover:bg-slate-900">
                  <Target size={16} />
                </button>
              </div>
            </div>

            {/* STATS */}
            <div className="px-4 grid grid-cols-3 gap-2">
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Roteiro</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-white">{todayRoute.length}</span>
                  <span className="text-xs text-slate-500">visitas</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Tarefas</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-amber-500">{reminders.filter(r => !r.completed).length}</span>
                  <span className="text-xs text-slate-500">ativas</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Completo</span>
                <span className="text-xl font-bold text-emerald-500">
                  {todayRoute.length > 0 ? Math.round((todayRoute.filter(id => {
                    const c = clients.find(cl => cl.id === id);
                    return c && c.lastVisitDate === new Date().toISOString().split('T')[0];
                  }).length / todayRoute.length) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* SALVAR/CARREGAR ROTA */}
            <div className="mx-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-lg">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Map className="w-4 h-4 text-emerald-500" />
                Salvar / Carregar Rota Comercial
              </h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={routeCustomName} 
                  onChange={e => setRouteCustomName(e.target.value)} 
                  placeholder="Ex: Rota Centro, Rota Marcílio" 
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" 
                />
                <button onClick={saveCurrentRouteWithName} className="bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl active:scale-95 transition">Salvar</button>
              </div>
              
              {savedRoutes.length > 0 && (
                <div className="space-y-1.5 pt-1.5 border-t border-slate-800 max-h-32 overflow-y-auto">
                  {savedRoutes.map(r => (
                    <div key={r.id} className="flex justify-between items-center bg-slate-950 p-2 rounded-lg text-xs">
                      <span className="font-medium">{r.name} ({r.route.length} pts)</span>
                      <div className="flex gap-2">
                        <button onClick={() => loadSavedRoute(r.route)} className="text-emerald-500 font-bold">Carregar</button>
                        <button onClick={() => deleteSavedRoute(r.id)} className="text-red-400"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TIMELINE */}
            <div className="px-4 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Roteiro Ativo</h2>
                <div className="flex gap-1.5">
                  <button onClick={() => setShowReminderModal(true)} className="text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-full flex items-center gap-1">
                    <Plus size={14} /> Atividade
                  </button>
                  <button onClick={() => setTodayRoute([])} className="text-xs bg-red-950/30 border border-red-900/30 text-red-400 px-3 py-1.5 rounded-full">
                    Limpar Rota
                  </button>
                </div>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {todayRoute.length === 0 ? (
                  <div className="py-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
                    <p className="text-xs text-slate-400">Roteiro vazio. Adicione clientes na aba Clientes ou peça sugestões ao Agente IA!</p>
                  </div>
                ) : (
                  todayRoute.map((cId, idx) => {
                    const client = clients.find(c => c.id === cId);
                    if (!client) return null;
                    const isVisited = client.lastVisitDate === new Date().toISOString().split('T')[0];
                    return (
                      <div key={cId} className="relative">
                        <div className={`absolute -left-6 top-4 w-4 h-4 rounded-full border-2 bg-slate-950 flex items-center justify-center ${isVisited ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-700'}`}>
                          {isVisited && <Check size={10} />}
                        </div>
                        <div className={`border rounded-2xl p-4 flex flex-col justify-between gap-3 ${isVisited ? 'bg-slate-950/40 border-slate-900 text-slate-500' : 'bg-slate-900 border-slate-800 text-white'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500 font-bold">Ordem {idx + 1}</span>
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-1.5 py-0.2 rounded font-bold uppercase">Visita</span>
                              </div>
                              <h3 className={`text-sm font-bold tracking-tight ${isVisited ? 'line-through text-slate-600' : ''}`}>{client.name}</h3>
                              <p className="text-xs text-slate-400">{client.sector} • {client.frequency}</p>
                              {client.address && <p className="text-[10px] text-slate-500 mt-1">{client.address}</p>}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => triggerCheckIn(client.id)} className="p-2 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-450 rounded-xl transition" title="Registrar Check-in">
                                <MapPin size={16} />
                              </button>
                              <button onClick={() => setTodayRoute(prev => prev.filter(id => id !== client.id))} className="p-2 bg-slate-850 hover:text-red-400 rounded-xl transition" title="Remover da Rota">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB AGENTE IA */}
        {currentTab === 'ia' && (
          <section className="p-4 space-y-4">
            <div className="bg-gradient-to-tr from-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-5 glow-green relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
              
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Assistente Estratégico Elismar</h2>
                  <p className="text-xs text-emerald-100/70">Co-piloto comercial para prever demandas, otimizar rotas de reabastecimento e prospectar pontos na região.</p>
                </div>
              </div>

              <div className="space-y-2.5 mt-6">
                <button onClick={triggerAIRouteNegotiation} className="w-full bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-left p-4 rounded-2xl flex items-center justify-between group transition">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-500 transition">✨ Gerar Estratégias de Vendas para Hoje</span>
                    <p className="text-[11px] text-slate-400 font-medium">Argumentos de alto impacto de vendas baseados na rota atual.</p>
                  </div>
                  <Sparkles size={16} className="text-emerald-500 group-hover:scale-110 transition" />
                </button>

                <button onClick={triggerAIRoutePlanning} className="w-full bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-left p-4 rounded-2xl flex items-center justify-between group transition">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-500 transition">Organizar Minha Pré-Rota</span>
                    <p className="text-[11px] text-slate-400">Analisa proximidade e recorrência da carteira de Viana.</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-500 group-hover:text-emerald-500 transition" />
                </button>

                <button onClick={triggerAIProspecting} className="w-full bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-left p-4 rounded-2xl flex items-center justify-between group transition">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-500 transition">Localizar Clientes Próximos para Prospecção</span>
                    <p className="text-[11px] text-slate-400">Varre o mapa buscando agropecuárias e clínicas perto de si.</p>
                  </div>
                  <Compass size={18} className="text-slate-500 group-hover:text-emerald-500 transition" />
                </button>
              </div>
            </div>

            {showAiResponseArea && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Plano do Agente IA
                  </span>
                  <button onClick={() => setShowAiResponseArea(false)} className="text-xs text-slate-500">Ocultar</button>
                </div>
                
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 text-sm space-y-4">
                  {aiLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                      <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin"></div>
                      </div>
                      <span className="text-xs animate-pulse">Cruzando dados de vendas e mapas com o Gemini...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-slate-300 text-xs leading-relaxed border-b border-slate-800 pb-4 whitespace-pre-line">
                        {aiResponseText}
                      </div>

                      {aiActions.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ações Sugeridas</h4>
                          <div className="space-y-2">
                            {aiActions.map((action, idx) => (
                              <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${action.actionType === 'prospect' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                      {action.actionType === 'prospect' ? `${action.type} • Prospecção` : `Ordem ${action.order}`}
                                    </span>
                                    <h5 className="text-xs font-bold text-white mt-1">{action.name || clients.find(c => c.id === action.clientId)?.name}</h5>
                                    {action.address && <p className="text-[9px] text-slate-500">{action.address}</p>}
                                  </div>
                                  {action.actionType === 'prospect' ? (
                                    <button onClick={() => quickRegisterProspect(action)} className="text-xs bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-lg">Prospectar</button>
                                  ) : (
                                    <button onClick={() => applyAIRoute(action.clientId)} className="text-xs bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-lg">Roteirizar</button>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed">{action.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB CLIENTES */}
        {currentTab === 'clientes' && (
          <section className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Carteira Elismar</h2>
                <p className="text-xs text-slate-400">{clients.length} pontos de venda cadastrados</p>
              </div>
              <button onClick={openNewClient} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-lg transition">
                <Plus size={16} /> Novo Cadastro
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-500"><Search size={16} /></span>
              <input 
                type="text" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder-slate-550" 
                placeholder="Pesquisar por nome ou ramo..." 
              />
            </div>

            <div className="space-y-3">
              {clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.sector.toLowerCase().includes(search.toLowerCase())).map(c => {
                const inRoute = todayRoute.includes(c.id);
                const lastDays = c.lastVisitDate ? getDaysSince(c.lastVisitDate) : 99;
                let badgeColor = 'bg-emerald-500/10 text-emerald-400';
                let badgeText = 'Em Dia';
                if (lastDays >= 30) {
                  badgeColor = 'bg-red-500/10 text-red-400';
                  badgeText = 'Atrasado';
                } else if (lastDays >= 7) {
                  badgeColor = 'bg-amber-500/10 text-amber-400';
                  badgeText = 'Atenção';
                }

                return (
                  <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{c.sector}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${badgeColor}`}>{badgeText}</span>
                          {!c.status && <span className="text-[9px] bg-red-950/40 text-red-400 px-2 py-0.5 rounded-md font-bold uppercase">Bloqueado</span>}
                        </div>
                        <h3 onClick={() => openEditClient(c)} className="text-sm font-bold text-white hover:text-emerald-400 cursor-pointer transition">{c.name}</h3>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Phone size={12} /> {c.contact} • {c.phone}</p>
                      </div>
                      <button onClick={() => tryAddRoute(c.id)} className={`p-2.5 rounded-xl transition ${inRoute ? 'bg-red-950/40 text-red-400 border border-red-900/40' : 'bg-emerald-500 text-slate-950'}`}>
                        {inRoute ? <X size={18} /> : <Plus size={18} />}
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-[10px] border-t border-slate-800/60 pt-2 text-slate-450">
                      <span>Frequência: <strong className="text-white">{c.frequency}</strong></span>
                      <span>Última visita: <strong className="text-white">{c.lastVisitDate ? new Date(c.lastVisitDate).toLocaleDateString('pt-BR') : 'Sem registro'} ({lastDays}d)</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB ESCALAS */}
        {currentTab === 'escalas' && (
          <section className="p-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
              <h2 className="text-lg font-bold text-white tracking-tight mb-2">Escalas de Visitas Ativas</h2>
              <p className="text-xs text-slate-400 mb-4">Acompanhe se a meta de frequência de visitas da Elismar está sendo cumprida.</p>
              
              <div className="space-y-4">
                {clients.map(c => {
                  let target = 1;
                  if (c.frequency.includes('4x')) target = 4;
                  if (c.frequency.includes('2x')) target = 2;
                  
                  // Simula contagem de visitas neste mês (Junho de 2026)
                  const count = history.filter(h => h.clientId === c.id && h.date.startsWith('2026-06')).length;
                  const perc = Math.min(Math.round((count / target) * 100), 100);

                  return (
                    <div key={c.id} className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-350 font-semibold">
                        <span className="text-white">{c.name}</span>
                        <span>{count} / {target} visitas ({perc}%)</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-450 h-full rounded-full" style={{ width: `${perc}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compromissos Agendados</h3>
                <button onClick={() => { setReminderFormClientId(''); setShowReminderModal(true); }} className="text-xs text-emerald-500 font-bold">+ Novo</button>
              </div>

              <div className="space-y-3">
                {reminders.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs py-4">Nenhuma tarefa pendente hoje.</div>
                ) : (
                  reminders.map(rem => {
                    const client = clients.find(c => c.id === rem.clientId);
                    return (
                      <div key={rem.id} className="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500">
                            {rem.type === 'Ligar' && <Phone className="w-4 h-4 text-blue-400" />}
                            {rem.type === 'Cobrar' && <DollarSign className="w-4 h-4 text-amber-500" />}
                            {rem.type === 'Treinar' && <GraduationCap className="w-4 h-4 text-purple-400" />}
                            {rem.type === 'Outro' && <CheckSquare className="w-4 h-4 text-slate-500" />}
                          </div>
                          <div>
                            <h4 className={`text-xs font-bold text-slate-100 ${rem.completed ? 'line-through text-slate-500' : ''}`}>{rem.title}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">Alerta às {rem.time} {client ? `• ${client.name}` : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => toggleReminderCompleted(rem.id)} className="p-1.5 text-slate-400 hover:text-white transition">
                            <Check size={16} />
                          </button>
                          <button onClick={() => deleteReminder(rem.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB SISTEMA */}
        {currentTab === 'sistema' && (
          <section className="p-4 space-y-4">
            
            {/* RELATÓRIOS */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="text-emerald-500 w-5 h-5" /> Painel de Relatórios Gerenciais
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Consulte e extraia relatórios consolidados em tempo real com exportação direta para Excel (CSV) ou impressão profissional (PDF).
              </p>
              
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 1, text: "📊 1. Cobertura Comercial da Carteira" },
                  { id: 2, text: "📈 2. Desempenho Logístico e Visitas" },
                  { id: 3, text: "🎯 3. Escala e Recorrência Comercial" },
                  { id: 4, text: "🚗 4. Eficiência Logística de Itinerário" },
                  { id: 5, text: "📝 5. Ficha Consolidada de Feedbacks" }
                ].map(r => (
                  <button key={r.id} onClick={() => loadReport(r.id)} className={`w-full hover:bg-slate-950 border text-left p-3 rounded-xl flex justify-between items-center group transition text-xs font-semibold ${activeReportId === r.id ? 'bg-slate-950 border-emerald-500/40 text-emerald-400' : 'bg-slate-950/80 border-slate-800 text-slate-350'}`}>
                    <span>{r.text}</span>
                    <ChevronRight size={16} className="text-slate-500 group-hover:text-emerald-500 transition" />
                  </button>
                ))}
              </div>

              {activeReportId && (
                <div id="print-section" className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">{reportTitle}</h4>
                    <div className="flex gap-2 print:hidden">
                      <button onClick={exportCSV} className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 text-[10px] px-2.5 py-1 rounded-lg border border-emerald-500/20 font-bold transition">CSV</button>
                      <button onClick={printPDF} className="bg-blue-500/10 hover:bg-blue-500 hover:text-slate-950 text-blue-400 text-[10px] px-2.5 py-1 rounded-lg border border-blue-500/20 font-bold transition">PDF/Print</button>
                      <button onClick={() => setActiveReportId(null)} className="text-slate-400 hover:text-white"><X size={14} /></button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          {reportHeaders.map((h, i) => <th key={i} className="py-2 px-1 font-semibold">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {reportRows.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-slate-900/60 hover:bg-slate-900/40 text-slate-200">
                            {row.map((val, cIdx) => <td key={cIdx} className="py-2 px-1">{val}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* BACKUP */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="text-emerald-500 w-5 h-5" /> Cópia de Segurança & Restauração
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exporte toda a base de dados do Elismar para salvaguarda externa ou faça o upload de um backup anterior para restaurar as informações.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={exportSystemBackup} className="bg-slate-850 hover:bg-slate-800 active:scale-95 text-xs text-slate-200 py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition">
                  <Download className="w-4 h-4 text-emerald-500" /> Exportar Backup
                </button>
                
                <label className="bg-slate-850 hover:bg-slate-800 active:scale-95 text-xs text-slate-200 py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer text-center">
                  <Upload className="w-4 h-4 text-amber-500" /> Restaurar Banco
                  <input type="file" onChange={importSystemBackup} className="sr-only" accept=".json" />
                </label>
              </div>
            </div>

            {/* PERFIL */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 font-bold border border-slate-700">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{profile.name}</h3>
                  <span className="text-xs text-slate-400">ID: {profile.id}</span>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); addToast('Dados cadastrais gravados.'); }} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-405 mb-1.5">Nome Completo</label>
                  <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-405 mb-1.5">E-mail Comercial</label>
                    <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-405 mb-1.5">Telemóvel</label>
                    <input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-405 mb-1.5">Região de Atuação</label>
                  <input type="text" value={profile.region} onChange={e => setProfile({...profile, region: e.target.value})} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
                </div>

                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition">
                  Gravar Dados do Perfil
                </button>
              </form>
            </div>

            {/* SEGURANÇA */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Lock className="text-amber-500 w-4 h-4" /> Segurança de Acesso
              </h3>
              <form onSubmit={(e) => { e.preventDefault(); addToast('Senha de acesso alterada com sucesso.'); }} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-405 mb-1.5">Senha Atual</label>
                  <input type="password" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="Digite sua senha atual" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-405 mb-1.5">Nova Senha</label>
                    <input type="password" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="Mínimo 6 dígitos" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-405 mb-1.5">Confirmar Nova</label>
                    <input type="password" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="Confirme a senha" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-850 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition">
                  Alterar Senha de Acesso
                </button>
              </form>
            </div>

            {/* LOGOUT */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center">
              <p className="text-xs text-slate-400 mb-3">Deseja remover as chaves de acesso deste dispositivo?</p>
              <button onClick={handleLogout} className="bg-red-950/40 text-red-400 border border-red-900/40 px-6 py-2.5 rounded-full text-xs hover:bg-red-900/20 active:scale-95 transition">
                Revogar Licença / Sair
              </button>
            </div>

          </section>
        )}

      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 inset-x-0 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-xl px-1 py-2 flex justify-around items-center z-40">
        {[
          { id: 'hoje', text: 'Hoje', icon: <Map size={20} /> },
          { id: 'ia', text: 'Agente IA', icon: <Sparkles size={20} /> },
          { id: 'clientes', text: 'Clientes', icon: <Users size={20} /> },
          { id: 'escalas', text: 'Escalas', icon: <Calendar size={20} /> },
          { id: 'sistema', text: 'Sistema', icon: <User size={20} /> }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setCurrentTab(tab.id)} 
            className={`flex flex-col items-center justify-center flex-1 py-1 transition ${currentTab === tab.id ? 'text-emerald-500 font-bold' : 'text-slate-500 hover:text-slate-350'}`}
          >
            {tab.icon}
            <span className="text-[9px] font-semibold mt-0.5">{tab.text}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}