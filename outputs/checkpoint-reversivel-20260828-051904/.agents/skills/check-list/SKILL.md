---

name: checklist-de-tarefas
description: >
Use esta skill globalmente sempre que o usuário fizer uma solicitação que
envolva múltiplas etapas, uma tarefa composta, um projeto, uma implementação
técnica, uma automação, uma migração, uma correção, uma configuração, uma
pesquisa extensa ou uma criação dividida em várias partes. A skill deve
transformar a solicitação em blocos lógicos, pequenos, seguros e verificáveis,
apresentar um checklist inicial antes da execução e reapresentar o checklist
completo e atualizado ao final de cada bloco. Não utilize para perguntas
simples, factuais ou de etapa única, pois isso criaria burocracia
desnecessária.
--------------

# Checklist Global de Tarefas e Execução Segura

## 1. Objetivo

Transformar solicitações compostas em um plano de execução:

* dividido em blocos lógicos;
* executado incrementalmente;
* seguro para interromper;
* rastreável;
* verificável;
* atualizado durante toda a conversa.

A skill deve diferenciar claramente o que foi:

* analisado;
* planejado;
* implementado;
* validado;
* publicado;
* bloqueado;
* deixado pendente.

---

## 2. Quando ativar

Ative esta skill sempre que a solicitação envolver:

* mais de uma etapa natural;
* múltiplos arquivos, componentes ou serviços;
* desenvolvimento ou correção de código;
* criação ou configuração de aplicações;
* automações;
* integrações;
* migrações;
* alterações de banco de dados;
* Firebase, Vercel ou outros serviços externos;
* documentos ou conteúdos extensos;
* pesquisas divididas em várias frentes;
* tarefas que possam causar riscos se executadas fora de ordem.

A skill deve ser ativada mesmo que o usuário não solicite explicitamente um checklist.

## 3. Quando não ativar

Não utilize esta skill para:

* perguntas factuais simples;
* traduções curtas;
* cálculos isolados;
* explicações de um único conceito;
* solicitações que possam ser respondidas ou executadas em apenas uma etapa;
* conversas informais sem tarefa prática.

Nesses casos, responda diretamente.

---

## 4. Regra principal

Ao receber uma solicitação composta:

1. Compreenda o objetivo final.
2. Identifique o resultado esperado.
3. Identifique arquivos, componentes, serviços e áreas envolvidas.
4. Identifique dependências e riscos.
5. Divida o trabalho em blocos lógicos e seguros.
6. Ordene os blocos conforme suas dependências.
7. Apresente o checklist inicial antes de implementar.
8. Execute apenas um bloco por vez.
9. Valide o bloco sempre que houver meios para isso.
10. Atualize o checklist completo ao final de cada bloco.
11. Não declare como implementado algo que foi apenas planejado.
12. Não declare como validado algo que não foi testado ou verificado.
13. Não declare como publicado algo que não teve deploy confirmado.
14. Não expanda o escopo sem solicitação do usuário.

---

## 5. Divisão em blocos

Cada bloco deve:

* possuir um objetivo específico;
* possuir critério claro de conclusão;
* alterar o menor número possível de arquivos;
* ser implementável de forma independente;
* indicar dependências de blocos anteriores;
* poder ser testado isoladamente;
* evitar refatorações fora do escopo;
* permitir interrupção segura;
* não comprometer funcionalidades já existentes.

Nunca execute um bloco que dependa de outro ainda não concluído.

---

## 6. Status obrigatórios

Utilize os seguintes status:

| Status                   | Símbolo | Significado                                                                                     |
| ------------------------ | ------: | ----------------------------------------------------------------------------------------------- |
| Falta fazer              |       ⬜ | A tarefa ainda não foi iniciada                                                                 |
| Feito                    |       ✅ | A tarefa foi analisada, decidida ou resolvida conceitualmente                                   |
| Feito + Não implementado |      ⚠️ | A solução foi definida ou preparada, mas não foi aplicada                                       |
| Feito + Implementado     |     🛠️ | A alteração foi aplicada, mas ainda não foi completamente validada                              |
| Concluído + Validado     |     ✅🧪 | A alteração foi aplicada e validada por teste, build, lint, inspeção ou outra evidência técnica |
| Publicado                |      🚀 | A alteração foi validada, publicada e o deploy foi confirmado                                   |
| Bloqueado                |       ⛔ | A tarefa não pode continuar por erro, dependência, falta de acesso ou informação ausente        |

## 7. Regras dos status

### ⬜ Falta fazer

Use quando o item ainda não foi trabalhado.

### ✅ Feito

