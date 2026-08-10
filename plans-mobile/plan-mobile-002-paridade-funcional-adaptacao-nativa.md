# Plano Mobile 002 - Paridade Funcional e Adaptacao Nativa do GTF Propostas

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levar ao aplicativo Expo as jornadas essenciais que existem no Sistema de Propostas web, corrigindo contratos incompletos e adaptando navegacao, formularios, andamento comercial, catalogos e administracao para uso nativo em iOS e Android.

**Architecture:** O aplicativo continua sendo exclusivamente um cliente da API oficial em `../Sistema-Propostas/artifacts/api-server`; nao tera API, Prisma ou banco proprios. A entrega sera organizada por jornadas verticais, com rotas Expo finas, modulos de dominio em `src/features`, dados remotos no TanStack Query, sessao no Zustand e tokens no SecureStore. Padroes desktop serao reinterpretados para toque: o Kanban usara pager horizontal por etapa com acao explicita de movimentacao, e o editor usara um fluxo em etapas, sem copiar paineis ou acordeoes do navegador.

**Tech Stack:** TypeScript 5.9, React 19, React Native 0.81, Expo SDK 54, Expo Router 6, TanStack Query, Zustand, Expo SecureStore, Zod, Jest Expo, React Native Testing Library, API Express compartilhada e PostgreSQL/Prisma do projeto web.

## Global Constraints

- A fonte de verdade da API e `../Sistema-Propostas/artifacts/api-server`.
- A fonte de verdade do banco e `../Sistema-Propostas/lib/db`.
- O aplicativo nunca acessa PostgreSQL diretamente e nunca executa migrations.
- A copia de API/banco dentro do repositorio mobile nao deve receber implementacoes funcionais.
- Alteracoes de endpoint devem ser feitas primeiro no projeto principal, cobertas por testes e descritas em `../Sistema-Propostas/lib/api-spec/openapi.yaml`.
- ADMIN mantem acesso global; COMERCIAL mantem acesso apenas a propostas proprias e Empresas liberadas.
- A API, e nao a interface, continua sendo a autoridade sobre permissao e redacao de campos.
- Access e refresh tokens permanecem no SecureStore nativo; dados de usuario em AsyncStorage servem apenas para restauracao visual.
- Nenhuma chave privada pode usar prefixo `EXPO_PUBLIC_`.
- A interface deve funcionar em iOS e Android, tela de 320 pontos, texto ampliado, teclado aberto, rede lenta e sessao expirada.
- Alvos de toque devem possuir no minimo 44 pontos.
- Toda lista deve implementar carregamento, vazio, erro com repeticao e pull-to-refresh.
- Toda mutacao deve desabilitar repeticao durante envio, informar resultado e invalidar somente as query keys afetadas.
- Acoes destrutivas e mudancas terminais de proposta exigem confirmacao.
- Nao copiar o Kanban desktop com drag-and-drop como unica interacao; no mobile a acao primaria sera `Mover para etapa`.
- Nao copiar o editor desktop de duas colunas; o mobile usara etapas sequenciais e resumo.
- Nao adicionar push notifications neste plano; avisos continuam sendo consultados na API e exibidos no aplicativo.
- Nao implementar modo offline de escrita; dados em cache podem ser lidos, mas mutacoes exigem confirmacao do servidor.

---

## 1. Referencias e Agentes

### Referencias obrigatorias

- `docs-mobile/README.md`
- `docs-mobile/00-api-banco-compartilhados.md`
- `docs-mobile/01-visao-geral-e-estado-atual.md`
- `docs-mobile/02-stack-e-configuracao.md`
- `docs-mobile/03-arquitetura-e-pastas.md`
- `docs-mobile/04-navegacao-perfis-e-telas.md`
- `docs-mobile/05-api-autenticacao-e-dados.md`
- `docs-mobile/06-padroes-ui-seguranca-qualidade.md`
- `docs-mobile/08-roadmap-lacunas-riscos.md`
- `agents-mobile/README.md`
- `../Sistema-Propostas/docs/README.md`
- `../Sistema-Propostas/docs/07-autenticacao-perfis-permissoes.md`
- `../Sistema-Propostas/docs/08-regras-de-negocio.md`
- `../Sistema-Propostas/docs/paginas-por-perfil.md`
- `../Sistema-Propostas/.agents/README.md`
- `../Sistema-Propostas/lib/api-spec/openapi.yaml`
- `../Sistema-Propostas/artifacts/api-server/src/routes`

### Agente principal

**Arquiteto Mobile**

Responsavel por preservar os limites entre aplicativo, API e banco; decompor as jornadas; padronizar estado remoto, navegacao e falhas; e impedir que layouts web sejam transportados mecanicamente para telas pequenas.

### Agentes de implementacao

| Agente | Responsabilidade |
|---|---|
| Product Manager Mobile | Priorizar paridade obrigatoria, regras por perfil e criterios de aceite. |
| Engenheiro React Native/Expo | Rotas, componentes, formularios, safe areas, teclado e acessibilidade. |
| Engenheiro de Integracao Mobile | Contratos, query keys, paginacao, erros, refresh e invalidacao. |
| Designer UX/UI Mobile | Adaptar Kanban, editor, catalogos e administracao para toque. |
| Engenheiro de Seguranca Mobile | Tokens, sessao, deep links, dados pessoais e compartilhamento. |
| QA Mobile | iOS, Android, perfis, rede, sessao, telas pequenas e regressao. |
| Technical Writer Mobile | Atualizar inventario de telas, contratos, execucao e checklist. |

### Agentes compartilhados do sistema principal

| Agente | Quando participa |
|---|---|
| Backend API Engineer | Atualizar OpenAPI, corrigir contrato ou criar endpoint realmente ausente. |
| Security Engineer | Revisar autorizacao e redacao de propostas vinculadas. |
| QA Engineer | Validar que mudancas compartilhadas nao quebram o sistema web. |

---

## 2. Baseline Verificado

Em 27/07/2026 foi executado:

```bash
pnpm --filter @workspace/mobile run typecheck
```

Resultado: aprovado sem erros.

O repositorio mobile estava limpo no inicio deste planejamento. O aplicativo possui uma base funcional e nao deve ser reescrito do zero.

---

## 3. Mapeamento Atual: Web x Mobile

Legenda:

- **Paridade:** fluxo essencial ja existe no mobile.
- **Parcial:** existe, mas nao cobre a regra ou experiencia atual do web.
- **Ausente:** nao ha tela ou operacao equivalente.
- **Adaptar:** existe no web, mas exige uma interacao propria para celular.

### 3.1 Acesso, sessao e perfil

| Funcionalidade web/API | Estado mobile | Contraponto e acao |
|---|---|---|
| Login por perfil | Paridade | Usa `/auth/mobile/login` e redireciona ADMIN/COMERCIAL. Manter. |
| Refresh single-flight | Paridade | `src/api/client.ts` repete a chamada uma vez. Adicionar teste de concorrencia e expiracao. |
| Logout com revogacao | Paridade | Usa `/auth/mobile/logout`. Manter e limpar cache remoto do usuario. |
| Cadastro comercial | Paridade funcional | Validar mensagens de conta pendente e rate limit. |
| Esqueci/redefinir senha | Parcial | Telas existem; validar deep link `gtfpropostas://reset-password`, token ausente/expirado e retorno ao login. |
| Meu Perfil | Paridade funcional | Edita os campos comerciais. Falta revisar avatar, falha de upload e acessibilidade. |
| Guards de rota por perfil | Parcial | O redirecionamento inicial existe, mas rotas profundas precisam de guard central. |

### 3.2 Propostas e andamento comercial

