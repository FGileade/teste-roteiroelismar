# Plano de Desenvolvimento no Stitch

## 1. Objetivo

Concluir no Google Stitch o protótipo visual navegável do **Roteiro Elismar Mobile Sales Hub**, mantendo coerência com o aplicativo criado no AI Studio.

O trabalho no Stitch será visual e demonstrativo:

- dados fictícios;
- telas navegáveis;
- versões desktop, tablet e mobile;
- sem Firebase real, APIs, pagamentos ou publicação;
- sem alterar o repositório de produção.

## 2. Referências

- AI Studio: <https://aistudio.google.com/apps/b63b218c-05c7-4443-94c3-8a55118c37a8?showAssistant=true&showCode=true>
- Stitch: <https://stitch.withgoogle.com/projects/13959033504928489482?pli=1>
- Regras de negócio vigentes: `regrasdenegocio.md`

## 3. Estado atual

### Já criado visualmente no Stitch

- Agenda e roteiro do dia.
- Lista e detalhe de visitas.
- Conclusão, cancelamento e reagendamento de visitas.
- Clientes e relacionamento.
- Notas de voz.
- Empréstimos em visão geral.
- Pedidos, revisão e histórico de pedidos.
- Consulta e gestão de estoque.
- Login, recuperação de senha e encerramento de sessão.
- Controle de acesso.
- Configurações em modo escuro e modo claro.
- Relatórios e Analytics.
- Desempenho de vendas.
- Sincronização e estados offline.

### Pendências prioritárias identificadas

- Formulário visual de criação e edição de clientes.
- Fluxos completos de empréstimos: criar, devolver e consultar relatório.
- Fluxo visual explícito de visita extra.
- Estados de erro detalhados para pedidos.
- Fluxos de ajuda e suporte.
- Animações de transição entre telas.
- Revisão final de consistência entre 320, 390, 768 e 1440 pixels.

### Execução mais recente

- A Fase 6 — Clientes e Relacionamento foi executada no Stitch em 25/08/2026.
- Foram geradas telas de lista, detalhe, cadastro e edição em versões mobile e desktop.
- Foi realizada uma correção de escopo no Stitch, removendo CNPJ, consulta externa, condição de pagamento, limite de crédito, faturamento e documentos fiscais.
- A seção “Logística e Vendas” foi substituída por “Rota e Atendimento”, mantendo somente frequência, dia da visita e observações.
- A etapa está aprovada visualmente, pendente apenas de validação detalhada dos breakpoints.
- A Fase 7 — Configurações e Perfil do Usuário foi executada no Stitch em 25/08/2026.
- Foram geradas telas de configurações/perfil desktop, ajustes mobile e estados operacionais de configuração.
- O resultado permaneceu conceitual, sem Firebase, APIs, permissões reais, upload, download ou autenticação real.
- A Fase 8 — Guia de Ajuda e Suporte foi executada no Stitch em 25/08/2026.
- Foram geradas Central de Ajuda, Guia de Primeiros Passos, artigo de Modo Offline, Suporte e Contato e Estados de Ajuda.
- O formulário de contato foi mantido explicitamente como protótipo, sem envio real de mensagens ou abertura de chamados.
- A aplicação consolidada das skills visuais foi executada no Stitch em 25/08/2026.
- Foram aplicados: banner conceitual “Versículo do Dia”, assinatura de rodapé, ícone oficial, máscaras de telefone/CEP/data e auditoria UX/PWA.
- Foram criadas as telas “Ícone Oficial Roteiro Elismar”, “Dashboard / Agenda - Consolidação Final”, “Login (Mobile) - Consolidação Final”, “Agenda (Mobile) - Consolidação Final”, “Novo Cliente (Mobile) - Consolidação Final” e “Login (Desktop) - Consolidação Final”.
- A correção final confirmou `rel="noopener noreferrer"`, o banner em Login, Dashboard e Mobile, alvos de toque de 44px, safe areas e revisão de 320px a 1440px.
- O resultado permanece somente visual. Manifest PWA, persistência diária do versículo, ViaCEP, autenticação e sincronização real continuam pendentes de produção.
- Foi realizada a limpeza do canvas no Stitch em 25/08/2026.
- Foram removidas 12 telas obsoletas ou duplicadas: Login inicial, Login Mobile antigo, Dashboards antigos, Agendas antigas, Lista de Clientes Desktop antiga, Detalhes de Cliente antigos, Cadastro Desktop antigo e versões antigas de Novo Cliente.
- Foram preservadas todas as telas de Consolidação Final, versões “- Ajustado”, Ajuda e Suporte, fluxos operacionais, ícone oficial e padrões de UX/PWA.
- A verificação final não encontrou nenhum dos 12 itens removidos ainda visível como tela no canvas.

