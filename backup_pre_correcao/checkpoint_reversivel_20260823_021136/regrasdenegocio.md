# Regras de negócio

> ⚠️ REGRAS DE NEGÓCIO ESTABELECIDAS — LEITURA OBRIGATÓRIA Qualquer agente ou desenvolvedor que for alterar código neste repositório deve ler este arquivo ANTES de fazer mudanças. Nenhuma regra aqui documentada pode ser removida, contornada ou alterada sem confirmação explícita do responsável pelo projeto. Se uma alteração solicitada conflitar com uma regra documentada, pare e pergunte antes de prosseguir. Ao criar ou modificar uma regra de negócio, atualize este arquivo na mesma tarefa.

## 1. Escopo, evidências e estado do levantamento

Este documento descreve somente comportamentos encontrados no código, nos comentários, nas regras do Firestore e nas configurações do repositório. Não foram inventadas regras para preencher lacunas.

Fontes ativas analisadas:

- `src/**/*.ts` e `src/**/*.tsx`;
- `firestore.rules`, `firebase.json`, `public/sw.js`, `public/manifest.json`, `index.html`, `app.yaml`, `server.ts` e configurações do projeto;
- arquivos de planejamento e PRD apenas para identificar decisões documentadas ou funcionalidades declaradas como removidas, sem tratá-los como validação executável.

Não há diretório de testes automatizados no código ativo. O diretório `backup_pre_correcao/` e os diretórios `cloud google/` contêm cópias/artefatos históricos, não fazem parte do `tsconfig.json` nem do build atual; não devem ser tratados como regras vigentes quando divergirem do código em `src/`.

Na conferência desses artefatos históricos foram encontradas divergências registradas apenas para rastreabilidade: as versões antigas em `cloud google/version 1` e `cloud google/version 2` usam uma lógica mensal baseada em `currentWeekOffset === 0`, e `backup_pre_correcao/` contém uma versão antiga com exigências de endereço diferentes. A implementação vigente é a de `src/`; se qualquer artefato histórico ainda for candidato a publicação, essas diferenças exigem confirmação antes de serem adotadas.

### Módulos identificados — confirmação pendente

1. Modelos de dados e estados.
2. Autenticação, sessão e permissões.
3. Clientes e carteira.
4. Rotas recorrentes e visitas.
5. Negociações e histórico comercial.
6. Empréstimos de ração.
7. Eventos e compromissos.
8. Notas de voz.
9. Persistência local, Firestore e sincronização offline.
10. Backup, restauração e auditoria.
11. Importação e exportação Excel.
12. Configurações de acesso, localização, orientação e atualização PWA.
13. Integrações externas e infraestrutura.
14. Conteúdos auxiliares exibidos pela aplicação.

O levantamento somente deve ser considerado completo após a confirmação do responsável sobre essa lista e sobre os pontos marcados com `⚠️ Precisa confirmação`.

### Convenções

- “Obrigatório” significa que existe validação no código ou atributo HTML `required`.
- Restrições presentes apenas em interfaces TypeScript são restrições de compilação; o Firestore não as valida em runtime.
- “Apenas na UI” significa que o fluxo visível restringe a ação, mas a função chamada não repete a validação.
- Localizações abaixo usam `arquivo:linha` e a função, classe ou bloco responsável.

## 2. Modelos de dados e estados

Implementação: `src/types.ts`.

### 2.1 Cliente (`Client`)

- `id`, `name`, `buyerName`, `phone`, `address`, `frequency`, `routeOrder` e `createdAt` são campos exigidos pelo tipo.
- `legalName`, `displayNameType`, `city`, `latitude`, `longitude`, `weekday`, `weekOffset`, `monthWeek` e `externalCode` são opcionais no tipo.
- `frequency` aceita somente `weekly`, `biweekly`, `monthly` ou `adhoc`.
- `weekday` aceita somente segunda a sábado (`monday` a `saturday`). Domingo não pertence ao tipo oficial.
- `weekOffset` aceita `0` ou `1`; `monthWeek` aceita `1` a `5`.
- `displayNameType` aceita `name` ou `legalName`.

### 2.2 Visita (`Visit`)

- `status` aceita `pending`, `completed` ou `canceled`.
- `clientName` e `address` são snapshots dos dados do cliente no momento da criação/atualização da visita.
- `date` é tratado pelo código como `YYYY-MM-DD`.
- `checkInTime`, `notes`, `saleValue`, `itemsSold` e `isExtra` são opcionais.
- Cada item vendido possui `name`, `qty` e `price`; não há validação de sinal, faixa, soma ou arredondamento no código ativo.

### 2.3 Histórico de negociação (`NegotiationHistory`)

- Possui `id`, `clientId`, `date`, `notes` e `value`; `items` é opcional.
- O tipo não impõe formato ou limites para `notes`, `date`, `value`, `qty` ou `price`.

### 2.4 Produto (`PetFoodProduct`)

- Possui `id`, `name`, `price` e `category`.
- `category` aceita `dog`, `cat`, `bird` ou `other`.
- O catálogo `INITIAL_PRODUCTS` existe em `src/data/initialData.ts:8-17`, mas não é importado pelo fluxo ativo de vendas e não é usado para validar ou calcular `itemsSold`.

| ID | Produto | Preço padrão | Categoria |
|---|---|---:|---|
| `p1` | Ração Cão Adulto Premium 15kg | R$ 145,00 | `dog` |
| `p2` | Ração Cão Filhote Premium 10kg | R$ 120,00 | `dog` |
| `p3` | Ração Cão Light Raças Pequenas 7.5kg | R$ 110,00 | `dog` |
| `p4` | Ração Gato Castrado Salmão 10kg | R$ 135,00 | `cat` |
| `p5` | Ração Gato Adulto Mix Carne 15kg | R$ 155,00 | `cat` |
| `p6` | Sachê Gourmet Gato Atum 85g (Cx c/ 24) | R$ 72,00 | `cat` |
| `p7` | Mistura de Sementes Calopsita Super 5kg | R$ 65,00 | `bird` |
| `p8` | Petiscos Bifinho Carne Cão 500g | R$ 22,00 | `dog` |

### 2.5 Nota de voz (`VoiceNote`)

- `id`, `text` e `createdAt` são obrigatórios; `clientId` e `clientName` são opcionais.

### 2.6 Evento de agenda (`AgendaEvent`)

- `id`, `userId`, `title`, `type`, `date`, `allDay` e `createdAt` são obrigatórios.
- `type` aceita `reuniao`, `campanha`, `treinamento`, `compromisso` ou `outro`.
- `startTime`, `endTime`, `location`, `notes`, `clientId`, `clientName`, `reminderMinutes` e `notificationScheduledAt` são opcionais.
- `status`, quando presente, aceita `agendado`, `concluido` ou `cancelado`.

### 2.7 Empréstimo (`ProductLoan`)

- `originClientId`, `originClientName`, `destClientId`, `destClientName`, `productName`, `quantity`, `date`, `status` e `createdAt` são obrigatórios.
- `status` aceita somente `pending` ou `resolved`.
- `quantity` é texto, não número; não há regra de quantidade positiva, unidade, limite ou conversão.
- `notes`, `returnDate` e `returnNotes` são opcionais.

## 3. Autenticação, sessão e permissões

### 3.1 Login

