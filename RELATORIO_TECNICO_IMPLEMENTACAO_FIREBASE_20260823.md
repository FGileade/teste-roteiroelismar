# Relatório técnico — implementação e implantação Firebase

**Projeto:** `roteiroelismar`  
**Data:** 23/08/2026  
**Objetivo:** reduzir leituras desnecessárias do Firestore sem interromper a aplicação e mantendo rollback reversível.

## 1. Resumo executivo

O projeto recebeu uma implementação de sincronização incremental, protegida por feature flag e allowlist de usuário. O backfill dos documentos existentes foi executado após a validação do backup. A versão de piloto foi compilada e publicada no Firebase Hosting.

O piloto está limitado ao usuário Master. A ativação ampla ainda não está aprovada, porque faltam medição de consumo no Billing, testes de dois dispositivos, validação de conflitos e observação de estabilidade.

Não é tecnicamente correto afirmar custo zero neste momento. A mudança reduz a fonte principal de leituras repetidas, mas o custo real precisa ser confirmado no console do Google Cloud Billing.

## 2. O que foi implementado

### 2.1 Sincronização incremental

- Feature flags e allowlist em `src/lib/firebaseSync.ts:35-48`.
- Consulta incremental por `_sync.updatedAt`, com ordenação estável por data e ID, paginação e limite de 200 documentos em `src/lib/firebaseSync.ts:136-226`.
- Download incremental condicionado ao estado `incrementalReady` em `src/lib/firebaseSync.ts:344-362`.
- Cursor salvo somente depois da conclusão das mesclagens em `src/lib/firebaseSync.ts`.
- Fallback para o download completo mantido em `src/App.tsx:223-258`.
- Metadados de sincronização, revisão e tombstone na fila offline em `src/lib/syncQueue.ts:137-179`.
- Atualização do marcador `users/{uid}/config/syncState` em `src/lib/syncQueue.ts:190-210`.
- Migração única dos documentos antigos em `src/lib/firebaseSync.ts:418-468`.

### 2.2 Índices do Firestore

Foram adicionados índices compostos para `_sync.updatedAt` e `__name__` nas coleções operacionais em `firestore.indexes.json`. O objetivo é suportar a consulta incremental com paginação estável.

### 2.3 Segurança e autenticação

- A senha fixa antiga e senhas persistidas em `localStorage` foram removidas de `src/components/Settings.tsx`.
- Alteração de senha/e-mail exige reautenticação pelo Firebase Auth em `src/components/Settings.tsx`.
- As regras usam `isAuthorized()` para limitar leitura, gravação e exclusão em `firestore.rules:12-28`.
- Testes das regras: 7/7 aprovados pelo Firebase Emulator.

### 2.4 Backup e restauração

- Validação estrutural do backup em `src/lib/backupRestore.ts:179-214`.
- Restauração compatível com os metadados incrementais em `src/lib/backupRestore.ts:217-288`.
- Teste de restauração em Emulator: 1/1 aprovado.

### 2.5 Infraestrutura de testes

- `firebase.json` agora declara Auth Emulator na porta 9099 e Firestore Emulator na porta 8080; essa configuração é local e não altera serviços de produção.
- Foram adicionados testes reproduzíveis para Auth, PWA, bundle e sincronização incremental em `tests/`.
- Os comandos correspondentes estão registrados em `package.json`.

## 3. Backups e checkpoint reversível

Backup protegido validado:

`backup_pre_correcao/backup-roteiroelismar-20260822-221408.json`

Contagens registradas: `clients=122`, `visits=396`, `negotiations=102`, `voiceNotes=1`, `events=8`, `loans=33`, `initializedDates=53`.

Checkpoint reversível:

`outputs/checkpoint-reversivel-20260823_021136.zip`  
SHA-256: `8E4CB8E648C6F14122E60894C72A0AA60102E19261D0BCA19FAEE5DAD754354A`

O checkpoint inclui o código e os arquivos de configuração necessários para comparação/retorno. O `.env.local` foi excluído do ZIP para não transportar configuração local.

## 4. Backfill executado

O backfill foi executado após a validação do backup e adicionou metadados de sincronização a **662 documentos**. O procedimento foi temporário e não ficou exposto na interface final.

O backfill não é executado automaticamente em cada login. A rotina está protegida em `src/lib/firebaseSync.ts:418-468`.

