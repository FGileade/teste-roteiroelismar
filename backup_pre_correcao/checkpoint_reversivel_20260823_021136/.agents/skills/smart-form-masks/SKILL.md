---
name: smart-form-masks
description: Use esta Skill sempre que houver formulários HTML, React, Vue, Angular, Next.js, PWA ou Firebase. Procure automaticamente campos de entrada e aplique máscaras, validações, autocomplete, UX e acessibilidade sem quebrar funcionalidades existentes.
---

# Smart Form Masks

## Objetivo

Melhorar automaticamente todos os formulários da aplicação aplicando:

- Máscaras inteligentes
- Validações
- Autocomplete
- Busca automática de endereço pelo CEP
- Botão visualizar senha
- Mobile Keyboard correto
- Acessibilidade
- Melhor experiência do usuário

---

# Instruções

Sempre que localizar formulários:

## 1. Telefone

Detectar automaticamente campos como:

- telefone
- celular
- phone
- whatsapp
- contato
- tel

Aplicar:

- Máscara dinâmica

Formato:

(99) 99999-9999

Caso telefone fixo:

(99) 9999-9999

Adicionar:

- inputmode="tel"
- autocomplete="tel"

---

## 2. CPF

Detectar:

- cpf
- documento
- taxpayer

Aplicar máscara:

999.999.999-99

Adicionar:

- Validação do dígito verificador
- Bloquear letras
- autocomplete="off"

---

## 3. CEP

Detectar:

- cep
- zip
- zipcode
- postal

Aplicar máscara:

99999-999

Após completar os 8 números:

Consultar automaticamente:

https://viacep.com.br/ws/{CEP}/json/

Preencher automaticamente:

- Rua
- Bairro
- Cidade
- Estado

Se existir número e complemento:

Manter preenchimento manual.

Caso CEP inválido:

Exibir mensagem amigável.

Nunca interromper o usuário.

---

## 4. Campo Senha

Detectar:

- password
- senha

Adicionar botão:

👁

Comportamento:

Clique:

password -> text

Clique novamente:

text -> password

Não alterar valor digitado.

Não remover foco do campo.

---

## 5. Email

Aplicar:

type="email"

autocomplete="email"

Validação em tempo real.

Teclado mobile adequado.

---

## 6. Nome

Aplicar:

autocomplete="name"

Capitalização correta.

Remover espaços duplicados.

---

## 7. Data

Aplicar máscara:

dd/mm/aaaa

Validar datas impossíveis.

---

## 8. CNPJ (quando existir)

Máscara:

99.999.999/9999-99

Validar CNPJ.

---

## 9. Número

Campos:

- número
- addressNumber

Permitir apenas números.

---

## 10. Cartão (quando existir)

Aplicar agrupamento:

9999 9999 9999 9999

Nunca salvar CVV.

---

## UX Obrigatória

Todos os campos devem possuir:

placeholder

label

aria-label

autocomplete adequado

required quando necessário

feedback visual de erro

feedback visual de sucesso

---

## Mobile

Usar:

inputmode

keyboard correto

autocomplete

autocapitalize quando apropriado

---

## Acessibilidade

Garantir:

ARIA

Leitura por leitores de tela

Tab Navigation

Mensagens acessíveis

---

## Performance

Não adicionar bibliotecas desnecessárias.

Preferir JavaScript nativo.

Se existir biblioteca de máscara instalada:

Utilizá-la.

Caso contrário:

Implementar solução leve.

---

## Compatibilidade

Aplicar em:

- HTML
- React
- Next.js
- Vue
- Angular
- Vite
- Firebase Hosting
- Vercel
- PWAs

---

## Nunca

Não quebrar componentes existentes.

Não alterar nomes de campos.

Não remover validações já existentes.

Não modificar regras de negócio.

Não substituir APIs existentes.

---

## Resultado esperado

Após executar esta Skill, todos os formulários da aplicação deverão possuir automaticamente:

✓ Máscara de telefone

✓ Máscara de CPF

✓ Máscara de CEP

✓ Busca automática ViaCEP

✓ Preenchimento automático de endereço

✓ Visualizar senha (ícone olho)

✓ Máscaras inteligentes

✓ Validação em tempo real

✓ Melhor UX

✓ Melhor acessibilidade

✓ Compatibilidade Desktop

✓ Compatibilidade Mobile

✓ Compatibilidade PWA

✓ Código limpo e reutilizável

Sempre reutilizar componentes existentes antes de criar novos.