| Funcionalidade web/API | Estado mobile | Contraponto e acao |
|---|---|---|
| Lista por status e busca | Paridade basica | Mobile usa `GET /proposals`; falta paginacao incremental e filtros por Empresa/Programa. |
| Board por programa | Ausente | Web usa `GET /proposals/progress-board`. Criar pager por etapa e filtro de Programa. |
| Kanban por etapa | Ausente | Adaptar para colunas com snap horizontal; mover por bottom sheet, sem depender de drag. |
| Criacao inicial | Parcial | Seleciona Empresa/Tipo e cria rascunho; falta cliente/Lead contextual e resumo antes de criar. |
| Cliente/Lead da proposta | Parcial | Detalhe edita texto legado; deve selecionar `advertiserId` real ou criar Lead. |
| Empresa e tipo | Parcial | Criacao respeita Empresas permitidas; detalhe nao oferece fluxo completo de troca/validacao. |
| Periodo e ocultacao | Ausente | Implementar datas e `showPeriod`; nao reintroduzir `periodDesc`. |
| Apresentacao padrao | Ausente | Exibir snapshot somente leitura retornado pela proposta. |
| Produtos do catalogo | Ausente para edicao | Hoje apenas lista os produtos salvos. Implementar selecionar, editar metadados e remover. |
| Produto avulso | Ausente | Implementar criacao dentro da proposta sem gravar no catalogo. |
| Duracao, horario e sazonalidade | Ausente | Incluir por item conforme contrato oficial. |
| Sugestao de investimento | Ausente | Calcular localmente a partir do valor sugerido e quantidade. |
| Investimento manual | Parcial | Campo existe; precisa mascara monetaria e acao `Usar sugestao`. |
| Andamento | Parcial | Le timeline, mas registra apenas `IN_CONVERSATION`. Expor quatro etapas intermediarias. |
| Aceitar/rejeitar | Paridade basica | Ja usa status e confirmacao; preservar promocao Lead -> Cliente e avisos. |
| Duplicar proposta | Ausente | Consumir `POST /proposals/:id/duplicate`. |
| Preview da proposta | Ausente | Criar preview vertical nativo de leitura, sem tentar reproduzir A4 no editor. |
| PDF e compartilhamento | Ausente | Gerar documento com Expo Print e compartilhar com Expo Sharing. |
| Historico de versoes | Ausente | Fora da navegacao principal; manter como backlog posterior ao PDF. |

### 3.3 Clientes, Leads e captacao

| Funcionalidade web/API | Estado mobile | Contraponto e acao |
|---|---|---|
| Listar Clientes | Paridade basica | Busca e detalhe existem. Adicionar propostas vinculadas. |
| Listar Leads | Paridade basica | Busca e cadastro existem. Adicionar origem e filtros. |
| Origem do Lead | Ausente | API oficial ja possui `leadSourceId`; tornar obrigatoria ao criar Lead. |
| Metricas de origem | Ausente | ADMIN deve consultar `/lead-metrics` em tela administrativa. |
| Cadastro rapido de Lead | Parcial | Reutilizar formulario simplificado Nome/Contato/Telefone/Origem. |
| Lead vira Cliente ao aceitar | Backend existente | Remover criacao manual de Cliente pelo COMERCIAL e impedir troca livre de status. |
| Propostas vinculadas | Ausente no detalhe | Exibir todas com `viewerCanEdit`; redigir valor/titulo quando a API restringir. |
| Abrir proposta propria | Ausente no detalhe | Linha editavel navega ao detalhe. Linha restrita nao navega e explica a restricao. |

### 3.4 Avisos de recaptura

| Funcionalidade web/API | Estado mobile | Contraponto e acao |
|---|---|---|
| Lista de avisos | Paridade | ADMIN e COMERCIAL listam conforme permissao. |
| Marcar tratado | Paridade | Manter. |
| Adiar 7/15/30 dias | Parcial | COMERCIAL tem 7/15; ADMIN nao tem. Padronizar 7/15/30 para ambos. |
| Badge global | Parcial | Badge aparece dentro da tela, nao nas abas. Consumir `/recall-reminders/count`. |
| Aviso apos login | Ausente | Exibir sheet uma vez por sessao com ate cinco avisos vencidos. |
| Filtros | Ausente | Adicionar texto, marco e status; responsavel apenas para ADMIN. |

### 3.5 Administracao

| Funcionalidade web/API | Estado mobile | Contraponto e acao |
|---|---|---|
| Dashboard ADMIN | Parcial | Contagens e recentes existem; falta lista filtrada/paginada e metricas de Leads. |
| Usuarios CRUD | Parcial avancado | CRUD e matriz por Empresa existem; adicionar reset de senha, melhores validacoes e confirmacoes. |
| Acesso `Criar propostas` | Paridade | Manter. |
| Acesso `Ver catalogo` | Paridade | Manter e explicar efeito na UI. |
| Empresas CRUD | Parcial | Nome/cor/contato existem; faltam logo, status, color picker e Apresentacao padrao. |
| Programas CRUD | Ausente | Implementar Empresa, icone, dados e produtos vinculados. |
| Produtos CRUD | Ausente | Implementar Empresa obrigatoria, Programa opcional, duracao e valor sugerido. |
| Tipos de Proposta CRUD | Ausente | Implementar lista, busca, ativo, criar, editar e desativar. |
| Origens de Leads CRUD | Ausente | Implementar lista, ordem, ativo, criacao, edicao e desativacao. |
| Metricas de captacao | Ausente | Implementar resumo e distribuicao por origem. |

### 3.6 Plataforma e qualidade

| Area | Estado mobile | Acao |
|---|---|---|
| Tipos da API | Manuais e incompletos | Gerar/derivar tipos do OpenAPI e validar respostas criticas com Zod. |
| Query keys | Strings espalhadas | Criar factories por dominio. |
| Testes automatizados | Ausentes | Adicionar Jest Expo e React Native Testing Library. |
| Rede/offline | Parcial | Adicionar NetInfo, banner offline e bloquear mutacoes sem servidor. |
| Observabilidade | Ausente | Criar logger sanitizado e boundary por rota; integrar provider externo apenas em plano de release. |
| EAS | Ausente | Criar IDs, `eas.json`, ambientes e politica OTA. |
| Performance | Basica | Usar `FlatList`, paginacao, memoizacao e imagens com Expo Image. |
| Acessibilidade | Parcial | Auditar labels, estados, texto ampliado e alvos de toque. |

---

## 4. Decisoes de Produto e UX Mobile

### 4.1 Navegacao

- COMERCIAL mantem cinco destinos principais: Propostas, Clientes, Leads, Avisos e Perfil.
- ADMIN mantem Dashboard, Propostas, Clientes, Avisos e Menu.
- Cadastros administrativos continuam dentro de `Menu`; nao criar mais de cinco abas.
- Rotas profundas usam Stack com titulo, voltar e acao primaria contextual.
- Remover o grupo residual `(tabs)` quando nenhuma rota depender dele.

### 4.2 Board de propostas

- O topo oferece Empresa, Programa, busca e status em filtros compactos.
- As etapas comerciais sao paginas horizontais com largura da tela menos 32 pontos.
- Cada pagina mostra cabecalho, quantidade e `FlatList` vertical de propostas.
- Um seletor de etapa permite pular diretamente sem percorrer todas as colunas.
- O card abre o detalhe ao tocar.
- A acao `Mover para etapa` abre bottom sheet/lista de etapas.
- Aprovar e rejeitar abrem confirmacao dedicada.
- Nao implementar drag-and-drop como requisito de aceite mobile.

### 4.3 Editor de proposta

O editor sera dividido em etapas:

