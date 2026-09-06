---

name: smart-form-masks
description: >
Use esta Skill sempre que houver formulários, cadastros, tabelas, listas,
campos de pesquisa ou campos de data em aplicações HTML, React, Vue,
Angular, Next.js, Vite, PWA, Firebase ou Vercel. Procure automaticamente
campos de entrada e aplique máscaras, validações, autocomplete, filtros,
pesquisa, ordenação alfabética, teclado adequado, UX e acessibilidade sem
quebrar funcionalidades existentes.
-----------------------------------

# Smart Form Masks

## Objetivo

Melhorar automaticamente formulários, cadastros, listas e telas de consulta da aplicação, aplicando:

* Máscaras inteligentes
* Validações
* Autocomplete
* Busca automática de endereço pelo CEP
* Botão para visualizar senha
* Teclado mobile adequado
* Padronização de campos de data
* Filtros de pesquisa
* Ordenação alfabética
* Acessibilidade
* Melhor experiência do usuário

---

# Instruções gerais

Sempre que localizar formulários, cadastros, tabelas, listas ou filtros:

1. Analisar primeiro a estrutura existente.
2. Identificar componentes, funções e serviços reutilizáveis.
3. Preservar regras de negócio.
4. Não alterar nomes de campos.
5. Não remover validações existentes.
6. Não substituir APIs já utilizadas.
7. Aplicar somente as alterações necessárias.
8. Testar o comportamento em desktop e mobile.
9. Priorizar código simples, reutilizável e de baixo impacto.
10. Não modificar componentes fora do escopo.

---

# Formulários e máscaras

## 1. Telefone

Detectar automaticamente campos como:

* telefone
* celular
* phone
* whatsapp
* contato
* tel
* mobile
* phoneNumber

Aplicar máscara dinâmica.

### Celular

```text
(99) 99999-9999
```

### Telefone fixo

```text
(99) 9999-9999
```

Adicionar, quando aplicável:

```html
inputmode="tel"
autocomplete="tel"
```

Regras:

* Bloquear caracteres inválidos.
* Preservar o valor digitado.
* Não limitar telefones internacionais quando a aplicação já possuir suporte a código de país.
* Não alterar integrações existentes com WhatsApp ou telefonia.
* Manter o valor compatível com o formato esperado pelo backend.

---

## 2. CPF

Detectar campos como:

* cpf
* documento
* taxpayer
* document
* personalDocument

Aplicar máscara:

```text
999.999.999-99
```

Adicionar:

* Validação dos dígitos verificadores
* Bloqueio de letras
* Remoção de caracteres inválidos
* Feedback de CPF inválido
* `inputmode="numeric"`
* `autocomplete="off"`

Regras:

* Não considerar válido CPF formado por números repetidos.
* Não alterar a regra de armazenamento já utilizada.
* Permitir envio do valor sem máscara quando o backend exigir somente números.
* Exibir mensagens de erro claras e próximas ao campo.

---

## 3. CEP

Detectar campos como:

* cep
* zip
* zipcode
* postal
* postalCode
* addressZipCode

Aplicar máscara:

```text
99999-999
```

Adicionar:

```html
inputmode="numeric"
autocomplete="postal-code"
```

Após completar os oito números, consultar automaticamente:

```text
https://viacep.com.br/ws/{CEP}/json/
```

Preencher automaticamente, quando os campos existirem:

* Rua
* Bairro
* Cidade
* Estado

Quando existirem número e complemento:

* Manter preenchimento manual.
* Não apagar valores já digitados.
* Direcionar o foco para o campo número após preencher o endereço.
* Preservar complemento já informado.

Em caso de CEP inválido:

* Exibir mensagem amigável.
* Permitir correção imediata.
* Não interromper o usuário.
* Não bloquear completamente o formulário.
* Não apagar os dados já preenchidos manualmente.

Nunca substituir uma API de CEP já existente na aplicação.

---

## 4. Campo de senha

Detectar campos como:

* password
* senha
* confirmPassword
* confirmarSenha
* currentPassword
* newPassword

Adicionar botão ou ícone acessível para mostrar e ocultar a senha.

Comportamento:

```text
password → text
text → password
```

Regras:

* Não alterar o valor digitado.
* Não remover o foco do campo.
* Não enviar o formulário ao clicar no botão.
* Utilizar `type="button"`.
* Adicionar `aria-label`.
* Informar corretamente o estado visível ou oculto.
* Preservar regras de força de senha existentes.
* Não registrar senhas em logs.
* Não armazenar senhas em texto simples.
* Não exibir senha automaticamente.

---

## 5. E-mail

Detectar campos como:

* email
* e-mail
* userEmail
* contactEmail

Aplicar:

```html
type="email"
autocomplete="email"
inputmode="email"
```

Adicionar:

* Validação de formato
* Remoção de espaços antes e depois
* Teclado mobile adequado
* Mensagem amigável de erro
* Normalização de letras maiúsculas e minúsculas quando apropriado

Regras:

* Não inserir espaços.
* Não transformar o conteúdo em letras maiúsculas.
* Não rejeitar endereços válidos por validação excessivamente restritiva.
* Preservar regras existentes de autenticação.

---

## 6. Nome

Detectar campos como:

* nome
* name
* fullName
* nomeCompleto
* responsável
* contato
* customerName
* userName

Aplicar:

```html
autocomplete="name"
autocapitalize="words"
```

Adicionar:

* Remoção de espaços duplicados
* Remoção de espaços no início e no final
* Preservação de acentos
* Preservação de nomes compostos
* Bloqueio de caracteres evidentemente inválidos, quando apropriado

Regras:

* Não modificar automaticamente o nome enquanto o usuário estiver digitando quando isso puder mover o cursor.
* Não forçar capitalização que prejudique nomes específicos.
* Não remover hífens, apóstrofos ou caracteres válidos em nomes.

---

## 7. Data

Detectar automaticamente qualquer campo relacionado a data, como:

* data
* date
* birthDate
* dataNascimento
* nascimento
* vencimento
* validade
* admissão
* admissao
* início
* inicio
* término
* termino
* startDate
* endDate
* dueDate
* createdAt
* updatedAt

Sempre exibir ao usuário o formato:

```text
DD/MM/AAAA
```

Aplicar máscara:

```text
99/99/9999
```

Configurar o campo para abrir o teclado numérico em dispositivos móveis:

```html
type="text"
inputmode="numeric"
placeholder="DD/MM/AAAA"
autocomplete="off"
maxlength="10"
```

Regras obrigatórias:

* Sempre verificar a existência de campos de data.
* Sempre exibir `DD/MM/AAAA` como placeholder ou indicação visual.
* Sempre abrir teclado numérico em dispositivos móveis.
* Permitir somente números e barras.
* Inserir as barras automaticamente.
* Limitar o valor visível a 10 caracteres.
* Validar dia, mês e ano.
* Validar anos bissextos.
* Rejeitar datas impossíveis.
* Não permitir mês superior a 12.
* Não permitir dia incompatível com o mês.
* Não substituir silenciosamente a data digitada.
* Não alterar o valor por diferença de fuso horário.
* Manter a data apresentada no padrão brasileiro.
* Exibir mensagem amigável quando a data for inválida.
* Não bloquear a correção do campo.

Exemplos de datas inválidas:

```text
31/02/2026
00/12/2026
10/13/2026
29/02/2025
```

Exemplo de data válida em ano bissexto:

```text
29/02/2024
```

Quando a aplicação já utilizar um seletor de calendário:

* Preservar sua funcionalidade.
* Manter o calendário acessível.
* Garantir que o valor visível seja apresentado como `DD/MM/AAAA`.
* Garantir que o teclado numérico seja chamado quando houver digitação manual.
* Não remover bibliotecas de calendário existentes.

Não utilizar como formato principal visível:

```text
AAAA-MM-DD
```

O formato ISO poderá ser utilizado apenas internamente para:

* APIs
* Banco de dados
* Firestore
* Ordenação
* Filtros
* Componentes internos
* Integrações externas

Ao converter datas:

* Evitar `new Date("AAAA-MM-DD")` quando isso puder provocar alteração de dia por fuso horário.
* Preferir tratamento explícito de dia, mês e ano.
* Preservar o valor real informado pelo usuário.

