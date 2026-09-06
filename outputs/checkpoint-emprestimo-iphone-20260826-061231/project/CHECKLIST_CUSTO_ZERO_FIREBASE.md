# Checklist — custo zero sem interrupção

**Projeto:** `roteiroelismar`  
**Meta:** manter a aplicação funcionando, preservar os backups e evitar cobrança por uso excedente.  
**Plano:** Blaze, sem desvincular o faturamento durante a migração.

**Status atual:** PILOTO PUBLICADO; ativação ampla bloqueada até métricas e testes de segurança operacional.  
**Última atualização:** 23/08/2026 — backfill de 662 documentos concluído; proteção de conflito publicada no piloto incremental limitado ao UID Master; smoke test pós-deploy aprovado.

> Não marque um item como concluído sem evidência: arquivo, teste, tela do console ou resultado de comando.

Contagem registrada no backup protegido (`backup-roteiroelismar-20260822-221408.json`): `clients=122`, `visits=396`, `negotiations=102`, `voiceNotes=1`, `events=8`, `loans=33`, `initializedDates=53`.

## 1. Pré-condições de segurança

- [x] Criar backup completo dos dados do Firestore.
- [x] Validar a estrutura e os IDs do backup protegido (`npm run test:backup`).
- [x] Testar a restauração do backup em ambiente descartável (`npm run test:backup-emulator`, 1/1).
- [x] Confirmar que o backup contém `clients`, `visits`, `negotiations`, `voiceNotes`, `events` e `loans`.
- [x] Registrar contagem de documentos por coleção antes da mudança.
- [ ] Registrar o uso atual do Firestore e Hosting.
- [x] Confirmar que o projeto correto é `roteiroelismar`.
- [x] Preservar alterações existentes do repositório.
- [x] Criar checkpoint reversível antes de prosseguir: `outputs/checkpoint-reversivel-20260823_021136.zip` — SHA-256 `8E4CB8E648C6F14122E60894C72A0AA60102E19261D0BCA19FAEE5DAD754354A`.
- [x] Não executar `git reset --hard`, exclusões amplas ou limpeza de dados.

## 2. Firebase Console

- [ ] Confirmar o plano Blaze e a conta de faturamento vinculada.
- [ ] Criar alerta de orçamento no Google Cloud Billing.
- [ ] Conferir os SKUs cobrados pelo projeto.
- [ ] Conferir custo de armazenamento dos backups.
- [ ] Confirmar frequência e retenção dos backups.
- [ ] Confirmar os dois usuários autorizados no Firebase Authentication.
- [ ] Decidir se o Google Login será habilitado ou removido da interface.
- [ ] Confirmar que não existem Cloud Functions ativas não documentadas.
- [ ] Confirmar que não existem serviços Cloud Run ativos.
- [ ] Confirmar que não existem buckets Storage usados externamente.
- [ ] Confirmar que não existem Extensions instaladas.
- [ ] Conferir as regras efetivamente implantadas no Firestore.
- [ ] Confirmar que `firestore.rules` e `firestore.indexes.json` foram implantados em produção.

## 3. Segurança da aplicação

- [x] Remover a senha padrão `elismar123` do código.
- [x] Remover senhas armazenadas em `localStorage`.
- [x] Usar Firebase Auth para reautenticação e alteração de senha.
- [ ] Remover qualquer chave secreta do frontend e do bundle.
- [x] Restringir as regras do Firestore aos UIDs autorizados.
- [x] Garantir que `isAuthorized()` seja realmente usada pelas regras.
- [ ] Bloquear acesso entre usuários não autorizados.
- [ ] Validar tipo, tamanho, proprietário e campos dos documentos.
- [ ] Testar criação, leitura, alteração e exclusão nas regras.
- [ ] Manter as regras antigas disponíveis para rollback documentado.

## 4. Modelo de sincronização incremental

- [x] Definir metadados obrigatórios:

```ts
_sync: {
  revision: number;
  updatedAt: Timestamp;
  updatedBy: string;
  deletedAt?: Timestamp | null;
}
```

- [x] Adicionar uma versão do schema de sincronização.
- [x] Criar cursor por usuário e coleção.
- [x] Definir tamanho máximo de página, recomendado: 200 documentos.
- [x] Implementar leitura por `updatedAt` e identificador do documento.
- [x] Implementar paginação com `nextCursor`.
- [x] Gravar somente documentos alterados no caminho da fila.
- [x] Substituir exclusão física por tombstone quando a flag incremental estiver ativa.
- [x] Implementar detecção de conflito por `baseRevision` em transação.
- [x] Impedir sobrescrita silenciosa de alteração remota — Emulator 1/1.
- [ ] Validar conflito e mensagem de resolução em dois dispositivos reais.
- [ ] Limitar tamanho da fila offline.
- [ ] Garantir reprocessamento idempotente da fila.
- [x] Corrigir `hasCloudData()` para não tratar erro como banco vazio.
- [x] Manter o fluxo completo apenas como fallback temporário.
- [x] Criar marcador de versão `users/{uid}/config/syncState` atrás de feature flag.
- [x] Atualizar o marcador junto com batches da fila offline.
- [x] Publicar piloto incremental limitado ao UID Master.
- [ ] Confirmar redução de leituras no console após o piloto.

## 5. Migração dos documentos existentes

- [x] Fazer backfill dos documentos antigos com `_sync` — 662 documentos.
- [x] Executar o backfill somente após backup validado.
- [x] Não executar backfill automaticamente em todo login.
- [ ] Conferir contagens antes e depois do backfill em cada coleção.
- [ ] Conferir amostras de documentos de cada coleção.
- [ ] Conferir que nenhum documento foi duplicado.
- [ ] Conferir que nenhum documento foi excluído indevidamente.
- [ ] Registrar data, operador e resultado do backfill.