1. **Contexto:** Empresa, Tipo e Cliente/Lead.
2. **Periodo:** datas e opcao `Nao exibir periodo`.
3. **Produtos:** catalogo, itens avulsos e metadados.
4. **Investimento:** sugestao, valor manual e descricao.
5. **Revisao:** apresentacao, contato, resumo, status, preview e PDF.

Regras:

- Salvar uma secao por vez com fila serializada; nunca disparar autosaves concorrentes.
- Indicar `Salvando`, `Salvo` ou `Falha ao salvar`.
- Ao sair com alteracao pendente, pedir confirmacao.
- Um erro em uma etapa nao apaga dados locais das demais.
- O contato comercial e a Apresentacao sao somente leitura.

### 4.4 Administracao

- Listas administrativas usam busca, filtro de ativo e botao de criacao no header.
- Formularios longos usam secoes verticais e acao de salvar visivel ao final, sem barra fixa sobre o teclado.
- Desativacao e preferida a exclusao quando a API preserva historico.
- Programas e Produtos seguem Empresa -> Programa -> Produto; seletores dependentes limpam valores invalidos.

---

## 5. Estrutura de Arquivos Proposta

### Criar no aplicativo

```text
artifacts/mobile/src/api/queryKeys.ts
artifacts/mobile/src/api/contracts.ts
artifacts/mobile/src/api/schemas.ts
artifacts/mobile/src/api/errors.ts
artifacts/mobile/src/components/AppScreen.tsx
artifacts/mobile/src/components/NetworkBanner.tsx
artifacts/mobile/src/components/FilterSheet.tsx
artifacts/mobile/src/components/MutationState.tsx
artifacts/mobile/src/features/auth/routeGuard.ts
artifacts/mobile/src/features/proposals/api.ts
artifacts/mobile/src/features/proposals/types.ts
artifacts/mobile/src/features/proposals/board/ProposalStagePager.tsx
artifacts/mobile/src/features/proposals/board/ProposalStageColumn.tsx
artifacts/mobile/src/features/proposals/board/ProposalBoardCard.tsx
artifacts/mobile/src/features/proposals/board/MoveProposalSheet.tsx
artifacts/mobile/src/features/proposals/editor/proposalDraft.ts
artifacts/mobile/src/features/proposals/editor/useProposalAutosave.ts
artifacts/mobile/src/features/proposals/editor/ProposalEditorStepper.tsx
artifacts/mobile/src/features/proposals/editor/ContextStep.tsx
artifacts/mobile/src/features/proposals/editor/PeriodStep.tsx
artifacts/mobile/src/features/proposals/editor/ProductsStep.tsx
artifacts/mobile/src/features/proposals/editor/InvestmentStep.tsx
artifacts/mobile/src/features/proposals/editor/ReviewStep.tsx
artifacts/mobile/src/features/proposals/products/ProductCatalogSheet.tsx
artifacts/mobile/src/features/proposals/products/ProposalProductForm.tsx
artifacts/mobile/src/features/proposals/products/investmentSuggestion.ts
artifacts/mobile/src/features/proposals/print/proposalPrintHtml.ts
artifacts/mobile/src/features/proposals/print/useProposalPdf.ts
artifacts/mobile/src/features/advertisers/api.ts
artifacts/mobile/src/features/advertisers/AdvertiserProposalList.tsx
artifacts/mobile/src/features/advertisers/LeadSourcePicker.tsx
artifacts/mobile/src/features/recall/RecallReminderSheet.tsx
artifacts/mobile/src/features/admin/catalog/CatalogListScreen.tsx
artifacts/mobile/src/features/admin/stations/StationPresentationEditor.tsx
artifacts/mobile/src/features/admin/lead-sources/LeadMetricsSummary.tsx
artifacts/mobile/app/admin/programs/index.tsx
artifacts/mobile/app/admin/programs/[id].tsx
artifacts/mobile/app/admin/products/index.tsx
artifacts/mobile/app/admin/products/[id].tsx
artifacts/mobile/app/admin/proposal-types/index.tsx
artifacts/mobile/app/admin/proposal-types/[id].tsx
artifacts/mobile/app/admin/lead-sources/index.tsx
artifacts/mobile/app/admin/lead-sources/[id].tsx
artifacts/mobile/jest.config.js
artifacts/mobile/jest.setup.ts
artifacts/mobile/eas.json
```

### Modificar no aplicativo

```text
artifacts/mobile/package.json
artifacts/mobile/app.json
artifacts/mobile/app/_layout.tsx
artifacts/mobile/app/index.tsx
artifacts/mobile/app/(admin)/_layout.tsx
artifacts/mobile/app/(admin)/index.tsx
artifacts/mobile/app/(admin)/proposals.tsx
artifacts/mobile/app/(admin)/clients.tsx
artifacts/mobile/app/(admin)/alerts.tsx
artifacts/mobile/app/(admin)/menu.tsx
artifacts/mobile/app/(comercial)/_layout.tsx
artifacts/mobile/app/(comercial)/index.tsx
artifacts/mobile/app/(comercial)/clients.tsx
artifacts/mobile/app/(comercial)/leads.tsx
artifacts/mobile/app/(comercial)/alerts.tsx
artifacts/mobile/app/(comercial)/profile.tsx
artifacts/mobile/app/(public)/reset-password.tsx
artifacts/mobile/app/proposal/new.tsx
artifacts/mobile/app/proposal/[id].tsx
artifacts/mobile/app/advertiser/[id].tsx
artifacts/mobile/app/admin/stations/[id].tsx
artifacts/mobile/app/admin/users/[id].tsx
artifacts/mobile/components/AdvertiserCard.tsx
artifacts/mobile/components/ProposalCard.tsx
artifacts/mobile/src/api/client.ts
artifacts/mobile/src/store/authStore.ts
artifacts/mobile/src/types/index.ts
```

### Modificar no sistema principal somente quando o contrato exigir

```text
../Sistema-Propostas/lib/api-spec/openapi.yaml
../Sistema-Propostas/lib/api-client-react/src/generated/api.schemas.ts
../Sistema-Propostas/lib/api-client-react/src/generated/api.ts
../Sistema-Propostas/artifacts/api-server/src/test
```

Nao editar a copia mobile de `artifacts/api-server` ou `lib/db`.

---

# Fase 1 - Fundacao Confiavel

## Task 1: Testes mobile e contratos oficiais

**Files:**

- Modify: `artifacts/mobile/package.json`
- Create: `artifacts/mobile/jest.config.js`
- Create: `artifacts/mobile/jest.setup.ts`
- Create: `artifacts/mobile/src/api/contracts.ts`
- Create: `artifacts/mobile/src/api/schemas.ts`
- Modify: `artifacts/mobile/src/types/index.ts`
- Modify: `../Sistema-Propostas/lib/api-spec/openapi.yaml`
- Test: `artifacts/mobile/src/api/__tests__/schemas.test.ts`

**Interfaces:**

- Produces: DTOs de `ProposalProgressBoard`, `LeadSource`, `LeadMetrics`, `ProposalProduct`, `AdvertiserWithProposals` e schemas Zod para respostas criticas.
- Consumes: JSON retornado pela API oficial.

- [ ] **Step 1: completar o OpenAPI oficial**

Documentar no projeto principal:

```text
GET /proposals/progress-board
GET /proposals/{id}/timeline
POST /proposals/{id}/timeline
POST /proposals/{id}/duplicate
GET/POST/PATCH/DELETE /lead-sources
GET /lead-metrics
GET/PATCH /profile
GET/PUT /stations/{id}/presentation
GET /recall-reminders/count
PATCH /recall-reminders/{id}/snooze
PATCH /recall-reminders/{id}/done
```

- [ ] **Step 2: validar e regenerar os contratos no sistema principal**

