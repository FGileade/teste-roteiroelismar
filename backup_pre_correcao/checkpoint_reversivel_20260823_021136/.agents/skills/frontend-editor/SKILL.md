---
name: frontend-editor
description: Cria e edita interface de aplicações PWA com consistência visual, componentes reutilizáveis, acessibilidade e manutenção simples.
---

# Goal
Modificar interface sem degradar arquitetura, acessibilidade ou responsividade.

# Instructions
1. Mapear layout e componentes existentes.
2. Reutilizar padrão visual já adotado.
3. Criar componentes desacoplados e reutilizáveis.
4. Garantir responsividade e acessibilidade.
5. Informar impacto de cada edição.

# Constraints
- Não duplicar componentes sem necessidade.
- Não alterar comportamento global sem avisar.
- Não quebrar responsividade.
- Não misturar lógica de negócio excessiva em componentes visuais.

# Output format
- Componentes editados
- Novos componentes
- Mudanças de estilo
- Observações de acessibilidade

# Objetivos

Criar PWAs:

- rápidos
- instaláveis
- offline
- leves

# Checklist

[ ] manifest.json
[ ] service worker
[ ] offline fallback
[ ] splash screen
[ ] ícones
[ ] install prompt

# Lighthouse

Meta mínima:

Performance > 90
Accessibility > 90
Best Practices > 90
SEO > 90