## 5. O que foi implantado

- Firebase Hosting publicado em: [roteiroelismar.web.app](https://roteiroelismar.web.app/).
- A tela temporária de backfill foi removida antes da publicação limpa.
- A publicação atual contém o piloto incremental compilado com a flag habilitada e allowlist restrita ao UID Master.
- A proteção transacional contra sobrescrita por conflito foi publicada no mesmo piloto, sem ampliar a allowlist.
- A aplicação foi aberta em produção, conectou ao Firebase e carregou 122 cartões de clientes.
- Smoke test pós-publicação: carregamento e recarga aprovados, sem erros/avisos no console em sessão não autenticada.
- Smoke test autenticado: sessão autorizada exibiu nuvem conectada e 122 clientes; após recarga, os dados foram carregados novamente sem erros/avisos.
- Login real na interface publicada confirmado pelo usuário.
- Tela de credenciais confirmou reautenticação por senha atual; nenhum dado de senha foi digitado ou alterado durante o teste.

Essa validação confirma carregamento funcional para o piloto. Ela não comprova, sozinha, a redução financeira: ainda é necessário comparar leituras antes/depois no Billing e no uso do Firestore.

## 6. Verificações executadas

| Verificação | Resultado |
|---|---|
| `npm run lint` | Aprovado |
| `npm run build` | Aprovado |
| `npm run test:rules` | 7/7 aprovados |
| `npm run test:backup` | 1/1 aprovado |
| `npm run test:backup-emulator` | 1/1 aprovado |
| `npm run test:incremental` | 3/3 aprovados |
| `npm run test:auth` | 1/1 aprovado no Auth Emulator |
| `npm run test:pwa` | 1/1 aprovado |
| `npm run test:bundle` | 1/1 aprovado; sem padrões privados proibidos |
| `git diff --check` | Aprovado; apenas avisos de CRLF |
| Publicação Firebase Hosting | Concluída |
| Carga do piloto em produção | 122 clientes carregados |
| Smoke test publicado desktop/celular | Aprovado; 0 erros/avisos de console |

## 7. Pendências técnicas

1. Medir leituras, gravações, exclusões, erros e latência no Google Cloud Billing/Firestore.
2. Testar o mesmo usuário em dois dispositivos simultâneos.
3. Testar offline, alteração local, retorno online e reprocessamento da fila.
4. Validar em dois dispositivos a proteção de `baseRevision` e a mensagem de conflito.
5. Validar amostras e contagens antes/depois do backfill em cada coleção.
6. Reforçar as regras para validar autoria, tipos, tamanho, revisão e tombstones.
7. Observar o piloto por período definido antes de ampliar a allowlist.
8. Só depois dos critérios de aceite, ativar os demais usuários.
9. Executar login/logout/reautenticação pela interface publicada com credencial autorizada.
10. Revisar dependências: o último `npm install` reportou 13 vulnerabilidades; não executar correção forçada sem análise.
11. Avaliar os avisos de build sobre chunk grande e importação dinâmica/estática de `firebase.ts`.

## 8. Estado de decisão

**Estado:** piloto publicado; ativação ampla bloqueada por segurança operacional.

**Pode continuar:** coleta de métricas, testes controlados e correções reversíveis.

**Não deve ser feito ainda:** remover o fallback completo, apagar tombstones, ampliar a allowlist sem métricas ou afirmar custo zero sem dados do Billing.

## 9. Ponto crítico de implantação

O último comando de publicação executado foi `deploy --only hosting`. Portanto, há evidência de publicação do Hosting, mas não há evidência equivalente de publicação das alterações em `firestore.rules` e `firestore.indexes.json` no ambiente de produção.

**Impacto:** a segurança efetiva das regras e a disponibilidade dos índices incrementais ainda precisam ser confirmadas no Firebase Console ou por um deploy controlado de Firestore. A ativação ampla permanece bloqueada até essa confirmação.

## 10. Rollback

1. Desativar a flag incremental e remover a allowlist do próximo build.
2. Executar `npm run lint` e `npm run build`.
3. Publicar a versão compatível pelo Firebase Hosting.
4. Manter os metadados `_sync`; o fluxo completo consegue ler os documentos.
5. Se houver suspeita de corrupção, comparar com o backup e restaurar primeiro em ambiente separado.

O rollback de aplicação não exige apagar dados do Firestore.
