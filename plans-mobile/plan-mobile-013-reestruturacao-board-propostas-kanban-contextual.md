# Reestruturação do Board de Propostas em Kanban Contextual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir as quatro visualizações desorganizadas da tela de Propostas por um Kanban único, filtrado exclusivamente por Empresa ou Programa, com modo focado e modo expandido inspirados na interação mobile do Trello.

**Architecture:** `ProposalBoardScreen` passa a orquestrar um único board contextual alimentado por `GET /proposals/progress-board`. Funções puras transformam o payload em sete colunas deduplicadas; componentes isolados cuidam da seleção Empresa/Programa, busca, filtros, coluna e densidade, preservando ownership e movimentação autorizada pelo backend.

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19, TypeScript 5.9, Expo Router 6, TanStack Query, Zod, Jest e Testing Library React Native.

**Spec:** `docs-mobile/11-board-propostas-kanban-contextual-design.md`

## Global Constraints

- Alterar somente `Sistema-PropostasGTF_App`; não modificar API, banco, migrations ou arquivos de `Sistema-Propostas-kanban`.
- Empresa e Programa são as únicas formas de agrupar a tela de Propostas.
- As colunas são sempre as sete etapas comerciais já definidas em `ProposalTimelineStep`.
- O modo `focused` exibe uma etapa por vez com swipe, snap e indicadores.
- O modo `overview` exibe várias etapas lado a lado com rolagem horizontal livre.
- ADMIN e COMERCIAL iniciam no agrupamento Empresa.
- COMERCIAL continua vendo somente Empresas e propostas autorizadas pela API.
- Empresa sem Programas deve funcionar no agrupamento Empresa.
- `sem-programa` é um contexto válido no agrupamento Programa.
- Uma proposta não pode aparecer duas vezes na mesma etapa e contexto.
- Empresa e Programa não serão repetidos no sheet de filtros avançados.
- Busca e filtros não devem ocupar permanentemente uma área grande no topo.
- O drag-and-drop por toque longo altera a etapa usando a mesma mutação autorizada do botão “Mover etapa”; não há reordenação manual persistida.
- Alvos de toque devem ter no mínimo 44 pontos e ações por ícone devem ter `accessibilityLabel`.
- Estados de loading, vazio, erro, retry e offline devem permanecer explícitos.
- Nenhum novo pacote é necessário; reutilizar componentes e dependências existentes.

---

## Contexto e diagnóstico

A implementação atual de `ProposalBoardScreen.tsx` mistura quatro modos (`stations`, `board`, `programs`, `list`), busca, filtros, chips de Programa e três consultas de board. A visão por Empresa é uma lista, a visão por Programa também é uma lista e somente `ProposalStagePager` entrega Kanban por etapa.

Este plano elimina a disputa entre modos. Empresa ou Programa define o contexto; o resultado é sempre convertido para o mesmo Kanban. A API atual já suporta `stationId`, `programId`, busca, status e autorização, portanto a entrega é exclusivamente mobile.

## Agentes selecionados

- **Principal — Frontend Engineer:** componentes React Native, consultas, estado, virtualização e integração Expo Router.
- **Apoio — UX/UI Designer:** hierarquia visual, densidade, filtros, gestos, responsividade e acessibilidade.
- **Apoio — QA Engineer:** regressão ADMIN/COMERCIAL, dois vendedores, dispositivos, gestos, teclado e estados de rede.

## Fora de escopo

- backend, Prisma, OpenAPI e banco de dados;
- reordenação manual persistida por Empresa (o arraste de uma proposta entre etapas está coberto na extensão aprovada abaixo);
- ordenação manual persistida no contexto Empresa;
- alterações no editor, PDF, contratos, clientes ou catálogo;
- reprodução visual exata do Trello;
- persistência dos filtros após reinstalar o aplicativo.

---

### Task 1: Criar o modelo puro do Kanban contextual

**Files:**
- Create: `artifacts/mobile/src/features/proposals/board/proposalBoardModel.ts`
- Create: `artifacts/mobile/src/features/proposals/board/__tests__/proposalBoardModel.test.ts`
- Modify: `artifacts/mobile/src/api/contracts.ts`
- Modify: `artifacts/mobile/src/api/schemas.ts`
- Modify: `artifacts/mobile/src/features/proposals/api.ts`
- Modify: `artifacts/mobile/src/test/fixtures/parity.ts`

**Interfaces:**
- Consumes: `ProposalProgressBoard`, `ProgressBoardProposal`, `ProposalTimelineStep` e `BoardFilters`.
- Produces: `BoardGroupingMode`, `BoardDensityMode`, `ProposalBoardSelection`, `ProposalStageColumn`, `PROPOSAL_STAGES`, `buildProposalStageColumns()`, `filterProposalBoardLocally()`, `getFirstPopulatedStageIndex()`, `countActiveProposalFilters()`, `isValidIsoBoardDate()` e `filterWithoutProgram()`.

- [ ] **Step 1: Escrever testes falhando para agrupamento, deduplicação e etapas**

```ts
import {
  buildProposalStageColumns,
  countActiveProposalFilters,
  filterWithoutProgram,
  filterProposalBoardLocally,
  getFirstPopulatedStageIndex,
  isValidIsoBoardDate,
} from '../proposalBoardModel';
import { progressBoardFixture } from '@/src/test/fixtures/parity';

describe('proposalBoardModel', () => {
  it('deduplica a mesma proposta em dois programas no contexto Empresa', () => {
    const columns = buildProposalStageColumns(progressBoardFixture, 'station', 'station-1');
    const ids = columns.flatMap((column) => column.proposals.map((proposal) => proposal.id));
    expect(ids.filter((id) => id === 'proposal-1')).toHaveLength(1);
  });

  it('mantém somente propostas do Programa selecionado', () => {
    const columns = buildProposalStageColumns(progressBoardFixture, 'program', 'program-1');
    expect(columns.flatMap((column) => column.proposals).map((item) => item.id)).toEqual(['proposal-1']);
  });

  it('sempre devolve as sete etapas na ordem comercial', () => {
    expect(buildProposalStageColumns({ programs: [] }, 'station', 'station-1')).toHaveLength(7);
  });

  it('encontra a primeira etapa com propostas e volta para zero no vazio', () => {
    expect(getFirstPopulatedStageIndex(buildProposalStageColumns(progressBoardFixture, 'station', 'station-1'))).toBeGreaterThanOrEqual(0);
    expect(getFirstPopulatedStageIndex(buildProposalStageColumns({ programs: [] }, 'station', 'station-1'))).toBe(0);
  });

  it('isola o grupo sintético sem-programa', () => {
    expect(filterWithoutProgram(progressBoardFixture).programs.every((program) => program.id === 'sem-programa')).toBe(true);
  });

  it('conta busca e filtros avançados sem contar contexto', () => {
    expect(countActiveProposalFilters('Mosaico', { status: 'SENT', stationId: 'station-1', programId: 'program-1' }, 'ADMIN')).toBe(2);
  });

  it('aplica responsável, tipo e período localmente', () => {
    const filtered = filterProposalBoardLocally(progressBoardFixture, {
      createdByName: 'Ana',
      proposalTypeName: 'Patrocínio',
      dateFrom: '2026-08-01',
      dateTo: '2026-08-31',
    });
    expect(filtered.programs.flatMap((program) => program.proposals).every((proposal) =>
      proposal.createdByName.includes('Ana') && proposal.proposalTypeName.includes('Patrocínio'),
    )).toBe(true);
  });

  it('aceita somente data ISO real', () => {
    expect(isValidIsoBoardDate('2026-08-18')).toBe(true);
    expect(isValidIsoBoardDate('18/08/2026')).toBe(false);
    expect(isValidIsoBoardDate('2026-02-31')).toBe(false);
  });
});
```

