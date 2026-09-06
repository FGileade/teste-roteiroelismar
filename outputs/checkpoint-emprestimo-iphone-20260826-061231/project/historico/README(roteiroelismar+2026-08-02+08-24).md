# HISTÓRICO E BACKUP DO PROJETO — ROTEIRO ELISMAR (2026-08-02)

Documento de registro e backup completo da aplicação **roteiroelismar**, gerado em **02/08/2026 às 08:24**.

---

## ÍNDICE
1. [Descrição e Objetivo](#1-descrição-e-objetivo)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura e Recursos](#3-arquitetura-e-recursos)
4. [Estrutura de Pastas e Códigos](#4-estrutura-de-pastas-e-códigos)
5. [Como Rodar e Fazer Deploy](#5-como-rodar-e-fazer-deploy)
6. [Locais de Armazenamento do Backup](#6-locais-de-armazenamento-do-backup)

---

## 1. DESCRIÇÃO E OBJETIVO
O **roteiroelismar** (Gestor de Rotas - Elismar) é um PWA completo focado na gestão de vendas e visitas a pet shops e estabelecimentos comerciais do setor de rações.

### Principais Funcionalidades:
- **Gestão de Rotas e Visitas**: Organização visual da rotina diária do vendedor.
- **Modo Offline com Fila de Sincronismo**: Persistência transacional local e envio em batch via Firestore.
- **Controle de Empréstimos**: Registro de movimentação/troca de sacos de ração entre clientes da rota.
- **Reconhecimento de Voz Nativo**: Transcrição de áudio em tempo real via Web Speech API do navegador (sem custos de API externa).
- **Deep Links de Navegação**: Integração direta com Google Maps / Waze.

---

## 2. STACK TECNOLÓGICA
- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide React, Framer Motion.
- **Backend / API**: Express.js (`server.ts`).
- **Banco de Dados & Autenticação**: Cloud Firestore & Firebase Authentication.
- **Deploy**: Firebase Hosting.

---

## 3. ARQUITETURA E RECURSOS
- **Fila Offline Transacional (`syncQueue.ts`)**: Enfileira atualizações de Firestore quando offline e dispara atualização em massa ao reestabelecer conexão.
- **Infraestrutura Enxuta**: Totalmente desvinculada de APIS pagas ou IA pesada no servidor, otimizando performance e reduzindo custo de operação a zero.

---

## 4. ESTRUTURA DE PASTAS E CÓDIGOS
```text
roteiroelismar/
├── .agents/          # Agentes e Skills do projeto
├── assets/           # Assets e mídias estáticas
├── dist/             # Arquivos de build estáticos de produção
├── historico/        # Históricos de backup e registros de conversas
├── public/           # Manifest PWA, ícones, SW
├── src/              # Código fonte React e TypeScript
├── server.ts         # Servidor Express.js
├── firebase.json     # Configuração Firebase Hosting
└── firestore.rules   # Regras de segurança do Firestore
```

---

## 5. COMO RODAR E FAZER DEPLOY

### Desenvolvimento Local:
```bash
npm run dev
```

### Compilação de Produção:
```bash
npm run build
```

### Publicação no Firebase:
```bash
firebase deploy --only hosting
```

---

## 6. LOCAIS DE ARMAZENAMENTO DO BACKUP
- **Cópia Integral dos Arquivos de Código**: `C:\Users\filip\.gemini\antigravity\scratch\2. BACKUP DE PROJETOS\roteiroelismar_backup_20260802-0824`
- **Registro em Texto**: `c:\Users\filip\.gemini\antigravity\scratch\1. PROJETOS\roteiroelismar\historico\projeto-resumo(roteiroelismar+2026-08-02+08-24).txt`
- **Registro Markdown**: `c:\Users\filip\.gemini\antigravity\scratch\1. PROJETOS\roteiroelismar\historico\README(roteiroelismar+2026-08-02+08-24).md`