## 4. Critérios gerais de qualidade

- [ ] O fluxo principal Agenda → Visitas → Pedidos → Relatórios está conectado.
- [ ] Todas as telas possuem navegação clara para voltar, fechar ou cancelar.
- [ ] Nenhuma tela apresenta overflow horizontal.
- [ ] Safe areas são respeitadas nas bordas.
- [ ] Áreas de toque têm no mínimo 44 × 44 pixels.
- [ ] Textos e controles atendem contraste WCAG AA.
- [ ] Gráficos possuem legenda textual e não dependem apenas de cor.
- [ ] Foco de teclado é visível.
- [ ] Estados de carregamento, vazio, erro, offline e sincronização pendente são representados.
- [ ] Números e métricas estão identificados como demonstrativos.
- [ ] Exportar e Compartilhar aparecem como ações conceituais, sem execução real.
- [ ] A assinatura “Developed by Gileade HUB” permanece presente e consistente.

## 5. Etapas do plano de ação

### Etapa 0 — Preparação e controle do projeto

### Objetivo

Estabelecer a referência visual e evitar divergências entre as telas.

### Checklist

- [ ] Confirmar que o projeto utilizado é o Stitch correto.
- [ ] Preservar todas as telas já existentes.
- [ ] Usar português do Brasil em títulos, botões, mensagens e estados.
- [ ] Registrar cada nova tela com nome, dispositivo e finalidade.
- [ ] Usar somente dados fictícios e claramente demonstrativos.
- [ ] Não criar integrações externas, cobranças ou backend.

### Entrega da etapa

Inventário atualizado das telas e ordem de execução aprovada.

### Etapa 1 — Design System e estrutura visual

### Objetivo

Uniformizar a aparência de todas as telas.

### Checklist

- [ ] Aplicar fundo OLED escuro e modo claro.
- [ ] Preservar ciano `#03DAC6` como cor primária.
- [ ] Preservar âmbar `#F59E0B` para alertas e destaques.
- [ ] Manter tipografia Outfit para títulos.
- [ ] Manter Plus Jakarta Sans para corpo e controles.
- [ ] Padronizar botões primários, secundários, outlined e inverted.
- [ ] Padronizar cards, badges, inputs, drawers, modais e tooltips.
- [ ] Padronizar cabeçalho, barra de status e navegação.
- [ ] Revisar a assinatura “Developed by Gileade HUB”.

### Entrega da etapa

Design System visual consistente em todas as telas já criadas.

### Etapa 2 — Clientes e relacionamento

### Objetivo

Completar o fluxo visual de gestão da carteira de clientes.

### Telas e estados

- Lista de clientes.
- Busca e filtros.
- Detalhe do cliente.
- Novo cliente.
- Editar cliente.
- Cliente sem visita recente.
- Cliente com próxima visita.
- Cliente sem histórico.
- Erro de carregamento.
- Estado vazio.

### Checklist

- [ ] Criar tela ou modal “Novo cliente”.
- [ ] Criar tela ou modal “Editar cliente”.
- [ ] Incluir nome, comprador, telefone, endereço, frequência e dia da rota.
- [ ] Representar validação de campos obrigatórios.
- [ ] Representar confirmação de exclusão.
- [ ] Criar feedback visual de cliente salvo.
- [ ] Criar feedback visual de erro.
- [ ] Conectar lista → detalhe → edição.

### Entrega da etapa

Fluxo completo de consulta, criação, edição e exclusão conceitual de cliente.

### Etapa 3 — Agenda, visitas e eventos

### Objetivo

Completar a operação diária do representante.

### Checklist