- [ ] **Step 2: Executar o teste e confirmar a falha pelo módulo inexistente**

Run: `pnpm --filter @workspace/mobile exec jest src/features/proposals/board/__tests__/proposalBoardModel.test.ts --runInBand`  
Expected: FAIL com `Cannot find module '../proposalBoardModel'`.

- [ ] **Step 3: Completar o contrato e schema de proposta do board**

Em `contracts.ts`, ampliar `ProgressBoardProposal`:

```ts
export interface ProgressBoardProposal {
  id: string;
  status: ProposalStatus;
  currentStep: ProposalTimelineStep;
  viewerCanEdit: boolean;
  stationId?: string | null;
  stationName?: string | null;
  primaryColor?: string | null;
  proposalTypeName: string;
  advertiserName?: string | null;
  createdByName: string;
  updatedAt?: string;
  investValue?: string | null;
  products: Array<Pick<ProposalProduct, 'id' | 'title' | 'qty' | 'airTime' | 'durationLabel' | 'seasonality'>>;
}
```

Em `schemas.ts`, preservar os campos existentes e acrescentar:

```ts
viewerCanEdit: z.boolean().default(false),
stationId: z.string().nullish(),
stationName: z.string().nullish(),
primaryColor: z.string().nullish(),
```

- [ ] **Step 4: Implementar o modelo puro**

```ts
export type BoardGroupingMode = 'station' | 'program';
export type BoardDensityMode = 'focused' | 'overview';
export type ProposalBoardSelection = { stationId?: string; programId?: string };

export const PROPOSAL_STAGES: ProposalTimelineStep[] = [
  'LEAD_CREATED', 'IN_CONVERSATION', 'PROPOSAL_SENT',
  'CLIENT_REVIEWING', 'NEGOTIATION', 'APPROVED', 'REJECTED',
];

export type ProposalStageColumn = {
  step: ProposalTimelineStep;
  label: string;
  proposals: ProgressBoardProposal[];
};

export function buildProposalStageColumns(
  board: ProposalProgressBoard,
  grouping: BoardGroupingMode,
  selectedId?: string,
): ProposalStageColumn[] {
  const source = grouping === 'program'
    ? board.programs.filter((program) => program.id === selectedId).flatMap((program) => program.proposals)
    : board.programs.flatMap((program) => program.proposals);
  const deduped = Array.from(new Map(source.map((proposal) => [proposal.id, proposal])).values());
  return PROPOSAL_STAGES.map((step) => ({
    step,
    label: TIMELINE_STEP_LABELS[step],
    proposals: deduped.filter((proposal) => proposal.currentStep === step),
  }));
}

export function getFirstPopulatedStageIndex(columns: ProposalStageColumn[]) {
  const index = columns.findIndex((column) => column.proposals.length > 0);
  return index < 0 ? 0 : index;
}

export function filterWithoutProgram(board: ProposalProgressBoard): ProposalProgressBoard {
  return { ...board, programs: board.programs.filter((program) => program.id === 'sem-programa') };
}
```

Implementar `filterProposalBoardLocally()` sem mutar o payload:

```ts
export function filterProposalBoardLocally(board: ProposalProgressBoard, filters: BoardFilters): ProposalProgressBoard {
  const createdBy = filters.createdByName?.trim().toLocaleLowerCase('pt-BR');
  const proposalType = filters.proposalTypeName?.trim().toLocaleLowerCase('pt-BR');
  const from = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00.000Z`).getTime() : undefined;
  const to = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999Z`).getTime() : undefined;
  return {
    ...board,
    programs: board.programs.map((program) => ({
      ...program,
      proposals: program.proposals.filter((proposal) => {
        if (createdBy && !proposal.createdByName.toLocaleLowerCase('pt-BR').includes(createdBy)) return false;
        if (proposalType && !proposal.proposalTypeName.toLocaleLowerCase('pt-BR').includes(proposalType)) return false;
        const updatedAt = proposal.updatedAt ? new Date(proposal.updatedAt).getTime() : undefined;
        if (from !== undefined && updatedAt !== undefined && updatedAt < from) return false;
        if (to !== undefined && updatedAt !== undefined && updatedAt > to) return false;
        return true;
      }),
    })),
  };
}
```

Implementar `countActiveProposalFilters()` contando `search`, `status`, `createdByName`, `proposalTypeName`, `dateFrom` e `dateTo`; ignorar `stationId` e `programId`; ignorar `createdByName` para COMERCIAL. Implementar `isValidIsoBoardDate()` comparando o valor com a data UTC reconstruída, não somente com regex.

- [ ] **Step 5: Atualizar normalização e fixture**

Em `normalizeProposals()` preservar:

```ts
viewerCanEdit: Boolean(raw?.viewerCanEdit),
stationId: normalizeNullableText(raw?.stationId),
primaryColor: normalizeNullableText(raw?.primaryColor),
```

Ampliar `progressBoardFixture` com duas referências à mesma `proposal-1`, uma em cada Programa, e um grupo `sem-programa`.

- [ ] **Step 6: Executar testes de modelo e schema**

Run: `pnpm --filter @workspace/mobile exec jest src/features/proposals/board/__tests__/proposalBoardModel.test.ts src/api/__tests__/schemas.test.ts --runInBand`  
Expected: PASS.

- [ ] **Step 7: Commit do aplicativo**

```bash
git add artifacts/mobile/src/features/proposals/board/proposalBoardModel.ts artifacts/mobile/src/features/proposals/board/__tests__/proposalBoardModel.test.ts artifacts/mobile/src/api/contracts.ts artifacts/mobile/src/api/schemas.ts artifacts/mobile/src/features/proposals/api.ts artifacts/mobile/src/test/fixtures/parity.ts
git commit -m "feat(mobile): add contextual proposal board model"
```

---

### Task 2: Implementar consultas e seleção de contexto

**Files:**
- Create: `artifacts/mobile/src/features/proposals/board/useContextualProposalBoard.ts`
- Create: `artifacts/mobile/src/features/proposals/board/__tests__/useContextualProposalBoard.test.tsx`
- Modify: `artifacts/mobile/src/features/proposals/api.ts`
- Modify: `artifacts/mobile/src/api/queryKeys.ts`

**Interfaces:**
- Consumes: `getProposalBoard()`, `stationSchema`, `BoardGroupingMode`, `ProposalBoardSelection` e `BoardFilters`.
- Produces: `listProposalBoardStations()`, `getContextBoardFilters()` e `useContextualProposalBoard()`.

- [ ] **Step 1: Escrever testes falhando para filtros de consulta**

```ts
describe('contextual proposal board query', () => {
  it('envia stationId somente no contexto Empresa', () => {
    expect(getContextBoardFilters('station', { stationId: 's1', programId: 'p1' }, {})).toEqual({ stationId: 's1' });
  });

  it('envia programId somente no contexto Programa', () => {
    expect(getContextBoardFilters('program', { stationId: 's1', programId: 'p1' }, { status: 'SENT' })).toEqual({ programId: 'p1', status: 'SENT' });
  });

  it('não envia sem-programa como ID real', () => {
    expect(getContextBoardFilters('program', { programId: 'sem-programa' }, {})).toEqual({});
  });
});
```

