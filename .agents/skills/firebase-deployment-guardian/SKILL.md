# Firebase Deployment Guardian

```yaml
---
name: firebase-deployment-guardian
description: Execute esta Skill SEMPRE antes, durante e após qualquer deploy para Firebase Hosting, Firestore, Authentication, Storage, Cloud Functions, Cloud Run, Firebase Data Connect ou Vercel quando o projeto utilizar Firebase. Esta Skill realiza uma auditoria completa da infraestrutura, banco de dados, segurança, autenticação, permissões, índices, desempenho e consistência entre aplicação e Firebase. Caso encontre problemas críticos, interrompa o deploy e gere um relatório detalhado.
---

# FIREBASE DEPLOYMENT GUARDIAN

## Objetivo

Garantir que a aplicação esteja totalmente pronta para produção.

A Skill deverá atuar como um Auditor Técnico, Engenheiro DevOps, Especialista Firebase, Especialista em Segurança, QA e Arquiteto de Software.

Nunca assumir que o projeto está correto.

Sempre verificar.

Nunca ignorar erros.

Sempre gerar relatório.

Caso exista qualquer falha crítica, interromper o deploy.

---

# Fluxo Geral

Executar exatamente nesta ordem:

1. Auditoria do Projeto
2. Auditoria da Estrutura
3. Auditoria do Firestore
4. Auditoria da Authentication
5. Auditoria das Roles
6. Auditoria das Regras
7. Auditoria dos Índices
8. Auditoria do Storage
9. Auditoria das Functions
10. Auditoria do Código
11. Auditoria de Performance
12. Auditoria de Segurança
13. Auditoria de Custos
14. Backup
15. Simulação Completa
16. Deploy
17. Smoke Test
18. Relatório Final

---

# 1 Auditoria da Estrutura

Verificar:

✔ Diretórios

✔ Organização

✔ Firebase Config

✔ firebase.json

✔ .firebaserc

✔ firestore.rules

✔ firestore.indexes.json

✔ storage.rules

✔ functions

✔ hosting

✔ public

✔ src

✔ assets

✔ components

✔ pages

✔ hooks

✔ services

✔ repositories

✔ contexts

✔ utils

✔ environments

✔ scripts

Verificar arquivos duplicados.

Verificar arquivos órfãos.

Verificar imports quebrados.

Verificar dependências não utilizadas.

Verificar dependências ausentes.

---

# 2 Auditoria Firestore

Localizar automaticamente TODAS as coleções utilizadas na aplicação.

Comparar:

Código

Firestore

Regras

Índices

Verificar:

Coleção existe

Subcoleções existem

Documentos

Estrutura

Campos obrigatórios

Campos opcionais

Tipos corretos

Campos inexistentes

Campos duplicados

IDs inválidos

Referências quebradas

Documentos órfãos

Dados inconsistentes

Dados duplicados

Collections nunca utilizadas

Collections utilizadas sem existir

Caso alguma coleção não exista:

Gerar erro crítico.

---

# 3 Auditoria das Coleções

Para cada coleção:

Verificar:

Existe

Quantidade documentos

Owner

Regras

Índices

Permissões

Subcoleções

Schema esperado

Última atualização

Integridade

---

# 4 Auditoria Authentication

Verificar:

Firebase Authentication habilitado.

Métodos ativos.

Google

Email

Telefone

Anonymous

Apple

Facebook

GitHub

Microsoft

Magic Link

MFA

Usuários desabilitados.

Usuários sem cargo.

Usuários duplicados.

Usuários sem claims.

Usuários sem permissões.

Emails inválidos.

---

# 5 Auditoria das Roles

Detectar automaticamente cargos existentes.

Exemplo:

superAdmin

admin

diretor

gerente

financeiro

secretaria

professor

instrutor

aluno

responsavel

visitante

Conferir:

Hierarquia.

Permissões.

Restrições.

Conflitos.

Herança.

Escalonamento.

---

# 6 Auditoria das Custom Claims

Verificar:

role

roles

permissions

academyId

organizationId

tenant

company

school

owner

uid

active

status

Confirmar que:

Todos usuários possuem claims válidas.

Claims inválidas geram alerta.

Claims ausentes geram erro.

---

# 7 Auditoria das Regras Firestore

Validar sintaxe.

Validar publicação.

Validar funcionamento.

Detectar regras perigosas.

Exemplos:

allow read, write: if true;

allow write: if request.auth != null;

allow read;

allow write;

Detectar:

Coleções sem regras.

Coleções públicas.

Permissões excessivas.

Escalonamento.

Leitura irrestrita.

Escrita irrestrita.

Excluir irrestrito.

Criar admin.

Criar roles.

Alterar cargos.

Alterar pagamentos.

Alterar configurações.

Caso detectado:

Bloquear deploy.

---

# 8 Simulação de Permissões

Executar testes simulando:

Visitante

Aluno

Responsável

Professor

Secretária

Financeiro

Administrador

Super Administrador

Executar:

Create

Read

Update

Delete

Upload

Download

Exportação

Importação

Dashboard

Administração

Relatórios

Logs

Configurações

Comparar resultado esperado.

---

# 9 Auditoria Storage

Verificar:

Storage Rules

Buckets

Pastas

Arquivos

Uploads públicos

Uploads privados

Arquivos órfãos

Pastas sem regras

Uploads sem autenticação

Arquivos duplicados

---

# 10 Auditoria Cloud Functions

Verificar:

Functions implantadas.

Functions duplicadas.

Functions órfãs.

Triggers.

Firestore Trigger.

Storage Trigger.

Authentication Trigger.

HTTPS Trigger.

Agendamentos.

Timeout.

Erros.

Logs.

---

# 11 Auditoria Cloud Run

Caso exista:

Verificar:

Deploy

Containers

Secrets

Variáveis

Escalabilidade

Health Check

Permissões

---

# 12 Auditoria Environment

Verificar:

.env

.env.local

.env.production

Firebase Config

API Keys

Secrets

Variáveis ausentes.

Variáveis duplicadas.

Variáveis não utilizadas.

---

# 13 Auditoria do Código

Comparar:

Código

Firestore

Storage

Authentication

Functions

Verificar:

Coleções inexistentes.

Campos inexistentes.

Funções inexistentes.

Chamadas inválidas.

Imports quebrados.

Rotas inválidas.

Links quebrados.

---

# 14 Auditoria de Performance

Verificar:

Consultas sem índice.

Consultas lentas.

Leituras excessivas.

Writes excessivos.

Deletes excessivos.

Coleções gigantes.

Documentos enormes.

Paginação.

Lazy Loading.

Cache.

Realtime desnecessário.

---

# 15 Auditoria de Custos

Estimar:

Reads

Writes

Deletes

Storage

Bandwidth

Functions

Cloud Run

Authentication

Gerar estimativa mensal.

Apontar possíveis economias.

---

# 16 Auditoria de Segurança

Executar testes simulando ataques.

Verificar:

Escalonamento.

Invasão.

Leitura completa.

Escrita indevida.

Alteração de usuários.

Alteração de cargos.

Alteração de pagamentos.

Alteração financeira.

Exclusão indevida.

Bypass Authentication.

Bypass Claims.

Bypass Rules.

SQL Injection.

NoSQL Injection.

XSS.

CSRF.

Caso detectado:

Interromper deploy.

---

# 17 Auditoria dos Índices

Verificar:

firestore.indexes.json

Índices existentes.

Índices ausentes.

Índices duplicados.

Composite Index.

Single Field.

Sugestões automáticas.

---

# 18 Auditoria Backup

Antes do deploy:

Confirmar:

Backup recente.

Snapshot.

Rollback disponível.

Caso não exista:

Gerar alerta.

---

# 19 Simulação Completa

Executar:

Login

Logout

Cadastro

Recuperação senha

CRUD completo

Upload

Download

Realtime

Pesquisa

Filtros

Relatórios

Dashboard

Notificações

---

# 20 Deploy Inteligente

Executar:

Lint

↓

Format

↓

Type Check

↓

Testes

↓

Build

↓

Firestore Audit

↓

Authentication Audit

↓

Rules Audit

↓

Claims Audit

↓

Storage Audit

↓

Functions Audit

↓

Cloud Run Audit

↓

Indexes Audit

↓

Performance Audit

↓

Security Audit

↓

Backup

↓

Deploy

↓

Smoke Test

↓

Relatório Final

Caso qualquer etapa crítica falhe:

Cancelar deploy.

---

# 21 Smoke Test

Após deploy verificar:

Aplicação online.

Firestore conectado.

Authentication funcionando.

Storage funcionando.

Functions funcionando.

Realtime funcionando.

Uploads funcionando.

Downloads funcionando.

Permissões funcionando.

---

# 22 Relatório Final

Gerar relatório completo contendo:

Resumo Executivo

Data

Projeto

Ambiente

Versão

Tempo total

Coleções verificadas

Subcoleções verificadas

Usuários analisados

Claims analisadas

Rules analisadas

Functions analisadas

Storage analisado

Cloud Run analisado

Performance

Custo estimado

Segurança

Backups

Índices

Erros

Alertas

Sugestões

Score Final

---

# Classificação

100 Excelente

90 Muito Bom

80 Bom

70 Atenção

60 Risco

50 Crítico

Abaixo de 50

Deploy Bloqueado

---

# Regras Obrigatórias

Nunca assumir.

Sempre validar.

Nunca sobrescrever dados.

Nunca apagar documentos automaticamente.

Nunca alterar regras automaticamente sem confirmação.

Nunca criar usuários automaticamente.

Nunca remover permissões automaticamente.

Nunca ignorar erros críticos.

Sempre apresentar relatório detalhado.

Sempre justificar cada erro encontrado.

Sempre sugerir correções.

Sempre priorizar segurança.

Sempre preservar integridade dos dados.

Sempre proteger informações sensíveis.

Sempre seguir as melhores práticas oficiais do Firebase.

Caso exista qualquer risco de perda de dados, vazamento de informações, falha de autenticação, inconsistência entre código e banco de dados ou vulnerabilidade de segurança, interromper imediatamente o processo de deploy e emitir um relatório com as ações corretivas necessárias antes de permitir uma nova implantação.
```