```bash
cd ../Sistema-Propostas
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/api-zod run typecheck
pnpm --filter @workspace/api-client-react run typecheck
```

Esperado: OpenAPI valido e clientes gerados sem alteracao manual em arquivos `generated`.

- [ ] **Step 3: instalar a infraestrutura de teste mobile**

```bash
pnpm --filter @workspace/mobile add -D jest-expo @testing-library/react-native @types/jest
```

Adicionar scripts:

```json
{
  "test": "jest --runInBand",
  "test:watch": "jest --watch"
}
```

- [ ] **Step 4: escrever testes de schema antes da implementacao**

Cobrir:

1. board com programas, propostas e `currentStep`;
2. Lead com `leadSourceId` e `leadSource`;
3. item de produto com duracao, horario e sazonalidade;
4. resposta invalida falha com mensagem de contrato.

- [ ] **Step 5: implementar DTOs e schemas**

Os tipos mobile nao devem conter `ARCHIVED`, pois a API operacional aceita:

```ts
export type ProposalStatus = "DRAFT" | "SENT" | "APPROVED" | "REJECTED";
```

Completar `ProposalProduct` com:

```ts
productTemplateId?: string | null;
durationLabel?: string | null;
airTime?: string | null;
seasonality?: "MONTHLY" | "SEMIANNUAL" | "ANNUAL" | null;
```

- [ ] **Step 6: executar verificacoes**

```bash
pnpm --filter @workspace/mobile run test
pnpm --filter @workspace/mobile run typecheck
```

- [ ] **Step 7: commit sugerido**

```bash
git add artifacts/mobile/package.json artifacts/mobile/jest.config.js artifacts/mobile/jest.setup.ts artifacts/mobile/src/api artifacts/mobile/src/types pnpm-lock.yaml
git commit -m "test(mobile): adiciona contratos e infraestrutura de testes"
```

## Task 2: Cliente HTTP, query keys, sessao e rede

**Files:**

- Create: `artifacts/mobile/src/api/queryKeys.ts`
- Create: `artifacts/mobile/src/api/errors.ts`
- Create: `artifacts/mobile/src/components/NetworkBanner.tsx`
- Create: `artifacts/mobile/src/features/auth/routeGuard.ts`
- Modify: `artifacts/mobile/src/api/client.ts`
- Modify: `artifacts/mobile/src/store/authStore.ts`
- Modify: `artifacts/mobile/app/_layout.tsx`
- Modify: `artifacts/mobile/app/index.tsx`
- Test: `artifacts/mobile/src/api/__tests__/client.test.ts`
- Test: `artifacts/mobile/src/features/auth/__tests__/routeGuard.test.ts`

**Interfaces:**

- Produces: `queryKeys`, `normalizeApiError`, `resolveAuthenticatedRoute` e evento central de sessao expirada.
- Consumes: SecureStore, Zustand, NetInfo e TanStack Query.

- [ ] **Step 1: escrever testes de refresh e logout**

Cobrir:

1. duas chamadas `401` compartilham um refresh;
2. a requisicao original repete uma unica vez;
3. refresh `401` limpa tokens e usuario;
4. falha de rede preserva cache visual sem autorizar mutacao;
5. ADMIN nao entra em rota exclusiva de COMERCIAL e vice-versa.

- [ ] **Step 2: instalar NetInfo**

```bash
pnpm --filter @workspace/mobile add @react-native-community/netinfo
```

- [ ] **Step 3: implementar query key factories**

Exemplo:

```ts
export const queryKeys = {
  proposals: {
    all: ["proposals"] as const,
    list: (filters: ProposalFilters) => ["proposals", "list", filters] as const,
    detail: (id: string) => ["proposals", "detail", id] as const,
    board: (filters: BoardFilters) => ["proposals", "board", filters] as const,
    timeline: (id: string) => ["proposals", "timeline", id] as const,
  },
};
```

- [ ] **Step 4: centralizar expiracao de sessao**

Quando `AuthSessionError` for definitivo:

1. limpar SecureStore;
2. limpar cache do usuario;
3. cancelar queries em andamento;
4. limpar QueryClient;
5. redirecionar uma unica vez ao login;
6. exibir `Sua sessao expirou. Entre novamente.`

- [ ] **Step 5: implementar estado offline**

O banner deve:

- informar `Sem conexao`;
- permitir leitura do cache existente;
- impedir `POST`, `PATCH`, `PUT` e `DELETE` antes de chamar `fetch`;
- desaparecer automaticamente ao recuperar a rede.

- [ ] **Step 6: executar verificacoes**

```bash
pnpm --filter @workspace/mobile run test
pnpm --filter @workspace/mobile run typecheck
```

---

# Fase 2 - Jornada Comercial Principal

## Task 3: Clientes, Leads, origens e propostas vinculadas

**Files:**

- Create: `artifacts/mobile/src/features/advertisers/api.ts`
- Create: `artifacts/mobile/src/features/advertisers/LeadSourcePicker.tsx`
- Create: `artifacts/mobile/src/features/advertisers/AdvertiserProposalList.tsx`
- Modify: `artifacts/mobile/app/(comercial)/clients.tsx`
- Modify: `artifacts/mobile/app/(comercial)/leads.tsx`
- Modify: `artifacts/mobile/app/(admin)/clients.tsx`
- Modify: `artifacts/mobile/app/advertiser/[id].tsx`
- Modify: `artifacts/mobile/components/AdvertiserCard.tsx`
- Test: `artifacts/mobile/src/features/advertisers/__tests__/advertiser-form.test.tsx`
- Test: `artifacts/mobile/src/features/advertisers/__tests__/proposal-visibility.test.tsx`

**Interfaces:**

- Produces: hooks de lista/detalhe/mutacao, `LeadSourcePicker` e lista segura de propostas.
- Consumes: `/advertisers`, `/lead-sources` e `viewerCanEdit`.

- [ ] **Step 1: escrever testes das regras Lead/Cliente**

Cobrir:

1. novo Lead exige origem;
2. COMERCIAL nao recebe opcao de criar Cliente diretamente;
3. Cliente nao exige origem;
4. Lead legado sem origem pode ser editado sem perda, mas deve escolher origem antes de nova salvacao comercial;
5. proposta restrita mostra Programa, Status e Responsavel, sem titulo, valor ou navegacao.

- [ ] **Step 2: atualizar tipos e formularios**

Adicionar:

```ts
interface LeadSource {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  order: number;
}
```

O formulario rapido de Lead exige:

- Nome;
- Nome do contato;
- Telefone;
- Origem.

- [ ] **Step 3: remover transicao manual indevida**

- COMERCIAL cria apenas `LEAD`.
- ADMIN pode criar `CLIENT` em fluxo administrativo explicito.
- A tela nao oferece mudar Lead para Cliente manualmente.
- A promocao continua ocorrendo somente ao aceitar proposta.

- [ ] **Step 4: implementar propostas vinculadas**

Linhas com `viewerCanEdit=true` abrem `/proposal/[id]`.

Linhas com `viewerCanEdit=false` exibem:

```text
Programa
Status
Responsavel
Proposta de outro responsavel
```

Sem menu, valor, titulo ou `onPress`.

- [ ] **Step 5: adicionar filtros mobile**

- Clientes: busca.
- Leads: busca e origem.
- ADMIN: status e origem.

- [ ] **Step 6: executar testes e typecheck**

```bash
pnpm --filter @workspace/mobile run test -- advertiser
pnpm --filter @workspace/mobile run typecheck
```

## Task 4: Board mobile de propostas por etapa

**Files:**