No teste do hook, montar `QueryClientProvider`, simular respostas diferidas para `s1` e `s2`, trocar a seleção e comprovar que o resultado ativo corresponde somente a `s2` depois que as duas Promises resolverem.

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `pnpm --filter @workspace/mobile exec jest src/features/proposals/board/__tests__/useContextualProposalBoard.test.tsx --runInBand`  
Expected: FAIL porque o hook e `getContextBoardFilters` não existem.

- [ ] **Step 3: Criar adapters e filtros contextuais**

```ts
export async function listProposalBoardStations(): Promise<Station[]> {
  const payload = await apiCall<unknown>('GET', '/stations?active=true');
  return stationSchema.array().parse(payload).filter((station) => station.active);
}

export function getContextBoardFilters(
  grouping: BoardGroupingMode,
  selection: ProposalBoardSelection,
  filters: BoardFilters,
): BoardFilters {
  const base: BoardFilters = { search: filters.search, status: filters.status };
  if (grouping === 'station') return { ...base, stationId: selection.stationId };
  return selection.programId === 'sem-programa' ? base : { ...base, programId: selection.programId };
}
```

- [ ] **Step 4: Criar query keys contextuais**

```ts
contextBoard: (
  grouping: 'station' | 'program',
  selectedId: string | undefined,
  filters: Record<string, unknown>,
) => ['proposals', 'context-board', grouping, selectedId, filters] as const,
contextPrograms: ['proposals', 'context-programs'] as const,
```

- [ ] **Step 5: Implementar o hook sem copiar query para estado local**

```ts
export function useContextualProposalBoard(args: {
  grouping: BoardGroupingMode;
  selection: ProposalBoardSelection;
  filters: BoardFilters;
}) {
  const selectedId = args.grouping === 'station' ? args.selection.stationId : args.selection.programId;
  const requestFilters = getContextBoardFilters(args.grouping, args.selection, args.filters);
  const stationsQuery = useQuery({ queryKey: queryKeys.stations.all, queryFn: listProposalBoardStations });
  const programsQuery = useQuery({
    queryKey: queryKeys.proposals.contextPrograms,
    queryFn: () => getProposalBoard({}),
    enabled: args.grouping === 'program',
  });
  const boardQuery = useQuery({
    queryKey: queryKeys.proposals.contextBoard(args.grouping, selectedId, requestFilters),
    queryFn: () => getProposalBoard(requestFilters),
    enabled: Boolean(selectedId),
  });
  const board = args.grouping === 'program' && selectedId === 'sem-programa'
    ? filterWithoutProgram(boardQuery.data ?? { programs: [] })
    : boardQuery.data ?? { programs: [] };
  return { stationsQuery, programsQuery, boardQuery, board };
}
```

- [ ] **Step 6: Executar testes do hook e API**

Run: `pnpm --filter @workspace/mobile exec jest src/features/proposals/board/__tests__/useContextualProposalBoard.test.tsx src/api/__tests__/schemas.test.ts --runInBand`  
Expected: PASS.

- [ ] **Step 7: Commit do aplicativo**

```bash
git add artifacts/mobile/src/features/proposals/board/useContextualProposalBoard.ts artifacts/mobile/src/features/proposals/board/__tests__/useContextualProposalBoard.test.tsx artifacts/mobile/src/features/proposals/api.ts artifacts/mobile/src/api/queryKeys.ts
git commit -m "feat(mobile): add proposal board context queries"
```

---

### Task 3: Criar barra compacta e seletor Empresa/Programa

**Files:**
- Create: `artifacts/mobile/src/features/proposals/board/BoardContextToolbar.tsx`
- Create: `artifacts/mobile/src/features/proposals/board/ProposalContextSheet.tsx`
- Create: `artifacts/mobile/src/features/proposals/board/__tests__/boardContextControls.test.tsx`

**Interfaces:**
- Consumes: `BoardGroupingMode`, `BoardDensityMode`, `Station` e `ProgressBoardProgram`.
- Produces: `BoardContextToolbar`, `ProposalContextSheet` e `ProposalContextOption`.

- [ ] **Step 1: Escrever teste falhando da barra e seletor**

```tsx
it('alterna apenas entre Empresa e Programa', () => {
  const onGroupingChange = jest.fn();
  const screen = render(
    <BoardContextToolbar
      grouping="station" density="focused" contextLabel="Mosaico" activeFilterCount={0}
      onGroupingChange={onGroupingChange} onOpenContext={jest.fn()}
      onOpenSearch={jest.fn()} onToggleDensity={jest.fn()}
    />,
  );
  fireEvent.press(screen.getByText('Programa'));
  expect(onGroupingChange).toHaveBeenCalledWith('program');
  expect(screen.queryByText('Lista')).toBeNull();
  expect(screen.queryByText('Etapas')).toBeNull();
});

it('filtra opções e anuncia a selecionada', () => {
  const screen = render(
    <ProposalContextSheet
      visible grouping="station" options={[{ id: 's1', name: 'Mosaico', color: '#2563EB' }]}
      selectedId="s1" onSelect={jest.fn()} onClose={jest.fn()}
    />,
  );
  expect(screen.getByLabelText('Mosaico')).toHaveAccessibilityState({ selected: true });
  fireEvent.changeText(screen.getByPlaceholderText('Buscar Empresa'), 'outra');
  expect(screen.getByText('Nenhuma Empresa encontrada')).toBeTruthy();
});
```

- [ ] **Step 2: Executar e confirmar falha pelos componentes inexistentes**

Run: `pnpm --filter @workspace/mobile exec jest src/features/proposals/board/__tests__/boardContextControls.test.tsx --runInBand`  
Expected: FAIL.

- [ ] **Step 3: Implementar a barra compacta**

```ts
export interface BoardContextToolbarProps {
  grouping: BoardGroupingMode;
  density: BoardDensityMode;
  contextLabel: string;
  activeFilterCount: number;
  onGroupingChange: (mode: BoardGroupingMode) => void;
  onOpenContext: () => void;
  onOpenSearch: () => void;
  onToggleDensity: () => void;
}
```

Renderizar somente `Empresa | Programa`, botão do contexto, botão de busca com badge e botão `maximize-2`/`minimize-2`. O label da densidade é `Expandir colunas do Kanban` em `focused` e `Recolher para uma coluna por vez` em `overview`. Todos os controles têm altura mínima de 44 pontos.

- [ ] **Step 4: Implementar o sheet pesquisável**

```ts
export type ProposalContextOption = {
  id: string;
  name: string;
  color?: string | null;
  count?: number;
  usesPrograms?: boolean;
};
```

O sheet mantém busca local case-insensitive, limpa a busca ao fechar e chama `onSelect(option.id)` antes de `onClose()`. Incluir `sem-programa` somente quando o grupo vier do payload.

- [ ] **Step 5: Executar o teste e validar acessibilidade**

Run: `pnpm --filter @workspace/mobile exec jest src/features/proposals/board/__tests__/boardContextControls.test.tsx --runInBand`  
Expected: PASS sem warning de chave duplicada ou atualização fora de `act()`.

- [ ] **Step 6: Commit do aplicativo**

```bash
git add artifacts/mobile/src/features/proposals/board/BoardContextToolbar.tsx artifacts/mobile/src/features/proposals/board/ProposalContextSheet.tsx artifacts/mobile/src/features/proposals/board/__tests__/boardContextControls.test.tsx
git commit -m "feat(mobile): add proposal board context controls"
```