- A tela inicial exige autenticação quando `roteiro_pet_is_logged_in` não está armazenado como `true` (`src/App.tsx:123-125`; `src/components/Login.tsx:14-31`).
- Login por e-mail usa Firebase Authentication. E-mail e senha são removidos de espaços nas extremidades antes da chamada (`Login.tsx:21-37`).
- O formulário exige e-mail e senha não vazios; o campo de e-mail usa `type=email` e ambos usam `required` (`Login.tsx:115-152`).
- Login bem-sucedido grava `roteiro_pet_is_logged_in=true` e `roteiro_pet_user_email`; também remove `roteiro_pet_offline_mode` (`Login.tsx:35-45`).
- Login por Google usa `signInWithPopup` e grava as mesmas chaves (`Login.tsx:65-87`).
- Durante uma tentativa, os botões de login ficam desabilitados por `isLoading`.
- Mensagens explícitas: campos vazios; falha de rede no primeiro acesso; credenciais incorretas/inexistentes; janela Google fechada; e mensagens genéricas do Firebase (`Login.tsx:46-62`, `65-87`).
- A aplicação também lê `roteiro_pet_user_email` e usa `elismar.bolzani@gmail.com` como valor inicial se a chave não existir (`App.tsx:126-128`). Esse valor não autentica o usuário.
- A sessão Firebase é observada por `onAuthStateChanged`. Quando há usuário com e-mail, o UID é gravado em `roteiro_pet_user_uid` e a sincronização é iniciada após 800 ms (`App.tsx:298-321`).
- O código permite que a interface continue em modo local enquanto `currentUser` ainda é nulo; autenticação Firebase e login visual podem ficar temporariamente dessincronizados.

### 3.2 Perfis, roles e acesso ao Firestore

- Não existem perfis/roles no modelo, na interface ou na UI. A função `isAuthorized()` em `firestore.rules:12-14` existe, mas não é usada.
- O Firestore exige `request.auth != null` para qualquer leitura, gravação ou exclusão.
- Em `firestore.rules:17-25`, um usuário autenticado pode ler, gravar e excluir qualquer documento dentro de `/users/{seu-próprio-uid}/...`.
- O UID mestre `OJtAzjEd9BhU9LQN9R52hP7gjkb2` é compartilhado com o UID `KQBu6SfAcMSCKBrgp6dlxkQ2Zna2`. Os dois podem ler, gravar e excluir o caminho do UID mestre.
- Qualquer outro caminho, inclusive fora de `/users`, é negado por `match /{document=**}: allow read, write: if false`.
- As regras não validam campos, tipos, IDs, autoria do payload, status, datas, quantidade, valores ou transições.
- `resolveUserId()` em `src/lib/firebaseSync.ts:28-30` redireciona somente o UID secundário conhecido para o UID mestre; demais UIDs usam o próprio caminho.
- A função `hasCloudData()` considera que há dados na nuvem somente quando encontra pelo menos um documento em `clients`, com `limit(1)` (`firebaseSync.ts:35-43`).

### 3.3 Logout

- O logout chama `signOut(auth)` e, mesmo se essa chamada falhar, limpa estados e chaves principais de sessão/dados locais (`App.tsx:1164-1194`).
- São removidas as chaves de clientes, visitas, negociações, notas, eventos, datas inicializadas, empréstimos, flag de login, e-mail, permissão de notificação e modo offline.
- O logout não remove explicitamente `roteiro_pet_user_uid`, `roteiro_pet_sync_queue`, `roteiro_pet_user_password`, `roteiro_pet_office_location`, `roteiro_pet_allow_rotation` ou `app_just_updated`.

### 3.4 Alteração de credenciais

Implementação: `src/components/Settings.tsx:245-357`.

- Clicar em editar habilita o formulário; salvar exige senha atual não vazia.
- A senha atual é comparada localmente com `roteiro_pet_user_password`; se essa chave não existir, o valor padrão comparado é `elismar123`.
- Para alterar e-mail: o novo e-mail deve conter `@`, ser diferente do atual e coincidir com a confirmação.
- Para alterar senha: a nova senha deve ter pelo menos 6 caracteres, ser diferente da senha atual e coincidir com a confirmação.
- É obrigatório alterar e-mail ou senha; salvar sem alterar nenhum dos dois falha.
- Se houver usuário Firebase, o código chama `updateEmail` e/ou `updatePassword`. Se não houver usuário, ainda grava a alteração no `localStorage`.
- E-mail e senha novos são armazenados localmente; os campos são limpos após sucesso.
- `auth/requires-recent-login` exige sair e entrar novamente; outros erros são exibidos como erro de atualização na nuvem.

## 4. Clientes e carteira

### 4.1 Cadastro e edição

Implementação: `src/components/ClientManagement.tsx:44-56`, `447-560`; persistência em `src/App.tsx:810-892`.

- Somente o Nome Fantasia é obrigatório. Se estiver vazio após `trim()`, o cadastro é bloqueado com `Por favor, insira pelo menos o Nome Fantasia do cliente.` (`ClientManagement.tsx:499-504`).
- Razão Social, código externo, comprador, telefone, rua, número, bairro, cidade, estado e CEP não são obrigatórios.
- Valores padrão do formulário: cidade `Vitória`, estado `ES`, frequência `weekly`, dia `monday`, semana quinzenal `0` (Semana A) e semana mensal `1`.
- Comprador vazio é persistido como `Não Informado`; telefone vazio como `Não Informado`.
- Rua vazia vira `Sem Rua`; número vazio vira `S/N`; cidade vazia vira `Vitória`; estado vazio vira `ES`.
- O endereço persistido é montado como `Rua, Número - Bairro - Cidade - UF, CEP`; o trecho do bairro é omitido quando vazio e o CEP é omitido quando vazio (`ClientManagement.tsx:506-527`).
- O estado é convertido para maiúsculas e a entrada visual limita o campo a 2 caracteres (`ClientManagement.tsx:1047-1057`). Não há validação de UF válida.
- O telefone remove tudo que não for dígito e aplica máscara brasileira: até 2 dígitos; `(DD) ...`; até 10 dígitos `(DD) NNNN-NNNN`; acima disso `(DD) NNNNN-NNNN`. Não há validação de DDD ou quantidade mínima (`ClientManagement.tsx:44-56`).
- O código externo remove todos os caracteres que não sejam letras ASCII ou números ASCII (`ClientManagement.tsx:912-921`). Não há unicidade obrigatória no cadastro manual.
- Ao salvar, latitude e longitude são sempre geradas por uma simulação aleatória em torno de `-20.33` e `-40.35`; isso não é geocodificação do endereço (`ClientManagement.tsx:515-531`). Na edição, portanto, as coordenadas podem mudar mesmo sem alteração de endereço.
- Novo cliente recebe ID `c_${Date.now()}`, `createdAt` ISO atual e é colocado no final dos clientes do mesmo `weekday` (`App.tsx:810-825`).
- Se o cliente editado mudar de dia da semana, os irmãos do dia antigo são renumerados a partir de zero e o cliente vai para o fim do novo dia (`App.tsx:828-855`).
- Se o dia não mudar, o `routeOrder` recebido pela função é preservado; não há validação de sequência ou faixa.
- O alerta de clientes com a mesma combinação de frequência/dia/semana apenas informa; não bloqueia duplicidade (`ClientManagement.tsx:1138-1186`).
- `displayNameType=legalName` só é usado quando `legalName` é preenchida; caso contrário, `getClientDisplayName()` retorna `name` (`src/utils.ts:113-117`).
- Ao editar um cliente, todas as visitas que apontam para seu ID recebem o novo nome exibido e endereço, inclusive visitas concluídas ou canceladas (`App.tsx:860-869`).
- Ao excluir, a confirmação é `Tem certeza que deseja excluir este cliente?`. A exclusão remove o cliente e somente visitas pendentes ligadas a ele; visitas concluídas/canceladas e históricos de negociação não são removidos (`App.tsx:883-892`).