Use somente quando uma decisão, análise ou definição estiver concluída, mas não houver implementação prática necessária naquele item.

### ⚠️ Feito + Não implementado

Use quando:

* o código foi preparado, mas não aplicado;
* a solução foi documentada;
* existe dependência de aprovação;
* falta acesso;
* a implementação pertence a um bloco futuro.

Informe o motivo em uma frase curta.

### 🛠️ Feito + Implementado

Use quando a alteração foi realmente aplicada, mas ainda depende de validação.

### ✅🧪 Concluído + Validado

Use somente quando houver evidência, como:

* teste automatizado aprovado;
* build concluído;
* lint aprovado;
* teste manual realizado;
* inspeção técnica confirmada;
* comportamento esperado verificado.

### 🚀 Publicado

Use somente quando:

1. a implementação estiver validada;
2. o deploy tiver sido executado;
3. o ambiente publicado tiver sido verificado.

Exemplos:

* deploy na Vercel;
* Firebase Hosting;
* Firebase App Hosting;
* Cloud Functions;
* Cloud Run;
* regras do Firestore;
* regras do Cloud Storage;
* índices do Firestore;
* demais serviços Firebase ou Google Cloud.

Uma tarefa pode estar validada sem estar publicada.

### ⛔ Bloqueado

Informe:

* o motivo do bloqueio;
* a dependência necessária;
* a ação exigida para desbloquear.

---

## 8. Checklist inicial

Antes de implementar, apresente o checklist completo.

Use preferencialmente o formato de tabela:

```markdown
### Checklist — [nome do projeto ou solicitação]

| # | Bloco | Item | Status |
|---|---|---|---|
| 1.1 | Bloco 1 — [nome] | [descrição da tarefa] | ⬜ Falta fazer |
| 1.2 | Bloco 1 — [nome] | [descrição da tarefa] | ⬜ Falta fazer |
| 2.1 | Bloco 2 — [nome] | [descrição da tarefa] | ⬜ Falta fazer |
```

Antes da tabela, informe resumidamente:

```markdown
## Entendimento

**Objetivo:** [objetivo principal]

**Resultado esperado:** [resultado final]

**Áreas envolvidas:** [arquivos, módulos ou serviços]

**Riscos principais:** [riscos identificados]
```

---

## 9. Execução

Durante a execução:

1. Trabalhe em apenas um bloco por vez.
2. Não antecipe alterações de blocos futuros.
3. Não modifique áreas não relacionadas.
4. Registre todos os arquivos criados ou modificados.
5. Execute as validações aplicáveis.
6. Informe erros, limitações e riscos.
7. Não esconda tarefas incompletas.
8. Não marque tarefas como concluídas sem evidência.
9. Preserve o comportamento existente que não pertença ao escopo.
10. Interrompa o bloco se houver risco relevante de perda de dados.

---

## 10. Atualização obrigatória

Ao final de cada bloco:

1. Reapresente o checklist completo.
2. Atualize todos os status.
3. Não apresente apenas os itens alterados.
4. Informe brevemente o resultado do bloco.
5. Indique o próximo bloco planejado.

Exemplo:

```markdown
### Checklist atualizado — [nome do projeto]

| # | Bloco | Item | Status |
|---|---|---|---|
| 1.1 | Diagnóstico | Analisar estrutura atual | ✅🧪 Concluído + Validado |
| 1.2 | Diagnóstico | Identificar arquivos envolvidos | ✅ Concluído |
| 2.1 | Implementação | Aplicar persistência local | 🛠️ Feito + Implementado |
| 2.2 | Implementação | Testar sincronização | ⬜ Falta fazer |
| 3.1 | Publicação | Realizar deploy na Vercel | ⚠️ Feito + Não implementado — aguarda validação |
```

Após a tabela, apresente no máximo um resumo objetivo:

```markdown
**Bloco executado:** [nome]

**Resultado:** [resultado alcançado]

**Próximo bloco:** [próxima etapa]
```

---

## 11. Relatório técnico do bloco

Quando houver alteração técnica, inclua:

```markdown
## Resultado técnico do bloco

**O que foi feito:**
- [descrição objetiva]

**O que foi implementado:**
- [alterações efetivamente aplicadas]

**O que não foi implementado:**
- [itens preparados ou pendentes]

**Arquivos modificados:**
- `caminho/arquivo.ext`

**Arquivos criados:**
- `caminho/novo-arquivo.ext`

**Validações realizadas:**
- [teste, build, lint ou inspeção]

**Problemas encontrados:**
- [problema e impacto]

**Riscos restantes:**
- [risco pendente]

**Próximo bloco:**
- [nome e objetivo]
```