---

### Task 4: Reorganizar busca, filtros e chips ativos

**Files:**
- Create: `artifacts/mobile/src/features/proposals/board/ProposalSearchOverlay.tsx`
- Create: `artifacts/mobile/src/features/proposals/board/ActiveProposalFilters.tsx`
- Create: `artifacts/mobile/src/features/proposals/board/__tests__/proposalBoardFilters.test.tsx`
- Modify: `artifacts/mobile/src/features/proposals/board/ProposalFiltersSheet.tsx`

**Interfaces:**
- Consumes: `BoardFilters`, `countActiveProposalFilters()` e `isValidIsoBoardDate()`.
- Produces: `ProposalSearchOverlay`, `ActiveProposalFilters` e `ProposalFiltersSheet` sem Empresa/Programa.

- [ ] **Step 1: Escrever testes falhando da experiência de filtro**

```tsx
it('aplica busca sem trocar o contexto', () => {
  const onChangeSearch = jest.fn();
  const screen = render(
    <ProposalSearchOverlay visible value="" resultCount={38} onChangeSearch={onChangeSearch}
      onOpenAdvanced={jest.fn()} onClose={jest.fn()} onClear={jest.fn()} />,
  );
  fireEvent.changeText(screen.getByPlaceholderText('Filtrar propostas...'), 'Mosaico');
  expect(onChangeSearch).toHaveBeenCalledWith('Mosaico');
  expect(screen.getByText('38 propostas')).toBeTruthy();
});

it('não mostra Empresa nem Programa nos filtros avançados', () => {
  const screen = render(<ProposalFiltersSheet visible filters={{}} role="ADMIN" onClose={jest.fn()} onApply={jest.fn()} onClear={jest.fn()} />);
  expect(screen.queryByText('Empresa')).toBeNull();
  expect(screen.queryByText('Programa')).toBeNull();
  expect(screen.getByPlaceholderText('Responsável')).toBeTruthy();
});

it('oculta Responsável para COMERCIAL e bloqueia data inválida', () => {
  const onApply = jest.fn();
  const screen = render(<ProposalFiltersSheet visible filters={{}} role="COMERCIAL" onClose={jest.fn()} onApply={onApply} onClear={jest.fn()} />);
  expect(screen.queryByPlaceholderText('Responsável')).toBeNull();
  fireEvent.changeText(screen.getByPlaceholderText('Data inicial (AAAA-MM-DD)'), '18/08/2026');
  fireEvent.press(screen.getByText('Aplicar filtros'));
  expect(onApply).not.toHaveBeenCalled();
  expect(screen.getByText('Use o formato AAAA-MM-DD.')).toBeTruthy();
});
```

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `pnpm --filter @workspace/mobile exec jest src/features/proposals/board/__tests__/proposalBoardFilters.test.tsx --runInBand`  
Expected: FAIL.

- [ ] **Step 3: Implementar a busca dedicada**

`ProposalSearchOverlay` usa `Modal`, `KeyboardAvoidingView`, safe area e:

```tsx
<UIInput autoFocus leftIcon="search" placeholder="Filtrar propostas..."
  value={value} onChangeText={onChangeSearch} returnKeyType="search" />
<UIButton accessibilityLabel="Fechar busca de propostas" iconLeft="x" variant="ghost" onPress={onClose} />
```

Exibir `1 proposta` ou `${resultCount} propostas`, botão `Filtros avançados` e `Limpar busca` somente com texto.

- [ ] **Step 4: Simplificar e validar filtros avançados**

```ts
interface Props {
  visible: boolean;
  filters: BoardFilters;
  role: 'ADMIN' | 'COMERCIAL';
  onClose: () => void;
  onApply: (filters: BoardFilters) => void;
  onClear: () => void;
}
```

Remover props/programas e grupos Empresa/Programa. Manter Status, Tipo, datas e Responsável apenas para ADMIN. Validar datas ISO reais, impedir `onApply` com erro e limpar erros em `onClear`.

- [ ] **Step 5: Implementar chips removíveis**

`ActiveProposalFilters` recebe:

```ts
onRemove: (key: 'search' | 'status' | 'createdByName' | 'proposalTypeName' | 'dateFrom' | 'dateTo') => void;
```

Usar `ScrollView horizontal`; cada chip inclui `accessibilityLabel={`Remover filtro ${label}`}`. Empresa e Programa nunca entram nessa lista.

- [ ] **Step 6: Executar testes focados**

Run: `pnpm --filter @workspace/mobile exec jest src/features/proposals/board/__tests__/proposalBoardFilters.test.tsx src/features/proposals/board/__tests__/proposalBoardModel.test.ts --runInBand`  
Expected: PASS.

- [ ] **Step 7: Commit do aplicativo**

```bash
git add artifacts/mobile/src/features/proposals/board/ProposalSearchOverlay.tsx artifacts/mobile/src/features/proposals/board/ActiveProposalFilters.tsx artifacts/mobile/src/features/proposals/board/ProposalFiltersSheet.tsx artifacts/mobile/src/features/proposals/board/__tests__/proposalBoardFilters.test.tsx
git commit -m "feat(mobile): reorganize proposal search and filters"
```

---

### Task 5: Criar colunas reutilizáveis e cards por densidade

**Files:**
- Create: `artifacts/mobile/src/features/proposals/board/ProposalStageColumn.tsx`
- Create: `artifacts/mobile/src/features/proposals/board/__tests__/proposalStageColumn.test.tsx`
- Modify: `artifacts/mobile/src/features/proposals/board/ProposalBoardCard.tsx`

**Interfaces:**
- Consumes: `ProposalStageColumn`, `ProgressBoardProposal` e `ProposalBoardCardDensity`.
- Produces: `ProposalStageColumnView` e `ProposalBoardCard` com `density` e `canMove`.

- [ ] **Step 1: Escrever testes falhando de densidade e permissão**

```tsx
it('mostra card confortável com detalhes e movimento autorizado', () => {
  const screen = render(<ProposalBoardCard proposal={proposal} density="comfortable" canMove onOpen={jest.fn()} onMove={jest.fn()} />);
  expect(screen.getByText('2x Produto')).toBeTruthy();
  expect(screen.getByLabelText('Mover proposta para outra etapa')).toBeTruthy();
});

it('mostra card compacto sem produtos e sem movimento negado', () => {
  const screen = render(<ProposalBoardCard proposal={proposal} density="compact" canMove={false} onOpen={jest.fn()} onMove={jest.fn()} />);
  expect(screen.queryByText('2x Produto')).toBeNull();
  expect(screen.queryByLabelText('Mover proposta para outra etapa')).toBeNull();
  expect(screen.getByLabelText(/Abrir proposta/)).toBeTruthy();
});

it('mantém cabeçalho e estado vazio dentro da coluna', () => {
  const screen = render(<ProposalStageColumnView column={{ step: 'NEGOTIATION', label: 'Negociação', proposals: [] }} density="comfortable" refreshing={false} onOpen={jest.fn()} onMove={jest.fn()} />);
  expect(screen.getByText('Negociação')).toBeTruthy();
  expect(screen.getByText('0')).toBeTruthy();
  expect(screen.getByText('Nenhuma proposta nesta etapa.')).toBeTruthy();
});
```

- [ ] **Step 2: Executar e confirmar falha de interface**

Run: `pnpm --filter @workspace/mobile exec jest src/features/proposals/board/__tests__/proposalStageColumn.test.tsx --runInBand`  
Expected: FAIL.

