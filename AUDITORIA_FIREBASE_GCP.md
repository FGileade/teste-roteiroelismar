# Auditoria técnica Firebase/GCP — roteiroelismar

**Data da auditoria:** 16/08/2026  
**Projeto auditado:** `roteiroelismar`  
**Project number:** `750940261190`  
**Escopo:** código-fonte, configurações locais, dependências e console Firebase/GCP em consulta somente leitura.

## 1. Resumo executivo

O projeto usa efetivamente três serviços principais: Firebase Authentication, Cloud Firestore e Firebase Hosting. O Firestore é essencial para os dados da aplicação, mas o fluxo atual ainda baixa coleções completas no login e executa comparações/deleções físicas, o que aumenta leituras, escritas e risco de perda de dados.

Há dois riscos de segurança prioritários:

1. `src/components/Settings.tsx` contém a senha padrão `elismar123` e grava a nova senha em `localStorage`.
2. `firestore.rules` define `isAuthorized()`, mas não a utiliza; a regra efetiva permite a qualquer usuário autenticado ler, gravar e excluir documentos no próprio caminho `/users/{uid}/...`.

Também foram confirmados:

- o projeto possui faturamento vinculado; o relatório do console mostrou aproximadamente **R$ 0,01** atribuído a `roteiroelismar` no período consultado;
- o console mostrou **1,1 mil leituras** e **1,2 mil gravações** do Firestore na janela semanal de 09–15/08/2026;
- a tela de uso do Firestore mostrou **16 leituras, 0 gravações e 2 exclusões nas últimas 24 horas** em 16/08/2026;
- o Google Login está no código, mas somente `E-mail/senha` aparece habilitado no console;
- não foi identificada utilização de Storage, Cloud Run, Cloud Functions, Analytics, FCM, Remote Config, Crashlytics, Performance, Realtime Database ou Extensions;
- backups programados do Firestore aparecem como ativados no console, mas o custo detalhado e a retenção não puderam ser confirmados pela interface consultada.

**Status de produção:** bloqueado para mudanças de regras ou migração de sincronização sem testes de emulador, backup verificado e plano de rollback.

## 2. Método e limites da evidência

Cada conclusão foi separada em:

- **Fato verificado:** observado diretamente no arquivo, na dependência, no código ou no console.
- **Não confirmado:** não houve prova suficiente para concluir.
- **Recomendação:** ação técnica sugerida, não descrição do estado atual.

O arquivo `firebase.json` aponta para o projeto `roteiroelismar`. Uma aba inicialmente aberta no console apontava para `forcafight`; os dados daquele projeto foram excluídos desta auditoria.

O console foi consultado em modo somente leitura. A tela de regras do Firestore não carregou o conteúdo implantado; portanto, as regras abaixo são as regras locais configuradas em `firebase.json`, e a equivalência com a versão atualmente implantada ainda precisa ser confirmada.

Não foi possível obter, pela interface consultada, o detalhamento de faturamento por SKU/serviço, a retenção exata dos backups, exportações de uso ou uma leitura confiável da configuração implantada do Hosting. Esses pontos estão marcados como não confirmados.

## 3. Inventário de configuração

### 3.1 Arquivos encontrados e ausência de arquivos esperados

**Encontrados:**

- `firebase.json`
- `.firebaserc`
- `firestore.rules`
- `package.json` e `package-lock.json`
- `.env.example` e `.env.local` — este último está ignorado pelo Git
- `app.yaml`
- `Dockerfile`
- código web em `src/`

**Não encontrados no repositório:**

- `firestore.indexes.json`
- `storage.rules`
- `database.rules.json`
- `functions/`
- `google-services.json`
- `GoogleService-Info.plist`

A ausência desses arquivos não prova que não existam recursos criados manualmente no console; significa apenas que não há configuração correspondente no repositório.

### 3.2 Provas de configuração

`firebase.json` contém, nas linhas 2–11:

```json
"firestore": { "rules": "firestore.rules" },
"hosting": {
  "site": "roteiroelismar",
  "public": "dist",
  "rewrites": [{ "source": "**", "destination": "/index.html" }]
}
```

Não há seções `storage`, `database`, `functions` ou `emulators` nesse arquivo.

`.firebaserc` contém o projeto padrão:

```json
"projects": { "default": "roteiroelismar" }
```

`package.json` contém `firebase` versão `^12.15.0` e `firebase-admin` versão `^14.1.0`. A dependência `firebase-admin` não possui importação identificada no código ativo. `@google-cloud/firestore` e `@google-cloud/storage` aparecem apenas como dependências transitivas do pacote administrativo.