- Create: `artifacts/mobile/src/features/proposals/api.ts`
- Create: `artifacts/mobile/src/features/proposals/types.ts`
- Create: `artifacts/mobile/src/features/proposals/board/ProposalStagePager.tsx`
- Create: `artifacts/mobile/src/features/proposals/board/ProposalStageColumn.tsx`
- Create: `artifacts/mobile/src/features/proposals/board/ProposalBoardCard.tsx`
- Create: `artifacts/mobile/src/features/proposals/board/MoveProposalSheet.tsx`
- Modify: `artifacts/mobile/app/(comercial)/index.tsx`
- Modify: `artifacts/mobile/app/(admin)/proposals.tsx`
- Test: `artifacts/mobile/src/features/proposals/board/__tests__/stage-model.test.ts`
- Test: `artifacts/mobile/src/features/proposals/board/__tests__/move-proposal.test.tsx`

**Interfaces:**

- Produces: board compartilhado pelos dois perfis.
- Consumes: `GET /proposals/progress-board`, `POST /timeline` e `PATCH /status`.

- [ ] **Step 1: testar o mapeamento das etapas**

Ordem:

```ts
[
  "LEAD_CREATED",
  "IN_CONVERSATION",
  "PROPOSAL_SENT",
  "CLIENT_REVIEWING",
  "NEGOTIATION",
  "APPROVED",
  "REJECTED",
]
```

Testar fallback por status quando `currentStep` estiver ausente.

- [ ] **Step 2: implementar filtros**

- busca textual com debounce de 300 ms;
- Empresa;
- Programa;
- status;
- limpar filtros.

- [ ] **Step 3: implementar pager**

Usar `FlatList` horizontal com:

```ts
horizontal
pagingEnabled
decelerationRate="fast"
snapToInterval={columnWidth + gap}
```

Cada coluna usa sua propria `FlatList` vertical. Nao aninhar `ScrollView` vertical.

- [ ] **Step 4: implementar movimentacao**

- etapas intermediarias: `POST /proposals/:id/timeline`;
- Aceita: confirmar e enviar `PATCH /status` com `APPROVED`;
- Rejeitada: confirmar e enviar `PATCH /status` com `REJECTED`;
- terminal nao volta de etapa nesta entrega;
- `viewerCanEdit=false` nao mostra a acao.

- [ ] **Step 5: invalidar dados de forma atomica**

Ao concluir:

- invalidar board;
- invalidar detalhe e timeline da proposta;
- invalidar dashboard;
- invalidar Clientes/Leads ao aprovar;
- invalidar avisos ao aprovar ou rejeitar.

- [ ] **Step 6: executar testes**

```bash
pnpm --filter @workspace/mobile run test -- board
pnpm --filter @workspace/mobile run typecheck
```

## Task 5: Criacao e editor mobile em etapas

**Files:**

- Create: `artifacts/mobile/src/features/proposals/editor/proposalDraft.ts`
- Create: `artifacts/mobile/src/features/proposals/editor/useProposalAutosave.ts`
- Create: `artifacts/mobile/src/features/proposals/editor/ProposalEditorStepper.tsx`
- Create: `artifacts/mobile/src/features/proposals/editor/ContextStep.tsx`
- Create: `artifacts/mobile/src/features/proposals/editor/PeriodStep.tsx`
- Create: `artifacts/mobile/src/features/proposals/editor/InvestmentStep.tsx`
- Create: `artifacts/mobile/src/features/proposals/editor/ReviewStep.tsx`
- Modify: `artifacts/mobile/app/proposal/new.tsx`
- Modify: `artifacts/mobile/app/proposal/[id].tsx`
- Test: `artifacts/mobile/src/features/proposals/editor/__tests__/proposal-draft.test.ts`
- Test: `artifacts/mobile/src/features/proposals/editor/__tests__/autosave.test.ts`

**Interfaces:**

- Produces: `ProposalDraft`, `proposalDraftReducer` e autosave serializado.
- Consumes: detalhe e `PATCH /proposals/:id`.

- [ ] **Step 1: escrever testes do reducer**

Cobrir:

1. hidrata proposta da API;
2. troca de Empresa limpa produto incompatível;
3. `showPeriod=false` preserva datas;
4. erro de salvacao mantem o draft sujo;
5. resposta mais antiga nunca sobrescreve resposta nova.

- [ ] **Step 2: alinhar criacao**

A tela inicial deve:

1. selecionar Empresa permitida;
2. selecionar Tipo ativo;
3. selecionar Cliente/Lead existente ou criar Lead;
4. mostrar resumo;
5. criar rascunho;
6. abrir a etapa Periodo.

- [ ] **Step 3: implementar Contexto**

- Empresa;
- Tipo;
- Cliente/Lead;
- contato e Apresentacao somente leitura;
- aviso quando o perfil do vendedor estiver incompleto.

- [ ] **Step 4: implementar Periodo**

- data inicial;
- data final;
- validacao final >= inicial;
- toggle `Nao exibir periodo na proposta`;
- sem campo `periodDesc`.

- [ ] **Step 5: implementar Investimento**

- valor com mascara BRL;
- descricao opcional;
- sugestao;
- acao `Usar valor sugerido`;
- valor final sempre editavel.

- [ ] **Step 6: implementar autosave serializado**

Contrato:

```ts
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
```

Somente uma requisicao pode estar ativa. Se houver alteracao durante o envio, iniciar novo envio depois da resposta atual.

- [ ] **Step 7: proteger saida**

Ao voltar com `dirty` ou `saving`, mostrar:

```text
Alteracoes ainda nao foram salvas.
Continuar editando | Sair sem salvar
```

- [ ] **Step 8: executar testes**

```bash
pnpm --filter @workspace/mobile run test -- editor
pnpm --filter @workspace/mobile run typecheck
```

## Task 6: Produtos, catalogo e sugestao de investimento

**Files:**

- Create: `artifacts/mobile/src/features/proposals/editor/ProductsStep.tsx`
- Create: `artifacts/mobile/src/features/proposals/products/ProductCatalogSheet.tsx`
- Create: `artifacts/mobile/src/features/proposals/products/ProposalProductForm.tsx`
- Create: `artifacts/mobile/src/features/proposals/products/investmentSuggestion.ts`
- Modify: `artifacts/mobile/src/features/proposals/editor/proposalDraft.ts`
- Test: `artifacts/mobile/src/features/proposals/products/__tests__/investmentSuggestion.test.ts`
- Test: `artifacts/mobile/src/features/proposals/products/__tests__/product-form.test.tsx`

**Interfaces:**

- Produces: selecao de catalogo e `calculateInvestmentSuggestion`.
- Consumes: `/proposal-categories`, `/product-templates` e `products` do draft.

- [ ] **Step 1: testar o calculo**

Formula:

```text
valor sugerido do item x quantidade
soma apenas itens com productTemplateId e valor sugerido
```

Testar quantidade invalida, item avulso, valor ausente e dados legados.

- [ ] **Step 2: implementar catalogo filtrado**

- sempre filtrar pela Empresa da proposta;
- agrupar por Programa;
- incluir `Sem programa`;
- respeitar `viewerCanViewCatalog`;
- busca por nome;
- toque adiciona uma copia ao draft.

- [ ] **Step 3: implementar formulario de item**

Campos:

- quantidade;
- nome do produto;
- duracao;
- horario;
- sazonalidade;
- descricao;
- Programa/Informacao conforme contrato atual.

- [ ] **Step 4: implementar produto avulso**

O item avulso:

- nao possui `productTemplateId`;
- nao cria registro em `/product-templates`;
- nao entra na sugestao;
- pode ser editado e removido da proposta.

- [ ] **Step 5: implementar remocao**

Botao vermelho, com label de acessibilidade e confirmacao quando o item ja estiver persistido.

- [ ] **Step 6: executar verificacoes**