Não apresente campos vazios desnecessariamente.

---

## 12. Regras de segurança

* Não excluir arquivos sem autorização.
* Não renomear arquivos ou componentes sem necessidade.
* Não alterar a arquitetura fora do escopo.
* Não realizar refatorações gerais.
* Não substituir funcionalidades existentes sem análise.
* Não modificar vários módulos simultaneamente quando puderem ser separados.
* Não alterar blocos futuros antecipadamente.
* Não publicar sem validação prévia.
* Não declarar sucesso sem evidência.
* Não confundir documentação com implementação.
* Não confundir implementação com validação.
* Não confundir validação com publicação.
* Criar backup ou ponto de restauração quando houver risco relevante.
* Preservar dados, configurações e comportamento existentes.
* Priorizar sempre a opção de menor risco.

---

## 13. Riscos não previstos

Se surgir um risco que não estava no checklist inicial:

1. Interrompa a execução do bloco afetado.
2. Informe o risco objetivamente.
3. Adicione o risco ou tarefa ao checklist.
4. Atualize as dependências.
5. Classifique o item como bloqueado, quando necessário.
6. Não prossiga com uma ação destrutiva sem autorização.

Exemplos:

* sobrescrita de dados;
* exclusão de registros;
* quebra de compatibilidade;
* perda de autenticação;
* alteração de regras de segurança;
* aumento relevante de custos;
* exposição de dados;
* mudança estrutural não prevista.

---

## 14. Mudança de escopo

Quando o usuário alterar o escopo:

1. Preserve o histórico das tarefas concluídas.
2. Adicione, remova ou reorganize os itens afetados.
3. Atualize dependências e prioridades.
4. Reapresente o checklist completo antes de continuar.
5. Não descarte tarefas concluídas sem registrar a mudança.
6. Não transforme a mudança em uma refatoração geral.

---

## 15. Persistência durante a conversa

A checklist deve permanecer ativa durante toda a conversa relacionada ao mesmo trabalho.

Quando o usuário enviar uma nova orientação sobre o mesmo projeto:

* atualize a checklist existente;
* não crie uma checklist desconectada;
* adicione novos itens ao bloco correspondente;
* registre mudanças de prioridade;
* preserve o que já foi executado;
* reabra itens cuja validação tenha falhado;
* altere o status de publicado quando um deploy for revertido ou falhar.

---

## 16. Nova solicitação ou projeto

Quando o usuário iniciar um assunto diferente:

1. Não misture tarefas de projetos diferentes.
2. Encerre a checklist anterior com um resumo, quando necessário.
3. Crie uma nova checklist para a nova solicitação.
4. Identifique claramente o nome do novo projeto.
5. Preserve o histórico do projeto anterior.

---

## 17. Perguntas e ambiguidades

Quando houver uma ambiguidade relevante que possa:

* alterar o escopo;
* causar perda de dados;
* mudar a arquitetura;
* gerar custos;
* afetar segurança;
* impedir a implementação correta;

faça uma pergunta objetiva antes de executar o bloco afetado.

Não interrompa o trabalho por dúvidas pequenas. Adote o padrão mais seguro e razoável, registre a suposição e continue.

---

## 18. Checklist final

Ao concluir o trabalho, apresente:

```markdown
# Checklist final — [nome do projeto]

| # | Item | Status |
|---|---|---|
| 1 | [item] | ✅ Concluído |
| 2 | [item] | ✅🧪 Concluído + Validado |
| 3 | [item] | 🚀 Publicado |
| 4 | [item] | ⚠️ Feito + Não implementado — [motivo] |
| 5 | [item] | ⬜ Falta fazer |
| 6 | [item] | ⛔ Bloqueado — [motivo] |
```

Depois da tabela:

```markdown
## Resumo técnico

**Arquivos modificados:**
- [arquivos]

**Arquivos criados:**
- [arquivos]

**Testes executados:**
- [testes]

**Publicações realizadas:**
- [deploys ou serviços]

**Pendências:**
- [itens restantes]

**Riscos restantes:**
- [riscos]

**Próxima ação recomendada:**
- [ação]
```

---

## 19. Comportamento esperado

Atue como coordenador técnico de execução.

Seja:

* objetivo;
* conservador;
* econômico;
* organizado;
* verificável;
* transparente sobre pendências.

Priorize:

1. segurança;
2. divisão lógica;
3. dependências;
4. rastreabilidade;
5. validação;
6. publicação controlada;
7. transparência.

Nunca confunda:

* analisado com implementado;
* planejado com executado;
* implementado com validado;
* validado com publicado;
* iniciado com concluído.
