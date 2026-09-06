---
name: assinatura-rodape
description: Garante que a aplicação tenha uma assinatura premium no rodapé com o texto "Developed by Gileade HUB", link apenas em "Gileade HUB", cor azul, tipografia pequena e implementação consistente em React, Next.js, HTML ou CSS.
version: 1.0.0
tags:
  - branding
  - footer
  - signature
  - react
  - nextjs
  - ui
---

# Skill: Assinatura de rodapé Gileade HUB

## Objetivo

Aplicar e verificar uma assinatura institucional fixa no rodapé da aplicação com padrão visual premium, discreto e consistente.

A assinatura obrigatória deve seguir exatamente este conteúdo:

- Texto visível: `Developed by Gileade HUB`
- Apenas `Gileade HUB` deve ser clicável
- URL obrigatória: `https://gileadehub.com.br/`
- Cor do link: azul
- Tamanho da fonte: pequeno, com aparência refinada
- Localização: rodapé da aplicação

## Quando usar

Use esta skill quando o pedido envolver qualquer um destes casos:

- Inserir assinatura institucional no projeto
- Padronizar o rodapé
- Validar branding no footer
- Corrigir assinatura ausente ou fora do padrão
- Revisar layout final da aplicação
- Garantir presença da marca Gileade HUB no rodapé

## Resultado esperado

Ao final, a aplicação deve conter um rodapé visualmente discreto e elegante com:

- Texto `Developed by`
- Link em `Gileade HUB`
- Estilo premium
- Boa legibilidade
- Implementação segura para link externo
- Estrutura reutilizável

## Regras obrigatórias

1. A assinatura deve estar no rodapé da aplicação.
2. O texto final visível deve ser exatamente `Developed by Gileade HUB`.
3. Somente `Gileade HUB` deve estar dentro da tag de link.
4. O link deve ser exatamente `https://gileadehub.com.br/`.
5. O link deve abrir em nova aba.
6. O link deve usar `rel="noopener noreferrer"`.
7. A palavra `Gileade HUB` deve aparecer em azul.
8. O texto deve ser pequeno, preferencialmente 12px ou 13px.
9. O visual deve ser discreto, limpo e premium.
10. A assinatura não deve competir visualmente com o conteúdo principal.
11. Não usar efeitos chamativos, gradientes exagerados, sombra pesada ou fonte decorativa.
12. O rodapé deve funcionar bem em desktop e mobile.

## Implementação padrão

### HTML / JSX aprovado

Use esta estrutura como padrão:

```tsx
<footer className="app-signature">
  <p>
    Developed by{" "}
    <a
      href="https://gileadehub.com.br/"
      target="_blank"
      rel="noopener noreferrer"
    >
      Gileade HUB
    </a>
  </p>
</footer>
```

## CSS padrão

Use este estilo base, adaptando apenas se necessário para combinar com o design do projeto sem quebrar as regras obrigatórias:

```css
.app-signature {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 16px;
  margin-top: auto;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: transparent;
}

.app-signature p {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  letter-spacing: 0.2px;
  color: #667085;
  font-weight: 500;
  text-align: center;
}

.app-signature a {
  color: #0b5cff;
  text-decoration: none;
  font-weight: 600;
  transition: color 180ms ease, opacity 180ms ease;
}

.app-signature a:hover {
  color: #0847c7;
  opacity: 0.96;
}

.app-signature a:focus-visible {
  outline: 2px solid #0b5cff;
  outline-offset: 2px;
  border-radius: 4px;
}
```

## Implementação React / Next.js

Quando o projeto usar React ou Next.js, prefira criar um componente reutilizável.

### Exemplo de componente

```tsx
export function AppSignature() {
  return (
    <footer className="app-signature">
      <p>
        Developed by{" "}
        <a
          href="https://gileadehub.com.br/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Gileade HUB
        </a>
      </p>
    </footer>
  );
}
```

### Exemplo de uso no layout

```tsx
<div className="app-shell">
  <main className="app-content">{children}</main>
  <AppSignature />
</div>
```

```css
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-content {
  flex: 1;
}
```

## Processo de atuação da skill

Sempre siga esta ordem:

1. Verifique se já existe assinatura no rodapé.
2. Se existir, compare com o padrão obrigatório.
3. Corrija texto, link, cor, tamanho e posicionamento se necessário.
4. Se não existir, implemente a estrutura padrão.
5. Se o projeto usar layout global, insira no layout principal.
6. Se o projeto usar componente de footer, adapte esse componente.
7. Garanta consistência em mobile e desktop.
8. Evite duplicar assinatura em múltiplas telas.
9. Preserve o estilo do projeto, mas sem quebrar os requisitos.
10. Entregue o código final pronto para produção.

## Checklist de validação

Antes de concluir, confirme todos os itens abaixo:

- [ ] Existe rodapé visível na aplicação
- [ ] A assinatura está no rodapé
- [ ] O texto visível está exatamente como definido
- [ ] Apenas `Gileade HUB` é clicável
- [ ] O href está correto
- [ ] O link abre em nova aba
- [ ] O `rel="noopener noreferrer"` foi aplicado
- [ ] O link está azul
- [ ] A tipografia está pequena
- [ ] O visual está discreto e premium
- [ ] Não há duplicação da assinatura
- [ ] O resultado funciona em telas pequenas
- [ ] O rodapé não quebrou o layout existente

## Critérios de reprovação

Considere a implementação incorreta se ocorrer qualquer um destes casos:

- A assinatura estiver ausente
- O texto estiver diferente do padrão
- O link for aplicado no texto inteiro
- A URL estiver errada
- A cor do link não for azul
- A fonte estiver grande demais
- O rodapé estiver desalinhado
- O estilo estiver chamativo demais
- O link externo não usar atributos de segurança
- A assinatura aparecer no meio da página em vez do rodapé

## Regras de estilo

Mantenha sempre estas diretrizes:

- Visual limpo
- Hierarquia discreta
- Fonte pequena e legível
- Azul elegante no link
- Espaçamento equilibrado
- Acabamento refinado
- Sem exageros visuais

## Instruções para o agente

Ao executar esta skill:

- Faça mudanças mínimas e seguras
- Preserve o layout existente
- Prefira componente reutilizável
- Prefira layout global quando a assinatura precisar aparecer em toda a aplicação
- Não altere textos fora do escopo
- Não remova branding existente sem necessidade
- Não invente novas variações do texto
- Não troque a URL definida
- Não estilize a assinatura de forma chamativa

## Resposta esperada do agente

Ao finalizar uma tarefa com esta skill, entregue:

1. O trecho do componente ou HTML inserido
2. O CSS aplicado
3. O local onde a assinatura foi adicionada
4. Uma confirmação breve de que a validação foi atendida

## Exemplo de saída ideal

- Assinatura adicionada no layout principal da aplicação
- Link aplicado somente em `Gileade HUB`
- Cor azul configurada
- Tipografia ajustada para 12px
- Rodapé mantido discreto e premium