### 4.2 Consulta da carteira

- A busca considera Nome Fantasia, Razão Social, comprador, endereço e código externo, sem distinção de maiúsculas/minúsculas.
- O filtro visual considera todos os dias ou o `weekday` do cliente; `adhoc` é uma opção de filtro, embora clientes novos avulsos tenham `weekday` indefinido (`ClientManagement.tsx:420-432`, `1270-1286`).
- A lista é ordenada pelo nome que será exibido nos cards, usando `localeCompare('pt-BR')`.
- A última negociação é a de maior `date` lexicográfica para o cliente; o histórico completo usa a mesma ordenação decrescente (`ClientManagement.tsx:434-445`).

### 4.3 Endereço e CEP

- Ao editar, o endereço textual é interpretado por `parseAddress()` para preencher os subcampos; há dois formatos de parsing e fallback para cidade `Vitória` e UF `ES` (`ClientManagement.tsx:281-378`).
- O CEP aceita somente dígitos após limpeza, é formatado como `NNNNN-NNN` e limitado a 8 dígitos/9 caracteres (`ClientManagement.tsx:380-387`).
- Quando há exatamente 8 dígitos, é consultada a API ViaCEP `https://viacep.com.br/ws/{cep}/json/`.
- CEP inexistente exibe `CEP não encontrado.`; resposta HTTP não OK exibe `Erro ao buscar CEP.`; falha de rede exibe `Erro de conexão ao buscar CEP.` (`ClientManagement.tsx:389-415`).
- O retorno do ViaCEP preenche logradouro, bairro, cidade e UF; não há tratamento de limite, cache ou validação adicional.

### 4.4 Regras de rota recorrente

- Frequência semanal: o cliente entra toda semana no `weekday` configurado.
- Frequência quinzenal: entra no `weekday` quando `weekOffset` do cliente coincide com o cálculo da data.
- Frequência mensal: entra no `weekday` quando `ceil(diaDoMês / 7)` coincide com `monthWeek`; dias 1–7 são a primeira semana, 8–14 a segunda, 15–21 a terceira, 22–28 a quarta e 29–31 a quinta.
- Frequência avulsa (`adhoc`): não possui agenda recorrente e não gera visita automática.
- A geração ativa ordena clientes pelo `routeOrder` e cria visitas com ID `v_{data}_{clientId}`, status `pending`, snapshot de nome/endereço e `isExtra=false` (`App.tsx:739-806`).
- O cálculo quinzenal é `ceil((diasPassados + primeiroDiaDaSemana + 1) / 7)`; paridade ímpar retorna `0`/Semana A e paridade par retorna `1`/Semana B (`App.tsx:38-49`). O comentário chama o cálculo de ISO, mas a fórmula não implementa a especificação ISO completa.
- A função histórica `generateVisitsForDate()` em `src/data/initialData.ts:768-787` filtra somente por dia da semana e ignora frequência quinzenal/mensal; ela não é importada pelo fluxo ativo.

### 4.5 Sincronização de visitas com clientes

Implementação: `src/App.tsx:51-120`.

- Para cada data em `initializedDates`, são adicionadas visitas pendentes ausentes para clientes que deveriam estar agendados.
- Visitas pendentes não extras de clientes que deixaram de estar agendados são removidas.
- Visitas concluídas, canceladas e extras são preservadas durante essa sincronização.
- Se a visita pendente já existe, seu nome e endereço são atualizados.
- A sincronização só percorre datas presentes em `initializedDates`; não reprocessa automaticamente todas as datas do histórico.

## 5. Visitas e agenda diária

### 5.1 Data selecionada e geração

Implementação: `src/App.tsx:130-134`, `739-806`; apresentação e ações em `src/components/Dashboard.tsx`.

- A data inicial selecionada é a data local do dispositivo no formato `YYYY-MM-DD` (`src/utils.ts:101-110`).
- Navegar para o dia anterior ou seguinte soma/subtrai um dia e mantém o formato ISO da data (`Dashboard.tsx:91-101`).
- A data do sistema usada no contador de pendências é obtida com `new Date().toISOString().split('T')[0]`, portanto usa UTC, enquanto a data principal usa horário local (`App.tsx:1050-1053`).
- Quando a data ainda não está em `initializedDates`, o código cria as visitas recorrentes da data, adiciona a data ao controle local e tenta salvá-la no Firestore.
- Se a data já estiver inicializada, mas não houver qualquer visita para ela, o código também tenta gerar a rota.
- A geração impede duas visitas novas para o mesmo cliente na mesma data, mas não remove duplicidades já existentes.
- A agenda diária ordena visitas pelo `routeOrder` do cliente; cliente não encontrado recebe ordem `999` (`Dashboard.tsx:236-245`).
- Se não houver visitas nem eventos na data, a agenda exibe estado vazio e oferece visita extra ou evento.

### 5.2 Visita extra

Implementação: `App.tsx:1023-1043`; UI em `Dashboard.tsx:924-1013`.

- Qualquer cliente existente pode ser adicionado manualmente à data selecionada, mesmo que não pertença à rota recorrente daquela data.
- Se já existir qualquer visita do cliente na data, a operação é ignorada; a comparação não considera o status.
- A visita extra recebe ID `v_extra_{Date.now()}_{clientId}`, status `pending`, snapshot do nome/endereço e `isExtra=true`.
- A lista de seleção é ordenada pela distância até a coordenada atual/simulada; a distância é apenas auxílio de ordenação e não bloqueia clientes.
- O botão fica desabilitado para clientes já presentes na agenda diária.
- A remoção de visita extra exige confirmação e remove a visita pelo ID, independentemente do status quando a função é chamada.

### 5.3 Conclusão de visita e negociação

Implementação: `App.tsx:897-953`; formulário em `Dashboard.tsx:704-796`.

- Pela UI, somente uma visita pendente apresenta o botão `Concluir`.
- O formulário de conclusão exige observação via `required`; se a função receber texto vazio diretamente, usa `Visita concluída com sucesso.`.
- Ao concluir, o status vira `completed`, a observação é gravada, `saleValue` recebe o valor recebido e `itemsSold` recebe a lista recebida.
- `checkInTime` preserva um horário já existente; caso contrário, grava o horário local no formato `HH:mm` em português.
- A UI atual chama `onConfirmVisit(..., 0, [])`; não há campos ativos para valor, produto, quantidade ou preço na tela de conclusão. Assim, o fluxo visual registra valor zero e nenhum item.
- Para a negociação correspondente, procura o primeiro registro com mesmo `clientId` e mesma `date`:
  - se encontrar, atualiza suas notas, `value` e `items`;
  - se não encontrar, cria `n_{Date.now()}` no início do histórico;
  - notas vazias usam `Visita concluída com sucesso.`;
  - itens vazios são gravados como `undefined`.
- A função `handleConfirmVisit()` não verifica o status atual da visita. A restrição para pendentes está na UI, não na função nem nas regras Firestore.

### 5.4 Cancelamento de visita

Implementação: `App.tsx:991-1003`; UI em `Dashboard.tsx:798-858`.

- Pela UI, somente visitas pendentes exibem `Cancelar`.
- Os motivos disponíveis são `Sem Estoque/Sem Interesse`, `Loja Fechada / Feriado`, `Comprador Principal Ausente`, `Solicitou reagendamento` e `Outro`.
- Se o motivo for `Outro`, o valor persistido é `Ignorado/Não visitado`; não existe campo para texto livre.
- O status vira `canceled` e o motivo é salvo em `notes`.
- A função de negócio não verifica o status atual; a regra pendente é apenas visual.