## 4. Etapa 1 — fichas dos serviços

### 4.1 Firebase Authentication

**Onde está integrado:**

- `src/lib/firebase.ts:7,23,38-40`
- `src/components/Login.tsx:8,37-38,69-70`
- `src/App.tsx:298-320,1167`
- `src/components/Settings.tsx:24,313-322`
- `src/lib/backupRestore.ts:73-77`

**O que faz:** inicializa Auth, autentica por e-mail/senha, tenta autenticação Google, observa a sessão, encerra sessão, altera e-mail/senha e reautentica o usuário antes de backup/restauração.

**Provas:**

```ts
// src/lib/firebase.ts:7
import { getAuth, GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, signOut } from 'firebase/auth';
```

```ts
// src/components/Login.tsx:37-38
await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
```

```ts
// src/App.tsx:298-299
onAuthStateChanged(auth, (user) => { ... });
```

**Nível de uso:** ativo e essencial. No console foram observados dois usuários e somente o provedor `E-mail/senha` habilitado.

**Necessidade:** Essencial. Sem Auth, o usuário não consegue entrar, a aplicação não consegue determinar o caminho do usuário e as regras do Firestore não podem aplicar autenticação.

**Consequência da remoção:** a aplicação pode continuar compilando se os imports forem removidos, mas a execução perde login, logout, sessão, alteração de credenciais, reautenticação e acesso normal ao Firestore. O Firestore também recusaria as operações protegidas pelas regras.

**Dependências ocultas:** Firestore Rules depende de `request.auth`; o backup depende de reautenticação. Não há prova de Identity Platform/MFA ativo.

**Alternativa:** somente uma solução de autenticação própria ou outro provedor, com alteração de regras e fluxo de sessão. Não há substituto nativo gratuito sem migração.

**Observação de configuração:** o botão Google existe em `Login.tsx:69-70`, porém o console mostrou apenas `E-mail/senha` ativo. O caminho Google está, portanto, parcialmente configurado e pode falhar para o usuário final.

### 4.2 Cloud Firestore

**Onde está integrado:**

- `src/lib/firebase.ts:8,27-35`
- `src/lib/firebaseSync.ts:35-219`
- `src/lib/syncQueue.ts:119-170`
- `src/lib/backupRestore.ts:82-275`
- `src/App.tsx:209-296,438-484`
- `firestore.rules:1-32`

**O que faz:** armazena clientes, visitas, negociações, anotações de voz, eventos, empréstimos, configuração, datas e logs de auditoria. Também sustenta a sincronização entre usuários e o backup/restauração.

**Provas do uso essencial:**

```ts
// src/lib/firebaseSync.ts:49-119
const clientsSnap = await getDocs(collection(db, ...'clients'));
const visitsSnap = await getDocs(collection(db, ...'visits'));
const negotiationsSnap = await getDocs(collection(db, ...'negotiations'));
const voiceNotesSnap = await getDocs(collection(db, ...'voiceNotes'));
const eventsSnap = await getDocs(collection(db, ...'events'));
const loansSnap = await getDocs(collection(db, ...'loans'));
```

```ts
// src/lib/backupRestore.ts:101-116
const snapshot = await getDocs(collection(db, ...collectionName));
const configSnap = await getDoc(doc(db, ...'config'));
const datesSnap = await getDoc(doc(db, ...'config', ...'dates'));
```

**Nível de uso:** ativo e essencial, com implementação de sincronização dispendiosa e risco operacional.

**Necessidade:** Essencial. Removê-lo elimina o armazenamento persistente e a sincronização entre dispositivos/usuários.

**Consequência da remoção:** quebra em execução todas as leituras e escritas de `firebaseSync.ts`, `syncQueue.ts` e `backupRestore.ts`; o login pode continuar, mas a aplicação ficará sem seus dados remotos. O TypeScript também acusará imports quebrados se a SDK for removida sem refatoração.

**Dependências ocultas:** Auth é necessário para passar as regras; Hosting não depende do Firestore para entregar os arquivos estáticos. Os backups programados do banco são um recurso operacional do Firestore.

**Alternativa:** armazenamento local apenas para uso offline, ou outro banco; ambos exigem perda ou reimplementação da sincronização. A alternativa correta para reduzir custo é manter Firestore e trocar a leitura completa por sincronização incremental.