```bash
pnpm --filter @workspace/mobile run test -- products
pnpm --filter @workspace/mobile run typecheck
```

## Task 7: Andamento, duplicacao e acoes terminais

**Files:**

- Modify: `artifacts/mobile/app/proposal/[id].tsx`
- Create: `artifacts/mobile/src/features/proposals/TimelineSection.tsx`
- Create: `artifacts/mobile/src/features/proposals/ProposalActions.tsx`
- Test: `artifacts/mobile/src/features/proposals/__tests__/proposal-actions.test.tsx`

**Interfaces:**

- Produces: timeline completa e acoes por permissao/status.
- Consumes: timeline, duplicate, status e `viewerCanEdit`.

- [ ] **Step 1: testar matriz de acoes**

Cobrir:

- COMERCIAL dono;
- COMERCIAL nao dono;
- ADMIN;
- proposta Aceita;
- proposta Rejeitada.

- [ ] **Step 2: expor etapas manuais**

```text
Em conversa
Proposta enviada
Cliente analisando
Negociacao
```

Nota opcional com limite visual de 500 caracteres.

- [ ] **Step 3: implementar duplicacao**

Confirmar, chamar `/duplicate`, invalidar listas e abrir o novo rascunho.

- [ ] **Step 4: manter terminais seguros**

- `Aceitar` verde;
- `Rejeitar` vermelho;
- ambos com confirmacao;
- sem acao quando `viewerCanEdit=false`;
- sucesso atualiza Leads/Clientes e avisos.

- [ ] **Step 5: executar verificacoes**

```bash
pnpm --filter @workspace/mobile run test -- proposal-actions
pnpm --filter @workspace/mobile run typecheck
```

## Task 8: Preview, PDF e compartilhamento

**Files:**

- Create: `artifacts/mobile/src/features/proposals/ProposalNativePreview.tsx`
- Create: `artifacts/mobile/src/features/proposals/print/proposalPrintHtml.ts`
- Create: `artifacts/mobile/src/features/proposals/print/useProposalPdf.ts`
- Modify: `artifacts/mobile/src/features/proposals/editor/ReviewStep.tsx`
- Modify: `artifacts/mobile/package.json`
- Test: `artifacts/mobile/src/features/proposals/print/__tests__/proposalPrintHtml.test.ts`

**Interfaces:**

- Produces: preview nativo e PDF temporario compartilhavel.
- Consumes: proposta completa e identidade da Empresa.

- [ ] **Step 1: instalar recursos Expo**

```bash
pnpm --filter @workspace/mobile add expo-print expo-sharing
```

- [ ] **Step 2: testar HTML**

Validar:

- Empresa e logo;
- Cliente;
- periodo oculto;
- Apresentacao;
- 0, 1, 4, 5 e 12 produtos;
- investimento;
- contato do vendedor;
- nenhuma string `undefined`.

- [ ] **Step 3: implementar preview nativo**

O preview no app prioriza leitura e nao simula uma folha A4 reduzida.

- [ ] **Step 4: implementar PDF**

`expo-print` recebe HTML com paginas A4 controladas e no maximo quatro cards por pagina como baseline. O investimento e contato ficam na ultima pagina.

- [ ] **Step 5: implementar compartilhamento**

- verificar `Sharing.isAvailableAsync()`;
- gerar arquivo temporario;
- abrir share sheet;
- remover/reutilizar arquivo temporario sem guardar dados indefinidamente;
- nao registrar conteudo da proposta em logs.

- [ ] **Step 6: validar em dispositivo**

Testar iOS e Android com 1, 4, 5 e 12 produtos.

---

# Fase 3 - Administracao e Operacao

## Task 9: Avisos de recaptura completos

**Files:**

- Create: `artifacts/mobile/src/features/recall/RecallReminderSheet.tsx`
- Modify: `artifacts/mobile/app/(admin)/alerts.tsx`
- Modify: `artifacts/mobile/app/(comercial)/alerts.tsx`
- Modify: `artifacts/mobile/app/(admin)/_layout.tsx`
- Modify: `artifacts/mobile/app/(comercial)/_layout.tsx`
- Modify: `artifacts/mobile/app/_layout.tsx`
- Test: `artifacts/mobile/src/features/recall/__tests__/reminder-sheet.test.tsx`

**Interfaces:**

- Produces: badge de aba e aviso pos-login uma vez por sessao.
- Consumes: count, list, snooze e done.

- [ ] **Step 1: escrever testes**

Cobrir:

- sheet aparece uma vez;
- no maximo cinco avisos;
- badge usa contagem vencida;
- ADMIN e COMERCIAL possuem 7/15/30 dias;
- mutacao atualiza lista e badge.

- [ ] **Step 2: padronizar acoes**

Adicionar 30 dias e permitir adiamento no ADMIN.

- [ ] **Step 3: implementar provider global**

Montar somente depois de sessao autenticada e nunca sobre login/reset.

- [ ] **Step 4: executar verificacoes**

```bash
pnpm --filter @workspace/mobile run test -- recall
pnpm --filter @workspace/mobile run typecheck
```

## Task 10: Dashboard e metricas de Leads

**Files:**

- Modify: `artifacts/mobile/app/(admin)/index.tsx`
- Create: `artifacts/mobile/src/features/admin/lead-sources/LeadMetricsSummary.tsx`
- Test: `artifacts/mobile/src/features/admin/__tests__/dashboard.test.tsx`

**Interfaces:**

- Produces: dashboard operacional com filtros.
- Consumes: `/dashboard/stats`, `/proposals` e `/lead-metrics`.

- [ ] **Step 1: testar filtros por status**

Toque em Rascunhos, Enviadas, Aceitas ou Rejeitadas deve abrir a lista com o filtro correto.

- [ ] **Step 2: adicionar resumo de captacao**

Exibir:

- Leads no periodo;
- abertos;
- convertidos;
- taxa de conversao;
- origem principal.

- [ ] **Step 3: manter densidade mobile**

Usar dois cards por linha apenas quando houver largura suficiente; em texto ampliado, usar uma coluna.

- [ ] **Step 4: executar verificacoes**

```bash
pnpm --filter @workspace/mobile run test -- dashboard
pnpm --filter @workspace/mobile run typecheck
```

## Task 11: Empresas e Apresentacao padrao

**Files:**

- Modify: `artifacts/mobile/app/admin/stations/[id].tsx`
- Create: `artifacts/mobile/src/features/admin/stations/StationPresentationEditor.tsx`
- Test: `artifacts/mobile/src/features/admin/stations/__tests__/station-form.test.tsx`

**Interfaces:**

- Produces: Empresa completa e editor de ate quatro itens.
- Consumes: `/stations` e `/stations/:id/presentation`.

- [ ] **Step 1: testar validacoes**

- Nome obrigatorio;
- cor hexadecimal obrigatoria;
- telefone/e-mail opcionais;
- no maximo quatro itens;
- destaque e descricao obrigatorios por item.

- [ ] **Step 2: implementar color picker acessivel**

Oferecer paleta, swatch, valor hexadecimal e contraste do texto. Nao depender apenas da cor para informar selecao.

- [ ] **Step 3: implementar logo**

Usar Expo Image Picker, limitar tamanho antes do envio e validar Data URL aceita pela API.

- [ ] **Step 4: implementar Apresentacao**

Carregar e salvar separadamente do formulario principal. Reordenar com botoes `Subir`/`Descer`, nao por drag obrigatorio.

- [ ] **Step 5: executar verificacoes**

```bash
pnpm --filter @workspace/mobile run test -- station
pnpm --filter @workspace/mobile run typecheck
```

## Task 12: Programas, Produtos e Tipos de Proposta

**Files:**

