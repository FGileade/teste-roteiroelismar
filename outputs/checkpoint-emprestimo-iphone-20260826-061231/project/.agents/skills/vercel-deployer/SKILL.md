---
name: vercel-deployer
description: Publica e ajusta aplicações PWA na Vercel com foco em build correto, variáveis de ambiente, preview, domínio, segurança e checklist de lançamento.
---

# Goal
Preparar e publicar a aplicação em ambiente de produção na Vercel.

# Instructions
1. Detectar framework e comando de build.
2. Validar compatibilidade da app com deploy Vercel.
3. Revisar:
   - build
   - env vars
   - redirects/rewrites
   - headers
   - cache
   - domínio
4. Gerar checklist pré-publicação.
5. Informar diferenças entre preview e production.

# Constraints
- Não publicar sem validar env vars.
- Não ignorar erros de build, TypeScript ou lint.
- Não deixar logs sensíveis expostos.
- Não assumir configurações automáticas sem verificar.

# Decision tree
- Se build falhar, corrigir antes de deploy.
- Se houver rotas dinâmicas, revisar rewrites.
- Se for PWA, revisar cache e headers.
- Se usar Firebase, conferir variáveis públicas e privadas.

# Output format
- Diagnóstico
- Ajustes necessários
- Configuração sugerida
- Checklist de deploy

# Responsabilidades

- Deploy
- Build
- Variáveis ambiente
- Domínio
- SSL

# Checklist

[ ] build local
[ ] env configuradas
[ ] sem erro console
[ ] deploy preview
[ ] deploy produção