**Problema de custo verificado:** `downloadUserData()` executa seis `getDocs()` de coleções inteiras. `uploadCollection()` executa outro `getDocs()` para descobrir ausências e depois pode excluir fisicamente e regravar itens. A função `syncArrayToCloud()` possui lógica incremental, mas não é o caminho principal de bootstrap/login.

### 4.3 Firebase Hosting

**Onde está integrado:**

- `firebase.json:3-11`
- `package.json`, script `deploy`
- `dist/` como saída do build

**O que faz:** publica a aplicação web estática e redireciona rotas para `index.html`.

**Provas:**

```json
// firebase.json:4-10
"site": "roteiroelismar",
"public": "dist",
"rewrites": [{ "source": "**", "destination": "/index.html" }]
```

```json
// package.json, script deploy
"deploy": "npm run build && firebase deploy --only hosting"
```

**Nível de uso:** ativo e essencial para a entrega atual. O console mostrou histórico de implantação em 10/08/2026 e 55 MB de downloads na janela de sete dias.

**Necessidade:** Essencial enquanto a aplicação for entregue por esse Hosting. É possível trocar por outro CDN/hosting, mas não removê-lo sem substituir a entrega.

**Consequência da remoção:** o código ainda pode compilar, mas a URL publicada deixará de servir a aplicação. O Firestore e Auth não seriam apagados por remover apenas a configuração local, mas o produto ficaria indisponível pelo endereço atual.

**Alternativa:** outro hosting estático/CDN. O volume observado é pequeno; a migração não parece necessária para reduzir custo agora.

### 4.4 Firebase Storage

**Onde está integrado:**

- `src/lib/firebase.ts:13`, no campo `storageBucket` da configuração;
- `.env.example`, variável `VITE_FIREBASE_STORAGE_BUCKET`.

**Prova de ausência de uso:** não foi encontrado import de `firebase/storage`, `uploadBytes`, `getDownloadURL`, `deleteObject` ou chamada equivalente no código ativo. Não há `storage.rules`.

**Console:** a lista de buckets não exibiu linhas e o painel do Firebase mostrou armazenamento atual de `0 B`.

**Nível de uso:** configurado no objeto de configuração, mas sem uso identificado no código e sem bucket observado.

**Necessidade:** Dispensável no estado atual.

**Consequência da remoção:** remover apenas a variável e o campo `storageBucket` não deve quebrar as funcionalidades atualmente comprovadas. Pode quebrar algum consumidor externo não localizado no repositório; confirmar antes de apagar o bucket ou desabilitar APIs.

**Custo:** não há consumo identificado. Manter a propriedade de configuração não implica upload; o custo só surgiria com armazenamento, operações ou tráfego.

### 4.5 Google Analytics for Firebase

**Onde está integrado:** somente o campo `measurementId` em `src/lib/firebase.ts:17` e a variável correspondente em `.env.example`.

**Prova de ausência de uso:** não foi encontrado `getAnalytics`, `initializeAnalytics`, `logEvent` ou import de `firebase/analytics` no código ativo.

**Nível de uso:** configurado no objeto, mas sem uso identificado no código.

**Necessidade:** Dispensável atualmente; opcional se o produto precisar de métricas.

**Consequência da remoção:** remover `measurementId` e sua variável não deve quebrar o aplicativo atual. A remoção elimina somente a possibilidade de Analytics, que não está comprovadamente sendo inicializado.

### 4.6 Google Login

Esta é uma subfunção do Firebase Authentication, não um serviço independente.

**Prova no código:** `src/lib/firebase.ts:38` cria `GoogleAuthProvider`; `src/components/Login.tsx:69-70` chama `signInWithPopup`.

**Prova no console:** somente `E-mail/senha` estava ativo.

**Classificação:** Opcional e parcialmente configurado.

**Recomendação:** ou habilitar Google no console e testar domínio autorizado/popup, ou ocultar o botão para não oferecer uma função que não está pronta.

### 4.7 Firebase Cloud Messaging (FCM)

Não foi encontrado `firebase/messaging`, `getToken`, `onMessage`, registro de token ou envio FCM no código. Não há manifesto/configuração nativa comprovando notificações.

**Classificação:** Dispensável; sem uso identificado no código. Não há funcionalidade comprovada a perder hoje.

### 4.8 Firebase App Check

`app.yaml` contém `ENFORCE_APP_CHECK: "true"`, mas não há inicialização de App Check no cliente nem middleware de validação no servidor. Não há `initializeAppCheck`, `ReCaptchaV3Provider`, `getToken` ou equivalente.