### 5.5 Reagendamento

Implementação: `App.tsx:1005-1021`; UI em `Dashboard.tsx:860-922`.

- A UI exige uma nova data não vazia; se vazia, exibe `Por favor, selecione uma data válida.`.
- Não existe validação de data passada, formato além do controle HTML, conflito ou aderência à rota recorrente.
- A visita é movida para a nova data, volta a `pending` e perde `notes`, `saleValue`, `itemsSold` e `checkInTime`.
- A função pode ser chamada para qualquer status; a UI só a oferece para pendentes.

### 5.6 Desfazer resultado

Implementação: `App.tsx:955-979`; UI em `Dashboard.tsx:563-584`.

- A UI permite desfazer visitas concluídas ou canceladas após confirmação.
- A visita volta a `pending` e todos os campos de resultado são limpos.
- Também são excluídos todos os registros de negociação cujo `clientId` e `date` coincidam com a visita, não apenas o registro criado por aquela conclusão.
- Essa exclusão pode atingir históricos originados por evento, nota de voz ou empréstimo no mesmo cliente/data; não há identificação causal adicional.

### 5.7 Métricas da rota

Implementação: `Dashboard.tsx:236-249`, `372-397`.

- `totalScheduled` é a quantidade de visitas do dia, incluindo extras e visitas canceladas.
- `totalCompleted` conta somente status `completed`.
- `totalCanceled` conta somente status `canceled` e aparece como “ignorados”.
- A barra de progresso usa `(totalCompleted / totalScheduled) * 100`; quando não há visitas, usa `0`.
- O percentual textual é arredondado com `Math.round`; cancelamentos continuam no denominador.

## 6. Negociações e histórico comercial

Implementação principal: `src/App.tsx:600-737`, `897-989`; edição/consulta em `src/components/ClientManagement.tsx:739-833` e `Dashboard.tsx:1015-1100`.

- O histórico pode ser criado por conclusão de visita, confirmação de evento vinculado, vínculo de nota de voz, criação de empréstimo e retorno de empréstimo.
- Registros de empréstimo criam dois históricos, um para a origem e outro para o destino, com valor `0` e texto prefixado por `[Empréstimo Cedido]` ou `[Empréstimo Recebido]` (`App.tsx:596-619`).
- Ao resolver empréstimo, são criados dois históricos adicionais com prefixo `[Empréstimo Devolvido/Acertado]` e data de retorno (`App.tsx:621-650`).
- Ao concluir evento com cliente vinculado, é criado um histórico para esse cliente com prefixo `[Evento Concluído]`, data do evento e valor `0` (`App.tsx:658-678`).
- Ao vincular nota de voz, a nota recebe `clientId`/`clientName` e é copiada para um novo histórico com prefixo `[Anotação de Voz]`, data do dia local e valor `0` (`App.tsx:713-737`).
- Vincular novamente a mesma nota cria outro registro; não existe deduplicação.
- A última negociação e a linha do tempo são ordenadas por `date` decrescente, comparando strings.
- Edição de histórico exige texto não vazio após `trim()`; somente `notes` é editado pela UI.
- Exclusão de histórico exige confirmação e é permanente no estado local/Firestore; não há exclusão em cascata reversa para visita, empréstimo, evento ou nota.
- A exclusão de cliente não elimina seu histórico.
- Não há cálculo de preço, desconto, imposto, comissão, juros ou total de pedido no código ativo. `value` e `items` são apenas armazenados/exibidos.
- A função `formatCurrency()` apenas apresenta números com locale `pt-BR` e moeda `BRL`; ela não altera o valor armazenado (`src/utils.ts:6-14`).
- Não há validação de valor negativo, quantidade, preço de item, moeda ou arredondamento.

## 7. Empréstimos de ração

Implementação: `src/components/ClientManagement.tsx:105-247`, `1624-1866`; persistência e histórico em `src/App.tsx:567-656`.

### 7.1 Criação e edição

- Origem, destino, produto e quantidade são obrigatórios no formulário; a data também usa `required` (`ClientManagement.tsx:1644-1787`).
- A função também rejeita valores falsy nesses quatro campos e exibe `Por favor, preencha todos os campos obrigatórios.`.
- Origem e destino não podem ser o mesmo cliente; a mensagem é `O cliente de origem não pode ser o mesmo do de destino.`.
- A busca de clientes considera Nome Fantasia e Razão Social; quando resta exatamente um resultado, ele é selecionado automaticamente.
- Os nomes persistidos no empréstimo usam `client.name`, não necessariamente o nome escolhido para exibição nos cards.
- Produto e quantidade são texto livre. Uma sequência de espaços é truthy para a validação da função e não é normalizada com `trim()`.
- A data inicial é a data local atual; não há validação de data futura/passada.
- Novo empréstimo recebe ID `loan_${Date.now()}`, status `pending` e `createdAt` ISO atual.
- Ao editar, ID, status, `createdAt`, data de retorno e notas de retorno existentes são preservados pelo spread; os campos do formulário substituem origem, destino, produto, quantidade, data e observação.
- Não há regra para impedir edição de empréstimo resolvido; a UI permite editar ambos os estados.

### 7.2 Estados e devolução

- O fluxo visual é `pending` → `resolved` por `Marcar Devolvido`.
- A devolução exige data (`required`), usa a data local atual por padrão e aceita observação livre.
- Ao confirmar, grava `status='resolved'`, `returnDate` e `returnNotes`.
- A função de atualização não verifica se o estado anterior era `pending`; essa proteção existe apenas porque a UI mostra o botão de devolução para pendentes.
- Em estado resolvido, `Reabrir Empréstimo` exige confirmação, muda para `pending` e remove `returnDate` e `returnNotes`.
- A função de reabertura também não valida o estado anterior.
- Excluir empréstimo exige confirmação e remove somente o empréstimo. Os históricos de cessão/devolução já criados permanecem.

### 7.3 Consulta e relatório

- Os contadores exibem total, pendentes e devolvidos (`resolved`).
- A listagem filtra por produto, origem, destino e observação, sem distinção de maiúsculas/minúsculas, e pode filtrar por status.
- O relatório permite status `all`, `pending` ou `resolved`, texto por produto/cliente/observação e intervalo inclusivo por `date` (`>= início` e `<= fim`).
- O relatório ordena empréstimos por data decrescente.
- Não há cálculo financeiro, controle de estoque, validação de saldo ou limite de empréstimos.

## 8. Eventos e compromissos

Implementação: `src/components/EventModal.tsx`, `src/components/EventsManagerModal.tsx` e `src/App.tsx:576-688`.

### 8.1 Cadastro