- Create: `artifacts/mobile/src/features/admin/catalog/CatalogListScreen.tsx`
- Create: `artifacts/mobile/app/admin/programs/index.tsx`
- Create: `artifacts/mobile/app/admin/programs/[id].tsx`
- Create: `artifacts/mobile/app/admin/products/index.tsx`
- Create: `artifacts/mobile/app/admin/products/[id].tsx`
- Create: `artifacts/mobile/app/admin/proposal-types/index.tsx`
- Create: `artifacts/mobile/app/admin/proposal-types/[id].tsx`
- Modify: `artifacts/mobile/app/(admin)/menu.tsx`
- Test: `artifacts/mobile/src/features/admin/catalog/__tests__/catalog-forms.test.tsx`

**Interfaces:**

- Produces: CRUD dos tres catalogos.
- Consumes: `/proposal-categories`, `/product-templates`, `/product-durations` e `/proposal-types`.

- [ ] **Step 1: escrever testes de dependencia**

Cobrir:

- Programa exige Empresa;
- produtos vinculados ao Programa pertencem a mesma Empresa;
- Produto exige Empresa e aceita Programa opcional;
- troca de Empresa limpa Programa incompativel;
- duracao pode ser criada pelo ADMIN;
- Tipo pode ser ativado/desativado.

- [ ] **Step 2: implementar Programas**

Lista com Empresa, ativo e quantidade de produtos. Formulario com nome, descricao, icone e produtos existentes.

- [ ] **Step 3: implementar Produtos**

Lista hierarquica Programa -> Produtos, incluindo `Sem programa`. Formulario com Empresa, Programa, nome, descricao, duracao e valor sugerido.

- [ ] **Step 4: implementar Tipos**

Busca, filtro ativo, criar, editar e desativar.

- [ ] **Step 5: habilitar o menu**

Remover `Em breve` apenas quando cada rota estiver testada.

- [ ] **Step 6: executar verificacoes**

```bash
pnpm --filter @workspace/mobile run test -- catalog
pnpm --filter @workspace/mobile run typecheck
```

## Task 13: Origens de Leads e metricas administrativas

**Files:**

- Create: `artifacts/mobile/app/admin/lead-sources/index.tsx`
- Create: `artifacts/mobile/app/admin/lead-sources/[id].tsx`
- Create: `artifacts/mobile/src/features/admin/lead-sources/LeadMetricsSummary.tsx`
- Modify: `artifacts/mobile/app/(admin)/menu.tsx`
- Test: `artifacts/mobile/src/features/admin/lead-sources/__tests__/lead-sources.test.tsx`

**Interfaces:**

- Produces: CRUD de origens e relatorio mobile.
- Consumes: `/lead-sources` e `/lead-metrics`.

- [ ] **Step 1: testar CRUD logico**

Desativar nao remove origem de Lead antigo; origem inativa nao aparece em novo Lead.

- [ ] **Step 2: implementar lista e formulario**

Campos:

- nome;
- slug gerado e editavel;
- ordem;
- ativo.

- [ ] **Step 3: implementar metricas**

Filtros por periodo e origem, totais e distribuicao. Em tela pequena usar lista ordenada, nao tabela horizontal.

- [ ] **Step 4: executar verificacoes**

```bash
pnpm --filter @workspace/mobile run test -- lead-sources
pnpm --filter @workspace/mobile run typecheck
```

## Task 14: Usuarios e matriz de acesso final

**Files:**

- Modify: `artifacts/mobile/app/admin/users/[id].tsx`
- Modify: `artifacts/mobile/app/admin/users/index.tsx`
- Test: `artifacts/mobile/src/features/admin/users/__tests__/user-access.test.tsx`

**Interfaces:**

- Produces: gestao completa de usuario no mobile.
- Consumes: `/users`, `/users/:id/reset-password` e `/stations`.

- [ ] **Step 1: testar regras**

- COMERCIAL ativo precisa de ao menos uma Empresa com criacao;
- `Ver catalogo` controla consulta de Programas/Produtos;
- ADMIN nao envia matriz de Empresa;
- desativar usuario exige confirmacao;
- reset de senha exige nova senha valida.

- [ ] **Step 2: melhorar a matriz**

Cada Empresa exibe dois toggles com textos:

```text
Criar propostas
Consultar Programas e Produtos
```

Adicionar explicacao curta, sem depender de tooltip.

- [ ] **Step 3: adicionar reset de senha**

Usar dialog proprio, nunca exibir senha atual e nunca registrar a nova senha em log.

- [ ] **Step 4: executar verificacoes**

```bash
pnpm --filter @workspace/mobile run test -- user-access
pnpm --filter @workspace/mobile run typecheck
```

---

# Fase 4 - Qualidade, Release e Documentacao

## Task 15: Acessibilidade, performance e limpeza

**Files:**

- Modify: telas e componentes tocados nas Tasks 1-14
- Delete: `artifacts/mobile/app/(tabs)/_layout.tsx`
- Delete: `artifacts/mobile/app/(tabs)/index.tsx`
- Test: suites de componentes e navegacao

- [ ] **Step 1: remover rotas residuais**

Remover `(tabs)` e sua entrada do Stack somente depois de confirmar que nenhuma navegacao aponta para o grupo.

- [ ] **Step 2: auditar acessibilidade**

Validar:

- `accessibilityLabel`;
- `accessibilityRole`;
- `accessibilityState`;
- alvos de 44 pontos;
- contraste;
- texto ampliado;
- ordem de foco.

- [ ] **Step 3: auditar listas**

- `keyExtractor` estavel;
- `getItemLayout` quando altura for fixa;
- paginacao no fim da lista;
- imagens com dimensoes;
- nenhuma lista longa renderizada por `.map`.

- [ ] **Step 4: auditar logs**

Nao permitir token, senha, corpo de proposta, telefone ou e-mail em `console`.

- [ ] **Step 5: executar verificacoes**

```bash
pnpm --filter @workspace/mobile run test
pnpm --filter @workspace/mobile run typecheck
```

## Task 16: EAS, ambientes e validacao de release

**Files:**

- Modify: `artifacts/mobile/app.json`
- Create: `artifacts/mobile/eas.json`
- Modify: `docs-mobile/07-execucao-ambientes-publicacao.md`
- Test: build de development/preview

- [ ] **Step 1: definir identificadores**

Usar identificadores aprovados pelo Grupo GTF:

```text
ios.bundleIdentifier
android.package
```

Os valores devem ser confirmados antes do primeiro build assinado e, depois, nao devem ser alterados.

- [ ] **Step 2: criar perfis**

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": { "autoIncrement": true }
  }
}
```

- [ ] **Step 3: configurar ambientes**

- development: API local ou homologacao;
- preview: API de homologacao HTTPS;
- production: API oficial HTTPS.

Somente URL publica da API pode estar em `EXPO_PUBLIC_API_URL`.

- [ ] **Step 4: validar configuracao**

```bash
pnpm --filter @workspace/mobile exec expo config --type public
pnpm --filter @workspace/mobile run typecheck
```

- [ ] **Step 5: executar build de homologacao**

```bash
cd artifacts/mobile
pnpm exec eas build --profile preview --platform android
pnpm exec eas build --profile preview --platform ios
```

Executar apenas depois de autenticar a conta Expo e configurar os identificadores.

## Task 17: Regressao compartilhada e documentacao final

**Files:**

- Modify: `docs-mobile/01-visao-geral-e-estado-atual.md`
- Modify: `docs-mobile/04-navegacao-perfis-e-telas.md`
- Modify: `docs-mobile/05-api-autenticacao-e-dados.md`
- Modify: `docs-mobile/06-padroes-ui-seguranca-qualidade.md`
- Modify: `docs-mobile/08-roadmap-lacunas-riscos.md`
- Modify: `plans-mobile/README.md`
- Modify: `plans-mobile/plan-mobile-002-paridade-funcional-adaptacao-nativa.md`
- Modify when API changed: `../Sistema-Propostas/docs/05-backend-api-guidelines.md`
- Modify when API changed: `../Sistema-Propostas/docs/08-regras-de-negocio.md`

- [ ] **Step 1: validar API oficial**

No projeto principal:

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run test
```

