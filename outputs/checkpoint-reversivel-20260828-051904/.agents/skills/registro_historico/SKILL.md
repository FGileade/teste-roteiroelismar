---
name: registro_historico
description: Ao encerrar este chat, gera um arquivo TXT e um README.md na pasta historico com o resumo completo do projeto, para não perder contexto na próxima sessão.
---

# Goal
Ao encerrar o chat, gerar automaticamente 2 arquivos na pasta `historico`:
1. `projeto-resumo(nome+data+horario).txt` — resumo em texto plano
2. `README(nome+data+horario).md` — resumo em Markdown com índice e formatação

# Instructions
1. Antes de finalizar, coletar informações do projeto:
   - nome do projeto
   - descrição e objetivo
   - stack usada (frameworks, bibliotecas, linguagens)
   - serviços e integrações (Firebase, Vercel, APIs)
   - versões principais das dependências
   - estrutura de pastas
   - fluxo de funcionamento (do usuário até o backend)
   - principais fluxos (autenticação, criação, leitura, etc.)
   - como instalar e configurar
   - como rodar localmente
   - como executar testes
   - configuração de deploy na Vercel
   - configuração do Firebase (projeto, regras, coleções)
   - organização de código e padrões seguidos
   - próximos passos e pendências

2. Gerar caminho absoluto:
   - Pasta destino: `C:\Users\filip\.gemini\antigravity\scratch\2. BACKUP DE PROJETOS`

3. Criar nome dos arquivos:
   - TXT: `projeto-resumo(nome-do-projeto+YYYY-MM-DD+HH-MM).txt`
   - MD: `README(nome-do-projeto+YYYY-MM-DD+HH-MM).md`

4. Criar conteúdo do TXT:
   - Título e descrição do projeto
   - Detalhes técnicos
   - Fluxo de funcionamento
   - Instalação e configuração
   - Como rodar localmente
   - Testes
   - Deploy na Vercel
   - Configuração do Firebase
   - Estrutura do código
   - Próximos passos e pendências

5. Criar conteúdo do README.md:
   - Título e descrição
   - Índice com links para cada seção
   - Todas as informações acima em Markdown
   - Exemplos de código quando relevante
   - Links para documentação externa

6. Ambos os arquivos devem ser:
   - Em português
   - Com linguagem clara e direta
   - Para que qualquer pessoa (incluindo o usuário na próxima conversa) entenda rapidamente o projeto e continue sem perder contexto

# Constraints
- Nunca finalizar o chat sem gerar os arquivos de histórico.
- Nunca deixar o histórico sem nome, data e horário.
- Nunca criar arquivos fora da pasta `historico`.
- Nunca esquecer de gerar tanto o TXT quanto o README.md.
- Nunca expor secrets nos arquivos de histórico.

# Decision tree
- Se o projeto ainda não tem nome, perguntar antes de gerar.
- Se não houver histórico de sessões anteriores, criar do zero.
- Se já existir histórico, manter o mesmo formato e atualizar apenas o que mudou.
- Se o usuário cancelar o encerramento, não gerar os arquivos.

# Output format ao encerrar
- Confirmar que arquivos foram criados
- Mostrar caminho completo dos arquivos
- Listar o que foi incluído no resumo
- Perguntar se o usuário quer abrir os arquivos agora