## 6. Feature flag e rollout

- [x] Criar feature flag para a sincronização incremental.
- [x] Manter a flag desligada no build geral e ativar somente o piloto autorizado.
- [x] Publicar somente código compatível com os dados atuais.
- [x] Ativar para um usuário interno/UID piloto autorizado.
- [x] Validar carregamento do piloto em produção: 122 clientes.
- [ ] Testar login, logout e sincronização desse usuário.
- [ ] Testar dois dispositivos simultâneos.
- [ ] Testar offline → alteração → online.
- [ ] Testar conflito entre dispositivos.
- [ ] Monitorar leituras, gravações, exclusões e erros.
- [ ] Ativar para os demais usuários somente após aprovação.
- [ ] Manter rollback disponível durante o período de observação.

## 7. Testes obrigatórios

- [x] `npm run lint`
- [x] `npm run build`
- [x] `npm run test:incremental` — 3/3 aprovados, incluindo bloqueio de conflito.
- [x] Testes do Firestore Emulator — 7/7 aprovados em 22/08/2026.
- [x] Usuário autorizado consegue acessar seus dados — regras testadas no Emulator e sessão publicada carregou 122 clientes.
- [x] Usuário não autorizado recebe negação — regras testadas no Emulator.
- [x] Usuário não consegue acessar dados de outro usuário — regras testadas no Emulator.
- [x] Sessão autenticada na interface publicada funciona — nuvem conectada e 122 clientes carregados.
- [x] Login por e-mail/senha funciona na interface publicada — confirmado pelo usuário.
- [ ] Logout funciona na interface publicada.
- [ ] Reautenticação funciona na interface publicada.
- [x] Login, senha inválida, troca de senha e novo login funcionam no Auth Emulator.
- [x] Backup funciona — schema validado e restauração no Emulator aprovada.
- [x] Restauração preserva contagens e IDs no ambiente descartável.
- [x] Aplicação publicada funciona após recarregar a página — sessão autenticada recarregada com 122 clientes.
- [ ] Aplicação funciona em modo offline básico.
- [x] Configuração PWA validada — manifest, ícones e service worker.
- [x] Smoke test publicado sem erros/avisos no console — sessões não autenticada e autenticada.
- [x] Bundle final sem padrões de chave privada, segredo conhecido ou senha legada.
- [x] Smoke test visual/responsivo em desktop 1280x800 e celular 390x844.

## 8. Validação de custo

- [ ] Firestore permanece abaixo de 50.000 leituras/dia.
- [ ] Firestore permanece abaixo de 20.000 gravações/dia.
- [ ] Firestore permanece abaixo de 20.000 exclusões/dia.
- [ ] Firestore permanece abaixo de 1 GiB armazenado.
- [ ] Saída do Firestore permanece abaixo de 10 GiB/mês.
- [ ] Hosting permanece dentro da cota gratuita.
- [ ] Storage permanece sem uso, se não for necessário.
- [ ] Cloud Run permanece sem serviços ativos.
- [ ] Cloud Functions permanece sem funções não necessárias.
- [ ] Não instalar Extensions sem análise de custo.
- [ ] Conferir o Billing após 24 horas.
- [ ] Conferir o Billing após 7 dias.
- [ ] Separar custo da aplicação de custo dos backups.

## 9. Critérios para aprovar o deploy

- [ ] Backup validado.
- [ ] Regras testadas e implantadas corretamente.
- [ ] Build aprovado.
- [ ] Nenhum segredo exposto.
- [ ] Nenhuma perda de dados detectada.
- [ ] Nenhum erro crítico no login ou na sincronização.
- [ ] Sincronização incremental aprovada em teste real controlado.
- [ ] Rollback documentado e testado.
- [ ] Custo projetado dentro das cotas gratuitas.
- [ ] Custo dos backups conhecido e aprovado.

## 10. Critérios para bloquear a publicação

Bloquear o deploy se ocorrer qualquer uma destas situações:

- [ ] backup não puder ser restaurado;
- [ ] regras permitirem acesso de usuário não autorizado;
- [ ] build ou lint falhar;
- [ ] houver perda ou duplicação de dados;
- [ ] houver sobrescrita silenciosa em conflito;
- [ ] a aplicação depender de uma leitura completa em cada login;
- [ ] o custo dos backups não estiver identificado;
- [ ] não houver rollback funcional;
- [ ] a aplicação parar ou apresentar erro crítico em produção.

## 11. Aprovação final

**Responsável técnico:** ______________________________  
**Data:** ____/____/________  
**Versão publicada:** _________________________________  
**Custo Firestore:** _________________________________  
**Custo backups:** ____________________________________  
**Rollback testado:** [ ] Sim  [ ] Não  
**Status:** [ ] Aprovado  [x] Aprovado com ressalvas  [ ] Bloqueado

## 12. Documentação técnica

- [x] Criar relatório de implementação e implantação: `RELATORIO_TECNICO_IMPLEMENTACAO_FIREBASE_20260823.md`.
- [x] Criar runbook das próximas etapas e rollback: `RUNBOOK_PROXIMAS_ETAPAS_FIREBASE_20260823.md`.

## Referências

- [Preços do Firebase](https://firebase.google.com/pricing)
- [Preços do Firestore](https://firebase.google.com/docs/firestore/pricing)
- [Planos de preços do Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
- [Cursores e paginação do Firestore](https://firebase.google.com/docs/firestore/query-data/query-cursors)
- [Uso e preços do Firebase Hosting](https://firebase.google.com/docs/hosting/usage-quotas-pricing)