- Título e data são obrigatórios no formulário (`EventModal.tsx:210-265`); o handler também ignora silenciosamente título vazio após `trim()` (`EventModal.tsx:159-162`).
- Tipo padrão é `reuniao`; tipos aceitos e seus rótulos são definidos em `EventModal.tsx:23-38`.
- Data é armazenada como texto do controle HTML; não há validação de data passada.
- Evento novo inicia com `allDay=false`, início `09:00`, fim `10:00`, sem cliente, sem lembrete e sem status explícito antes do salvamento.
- Ao criar, `handleSaveEvent()` completa status ausente para `agendado` (`App.tsx:576-587`).
- Ao editar, o status existente é preservado; `createdAt` também é preservado. Eventos novos recebem `ev_${Date.now()}` e `createdAt` atual (`EventModal.tsx:163-179`).
- O `userId` do evento é o UID efetivo resolvido no Firestore quando há autenticação; em modo local, o valor passado é literalmente `local` (`App.tsx:1245-1248`).
- Quando `allDay=true`, `startTime` e `endTime` são removidos; não há validação de que o fim seja posterior ao início.
- Local e notas vazios tornam-se `undefined`.
- Cliente é opcional. Quando selecionado, o evento salva `clientId` e snapshot `clientName` pelo `getClientDisplayName()`.
- Lembretes aceitos: 0, 10, 15, 30, 60, 120 ou 1440 minutos antes (`EventModal.tsx:88-96`).

### 8.2 Fluxo de status

- Pela UI do gerenciador, eventos com status `agendado` são “pendentes”.
- Confirmar evento grava `status='concluido'`; notas de conclusão preenchidas substituem as notas existentes, e notas vazias preservam as existentes (`App.tsx:658-678`).
- Cancelar evento grava `status='cancelado'` sem exigir ou registrar motivo (`App.tsx:680-688`).
- Concluir evento vinculado a cliente gera o histórico `[Evento Concluído]` com valor `0`.
- Na lista do gerenciador, somente eventos que não sejam `concluido` nem `cancelado` recebem ações de confirmar, reagendar, editar e excluir.
- No Dashboard, clicar em qualquer evento abre edição; o modal de edição permite exclusão com confirmação em duas etapas e janela de 3 segundos (`EventModal.tsx:427-448`).
- Os handlers `handleConfirmEvent()` e `handleCancelEvent()` não validam o status atual; bloqueios de fluxo são predominantemente de UI.

### 8.3 Filtros do gerenciador

Implementação: `src/components/EventsManagerModal.tsx:61-95`.

- Aba “Agendados / Pendentes” inclui somente `status === 'agendado'`.
- Aba “Concluídos / Histórico” inclui `concluido` e `cancelado`.
- O filtro de tipo aceita todos ou os cinco tipos de evento.
- Agendados podem ser filtrados nos próximos 7, 15 ou 30 dias, ou todos; os intervalos incluem o dia atual e excluem datas anteriores.
- Histórico pode ser filtrado nos últimos 7, 15 ou 30 dias, ou todos. A diferença é calculada com `Math.ceil` em dias.
- A ordenação de agendados é data/hora crescente; histórico é data/hora decrescente.

⚠️ **Precisa confirmação — status ausente:** o código trata status ausente como pendente para exibição de ações (`isPend = !isConcluido && !isCancelado` em `EventsManagerModal.tsx:253-257`), mas o filtro da aba “Agendados” exige exatamente `agendado` (`:64-66`). Portanto, um evento legado sem status pode ter ações em um contexto e desaparecer em outro. Confirmar se status ausente deve ser considerado `agendado` em todo o sistema.

### 8.4 Notificações

Implementação: `EventModal.tsx:43-74`, `App.tsx:309-313`, `418-425`.

- A permissão de notificação é solicitada 2 segundos depois do primeiro login quando `notif_permission_asked` ainda não é `true`; a flag é gravada antes da solicitação.
- Se a API não existir ou a permissão for negada, nenhum lembrete é agendado.
- Eventos do dia todo, sem lembrete ou sem `startTime` não geram notificação.
- O horário de notificação é `data + horaInicial - reminderMinutes`.
- Se o horário já passou, a notificação não é agendada.
- O lembrete usa `setTimeout`, título `🔔 {event.title}`, corpo com minutos e local, tag igual ao ID e ícone `/icons/icon-192.png`.
- Eventos carregados do `localStorage` são reagendados sem filtro de status (`App.tsx:418-425`); eventos cancelados/concluídos que ainda tenham lembrete podem ser reagendados.

⚠️ **Precisa confirmação — ícone:** o código de notificação usa `/icons/icon-192.png`, enquanto os arquivos públicos ativos listados são `/icon-192.png` e `/icon-512.png`. Confirmar o caminho oficial do ícone de notificação.

## 9. Notas de voz

Implementação: `src/components/VoiceNotesModal.tsx:22-181`; persistência e histórico em `src/App.tsx:691-737`.

- Nota nova só é salva quando o texto, após `trim()`, não está vazio.
- O ID é `vn_${Date.now()}` e `createdAt` é o instante ISO atual.
- A tela de nova nota salva sem cliente vinculado; o vínculo é uma ação posterior no histórico.
- O reconhecimento de voz usa `SpeechRecognition`/`webkitSpeechRecognition`, idioma `pt-BR`, modo contínuo e resultados intermediários.
- Se o navegador não suportar reconhecimento, é exibida a mensagem `O reconhecimento de voz não é suportado pelo seu navegador atual ou está bloqueado nas configurações de privacidade. Por favor, digite sua anotação no campo abaixo!`.
- Ao reconhecer a palavra `salvar` em qualquer ponto do texto final, a nota é salva automaticamente. A palavra de comando não é removida do texto salvo.
- Erros de reconhecimento são registrados no console; o modal informa que o microfone não pôde iniciar quando aplicável.
- Salvamento manual também exige texto não vazio e informa `Anotação salva!`.
- Editar nota exige texto não vazio após `trim()`; a nota mantém ID e data de criação.
- Busca no histórico considera texto da nota e nome do cliente, sem distinção de maiúsculas/minúsculas.
- Excluir nota exige confirmação `Tem certeza de que deseja excluir esta anotação permanente?` e é permanente.
- Vincular/revincular exige nota existente e cliente selecionado. O nome salvo no vínculo usa `getClientDisplayName()`.
- O vínculo atualiza a nota e cria um histórico `[Anotação de Voz] ...` para a data local atual, com valor `0`.
- A operação de vínculo não elimina nem atualiza históricos gerados por vínculos anteriores.

## 10. Persistência local, Firestore e sincronização offline

### 10.1 Armazenamento local

Implementação: `src/App.tsx:387-574`, `src/lib/syncQueue.ts`.

- As coleções locais são armazenadas em `localStorage` como JSON nas chaves `roteiro_pet_clients`, `roteiro_pet_visits`, `roteiro_pet_negotiations`, `roteiro_pet_voice_notes`, `roteiro_pet_events` e `roteiro_pet_loans`.
- Datas já inicializadas usam `roteiro_pet_initialized_dates`.
- Na inicialização, ausência de dados locais resulta em arrays vazios; o fluxo atual não carrega `INITIAL_CLIENTS`, `INITIAL_PRODUCTS` ou `INITIAL_NEGOTIATIONS` como seed.
- Eventos carregados localmente têm suas notificações reprogramadas.
- O app é offline-first: alterações são gravadas no navegador antes da tentativa de nuvem.
- Se o usuário ainda não estiver em `currentUser`, alterações de eventos podem entrar na fila usando o UID persistido em `roteiro_pet_user_uid`; outras coleções só entram na fila quando `currentUser` está disponível (`App.tsx:536-565`).

### 10.2 Inicialização e merge com a nuvem

Implementação: `src/App.tsx:209-296`; `src/lib/firebaseSync.ts:35-120`.

