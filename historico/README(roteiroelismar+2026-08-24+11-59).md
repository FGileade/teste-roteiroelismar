# Continuidade do projeto Roteiro Elismar

Documento de orientação para iniciar uma nova sessão com segurança.

## Regra crítica de produção

O Roteiro Elismar está em uso por usuários finais em produção. Não alterar, implementar, remover, publicar ou fazer deploy no código ativo sem autorização explícita do proprietário.

O trabalho de novas telas e fluxos deve começar no Google Stitch. Somente depois da aprovação visual do usuário e de uma autorização explícita poderá ser avaliada uma implementação no repositório.

Nesta sessão foram criados apenas documentos de continuidade. Nenhum código de produção foi alterado.

## Referências principais

- Projeto no Stitch: https://stitch.withgoogle.com/projects/13959033504928489482
- Regras de negócio ativas: [`regrasdenegocio.md`](../regrasdenegocio.md)
- Configuração do projeto: [`package.json`](../package.json)
- Configuração Firebase: [`firebase.json`](../firebase.json)
- Regras Firestore: [`firestore.rules`](../firestore.rules)

Leia primeiro este documento e `regrasdenegocio.md`. Preserve alterações já existentes no diretório de trabalho; não faça limpeza, reset ou checkout destrutivo.

## Estado atual do projeto

O projeto é uma PWA React/Vite/TypeScript/Tailwind com Firebase, autenticação, Firestore, Hosting e servidor Express/tsx. A aplicação utiliza armazenamento local e sincronização com o Firestore para suportar operação offline e posterior sincronização.

Funcionalidades existentes no código ativo:

- login por e-mail/senha e Google, sessão, logout e recuperação de acesso;
- agenda e roteiro diário, recorrências, visitas extras, conclusão, cancelamento, reagendamento e desfazer;
- cadastro, pesquisa, filtros, endereço/CEP, frequência e contatos de clientes;
- histórico de negociações e observações de visitas;
- empréstimos com itens, pendências, devolução, reabertura e relatórios;
- eventos, lembretes, cliente vinculado e ações de edição;
- notas de voz com reconhecimento de fala em pt-BR e alternativa manual;
- backup/restauração JSON, importação/exportação Excel, localização e atualização da PWA;
- manifest, ícones, service worker, fallback de navegação offline e assinatura “Developed by Gileade HUB”.

O arquivo `regrasdenegocio.md` é a referência do comportamento atual. O `README.md` existente pode conter instruções genéricas antigas; confirme sempre o comportamento real no código e nas regras antes de propor mudanças.

## Progresso no Stitch

Projeto: **Roteiro Elismar Mobile Sales Hub**.

### Fase 1 — concluída

Fundação visual, modo claro, estados de sincronização/offline, fila pendente, conflito e recuperação, gráficos de clientes/negociações, estados de carregamento/vazio/erro, responsividade, safe areas e alvos de toque de pelo menos 44 px.

### Fase 2 — concluída

Fluxos de autenticação: login por e-mail, Google, modo local, erros, recuperação de senha, sessão expirada, seleção conceitual de unidade, perfis Representante/Gestor, acesso permitido/negado e logout seguro.

Esses fluxos são protótipos visuais no Stitch. JWT/OAuth, sessão real, autorização e criptografia ainda precisam de validação técnica no código quando houver autorização para implementar.

### Próxima etapa — Fase 3: Agenda e Roteiro de Visitas

Desenvolver no Stitch, nesta ordem:

1. agenda com hoje, dia anterior, próximo dia e seletor de data;
2. estados de visita: agendada, em andamento, concluída, cancelada, reagendada, extra e lista vazia;
3. abertura da visita com cliente, endereço, contato e ações de navegação;
4. conclusão com observação manual ou voz, confirmação, sucesso e erro;
5. modais de cancelar, reagendar e desfazer;
6. integração visual com eventos, Waze, Google Maps e WhatsApp;
7. validação mobile, desktop, acessibilidade e ausência de overflow horizontal.