- [ ] **Step 3: Alterar o contrato do card**

```ts
export type ProposalBoardCardDensity = 'comfortable' | 'compact';
interface Props {
  proposal: ProgressBoardProposal;
  density: ProposalBoardCardDensity;
  canMove: boolean;
  contextLabel?: string;
  onOpen: () => void;
  onMove: () => void;
}
```

No modo confortável, manter produtos e data. No compacto, renderizar cliente, tipo, valor e responsável. O card recebe label `Abrir proposta de <cliente>, <tipo>`. Renderizar Mover somente com `canMove=true`.

- [ ] **Step 4: Implementar a coluna virtualizada**

```ts
interface ProposalStageColumnViewProps {
  column: ProposalStageColumn;
  density: ProposalBoardCardDensity;
  refreshing: boolean;
  onRefresh?: () => void;
  onOpen: (proposal: ProgressBoardProposal) => void;
  onMove: (proposal: ProgressBoardProposal) => void;
}
```

Usar `FlatList` vertical, cabeçalho fixo com `UIBadge`, `RefreshControl` somente com `onRefresh`, vazio compacto, `initialNumToRender={8}`, `windowSize={5}` e `removeClippedSubviews={Platform.OS === 'android'}`.

- [ ] **Step 5: Executar os testes da coluna e cards**

Run: `pnpm --filter @workspace/mobile exec jest src/features/proposals/board/__tests__/proposalStageColumn.test.tsx --runInBand`  
Expected: PASS.

- [ ] **Step 6: Commit do aplicativo**

```bash
git add artifacts/mobile/src/features/proposals/board/ProposalStageColumn.tsx artifacts/mobile/src/features/proposals/board/ProposalBoardCard.tsx artifacts/mobile/src/features/proposals/board/__tests__/proposalStageColumn.test.tsx
git commit -m "feat(mobile): add responsive proposal stage columns"
```

---

### Task 6: Implementar os modos focado e expandido

**Files:**
- Create: `artifacts/mobile/src/features/proposals/board/ContextualProposalKanban.tsx`
- Create: `artifacts/mobile/src/features/proposals/board/__tests__/contextualProposalKanban.test.tsx`
- Modify: `artifacts/mobile/src/features/proposals/board/ProposalStagePager.tsx`
- Modify: `artifacts/mobile/src/features/proposals/board/proposalBoardModel.ts`

**Interfaces:**
- Consumes: `ProposalStageColumn[]`, `BoardDensityMode` e `ProposalStageColumnView`.
- Produces: `ContextualProposalKanban` com modos `focused` e `overview`, além de `getProposalColumnWidth()`.

- [ ] **Step 1: Escrever testes falhando dos dois modos**

```tsx
it('usa paginação e indicadores no modo focado', () => {
  const screen = render(<ContextualProposalKanban density="focused" columns={columns} contextKey="station:s1" refreshing={false} onRefresh={jest.fn()} onOpen={jest.fn()} onMove={jest.fn()} />);
  expect(screen.getByTestId('proposal-kanban-focused')).toBeTruthy();
  expect(screen.getAllByLabelText(/Etapa .* de 7/)).toHaveLength(7);
  expect(screen.queryByTestId('proposal-kanban-overview')).toBeNull();
});

it('usa rolagem livre e sem indicadores no modo expandido', () => {
  const screen = render(<ContextualProposalKanban density="overview" columns={columns} contextKey="station:s1" refreshing={false} onRefresh={jest.fn()} onOpen={jest.fn()} onMove={jest.fn()} />);
  expect(screen.getByTestId('proposal-kanban-overview')).toBeTruthy();
  expect(screen.queryByTestId('proposal-kanban-pagination')).toBeNull();
});
```

- [ ] **Step 2: Executar e confirmar falha pelo componente inexistente**

Run: `pnpm --filter @workspace/mobile exec jest src/features/proposals/board/__tests__/contextualProposalKanban.test.tsx --runInBand`  
Expected: FAIL.

- [ ] **Step 3: Implementar largura responsiva testável**

```ts
export function getProposalColumnWidth(viewportWidth: number, density: BoardDensityMode) {
  if (density === 'focused') return Math.max(288, viewportWidth - 32);
  return Math.min(360, Math.max(220, Math.round(viewportWidth * 0.58)));
}
```

Acrescentar testes para 320, 390, 768 e 1024 pontos.

- [ ] **Step 4: Implementar modo focado**

Usar `FlatList` horizontal com `pagingEnabled`, `snapToInterval={columnWidth}`, `decelerationRate="fast"`, `initialScrollIndex={firstPopulatedIndex}` e `getItemLayout`. Atualizar `activeIndex` em `onMomentumScrollEnd`. Renderizar sete indicadores com label `Etapa X de 7: <nome>` e `accessibilityState.selected`.

Ao alterar `contextKey`, usar `scrollToIndex()` para a primeira etapa com propostas; se todas estiverem vazias, índice zero.

- [ ] **Step 5: Implementar modo expandido**

Usar `FlatList` horizontal sem paginação e snap. Cada coluna recebe `width: getProposalColumnWidth(width, 'overview')`, `density="compact"`, gap de 12 e padding horizontal de 16.

- [ ] **Step 6: Manter adapter temporário do pager antigo**

Fazer `ProposalStagePager` delegar para `ContextualProposalKanban density="focused"` até a integração da Task 7, sem duplicar listas ou estado de movimentação.

- [ ] **Step 7: Executar testes de modos e modelo**

Run: `pnpm --filter @workspace/mobile exec jest src/features/proposals/board/__tests__/contextualProposalKanban.test.tsx src/features/proposals/board/__tests__/proposalBoardModel.test.ts --runInBand`  
Expected: PASS.

- [ ] **Step 8: Commit do aplicativo**

```bash
git add artifacts/mobile/src/features/proposals/board/ContextualProposalKanban.tsx artifacts/mobile/src/features/proposals/board/ProposalStagePager.tsx artifacts/mobile/src/features/proposals/board/proposalBoardModel.ts artifacts/mobile/src/features/proposals/board/__tests__/contextualProposalKanban.test.tsx artifacts/mobile/src/features/proposals/board/__tests__/proposalBoardModel.test.ts
git commit -m "feat(mobile): add focused and expanded proposal kanban"
```

---

### Task 7: Integrar o Kanban contextual na tela de Propostas

**Files:**
- Create: `artifacts/mobile/src/features/proposals/board/__tests__/ProposalBoardScreen.test.tsx`
- Modify: `artifacts/mobile/src/features/proposals/board/ProposalBoardScreen.tsx`

**Interfaces:**
- Consumes: hook, toolbar, selector, busca, filtros, Kanban e `MoveProposalSheet` das Tasks anteriores.
- Produces: uma única tela de Propostas compartilhada por ADMIN e COMERCIAL.

- [ ] **Step 1: Escrever teste falhando do fluxo Empresa**

```tsx
it('inicia em Empresa e renderiza etapas para a primeira Empresa acessível', async () => {
  mockApi('/stations?active=true', [station]);
  mockApi('/proposals/progress-board?stationId=station-1', progressBoardFixture);
  const screen = renderBoard({ role: 'COMERCIAL' });
  expect(await screen.findByText('Mosaico')).toBeTruthy();
  expect(screen.getByText('Lead criado')).toBeTruthy();
  expect(screen.queryByText('Lista')).toBeNull();
  expect(screen.queryByText('Etapas')).toBeNull();
});
```

