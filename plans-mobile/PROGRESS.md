# Progresso dos planos mobile

Atualizado em 18/08/2026. Este registro consolida o estado dos planos existentes em `plans-mobile` e a execução das Entregas ADMIN e COMERCIAL. As alterações desta execução estão restritas ao aplicativo `artifacts/mobile`; nenhum commit foi criado no projeto web.

## Agente selecionado

- **Principal:** Frontend Engineer — rotas Expo, telas, formulários, estados e integração com a API.
- **Validação complementar:** QA Engineer — ownership, permissões, regressão por perfil e critérios de aceite.
- **Referências aplicadas:** `docs-mobile/README.md`, `.agents/README.md`, `agent-frontend-engineer.md` e `agent-qa-engineer.md`.

## Resumo por plano

| Plano | Escopo | Estado atual | Validação / pendência |
|---|---|---|---|
| 001 | Login, autenticação, proposta inicial e administração básica | Implementado parcialmente | Typecheck; QA manual iOS/Android, recovery E2E e alguns endpoints permanecem pendentes |
| 002 | Paridade funcional ampla e adaptação nativa | Implementado em código | Testes/typecheck/build aprovados; integração API com banco de teste e dispositivos reais pendentes |
| 003 | Paridade app mobile vs web | Implementado e validado em código | Testes, typecheck e export aprovados; CRUDs avançados, Sentry/EAS e QA físico pendentes |
| 004 | Board, editor e PDF | Implementado | Testes e typecheck aprovados; validação visual nativa permanece recomendada |
| 005 | Fluxo total de propostas, filtros, versões e Leads | Implementado | Testes e typecheck aprovados; homologação integrada permanece pendente |
| 006 | Reestruturação visual | Implementado parcialmente | Typecheck/testes aprovados; validação visual e checkpoint de commit pendentes |
| 007 | Recuperação de senha por Resend | Implementado em código | 8 suítes/31 testes e typecheck aprovados; deep link e envio real pendentes |
| 008 | Rebrand Mosaico | Parcial | Assets, logo, tabs e CTA aplicados; tema/telas públicas/PDF/documentação e QA visual pendentes |
| 009 | PDF A4 com paridade web | Implementado em código | 20 suítes/65 testes e typecheck aprovados; PDF real iOS/Android e comparação visual pendentes |
| 010 | Navegação nativa iOS/UIScene | Planejado | Nenhuma alteração funcional/nativa executada; depende do Gate B0/toolchain |
| 011 | Paridade integral ADMIN dos planos 033/034 | Implementado no app | 31 suítes/78 testes, typecheck e export iOS/Android aprovados; QA de dispositivo/API integrada pendente |
| 012 | Paridade integral COMERCIAL dos planos 033/034 | Implementado no app | 39 suítes/91 testes, typecheck e export iOS/Android aprovados; QA com dois vendedores/dispositivos pendente |
| 013 | Board de Propostas em Kanban contextual Empresa/Programa | Implementado + extensão de interação/navegação | Tasks 1–9, correções de busca/layout, drag-and-drop, filtros de avisos, setas nativas, blur do menu e remoção de Modelos concluídos; suíte completa, typecheck, diff check e export local aprovados; QA físico/API local pendente |

## Detalhamento da Entrega 1 — ADMIN (plano 011)

- Contratos Zod, erros estruturados, fixtures e query keys de paridade.
- Confirmação destrutiva por nome exato, com bloqueio durante processamento e anúncio acessível.
- Empresas com `usesPrograms`, desativação/reativação, impacto de exclusão e exclusão permanente.
- Catálogo condicionado a Empresa sem Programas.
- Board ADMIN por Empresa, com filtros, contagens, investimento e deduplicação.
- Autosave serializado com allowlist e `flush()` para PDF, status, duplicação e navegação.
- Rejeição separada de exclusão permanente de propostas.
- Perfil de usuários com cargo, telefone, e-mail comercial e avatar.
- Contratos ADMIN com lista global, filtro por responsável, resumo, forecast, criação, edição e cancelamento.
- PDF protegido contra conteúdo longo, contadores do editor institucional e retorno da marca ao Dashboard.

## Detalhamento da Entrega 2 — COMERCIAL (plano 012)

- Navegação com Propostas, Clientes, Produtos, Contratos e Mais.
- Redirects compatíveis para Leads, Avisos e Perfil.
- Ownership explícito (`ownerId`, `owner`, `viewerCanEdit`) e mensagens neutras para recursos fora da carteira.
- Conversão Lead → Cliente no mesmo registro, sem cópia do anunciante.
- Desativação lógica com confirmação digitada e segunda confirmação somente quando a API exige.
- Catálogo de produtos read-only, filtrado pelo retorno autorizado da API e condicionado a `usesPrograms`.
- Editor COMERCIAL com quantidade de 1 a 9999, valor unitário, subtotal, total e diferença em centavos.
- Apresentação institucional não editável e andamento mantido no board.
- Exclusão permanente visível somente para ADMIN ou proprietário editável; autorização permanece no backend.
- Meus Contratos sem filtro de responsável, com resumo, forecast, criação, edição e cancelamento preservando histórico.

