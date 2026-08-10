# Plan Mobile 004 — Correção de Propostas: Board, Visualização e PDF

> Plano focado em corrigir e melhorar o módulo de **Propostas** do app mobile: listagem (board/list), visualização de detalhe, e geração de PDF — alinhando com a qualidade do sistema web.

---

## 1. Contexto

Após a implementação do Plano 003 (paridade funcional), foram identificados problemas de **qualidade, performance e fidelidade** nas telas de propostas do app mobile:

1. **Board/List de propostas** não funciona adequadamente (performance, usabilidade)
2. **Visualização da proposta** (detalhe/editor) com problemas de UX
3. **PDF gerado** com qualidade inferior ao do sistema web

Este plano é resultado da análise profunda de todo o código mobile e comparação direta com a implementação web.

---

## 2. Problemas Identificados

### 2.1 Board / Listagem de Propostas 🔴

| # | Problema | Severidade | Arquivo |
|---|---|---|---|
| **P1** | **FlatList com `scrollEnabled={false}` dentro de ScrollView** — destrói a virtualização. React Native renderiza TODOS os cards de uma vez, sem recycling. Com muitas propostas, a tela congela. | **Crítico** | `src/features/proposals/board/ProposalStagePager.tsx` linha 49 |
| **P2** | **Busca sem debounce** — cada keystroke no campo de busca dispara uma nova requisição para a API, causando flood de requests. | **Alto** | `src/features/proposals/board/ProposalBoardScreen.tsx` linha 23 |
| **P3** | **MoveProposalSheet limitado** — apenas 4 etapas disponíveis para mover (`IN_CONVERSATION` a `NEGOTIATION`), faltam `APPROVED` e `REJECTED` | **Médio** | `src/features/proposals/board/MoveProposalSheet.tsx` linhas 7-12 |
| **P4** | **Falta de modo Lista** — no web existe tanto o board kanban quanto uma lista. O mobile só tem o kanban horizontal, que não é ideal para visualização rápida | **Médio** | — |
| **P5** | **new.tsx: Seletor de clientes sem virtualização** — usa `.map()` dentro de ScrollView para listar TODOS os clientes/leads. Vai travar com muitos registros | **Alto** | `app/proposal/new.tsx` |

---

### 2.2 Detalhe / Editor da Proposta 🟠

| # | Problema | Severidade | Arquivo |
|---|---|---|---|
| **P6** | **Autosave com race condition** — se a rede está lenta e o usuário edita rápido, o `pendingSave.current` pode mesclar payloads de forma inconsistente. Background refetch pode sobrescrever edições do usuário | **Alto** | `app/proposal/[id].tsx` linhas 179-202 |
| **P7** | **Datas sem DatePicker** — o usuário digita datas no formato `AAAA-MM-DD` manualmente em TextInput, sem máscara ou validação. Pode enviar datas inválidas para a API | **Alto** | `app/proposal/[id].tsx` linhas 411-428 |
| **P8** | **Falta de tela Preview** — no web existe um `ProposalPreview` que mostra como a proposta vai ficar no PDF. No mobile não existe essa visualização prévia, o usuário só vê o resultado após gerar o PDF | **Médio** | — |
| **P9** | **Campos faltantes no editor** — o web permite editar `investDesc` (descrição do investimento), `contactName`, `contactRole`, `contactPhone` separadamente. O mobile não tem esses campos | **Médio** | `app/proposal/[id].tsx` linhas 357-389 |
| **P10** | **Falta edição de Apresentação/Stats** — os `stats` (estatísticas de apresentação como audiência, alcance) aparecem no PDF mas não são editáveis na tela do mobile | **Médio** | — |

---

### 2.3 Geração de PDF 🔴

| # | Problema | Severidade | Arquivo |
|---|---|---|---|
| **P11** | **Paginação fixa (chunk de 4)** — o mobile divide produtos em blocos fixos de 4 por página. No web, a paginação é dinâmica baseada na medição real das alturas. Produtos com descrições longas podem cortar/sobrepor | **Crítico** | `src/features/proposals/print/proposalPrintHtml.ts` linhas 15-16 |
| **P12** | **Não suporta `bannerBase64`** — o web renderiza uma imagem de banner no hero com overlay. O mobile ignora completamente | **Médio** | `src/features/proposals/print/proposalPrintHtml.ts` linha 47 |
| **P13** | **Cor do produto ignorada** — cada produto tem um campo `color` (BLUE, YELLOW, RED, GREEN, DARK) que define a borda lateral no web. O mobile usa sempre a `primaryColor` da empresa | **Médio** | `src/features/proposals/print/proposalPrintHtml.ts` linha 69 |
| **P14** | **Campo `detail` não renderizado** — os produtos podem ter um campo `detail` adicional que é exibido no web mas ignorado no mobile | **Baixo** | `src/features/proposals/print/proposalPrintHtml.ts` linhas 27-35 |
| **P15** | **`investDesc` não renderizado** — o web mostra o texto descritivo do investimento junto ao valor. O mobile mostra apenas `INVESTIMENTO` + valor | **Médio** | `src/features/proposals/print/proposalPrintHtml.ts` linha 52 |
| **P16** | **Contato misturado** — o mobile usa `createdBy.name` / `createdBy.jobTitle` como fallback para `contactName` / `contactRole`, mas no web esses são campos independentes e editáveis | **Médio** | `src/features/proposals/print/proposalPrintHtml.ts` linha 53 |