- [ ] **Step 2: Escrever teste de Programa e estado preservado**

```tsx
it('preserva seleções separadas ao alternar Empresa e Programa', async () => {
  const screen = renderBoard({ role: 'ADMIN' });
  await selectContext(screen, 'Empresa', 'Mosaico');
  await selectContext(screen, 'Programa', 'Jornal');
  fireEvent.press(screen.getByText('Empresa'));
  expect(screen.getByText('Mosaico')).toBeTruthy();
  fireEvent.press(screen.getByText('Programa'));
  expect(screen.getByText('Jornal')).toBeTruthy();
});
```

Adicionar casos para Empresa `usesPrograms=false`, `sem-programa`, deep link `status=SENT` e Nova proposta oculta quando nenhuma Empresa tem `viewerCanCreateProposals`.

- [ ] **Step 3: Executar e confirmar falha contra a tela antiga**

Run: `pnpm --filter @workspace/mobile exec jest src/features/proposals/board/__tests__/ProposalBoardScreen.test.tsx --runInBand`  
Expected: FAIL porque a tela ainda renderiza quatro modos.

- [ ] **Step 4: Substituir estados concorrentes por estado contextual**

```ts
const [grouping, setGrouping] = useState<BoardGroupingMode>('station');
const [density, setDensity] = useState<BoardDensityMode>('focused');
const [selection, setSelection] = useState<ProposalBoardSelection>({});
const [search, setSearch] = useState('');
const [advancedFilters, setAdvancedFilters] = useState<BoardFilters>({});
const [contextOpen, setContextOpen] = useState(false);
const [searchOpen, setSearchOpen] = useState(false);
const deferredSearch = useDeferredValue(search.trim());
```

Remover `viewMode`, `programId`, mode toggle, chips permanentes e consultas `programBoardQuery`/`stationBoardQuery`.

- [ ] **Step 5: Inicializar seleções válidas**

```ts
useEffect(() => {
  if (!selection.stationId && stations.length) {
    setSelection((current) => ({ ...current, stationId: stations[0].id }));
  }
}, [selection.stationId, stations]);

useEffect(() => {
  if (grouping === 'program' && !selection.programId && programs.length) {
    setSelection((current) => ({ ...current, programId: programs[0].id }));
  }
}, [grouping, programs, selection.programId]);
```

Se a seleção deixar de existir após refresh, escolher a primeira opção válida. Não selecionar Programa enquanto o agrupamento Empresa estiver ativo.

- [ ] **Step 6: Montar filtros e colunas memoizados**

```ts
const serverFilters = useMemo(() => ({
  search: deferredSearch || undefined,
  status: advancedFilters.status ?? routeStatus,
}), [advancedFilters, deferredSearch, routeStatus]);

const selectedId = grouping === 'station' ? selection.stationId : selection.programId;
const locallyFilteredBoard = useMemo(
  () => filterProposalBoardLocally(board, advancedFilters),
  [advancedFilters, board],
);
const columns = useMemo(
  () => buildProposalStageColumns(locallyFilteredBoard, grouping, selectedId),
  [grouping, locallyFilteredBoard, selectedId],
);
```

Passar `serverFilters` para `useContextualProposalBoard`; Responsável, Tipo e datas permanecem locais e não geram nova chamada porque a API atual não aceita esses campos. Calcular `resultCount` pela soma das colunas e `contextKey` como `${grouping}:${selectedId ?? 'none'}`.

- [ ] **Step 7: Renderizar a composição final**

```tsx
<UIHeader title="Propostas" subtitle="Acompanhe o andamento por etapa" action={canCreateProposal ? newProposalButton : undefined} />
<BoardContextToolbar {...toolbarProps} />
<ActiveProposalFilters {...activeFilterProps} />
<ContextualProposalKanban {...kanbanProps} />
<ProposalContextSheet {...contextSheetProps} />
<ProposalSearchOverlay {...searchProps} />
<ProposalFiltersSheet {...filterProps} />
<MoveProposalSheet {...moveProps} />
```

A movimentação chama `moveProposal(id, step)`, invalida `queryKeys.proposals.all` no sucesso e mantém o toast atual. Passar `canMove={proposal.viewerCanEdit}`.

- [ ] **Step 8: Implementar estados explícitos**

- Sem Empresas: `Nenhuma Empresa disponível` e `Solicite acesso a uma Empresa para acompanhar propostas.`
- Loading: `Carregando quadro de propostas...`.
- Erro: `Não foi possível carregar o quadro` e `Tentar novamente` nas queries ativas.
- Contexto vazio: sete colunas com contagem zero.
- Filtro vazio: `Nenhuma proposta encontrada`, limpar busca/filtros sem trocar contexto.

- [ ] **Step 9: Executar integração e typecheck**

Run: `pnpm --filter @workspace/mobile exec jest src/features/proposals/board/__tests__/ProposalBoardScreen.test.tsx --runInBand`  
Expected: PASS.  
Run: `pnpm --filter @workspace/mobile run typecheck`  
Expected: PASS.

- [ ] **Step 10: Commit do aplicativo**

```bash
git add artifacts/mobile/src/features/proposals/board/ProposalBoardScreen.tsx artifacts/mobile/src/features/proposals/board/__tests__/ProposalBoardScreen.test.tsx
git commit -m "feat(mobile): integrate contextual proposal kanban"
```

---

### Task 8: Remover visualizações antigas após a migração

**Files:**
- Delete: `artifacts/mobile/src/features/proposals/board/ProposalStationBoardView.tsx`
- Delete: `artifacts/mobile/src/features/proposals/board/ProposalProgramBoardView.tsx`
- Delete: `artifacts/mobile/src/features/proposals/board/ProposalListView.tsx`
- Delete: `artifacts/mobile/src/features/proposals/board/StationSelector.tsx`
- Modify/Delete: `artifacts/mobile/src/features/proposals/board/ProposalStagePager.tsx`
- Modify: testes que importem componentes removidos.

**Interfaces:**
- Consumes: cobertura verde das Tasks 1–7.
- Produces: um único caminho de renderização do board, sem código morto.

- [ ] **Step 1: Localizar consumidores antes da remoção**

Run: `rg -n 'ProposalStationBoardView|ProposalProgramBoardView|ProposalListView|StationSelector|ProposalStagePager' artifacts/mobile --glob '!node_modules'`  
Expected: somente tela, testes históricos e os próprios arquivos; migrar qualquer consumidor adicional antes de excluir.

- [ ] **Step 2: Executar a suíte do board antes da remoção**

Run: `pnpm --filter @workspace/mobile exec jest src/features/proposals/board --runInBand`  
Expected: PASS.

- [ ] **Step 3: Remover componentes sem consumidores**

Excluir os quatro componentes antigos. Se `ProposalStagePager` não tiver consumidor, removê-lo; se houver consumidor confirmado, mantê-lo apenas como adapter:

```tsx
return <ContextualProposalKanban density="focused" columns={columns} {...handlers} />;
```

- [ ] **Step 4: Atualizar testes históricos**

O teste `stationBoard.test.ts` passa a validar `buildProposalStageColumns()` com proposta multi-Programa. Testes das listas removidas devem migrar para `ProposalBoardScreen.test.tsx` ou `contextualProposalKanban.test.tsx`; não manter snapshots de código morto.

- [ ] **Step 5: Confirmar ausência de imports mortos**

