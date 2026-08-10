# Plano seguro — sincronização incremental do Firestore

**Projeto:** roteiroelismar  
**Objetivo:** reduzir leituras e custo do Firestore sem perder dados.  
**Status:** plano criado; nenhuma implementação ou publicação executada.

## 1. Diagnóstico confirmado

O custo principal está no fluxo executado após o login:

- `src/lib/firebaseSync.ts:49` inicia `downloadUserData`.
- As leituras completas ocorrem nas coleções `clients`, `visits`, `negotiations`, `voiceNotes`, `events` e `loans`.
- `src/App.tsx:170-229` chama esse download e substitui o estado local inteiro pelo resultado remoto.
- `hasCloudData` consulta somente `clients` com `limit(1)`. Se a nuvem possuir apenas visitas, negociações ou empréstimos, o banco pode ser interpretado incorretamente como vazio e receber dados locais por cima.
- A fila de `src/lib/syncQueue.ts` já reduz gravações repetidas, mas ainda usa exclusão física e não detecta edição concorrente feita pelo outro usuário.
- `uploadCollection` também lê uma coleção inteira para descobrir exclusões; deve permanecer somente em bootstrap/importação controlada, nunca no fluxo normal de sincronização.
- `src/lib/backupRestore.ts` faz leituras completas por intenção. Backup e restauração ficam fora da otimização de sincronização diária.

## 2. Regras de segurança da mudança

1. Não remover `downloadUserData` imediatamente. Primeiro criar o fluxo novo atrás de uma flag e manter o download completo como fallback de recuperação.
2. Nunca enviar automaticamente o `localStorage` para um banco que tenha qualquer dado remoto.
3. Fazer backup/exportação verificável antes do backfill de metadados.
4. Não apagar fisicamente registros operacionais durante a migração; usar tombstone (`deletedAt`).
5. Não permitir que uma versão local antiga sobrescreva silenciosamente uma alteração remota.
6. Não colocar Admin SDK, service account ou segredo no bundle do navegador.
7. Não publicar regras novas sem testes no Firebase Emulator.

## 3. Modelo de dados proposto

Adicionar aos documentos operacionais:

```ts
{
  createdAt: Timestamp,
  updatedAt: Timestamp,
  updatedBy: string,
  revision: number,
  deletedAt: Timestamp | null
}
```

Aplicar a `clients`, `visits`, `negotiations`, `voiceNotes`, `events` e `loans`.

- `updatedAt` define a ordenação da sincronização.
- `revision` detecta concorrência.
- `deletedAt` representa exclusão lógica e permite que o outro dispositivo receba a remoção incremental.
- `updatedBy` permite auditoria mínima entre os dois usuários compartilhados.
- A aplicação deve ocultar tombstones da interface, mas mantê-los no Firestore durante o período de retenção definido.

Criar também um documento de controle:

`users/{MASTER_UID}/config/sync`

Esse documento conterá a versão do esquema e o status do backfill. O cursor de cada navegador ficará no `localStorage`, separado por usuário efetivo e coleção; assim, um usuário não altera o cursor do outro.

## 4. Fluxo incremental desejado

### 4.1 Primeiro acesso ou cursor ausente

- Ler o documento de controle.
- Se os dados antigos ainda não tiverem metadados, executar apenas o bootstrap/migração aprovado.
- Se houver dados remotos, nunca assumir que o estado local é a fonte correta.
- Se o banco estiver realmente vazio, solicitar/registrar a decisão de usar o local como baseline e gravar uma única vez.
- Depois do bootstrap, salvar o cursor por coleção e marcar `baselineComplete`.

### 4.2 Acessos seguintes

Para cada coleção, consultar somente documentos após o cursor local, em páginas pequenas, por exemplo 200 documentos:

```ts
query(
  collectionRef,
  orderBy('updatedAt'),
  orderBy(documentId()),
  startAfter(lastUpdatedAt, lastDocumentId),
  limit(200)
)
```

- Incluir tombstones na consulta; filtrá-los somente ao montar o estado da interface.
- Usar o par `updatedAt + documentId` para não perder documentos com o mesmo timestamp.
- Persistir o cursor somente depois que a página tiver sido aplicada localmente.
- Se a aplicação cair entre a gravação local e o cursor, repetir a página é aceitável, pois a operação deve ser idempotente.
- Se houver alteração durante a sincronização, processá-la na próxima rodada usando um limite superior capturado no início da rodada.

Opcionalmente, após medir o custo, adicionar no documento `config/sync` um marcador por coleção. Se o marcador não mudou, a coleção pode ser ignorada, reduzindo até as consultas incrementais sem alterações.

### 4.3 Gravações locais

- Toda gravação deve atualizar `updatedAt`, `updatedBy` e `revision`.
- A fila deve incluir `baseRevision` e `baseUpdatedAt` no item pendente.
- Para atualização ou exclusão, ler/transacionar somente o documento alterado e comparar a versão atual com a versão-base.
- Se a versão divergir, não sobrescrever: criar um item `conflict` na fila, preservar o documento remoto e informar o usuário.
- Substituir `delete` físico por gravação de tombstone.
- Manter lotes com margem abaixo do limite do Firestore; o valor atual de 400 é adequado como margem operacional.

## 5. Etapas de implementação

### Fase 0 — Baseline e proteção