## Entrega do plano 013 — Tasks 1–9

- Modelo puro de sete etapas, deduplicação por `proposal.id`, `sem-programa`, filtros locais e validação de datas.
- Query keys, adapter de Empresas acessíveis e hook contextual com filtros Empresa/Programa.
- Toolbar compacta com apenas Empresa/Programa, seletor pesquisável e densidade.
- Busca em overlay, filtros avançados por perfil e chips removíveis.
- Card confortável/compacto e coluna virtualizada com `viewerCanEdit`.
- Modos focused/overview com largura responsiva, snap, indicadores e rolagem livre.
- Integração única na `ProposalBoardScreen`, estados explícitos, movimentação e CTA condicionado por Empresa.
- Remoção das visões antigas `ProposalStationBoardView`, `ProposalProgramBoardView`, `ProposalListView`, `StationSelector` e `ProposalStagePager`.

## Validações executadas nesta execução

```text
pnpm --filter @workspace/mobile test
47 suítes aprovadas, 123 testes aprovados, 0 snapshots

Board plano 013:
10 suítes do board aprovadas, 34 testes aprovados, 0 snapshots

pnpm --filter @workspace/mobile run typecheck
aprovado

git diff --check
aprovado

EXPO_PUBLIC_API_URL=http://localhost:8081/api pnpm --filter @workspace/mobile exec expo export --platform ios --platform android --output-dir /tmp/gtf-propostas-board-013-local
export iOS/Android aprovado em `/tmp/gtf-propostas-board-013-local`

curl http://localhost:8081/api/healthz
API Docker local respondeu `{"status":"ok"}`; login ADMIN e COMERCIAL validados contra o PostgreSQL local.
```

## Exportação da Entrega 2

`EXPO_PUBLIC_API_URL=https://propostasmosaico-one.vercel.app/api pnpm --filter @workspace/mobile exec expo export --platform ios --platform android --output-dir /tmp/gtf-propostas-commercial-parity-final` foi executado com sucesso.

## Próximos gates do plano 013

1. Validar no simulador iOS/Android com API Docker local em `http://localhost:8081/api`.
2. Validar com dois usuários COMERCIAL e um ADMIN, incluindo acesso direto por ID.
3. Testar rede lenta, offline, refresh rejeitado, retorno do background e texto ampliado.
4. Registrar evidências de focused/overview, Empresa sem Programas e `sem-programa`.

## Correções Tarefa 013 — busca e alinhamento do Kanban

- O modal de busca agora apresenta cards reais, com abertura por toque e localização explícita (`Empresa: ... · Programa: ...`).
- A busca textual é aplicada localmente sobre Empresa, Programa, cliente, tipo, responsável e produtos, evitando que o filtro do endpoint descarte correspondências de contexto.
- O modo focado usa páginas alinhadas à viewport, com snap e cálculo de índice baseados na largura da página e margens seguras.
- Cada etapa está encapsulada em um card visual de altura mínima, que contém cabeçalho, badge de quantidade e lista de propostas.
- Foram adicionados testes de modelo, overlay, coluna e Kanban focado; o gate direcionado passou com 4 suítes e 21 testes, incorporado à suíte do board com 10 suítes e 34 testes.
- Export final da correção para iOS/Android com API local aprovado em `/tmp/gtf-propostas-board-013-safe-area-final`.
- Pendência: validar visualmente no simulador iOS/Android usando `http://localhost:8081/api`.

### Correção adicional — área segura e estado vazio

- O overlay de busca agora aplica o `top inset`/`bottom inset` via `useSafeAreaInsets`, evitando que o campo fique atrás da Dynamic Island e preservando espaço durante o teclado.
- O estado vazio das etapas não exibe mais os textos `Sem propostas` e `Nenhuma proposta nesta etapa.`.
- O overlay de busca mantém resultados em cards com a localização Empresa/Programa; toque longo agora permite arraste horizontal para outra etapa, respeitando `viewerCanEdit`.

## Extensão aprovada — interação e navegação transversal

- Arraste de proposta por toque longo com limiar horizontal, drop na etapa alvo e fallback acessível “Mover etapa”.
- `NativeBackButton` com SF Symbol no iOS e seta Android, aplicado às telas de detalhe, edição, criação, perfil e menu administrativo; o `UIButton` legado foi normalizado.
- Filtros de Avisos ADMIN/COMERCIAL reorganizados em barra compacta + bottom sheet por texto, status e marco de recaptura.
- `Modelos de Proposta` removido do menu ADMIN e da árvore de rotas mobile.
- Faixa fixa com blur no topo do menu para impedir sobreposição do conteúdo com status bar/Dynamic Island.

### Validação desta extensão

```text
50 suítes / 130 testes aprovados
typecheck aprovado
git diff --check aprovado
Expo export iOS local aprovado em /tmp/gtf-propostas-task-current
```
- Os testes de overlay e coluna foram atualizados para cobrir esses comportamentos.