---

## 3. Comparação Direta — PDF Web vs PDF Mobile

| Aspecto | Web (correto) | Mobile (atual) | Gap |
|---|---|---|---|
| **Paginação** | Dinâmica baseada na medição DOM | Chunk fixo de 4 produtos | 🔴 |
| **Hero com banner** | `bannerBase64` + overlay ajustável | Apenas cor sólida | 🔴 |
| **Cor dos produtos** | Borda lateral por `product.color` | Sempre `primaryColor` | 🟠 |
| **Campo `detail`** | Renderizado abaixo da descrição | Ignorado | 🟡 |
| **Investimento** | `investDesc` (texto) + `investValue` (número) | Apenas `investValue` | 🟠 |
| **Dados de contato** | `contactName` + `contactRole` + `contactPhone` | Fallback para `createdBy.*` | 🟠 |
| **Stats/Apresentação** | Grid 2x2 com `num` + `suf` + `desc` | Mesmo (✅) | — |
| **Logo da empresa** | `logoBase64` | Mesmo (✅) | — |
| **Tags de produto** | Badge preta com tag | Mesmo (✅) | — |
| **Slogan da empresa** | Exibido no header | Mesmo (✅) | — |

---

## 4. Plano de Implementação

### Sprint 1 — Corrigir Board/List (Performance Crítica) 🔴
**Duração estimada:** 1 semana | **Impacto:** Muito Alto

| # | Tarefa | Arquivo(s) | Detalhe |
|---|---|---|---|
| 1.1 | **Refatorar ProposalStagePager** — trocar `FlatList scrollEnabled={false}` por renderização direta com height constraints, ou usar `SectionList` | `src/features/proposals/board/ProposalStagePager.tsx` | Cada coluna do kanban deve ter scroll independente, e a paginação horizontal deve usar `snapToInterval` para fluidez |
| 1.2 | **Adicionar debounce na busca** — usar `useDeferredValue` ou timeout de 400ms no campo de search | `src/features/proposals/board/ProposalBoardScreen.tsx` | Previne flood de requests a cada keystroke |
| 1.3 | **Adicionar modo Lista** — criar um toggle "Board / Lista" no header que alterne entre o kanban e uma FlatList simples com cards | `src/features/proposals/board/ProposalBoardScreen.tsx` | Novo componente `ProposalListView.tsx` com FlatList virtualizada |
| 1.4 | **Completar MoveProposalSheet** — adicionar `APPROVED` e `REJECTED` como opções, com confirmação especial para essas ações finais | `src/features/proposals/board/MoveProposalSheet.tsx` | Manter estilo do `ConfirmDialog` para ações destrutivas |
| 1.5 | **Virtualizar seletor de clientes em new.tsx** — substituir `.map()` por `FlatList` com busca e paginação | `app/proposal/new.tsx` | Adicionar TextInput de busca com filtro local + infinite scroll |

**Agentes:** `agent-react-native-expo-engineer`, `agent-mobile-ux-ui-designer`

---

### Sprint 2 — Corrigir Editor / Detalhe da Proposta 🟠
**Duração estimada:** 1.5 semanas | **Impacto:** Alto

| # | Tarefa | Arquivo(s) | Detalhe |
|---|---|---|---|
| 2.1 | **Corrigir autosave** — implementar debounce robusto com `AbortController` para cancelar requests anteriores, desabilitar refetch enquanto houver edição pendente | `app/proposal/[id].tsx` | Usar `queryClient.cancelQueries` antes de setar dados; adicionar `refetchOnWindowFocus: false` à query |
| 2.2 | **Adicionar DatePicker nativo** — substituir TextInput de datas por `@react-native-community/datetimepicker` ou modal com calendário | `app/proposal/[id].tsx` | Formatar valor exibido como `DD/MM/AAAA` (padrão BR) |
| 2.3 | **Adicionar campos faltantes** — `investDesc`, `contactName`, `contactRole`, `contactPhone` na etapa "Investimento" e "Revisão" | `app/proposal/[id].tsx` | Autosave com debounce (igual aos campos existentes) |
| 2.4 | **Criar tela/section de Preview** — nova etapa ou modal mostrando a proposta como será renderizada no PDF (simulação do `ProposalPreview` do web) | Novo: `src/features/proposals/preview/ProposalPreviewScreen.tsx` | Pode ser renderizado como WebView com o HTML do PDF + zoom/scroll |
| 2.5 | **Permitir editar Stats/Apresentação** — ligar os itens de apresentação da emissora como editáveis no contexto da proposta | `app/proposal/[id].tsx` | Carregar `stats[]` editáveis dentro da etapa "Contexto" |
| 2.6 | **Adicionar campo `color` por produto** — no `ProposalProductForm`, adicionar seletor de cor (BLUE, YELLOW, RED, GREEN, DARK) | `src/features/proposals/products/ProposalProductForm.tsx` | Usar chips/badges coloridos para seleção |