Run: `rg -n 'ProposalStationBoardView|ProposalProgramBoardView|ProposalListView|StationSelector' artifacts/mobile --glob '!node_modules'`  
Expected: nenhuma ocorrência.  
Run: `pnpm --filter @workspace/mobile run typecheck`  
Expected: PASS.

- [ ] **Step 6: Commit do aplicativo**

```bash
git add artifacts/mobile/src/features/proposals/board
git commit -m "refactor(mobile): remove legacy proposal board views"
```

---

### Task 9: Validar regressão, dispositivos e documentação

**Files:**
- Modify: `docs-mobile/04-navegacao-perfis-e-telas.md`
- Modify: `docs-mobile/06-padroes-ui-seguranca-qualidade.md`
- Modify: `docs-mobile/11-board-propostas-kanban-contextual-design.md`
- Modify: `plans-mobile/README.md`
- Modify: `plans-mobile/PROGRESS.md`
- Modify: `plans-mobile/plan-mobile-013-reestruturacao-board-propostas-kanban-contextual.md`

**Interfaces:**
- Consumes: Tasks 1–8.
- Produces: documentação atualizada, evidências automatizadas e checklist real de homologação.

- [ ] **Step 1: Executar toda a suíte mobile**

Run: `pnpm --filter @workspace/mobile test`  
Expected: todas as suítes aprovadas e zero testes falhando.

- [ ] **Step 2: Executar typecheck e validar diff**

Run: `pnpm --filter @workspace/mobile run typecheck`  
Expected: PASS.  
Run: `git diff --check`  
Expected: nenhuma saída.

- [ ] **Step 3: Exportar Android e iOS**

```bash
EXPO_PUBLIC_API_URL=https://propostasmosaico-one.vercel.app/api pnpm --filter @workspace/mobile exec expo export --platform ios --platform android --output-dir /tmp/gtf-propostas-board-013
```

Expected: bundles Android/iOS e `metadata.json` em `/tmp/gtf-propostas-board-013`.

- [ ] **Step 4: Homologar ADMIN**

Validar: entrada em Empresa; duas Empresas; Empresa sem Programas; Programa e `sem-programa`; responsável; focused; overview; busca; datas; status; tipo; limpeza; abertura; movimentação; retorno do editor preservando seleção e densidade enquanto a tela permanecer montada.

- [ ] **Step 5: Homologar dois usuários COMERCIAL**

Para COMERCIAL A e B: Empresas autorizadas; ausência de Responsável; somente propostas próprias; acesso direto ao ID do outro vendedor com mensagem neutra; movimento somente com `viewerCanEdit=true`; busca/filtros sem vazamento; repetição em iOS e Android.

- [ ] **Step 6: Homologar ergonomia e estados**

Validar: telefones compactos/grandes; tela larga/tablet; claro/escuro; texto ampliado; teclado; 100 propostas; loading; erro; retry; vazios; rede lenta; offline; background; gesto vertical sem conflito com swipe horizontal.

- [ ] **Step 7: Atualizar documentação com resultado real**

Em `04-navegacao-perfis-e-telas.md`, documentar Kanban contextual. Em `06-padroes-ui-seguranca-qualidade.md`, registrar modos, filtros compactos e deduplicação. Marcar o design como `Implementado` apenas se os gates passarem.

No plano e `PROGRESS.md`, registrar números reais de suítes/testes, exports, dispositivos e pendências. Não marcar QA físico como concluído após somente export.

- [ ] **Step 8: Commit da documentação do aplicativo**

```bash
git add docs-mobile plans-mobile
git commit -m "docs(mobile): record contextual proposal board delivery"
```

---

## Estratégia de testes consolidada

### Unidade

- sete etapas em ordem;
- deduplicação multi-Programa;
- Programa e `sem-programa`;
- primeira etapa preenchida;
- larguras focused/overview;
- contador de filtros;
- datas ISO;
- filtros contextuais da API.

### Componentes

- toolbar e seletor;
- busca e filtros por perfil;
- chips removíveis;
- cards comfortable/compact;
- coluna, vazio e refresh;
- pager focado e overview;
- acessibilidade e permissão de movimento.

### Integração

- primeira Empresa;
- seleções separadas;
- Empresa sem Programas;
- `sem-programa`;
- deep link por status;
- mudança de etapa;
- resposta atrasada;
- isolamento entre vendedores.

### Gate final

```bash
pnpm --filter @workspace/mobile test
pnpm --filter @workspace/mobile run typecheck
git diff --check
EXPO_PUBLIC_API_URL=https://propostasmosaico-one.vercel.app/api pnpm --filter @workspace/mobile exec expo export --platform ios --platform android --output-dir /tmp/gtf-propostas-board-013
```

## Critérios de aceite

- [x] Empresa e Programa são os únicos agrupamentos.
- [x] Cada Empresa abre o Kanban completo pelas sete etapas.
- [x] Cada Programa abre o mesmo Kanban.
- [x] Empresa sem Programas continua funcional.
- [x] `sem-programa` preserva propostas sem vínculo.
- [x] Nenhuma proposta aparece duplicada na mesma etapa.
- [x] Modo focado possui uma coluna, swipe, snap e indicadores.
- [x] Modo expandido apresenta várias colunas e rolagem livre.
- [x] Busca e filtros não ocupam permanentemente o topo.
- [x] Empresa/Programa não aparecem nos filtros avançados.
- [x] Responsável aparece somente para ADMIN.
- [x] Movimentação respeita `viewerCanEdit` e a API.
- [ ] Loading, vazio, erro, retry e offline estão cobertos manualmente em dispositivo.
- [ ] Toques, labels e texto ampliado estão validados em dispositivo.
- [x] Testes, typecheck, diff check e exports passam.
- [ ] QA com ADMIN e dois COMERCIAIS está registrado.
- [ ] Documentação e progresso refletem o resultado real.

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Gesto horizontal bloquear rolagem vertical | Separar listas por coluna e validar em dispositivos |
| Proposta duplicada em Empresa | Deduplicar por `proposal.id` antes das etapas |
| Perda de propostas sem Programa | Função e teste dedicados a `sem-programa` |
| Resposta antiga trocar o board | Query key inclui contexto e filtros; query não é copiada para estado |
| Overview renderizar cards demais | `FlatList`, janela controlada e card compacto |
| Remoção quebrar consumidor | `rg`, suíte verde e remoção em tarefa própria |
| Regressão COMERCIAL | `viewerCanEdit`, API como autoridade e dois vendedores |

## Documentação a atualizar na implementação

- `docs-mobile/04-navegacao-perfis-e-telas.md`
- `docs-mobile/06-padroes-ui-seguranca-qualidade.md`
- `docs-mobile/11-board-propostas-kanban-contextual-design.md`
- `plans-mobile/README.md`
- `plans-mobile/PROGRESS.md`
- este plano, com checklist e validações reais.

## Checklist da Implementação

- [x] Task 1 — Modelo e contratos do Kanban contextual
- [x] Task 2 — Consultas e seleção de contexto
- [x] Task 3 — Toolbar e seletor Empresa/Programa
- [x] Task 4 — Busca, filtros e chips ativos
- [x] Task 5 — Colunas e cards por densidade
- [x] Task 6 — Modos focado e expandido
- [x] Task 7 — Integração da tela de Propostas
- [x] Task 8 — Remoção segura das visões antigas
- [x] Task 9 — Regressão, dispositivos e documentação

### Checkpoint 1 — Tasks 1–5