- [ ] Revisar Agenda Desktop, Tablet e Mobile.
- [ ] Revisar detalhe da visita.
- [ ] Criar fluxo visual explícito de visita extra.
- [ ] Revisar concluir visita.
- [ ] Revisar reagendar visita.
- [ ] Revisar cancelar visita.
- [ ] Revisar eventos e compromissos.
- [ ] Incluir confirmação antes de ações destrutivas.
- [ ] Criar estados de visita pendente, concluída e cancelada.
- [ ] Criar estado sem visitas no dia.
- [ ] Criar estado offline e sincronização pendente.
- [ ] Refinar transições entre agenda, detalhe e conclusão.

### Entrega da etapa

Fluxo navegável Agenda → Detalhe da visita → Ação → Resultado.

### Etapa 4 — Empréstimos

### Objetivo

Transformar a tela geral de empréstimos em um fluxo visual completo.

### Checklist

- [ ] Criar lista de empréstimos pendentes.
- [ ] Criar formulário de novo empréstimo.
- [ ] Criar seleção de cliente de origem.
- [ ] Criar seleção de cliente de destino.
- [ ] Criar seleção de produto e quantidade demonstrativa.
- [ ] Criar detalhe do empréstimo.
- [ ] Criar fluxo de devolução.
- [ ] Criar formulário de observação da devolução.
- [ ] Criar relatório visual de empréstimos.
- [ ] Criar estados vazio, erro e sincronização pendente.

### Entrega da etapa

Fluxo navegável Empréstimos → Novo → Detalhe → Devolução → Relatório.

### Etapa 5 — Pedidos e estoque

### Objetivo

Consolidar a operação comercial sem criar estoque real ou faturamento.

### Checklist

- [ ] Revisar Novo Pedido Mobile e Desktop.
- [ ] Revisar Revisão do Pedido.
- [ ] Revisar Histórico de Pedidos.
- [ ] Revisar Consulta de Estoque.
- [ ] Criar estado de pedido vazio.
- [ ] Criar estado de pedido carregando.
- [ ] Criar erro de produto indisponível.
- [ ] Criar erro de validação de quantidade.
- [ ] Criar erro de falha ao salvar pedido.
- [ ] Criar estado de pedido pendente de sincronização.
- [ ] Identificar valores como demonstrativos.
- [ ] Não criar cobrança, imposto, comissão ou faturamento.

### Entrega da etapa

Fluxo navegável Visita → Novo Pedido → Revisão → Resultado → Histórico.

### Etapa 6 — Relatórios e Analytics

### Objetivo

Concluir a leitura gerencial dos dados fictícios.

### Checklist

- [ ] Revisar Dashboard de Relatórios.
- [ ] Revisar filtro de período: hoje, 7 dias, 30 dias e personalizado.
- [ ] Revisar filtro conceitual por unidade e representante.
- [ ] Revisar KPIs de visitas, clientes e negociações.
- [ ] Revisar Desempenho de Vendas.
- [ ] Revisar Desempenho da Rota.
- [ ] Revisar Clientes e Relacionamento.
- [ ] Revisar detalhe de relatório.
- [ ] Criar alternativa textual para cada gráfico.
- [ ] Marcar “Exportar relatório” como conceitual.
- [ ] Marcar “Compartilhar” como conceitual.
- [ ] Criar estados sem dados, erro, offline e sincronização pendente.

### Entrega da etapa

Fluxo navegável Pedidos → Relatórios → Detalhe do relatório.

### Etapa 7 — Login, acesso e suporte

### Objetivo

Completar os fluxos auxiliares e de segurança visual.

### Checklist

- [ ] Revisar Login Mobile e Desktop.
- [ ] Revisar recuperação de senha.
- [ ] Revisar encerramento de sessão.
- [ ] Revisar controle de acesso por unidade e perfil.
- [ ] Criar estado de credenciais inválidas.
- [ ] Criar estado de sessão expirada.
- [ ] Criar tela de ajuda e suporte.
- [ ] Criar perguntas frequentes.
- [ ] Criar contato de suporte como ação conceitual.
- [ ] Não enviar mensagens reais pelo Stitch.

### Entrega da etapa

Fluxos de entrada, saída, recuperação, acesso e suporte visualmente completos.

### Etapa 8 — Responsividade, acessibilidade e acabamento

### Objetivo