- Depois de autenticar, a fila offline é processada antes do download (`App.tsx:213-216`).
- Se `hasCloudData()` não encontrar cliente, todo o estado local é enviado como baseline para seis coleções e para `config/dates` (`App.tsx:218-255`).
- Se houver dados de clientes na nuvem, clientes, visitas, negociações, notas, empréstimos e datas vêm da nuvem.
- Eventos têm merge especial: para o mesmo ID, a versão com `createdAt` numericamente maior vence; eventos apenas locais são preservados e reenfileirados (`App.tsx:176-207`, `259-289`).
- Em empate de `createdAt`, a versão da nuvem vence porque o teste é estritamente `localDate > cloudDate`.
- O merge de eventos compara `createdAt`, não `updatedAt`; editar um evento existente preserva `createdAt`.
- O download ordena clientes por `routeOrder`; as demais coleções mantêm a ordem retornada pelo Firestore (`firebaseSync.ts:107-115`).
- Falha em `hasCloudData()` retorna `false`, fazendo o chamador tratar o estado como nuvem vazia (`firebaseSync.ts:40-43`).

### 10.3 Escrita e exclusão

- `uploadCollection()` lê IDs existentes, exclui os ausentes no novo array e grava/atualiza os itens recebidos (`firebaseSync.ts:126-177`).
- Lotes são limitados a 400 operações, embora o comentário registre o limite máximo do Firestore como 500.
- `uploadAllUserData()` usa essa substituição por coleção para clientes, visitas, negociações, notas, eventos e empréstimos e substitui o documento `config/dates` (`firebaseSync.ts:182-208`).
- A sincronização normal calcula deltas por `JSON.stringify`; itens novos/alterados viram `set` e itens ausentes viram `delete`.
- Uma única alteração usa `setDoc`/`deleteDoc`; múltiplas alterações usam batches de até 400 (`firebaseSync.ts:226-299`).
- Erros de `syncArrayToCloud()` são apenas registrados no console e não são relançados (`firebaseSync.ts:300-302`). A função não é usada pelo fluxo principal atual.

### 10.4 Fila de sincronização

Implementação: `src/lib/syncQueue.ts:8-193`.

- A fila usa a chave `roteiro_pet_sync_queue` e aceita entidades `clients`, `visits`, `negotiations`, `voiceNotes`, `events` e `loans`.
- Cada operação possui usuário, tipo de entidade, ID, `set`/`delete`, payload, timestamps, tentativas e status `pending`, `syncing`, `synced`, `failed` ou `conflict`.
- Para o mesmo usuário, entidade e ID, uma operação pendente existente é substituída pela última operação adicionada; isso reduz transações e faz prevalecer a última intenção pendente.
- Uma operação isolada é processada sem atraso; mais de uma operação pendente usa debounce de 400 ms (`syncQueue.ts:87-103`).
- O processamento usa batches de 400, incrementa `attempts`, marca `syncing`, grava no caminho `/users/{userId}/{entityType}/{entityId}` e marca sucesso como `synced`.
- Falha de commit marca as operações como `failed` e guarda a mensagem de erro; não há limite de tentativas nem descarte automático de falhas.
- Operações sincronizadas são removidas da fila; falhas permanecem para nova tentativa.
- A fila é processada ao recuperar rede e ao voltar ao foreground (`App.tsx:350-385`).
- O processamento é protegido por `isProcessing`, impedindo execuções simultâneas no mesmo runtime.

⚠️ **Comportamento a confirmar:** após um batch falhar, `remainingPending` exclui operações `failed`; por isso o callback pode receber `synced` mesmo permanecendo uma falha na fila (`syncQueue.ts:173-184`). Confirmar se o status visual esperado deve ser “falhou” enquanto houver operações com status `failed`.

### 10.5 Cache e persistência do Firebase

Implementação: `src/lib/firebase.ts:20-37`.

- O Firebase é inicializado uma vez; o Firestore usa cache persistente com suporte a múltiplas abas.
- `ignoreUndefinedProperties=true` omite campos `undefined` nas gravações.
- Se a persistência IndexedDB falhar, especialmente em Safari/iOS privado, o app usa cache em memória e permanece renderizável/online.

## 11. Backup, restauração e auditoria

Implementação: `src/lib/backupRestore.ts`; fluxo de UI em `src/components/BackupRestore.tsx`.

### 11.1 Autorização da operação

- Exportação e restauração exigem reautenticação por senha antes da operação (`BackupRestore.tsx:105-124`).
- `reauthUser()` exige usuário Firebase autenticado com e-mail; caso contrário lança `Usuário não autenticado.` (`backupRestore.ts:73-78`).
- Senha vazia exibe `Informe sua senha.`; falha de reautenticação exibe `Senha inválida. Operação cancelada.`.
- Na restauração, o seletor de arquivo só é aberto após a reautenticação.

### 11.2 Formato e exportação

- Versão do backup: `1.0.0`; versão declarada do sistema: `2.0.0`; projeto: `roteiroelismar` (`backupRestore.ts:23-24`, `120-140`).
- O arquivo contém tenant/usuário, e-mail, UID de criação, timestamp, user agent, operação e as coleções `clients`, `visits`, `negotiations`, `voiceNotes`, `events`, `loans` e `initializedDates`.
- O export percorre as seis coleções, lê `config/dates`, gera JSON formatado e baixa um arquivo `.json`.
- O nome segue `backup-roteiroelismar-YYYYMMDD-HHMMSS.json` conforme a composição de `backupRestore.ts:145-153`.
- Após a exportação, é criado log de auditoria `audit/export-{Date.now()}`. Falha no log não bloqueia a operação (`backupRestore.ts:155-156`, `258-279`).
- A coleção `audit` não faz parte das coleções exportadas/restauradas; somente o novo log da operação é acrescentado ao final.
- O relatório informa quantidade por coleção, configurações, nome do arquivo e duração `MM:SS`.

### 11.3 Validação e restauração

- `validateBackupFile()` exige apenas `backupVersion`, `tenantId`, `collections`, `collections.clients` e `collections.visits`; não exige versão específica, projeto, e-mail, todas as coleções, tipos ou correspondência do tenant atual (`backupRestore.ts:176-185`).
- O seletor aceita arquivo `.json`, lê o conteúdo integral e rejeita JSON inválido ou estrutura mínima ausente.
- A restauração resolve o UID atual pelo `resolveUserId()` e grava cada item pelo ID original, em batches de 400.
- Itens sem `id` são ignorados.
- Coleções vazias não executam deleção: `restoreCollection()` retorna imediatamente quando `items.length` é zero (`backupRestore.ts:232-254`).
- `config/dates` é substituído por `backup.collections.initializedDates || []`.
- Ao final, é criado log `audit/restore-{Date.now()}`; falha desse log não impede a restauração.

⚠️ **Precisa confirmação — “substituição integral”:** a UI informa que a restauração “substituirá os dados atuais” e que registros com o mesmo ID serão sobrescritos (`BackupRestore.tsx:319-322`). Porém, `restoreCollection()` somente faz `set` dos itens presentes no backup; não exclui documentos atuais ausentes no arquivo e nem limpa coleções vazias (`backupRestore.ts:232-254`). Confirmar se a regra correta é substituir integralmente as coleções ou apenas sobrescrever IDs coincidentes.

⚠️ **Precisa confirmação — tenant do backup:** o arquivo contém `tenantId`, mas a validação não exige que ele corresponda ao usuário autenticado antes da restauração. Confirmar se backups de outro tenant devem ser aceitos.

## 12. Importação e exportação Excel

Implementação: `src/lib/excelService.ts`; acionamento em `src/components/Settings.tsx:871-910`.

### 12.1 Importação