## Prompt preparado para a próxima sessão no Stitch

Use o prompt abaixo somente depois de abrir o projeto correto e confirmar que o usuário deseja iniciar a Fase 3:

> Continue o projeto Roteiro Elismar Mobile Sales Hub com a Fase 3 — Agenda e Roteiro de Visitas. Crie primeiro as telas e fluxos no Stitch, sem alterar o repositório Roteiro Elismar e sem usar dados reais. Preserve o padrão visual já aprovado nas Fases 1 e 2. Inclua: agenda com navegação de datas; lista de visitas; estados agendada, em andamento, concluída, cancelada, reagendada, extra e vazia; detalhe da visita; concluir com nota manual ou voz; cancelar; reagendar; desfazer; integração visual com eventos, Waze, Google Maps e WhatsApp; estados de carregamento, erro, sucesso e offline. Garanta mobile-first de 320 px a 1440 px, safe areas, toque mínimo de 44 px, WCAG AA, foco visível, teclado virtual, modais acessíveis, drawers e nenhum overflow horizontal. Antes de qualquer alteração, informe objetivo, plano mínimo, opção gratuita, telas afetadas e etapas manuais. Não criar API key, não ativar faturamento, não usar Blaze, funções pagas, Search ou serviços pagos. Ao terminar, apresente um resumo das telas criadas e dos pontos ainda pendentes.

## Checklist gratuito e de segurança

- Manter “No API key selected” quando essa opção estiver disponível.
- Não criar API key paga, não ativar faturamento e não migrar para Blaze.
- Não aceitar modelo pago nem ferramenta externa com cobrança.
- Não inserir credenciais, dados reais de clientes ou segredos no Stitch.
- Não alterar Firebase, Firestore, Hosting, regras ou deploy sem autorização.
- Manter `unidadeId`, RBAC e regras de acesso quando forem implementados; nunca expor secrets no frontend.
- Tratar telefone, dados infantis e dados pessoais com privacidade mínima necessária.
- Manter exportações locais de PDF/XLSX quando forem necessárias.

## Checklist de aprovação visual PWA/UX

- testar 320, 360, 375, 390, 412, 768, 820, 1024, 1280 e 1440 px;
- confirmar safe area superior, inferior e laterais;
- confirmar alvos de toque de pelo menos 44 px;
- confirmar WCAG AA, contraste, foco de teclado e leitura por leitor de tela;
- confirmar que teclado virtual não cobre campos ou botões;
- validar modal, drawer, fechar, voltar e foco após o fechamento;
- validar carregamento, vazio, erro, sucesso, offline e sincronização pendente;
- confirmar ausência de overflow horizontal e de textos cortados;
- confirmar manifest, ícones 192/512, maskable, service worker e fallback offline na futura implementação;
- bloquear produção se houver falha crítica de UX, segurança, acessibilidade ou custo.

## Como continuar em uma nova sessão

1. Abrir este documento e `regrasdenegocio.md`.
2. Confirmar que o trabalho será realizado primeiro no Stitch.
3. Abrir o projeto pelo link do Stitch e revisar as Fases 1 e 2.
4. Apresentar o plano da Fase 3 antes de enviar qualquer prompt.
5. Pedir confirmação no momento da ação antes de gerar novas telas/fluxos.
6. Executar o prompt preparado e registrar o resultado no histórico.
7. Comparar telas criadas com o checklist de UX/PWA e listar pendências.
8. Encerrar sem tocar no código de produção. Implementação só começa após autorização explícita.

## Condições para parar e pedir orientação

Pare imediatamente se o Stitch solicitar API key, faturamento, modelo pago, dados reais, alteração no repositório ou publicação. Informe o aviso ao usuário e aguarde decisão.

Se a próxima sessão pedir implementação no código, confirme novamente o escopo, os arquivos afetados, o plano gratuito e a autorização explícita, pois o ambiente já possui alterações locais não relacionadas que devem ser preservadas.

