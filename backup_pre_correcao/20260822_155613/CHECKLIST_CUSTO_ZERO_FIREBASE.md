# Checklist — custo zero sem interrupção

**Projeto:** `roteiroelismar`  
**Meta:** manter a aplicação funcionando, preservar os backups e evitar cobrança por uso excedente.  
**Plano:** Blaze, sem desvincular o faturamento durante a migração.

> Não marque um item como concluído sem evidência: arquivo, teste, tela do console ou resultado de comando.

## 1. Pré-condições de segurança

- [ ] Criar backup completo dos dados do Firestore.
- [ ] Testar a restauração do backup em ambiente descartável.
- [ ] Confirmar que o backup contém `clients`, `visits`, `negotiations`, `voiceNotes`, `events` e `loans`.
- [ ] Registrar contagem de documentos por coleção antes da mudança.
- [ ] Registrar o uso atual do Firestore e Hosting.
- [ ] Confirmar que o projeto correto é `roteiroelismar`.
- [ ] Preservar alterações existentes do repositório.
- [ ] Não executar `git reset --hard`, exclusões amplas ou limpeza de dados.

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

## 3. Segurança da aplicação

- [ ] Remover a senha padrão `elismar123` do código.
- [ ] Remover senhas armazenadas em `localStorage`.
- [ ] Usar Firebase Auth para reautenticação e alteração de senha.
- [ ] Remover qualquer chave secreta do frontend e do bundle.
- [ ] Restringir as regras do Firestore aos UIDs autorizados.
- [ ] Garantir que `isAuthorized()` seja realmente usada pelas regras.
- [ ] Bloquear acesso entre usuários não autorizados.
- [ ] Validar tipo, tamanho, proprietário e campos dos documentos.
- [ ] Testar criação, leitura, alteração e exclusão nas regras.
- [ ] Manter as regras antigas disponíveis para rollback documentado.

## 4. Modelo de sincronização incremental

- [ ] Definir metadados obrigatórios:

```ts
_sync: {
  revision: number;
  updatedAt: Timestamp;
  updatedBy: string;
  deletedAt?: Timestamp | null;
}
```

- [ ] Adicionar uma versão do schema de sincronização.
- [ ] Criar cursor por usuário e coleção.
- [ ] Definir tamanho máximo de página, recomendado: 200 documentos.
- [ ] Implementar leitura por `updatedAt` e identificador do documento.
- [ ] Implementar paginação com `nextCursor`.
- [ ] Gravar somente documentos alterados.
- [ ] Substituir exclusão física por tombstone.
- [ ] Implementar detecção de conflito por `baseRevision`.
- [ ] Impedir sobrescrita silenciosa de alteração remota.
- [ ] Limitar tamanho da fila offline.
- [ ] Garantir reprocessamento idempotente da fila.
- [ ] Corrigir `hasCloudData()` para não tratar erro como banco vazio.
- [ ] Manter o fluxo completo apenas como fallback temporário.

## 5. Migração dos documentos existentes

- [ ] Fazer backfill dos documentos antigos com `_sync`.
- [ ] Executar o backfill somente após backup validado.
- [ ] Não executar backfill automaticamente em todo login.
- [ ] Conferir contagens antes e depois do backfill.
- [ ] Conferir amostras de documentos de cada coleção.
- [ ] Conferir que nenhum documento foi duplicado.
- [ ] Conferir que nenhum documento foi excluído indevidamente.
- [ ] Registrar data, operador e resultado do backfill.

## 6. Feature flag e rollout

- [ ] Criar feature flag para a sincronização incremental.
- [ ] Manter a flag desligada no primeiro deploy.
- [ ] Publicar somente código compatível com os dados atuais.
- [ ] Ativar para um usuário interno.
- [ ] Testar login, logout e sincronização desse usuário.
- [ ] Testar dois dispositivos simultâneos.
- [ ] Testar offline → alteração → online.
- [ ] Testar conflito entre dispositivos.
- [ ] Monitorar leituras, gravações, exclusões e erros.
- [ ] Ativar para os demais usuários somente após aprovação.
- [ ] Manter rollback disponível durante o período de observação.

## 7. Testes obrigatórios

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Testes do Firestore Emulator.
- [ ] Usuário autorizado consegue acessar seus dados.
- [ ] Usuário não autorizado recebe negação.
- [ ] Usuário não consegue acessar dados de outro usuário.
- [ ] Login por e-mail/senha funciona.
- [ ] Logout funciona.
- [ ] Reautenticação funciona.
- [ ] Backup funciona.
- [ ] Restauração funciona sem deixar dados obsoletos.
- [ ] Aplicação funciona após recarregar a página.
- [ ] Aplicação funciona em modo offline básico.
- [ ] PWA continua instalável.
- [ ] Não há erros no console do navegador.
- [ ] Não há secrets no bundle final.
- [ ] Teste visual em desktop e celular.

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
**Status:** [ ] Aprovado  [ ] Aprovado com ressalvas  [ ] Bloqueado

## Referências

- [Preços do Firebase](https://firebase.google.com/pricing)
- [Preços do Firestore](https://firebase.google.com/docs/firestore/pricing)
- [Planos de preços do Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
- [Cursores e paginação do Firestore](https://firebase.google.com/docs/firestore/query-data/query-cursors)
- [Uso e preços do Firebase Hosting](https://firebase.google.com/docs/hosting/usage-quotas-pricing)