---

## 8. CNPJ

Detectar campos como:

* cnpj
* companyDocument
* documentoEmpresa
* inscrição
* inscricao
* businessDocument

Aplicar máscara:

```text
99.999.999/9999-99
```

Adicionar:

* Validação dos dígitos verificadores
* Bloqueio de letras
* Feedback de erro
* Rejeição de números repetidos
* `inputmode="numeric"`

Regras:

* Não modificar o formato exigido pelo backend.
* Permitir envio sem máscara quando necessário.
* Não substituir validações existentes.

---

## 9. Número de endereço

Detectar campos como:

* número
* numero
* addressNumber
* houseNumber
* streetNumber

Adicionar:

```html
inputmode="numeric"
autocomplete="address-line2"
```

Permitir:

* Números
* Valores como `S/N`, quando a regra da aplicação permitir
* Letras complementares quando utilizadas em endereços, como `12A`

Regras:

* Não bloquear complementos alfanuméricos em campos separados.
* Não aplicar máscara rígida quando a regra permitir valores especiais.
* Preservar o valor já digitado.

---

## 10. Cartão

Quando existirem campos de cartão, detectar:

* cardNumber
* numeroCartao
* cartão
* cartao
* creditCard

Aplicar agrupamento visual:

```text
9999 9999 9999 9999
```

Considerar que determinadas bandeiras podem utilizar quantidade diferente de dígitos.

Regras obrigatórias:

* Nunca registrar CVV em logs.
* Nunca salvar CVV no banco de dados.
* Nunca inserir dados completos de cartão em mensagens de erro.
* Não criar armazenamento próprio de dados sensíveis.
* Preservar integrações de pagamento existentes.
* Não substituir SDKs de pagamento.
* Não armazenar número completo do cartão.
* Não manipular dados de pagamento além do necessário.

---

# Listas, tabelas e consultas

## 11. Verificação da existência de listas

Sempre verificar se a aplicação possui:

* Listas de usuários
* Listas de clientes
* Listas de funcionários
* Listas de produtos
* Listas de documentos
* Listas de unidades
* Listas de cargos
* Listas de categorias
* Listas de empresas
* Listas de alunos
* Listas de turmas
* Listas de fornecedores
* Tabelas de registros
* Seletores com muitas opções
* Resultados de consultas
* Dados apresentados em cards repetidos

Considerar como lista qualquer coleção exibida por meio de:

* `<ul>`
* `<ol>`
* `<table>`
* Componentes de tabela
* Data grids
* Cards repetidos
* Combobox
* Select
* Dropdown
* Autocomplete
* Resultados de busca
* Arrays renderizados com `map`
* Diretivas equivalentes no Vue
* Diretivas equivalentes no Angular
* Consultas do Firestore
* Dados retornados por APIs

Antes de modificar:

1. Identificar a fonte dos dados.
2. Verificar se os dados vêm do estado local, API, Firestore ou backend.
3. Identificar paginação.
4. Identificar carregamento incremental.
5. Identificar consulta remota.
6. Verificar se já existe pesquisa.
7. Verificar se já existem filtros.
8. Verificar se já existe ordenação.
9. Reutilizar a implementação existente sempre que possível.
10. Não duplicar funcionalidades.

---

## 12. Filtro de pesquisa

Quando existir uma lista com quantidade relevante de registros, verificar se já existe campo de pesquisa.

Caso não exista e sua inclusão não altere a regra de negócio, adicionar pesquisa por texto.

A pesquisa deve considerar, conforme os campos disponíveis:

* Nome
* Nome completo
* E-mail
* Telefone
* CPF
* CNPJ
* Código
* Matrícula
* Cargo
* Unidade
* Categoria
* Cidade
* Estado
* Status
* Título
* Descrição
* Responsável
* Número do documento

A pesquisa deve:

* Ignorar diferenças entre letras maiúsculas e minúsculas.
* Ignorar espaços excedentes.
* Aceitar texto parcial.
* Preservar acentos na apresentação dos dados.
* Preferencialmente ignorar acentos durante a comparação.
* Atualizar os resultados sem recarregar a página.
* Exibir estado vazio quando nenhum resultado for encontrado.
* Possuir botão para limpar a pesquisa.
* Ser acessível por teclado.
* Ser acessível por leitores de tela.
* Preservar os filtros ativos.
* Não alterar os dados originais.