- O upload aceita somente `.xlsx` no controle da UI.
- O importador procura a aba `CARIACICA_VIANA` por nome normalizado; se não existir, usa a primeira aba.
- A linha de cabeçalho é a primeira que contém um valor normalizado incluindo `nome fantasia`. Se não existir, lança `Não foi encontrada a linha de cabeçalhos da aba CARIACICA_VIANA.`.
- Os cabeçalhos são reconhecidos por aliases normalizados sem acentos. Campos reconhecidos: código externo, nome fantasia, razão social, nome exibido, comprador/contato, telefone/WhatsApp, CEP, rua, número, bairro, cidade, estado/UF, frequência, dia da semana, rotação e semana do mês (`excelService.ts:25-59`).
- Linhas sem nome e sem código são ignoradas silenciosamente.
- Linhas com `Tirar da base` no nome, frequência ou dia são ignoradas.
- Linha sem Nome Fantasia gera warning `Linha N: ignorada por não possuir Nome Fantasia.` e é ignorada.
- Código externo duplicado dentro do arquivo mantém a primeira linha, ignora as seguintes e gera warning.
- Frequência aceita: Semanal, Quinzenal, Mensal, Avulso, `Avulso (sem rota recorrente)` e `adhoc`. Valor não reconhecido ou vazio vira `adhoc`.
- Dia aceita segunda a sábado por nomes normalizados; valor vazio/não reconhecido vira `undefined`.
- Rotação quinzenal que contenha a letra `b` vira `weekOffset=1`; qualquer outro valor vira `0`.
- Semana mensal que contenha “segunda”, “terceira”, “quarta” ou “quinta” vira 2, 3, 4 ou 5; qualquer outro valor, inclusive “primeira”/vazio, vira 1.
- Código externo é comparado exatamente com o existente; na ausência de correspondência, tenta encontrar cliente por nome e telefone normalizados.
- Atualização preserva o ID e `createdAt` existentes; novo cliente recebe `c_excel_{Date.now()}_{rowIndex}` e timestamp atual.
- Campos vazios usam o valor existente quando há atualização; comprador e telefone sem valor existente ficam vazios, diferentemente do cadastro manual que usa `Não Informado`.
- O endereço importado é montado de rua, número, bairro, cidade, UF e CEP com separadores; não há validação de CEP ou UF.
- Clientes existentes que não aparecem na planilha são preservados. Clientes importados substituem os de mesmo ID e novos são adicionados ao final.
- `routeOrder` existente é preservado; cliente novo recebe o índice da linha.
- O relatório informa quantidades `created`, `updated`, `ignored` e warnings. A UI exibe no máximo os três primeiros warnings.

⚠️ **Comportamento a confirmar — nome exibido no Excel:** se a coluna “Nome a ser exibido” tiver qualquer conteúdo, o importador grava `displayNameType='name'`, sem interpretar se o conteúdo indica Nome Fantasia ou Razão Social (`excelService.ts:94-96`). Confirmar se essa coluna deveria controlar `name`/`legalName`.

### 12.2 Exportação

- A exportação cria a aba `CARIACICA_VIANA` com código externo, dados cadastrais, endereço, cidade, latitude/longitude, frequência, dia, rotação, semana e ordem da rota.
- Frequências são exportadas como `Semanal`, `Quinzenal`, `Mensal` ou `Avulso (sem rota recorrente)`.
- Quinzenal exporta `Semana A`/`Semana B`; mensal exporta a semana configurada; demais frequências exportam `Não se aplica` nesses campos.
- Uma segunda aba `Configuração de Rota de Visitas` documenta frequências, Semana A/B e primeira a quinta semana mensal.
- O arquivo tem nome `clientes_roteiroelismar_YYYY-MM-DD.xlsx`.

## 13. Configurações, localização, orientação e atualização

### 13.1 Endereço principal e GPS

Implementação: `src/components/Settings.tsx:69-107`, `359-426`; consumo em `src/components/Dashboard.tsx:200-234`.

- Valores iniciais da tela de configurações: endereço `Av. Fernando Ferrari, 1105 - Jardim da Penha, Vitória - ES, 29060-300`, latitude `-20.278917` e longitude `-40.300583`.
- Salvar o endereço exige endereço não vazio, latitude numérica entre `-90` e `90` e longitude numérica entre `-180` e `180`.
- Mensagens explícitas: `Por favor, insira uma latitude válida (-90 a 90).`, `Por favor, insira uma longitude válida (-180 a 180).` e `Por favor, insira o endereço.`.
- O endereço principal é salvo somente em `roteiro_pet_office_location` no `localStorage`; não é persistido no Firestore nem associado a um usuário no registro.
- O botão GPS usa `enableHighAccuracy=true` e timeout de 5 segundos. Sucesso grava coordenadas com seis casas decimais; falha exibe mensagem de permissão/sinal fraco; ausência da API exibe que o navegador não suporta geolocalização.
- O Dashboard usa o endereço salvo se tiver `lat`/`lng` numéricos; caso contrário usa a coordenada simulada `(-20.363489, -40.405351)` (`Dashboard.tsx:202-215`).
- A distância entre coordenadas usa Haversine, raio terrestre `6371 km`, e é arredondada para uma casa decimal (`src/utils.ts:75-99`). Sem alguma coordenada, retorna `null`; clientes sem distância são ordenados depois dos demais.

### 13.2 Orientação

Implementação: `Settings.tsx:78-107`; aplicação inicial em `src/App.tsx:330-348`.

- A preferência `roteiro_pet_allow_rotation` é verdadeira por padrão; somente o valor textual `false` desabilita rotação.
- Com rotação desabilitada, o código tenta bloquear a orientação em `portrait`.
- Com rotação habilitada, tenta liberar a orientação.
- Falhas ou ausência da API de orientação são apenas avisadas no console e não bloqueiam o app.
- O manifesto continua declarando `orientation: any`; a preferência do usuário é uma tentativa via API em runtime.

### 13.3 Atualização da PWA

Implementação: `src/components/Settings.tsx:109-226`; `src/main.tsx:12-18`; `public/sw.js`.

- Se não houver Service Worker ou registro ativo, “Procurar Atualizações” informa após 1,5 s que a versão está atualizada.
- Com registro ativo, o código chama `registration.update()`, aguarda até 4 s pela descoberta e envia `SKIP_WAITING` quando há worker aguardando.
- A sequência de atualização exibe estados de encontrada, baixando, atualizando arquivos, limpando cache, aplicando e reiniciando, com 800 ms entre etapas.
- Na etapa de limpeza, todos os caches do Cache Storage são excluídos; depois `app_just_updated=true` e a página é recarregada.
- Ao detectar `app_just_updated=true`, a tela informa sucesso por 5 s e remove a flag.
- O Service Worker usa cache `roteiro-elismar-cache-v5`, instala o app shell e remove caches de nomes diferentes na ativação.
- Requisições aos domínios Firebase/Google listados em `public/sw.js:12-21` nunca são interceptadas pelo cache.
- Navegação usa network-first com fallback para `/index.html`; assets estáticos usam cache-first e depois rede.

## 14. Integrações externas e infraestrutura

### 14.1 Navegação, contato e geocodificação

Implementação: `src/utils.ts`, `src/components/ClientManagement.tsx:389-415`, `Dashboard.tsx`.