- Registrar o número de documentos por coleção, tamanho aproximado e leituras diárias atuais.
- Gerar exportação/backup fora do bundle do cliente e validar que pode ser lido.
- Executar `npm run lint` e `npm run build` antes da mudança.
- Criar testes do Emulator para os dois UIDs compartilhados e para um terceiro UID.
- Não alterar regras de produção nesta fase.

**Saída:** backup validado, métricas de referência e testes reproduzíveis.

### Fase 1 — Metadados e backfill

- Atualizar os tipos TypeScript para aceitar metadados do Firestore.
- Criar normalizadores entre `Timestamp` e o formato usado pelo `localStorage`.
- Criar script administrativo de backfill com modo `dry-run` e relatório de documentos alterados.
- Executar o backfill primeiro em um ambiente/teste e depois em produção em janela controlada.
- Marcar `config/sync` somente após validar que todas as coleções foram processadas.

**Saída:** todos os documentos existentes têm `updatedAt`, `revision` e `deletedAt` compatíveis.

### Fase 2 — Leitura incremental em modo sombra

- Implementar `pullIncrementalCollection` sem remover `downloadUserData`.
- Comparar o resultado incremental com um download completo em ambiente de teste.
- Registrar contagem de documentos recebidos, cursor inicial/final e divergências.
- Usar uma flag de ambiente para ativar o modo sombra somente em usuários de teste.

**Saída:** nenhuma divergência de conteúdo, inclusão, alteração ou remoção.

### Fase 3 — Fila segura e conflitos

- Migrar a fila para tombstones e metadados.
- Implementar a verificação de `revision` por documento.
- Definir a tela/estado para conflito: manter remoto, manter local após confirmação ou mesclar manualmente.
- Tornar o retry idempotente e limitar tentativas sem apagar a pendência.

**Saída:** edição concorrente não causa perda silenciosa.

### Fase 4 — Regras e ativação gradual

- Restringir exclusão física das coleções operacionais.
- Validar tipos, campos obrigatórios, `revision` e autoria nas regras.
- Manter o acesso compartilhado somente aos dois UIDs já definidos.
- Ativar a sincronização incremental para teste, depois para os dois usuários, com possibilidade de desligar pela flag.
- Manter o download completo apenas como reparo explícito enquanto os dados forem observados.

**Saída:** fluxo incremental é o padrão e o fallback continua disponível.

### Fase 5 — Remoção de custos desnecessários

- Remover chamadas automáticas de `hasCloudData` baseadas apenas em `clients`.
- Retirar `uploadCollection` do fluxo normal; conservar somente para importação/bootstrap com confirmação.
- Após período de estabilidade, retirar o download completo da inicialização.
- Definir retenção e limpeza futura dos tombstones separadamente, com backup e janela de recuperação.

## 6. Testes obrigatórios

### Unitários

- Cursor com timestamps iguais e IDs diferentes.
- Paginação de 0, 1, 199, 200 e 201 documentos.
- Reprocessamento da mesma página sem duplicação.
- Tombstone removendo o item local.
- Documento antigo sem metadados.
- Falha antes/depois de persistir o cursor.

### Integração no Emulator

- Leitura e escrita pelos dois usuários autorizados.
- Bloqueio de terceiro usuário.
- Bloqueio de exclusão física operacional.
- Rejeição de `revision` antiga.
- Aceitação de criação sem versão anterior.
- Sincronização de alteração e exclusão lógica entre duas sessões.

### Fluxo realista

- Login com dados existentes.
- Segundo login sem alterações: não baixar coleções inteiras.
- Alteração feita por cada usuário.
- Dois usuários alterando o mesmo documento.
- Modo offline, fechamento do navegador e retorno online.
- Falha no meio de um lote.
- Restauração de backup sem sobrescrever automaticamente a produção.

## 7. Critérios de aceite

- A inicialização normal não executa `getDocs(collectionRef)` sem cursor.
- O primeiro bootstrap é identificável, auditável e executado uma única vez por instalação/cursor.
- Em nova abertura sem alterações, no máximo são lidos metadados/cursors e zero documentos operacionais alterados.
- Alterações remotas são aplicadas sem download completo.
- Exclusões são sincronizadas por tombstone.
- Conflitos são exibidos e não sobrescrevem dados silenciosamente.
- O banco compartilhado continua acessível somente pelos dois usuários autorizados.
- `npm run lint`, `npm run build` e testes do Emulator passam.
- A flag de fallback permite retornar ao fluxo anterior sem restaurar banco nem apagar dados.

## 8. Rollback seguro

1. Desativar a flag incremental.
2. Manter os metadados; eles são compatíveis com o download completo.
3. Reexecutar bootstrap somente para reconstruir o cache local, nunca para sobrescrever a nuvem automaticamente.
4. Se houver corrupção, restaurar o backup em ambiente separado, comparar e só então executar uma restauração aprovada.
5. Não usar `git reset --hard`, exclusão em massa ou limpeza física do Firestore como rollback.

## 9. Ações manuais no Firebase

- Confirmar o projeto `roteiroelismar` e os dois UIDs autorizados.
- Configurar/validar backup e retenção no console, se disponíveis no plano do projeto.
- Publicar índices somente se o Emulator/console solicitar o índice da consulta incremental.
- Testar regras antes de publicar.
- Acompanhar leituras, escritas, erros de permissão e conflitos após a ativação.

## 10. Status de produção

**Aprovado com ressalvas para planejamento; bloqueado para deploy neste momento.**

Ainda faltam implementação, backfill validado, testes do Emulator, validação de conflito e comparação de métricas antes de ativar a mudança em produção.