**Classificação:** configurado apenas como intenção/contingência, sem enforcement comprovado; Dispensável no caminho atual, mas recomendável para uma futura camada de proteção contra clientes não autorizados.

### 4.9 Firebase Realtime Database, Remote Config, Performance e Crashlytics

Não foram encontrados SDKs, imports, regras ou chamadas de uso para esses serviços. A dependência `firebase` contém módulos transitivos, mas a presença do pacote não é prova de integração.

**Classificação:** Dispensáveis no estado atual; configurados/instalados não foi comprovado.

### 4.10 Cloud Functions

Não existe pasta `functions/`, não há seção `functions` em `firebase.json` e não foram encontrados `onRequest`, `onCall`, `onCreate`, `onDocumentWritten` ou funções deployáveis.

**Classificação:** Dispensável no caminho atual. Não há função ativa identificada no código ou na configuração local.

**Consequência:** remover a expectativa de Functions não quebra o fluxo atual. Se houver funções criadas manualmente em outro projeto/conta, isso não foi confirmado pelo repositório.

### 4.11 Cloud Run e App Engine

`server.ts` é um servidor Express de health check e entrega de arquivos, sem SDK Firebase/GCP. `Dockerfile` e `app.yaml` descrevem caminhos de contingência, e o próprio `app.yaml` informa que o backend não é usado pelo frontend atual. `firebase.json` não os referencia.

**Console:** a página de Cloud Run do projeto correto não mostrou serviços.

**Classificação:** vestigial/contingência; Dispensável para o caminho atual.

**Consequência:** remover esses artefatos não quebra o frontend publicado pelo Firebase Hosting, desde que nenhum deploy alternativo dependa deles.

### 4.12 Gemini/Google AI

`README.md:18` menciona `GEMINI_API_KEY` e o `app.yaml` menciona um backend de IA, mas não foi encontrada chave correspondente no ambiente auditado nem chamada de Gemini/Google AI no código ativo.

**Classificação:** vestigial, Dispensável no estado atual.

**Recomendação:** remover documentação/configuração obsoleta ou registrar explicitamente o plano de reativação. Nunca colocar chave de IA no bundle web.

### 4.13 Firebase Extensions

A tela de Extensions exibiu apenas cards de descoberta com botões de instalação. Não foi identificada lista de extensão instalada.

**Classificação:** sem uso identificado; Dispensável. Não instalar “Firestore to BigQuery” apenas para observar dados sem antes aprovar custo, privacidade e retenção.

### 4.14 Firebase Admin SDK e pacotes `@google-cloud/*`

`firebase-admin` está declarado em `package.json`, mas não foi localizado import ou execução no código ativo. `@google-cloud/firestore` e `@google-cloud/storage` estão no lockfile como dependências transitivas.

**Classificação:** dependência vestigial, Dispensável após confirmação de que não há scripts externos/CI que usem Admin SDK.

**Consequência:** remover `firebase-admin` do `package.json` não deve quebrar o build atual com base nos arquivos auditados, mas deve ser validado com `npm run lint` e `npm run build`.

### 4.15 Firestore backups

O console mostrou backups programados como ativados para o banco `(default)`. Não há configuração local de backup no repositório.

**Classificação:** operacionalmente Essencial para proteção de dados, embora não seja uma chamada feita pelo frontend.

**Consequência da remoção:** a aplicação continuaria funcionando, mas perderia uma camada importante de recuperação após exclusão, corrupção ou erro de migração.

**Limite:** custo, retenção, frequência e localização dos backups não foram confirmados na interface consultada.

## 5. Regras do Firestore — achados de segurança

Arquivo: `firestore.rules`.

### 5.1 Regra de autorização não utilizada — alta severidade

As linhas 6–13 definem:

```text
function isMasterOrShared(uid) {
  return uid == 'OJtAzjEd9BhU9LQN9R52hP7gjkb2'
      || uid == 'KQBu6SfAcMSCKBrgp6dlxkQ2Zna2';
}
function isAuthorized() {
  return request.auth != null && isMasterOrShared(request.auth.uid);
}
```

Porém, a regra efetiva nas linhas 17–24 não chama `isAuthorized()`:

```text
match /users/{userId}/{document=**} {
  allow read, write, delete: if request.auth != null && (
    userId == request.auth.uid ||
    (userId == 'OJtAzjEd9BhU9LQN9R52hP7gjkb2' && (
      request.auth.uid == 'OJtAzjEd9BhU9LQN9R52hP7gjkb2' ||
      request.auth.uid == 'KQBu6SfAcMSCKBrgp6dlxkQ2Zna2'
    ))
  );
}
```