**Agentes:** `agent-react-native-expo-engineer`, `agent-mobile-ux-ui-designer`, `agent-mobile-api-integration-engineer`

---

### Sprint 3 — Corrigir PDF / Print 🔴
**Duração estimada:** 1.5 semanas | **Impacto:** Muito Alto

| # | Tarefa | Arquivo(s) | Detalhe |
|---|---|---|---|
| 3.1 | **Refatorar paginação do PDF** — trocar chunk fixo de 4 por paginação dinâmica. Estimar alturas baseado no conteúdo: produtos com descrições longas precisam de mais espaço. Usar heurística: `base_height + (description_lines * line_height)` | `src/features/proposals/print/proposalPrintHtml.ts` | Medir pela contagem de caracteres/linhas da descrição. Considerar `max-height` do CSS como fallback para overflow |
| 3.2 | **Adicionar suporte a `bannerBase64`** — se existe, renderizar como background-image no hero com overlay escuro configurável (`overlayOpacity`) | `src/features/proposals/print/proposalPrintHtml.ts` | Usar `background-image: url(${bannerBase64})` com `background-size: cover` e div overlay |
| 3.3 | **Renderizar cor por produto** — mapear `product.color` para cores CSS (BLUE→#427EFF, YELLOW→#F59E0B, RED→#EF4444, GREEN→#22C55E, DARK→#1E293B) e aplicar como `border-left-color` | `src/features/proposals/print/proposalPrintHtml.ts` | Substituir hardcoded `${escape(primary)}` por mapa de cores |
| 3.4 | **Renderizar campo `detail`** — adicionar `product.detail` abaixo da descrição, se existir | `src/features/proposals/print/proposalPrintHtml.ts` | Estilo menor, cor `#444`, separado da description |
| 3.5 | **Renderizar `investDesc`** — adicionar o texto descritivo do investimento acima ou ao lado do valor | `src/features/proposals/print/proposalPrintHtml.ts` | `<span>` com texto + `<strong>` com valor, como no web |
| 3.6 | **Corrigir dados de contato** — usar `contactName`, `contactRole`, `contactPhone` como campos primários, com fallback para `createdBy.*` | `src/features/proposals/print/proposalPrintHtml.ts` | Prioridade: `contactName > createdBy.name` |

**Agentes:** `agent-react-native-expo-engineer`, `agent-mobile-ux-ui-designer`

---

### Sprint 4 — Testes e Validação 🔵
**Duração estimada:** 1 semana | **Impacto:** Alto

| # | Tarefa | Detalhe |
|---|---|---|
| 4.1 | **Testar board com volume** — criar/carregar 50+ propostas e verificar performance do kanban refatorado |
| 4.2 | **Testar PDF com propostas variadas** — gerar PDFs com 1 produto, 4 produtos, 8 produtos, 15+ produtos e com descrições longas |
| 4.3 | **Testar PDF com banner** — criar proposta com `bannerBase64` e verificar renderização |
| 4.4 | **Testar autosave** — editar campos rápido com rede lenta (throttle no simulador) e verificar consistência |
| 4.5 | **Testar new.tsx com muitos clientes** — verificar performance do seletor virtualizado |
| 4.6 | **Comparar PDF mobile vs PDF web** — gerar o mesmo PDF em ambas as plataformas e comparar visualmente |
| 4.7 | **Testar no simulador iOS e Android** — validar nos dois ambientes |
| 4.8 | **Typecheck e testes unitários** |

**Agentes:** `agent-mobile-qa-engineer`

```bash
# Validação obrigatória
pnpm --filter @workspace/mobile run typecheck
pnpm --filter @workspace/mobile test
```

---

## 5. Open Questions

> **Perguntas que impactam a implementação:**
>
> 1. **Preview da proposta:** Deve ser uma 6ª etapa no stepper ("Preview") ou um botão que abre um modal/WebView separado?
>
> 2. **Stats/Apresentação editáveis:** Os stats no mobile devem puxar automaticamente os itens de apresentação da emissora (padrão) e permitir customização por proposta, ou devem ser um campo fixo da proposta?
>
> 3. **DatePicker:** Usar o nativo do sistema (`@react-native-community/datetimepicker`) ou um calendário inline customizado?
>
> 4. **Modo Lista vs Board:** O modo padrão deve ser lista (mais rápido para encontrar propostas) ou board (como está hoje)?

---

## 6. Dependências

| Pacote | Uso | Sprint |
|---|---|---|
| `@react-native-community/datetimepicker` | DatePicker nativo para datas | Sprint 2 |
| Nenhum adicional para PDF | O `expo-print` já suporta HTML avançado | — |
| Nenhum adicional para debounce | Usar `useDeferredValue` nativo do React 19 ou setTimeout | — |

---

## 7. Resumo

**Total estimado:** ~5 semanas
- **16 problemas** identificados e documentados
- **~20 arquivos** a criar/modificar
- **3 componentes novos** (ProposalListView, ProposalPreviewScreen, DatePicker wrapper)
- **1 refatoração major** (proposalPrintHtml.ts)

---

## 8. Checklist de Implementação — 07/08/2026

### Sprint 1 — Board e Lista
- [x] Refatorado `ProposalStagePager` para usar `FlatList` horizontal paginada e `FlatList` vertical por etapa, sem `scrollEnabled={false}` dentro de `ScrollView`.
- [x] Adicionado pull-to-refresh direto nas colunas do board.
- [x] Adicionado modo `Board / Lista` em `ProposalBoardScreen`.
- [x] Criado `ProposalListView.tsx` para listar propostas em visão vertical.
- [x] Busca passou a usar `useDeferredValue`, reduzindo chamadas repetidas durante digitação.
- [x] `MoveProposalSheet` agora inclui `Aprovada` e `Rejeitada`, com confirmação para ações finais.
- [x] Seletor de cliente/lead em `proposal/new.tsx` ganhou busca e lista virtualizada.
- [x] **Corrigido erro "Erro ao carregar" ao filtrar por Rascunho/Rejeitadas (`proposalProgressBoardSchema`)**: Adicionado `.passthrough()` nos esquemas Zod (`progressBoardProposalSchema`, `proposalProgressBoardSchema`), permitindo campos adicionais retidos da API como `advertiserStatus`, `stationId`, `primaryColor`, `timeline`, `proposalCount`, `slug`, etc., sem disparar exceção de parse Zod.
- [x] **Corrigido aviso/erro `VirtualizedLists should never be nested inside plain ScrollViews` em `app/proposal/new.tsx`**: O layout foi reestruturado de `<ScrollView>` contendo `<FlatList>` interna para uma única `<FlatList>` principal com `ListHeaderComponent` (Empresa e filtro de Cliente) e `ListFooterComponent` (Tipo de proposta, Periodicidade e Botão de Criar).

### Sprint 2 — Editor
- [x] Autosave ajustado com `cancelQueries` antes do PATCH e proteção por geração para evitar resposta antiga sobrescrever estado mais novo.
- [x] Refetch automático ao focar janela desativado no detalhe da proposta para reduzir conflito com edição.
- [x] Datas do período passaram a usar máscara `DD/MM/AAAA` e validação simples sem adicionar dependência nova.
- [x] Campos `investDesc`, `contactName`, `contactRole`, `contactPhone` adicionados na etapa de investimento.
- [x] Itens de Apresentação/Stats editáveis no contexto da proposta, com limite de 4 itens.
- [x] Adicionada prévia resumida da proposta na etapa de revisão.
- [x] `ProposalProductForm` ganhou campo `detail` e seletor de cor do card.

### Sprint 3 — PDF / Print
- [x] `proposalPrintHtml.ts` deixou de usar chunk fixo simples e passou a paginar produtos por orçamento estimado de altura.
- [x] Primeira página calibrada para manter o padrão visual de até 4 produtos com hero/investimento/rodapé.
- [x] Hero do PDF renderiza `bannerBase64` com `overlayOpacity` quando disponível.
- [x] Cards do PDF usam cor por produto (`BLUE`, `YELLOW`, `RED`, `GREEN`, `DARK`).
- [x] PDF renderiza `detail`, metadados comerciais, `investDesc` e contato primário da proposta com fallback para `createdBy`.

### Decisões Técnicas
- [x] `@react-native-community/datetimepicker` não foi adicionado nesta etapa para evitar nova dependência. Foi implementada máscara/validação em texto, compatível com Expo Go.
- [x] A prévia foi implementada como section nativa resumida no editor, não como WebView, para manter o app leve e sem dependência extra.

### Validação
- [x] `pnpm --filter @workspace/mobile run typecheck` (Sucesso)
- [x] `pnpm --filter @workspace/mobile test` (11 testes rodando com sucesso)