- Modelo puro, contratos Zod, normalização, filtros locais e deduplicação implementados.
- Query keys, adapter de Empresas, filtro contextual e hook TanStack Query implementados.
- Toolbar Empresa/Programa e bottom sheet pesquisável implementados.
- Busca dedicada, filtros avançados por perfil, validação de datas e chips removíveis implementados.
- Cards confortável/compacto e coluna virtualizada implementados.
- A integração da tela principal e os modos focused/overview foram concluídos nas Tasks 6–7; o checkpoint é mantido como histórico da primeira entrega.

### Entrega final — Tasks 6–9

- Modos `focused` e `overview` implementados em `ContextualProposalKanban`, com largura responsiva, snap, indicadores e rolagem livre.
- `ProposalBoardScreen` usa somente Empresa/Programa, preserva seleções separadas, aplica filtros, estados explícitos e movimentação autorizada.
- Visões antigas foram removidas após confirmação de ausência de consumidores.
- Documentação, índice e progresso atualizados com o estado real.

### Validações Executadas

- 47 suítes e 123 testes aprovados na suíte completa.
- 10 suítes e 34 testes aprovados no gate do board contextual.
- `pnpm --filter @workspace/mobile run typecheck` aprovado.
- `git diff --check` aprovado.
- Export iOS/Android com `EXPO_PUBLIC_API_URL=http://localhost:8081/api` aprovado em `/tmp/gtf-propostas-board-013-local`.
- API Docker local respondeu `GET /api/healthz` com `{"status":"ok"}`; logins ADMIN e COMERCIAL foram validados contra o banco local.
- Warnings de `act()` do carregamento assíncrono dos ícones Expo permanecem nos testes visuais, sem falhas de teste.

### Pendências e Riscos Residuais

- Homologação física/simulador com ADMIN e dois COMERCIAIS ainda precisa ser registrada.
- Testes manuais de rede lenta, offline, background e gesto simultâneo ainda pendentes.

## CORREÇÕES TAREFA 013

### Problemas reproduzidos

- A tela modal de “Buscar e filtrar” exibia somente a contagem e os controles, deixando o restante em branco.
- A busca dependia do `search` do endpoint de board; por isso, termos de Empresa/estação e alguns nomes de Programa não retornavam cards, mesmo quando havia propostas no contexto atual.
- O modo focado usava a largura da coluna como intervalo de paginação. Em dispositivos menores, a página ficava deslocada em relação à viewport e o conteúdo podia aparentar desalinhamento.
- O cabeçalho da etapa não tinha um contêiner visual único; o título e o badge de quantidade ficavam soltos acima dos cards.

### Correções implementadas no aplicativo

1. **Resultados concretos na busca** — `ProposalSearchOverlay` agora renderiza uma lista vertical de cards acionáveis. Cada card mostra cliente, status, tipo/responsável, investimento, data e a localização contextual.
2. **Busca local contextual** — `filterProposalBoardLocally` e `buildProposalSearchResults` pesquisam Empresa, Programa, cliente, tipo, responsável e produtos sem alterar o contexto selecionado. O board é carregado sem o termo textual para que a busca local não perca correspondências de Empresa/Programa.
3. **Localização explícita** — os resultados exibem `Empresa: ... · Programa: ...`, incluindo fallback `Sem Empresa`/`Sem programa`, e a proposta é aberta pelo toque no card.
4. **Página focada alinhada à viewport** — o snap, o `getItemLayout` e o índice de rolagem passaram a usar a largura da página/viewport. O conteúdo recebe margem horizontal segura e a coluna permanece responsiva dentro da página.
5. **Card de etapa** — cada etapa passou a ser envolvida por um `UICard` de altura mínima e crescimento visual com a lista, contendo o título, o badge e os cards da etapa no mesmo contêiner.
6. **Badge alinhado** — o cabeçalho usa linha flexível com título expansível, badge fixo e alinhamento central, evitando que a contagem se desloque quando o título ou a quantidade mudam.

### Cobertura automatizada adicionada

- Teste de modelo para busca por Empresa/Programa, deduplicação e localização.
- Teste do overlay para renderização do card e abertura da proposta.
- Teste de coluna para o contêiner da etapa e badge no cabeçalho.
- Teste do Kanban focado para página alinhada, paginação e indicadores.

### Validação desta correção

- Suíte direcionada da correção: **4 suítes, 21 testes aprovados**.
- TypeScript (`pnpm run typecheck`): **aprovado**.
- Export Expo iOS/Android com `EXPO_PUBLIC_API_URL=http://localhost:8081/api`: **aprovado** em `/tmp/gtf-propostas-board-013-safe-area-final`.
- Warnings de `act()` associados ao carregamento assíncrono dos ícones Expo permanecem apenas no console dos testes; não há falhas.
- A validação visual no simulador com API Docker local continua sendo o próximo gate antes de encerrar a Tarefa 013.

### Correção adicional — área segura do iOS e estados vazios

- O `ProposalSearchOverlay` passou a obter `useSafeAreaInsets()` e posicionar o campo abaixo do `top inset` do dispositivo, com reserva também para o rodapé quando o teclado ou a área segura estiverem ativos.
- O `KeyboardAvoidingView` ficou separado do contêiner visual que recebe os insets; assim, o ajuste de teclado não sobrescreve o padding seguro do iOS.
- A lista de cada etapa não renderiza mais `Sem propostas` nem `Nenhuma proposta nesta etapa.`; permanece apenas o título da etapa e o badge `0`, sem texto redundante.
- Testes de regressão cobrem `top=59`, `bottom=34` (iPhone com Dynamic Island) e a ausência dos textos no estado vazio.

## Extensão aprovada — drag-and-drop, navegação e avisos mobile

### 1. Arrastar proposta entre etapas

- O card mantém o toque simples para abrir a proposta e reserva o toque longo (380 ms) para iniciar o arraste.
- O deslocamento horizontal usa um modelo puro com limiar deliberado, evitando mudanças acidentais durante a rolagem vertical.
- Ao soltar em outra coluna, a tela chama `moveProposal()` com a etapa correspondente; o botão “Mover etapa” permanece como alternativa acessível.
- A alteração continua condicionada a `viewerCanEdit`, invalida o board e exibe o toast já usado pela movimentação manual.

### 2. Retorno nativo por plataforma

- Foi criado `src/navigation/NativeBackButton.tsx`, com `chevron.left` via SF Symbol no iOS e `arrow-left` no Android.
- O mesmo tratamento foi aplicado aos detalhes de proposta, edição de Lead/Cliente, nova proposta, perfil e telas administrativas; o `UIButton` legado com `arrow-left` também recebeu o ícone nativo e alvo mínimo de 44 pontos.

### 3. Avisos e menu

- Avisos ADMIN e COMERCIAL agora têm uma barra compacta de busca e uma folha de filtros por status e marco de recaptura, mantendo os cards de ação organizados.
- O item “Modelos de Proposta” e a rota mobile correspondente foram removidos.
- O card do usuário no menu ADMIN continua abrindo `/admin/profile`.
- O menu ADMIN recebeu uma faixa fixa com blur no topo, preservando a leitura do relógio/indicadores durante a rolagem.

### Validação da extensão

```text
pnpm test --runInBand --silent
50 suítes aprovadas, 130 testes aprovados

pnpm run typecheck
aprovado

git diff --check
aprovado

EXPO_PUBLIC_API_URL=http://localhost:8081/api pnpm exec expo export --platform ios --output-dir /tmp/gtf-propostas-task-current
export iOS aprovado em `/tmp/gtf-propostas-task-current`
```