- [ ] **Step 2: validar sistema web**

```bash
cd ../Sistema-Propostas
pnpm --filter @workspace/proposta run typecheck
pnpm --filter @workspace/proposta run build
```

- [ ] **Step 3: validar aplicativo**

```bash
cd ../Sistema-PropostasGTF_App
pnpm --filter @workspace/mobile run test
pnpm --filter @workspace/mobile run typecheck
```

- [ ] **Step 4: executar matriz manual**

Validar em aparelho real:

- iOS ADMIN;
- iOS COMERCIAL;
- Android ADMIN;
- Android COMERCIAL;
- sessao nova, restaurada e expirada;
- Wi-Fi, rede lenta e offline;
- tela pequena;
- texto ampliado;
- teclado;
- deep link de senha;
- proposta com 0, 1, 4, 5 e 12 produtos.

- [ ] **Step 5: atualizar documentacao**

Registrar:

- rotas realmente entregues;
- endpoints usados;
- permissoes;
- comandos;
- variaveis publicas;
- riscos residuais;
- checklist real no final deste plano.

---

## 6. Ordem de Entrega Recomendada

### Release Mobile 1 - Operacao comercial confiavel

Tasks 1 a 7:

- contratos;
- sessao/rede;
- Clientes/Leads/origens;
- board mobile;
- editor;
- produtos;
- andamento.

Resultado: COMERCIAL consegue executar no celular a jornada principal sem recorrer ao web.

### Release Mobile 2 - Documento e administracao

Tasks 8 a 14:

- preview/PDF;
- recaptura completa;
- dashboard;
- Empresas/Apresentacao;
- Programas/Produtos/Tipos;
- Origens/metricas;
- Usuarios.

Resultado: ADMIN consegue operar os cadastros essenciais e o aplicativo cobre os principais fluxos web.

### Release Mobile 3 - Homologacao e lojas

Tasks 15 a 17:

- acessibilidade;
- performance;
- EAS;
- regressao;
- documentacao.

Resultado: build de homologacao apto a validacao interna.

---

## 7. Criterios de Aceite Gerais

1. O mobile consome a mesma API e os mesmos dados do sistema web.
2. Nenhuma migration ou regra de autorizacao e duplicada no aplicativo.
3. ADMIN e COMERCIAL veem somente rotas e acoes permitidas.
4. COMERCIAL cria e acompanha uma proposta completa pelo celular.
5. Lead exige origem e vira Cliente somente quando proposta e aceita.
6. O andamento mobile usa as mesmas etapas e status do web.
7. Produtos respeitam Empresa, Programa opcional e acesso ao catalogo.
8. A sugestao de investimento nao sobrescreve valor manual.
9. PDF possui Empresa, Cliente, produtos, investimento e contato, e pode ser compartilhado.
10. Avisos possuem badge, sheet pos-login, adiar e tratar.
11. ADMIN gerencia Usuarios, Empresas, Programas, Produtos, Tipos e Origens.
12. Sessao expirada redireciona uma vez, sem loop de `401`.
13. Offline permite leitura de cache, mas bloqueia mutacao.
14. Todas as telas possuem estados de carregamento, vazio, erro e repeticao.
15. Testes, typecheck e regressao web/API passam antes da homologacao.

---

## 8. Riscos e Mitigacoes

| Risco | Mitigacao |
|---|---|
| Escopo amplo gerar entrega longa | Entregar em tres releases e revisar ao fim de cada Task. |
| DTO manual divergir da API | Completar OpenAPI primeiro e validar respostas criticas com Zod. |
| Editor perder dados em rede lenta | Reducer local, fila de autosave serializada e confirmacao ao sair. |
| Kanban ficar ruim no toque | Pager horizontal e acao explicita de mover; drag nao e obrigatorio. |
| Mobile quebrar regra do web | API continua autoridade; executar regressao compartilhada. |
| PDF divergir visualmente | Testar HTML por conteudo e comparar documentos de 1, 4, 5 e 12 produtos. |
| Cache do TanStack mostrar dados de outro usuario | Limpar QueryClient no logout e na expiracao definitiva. |
| Rotas Admin acessadas por deep link | Guard central e validacao da API. |
| App fisico nao acessar localhost | Configurar URL explicita por ambiente e documentar IP/domino. |
| EAS expor segredo | Apenas URL publica no bundle; segredos permanecem no backend. |

---

## 9. Fora de Escopo

- Banco ou API exclusivos para o mobile.
- Alterar regras de negocio apenas para facilitar a interface.
- Push notifications.
- Escrita offline e sincronizacao de conflitos.
- Chat interno.
- Assinatura digital.
- Historico de versoes completo no mobile.
- Anexos de proposta.
- Analytics de produto externo.
- Cache Redis no aplicativo.

---

## Checklist da Implementacao

Este bloco deve ser atualizado durante a execucao, sem marcar itens antes da validacao correspondente.

- [x] Fase 1 - Fundacao confiavel
- [x] Fase 2 - Jornada comercial principal
- [x] Fase 3 - Administracao e operacao
- [x] Fase 4 - Configuracao e documentacao em codigo
- [x] Typecheck da API oficial aprovado
- [ ] Suite de integracao da API aprovada com banco de teste
- [x] Regressao de typecheck e build do sistema web aprovada
- [ ] iOS em aparelho real aprovado
- [ ] Android em aparelho real aprovado
- [x] Bundle iOS e Android gerado localmente
- [x] Documentacao mobile atualizada
- [x] Filtro de status do Dashboard respeitado no board mobile
- [x] Guards ADMIN/COMERCIAL aplicados nas arvores de navegacao
- [x] Permissoes de Lead/Cliente reforcadas na API oficial

### Validacoes Executadas Durante o Planejamento

- `pnpm --filter @workspace/mobile run typecheck` - aprovado em 27/07/2026.
- `pnpm --filter @workspace/mobile test` - 4 suites e 11 testes aprovados.
- `pnpm --filter @workspace/api-server run typecheck` - aprovado.
- `pnpm --filter @workspace/api-spec run codegen` - aprovado.
- `pnpm --filter @workspace/proposta run typecheck` - aprovado.
- `PORT=21709 BASE_PATH=/ pnpm --filter @workspace/proposta run build` - aprovado.
- `expo export --platform ios --platform android` - bundles gerados com sucesso.
- Inventario de rotas Expo, chamadas `apiCall`, telas web e endpoints Express revisado.
- Revisao tecnica independente executada; falhas de permissao, autosave concorrente, mutacoes de produtos e filtros foram corrigidas.

### Pendencias e Riscos Residuais

- A suite da API depende do PostgreSQL de teste em `localhost:5435`, indisponivel durante esta execucao.
- A regressao visual do sistema web nao foi executada nesta entrega mobile.
- O OpenAPI oficial recebeu os schemas utilizados pelo mobile, mas ainda precisa listar todos os paths operacionais novos.
- Os CRUDs administrativos mobile priorizam os campos essenciais; campos avancados continuam disponiveis no web.
- PDF paginado via Expo Print, deep links e builds EAS precisam de validacao em dispositivo real.
- A paginacao visual do PDF precisa ser homologada com descricoes longas e propostas de 0, 1, 4, 5 e 12 produtos; a estrutura de multiplas folhas possui teste automatizado.