**Fato:** qualquer usuário autenticado pode acessar o próprio caminho, mesmo que não esteja entre os dois UIDs pretendidos. Também há permissão genérica de `delete` e nenhuma validação de campos, tipos, tamanho, proprietário lógico ou revisão.

**Recomendação:** corrigir regras com testes no Emulator Suite antes do deploy. Casos mínimos: UID autorizado, UID autenticado arbitrário, usuário cruzando o caminho de outro usuário, criação/alteração de documento malformado e exclusão física.

### 5.2 Verificação de implantação

A versão local é referenciada pelo `firebase.json`, mas a versão implantada não foi lida no console. Não publicar uma correção diretamente sem comparar o hash/versão e executar testes de regras.

## 6. Sincronização e redução de custo do Firestore

### 6.1 Fluxo atual comprovado

`src/App.tsx:209-296`:

- processa a fila local;
- chama `hasCloudData()`;
- se não encontrar dados, lê localStorage e chama `uploadAllUserData()`;
- caso contrário chama `downloadUserData()` e substitui o estado local.

`src/lib/firebaseSync.ts:35-43` usa `limit(1)` apenas na coleção `clients`, e retorna `false` em caso de erro. Portanto, um erro de leitura pode ser interpretado como “não há dados” e disparar um upload inicial.

`src/lib/firebaseSync.ts:49-119` executa leitura integral das seis coleções.

`src/lib/firebaseSync.ts:123-176` lê a coleção atual para localizar ausências, exclui documentos e regrava itens. O lote possui até 400 operações.

`src/App.tsx:438-484` calcula diferenças por `JSON.stringify`, adiciona operações à fila e processa a fila, mas esse caminho não substitui a leitura integral inicial.

`src/lib/syncQueue.ts:135-137` usa `batch.set` e `batch.delete`; não há revisão, transação, precondição, tombstone ou resolução de conflito.

### 6.2 Riscos

- custo de leitura cresce com o tamanho das coleções, mesmo quando apenas um item mudou;
- múltiplos usuários/dispositivos repetem a mesma leitura completa;
- erro em `hasCloudData()` pode produzir upload indevido;
- exclusão física dificulta recuperação e reconciliação offline;
- `batch.set` pode sobrescrever alteração remota sem detectar conflito;
- somente `clients` determina se há dados remotos, embora existam outras coleções;
- eventos usam uma fusão especial por `createdAt`, enquanto as demais coleções substituem o estado local.

### 6.3 Plano seguro recomendado

**Fase 0 — proteção:** exportar backup, confirmar restauração em ambiente de teste, registrar métricas atuais e congelar alterações de regras durante a migração.

**Fase 1 — modelo de sincronização:** adicionar em cada documento `updatedAt`, `deletedAt`/tombstone, `revision` e `updatedBy`; usar timestamp do servidor; definir um `syncState` por coleção e usuário.

**Fase 2 — leitura incremental:** consultar apenas documentos alterados após o cursor salvo, ordenados por `updatedAt` e `__name__`, com paginação. O primeiro sync ainda será completo, mas apenas uma vez por dispositivo/usuário; os seguintes serão incrementais.

**Fase 3 — escrita incremental:** gravar somente itens modificados, em batches limitados; não executar `getDocs()` da coleção inteira para descobrir exclusões; criar tombstones e removê-los apenas após retenção segura.

**Fase 4 — conflitos:** enviar a revisão-base, comparar revisão no servidor e colocar conflitos em estado explícito para resolução. Não fazer `batch.set` cego em documentos alterados por outro dispositivo.

**Fase 5 — rollout:** habilitar por usuário interno, comparar contagem/checksum antes e depois, observar erros e leituras por sessão, manter feature flag e rollback para o fluxo anterior apenas enquanto os dados permanecerem compatíveis.