Garantir qualidade visual em todos os tamanhos solicitados.

### Checklist

- [ ] Validar largura de 320 pixels.
- [ ] Validar largura de 390 pixels.
- [ ] Validar largura de 768 pixels.
- [ ] Validar largura de 1440 pixels.
- [ ] Remover overflow horizontal.
- [ ] Revisar safe areas.
- [ ] Revisar foco e navegação por teclado.
- [ ] Revisar contraste em modo escuro.
- [ ] Revisar contraste em modo claro.
- [ ] Revisar tamanho mínimo dos alvos de toque.
- [ ] Revisar modais e drawers em telas pequenas.
- [ ] Revisar textos longos, mensagens de erro e estados vazios.
- [ ] Refinar animações de transição.
- [ ] Conferir consistência de ícones e nomenclaturas.

### Entrega da etapa

Protótipo visual aprovado nos quatro tamanhos, sem problemas críticos de UX.

### Etapa 9 — Auditoria final e handoff

### Checklist

- [ ] Conferir todas as telas do inventário.
- [ ] Conferir todos os fluxos principais.
- [ ] Conferir todos os estados de erro e vazio.
- [ ] Conferir dados fictícios e textos demonstrativos.
- [ ] Conferir assinatura do rodapé.
- [ ] Conferir ausência de integrações reais.
- [ ] Conferir ausência de cobrança e publicação.
- [ ] Registrar telas aprovadas.
- [ ] Registrar pendências exclusivamente de backend.
- [ ] Registrar itens que ainda exigem implementação no projeto real.

## 6. Ordem recomendada de execução

1. Concluir formulários de clientes e fluxos de empréstimos.
2. Completar visita extra e estados de visitas.
3. Completar os erros de pedidos e sincronização.
4. Criar ajuda e suporte.
5. Refinar transições e responsividade.
6. Executar auditoria final de acessibilidade e consistência.

## 7. Definição de pronto

O projeto será considerado concluído no Stitch quando:

- todos os fluxos principais estiverem navegáveis;
- as telas pendentes deste documento estiverem criadas;
- cada fluxo possuir estados normal, vazio, carregando, erro e offline quando aplicável;
- as versões 320, 390, 768 e 1440 pixels estiverem revisadas;
- acessibilidade visual e navegação estiverem consistentes;
- nenhuma ação do protótipo enviar dados, cobrar, publicar ou conectar serviços reais;
- as pendências restantes forem exclusivamente de implementação no sistema real.

## 8. Pendências fora do escopo do Stitch

Estas atividades deverão ser tratadas posteriormente no projeto de produção:

- autenticação real;
- regras de acesso e perfis;
- persistência no Firebase/Firestore;
- sincronização offline real;
- geração real de PDF ou Excel;
- compartilhamento real de relatórios;
- notificações reais;
- estoque e pedidos reais;
- auditoria, segurança e publicação.

## 9. Registro de progresso

| Etapa | Status | Observação |
|---|---|---|
| 0. Preparação | Em andamento | Inventário inicial realizado |
| 1. Design System | Parcialmente concluída | Modos escuro e claro existentes |
| 2. Clientes | Concluída visualmente | Escopo corrigido; validar breakpoints e acessibilidade |
| 3. Agenda e visitas | Parcialmente concluída | Falta visita extra e refinamento de estados |
| 4. Empréstimos | Parcialmente concluída | Falta detalhar subfluxos |
| 5. Pedidos e estoque | Parcialmente concluída | Faltam estados de erro detalhados |
| 6. Relatórios | Criada visualmente | Necessita auditoria final |
| 7. Login e suporte | Concluída visualmente | Ajuda e suporte criados; validar breakpoints e acessibilidade |
| 7A. Configurações e Perfil | Concluída visualmente | Validar breakpoints, acessibilidade e consistência final |
| 7B. Skills de identidade, formulários e UX/PWA | Concluída visualmente | Aplicadas no Stitch; certificações reais ainda pendentes |
| 8. Qualidade visual | Parcialmente concluída | Stitch revisou 320px a 1440px; falta validação técnica no produto real |
| 8A. Limpeza de telas obsoletas | Concluída | 12 telas removidas; telas finais e ajustadas preservadas |
| 9. Handoff | Pendente | Executar após a auditoria |
