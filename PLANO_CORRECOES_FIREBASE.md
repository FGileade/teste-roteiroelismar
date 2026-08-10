# Plano de Correções — Firebase e Proteção de Dados

**Projeto:** roteiroelismar  
**Status:** Planejado — nenhuma correção foi executada  
**Escopo:** Firestore, autenticação, sincronização e proteção dos dados da aplicação  
**Fora do escopo:** Firebase Storage e bucket do Google Cloud

## Premissas

- Os dois usuários existentes devem compartilhar os mesmos dados.
- A permissão ampla é intencional para esses dois usuários.
- Clientes, visitas, negociações, históricos, agenda, notas e empréstimos devem ser preservados.
- O bucket não será utilizado nem considerado nas correções.
- Nenhuma alteração deve ser publicada sem testes locais e validação das regras.

## Módulo 1 — Acesso compartilhado

### Objetivo

Permitir acesso somente aos dois usuários autorizados, mantendo o banco compartilhado.

### Ações

- Restringir o Firestore aos dois UIDs autorizados.
- Usar somente o caminho compartilhado do usuário principal.
- Bloquear a criação de dados por qualquer outro usuário autenticado.
- Manter leitura, gravação e atualização amplas somente dentro do caminho compartilhado.
- Validar o login, logout e redirecionamento dos dois usuários.

### Critério de aceite

- Os dois usuários acessam os mesmos dados.
- Um terceiro usuário autenticado não consegue ler nem gravar dados.
- Nenhum dado é criado em caminhos individuais não utilizados.

## Módulo 2 — Validação dos dados

### Objetivo

Impedir gravações inválidas, incompletas ou malformadas.

### Ações

- Validar campos obrigatórios e tipos de dados.
- Validar datas, status e identificadores relacionados.
- Impedir quantidades e valores negativos quando não forem permitidos.
- Definir limites para textos, observações e listas.
- Impedir alteração de campos de autoria e criação.
- Validar transições permitidas de status.

### Critério de aceite

- Dados inválidos são rejeitados pelas regras Firestore.
- O aplicativo exibe mensagem clara quando uma gravação é recusada.
- Os documentos existentes continuam compatíveis com o novo esquema.

## Módulo 3 — Histórico e negociações

### Objetivo

Evitar a perda definitiva de negociações e registros históricos.

### Ações

- Remover a exclusão física de negociações.
- Substituir exclusão por `cancelado`, `arquivado` ou `invalidado`.
- Adicionar `createdAt`, `createdBy`, `updatedAt` e `updatedBy`.
- Exigir justificativa ao cancelar ou invalidar um registro.
- Impedir alteração do autor, da data original e do cliente relacionado.
- Tornar negociações concluídas somente leitura, salvo campos administrativos.

### Critério de aceite

- Uma negociação nunca desaparece por exclusão comum.
- Cancelamentos ficam registrados com data, usuário e motivo.
- O histórico permanece disponível nos relatórios.

## Módulo 4 — Clientes, visitas, agenda e empréstimos

### Objetivo

Separar registros operacionais de registros históricos definitivos.

### Ações

- Clientes: permitir edição controlada e arquivamento.
- Visitas pendentes: permitir edição e reagendamento.
- Visitas concluídas ou canceladas: preservar o registro histórico.
- Empréstimos pendentes: permitir atualização operacional.
- Empréstimos resolvidos: impedir exclusão e alteração dos dados essenciais.
- Agenda: permitir cancelamento sem apagar o evento.
- Notas vinculadas a histórico: impedir exclusão acidental.

### Critério de aceite

- Registros concluídos continuam disponíveis para consulta e impressão.
- Cancelamento não equivale a apagar o registro.
- Relatórios históricos permanecem consistentes após alterações operacionais.

## Módulo 5 — Sincronização, conflitos e recuperação

### Objetivo

Proteger os dados durante sincronização, perda de conexão e restauração.

### Ações

- Substituir leituras completas por sincronização incremental.
- Adicionar `updatedAt`, `revision` e `deletedAt` aos documentos.
- Utilizar exclusão lógica para registros que não devem desaparecer.
- Detectar conflitos entre alterações feitas pelos dois usuários.
- Definir política de resolução de conflitos antes da gravação.
- Melhorar a fila de sincronização offline.
- Exigir confirmação antes de restaurar um backup.
- Impedir restauração acidental sobre dados atuais.
- Testar sincronização duplicada, perda de conexão e restauração.

### Observação técnica

Atualmente, `downloadUserData` realiza leituras completas das coleções em `src/lib/firebaseSync.ts`. Essa estratégia deve ser substituída gradualmente para reduzir custo e melhorar o desempenho conforme o volume de dados crescer.

### Critério de aceite

- A abertura do sistema não baixa novamente todos os documentos sem necessidade.
- Alterações offline são sincronizadas sem duplicação.
- Conflitos são identificados e não sobrescrevem silenciosamente o histórico.
- Um backup pode ser restaurado com segurança e validação.

## Módulo 6 — Proteções adicionais e produção

### Objetivo

Adicionar camadas de proteção para o ambiente de produção.

### Ações

- Ativar MFA para os dois usuários, especialmente a conta principal.
- Configurar IAM com o menor privilégio necessário para administradores.
- Restringir a chave da API por domínio e por APIs utilizadas.
- Ativar App Check inicialmente em modo de monitoramento.
- Verificar métricas do App Check antes de aplicar bloqueio.
- Executar testes das regras no Firebase Emulator.
- Executar `npm run lint` e `npm run build`.
- Validar o fluxo final de login, sincronização, impressão e restauração.

### Critério de aceite

- O build de produção conclui sem erro.
- As regras bloqueiam acessos não autorizados.
- Os dois usuários continuam operando normalmente.
- Não há perda de dados durante testes de sincronização e restauração.

## Ordem de execução

1. Acesso compartilhado.
2. Proteção de históricos e negociações.
3. Validação dos dados.
4. Clientes, visitas, agenda e empréstimos.
5. Sincronização incremental e recuperação.
6. MFA, IAM, restrições da API e App Check.
7. Testes finais e build de produção.

## Checklist final

- [ ] Somente os dois usuários autorizados acessam os dados.
- [ ] Regras Firestore validam estrutura e tipos.
- [ ] Negociações e históricos não são apagados fisicamente.
- [ ] Visitas concluídas permanecem disponíveis.
- [ ] Empréstimos resolvidos permanecem disponíveis.
- [ ] Cancelamentos registram motivo e usuário.
- [ ] Sincronização incremental implementada.
- [ ] Conflitos de sincronização tratados.
- [ ] Backup e restauração testados.
- [ ] MFA configurado.
- [ ] IAM revisado.
- [ ] Chave da API restringida.
- [ ] App Check monitorado e validado.
- [ ] Testes do Emulator aprovados.
- [ ] Lint e build aprovados.
