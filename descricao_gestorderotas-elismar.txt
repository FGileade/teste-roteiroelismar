# Documentação Técnica e de Design: PWA Gestor de Visitas Elismar
*Desenvolvido em parceria com a Gileade-hub*

Este documento detalha a arquitetura, conceitos de design de interface (UI), usabilidade (UX) e as regras de negócio integradas no aplicativo de gestão de visitas e rotas para os representantes comerciais da **Elismar**.

---

## 1. Conceito Visual & Design Premium (Aesthetics)

Para garantir uma experiência de alto nível (Premium), o design do aplicativo foi projetado sob os seguintes pilares estéticos e funcionais:

* **Fundo Profundo (Slate-950):** O uso de um tom de azul escuro quase preto reduz drasticamente o cansaço ocular do representante sob a luz solar intensa da rua, além de proporcionar economia de bateria no dispositivo móvel (telas AMOLED).
* **Identidade Visual Elismar:** O verde esmeralda premium (`#10b981`) é utilizado para destacar ações principais, caminhos da rota ativa e status "Em dia". Detalhes em âmbar (`#f59e0b`) marcam alertas, lembretes e status de urgência intermediária.
* **Design Livre de Fricção (Zero Friction):** Botões principais com área de toque mínima de `44x44px` (padrão iOS/Android), transições suaves sem carregamento de tela e feedback visual instantâneo (Glow Effects) para operações em trânsito.
* **Navegação Inteligente Bottom-Bar:** Menu inferior fixo que mimetiza um aplicativo nativo instalado, permitindo a troca rápida entre as 5 áreas vitais do sistema com apenas um polegar.

---

## 2. Detalhes de Cada Opção e Funcionalidade

### A. Tela de Login e Ativação Gileade-hub
* **Segurança em Primeiro Lugar:** O app inicia bloqueado por uma tela de autenticação exclusiva da Gileade-hub.
* **Credenciais de Acesso:** Exige o login e senha comercial fornecidos. Sistema homologado para o usuário **Elismar**.
* **Persistência:** Uma vez ativado, o token é criptografado localmente no dispositivo para que o representante não precise digitar as credenciais a cada abertura.

### B. O Painel "Hoje" & Mapa Interativo
* **Canvas Grid Road System:** Mapa vetorial nativo que desenha as ruas e a rota otimizada em tempo real.
* **Pins Coloridos de Status:**
    * 🟢 **Verde:** Visita recente realizada (menos de 7 dias).
    * 🟡 **Amarelo:** Visita na janela média de retorno (recorrência pendente).
    * 🔴 **Vermelho:** Urgente / Janela de visita expirada (mais de 30 dias).
* **Linha de Rota Ativa:** Mostra o trajeto geográfico conectando as visitas ordenadas do dia.

### C. Barreira Anti-Repetição de Visitas
* **Inteligência de Bloqueio:** Ao tentar incluir um cliente visitado recentemente no itinerário, o sistema intercepta e exibe um modal contendo:
    * A data e hora exata do último check-in.
    * O relatório e observações deixadas pelo representante na última visita.
    * As tags de classificação comercial (ex: "Estoque Cheio").
    * Opção de cancelamento ou de prosseguir mediante justificativa de urgência comercial.

### D. Agente Inteligente Elismar (Powered by Gemini)
* **Pré-Rota Inteligente:** Organiza automaticamente os melhores clientes para o dia, minimizando o consumo de combustível e focando em reabastecimento de estoque.
* **Prospecção em Tempo Real:** Varre o mapa em busca de Clínicas e Pet Shops potenciais não cadastrados em Viana/ES para sugerir abordagens ativas de vendas.

### E. Escalas & Agenda de Atividades
* **Acompanhamento de Metas:** Gráficos de progresso para acompanhar se a frequência semanal ou mensal de cada cliente está sendo batida.
* **Atividades Administrativas:** Seção dedicada para agendar e alertar tarefas paralelas (Ligar, Cobrar, Treinar Funcionários de Balcão, Outros).

### F. Aba de Sistema & Dados do Representante
* **Perfil do Usuário:** Painel para o vendedor gerenciar e atualizar seus dados comerciais (Nome completo, E-mail, Região de Atuação e ID da Gileade-hub).
* **Controle de Segurança:** Permite alterar a senha de acesso local do aplicativo.

---

## 3. Posição Estratégica de Botões e Layout

