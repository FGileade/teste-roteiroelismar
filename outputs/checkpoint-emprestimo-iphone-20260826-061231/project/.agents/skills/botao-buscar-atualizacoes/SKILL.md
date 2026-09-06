# SKILL — BUSCAR ATUALIZAÇÕES (MVP)

## Objetivo

Implementar uma funcionalidade simples, segura e confiável que permita ao usuário atualizar manualmente a aplicação sempre que uma nova versão for publicada.

Sempre que o desenvolvedor realizar qualquer modificação na aplicação e executar um novo deploy, ele poderá informar aos usuários que existe uma nova versão disponível.

O usuário deverá acessar:

**Configurações → Procurar Atualizações**

Ao pressionar o botão, a aplicação deverá verificar se existe uma versão mais recente publicada e, caso exista, executar automaticamente todo o processo necessário para aplicar a atualização.

O objetivo desta Skill é eliminar a necessidade de limpar cache manualmente, reinstalar a aplicação ou aguardar que o navegador atualize os arquivos automaticamente.

---

# Objetivos da Skill

Esta Skill deverá:

* Adicionar a opção **🔄 Procurar Atualizações** dentro da aba **Configurações**.
* Manter o layout atual da aplicação sem alterações desnecessárias.
* Não modificar fluxos existentes.
* Não alterar componentes já implementados.
* Aproveitar toda a estrutura atual da aplicação.
* Utilizar o Service Worker existente (quando houver).
* Buscar atualizações apenas quando o usuário pressionar o botão.
* Garantir que, após a atualização, toda a aplicação passe imediatamente a utilizar a versão mais recente publicada.

---

# Fluxo Geral

```text
Desenvolvedor

↓

Realiza qualquer alteração na aplicação

↓

Executa o Deploy

↓

Nova versão publicada

↓

Desenvolvedor informa aos usuários:

"Existe uma nova versão disponível.
Acesse Configurações → Procurar Atualizações."

↓

Usuário abre a aplicação

↓

Acessa Configurações

↓

Pressiona

🔄 Procurar Atualizações

↓

Aplicação inicia verificação

↓

Existe atualização?

├── NÃO
│
│ Exibir:
│
│ ✔ Você já está utilizando a versão mais recente.
│
│ Encerrar processo.
│
└── SIM
    │
    Atualizar Service Worker
    │
    Baixar novos arquivos
    │
    Atualizar caches
    │
    Remover caches antigos (quando necessário)
    │
    Ativar imediatamente a nova versão
    │
    Recarregar automaticamente a aplicação
    │
    Exibir:
    │
    ✅ Aplicação atualizada com sucesso.
```

---

# Localização da Funcionalidade

A opção deverá ser adicionada exclusivamente dentro da aba **Configurações**.

Exemplo:

```text
Configurações

├── Alterar dados pessoais (email e senha)
├── 🔄 Procurar Atualizações
└── Sair(log off)
```

A Skill não deverá alterar a organização da tela nem remover funcionalidades existentes.

---

# Interface

Dentro da tela Configurações deverá existir uma seção semelhante a:

```text
Atualizações

Mantenha sua aplicação sempre atualizada.

[ 🔄 Procurar Atualizações ]
```

O botão deverá permanecer sempre disponível para o usuário.

---

# Fluxo de Execução

Quando o usuário pressionar o botão **🔄 Procurar Atualizações**, a aplicação deverá executar automaticamente o seguinte fluxo:

## Etapa 1

Exibir:

```text
🔍 Procurando atualizações...
```

---

## Etapa 2

Verificar se existe uma nova versão publicada.

---

## Caso NÃO exista atualização

Exibir:

```text
✔ Você já está utilizando a versão mais recente.
```

Encerrar o processo.

---

## Caso exista atualização

Executar automaticamente:

1. Procurar a nova versão.
2. Atualizar o Service Worker (quando existir).
3. Baixar todos os arquivos atualizados.
4. Atualizar todos os caches necessários.
5. Remover caches antigos (quando aplicável).
6. Ativar imediatamente a nova versão.
7. Garantir que todos os arquivos da aplicação passem a utilizar a versão recém-publicada.
8. Recarregar automaticamente a aplicação.
9. Exibir mensagem de sucesso.