Placeholder genérico:

```text
Pesquisar...
```

Placeholder específico, quando possível:

```text
Pesquisar por nome, CPF ou e-mail...
```

Para normalizar pesquisas:

```javascript
const normalizarTexto = (valor = "") =>
  String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
```

---

## 13. Filtros adicionais

Quando os dados possuírem campos apropriados, verificar a necessidade de filtros por:

* Status
* Situação
* Unidade
* Empresa
* Cargo
* Categoria
* Cidade
* Estado
* Data
* Período
* Tipo
* Responsável
* Ativo ou inativo
* Perfil
* Permissão
* Departamento

Regras:

* Não criar filtros sem relação com os dados existentes.
* Não alterar regras de permissão.
* Não mostrar opções que o usuário não possa consultar.
* Permitir limpar todos os filtros.
* Exibir claramente os filtros ativos.
* Preservar a combinação entre pesquisa textual e filtros.
* Manter filtros durante paginação.
* Não executar novas consultas desnecessárias.
* Preservar o comportamento existente da tela.

---

## 14. Ordenação alfabética obrigatória

Sempre organizar alfabeticamente listas textuais quando isso não contrariar uma ordem funcional ou regra de negócio.

Aplicar ordenação alfabética em:

* Nomes de usuários
* Nomes de clientes
* Funcionários
* Empresas
* Unidades
* Cargos
* Categorias
* Produtos
* Cidades
* Estados
* Opções de seleção
* Resultados de pesquisa
* Listas administrativas
* Fornecedores
* Alunos
* Turmas
* Responsáveis

Ordenação padrão:

```text
A → Z
```

Utilizar comparação compatível com português do Brasil:

```javascript
String(valorA ?? "").localeCompare(String(valorB ?? ""), "pt-BR", {
  sensitivity: "base",
  numeric: true
});
```

A ordenação deve:

* Ignorar diferenças entre maiúsculas e minúsculas.
* Tratar corretamente caracteres acentuados.
* Ordenar números de maneira natural.
* Não alterar os dados originais.
* Criar uma cópia do array antes de ordenar.
* Ser aplicada após os filtros.
* Ser aplicada antes da paginação visual.
* Preservar registros sem valor no final da lista.
* Utilizar o campo principal mais adequado, geralmente `nome`.

Exemplo seguro:

```javascript
const resultadosOrdenados = [...resultadosFiltrados].sort((a, b) =>
  String(a.nome ?? "").localeCompare(String(b.nome ?? ""), "pt-BR", {
    sensitivity: "base",
    numeric: true
  })
);
```

---

## 15. Exceções de ordenação

Não aplicar ordem alfabética quando a lista possuir ordem funcional necessária, como:

* Linha do tempo
* Feed social
* Histórico de movimentações
* Logs
* Mensagens
* Notificações
* Agenda
* Ranking
* Prioridades
* Etapas de processo
* Kanban
* Ordem manual definida pelo administrador
* Registros recentes
* Movimentações financeiras
* Histórico de atendimento

Nesses casos:

* Preservar a ordem funcional existente.
* Não substituir ordenação por data, prioridade ou posição.
* Aplicar ordem alfabética apenas em filtros e seletores auxiliares.
* Não alterar feeds do mais recente para o mais antigo.
* Não modificar rankings.
* Não modificar ordem manual persistida no banco.

---

## 16. Campos de seleção

Em campos como:

* `<select>`
* Combobox
* Autocomplete
* Dropdown
* Lista de opções
* Seletor de unidade
* Seletor de cargo
* Seletor de categoria

Aplicar:

* Ordenação alfabética
* Pesquisa interna quando houver muitas opções
* Estado de carregamento
* Mensagem quando não houver opções
* Navegação por teclado
* Identificação acessível
* Feedback de erro
* Preservação do valor selecionado

Manter opções especiais no início:

```text
Selecione...
Todos
Nenhum
Não informado
Outros
```

