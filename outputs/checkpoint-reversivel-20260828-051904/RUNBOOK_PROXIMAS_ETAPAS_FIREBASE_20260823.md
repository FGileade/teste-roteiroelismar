# Runbook — próximas etapas da sincronização incremental

**Projeto:** `roteiroelismar`  
**Estado inicial:** piloto publicado somente para o usuário Master.  
**Regra:** cada etapa deve ser registrada com data, evidência e resultado.

## 1. Objetivo operacional

Confirmar que a sincronização incremental reduz leituras repetidas sem perda de dados, sem sobrescrita silenciosa e sem interrupção da aplicação.

## 2. Ordem segura de execução

### Etapa A — registrar baseline

- [ ] Abrir Google Cloud Billing do projeto `roteiroelismar`.
- [ ] Registrar leituras, gravações, exclusões, armazenamento e erros do período anterior.
- [ ] Registrar o horário exato do início da observação.
- [ ] Não alterar o plano de faturamento durante a medição.

**Saída obrigatória:** captura ou exportação dos números do Billing/Firestore.

### Etapa B — validar o piloto

- [ ] Abrir a aplicação com o usuário Master.
- [ ] Fechar e reabrir a aplicação sem alterar dados.
- [ ] Confirmar que a lista continua correta.
- [ ] Criar/editar/excluir um registro de teste aprovado.
- [ ] Confirmar que a alteração aparece após nova sincronização.
- [ ] Repetir em dois dispositivos ou sessões independentes.

**Critério de parada:** qualquer perda, duplicação, erro de permissão ou sobrescrita inesperada bloqueia a expansão.

### Etapa C — testar offline e concorrência

- [ ] Desconectar a rede.
- [ ] Criar ou editar um registro.
- [ ] Fechar e reabrir a aplicação.
- [ ] Reconectar a rede e confirmar o processamento da fila.
- [ ] Alterar o mesmo registro em duas sessões.
- [ ] Registrar o resultado do conflito.

**Estado atual:** a detecção por `baseRevision` foi implementada no fluxo incremental e testada no Emulator; ainda falta validar a experiência em dois dispositivos e definir a resolução operacional do conflito.

### Etapa D — validar segurança

- [ ] Confirmar acesso do usuário autorizado.
- [ ] Testar usuário não autorizado no Emulator.
- [ ] Testar tentativa de leitura de dados de outro usuário.
- [ ] Validar criação, alteração e exclusão com campos inválidos.
- [ ] Revisar regras implantadas contra `firestore.rules`.
- [ ] Confirmar/publicar `firestore.rules` e `firestore.indexes.json` separadamente do Hosting.

### Etapa E — decidir expansão

Ampliar o piloto somente se todos os itens abaixo forem verdadeiros:

- [ ] Nenhuma divergência entre dados locais e remotos.
- [ ] Nenhuma perda ou duplicação no teste offline/online.
- [ ] Conflitos detectados e tratados sem sobrescrita silenciosa.
- [ ] Métricas de leitura demonstram redução ou, no mínimo, não demonstram regressão.
- [ ] Custos e alertas do Billing foram registrados.
- [ ] Rollback foi testado ou comprovadamente executável.

### Etapa F — ativação gradual

- [ ] Ampliar a allowlist para um pequeno grupo controlado.
- [ ] Observar erros e consumo.
- [ ] Ampliar novamente somente após a janela de observação.
- [ ] Manter o fallback completo durante todo o período de estabilização.
- [ ] Registrar aprovação final antes de remover o fallback.

## 3. Critérios de aceite final

- A abertura normal não baixa coleções inteiras quando não existem alterações.
- Alterações remotas chegam por cursor e paginação.
- Exclusões são representadas por tombstones antes da limpeza futura.
- O retry da fila é idempotente.
- Conflitos não são sobrescritos silenciosamente.
- Regras rejeitam usuários e documentos não autorizados.
- `npm run lint`, `npm run build`, `npm run test:rules`, `npm run test:backup` e `npm run test:backup-emulator` passam.
- O Billing possui baseline, comparação e alerta documentados.
- O fallback pode ser reativado sem apagar dados.

## 4. Matriz de riscos

| Risco | Nível | Tratamento |
|---|---|---|
| Leitura incremental divergente | Alto | Comparar com backup e fluxo completo antes da expansão |
| Conflito entre dispositivos | Alto | Implementar `baseRevision` e teste concorrente |
| Erro de regra Firestore | Alto | Testar Emulator e publicar somente após aprovação |
| Custo não medido | Alto | Registrar Billing antes/depois |
| Fila offline duplicada | Médio | Retry idempotente e teste de reprocessamento |
| Chunk grande no build | Baixo | Otimizar após estabilizar a sincronização |
| Vulnerabilidades npm | Médio | Atualizar dependências individualmente e retestar |

## 5. Rollback de produção

1. Remover a ativação incremental/allowlist do build.
2. Rodar lint e build.
3. Publicar no Hosting.
4. Reabrir a aplicação e verificar o fluxo completo.
5. Não apagar `_sync`, tombstones ou documentos remotamente.
6. Preservar o backup e o checkpoint já registrados no relatório técnico.

## 6. Evidências já disponíveis

- Backup protegido validado com contagens por coleção.
- Checkpoint reversível em `outputs/checkpoint-reversivel-20260823_021136.zip`.
- Backfill concluído para 662 documentos.
- Piloto publicado e validado com 122 clientes carregados.
- Correção de conflito por `baseRevision` publicada no piloto restrito, com smoke test pós-deploy aprovado.
- Testes automatizados de regras e restauração aprovados.
- Teste incremental no Emulator aprovado: 3/3, incluindo cursor com timestamps iguais, tombstone e bloqueio de sobrescrita por conflito.
- Auth Emulator aprovado: cadastro, login, senha inválida, troca de senha e novo login.
- PWA estático aprovado: manifest, ícones, instalação standalone e service worker.
- Bundle aprovado sem chave privada, segredo conhecido ou senha legada.
- Smoke test publicado aprovado em desktop e celular, com 0 erros/avisos de console.
- Smoke test autenticado aprovado: nuvem conectada, 122 clientes carregados e recarga sem erros.
- Login real na interface publicada confirmado; logout e reautenticação continuam pendentes.
- Formulário de credenciais verificado sem submissão; reautenticação real ainda depende da ação do usuário com sua senha.

## 7. Decisão atual

**Prosseguir apenas com testes e observação do piloto.** A ativação ampla e a declaração de custo zero ficam condicionadas às métricas do Billing e aos testes de concorrência.
