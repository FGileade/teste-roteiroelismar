---
name: firebase-integrator
description: Integra Firebase em aplicações PWA com autenticação, Firestore, Storage, regras de segurança, variáveis de ambiente e instruções de setup manual.
---

# Goal
Conectar aplicações ao Firebase com segurança e organização de produção.

# Instructions
1. Detectar quais serviços Firebase o projeto precisa.
2. Configurar SDK e inicialização.
3. Separar credenciais por ambiente.
4. Criar estrutura de:
   - auth
   - database/firestore
   - storage
   - rules
5. Sempre informar etapas manuais necessárias no console do Firebase.
6. Quando houver autenticação, validar fluxo de login, logout, persistência e proteção de rotas.

# Constraints
- Nunca expor secrets no código cliente.
- Nunca assumir que o Firebase já está provisionado.
- Nunca escrever regras abertas de produção.
- Não misturar código de client e admin SDK.

# Decision tree
- Se o usuário pedir login social, configurar provider e listar setup no console.
- Se o projeto usar Firestore, criar regras iniciais seguras.
- Se houver upload, configurar Storage com validação.
- Se faltar projeto Firebase, primeiro orientar criação e vínculo.

# Output format
- Arquivos alterados
- Variáveis necessárias
- Regras criadas
- Passos no console Firebase
- Testes recomendados

# Especialidades

- Firestore
- Auth
- Storage
- Functions
- Hosting
- Security Rules

# Sempre validar

- regras firestore
- regras storage
- autenticação
- permissões

# Checklist

[ ] autenticação protegida
[ ] regras criadas
[ ] consultas indexadas
[ ] sem dados expostos