Ordenar alfabeticamente somente as opções reais depois das opções especiais.

Nunca alterar o valor interno das opções durante a ordenação.

---

## 17. Firestore e consultas remotas

Quando os dados vierem do Firestore:

* Verificar se a ordenação pode ser feita com `orderBy`.
* Verificar a necessidade de índice composto.
* Evitar carregar coleções inteiras apenas para pesquisar no navegador.
* Preservar paginação existente.
* Não criar leituras repetitivas desnecessárias.
* Não executar uma consulta a cada tecla sem controle.
* Respeitar isolamento multiempresa e multi-tenant.
* Manter filtros de tenant, unidade e permissões.
* Nunca remover filtros obrigatórios de segurança.
* Não depender apenas de filtros no frontend para proteger dados.

Para pesquisas remotas:

* Aplicar debounce.
* Cancelar ou ignorar respostas obsoletas.
* Evitar consultas duplicadas.
* Preservar limites de leitura.
* Informar estado de carregamento.
* Tratar falhas sem apagar resultados existentes.
* Não buscar novamente quando o termo não tiver sido alterado.

Exemplo de debounce recomendado:

```text
300 a 500 milissegundos
```

Não implementar busca textual completa no Firestore como se fosse uma função nativa quando ela não existir.

Quando necessário, utilizar a arquitetura já adotada pelo projeto, como:

* Campos normalizados
* Prefixos de pesquisa
* Algolia
* Typesense
* Meilisearch
* Serviço próprio de busca
* API existente

Não adicionar novos serviços sem autorização.

---

# UX obrigatória

Todos os campos devem possuir, quando aplicável:

* `placeholder`
* `label`
* `aria-label`
* `autocomplete`
* `required`
* Feedback visual de erro
* Feedback visual de sucesso
* Mensagens objetivas
* Estado desabilitado
* Estado de carregamento
* Identificação de campo obrigatório

Regras:

* Exibir erros próximos ao campo correspondente.
* Não utilizar somente cor para indicar erro ou sucesso.
* Não apagar valores após erro de validação.
* Não bloquear digitação sem explicar o motivo.
* Manter foco visível.
* Não movimentar o layout excessivamente ao exibir mensagens.
* Preservar botões principais visíveis em telas pequenas.

---

# Mobile

Utilizar corretamente:

* `inputmode`
* Teclado numérico
* Teclado telefônico
* Teclado de e-mail
* `autocomplete`
* `autocapitalize`
* Área de toque adequada
* Campos responsivos
* Pesquisa utilizável em telas pequenas

Regras:

* Campos de data devem chamar teclado numérico.
* Campos de CPF, CNPJ e CEP devem chamar teclado numérico.
* Campos de telefone devem chamar teclado telefônico.
* Campos de e-mail devem chamar teclado de e-mail.
* Evitar que o teclado virtual esconda o campo ativo.
* Evitar que o teclado virtual esconda botões principais.
* Não criar rolagem horizontal.
* Manter filtros acessíveis em telas pequenas.

---

# Acessibilidade

Garantir:

* Uso adequado de ARIA
* Leitura por leitores de tela
* Navegação por teclado
* Ordem de foco lógica
* Mensagens de erro acessíveis
* Identificação de campos obrigatórios
* Associação correta entre `label` e `input`
* Tabelas com cabeçalhos identificados
* Botões com nome acessível
* Campo de pesquisa com descrição clara
* Ícone de senha com texto acessível
* Estados de carregamento anunciados
* Estados vazios compreensíveis
* Contraste adequado

Não utilizar apenas ícones sem descrição acessível.

---

# Performance

* Não adicionar bibliotecas desnecessárias.
* Preferir JavaScript ou TypeScript nativo.
* Reutilizar bibliotecas já instaladas.
* Evitar renderizações desnecessárias.
* Utilizar debounce em pesquisas custosas.
* Evitar ordenar os mesmos dados repetidamente.
* Utilizar memoização quando apropriado.
* Não buscar novamente dados disponíveis no estado.
* Não carregar coleções completas sem necessidade.
* Não executar validações pesadas a cada tecla.
* Não duplicar consultas.
* Não criar listeners desnecessários.
* Remover listeners quando o componente for desmontado.