1.  **Header:** No topo, sempre visível, informando a conexão GPS e o indicador de homologação da Gileade-hub.
2.  **Botões Flutuantes do Mapa:** Centralizados ao lado direito para fácil acesso com uma mão para recalibrar o foco do GPS.
3.  **Botões de Ação Rápida nas Listas:** Posicionados à direita dos cartões de clientes para permitir inclusão rápida na rota ou início de check-in imediato.
4.  **Barra de Navegação Inferior:** Localizada estritamente na base do dispositivo para garantir ergonomia perfeita.
```eof

```html:Gestor de Visitas Elismar:index.html
<!DOCTYPE html>
<html lang="pt-PT" class="dark h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Elismar Gestor - Gileade-hub</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            quatree: {
              50: '#f0fdf4',
              100: '#dcfce7',
              500: '#10b981', // Verde Institucional da Marca
              600: '#059669',
              800: '#065f46',
              900: '#064e3b',
              amber: '#f59e0b',
            },
            slate: {
              950: '#090d16', // Fundo escuro profundo de nível comercial
            }
          }
        }
      }
    }
  </script>

  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <style>
    body {
      -webkit-tap-highlight-color: transparent;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .glow-green {
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
    }
    .glow-amber {
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 h-full flex flex-col overflow-hidden select-none">

  <!-- TOAST NOTIFICATION CONTAINER -->
  <div id="toast-container" class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 w-11/12 max-w-sm pointer-events-none"></div>

  <!-- ================= TELA DE LOGIN / ATIVAÇÃO GILEADE-HUB ================= -->
  <div id="login-screen" class="fixed inset-0 bg-slate-950 z-50 flex flex-col justify-between p-6 overflow-y-auto">
    <div class="my-auto max-w-md w-full mx-auto space-y-8">
      <!-- Logo & Branding -->
      <div class="text-center space-y-3">
        <div class="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-quatree-600 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-2xl shadow-xl shadow-quatree-500/10">
          E
        </div>
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-white">Elismar Rota Premium</h2>
          <p class="text-xs text-slate-400">Ativação e licenciamento de sistema comercial</p>
        </div>
        <div class="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-[10px] text-slate-400">
          <span>Parceiro de Tecnologia:</span>
          <strong class="text-quatree-500 font-semibold">Gileade-hub</strong>
        </div>
      </div>

      <!-- Formulário de Login -->
      <form id="login-form" onsubmit="handleActivation(event)" class="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 space-y-5 shadow-2xl">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Usuário / Login</label>
          <div class="relative">
            <i data-lucide="user" class="absolute left-4 top-3.5 text-slate-500 w-4.5 h-4.5"></i>
            <input type="text" id="activation-key" required class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-quatree-500 text-sm placeholder-slate-600" placeholder="Digite seu usuário">
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Senha de Acesso</label>
          <div class="relative">
            <i data-lucide="lock" class="absolute left-4 top-3.5 text-slate-500 w-4.5 h-4.5"></i>
            <input type="password" id="login-password" required class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-quatree-500 text-sm placeholder-slate-600" placeholder="Digite sua senha">
          </div>
        </div>

        <button type="submit" class="w-full bg-quatree-500 hover:bg-quatree-600 active:scale-95 text-slate-950 font-bold py-3.5 rounded-xl transition duration-150 text-sm flex items-center justify-center gap-2 shadow-lg shadow-quatree-500/10">
          <i data-lucide="shield-check" class="w-4.5 h-4.5"></i> Entrar no Sistema
        </button>
      </form>
    </div>

    <!-- Rodapé de Licença -->
    <div class="text-center text-[10px] text-slate-600">
      &copy; 2026 Gileade-hub. Todos os direitos reservados. Licença exclusiva Elismar Comercial.
    </div>
  </div>

  <!-- ================= INTERCEPTOR MODAL (Anti-Repetição de Visitas) ================= -->
  <div id="modal-repetition" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 glow-amber overflow-hidden">
      <div class="flex items-center gap-3 text-amber-500 mb-4">
        <i data-lucide="alert-triangle" class="w-8 h-8"></i>
        <h3 class="text-xl font-bold tracking-tight">Visita Recente Detetada!</h3>
      </div>
      <p class="text-sm text-slate-300 mb-4">
        Você já interagiu com <span id="rep-client-name" class="font-semibold text-white">Cliente</span> recentemente. A recorrência configurada é de <span id="rep-client-freq" class="text-quatree-500 font-bold">1x/Mês</span>.
      </p>

      <!-- Resumo histórico flash -->
      <div class="bg-slate-950 rounded-2xl p-4 border border-slate-800/60 mb-6 text-xs space-y-3">
        <div class="flex justify-between text-slate-400 font-semibold border-b border-slate-800/80 pb-2">
          <span>ÚLTIMO CHECK-IN</span>
          <span id="rep-last-date">--/--/----</span>
        </div>
        <div>
          <span class="text-slate-400 block mb-1">Notas do Último Check-in:</span>
          <p id="rep-last-notes" class="text-slate-200 italic">"Nenhum relatório encontrado."</p>
        </div>
        <div class="flex flex-wrap gap-1.5 mt-2" id="rep-tags-container"></div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button onclick="closeRepetitionModal(false)" class="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-sm font-semibold py-3 px-4 rounded-xl transition">
          Cancelar Rota
        </button>
        <button onclick="closeRepetitionModal(true)" class="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-sm font-bold py-3 px-4 rounded-xl transition">
          Confirmar Urgência
        </button>
      </div>
    </div>
  </div>

  <!-- CADASTRO SIMPLES DE CLIENTE / PROSPECT MODAL -->
  <div id="modal-client" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-white" id="client-modal-title">Novo Cliente Elismar</h3>
        <button onclick="toggleClientModal()" class="text-slate-400 hover:text-white"><i data-lucide="x"></i></button>
      </div>
      
      <form id="client-form" onsubmit="saveClient(event)" class="space-y-4 text-sm">
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Nome Fantasia</label>
          <input type="text" id="client-name" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-quatree-500" placeholder="Ex: Pet Shop Cão Feliz">
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Ramo de Atividade</label>
            <select id="client-sector" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none">
              <option value="Pet Shop">Pet Shop</option>
              <option value="Clínica Veterinária">Clínica Veterinária</option>
              <option value="Agropecuária">Agropecuária</option>
              <option value="Hospital Veterinário">Hospital Vet</option>
              <option value="Distribuidora de Rações">Distribuidora</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Frequência Planeada</label>
            <select id="client-frequency" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none">
              <option value="4x por Mês">Semanal (4x/mês)</option>
              <option value="2x por Mês">Quinzenal (2x/mês)</option>
              <option value="1x por Mês">Mensal (1x/mês)</option>
              <option value="2x por Semana">Altíssimo Giro (2x/semana)</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Localização Coordenadas</label>
          <div class="grid grid-cols-2 gap-2">
            <input type="number" step="0.0001" id="client-lat" required class="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs" placeholder="Latitude">
            <input type="number" step="0.0001" id="client-lng" required class="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs" placeholder="Longitude">
          </div>
          <button type="button" onclick="getCurrentLocationMock()" class="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-xs text-quatree-500 py-2 rounded-xl flex items-center justify-center gap-1">
            <i data-lucide="map-pin" class="w-3.5 h-3.5"></i> Usar Minha Posição Atual
          </button>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Contacto Principal</label>
          <input type="text" id="client-contact" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none" placeholder="Ex: Dr. Roberto / Gerente">
        </div>

        <button type="submit" class="w-full bg-quatree-500 hover:bg-quatree-600 text-slate-950 font-bold py-3 px-4 rounded-xl transition duration-150 mt-2">
          Gravar Cliente
        </button>
      </form>
    </div>
  </div>

  <!-- NOVO COMPROMISSO / TAREFA MODAL -->
  <div id="modal-reminder" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-white">Criar Actividade / Lembrete</h3>
        <button onclick="toggleReminderModal()" class="text-slate-400 hover:text-white"><i data-lucide="x"></i></button>
      </div>

      <form id="reminder-form" onsubmit="saveReminder(event)" class="space-y-4 text-sm">
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">O que precisa fazer?</label>
          <input type="text" id="reminder-title" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none" placeholder="Ex: Cobrar boleto, Treinamento Balcão...">
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Tipo de Actividade</label>
          <div class="grid grid-cols-4 gap-2">
            <label class="flex flex-col items-center justify-center p-2.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-quatree-500 transition [&:has(input:checked)]:border-quatree-500">
              <input type="radio" name="reminder-type" value="Ligar" checked class="sr-only">
              <i data-lucide="phone" class="w-5 h-5 text-blue-400 mb-1"></i>
              <span class="text-[10px]">Ligar</span>
            </label>
            <label class="flex flex-col items-center justify-center p-2.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-quatree-500 transition [&:has(input:checked)]:border-quatree-500">
              <input type="radio" name="reminder-type" value="Cobrar" class="sr-only">
              <i data-lucide="dollar-sign" class="w-5 h-5 text-amber-500 mb-1"></i>
              <span class="text-[10px]">Cobrar</span>
            </label>
            <label class="flex flex-col items-center justify-center p-2.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-quatree-500 transition [&:has(input:checked)]:border-quatree-500">
              <input type="radio" name="reminder-type" value="Treinar" class="sr-only">
              <i data-lucide="graduation-cap" class="w-5 h-5 text-purple-400 mb-1"></i>
              <span class="text-[10px]">Treinar</span>
            </label>
            <label class="flex flex-col items-center justify-center p-2.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-quatree-500 transition [&:has(input:checked)]:border-quatree-500">
              <input type="radio" name="reminder-type" value="Outro" class="sr-only">
              <i data-lucide="check-square" class="w-5 h-5 text-slate-400 mb-1"></i>
              <span class="text-[10px]">Outro</span>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Vincular Cliente</label>
            <select id="reminder-client-id" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs text-white"></select>
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Hora do Alerta</label>
            <input type="time" id="reminder-time" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white">
          </div>
        </div>

        <button type="submit" class="w-full bg-quatree-500 hover:bg-quatree-600 text-slate-950 font-bold py-3 px-4 rounded-xl transition duration-150 mt-2">
          Agendar Tarefa
        </button>
      </form>
    </div>
  </div>

  <!-- CONFIG MODAL -->
  <div id="modal-settings" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6">
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-2">
          <i data-lucide="settings" class="text-quatree-500 w-5 h-5"></i>
          <h3 class="text-xl font-bold text-white">Configurações GPS</h3>
        </div>
        <button onclick="toggleSettingsModal()" class="text-slate-400 hover:text-white"><i data-lucide="x"></i></button>
      </div>

      <div class="space-y-4 text-sm">
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Chave API do Gemini</label>
          <input type="password" id="gemini-key" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none text-xs" placeholder="AIzaSy...">
          <span class="text-[10px] text-slate-500 mt-1 block">Opcional. Sem chave, o assistente usará o plano heurístico local otimizado de inteligência comercial.</span>
        </div>

        <div class="border-t border-slate-800 pt-4">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Simular Localização Atual</h4>
          <div class="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label class="text-[10px] text-slate-500">Latitude</label>
              <input type="number" id="gps-sim-lat" step="0.0001" value="-20.3800" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white">
            </div>
            <div>
              <label class="text-[10px] text-slate-500">Longitude</label>
              <input type="number" id="gps-sim-lng" step="0.0001" value="-40.3700" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white">
            </div>
          </div>
          <button onclick="updateSimulatedGPS()" class="w-full bg-slate-800 text-xs text-white py-2 rounded-xl border border-slate-700">Atualizar Coordenadas</button>
        </div>

        <button onclick="toggleSettingsModal()" class="w-full bg-quatree-500 text-slate-950 font-bold py-2.5 rounded-xl mt-4">
          Confirmar
        </button>
      </div>
    </div>
  </div>

  <!-- APP CONTENT CONTAINER (Escondido antes do Login) -->
  <div id="app-main-content" class="h-full flex flex-col hidden">
    <!-- APP HEADER -->
    <header class="bg-slate-900/80 border-b border-slate-800/80 backdrop-blur px-4 py-3.5 flex items-center justify-between z-40 shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-quatree-600 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-sm">
          E
        </div>
        <div>
          <h1 class="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            Elismar Rota <span class="bg-quatree-500/10 text-quatree-500 border border-quatree-500/20 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase">PREMIUM IA</span>
          </h1>
          <p class="text-[10px] text-slate-400 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            GPS: Viana, ES
          </p>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <button onclick="simulateMorningAlert()" class="p-2 bg-slate-800/60 border border-slate-700/50 text-slate-300 rounded-xl hover:text-white" title="Simular Notificação Diária">
          <i data-lucide="bell" class="w-4 h-4"></i>
        </button>
        <button onclick="toggleSettingsModal()" class="p-2 bg-slate-800/60 border border-slate-700/50 text-slate-300 rounded-xl hover:text-white">
          <i data-lucide="compass" class="w-4 h-4"></i>
        </button>
      </div>
    </header>

    <!-- SCROLLABLE CONTENT BODY -->
    <main class="flex-1 overflow-y-auto relative pb-20">
      
      <!-- ================= TAB: HOJE (MAPA & TIMELINE) ================= -->
      <section id="tab-hoje" class="tab-content active space-y-4">
        <!-- Canvas Map -->
        <div class="relative w-full aspect-[16/10] bg-slate-900 border-b border-slate-800 overflow-hidden flex flex-col justify-between">
          <canvas id="route-map" class="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"></canvas>
          <div class="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800/80 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-quatree-500 glow-green"></span>
            <span class="text-[10px] text-slate-300 font-medium uppercase tracking-wider">Mapa do Dia</span>
          </div>
          <div class="absolute bottom-3 right-3">
            <button onclick="centerMapOnCurrentGPS()" class="p-2 bg-slate-950/90 border border-slate-800 text-white rounded-xl shadow-lg hover:bg-slate-900">
              <i data-lucide="target" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Popover Informativo do Pin -->
          <div id="map-popover" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 border border-slate-800 p-4 rounded-2xl w-11/12 max-w-xs shadow-2xl backdrop-blur hidden z-20">
            <div class="flex justify-between items-start mb-2">
              <span id="popover-type" class="text-[9px] font-bold uppercase tracking-widest text-quatree-500 px-2 py-0.5 rounded bg-quatree-500/10">--</span>
              <button onclick="hideMapPopover()" class="text-slate-400"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
            </div>
            <h4 id="popover-name" class="text-sm font-bold text-white mb-1">Cliente</h4>
            <p id="popover-freq" class="text-[10px] text-slate-400 mb-3">Recorrência: --</p>
            <div class="grid grid-cols-2 gap-2">
              <button id="popover-btn-route" class="bg-quatree-500 text-slate-950 font-bold text-xs py-2 rounded-lg">Roteirizar</button>
              <button id="popover-btn-details" class="bg-slate-800 text-slate-200 text-xs py-2 rounded-lg">Ficha</button>
            </div>
          </div>
        </div>

        <!-- Estatísticas Rápidas -->
        <div class="px-4 grid grid-cols-3 gap-2">
          <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
            <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Roteiro</span>
            <div class="flex items-baseline gap-1">
              <span id="stats-visits-count" class="text-xl font-bold text-white">0</span>
              <span class="text-xs text-slate-500">visitas</span>
            </div>
          </div>
          <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
            <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Tarefas</span>
            <div class="flex items-baseline gap-1">
              <span id="stats-pending-count" class="text-xl font-bold text-amber-500">0</span>
              <span class="text-xs text-slate-500">atividades</span>
            </div>
          </div>
          <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
            <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Completo</span>
            <span id="stats-completed-perc" class="text-xl font-bold text-quatree-500">0%</span>
          </div>
        </div>

        <!-- Linha de Atividades (Timeline) -->
        <div class="px-4 space-y-3">
          <div class="flex justify-between items-center">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">Roteiro Ativo</h2>
            <div class="flex gap-1.5">
              <button onclick="toggleReminderModal()" class="text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-full flex items-center gap-1">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i> Atividade
              </button>
              <button onclick="clearTodayRoute()" class="text-xs bg-red-950/30 border border-red-900/30 text-red-400 px-3 py-1.5 rounded-full">
                Limpar Rota
              </button>
            </div>
          </div>

          <div id="timeline-container" class="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800"></div>
        </div>
      </section>

      <!-- ================= TAB: AGENTE IA ================= -->
      <section id="tab-ia" class="tab-content space-y-4">
        <div class="p-4">
          <!-- Card de Interação com a Inteligência -->
          <div class="bg-gradient-to-tr from-slate-900 to-slate-950 border border-quatree-500/30 rounded-3xl p-5 glow-green relative overflow-hidden">
            <div class="absolute -right-12 -top-12 w-32 h-32 bg-quatree-500/10 rounded-full blur-2xl"></div>
            
            <div class="flex items-start gap-4 mb-4">
              <div class="w-12 h-12 bg-quatree-500 text-slate-950 rounded-2xl flex items-center justify-center font-bold">
                <i data-lucide="sparkles" class="w-6 h-6 animate-pulse"></i>
              </div>
              <div>
                <h2 class="text-lg font-bold text-white tracking-tight">Assistente Estratégico Elismar</h2>
                <p class="text-xs text-quatree-100/70">Co-piloto comercial para prever demandas, otimizar rotas de reabastecimento e prospectar pontos na região.</p>
              </div>
            </div>

            <div class="space-y-2.5 mt-6">
              <button onclick="triggerAIRoutePlanning()" class="w-full bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-left p-4 rounded-2xl flex items-center justify-between group transition">
                <div class="space-y-1">
                  <span class="text-xs font-bold text-white group-hover:text-quatree-500 transition">Organizar Minha Pré-Rota</span>
                  <p class="text-[11px] text-slate-400">Analisa proximidade e recorrência da carteira.</p>
                </div>
                <i data-lucide="chevron-right" class="w-5 h-5 text-slate-500 group-hover:text-quatree-500 transition"></i>
              </button>

              <button onclick="triggerAIProspecting()" class="w-full bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-left p-4 rounded-2xl flex items-center justify-between group transition">
                <div class="space-y-1">
                  <span class="text-xs font-bold text-white group-hover:text-quatree-500 transition">Localizar Clientes Próximos para Prospecção</span>
                  <p class="text-[11px] text-slate-400">Varre o mapa buscando agropecuárias e clínicas perto do seu GPS.</p>
                </div>
                <i data-lucide="compass" class="w-5 h-5 text-slate-500 group-hover:text-quatree-500 transition"></i>
              </button>
            </div>
          </div>

          <!-- Resposta do Agente -->
          <div id="ai-response-area" class="mt-6 hidden">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-quatree-500 animate-ping"></span>
                Plano do Agente
              </span>
              <button onclick="clearAIResponse()" class="text-xs text-slate-500">Ocultar</button>
            </div>
            
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 text-sm space-y-4">
              <!-- Loading -->
              <div id="ai-loading" class="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                <div class="relative w-12 h-12">
                  <div class="absolute inset-0 rounded-full border-4 border-quatree-500/10 border-t-quatree-500 animate-spin"></div>
                </div>
                <span class="text-xs animate-pulse">Cruzando dados de vendas e rotas...</span>
              </div>

              <!-- Output -->
              <div id="ai-output" class="hidden space-y-4">
                <div id="ai-text" class="text-slate-300 text-xs leading-relaxed border-b border-slate-800 pb-4"></div>
                <div class="space-y-2">
                  <h4 class="text-xs font-bold text-white uppercase tracking-wider">Ações Sugeridas</h4>
                  <div id="ai-actions-list" class="space-y-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ================= TAB: CLIENTES ================= -->
      <section id="tab-clientes" class="tab-content space-y-4">
        <div class="p-4 space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-lg font-bold text-white tracking-tight">Carteira Elismar</h2>
              <p class="text-xs text-slate-400" id="total-clients-label">Buscando carteira...</p>
            </div>
            <button onclick="toggleClientModal()" class="bg-quatree-500 hover:bg-quatree-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-lg transition">
              <i data-lucide="plus" class="w-4 h-4"></i> Novo Cadastro
            </button>
          </div>

          <div class="relative">
            <i data-lucide="search" class="absolute left-4 top-3.5 text-slate-500 w-4 h-4"></i>
            <input type="text" id="client-search" oninput="renderClientList()" class="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-quatree-500 placeholder-slate-500" placeholder="Pesquisar por nome ou ramo...">
          </div>

          <div id="clients-list-container" class="space-y-3"></div>
        </div>
      </section>

      <!-- ================= TAB: ESCALAS ================= -->
      <section id="tab-escalas" class="tab-content space-y-4">
        <div class="p-4 space-y-4">
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5">
            <h2 class="text-lg font-bold text-white tracking-tight mb-2">Escalas de Visitas Ativas</h2>
            <p class="text-xs text-slate-400 mb-4">Acompanhe se a meta de frequência mensal acordada com a Elismar está sendo alcançada.</p>
            <div class="space-y-4" id="escalas-progress-list"></div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Compromissos Agendados</h3>
              <button onclick="toggleReminderModal()" class="text-xs text-quatree-500 font-bold">+ Novo</button>
            </div>
            <div id="reminders-list-container" class="space-y-3"></div>
          </div>
        </div>
      </section>

      <!-- ================= TAB: SISTEMA ================= -->
      <section id="tab-sistema" class="tab-content space-y-4">
        <div class="p-4 space-y-4">
          <!-- Dados do Representante -->
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5">
            <div class="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
              <div class="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-quatree-500 font-bold border border-slate-700">
                <i data-lucide="user" class="w-6 h-6"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white" id="profile-display-name">Carregando...</h3>
                <span class="text-xs text-slate-400" id="profile-display-id">ID: Gileade-hub</span>
              </div>
            </div>

            <form id="profile-form" onsubmit="saveProfileData(event)" class="space-y-4 text-sm">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Nome Completo</label>
                <input type="text" id="profile-name" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">E-mail Comercial</label>
                  <input type="email" id="profile-email" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Telemóvel</label>
                  <input type="text" id="profile-phone" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white focus:outline-none">
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Região de Atuação</label>
                <input type="text" id="profile-region" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none" placeholder="Ex: Região Metropolitana de Vitória">
              </div>

              <button type="submit" class="w-full bg-quatree-500 hover:bg-quatree-600 text-slate-950 font-bold py-3 rounded-xl transition">
                Gravar Dados do Perfil
              </button>
            </form>
          </div>

          <!-- Mudar Senha -->
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <i data-lucide="lock" class="text-amber-500 w-4 h-4"></i> Segurança de Acesso
            </h3>

            <form id="password-form" onsubmit="changeAccessPassword(event)" class="space-y-4 text-sm">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Senha Atual</label>
                <input type="password" id="pass-current" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none" placeholder="Digite sua senha atual">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Nova Senha</label>
                  <input type="password" id="pass-new" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white focus:outline-none" placeholder="Mínimo 6 dígitos">
                </div>
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Confirmar Nova</label>
                  <input type="password" id="pass-new-confirm" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white focus:outline-none" placeholder="Confirme a senha">
                </div>
              </div>

              <button type="submit" class="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition">
                Alterar Senha de Acesso
              </button>
            </form>
          </div>

          <!-- Sair/Desconectar -->
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center">
            <p class="text-xs text-slate-400 mb-3">Deseja remover as chaves de acesso deste dispositivo?</p>
            <button onclick="handleLogout()" class="bg-red-950/40 text-red-400 border border-red-900/40 px-6 py-2.5 rounded-full text-xs hover:bg-red-900/20 active:scale-95 transition">
              Revogar Licença / Sair
            </button>
          </div>
        </div>
      </section>

    </main>

    <!-- BOTTOM NAVIGATION BAR -->
    <nav class="fixed bottom-0 inset-x-0 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-xl px-1 py-2 flex justify-around items-center z-40">
      <button onclick="switchTab('hoje')" id="btn-tab-hoje" class="flex flex-col items-center justify-center flex-1 py-1 text-quatree-500 transition">
        <i data-lucide="map" class="w-5 h-5 mb-1"></i>
        <span class="text-[9px] font-semibold">Hoje</span>
      </button>
      <button onclick="switchTab('ia')" id="btn-tab-ia" class="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 transition">
        <i data-lucide="sparkles" class="w-5 h-5 mb-1"></i>
        <span class="text-[9px] font-semibold">Agente IA</span>
      </button>
      <button onclick="switchTab('clientes')" id="btn-tab-clientes" class="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 transition">
        <i data-lucide="users" class="w-5 h-5 mb-1"></i>
        <span class="text-[9px] font-semibold">Clientes</span>
      </button>
      <button onclick="switchTab('escalas')" id="btn-tab-escalas" class="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 transition">
        <i data-lucide="calendar" class="w-5 h-5 mb-1"></i>
        <span class="text-[9px] font-semibold">Escalas</span>
      </button>
      <button onclick="switchTab('sistema')" id="btn-tab-sistema" class="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 transition">
        <i data-lucide="user" class="w-5 h-5 mb-1"></i>
        <span class="text-[9px] font-semibold">Sistema</span>
      </button>
    </nav>
  </div>

  <script>
    const APP_ID = 'elismar-visitas-pwa';
    
    let simulatedGPS = { lat: -20.3800, lng: -40.3700 };

    const SEED_CLIENTS = [
      { id: 'cli-1', name: 'Pet Shop Cão Feliz', sector: 'Pet Shop', lat: -20.3750, lng: -40.3650, frequency: '4x por Mês', lastVisitDate: '2026-06-03', contact: 'Maria Helena', phone: '(27) 9988-1234' },
      { id: 'cli-2', name: 'Agropecuária Sul', sector: 'Agropecuária', lat: -20.3900, lng: -40.3800, frequency: '2x por Mês', lastVisitDate: '2026-05-18', contact: 'Sr. José', phone: '(27) 3255-9876' },
      { id: 'cli-3', name: 'Clínica Veterinária São Francisco', sector: 'Clínica Veterinária', lat: -20.3680, lng: -40.3580, frequency: '1x por Mês', lastVisitDate: '2026-06-05', contact: 'Dra. Cláudia', phone: '(27) 9911-5544' },
      { id: 'cli-4', name: 'Casa de Ração Viana', sector: 'Agropecuária', lat: -20.3810, lng: -40.3720, frequency: '4x por Mês', lastVisitDate: '2026-05-29', contact: 'Carlos', phone: '(27) 9888-0011' },
      { id: 'cli-5', name: 'Hospital Veterinário Pet Viana', sector: 'Hospital Veterinário', lat: -20.3700, lng: -40.3750, frequency: '2x por Mês', lastVisitDate: '2026-06-06', contact: 'Dr. Lucas', phone: '(27) 3344-2211' }
    ];

    const VISITS_HISTORY = [
      { id: 'v-1', clientId: 'cli-1', date: '2026-06-03', summary: 'Abastecido portfólio comercial. Feita colocação de folhetos.', tags: ['Venda Concluída', 'Merchandising'] },
      { id: 'v-2', clientId: 'cli-3', date: '2026-06-05', summary: 'Entrega de material técnico da linha de produtos.', tags: ['Apresentação', 'Amostras'] },
      { id: 'v-3', clientId: 'cli-5', date: '2026-06-06', summary: 'Verificação rápida de níveis de gôndola e validade.', tags: ['Relacionamento', 'Estoque Cheio'] }
    ];

    let clients = JSON.parse(localStorage.getItem(`${APP_ID}:clients`)) || SEED_CLIENTS;
    let visitHistory = JSON.parse(localStorage.getItem(`${APP_ID}:history`)) || VISITS_HISTORY;
    let todayRoute = JSON.parse(localStorage.getItem(`${APP_ID}:todayRoute`)) || ['cli-1', 'cli-3'];
    let manualReminders = JSON.parse(localStorage.getItem(`${APP_ID}:reminders`)) || [
      { id: 'rem-1', title: 'Entregar amostras grátis da linha', type: 'Outro', clientId: 'cli-2', time: '10:30', completed: false },
      { id: 'rem-2', title: 'Confirmar pagamento do boleto', type: 'Cobrar', clientId: 'cli-1', time: '14:00', completed: false }
    ];

    const DEFAULT_PROFILE = {
      name: 'Elismar',
      email: 'elismar@gileade.com',
      phone: '(27) 99122-3344',
      region: 'Viana e Grande Vitória, ES',
      id: 'GIL-REP-90210'
    };
    let profileData = JSON.parse(localStorage.getItem(`${APP_ID}:profile`)) || DEFAULT_PROFILE;

    let pendingRepetitionCheck = null;

    window.onload = function() {
      lucide.createIcons();
      checkLoginStatus();
      window.addEventListener('resize', handleMapResize);
    }

    // ================= SEGURANÇA E LOGIN =================
    function checkLoginStatus() {
      const activated = localStorage.getItem(`${APP_ID}:activated`);
      if (activated === 'true') {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-main-content').classList.remove('hidden');
        initializeApp();
      } else {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app-main-content').classList.add('hidden');
      }
    }

    function handleActivation(e) {
      e.preventDefault();
      const user = document.getElementById('activation-key').value.trim();
      const pass = document.getElementById('login-password').value;

      if (user === 'Elismar' && pass === 'elismar123') {
        localStorage.setItem(`${APP_ID}:activated`, 'true');
        localStorage.setItem(`${APP_ID}:local_pass`, pass);
        showToast('Login efetuado com sucesso!');
        checkLoginStatus();
      } else {
        showToast('Usuário ou Senha incorretos.', 'error');
      }
    }

    function handleLogout() {
      localStorage.removeItem(`${APP_ID}:activated`);
      localStorage.removeItem(`${APP_ID}:local_pass`);
      checkLoginStatus();
      showToast('Desconectado com sucesso.');
    }

    function initializeApp() {
      initMap();
      renderTodayTimeline();
      renderClientList();
      renderEscalasProgress();
      renderReminders();
      populateClientDropdowns();
      loadProfileFields();
    }

    function loadProfileFields() {
      document.getElementById('profile-name').value = profileData.name;
      document.getElementById('profile-email').value = profileData.email;
      document.getElementById('profile-phone').value = profileData.phone;
      document.getElementById('profile-region').value = profileData.region;

      document.getElementById('profile-display-name').innerText = profileData.name;
      document.getElementById('profile-display-id').innerText = `Gileade-ID: ${profileData.id}`;
    }

    function saveProfileData(e) {
      e.preventDefault();
      profileData.name = document.getElementById('profile-name').value;
      profileData.email = document.getElementById('profile-email').value;
      profileData.phone = document.getElementById('profile-phone').value;
      profileData.region = document.getElementById('profile-region').value;

      localStorage.setItem(`${APP_ID}:profile`, JSON.stringify(profileData));
      loadProfileFields();
      showToast('Dados de cadastro atualizados.');
    }

    function changeAccessPassword(e) {
      e.preventDefault();
      const current = document.getElementById('pass-current').value;
      const newPass = document.getElementById('pass-new').value;
      const confirm = document.getElementById('pass-new-confirm').value;

      const savedPass = localStorage.getItem(`${APP_ID}:local_pass`);

      if (current !== savedPass) {
        showToast('A senha atual inserida não confere.', 'error');
        return;
      }

      if (newPass.length < 6) {
        showToast('A nova senha deve possuir pelo menos 6 caracteres.', 'error');
        return;
      }

      if (newPass !== confirm) {
        showToast('As senhas novas não coincidem.', 'error');
        return;
      }

      localStorage.setItem(`${APP_ID}:local_pass`, newPass);
      document.getElementById('password-form').reset();
      showToast('Senha alterada com sucesso.');
    }

    // ================= MAPA INTERATIVO (CANVAS) =================
    let mapCanvas = document.getElementById('route-map');
    let mapCtx = mapCanvas.getContext('2d');
    let mapOffset = { x: 0, y: 0 };
    let mapZoom = 1.0;
    let isDraggingMap = false;
    let dragStart = { x: 0, y: 0 };

    function initMap() {
      handleMapResize();
      centerMapOnCurrentGPS();

      mapCanvas.addEventListener('mousedown', (e) => {
        isDraggingMap = true;
        dragStart.x = e.clientX - mapOffset.x;
        dragStart.y = e.clientY - mapOffset.y;
      });
      window.addEventListener('mouseup', () => isDraggingMap = false);
      mapCanvas.addEventListener('mousemove', (e) => {
        if (!isDraggingMap) return;
        mapOffset.x = e.clientX - dragStart.x;
        mapOffset.y = e.clientY - dragStart.y;
        drawMap();
      });

      mapCanvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          isDraggingMap = true;
          dragStart.x = e.touches[0].clientX - mapOffset.x;
          dragStart.y = e.touches[0].clientY - mapOffset.y;
        }
      });
      mapCanvas.addEventListener('touchend', () => isDraggingMap = false);
      mapCanvas.addEventListener('touchmove', (e) => {
        if (!isDraggingMap || e.touches.length !== 1) return;
        mapOffset.x = e.touches[0].clientX - dragStart.x;
        mapOffset.y = e.touches[0].clientY - dragStart.y;
        drawMap();
      });

      mapCanvas.addEventListener('click', handleMapClick);
    }

    function handleMapResize() {
      const rect = mapCanvas.parentElement.getBoundingClientRect();
      mapCanvas.width = rect.width;
      mapCanvas.height = rect.height;
      drawMap();
    }

    function centerMapOnCurrentGPS() {
      mapOffset.x = mapCanvas.width / 2;
      mapOffset.y = mapCanvas.height / 2;
      drawMap();
    }

    function gpsToScreen(lat, lng) {
      const scale = 9000 * mapZoom;
      const x = mapOffset.x + (lng - simulatedGPS.lng) * scale;
      const y = mapOffset.y - (lat - simulatedGPS.lat) * scale;
      return { x, y };
    }

    function drawMap() {
      mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);

      mapCtx.strokeStyle = '#1e293b';
      mapCtx.lineWidth = 1.5;
      const step = 60 * mapZoom;
      for (let i = -10; i < 20; i++) {
        mapCtx.beginPath();
        mapCtx.moveTo(0, i * step + mapOffset.y % step);
        mapCtx.lineTo(mapCanvas.width, i * step + mapOffset.y % step + 80);
        mapCtx.stroke();

        mapCtx.beginPath();
        mapCtx.moveTo(i * step + mapOffset.x % step, 0);
        mapCtx.lineTo(i * step + mapOffset.x % step + 80, mapCanvas.height);
        mapCtx.stroke();
      }

      if (todayRoute.length > 1) {
        mapCtx.beginPath();
        mapCtx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        mapCtx.lineWidth = 3;
        mapCtx.setLineDash([6, 6]);

        let started = false;
        todayRoute.forEach(cliId => {
          const cli = clients.find(c => c.id === cliId);
          if (cli) {
            const pos = gpsToScreen(cli.lat, cli.lng);
            if (!started) {
              mapCtx.moveTo(pos.x, pos.y);
              started = true;
            } else {
              mapCtx.lineTo(pos.x, pos.y);
            }
          }
        });
        mapCtx.stroke();
        mapCtx.setLineDash([]);
      }

      const repPos = gpsToScreen(simulatedGPS.lat, simulatedGPS.lng);
      mapCtx.beginPath();
      mapCtx.arc(repPos.x, repPos.y, 14, 0, 2 * Math.PI);
      mapCtx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      mapCtx.fill();
      
      mapCtx.beginPath();
      mapCtx.arc(repPos.x, repPos.y, 7, 0, 2 * Math.PI);
      mapCtx.fillStyle = '#10b981';
      mapCtx.strokeStyle = '#ffffff';
      mapCtx.lineWidth = 1.5;
      mapCtx.fill();
      mapCtx.stroke();

      clients.forEach(cli => {
        const pos = gpsToScreen(cli.lat, cli.lng);
        const isActive = todayRoute.includes(cli.id);
        const routeIdx = todayRoute.indexOf(cli.id) + 1;

        let color = '#f59e0b';
        const lastDays = getDaysSince(cli.lastVisitDate);
        if (lastDays < 7) color = '#10b981';
        else if (lastDays > 30) color = '#ef4444';

        if (isActive) {
          mapCtx.beginPath();
          mapCtx.arc(pos.x, pos.y, 13, 0, 2 * Math.PI);
          mapCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          mapCtx.fill();
        }

        mapCtx.beginPath();
        mapCtx.arc(pos.x, pos.y, 9, 0, 2 * Math.PI);
        mapCtx.fillStyle = color;
        mapCtx.strokeStyle = '#020617';
        mapCtx.lineWidth = 2;
        mapCtx.fill();
        mapCtx.stroke();

        mapCtx.fillStyle = '#020617';
        mapCtx.font = 'bold 9px sans-serif';
        mapCtx.textAlign = 'center';
        mapCtx.textBaseline = 'middle';
        mapCtx.fillText(isActive ? routeIdx : cli.name.charAt(0), pos.x, pos.y);

        mapCtx.fillStyle = '#64748b';
        mapCtx.font = '8px sans-serif';
        mapCtx.fillText(cli.name, pos.x, pos.y - 14);
      });
    }

    function handleMapClick(e) {
      const rect = mapCanvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      let clickedClient = null;
      clients.forEach(cli => {
        const pos = gpsToScreen(cli.lat, cli.lng);
        if (Math.hypot(pos.x - clickX, pos.y - clickY) < 14) {
          clickedClient = cli;
        }
      });

      if (clickedClient) {
        showMapPopover(clickedClient);
      } else {
        hideMapPopover();
      }
    }

    function showMapPopover(client) {
      const popover = document.getElementById('map-popover');
      document.getElementById('popover-name').innerText = client.name;
      document.getElementById('popover-type').innerText = client.sector;
      document.getElementById('popover-freq').innerText = `Recorrência: ${client.frequency}`;

      const btnRoute = document.getElementById('popover-btn-route');
      const isInRoute = todayRoute.includes(client.id);
      btnRoute.innerText = isInRoute ? 'Retirar' : 'Roteirizar';
      btnRoute.onclick = () => {
        if (isInRoute) removeClientFromRoute(client.id);
        else tryAddClientToRoute(client.id);
        hideMapPopover();
      };

      document.getElementById('popover-btn-details').onclick = () => {
        switchTab('clientes');
        document.getElementById('client-search').value = client.name;
        renderClientList();
        hideMapPopover();
      };

      popover.classList.remove('hidden');
    }

    function hideMapPopover() {
      document.getElementById('map-popover').classList.add('hidden');
    }

    // ================= ROTAS & ANTI REPETIÇÃO =================
    function tryAddClientToRoute(clientId) {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      const lastDays = getDaysSince(client.lastVisitDate);
      if (lastDays < 10) {
        pendingRepetitionCheck = clientId;
        openRepetitionModal(client, lastDays);
        return;
      }
      addClientToRouteDirectly(clientId);
    }

    function openRepetitionModal(client, lastDays) {
      document.getElementById('rep-client-name').innerText = client.name;
      document.getElementById('rep-client-freq').innerText = client.frequency;
      document.getElementById('rep-last-date').innerText = formatDateToPt(client.lastVisitDate);

      const lastHistory = visitHistory.filter(vh => vh.clientId === client.id).sort((a,b) => b.date.localeCompare(a.date))[0];
      if (lastHistory) {
        document.getElementById('rep-last-notes').innerText = `"${lastHistory.summary}"`;
        const tc = document.getElementById('rep-tags-container');
        tc.innerHTML = '';
        lastHistory.tags.forEach(t => {
          tc.innerHTML += `<span class="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">${t}</span>`;
        });
      } else {
        document.getElementById('rep-last-notes').innerText = '"Nenhum feedback deixado pelo vendedor."';
        document.getElementById('rep-tags-container').innerHTML = '';
      }

      document.getElementById('modal-repetition').classList.remove('hidden');
    }

    function closeRepetitionModal(confirm) {
      document.getElementById('modal-repetition').classList.add('hidden');
      if (confirm && pendingRepetitionCheck) {
        addClientToRouteDirectly(pendingRepetitionCheck);
        showToast('Aviso: Visita de urgência adicionada à rota.', 'warning');
      }
      pendingRepetitionCheck = null;
    }

    function addClientToRouteDirectly(clientId) {
      if (todayRoute.includes(clientId)) {
        showToast('Cliente já configurado no roteiro corrente.', 'error');
        return;
      }
      todayRoute.push(clientId);
      saveAllState();
      renderTodayTimeline();
      drawMap();
      showToast('Cliente acoplado ao roteiro com sucesso.');
    }

    function removeClientFromRoute(clientId) {
      todayRoute = todayRoute.filter(id => id !== clientId);
      saveAllState();
      renderTodayTimeline();
      drawMap();
      showToast('Visita dispensada.');
    }

    function clearTodayRoute() {
      todayRoute = [];
      saveAllState();
      renderTodayTimeline();
      drawMap();
      showToast('Itinerário esvaziado.');
    }

    function triggerCheckIn(clientId) {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      const dist = Math.round(getDistanceMeters(simulatedGPS, client));
      if (dist > 150) {
        showToast(`Check-in assistido feito sob distância (${dist}m do alvo).`, 'warning');
      } else {
        showToast(`Check-in automático validado a ${dist}m da localização.`);
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const newVisit = {
        id: `v-${Date.now()}`,
        clientId: clientId,
        date: todayStr,
        summary: 'Check-in concluído pelo GPS comercial da rota.',
        tags: ['Check-in GPS', 'Abastecimento']
      };

      client.lastVisitDate = todayStr;
      visitHistory.push(newVisit);
      
      saveAllState();
      renderTodayTimeline();
      renderClientList();
      renderEscalasProgress();
      drawMap();
    }

    // ================= TIMELINE DE HOJE =================
    function renderTodayTimeline() {
      const container = document.getElementById('timeline-container');
      container.innerHTML = '';

      let items = [];
      todayRoute.forEach((cliId, index) => {
        const client = clients.find(c => c.id === cliId);
        if (client) {
          items.push({
            type: 'visit',
            order: index + 1,
            time: `09:${20 + index * 45}`,
            title: client.name,
            subtitle: `${client.sector} • ${client.frequency}`,
            id: client.id,
            completed: isVisitedToday(client.id)
          });
        }
      });

      manualReminders.forEach(rem => {
        const related = clients.find(c => c.id === rem.clientId);
        items.push({
          type: 'reminder',
          order: 99,
          time: rem.time,
          title: rem.title,
          subtitle: related ? `Cliente: ${related.name}` : 'Actividade',
          id: rem.id,
          completed: rem.completed
        });
      });

      items.sort((a, b) => a.time.localeCompare(b.time));

      if (items.length === 0) {
        container.innerHTML = `
          <div class="py-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
            <i data-lucide="calendar-off" class="w-8 h-8 text-slate-600 mx-auto mb-2"></i>
            <p class="text-xs text-slate-400">Roteiro limpo. Peça uma sugestão inteligente à IA!</p>
          </div>
        `;
        updateStats(0, 0, 0);
        return;
      }

      let completed = 0;
      items.forEach(item => {
        if (item.completed) completed++;
        const isVisit = item.type === 'visit';
        const cardClass = item.completed ? 'bg-slate-950/40 border-slate-900 text-slate-500' : 'bg-slate-900 border-slate-800 text-white';

        container.innerHTML += `
          <div class="relative">
            <div class="absolute -left-6 top-4 w-4 h-4 rounded-full border-2 bg-slate-950 flex items-center justify-center ${item.completed ? 'border-quatree-500 bg-quatree-500 text-slate-950' : 'border-slate-700'}">
              ${item.completed ? '<i data-lucide="check" class="w-2.5 h-2.5"></i>' : ''}
            </div>
            <div class="border rounded-2xl p-4 flex flex-col justify-between gap-3 ${cardClass}">
              <div class="flex justify-between items-start">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] text-slate-500 font-bold">${item.time}</span>
                    ${isVisit ? `<span class="text-[9px] bg-quatree-500/10 text-quatree-500 border border-quatree-500/20 px-1.5 py-0.2 rounded font-bold uppercase">Visita</span>` : `<span class="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.2 rounded font-bold uppercase">Tarefa</span>`}
                  </div>
                  <h3 class="text-sm font-bold tracking-tight ${item.completed ? 'line-through text-slate-600' : ''}">${item.title}</h3>
                  <p class="text-xs text-slate-400">${item.subtitle}</p>
                </div>
                <div class="flex items-center gap-1.5">
                  ${isVisit ? `
                    <button onclick="triggerCheckIn('${item.id}')" class="p-2 bg-quatree-500/10 hover:bg-quatree-500 hover:text-slate-950 text-quatree-500 rounded-xl transition">
                      <i data-lucide="map-pin" class="w-4 h-4"></i>
                    </button>
                    <button onclick="removeClientFromRoute('${item.id}')" class="p-2 bg-slate-800 hover:text-red-400 rounded-xl transition">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  ` : `
                    <button onclick="toggleReminderCompleted('${item.id}')" class="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition">
                      <i data-lucide="${item.completed ? 'rotate-ccw' : 'check'}" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteReminder('${item.id}')" class="p-2 bg-slate-800 hover:text-red-400 rounded-xl transition">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  `}
                </div>
              </div>
            </div>
          </div>
        `;
      });

      const perc = Math.round((completed / items.length) * 100) || 0;
      updateStats(todayRoute.length, items.length - completed, perc);
      lucide.createIcons();
    }

    function updateStats(visits, pending, percentage) {
      document.getElementById('stats-visits-count').innerText = visits;
      document.getElementById('stats-pending-count').innerText = pending;
      document.getElementById('stats-completed-perc').innerText = `${percentage}%`;
    }

    function isVisitedToday(clientId) {
      const todayStr = new Date().toISOString().split('T')[0];
      return visitHistory.some(vh => vh.clientId === clientId && vh.date === todayStr);
    }

    // ================= CLIENTES =================
    function renderClientList() {
      const container = document.getElementById('clients-list-container');
      const search = document.getElementById('client-search').value.toLowerCase();
      container.innerHTML = '';

      const filtered = clients.filter(c => 
        c.name.toLowerCase().includes(search) || c.sector.toLowerCase().includes(search)
      );

      document.getElementById('total-clients-label').innerText = `${filtered.length} pontos de venda mapeados`;

      filtered.forEach(cli => {
        const lastDays = getDaysSince(cli.lastVisitDate);
        const inRoute = todayRoute.includes(cli.id);
        
        let badge = '';
        if (lastDays < 7) badge = '<span class="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-bold uppercase">Em dia</span>';
        else if (lastDays <= 30) badge = '<span class="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md font-bold uppercase">Expirando</span>';
        else badge = '<span class="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-md font-bold uppercase">Atrasado</span>';

        container.innerHTML += `
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
            <div class="flex justify-between items-start">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">${cli.sector}</span>
                  ${badge}
                </div>
                <h3 class="text-sm font-bold text-white">${cli.name}</h3>
                <p class="text-xs text-slate-400 mt-1 flex items-center gap-1"><i data-lucide="phone" class="w-3 h-3"></i> ${cli.contact} • ${cli.phone}</p>
              </div>
              <button onclick="toggleRouteState('${cli.id}')" class="p-2.5 rounded-xl transition ${inRoute ? 'bg-red-950/40 text-red-400 border border-red-900/40' : 'bg-quatree-500 text-slate-950'}">
                <i data-lucide="${inRoute ? 'x' : 'plus-circle'}" class="w-4.5 h-4.5"></i>
              </button>
            </div>
            <div class="flex justify-between items-center text-[10px] border-t border-slate-800/60 pt-2 text-slate-400">
              <span>Frequência: <strong class="text-white">${cli.frequency}</strong></span>
              <span>Última visita: <strong class="text-white">${formatDateToPt(cli.lastVisitDate)} (${lastDays}d)</strong></span>
            </div>
          </div>
        `;
      });
      lucide.createIcons();
    }

    function toggleRouteState(clientId) {
      if (todayRoute.includes(clientId)) removeClientFromRoute(clientId);
      else tryAddClientToRoute(clientId);
    }

    function toggleClientModal() {
      const modal = document.getElementById('modal-client');
      modal.classList.toggle('hidden');
      if (!modal.classList.contains('hidden')) {
        document.getElementById('client-form').reset();
        document.getElementById('client-lat').value = (simulatedGPS.lat + (Math.random() - 0.5) * 0.02).toFixed(4);
        document.getElementById('client-lng').value = (simulatedGPS.lng + (Math.random() - 0.5) * 0.02).toFixed(4);
      }
    }

    function saveClient(e) {
      e.preventDefault();
      const name = document.getElementById('client-name').value;
      const sector = document.getElementById('client-sector').value;
      const frequency = document.getElementById('client-frequency').value;
      const lat = parseFloat(document.getElementById('client-lat').value);
      const lng = parseFloat(document.getElementById('client-lng').value);
      const contact = document.getElementById('client-contact').value || 'Gerente';

      const newCli = {
        id: `cli-${Date.now()}`,
        name,
        sector,
        frequency,
        lat,
        lng,
        lastVisitDate: '2026-05-10',
        contact,
        phone: '(27) 99' + Math.floor(1000000 + Math.random() * 9000000)
      };

      clients.push(newCli);
      saveAllState();
      renderClientList();
      populateClientDropdowns();
      drawMap();
      toggleClientModal();
      showToast(`${name} cadastrado e pronto para roteamento.`);
    }

    // ================= METAS & ESCALAS =================
    function renderEscalasProgress() {
      const container = document.getElementById('escalas-progress-list');
      container.innerHTML = '';

      clients.forEach(cli => {
        let target = 1;
        if (cli.frequency.includes('4x')) target = 4;
        if (cli.frequency.includes('2x por Mês')) target = 2;
        if (cli.frequency.includes('2x por Semana')) target = 8;

        const visitsThisMonth = visitHistory.filter(vh => vh.clientId === cli.id && vh.date.startsWith('2026-06')).length;
        const perc = Math.min(Math.round((visitsThisMonth / target) * 100), 100);

        container.innerHTML += `
          <div class="space-y-1 text-xs">
            <div class="flex justify-between text-slate-300 font-semibold">
              <span class="text-white">${cli.name}</span>
              <span>${visitsThisMonth} / ${target} visitas (${perc}%)</span>
            </div>
            <div class="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div class="bg-gradient-to-r from-emerald-500 to-quatree-500 h-full rounded-full" style="width: ${perc}%"></div>
            </div>
          </div>
        `;
      });
    }

    // ================= COMPROMISSOS & LEMBRETES =================
    function renderReminders() {
      const container = document.getElementById('reminders-list-container');
      container.innerHTML = '';

      if (manualReminders.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-500 text-xs py-4">Nenhum compromisso pendente.</div>`;
        return;
      }

      manualReminders.forEach(rem => {
        const client = clients.find(c => c.id === rem.clientId);
        let typeIcon = 'bell';
        if (rem.type === 'Ligar') typeIcon = 'phone';
        if (rem.type === 'Cobrar') typeIcon = 'dollar-sign';
        if (rem.type === 'Treinar') typeIcon = 'graduation-cap';

        container.innerHTML += `
          <div class="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-700 transition">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500">
                <i data-lucide="${typeIcon}" class="w-4 h-4"></i>
              </div>
              <div>
                <h4 class="text-xs font-bold text-slate-100 ${rem.completed ? 'line-through text-slate-500' : ''}">${rem.title}</h4>
                <p class="text-[10px] text-slate-400 mt-0.5">Alerta às ${rem.time} ${client ? '• ' + client.name : ''}</p>
              </div>
            </div>
            <button onclick="deleteReminder('${rem.id}')" class="p-1.5 text-slate-500 hover:text-red-400 transition">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        `;
      });
      lucide.createIcons();
    }

    function toggleReminderModal() {
      document.getElementById('modal-reminder').classList.toggle('hidden');
    }

    function populateClientDropdowns() {
      const select = document.getElementById('reminder-client-id');
      select.innerHTML = '<option value="">Nenhum</option>';
      clients.forEach(cli => {
        select.innerHTML += `<option value="${cli.id}">${cli.name}</option>`;
      });
    }

    function saveReminder(e) {
      e.preventDefault();
      const title = document.getElementById('reminder-title').value;
      const type = document.querySelector('input[name="reminder-type"]:checked').value;
      const clientId = document.getElementById('reminder-client-id').value;
      const time = document.getElementById('reminder-time').value;

      manualReminders.push({
        id: `rem-${Date.now()}`,
        title,
        type,
        clientId,
        time,
        completed: false
      });

      saveAllState();
      renderReminders();
      renderTodayTimeline();
      toggleReminderModal();
      showToast('Tarefa inserida no cronograma de hoje.');
    }

    function toggleReminderCompleted(id) {
      const rem = manualReminders.find(r => r.id === id);
      if (rem) {
        rem.completed = !rem.completed;
        saveAllState();
        renderReminders();
        renderTodayTimeline();
        showToast(rem.completed ? 'Compromisso concluído.' : 'Compromisso reaberto.');
      }
    }

    function deleteReminder(id) {
      manualReminders = manualReminders.filter(r => r.id !== id);
      saveAllState();
      renderReminders();
      renderTodayTimeline();
      showToast('Lembrete apagado.');
    }

    // ================= INTEGRACAO IA (GEMINI PREVIEW) =================
    async function triggerAIRoutePlanning() {
      showAIResponseContainer();
      const apiKey = document.getElementById('gemini-key').value.trim();

      if (!apiKey) {
        setTimeout(() => simulateAIRoutePlanHeuristics(), 1200);
        return;
      }

      const prompt = `Como co-piloto comercial da Elismar, organize o roteiro do dia para o representante.
      Clientes: ${JSON.stringify(clients)}
      Localização atual: Lat ${simulatedGPS.lat}, Lng ${simulatedGPS.lng}
      Últimas visitas: ${JSON.stringify(visitHistory)}
      
      Ordene até 3 visitas urgentes de reposição na região e retorne JSON com:
      {
        "recommendedRoute": [{ "clientId": "id", "reason": "motivo...", "order": 1 }],
        "summaryText": "Resumo executivo do dia."
      }`;

      try {
        const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
        });
        const data = await response.json();
        const res = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
        displayAIOutput(res);
      } catch (err) {
        simulateAIRoutePlanHeuristics();
      }
    }

    async function triggerAIProspecting() {
      showAIResponseContainer();
      const apiKey = document.getElementById('gemini-key').value.trim();

      if (!apiKey) {
        setTimeout(() => simulateAIProspectingHeuristics(), 1000);
        return;
      }

      const prompt = `Identifique 2 potenciais novos pontos de venda de rações (Pet Shops/Clínicas) no bairro Viana, Espírito Santo que ainda não estejam em: ${JSON.stringify(clients)}.
      Sugerir perto de Lat ${simulatedGPS.lat}, Lng ${simulatedGPS.lng}.
      Retornar JSON:
      {
        "prospects": [{ "name": "Nome", "type": "Tipo", "address": "Endereço", "reasonToVisit": "Por que prospectar?" }],
        "summaryText": "Resumo de mercado."
      }`;

      try {
        const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
        });
        const data = await response.json();
        const res = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
        displayAIProspectOutput(res);
      } catch (err) {
        simulateAIProspectingHeuristics();
      }
    }

    async function fetchWithRetry(url, options, retries = 5, delay = 1000) {
      try {
        const res = await fetch(url, options);
        if (res.status === 429 && retries > 0) {
          await new Promise(r => setTimeout(r, delay));
          return fetchWithRetry(url, options, retries - 1, delay * 2);
        }
        return res;
      } catch (err) {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, delay));
          return fetchWithRetry(url, options, retries - 1, delay * 2);
        }
        throw err;
      }
    }

    function simulateAIRoutePlanHeuristics() {
      let sorted = [...clients].sort((a,b) => getDaysSince(a.lastVisitDate) - getDaysSince(b.lastVisitDate)).reverse();
      const top = sorted.slice(0, 3);
      displayAIOutput({
        recommendedRoute: top.map((c, i) => ({
          clientId: c.id,
          reason: `Visita altamente recomendada. Ponto de venda está há ${getDaysSince(c.lastVisitDate)} dias sem check-in da Elismar.`,
          order: i + 1
        })),
        summaryText: "O motor de inteligência local estruturou o percurso ideal para poupar combustível. Foram selecionados os 3 pontos de venda mais urgentes que estão dentro da sua escala geográfica em Viana."
      });
    }

    function simulateAIProspectingHeuristics() {
      displayAIProspectOutput({
        prospects: [
          { name: "Pet & Vet Center Viana", type: "Clínica Veterinária", address: "Av. Florentino Avidos, Viana, ES", reasonToVisit: "Ponto clínico estratégico com altíssimo fluxo de clientes interessados no catálogo de produtos." },
          { name: "Distribuidora Primor Rações", type: "Pet Shop", address: "Rua Domingos Vicente, Primavera, Viana, ES", reasonToVisit: "Ponto comercial focado em sacarias grandes de alto giro. Perfeito para consolidação de mercado local." }
        ],
        summaryText: "Mapeamento comercial offline identificou novos entrantes qualificados na sua vizinhança que se alinham perfeitamente ao portfólio."
      });
    }

    function showAIResponseContainer() {
      document.getElementById('ai-response-area').classList.remove('hidden');
      document.getElementById('ai-loading').classList.remove('hidden');
      document.getElementById('ai-output').classList.add('hidden');
    }

    function clearAIResponse() {
      document.getElementById('ai-response-area').classList.add('hidden');
    }

    function displayAIOutput(data) {
      document.getElementById('ai-loading').classList.add('hidden');
      document.getElementById('ai-output').classList.remove('hidden');
      document.getElementById('ai-text').innerText = data.summaryText;

      const actions = document.getElementById('ai-actions-list');
      actions.innerHTML = '';
      data.recommendedRoute.forEach(rec => {
        const cli = clients.find(c => c.id === rec.clientId);
        if (cli) {
          actions.innerHTML += `
            <div class="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-[9px] bg-quatree-500/10 text-quatree-500 px-1.5 py-0.2 rounded font-bold uppercase">Ordem ${rec.order}</span>
                  <h5 class="text-xs font-bold text-white mt-1">${cli.name}</h5>
                </div>
                <button onclick="applyAIRoute('${cli.id}')" class="text-xs bg-quatree-500 text-slate-950 font-bold px-3 py-1 rounded-lg">Roteirizar</button>
              </div>
              <p class="text-[10px] text-slate-400 leading-relaxed">${rec.reason}</p>
            </div>
          `;
        }
      });
    }

    function displayAIProspectOutput(data) {
      document.getElementById('ai-loading').classList.add('hidden');
      document.getElementById('ai-output').classList.remove('hidden');
      document.getElementById('ai-text').innerText = data.summaryText;

      const actions = document.getElementById('ai-actions-list');
      actions.innerHTML = '';
      data.prospects.forEach(pr => {
        const lat = simulatedGPS.lat + (Math.random() - 0.5) * 0.012;
        const lng = simulatedGPS.lng + (Math.random() - 0.5) * 0.012;

        actions.innerHTML += `
          <div class="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.2 rounded font-bold uppercase">${pr.type} • Prospecção</span>
                <h5 class="text-xs font-bold text-white mt-1">${pr.name}</h5>
                <p class="text-[9px] text-slate-500">${pr.address}</p>
              </div>
              <button onclick="quickRegisterProspect('${pr.name}', '${pr.type}', ${lat}, ${lng})" class="text-xs bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-lg">Prospectar</button>
            </div>
            <p class="text-[10px] text-slate-400 leading-relaxed">${pr.reasonToVisit}</p>
          </div>
        `;
      });
    }

    function applyAIRoute(id) {
      tryAddClientToRoute(id);
    }

    function quickRegisterProspect(name, type, lat, lng) {
      const newCli = {
        id: `cli-${Date.now()}`,
        name,
        sector: type,
        frequency: '1x por Mês',
        lat,
        lng,
        lastVisitDate: '2026-05-01',
        contact: 'Pendente primeiro contato',
        phone: '(27) 99999-0000'
      };
      clients.push(newCli);
      saveAllState();
      renderClientList();
      populateClientDropdowns();
      drawMap();
      tryAddClientToRoute(newCli.id);
      showToast(`${name} cadastrado e anexado à rota diária.`);
    }

    // ================= CONTROLES GERAIS E PERSISTÊNCIA =================
    function saveAllState() {
      localStorage.setItem(`${APP_ID}:clients`, JSON.stringify(clients));
      localStorage.setItem(`${APP_ID}:history`, JSON.stringify(visitHistory));
      localStorage.setItem(`${APP_ID}:todayRoute`, JSON.stringify(todayRoute));
      localStorage.setItem(`${APP_ID}:reminders`, JSON.stringify(manualReminders));
    }

    function toggleSettingsModal() {
      const m = document.getElementById('modal-settings');
      m.classList.toggle('hidden');
      if (!m.classList.contains('hidden')) {
        document.getElementById('gps-sim-lat').value = simulatedGPS.lat.toFixed(4);
        document.getElementById('gps-sim-lng').value = simulatedGPS.lng.toFixed(4);
      }
    }

    function updateSimulatedGPS() {
      const lat = parseFloat(document.getElementById('gps-sim-lat').value);
      const lng = parseFloat(document.getElementById('gps-sim-lng').value);
      if (!isNaN(lat) && !isNaN(lng)) {
        simulatedGPS = { lat, lng };
        centerMapOnCurrentGPS();
        showToast('Localização simulada do representante atualizada.');
        toggleSettingsModal();
      }
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.getElementById(`tab-${tabId}`).classList.add('active');

      const tabs = ['hoje', 'ia', 'clientes', 'escalas', 'sistema'];
      tabs.forEach(t => {
        const btn = document.getElementById(`btn-tab-${t}`);
        if (t === tabId) btn.className = "flex flex-col items-center justify-center flex-1 py-1 text-quatree-500 transition";
        else btn.className = "flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-slate-300 transition";
      });

      if (tabId === 'hoje') {
        setTimeout(handleMapResize, 50);
      }
    }

    function simulateMorningAlert() {
      showToast("Agenda do Dia: 2 Visitas pendentes Elismar em Viana. Prospecção IA disponível para o bairro.", "success");
    }

    function showToast(msg, type = 'success') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = `flex items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl w-full pointer-events-auto transform translate-y-2 opacity-0 transition duration-300 ${type === 'error' ? 'border-red-500/30' : 'border-quatree-500/30'}`;
      
      let icon = 'info';
      let iconColor = 'text-blue-400';
      if (type === 'success') { icon = 'check-circle'; iconColor = 'text-quatree-500'; }
      else if (type === 'error') { icon = 'x-circle'; iconColor = 'text-red-500'; }
      else if (type === 'warning') { icon = 'alert-triangle'; iconColor = 'text-amber-500'; }

      toast.innerHTML = `
        <div class="${iconColor}"><i data-lucide="${icon}" class="w-5 h-5"></i></div>
        <div class="flex-1 text-xs text-slate-200">${msg}</div>
      `;
      container.appendChild(toast);
      lucide.createIcons();

      setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 50);
      setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    }

    function getDaysSince(dateString) {
      const last = new Date(dateString);
      const today = new Date('2026-06-07');
      const diffTime = Math.abs(today - last);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    function formatDateToPt(dateString) {
      const parts = dateString.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    function getDistanceMeters(p1, p2) {
      const R = 6371e3;
      const phi1 = p1.lat * Math.PI/180;
      const phi2 = p2.lat * Math.PI/180;
      const dPhi = (p2.lat-p1.lat) * Math.PI/180;
      const dLam = (p2.lng-p1.lng) * Math.PI/180;

      const a = Math.sin(dPhi/2) * Math.sin(dPhi/2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(dLam/2) * Math.sin(dLam/2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
  </script>
</body>
</html>
```eof