Essa abordagem reduz principalmente leituras recorrentes e regravações, preservando o Firestore como serviço essencial. A documentação oficial recomenda cursores/paginação para percorrer resultados e cobra leituras, gravações e exclusões por operação: [cursores do Firestore](https://firebase.google.com/docs/firestore/query-data/query-cursors), [preços do Firestore](https://firebase.google.com/docs/firestore/pricing).

## 7. Backup e restauração

**Uso verificado:** `src/lib/backupRestore.ts:91-171` lê todas as coleções e produz um arquivo JSON local; `src/lib/backupRestore.ts:187-229` restaura dados; `src/lib/backupRestore.ts:258-275` grava log de auditoria.

**Pontos positivos:** há reautenticação em `reauthUser()` antes da operação.

**Riscos:**

- `validateBackupFile()` valida apenas campos básicos e não confirma projeto, usuário efetivo, tenant, tipos, limites de tamanho ou schema completo;
- a restauração pode sobrescrever documentos existentes;
- a restauração não remove documentos antigos que não estejam no arquivo, deixando dados obsoletos;
- não há versão de schema/revisão para impedir importação incompatível;
- logs de auditoria podem conter metadados sensíveis e falhas são ignoradas.

**Recomendação:** exigir `projectId` e usuário/tenant compatíveis, exibir prévia, limitar tamanho, validar schema por coleção, gravar em namespace temporário, conferir contagens/checksums e promover por etapas. Manter a exportação antes de toda restauração.

## 8. Etapa 2 — custos e mitigação

### 8.1 Firebase Authentication

**Gera custo:** as opções básicas de autenticação, incluindo e-mail/senha, possuem cota sem custo; custos podem surgir com recursos/produtos de Identity Platform ou SMS. O projeto está com faturamento vinculado, portanto está no modelo Blaze/pay-as-you-go.

**Consumo verificado:** dois usuários no console. DAU/MAU e custo por método não foram disponibilizados pela tela consultada.

**Risco de crescimento:** baixo para e-mail/senha; alto para SMS/MFA se ativado.

**Mitigação:** manter e-mail/senha, não ativar SMS sem orçamento, remover o botão Google ou habilitar o provedor conscientemente, configurar alertas de orçamento.

**Pode zerar:** o uso básico pode permanecer dentro da cota sem custo; não é possível prometer custo zero para SMS/Identity Platform pago sem limitar esses recursos.

### 8.2 Cloud Firestore

**Gera custo:** sim, no Blaze, conforme leituras, gravações, exclusões, armazenamento, índices, rede e backups, descontadas as cotas aplicáveis.

**Consumo verificado:**

- console Firebase, 09–15/08/2026: 1,1 mil leituras e 1,2 mil gravações;
- console Firestore, última atualização 16/08/2026 13:11 GMT-3: 16 leituras, 0 gravações e 2 exclusões em 24 horas;
- cobrança do projeto no relatório consultado: aproximadamente R$ 0,01 no período atual.

**Risco de crescimento:** alto. O código escala leituras com o total de documentos e repete isso em cada login/sincronização. `getDocs()` integral, leitura para detectar ausências, regravações e exclusões físicas são os principais multiplicadores.

**Mitigação:** sincronização incremental com cursor, paginação, metadados de revisão, tombstones, cache local, batches apenas para alterações e remoção do upload automático quando `hasCloudData()` falhar. Medir leituras por sessão e tamanho de payload.

**Pode zerar:** não de forma confiável enquanto o Firestore continuar como banco ativo. Pode reduzir a zero em períodos de ausência de uso ou migrar para armazenamento local/outro banco, mas isso altera a funcionalidade e não é recomendado para este produto.

### 8.3 Firebase Hosting

**Gera custo:** pode gerar custo no Blaze por armazenamento e transferência acima das cotas.

**Consumo verificado:** 55 MB de downloads na janela de sete dias; houve implantação em 10/08/2026.

**Risco de crescimento:** baixo no volume atual; cresce com downloads, releases e tráfego.

**Mitigação:** manter bundle pequeno, cache adequado, compressão, evitar arquivos grandes no `dist`, configurar alertas e revisar retenção de releases.

**Pode zerar:** provavelmente sim no volume atual, permanecendo dentro das cotas do Hosting. A página oficial descreve as cotas e a cobrança excedente: [Firebase Hosting — uso e preços](https://firebase.google.com/docs/hosting/usage-quotas-pricing?hl=pt-br).

### 8.4 Firebase Storage

**Gera custo:** poderia gerar custo por armazenamento, operações e transferência; não há consumo identificado.

**Evidência:** nenhum bucket listado no console, 0 B no painel Firebase e nenhum uso de SDK no código.

**Risco:** inexistente no caminho atual; surgiria quando uploads fossem adicionados.

**Mitigação:** remover a configuração vestigial se nenhum consumidor externo existir; não criar bucket apenas por manter uma variável.

**Pode zerar:** sim, mantendo o serviço sem uso. A documentação informa que o Cloud Storage for Firebase requer o plano Blaze para novos buckets: [Cloud Storage for Firebase](https://firebase.google.com/docs/storage/web/start).

### 8.5 Firestore backups

**Gera custo:** potencialmente sim, conforme armazenamento/retensão e operações do recurso de backup.

**Evidência:** backups programados aparecem ativados no console. O valor por serviço, retenção e tamanho não foram confirmados.

**Risco:** cresce com o tamanho do banco e a retenção.

**Mitigação:** manter backups por segurança, revisar frequência/retenção, testar restauração e verificar o SKU específico no relatório de faturamento antes de reduzir proteção.

**Pode zerar:** somente desativando backups ou reduzindo retenção; isso aumenta o risco de perda permanente. Não recomendado sem uma política formal de recuperação.

### 8.6 Cloud Functions, Cloud Run, App Engine, Analytics, FCM, Remote Config, Crashlytics, Performance, App Check e Extensions

**Gera custo hoje:** não há consumo de aplicação comprovado para esses serviços.

**Evidência:** nenhuma função/serviço Cloud Run no projeto correto, nenhuma pasta `functions/`, nenhum import/call dos SDKs correspondentes e nenhuma extensão instalada identificada.

**Risco:** zero no caminho atual; APIs habilitadas no inventário do GCP, por si só, não comprovam uso faturável.

**Mitigação:** remover dependências e configurações vestigiais depois de verificar CI/CD e recursos criados manualmente; não instalar extensões sem orçamento.

**Pode zerar:** sim, mantendo-os sem deploy/uso. O `app.yaml`, `Dockerfile` e `server.ts` podem ser mantidos apenas se houver plano real de reativação.

### 8.7 Firebase Admin SDK

**Gera custo:** o pacote em si não gera cobrança; um processo que o utilize pode gerar custos pelos serviços chamados.

**Evidência:** dependência direta sem importação encontrada.

**Mitigação:** remover após validação de build, scripts, CI e jobs externos.

## 9. Tabela-resumo da Etapa 1

| Serviço | Nível de uso | Classificação | Quebra se removido? | Recomendação |
|---|---|---|---|---|
| Firebase Authentication | Ativo; e-mail/senha | Essencial | Sim/parcial | Manter; corrigir senha local e decidir Google Login |
| Cloud Firestore | Ativo; banco e sync | Essencial | Sim | Manter; migrar para sync incremental |
| Firebase Hosting | Ativo; deploy web | Essencial | Sim para entrega | Manter e otimizar bundle/cache |
| Google Login | Código ativo, provedor desativado | Opcional/parcial | Parcial | Habilitar e testar ou ocultar botão |
| Firestore backups | Ativado no console | Essencial operacional | Não na execução; alto risco operacional | Manter e validar retenção/custo |
| Firebase Storage | Só configuração; 0 B/bucket não listado | Dispensável | Não identificado | Remover configuração após checar consumidores externos |
| Analytics | Só `measurementId` | Dispensável | Não | Remover campo se não houver requisito de métricas |
| FCM | Sem uso identificado | Dispensável | Não | Não instalar/configurar sem requisito |
| App Check | Intenção em `app.yaml`, sem enforcement | Dispensável atualmente | Não | Planejar proteção futura, não declarar habilitado |
| Realtime Database | Sem uso identificado | Dispensável | Não | Não criar regras/recursos sem necessidade |
| Remote Config | Sem uso identificado | Dispensável | Não | Remover dependência/configuração se existir externamente |
| Crashlytics/Performance | Sem uso identificado | Dispensável | Não | Não há evidência para manter |
| Cloud Functions | Sem pasta/configuração/deploy identificado | Dispensável | Não | Remover caminho vestigial após checagem de CI |
| Cloud Run/App Engine | Contingência; sem Cloud Run ativo | Dispensável no caminho atual | Não | Manter somente se houver plano de backend |
| Gemini/Google AI | Apenas documentação/configuração obsoleta | Dispensável | Não | Limpar referências e não expor chaves |
| Firebase Extensions | Nenhuma instalada identificada | Dispensável | Não | Não instalar sem análise de custo/privacidade |
| Firebase Admin SDK | Dependência sem uso identificado | Dispensável | Não, após build | Remover com validação de CI/scripts |

## 10. Tabela-resumo da Etapa 2

| Serviço | Gera custo hoje? | Dentro da cota? | Risco de crescimento | Mitigação | Pode zerar? |
|---|---|---|---|---|---|
| Authentication | Não identificado para e-mail/senha; Blaze vinculado | Não há MAU/DAU suficiente para concluir | Baixo; SMS é alto | Restringir SMS/MFA e alertas | Uso básico, provavelmente sim |
| Firestore | Sim/potencial; R$ 0,01 atribuído ao projeto no relatório | O painel diário estava abaixo das cotas exibidas | Alto | Cursor, paginação, tombstones, cache, batches | Não sem alterar o banco |
| Hosting | Não isolado; 55 MB de downloads | Volume compatível com cota documentada | Baixo | Compressão, cache, bundle menor | Provavelmente sim no volume atual |
| Storage | Não identificado; 0 B | Sim, sem uso | Baixo até upload | Não habilitar/remover config vestigial | Sim |
| Backups | Não isolado; recurso ativado | Não confirmado | Médio/alto conforme retenção | Revisar retenção e SKU | Só desativando proteção |
| Functions/Run/App Engine | Não identificado | Sem serviço ativo observado | Zero hoje | Não fazer deploy; remover contingência se aprovada | Sim |
| Analytics/FCM/Remote Config/Crashlytics/Performance/App Check | Não identificado | Sem uso identificado | Zero hoje | Não configurar sem requisito | Sim |
| Extensions | Não identificado; nenhuma instalada observada | Não aplicável | Variável | Não instalar sem orçamento | Sim |

## 11. Plano de ação priorizado

### P0 — antes de qualquer deploy

1. Remover a senha padrão e o armazenamento de senha em `localStorage`; usar somente o estado do Firebase Auth e reautenticação oficial.
2. Fazer backup exportado e testar restauração.
3. Testar as regras no Emulator Suite, corrigir o uso de `isAuthorized()` e restringir operações por UID/campos/revisão.
4. Confirmar no console qual versão de regras está implantada.

### P1 — segurança e custo

1. Implementar sincronização incremental com cursor e paginação.
2. Substituir exclusão física por tombstones durante a janela de reconciliação.
3. Adicionar detecção de conflito por revisão/`updatedAt` e impedir sobrescrita cega.
4. Corrigir `hasCloudData()` para não transformar erro em “banco vazio”.
5. Decidir o Google Login: ativar corretamente ou remover o botão.
6. Configurar alerta de orçamento e revisar o detalhamento do SKU Firestore/backup.

### P2 — limpeza e observabilidade

1. Confirmar a origem da subcoleção `appointments`, que apareceu no console, mas não corresponde ao caminho `events` usado no fluxo principal.
2. Investigar `voiceNotes`, que não apareceu na lista visual de subcoleções consultada, sem concluir que foi apagada.
3. Remover `firebase-admin` e referências Gemini/App Engine somente após validar CI, scripts e deploys externos.
4. Registrar leituras, gravações, exclusões, tamanho de payload, conflitos e duração por sessão.

## 12. Verificações necessárias antes da aprovação final

- `npm run lint`
- `npm run build`
- testes de regras com Emulator Suite;
- teste de login e logout com os dois usuários autorizados;
- teste com UID autenticado não autorizado;
- teste offline/online e fila duplicada;
- teste de conflito entre dois dispositivos;
- teste de backup e restauração em dados descartáveis;
- conferência de contagens/checksums antes e depois da migração;
- conferência no console de regras, Hosting, backups, Auth providers, buckets, extensões e relatório por SKU.

## 13. Fontes oficiais de cobrança e quotas

- [Planos de preços do Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
- [Preços do Firebase](https://firebase.google.com/pricing)
- [Preços do Firestore](https://firebase.google.com/docs/firestore/pricing)
- [Quotas do Firestore](https://firebase.google.com/docs/firestore/quotas)
- [Cursores e paginação do Firestore](https://firebase.google.com/docs/firestore/query-data/query-cursors)
- [Uso e preços do Firebase Hosting](https://firebase.google.com/docs/hosting/usage-quotas-pricing?hl=pt-br)
- [Cloud Storage for Firebase](https://firebase.google.com/docs/storage/web/start)

## Conclusão

A redução de custo deve começar pelo Firestore, mas a correção não deve ser apenas uma troca de `getDocs()` por uma query menor. Primeiro é necessário proteger credenciais, corrigir regras, preservar exclusões com tombstones, validar conflitos e manter rollback. Depois disso, a sincronização incremental tende a reduzir substancialmente as leituras e escritas repetidas, sem remover o Firestore nem alterar a funcionalidade central.
