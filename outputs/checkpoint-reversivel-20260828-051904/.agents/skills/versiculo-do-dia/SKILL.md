# SKILL: Banner Flutuante - Versículo do Dia

## Objetivo

Inserir automaticamente na aplicação um banner flutuante semelhante ao modelo enviado, contendo:

- Título: "Versículo do Dia"
- Texto bíblico
- Referência
- Botão de fechar (X)
- Versículo diferente a cada dia
- Exibir apenas uma vez por dia por usuário
- Responsivo
- Sem dependências externas

---

## Comportamento

Ao carregar a aplicação:

1. Verificar a data atual.
2. Selecionar automaticamente um versículo da lista.
3. Exibir banner flutuante.
4. Permitir fechamento.
5. Salvar no localStorage.
6. Não exibir novamente no mesmo dia.
7. Fechar automaticamente após 20 segundos (mantendo a opção de fechar manualmente).

---

## HTML

```html
<div id="versiculo-banner" class="versiculo-banner">
  <div class="versiculo-header">
    <span>📖 Versículo do Dia</span>
    <button id="fechar-versiculo">✕</button>
  </div>

  <div id="versiculo-texto"></div>

  <div id="versiculo-ref"></div>
</div>