Se existir biblioteca de máscara, tabela, calendário ou formulário instalada, utilizá-la antes de criar uma nova solução.

---

# Compatibilidade

Aplicar em:

* HTML
* React
* Next.js
* Vue
* Angular
* Vite
* Firebase Hosting
* Vercel
* PWAs

Respeitar:

* Arquitetura atual
* Componentes existentes
* Padrões de estado
* Tipagem TypeScript
* Serviços de dados
* Regras de segurança
* Sistema de estilos
* Design system
* Bibliotecas instaladas
* Convenções do projeto

---

# Nunca

* Não quebrar componentes existentes.
* Não alterar nomes de campos.
* Não remover validações existentes.
* Não modificar regras de negócio.
* Não substituir APIs existentes.
* Não alterar permissões.
* Não ampliar acesso aos dados.
* Não remover paginação.
* Não carregar todos os registros sem necessidade.
* Não ordenar diretamente o array original.
* Não aplicar ordem alfabética sobre histórico ou linha do tempo.
* Não adicionar bibliotecas sem necessidade.
* Não refatorar arquivos fora do escopo.
* Não modificar layout sem necessidade.
* Não duplicar componentes existentes.
* Não alterar consultas críticas silenciosamente.
* Não alterar filtros de tenant.
* Não remover isolamento entre empresas.
* Não expor dados sensíveis.
* Não armazenar senha ou CVV.
* Não exibir datas ao usuário no formato `AAAA-MM-DD`.
* Não utilizar teclado textual em campos de data.
* Não apagar valores preenchidos automaticamente ou manualmente.
* Não alterar datas por efeito de fuso horário.

---

# Fluxo obrigatório de execução

Antes de alterar qualquer arquivo:

1. Localizar todos os formulários.
2. Localizar campos de telefone.
3. Localizar campos de CPF.
4. Localizar campos de CNPJ.
5. Localizar campos de CEP.
6. Localizar campos de senha.
7. Localizar campos de e-mail.
8. Localizar campos de nome.
9. Localizar todos os campos de data.
10. Confirmar que campos de data exibem `DD/MM/AAAA`.
11. Confirmar que campos de data chamam teclado numérico.
12. Localizar listas, tabelas e cards repetidos.
13. Verificar se existem filtros de pesquisa.
14. Verificar se existe ordenação.
15. Identificar exceções de ordem funcional.
16. Verificar paginação e consultas remotas.
17. Verificar impacto em Firestore e APIs.
18. Identificar componentes reutilizáveis.
19. Listar os arquivos que precisarão ser alterados.
20. Aplicar somente as alterações necessárias.
21. Testar desktop.
22. Testar mobile.
23. Testar teclado numérico nos campos de data.
24. Testar filtros.
25. Testar ordenação alfabética.
26. Testar validações.
27. Informar claramente o que foi alterado.

---

# Resultado esperado

Após executar esta Skill, os formulários e listas deverão possuir, quando aplicável:

* Máscara de telefone
* Máscara de CPF
* Máscara de CNPJ
* Máscara de CEP
* Busca automática no ViaCEP
* Preenchimento automático de endereço
* Visualização de senha
* Validação de e-mail
* Validação em tempo real
* Teclado mobile adequado
* Campos de data detectados automaticamente
* Teclado numérico nos campos de data
* Formato visível `DD/MM/AAAA`
* Validação de datas impossíveis
* Preservação correta de fuso horário
* Pesquisa textual
* Filtros de consulta
* Botão para limpar filtros
* Mensagem de lista vazia
* Ordenação alfabética em português do Brasil
* Preservação de ordens funcionais
* Compatibilidade desktop
* Compatibilidade mobile
* Compatibilidade PWA
* Melhor acessibilidade
* Código limpo e reutilizável
* Baixo impacto no desempenho
* Baixo consumo de leituras do banco de dados
* Preservação das regras de negócio
* Preservação das regras de segurança
* Preservação do isolamento multi-tenant

Sempre reutilizar componentes, serviços, funções, máscaras, filtros e padrões existentes antes de criar novos.