Todo este processo deverá ocorrer automaticamente, sem intervenção do usuário.

---

# Mensagens Durante o Processo

Durante a atualização poderão ser exibidas mensagens como:

```text
🔍 Procurando atualizações...
```

↓

```text
⬇ Encontramos uma nova versão.
```

↓

```text
⬇ Baixando atualização...
```

↓

```text
⚙ Atualizando arquivos...
```

↓

```text
🧹 Atualizando cache...
```

↓

```text
♻ Aplicando atualização...
```

↓

```text
🔄 Reiniciando aplicação...
```

↓

```text
✅ Aplicação atualizada com sucesso.
```

---

# Caso Não Exista Atualização

Caso a aplicação já esteja utilizando a versão mais recente, deverá ser exibida a mensagem:

```text
✔ Você já está utilizando a versão mais recente.
```

Nenhuma outra ação deverá ser executada.

---

# Compatibilidade

A implementação deverá funcionar corretamente em:

* PWA instalada.
* Aplicação aberta pelo navegador.
* React.
* Next.js.
* Firebase Hosting.
* Vercel.
* Desktop.
* Android.
* iOS (respeitando as limitações da plataforma).

---

# Requisitos Técnicos

A implementação deverá:

* Utilizar a arquitetura atual do projeto.
* Aproveitar o Service Worker existente.
* Não criar dependências desnecessárias.
* Não modificar regras do Firebase.
* Não alterar autenticação.
* Não alterar permissões.
* Não alterar coleções do banco de dados.
* Não alterar regras de segurança.
* Não alterar rotas existentes.
* Não modificar componentes existentes.
* Não alterar a navegação da aplicação.
* Não exigir limpeza manual de cache.
* Não exigir reinstalação da aplicação.
* Não exigir atualização pelo navegador.
* Não exigir fechamento da aplicação.

---

# Experiência do Usuário

Todo o processo deverá ser simples.

Fluxo esperado:

1. O desenvolvedor publica uma nova versão.
2. O desenvolvedor comunica os usuários.
3. O usuário acessa **Configurações**.
4. Pressiona **🔄 Procurar Atualizações**.
5. A aplicação verifica automaticamente.
6. Caso exista atualização, todo o processo ocorre automaticamente.
7. A aplicação reinicia utilizando imediatamente a versão mais recente.

O usuário não deverá executar nenhuma ação adicional.

---

# Critérios de Sucesso

A Skill será considerada concluída quando:

* O botão **🔄 Procurar Atualizações** estiver disponível dentro da aba **Configurações**.
* O botão iniciar corretamente a verificação de novas versões.
* Caso exista atualização, a aplicação baixar automaticamente todos os arquivos necessários.
* Atualizar o Service Worker.
* Atualizar os caches necessários.
* Aplicar imediatamente a nova versão.
* Reiniciar automaticamente a aplicação.
* Exibir mensagem de sucesso.
* Caso não exista atualização, informar que a aplicação já está atualizada.
* Todo o processo ocorrer sem necessidade de limpar cache manualmente ou reinstalar a aplicação.

---

# Escopo desta Primeira Versão (MVP)

Esta Skill implementará exclusivamente a atualização manual da aplicação através do botão **🔄 Procurar Atualizações**.

Não fazem parte desta versão:

* Histórico de versões.
* Changelog.
* Número da versão instalada.
* Número da versão disponível.
* Atualização automática.
* Atualização obrigatória.
* Atualização em segundo plano.
* Remote Config.
* Firestore para controle de versões.
* Arquivo version.json.
* Notificações automáticas.
* Agendamento de verificações.

Esses recursos poderão ser adicionados futuramente sem necessidade de reestruturar esta implementação.

---

# Resultado Esperado

Ao final da implementação, sempre que uma nova versão da aplicação for publicada, bastará o desenvolvedor informar aos usuários:

> **"Acesse Configurações → 🔄 Procurar Atualizações."**

Após o clique, a própria aplicação deverá localizar, baixar, aplicar e ativar automaticamente a versão mais recente, garantindo que o usuário esteja utilizando imediatamente a última versão disponível, sem procedimentos manuais ou conhecimentos técnicos.