- Google Maps: se latitude e longitude forem truthy, gera `https://www.google.com/maps/search/?api=1&query=lat,lng`; caso contrário, usa endereço URL-encoded (`utils.ts:43-50`). Coordenada zero é tratada como ausência.
- Waze: com coordenadas truthy gera `https://waze.com/ul?ll=lat,lng&navigate=yes`; sem coordenadas usa `https://waze.com/ul?q=endereço&navigate=yes` (`utils.ts:52-60`).
- WhatsApp remove não dígitos. Se o resultado tiver até 11 dígitos, prefixa `55`; acima de 11 mantém o número. A mensagem padrão inclui o nome recebido e é URL-encoded (`utils.ts:62-73`).
- A API ViaCEP exige exatamente 8 dígitos para ser chamada; o retorno preenche campos cadastrais, mas não grava coordenadas.

### 14.2 Voz, microfone e notificações

- Reconhecimento de voz exige suporte do navegador e permissão de microfone; funciona em `pt-BR`.
- Geolocalização exige suporte e permissão do navegador; o app possui coordenadas simuladas de fallback.
- Push depende da API `Notification`, da permissão `granted`, de evento com horário e de lembrete futuro.
- O primeiro login dispara a solicitação de permissão uma única vez por navegador/chave local, mesmo que a solicitação seja negada.

### 14.3 Backend

Implementação: `server.ts`, `app.yaml`, `firebase.json`.

- O backend Express escuta na porta `3000` em `0.0.0.0`.
- Existe somente o endpoint `GET /api/health`, que retorna `{ status: "ok", message: "Server is healthy." }`.
- Em desenvolvimento, o backend injeta o middleware Vite; em produção, serve `dist` e redireciona qualquer rota para `index.html`.
- O comentário de `app.yaml` declara que o backend não é usado pelo frontend atual; o frontend acessa Firestore diretamente.
- Se o App Engine for reativado, `app.yaml` fixa runtime Node.js 20, classe F1, mínimo de 0 instâncias, máximo de 1, latência pendente mínima de 5 s, máximo de 1 instância ociosa e alvo de CPU `0.6` (`app.yaml:9-23`). O próprio arquivo orienta manter o App Engine parado para evitar custos.
- As variáveis `MAX_AI_CALLS_PER_USER_HOUR`, `MAX_AI_CALLS_PER_USER_DAY`, `MAX_CONCURRENT_AI_CALLS`, `MAX_AI_CALLS_PER_IP_HOUR` e `ENFORCE_APP_CHECK` aparecem no `app.yaml`, mas não são lidas por `server.ts` nem por `src`.
- Os PRDs registram que os endpoints Gemini foram removidos. Não há integração Gemini ativa no código atual, nem regra de limite de chamadas AI executável.
- `firebase.json` publica `dist` no site Firebase Hosting `roteiroelismar` e usa rewrite SPA para `/index.html`.

## 15. Conteúdos auxiliares exibidos pela aplicação

### 15.1 Versículo do dia

Implementação: `src/components/VersiculoBanner.tsx`, `src/data/versiculos.ts`.

- Há sete versículos fixos.
- O índice diário é `(ano * 1000 + mês * 100 + dia) % 7`, usando mês zero-based do JavaScript.
- O banner é exibido uma vez por dia por navegador, salvo em `versiculo-do-dia-fechado` com `Date.toDateString()`.
- Fechar manualmente ou deixar 20 segundos transcorrer grava a data e impede nova exibição no mesmo dia.

### 15.2 Dados iniciais não carregados

- `INITIAL_CLIENTS` contém uma base inicial de clientes com dados de rota e coordenadas, e `INITIAL_NEGOTIATIONS` é um array vazio (`src/data/initialData.ts:19-742`).
- O `App` ativo não importa nem carrega `INITIAL_CLIENTS`, `INITIAL_PRODUCTS` ou `INITIAL_NEGOTIATIONS`; o estado inicial efetivo é vazio quando não há dados locais/nuvem.
- O catálogo de produtos, apesar de conter preços padrão, não alimenta o formulário de venda nem o módulo de empréstimos.

## 16. Fórmulas, padrões e limites consolidados

- Distância: Haversine, raio `6371 km`, arredondamento a 1 casa.
- Rota mensal: `ceil(diaDoMês / 7)`, com semanas 1 a 5.
- Rota quinzenal: paridade do número de semana calculado pela fórmula de `getWeekOffsetForDate()`.
- Aproveitamento da rota: `round(concluídas / total * 100)`; total inclui canceladas e extras.
- WhatsApp: prefixo `55` quando o número limpo possui até 11 dígitos.
- Lotes Firestore: 400 operações por batch em todas as rotinas que processam coleções.
- Fila offline: debounce de 400 ms somente quando há mais de uma operação pendente; operação isolada sem atraso.
- Senha nova: mínimo de 6 caracteres na tela de configurações.
- Latitude/longitude do endereço principal: `[-90,90]` e `[-180,180]`.
- CEP: 8 dígitos, representação visual de 9 caracteres com hífen.
- Estado/UF: máximo visual de 2 caracteres e conversão para maiúsculas.
- Lembretes de eventos: 0, 10, 15, 30, 60, 120 ou 1440 minutos.
- Duração de mensagem de sucesso do update: 5 s; espera sem Service Worker: 1,5 s; janela de detecção de update: 4 s; intervalo entre etapas: 800 ms.

## 17. Pontos que não são regras implementadas

Os seguintes itens aparecem em PRDs/planos ou comentários, mas não possuem implementação correspondente no código ativo e, portanto, não foram tratados como regras vigentes:

- limites de chamadas Gemini/AI do `app.yaml`;
- validação de estrutura e tipos no Firestore;
- transições de status validadas no backend;
- auditoria completa de alterações de domínio;
- exclusão lógica em vez de exclusão física;
- campos `createdBy`, `updatedAt`, `updatedBy`, `revision` e `deletedAt` do plano de sincronização incremental;
- App Check efetivamente monitorado/validado;
- estoque, preços de catálogo, descontos, juros, impostos ou faturamento.

## 18. Ambiguidades e confirmações necessárias

Estas questões foram mantidas explícitas para não escolher uma regra por inferência:

1. ⚠️ **Precisa confirmação — Restauração:** deve excluir documentos ausentes no backup e limpar coleções vazias, ou somente sobrescrever IDs presentes?
2. ⚠️ **Precisa confirmação — Tenant:** um backup cujo `tenantId` não corresponda ao usuário autenticado pode ser restaurado?
3. ⚠️ **Precisa confirmação — Status de evento ausente:** status ausente deve equivaler a `agendado` em filtros e ações?
4. ⚠️ **Precisa confirmação — Ícone de notificação:** o caminho oficial é `/icons/icon-192.png` ou `/icon-192.png`?
5. ⚠️ **Precisa confirmação — Rota no domingo:** o comentário de `getDayNameFromDate()` sugere tratar domingo como sábado, mas o código retorna `sunday` e o tipo oficial não aceita domingo. Qual comportamento é desejado?
6. ⚠️ **Precisa confirmação — Geração legada:** `generateVisitsForDate()` ignora frequência, enquanto a geração ativa aplica semanal/quinzenal/mensal. A função legada deve ser removida, corrigida ou mantida como está?
7. ⚠️ **Precisa confirmação — Vendas:** a conclusão de visita deve continuar registrando sempre valor `0` e lista vazia pela UI, ou o cadastro de venda deve ser ativado para usar `saleValue`/`itemsSold`?
8. ⚠️ **Precisa confirmação — Fila:** enquanto existir uma operação `failed`, o status visual deve permanecer falho em vez de ser reportado como sincronizado?
9. ⚠️ **Precisa confirmação — Excel:** a coluna “Nome a ser exibido” deve controlar `displayNameType`, ou sua presença deve continuar forçando `name`?

Até essas confirmações, este arquivo registra o comportamento efetivamente implementado e não uma interpretação desejada.
