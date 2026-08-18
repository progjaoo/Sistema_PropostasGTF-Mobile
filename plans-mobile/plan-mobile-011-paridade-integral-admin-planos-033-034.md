# Paridade Integral do ADMIN — Planos 033 e 034 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar no aplicativo todas as funcionalidades administrativas dos planos web 033 e 034, preservando a API e o PostgreSQL únicos.

**Execution scope:** Esta execução foi autorizada somente no `Sistema-PropostasGTF_App`. Nenhum arquivo ou commit foi criado no `Sistema-Propostas-kanban`; os passos de alteração de OpenAPI/codegen e commits abaixo ficam registrados como omitidos por esse limite.

**Architecture:** A implementação começa pela formalização dos contratos reais da API e por utilitários mobile compartilhados. Em seguida, evolui Empresas/Catálogo, Propostas, Usuários e Contratos em módulos independentes, usando TanStack Query para estado remoto, Zod para respostas críticas e Expo Router para navegação nativa.

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19, TypeScript 5.9, Expo Router 6, TanStack Query, Zustand, Zod, Jest, Testing Library React Native e API Express/Prisma compartilhada.

## Global Constraints

- Executar esta entrega antes do plano mobile 012 do perfil COMERCIAL.
- Alterações de API e OpenAPI pertencem a `../Sistema-Propostas-kanban`; não editar a cópia de backend do repositório mobile como fonte de verdade.
- Não criar Prisma, migration, SQL ou banco no aplicativo.
- Autorização ADMIN continua sendo validada pela API.
- Operações destrutivas exigem digitação exata do nome do recurso.
- Rejeição de proposta continua separada de exclusão permanente.
- Cálculos monetários locais usam centavos inteiros; transporte usa string decimal.
- Toda tela nova cobre carregamento, vazio, erro, retry, acessibilidade, tela pequena e conteúdo longo.
- Preservar as alterações locais existentes em `docs-mobile/rodar-local.md`, `plans-mobile/README.md` e no plano mobile 010.

---

## Estado Inicial Verificado

- `pnpm --filter @workspace/mobile test`: 20 suítes e 65 testes aprovados.
- `pnpm --filter @workspace/mobile run typecheck`: aprovado.
- O OpenAPI oficial já documenta contratos básicos, mas não cobre todos os paths implementados de exclusão administrativa, `station-board`, `usesPrograms` e propostas elegíveis para contratos.
- `deleteProposal()` chama hoje `DELETE /proposals/:id`, endpoint legado que rejeita a proposta.
- O PDF recebe o objeto atual da query sem aguardar o autosave pendente.

---

### Task 1: Formalizar contratos compartilhados e erros estruturados

**Files:**
- Modify: `../Sistema-Propostas-kanban/lib/api-spec/openapi.yaml`
- Regenerate: `../Sistema-Propostas-kanban/lib/api-client-react/src/generated/`
- Regenerate: `../Sistema-Propostas-kanban/lib/api-zod/src/generated/`
- Modify: `artifacts/mobile/src/api/client.ts`
- Modify: `artifacts/mobile/src/api/errors.ts`
- Modify: `artifacts/mobile/src/api/contracts.ts`
- Modify: `artifacts/mobile/src/api/schemas.ts`
- Modify: `artifacts/mobile/src/api/queryKeys.ts`
- Create: `artifacts/mobile/src/test/fixtures/parity.ts`
- Create: `artifacts/mobile/src/api/__tests__/structuredErrors.test.ts`
- Modify: `artifacts/mobile/src/api/__tests__/schemas.test.ts`

**Interfaces:**
- Produces: `ApiErrorPayload`, `StationDeletionImpact`, `StationProposalBoard`, `CommercialContract`, `CommercialContractSummary`, `CommercialContractForecastResponse`, `EligibleContractProposal`.
- Produces: `ApiError.payload`, `ApiError.code` and `ApiError.fieldErrors`.
- Produces query keys: `proposals.stationBoard`, `contracts.list`, `contracts.summary`, `contracts.forecast`, `contracts.eligible`, `stations.deletionImpact`.
- Produces reusable test factories and fixtures imported by later tasks from `src/test/fixtures/parity.ts`.

- [ ] **Step 1: Write failing structured-error tests**

```ts
import { ApiError, parseApiErrorPayload } from '../client';

it('preserves conflict metadata returned by the API', () => {
  const payload = parseApiErrorPayload(409, {
    code: 'STATION_PROGRAMS_IN_USE',
    error: 'Remova os vínculos antes de continuar',
    blockers: { activePrograms: 2, products: 4 },
  });
  const error = new ApiError(409, payload.message, payload);
  expect(error.code).toBe('STATION_PROGRAMS_IN_USE');
  expect(error.payload.blockers).toEqual({ activePrograms: 2, products: 4 });
});
```

- [ ] **Step 2: Run the test and verify the missing API**

Run: `pnpm --filter @workspace/mobile test -- structuredErrors.test.ts --runInBand`  
Expected: FAIL because `parseApiErrorPayload` and the third `ApiError` argument do not exist.

- [ ] **Step 3: Implement the structured error contract**

```ts
export type ApiErrorPayload = {
  message: string;
  code?: string;
  blockers?: Record<string, number>;
  fields?: unknown;
  requiresConfirmation?: boolean;
  [key: string]: unknown;
};

export class ApiError extends Error {
  readonly code?: string;
  readonly fieldErrors?: unknown;
  constructor(
    public readonly status: number,
    message: string,
    public readonly payload: ApiErrorPayload = { message },
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = payload.code;
    this.fieldErrors = payload.fields;
  }
}
```

Atualizar `apiCall()` para ler o JSON uma única vez em respostas não OK, normalizar `error` string/objeto e lançar `ApiError` com o payload completo.

- [x] **Step 4: Complete the canonical OpenAPI — omitido por escopo app-only**

Documentar exatamente:

```text
GET    /stations/{id}/deletion-impact
DELETE /stations/{id}/permanent
DELETE /stations/{id}
GET    /proposals/station-board
DELETE /proposals/{id}/permanent
GET    /contracts/eligible-proposals
```

Adicionar `usesPrograms` a `Station`, `StationInput` e `StationUpdate`; adicionar schemas de impacto, quadro por Empresa, contratos elegíveis e respostas `409` estruturadas.

- [ ] **Step 5: Add critical mobile schemas and fixtures**

```ts
export const stationDeletionImpactSchema = z.object({
  stationId: z.string(),
  canDelete: z.boolean(),
  blockers: z.object({ proposals: z.number().int(), referencedProposalProducts: z.number().int() }),
  removable: z.object({
    products: z.number().int(),
    programs: z.number().int(),
    proposalTemplates: z.number().int(),
    presentationItems: z.number().int(),
    userAccesses: z.number().int(),
  }),
});
```

Criar fixtures reutilizáveis com todos os campos obrigatórios atuais:

```ts
import type { Advertiser, AuthUser, ProductTemplate, Proposal, Station } from '@/src/types';
import type {
  AdvertiserWithProposals,
  CommercialContract,
  CommercialContractForecastResponse,
  CommercialContractSummary,
  StationProposalBoard,
} from '@/src/api/contracts';

export const makeUser = (patch: Partial<AuthUser> = {}): AuthUser => ({
  id: 'user-1', name: 'Ana', email: 'ana@example.com', role: 'COMERCIAL', active: true,
  createdAt: '2026-08-01T00:00:00.000Z', ...patch,
});
export const makeStation = (patch: Partial<Station> = {}): Station => ({
  id: 'station-1', name: 'Rádio Centro', primaryColor: '#427EFF', active: true,
  usesPrograms: true, createdAt: '2026-08-01T00:00:00.000Z', ...patch,
});
export const makeAdvertiser = (patch: Partial<Advertiser> = {}): Advertiser => ({
  id: 'advertiser-1', tradeName: 'Cliente Centro', active: true, status: 'LEAD',
  createdAt: '2026-08-01T00:00:00.000Z', ...patch,
});
export const makeProposal = (patch: Partial<Proposal> = {}): Proposal => ({
  id: 'proposal-1', stationId: 'station-1', station: makeStation(), advertiserId: 'advertiser-1',
  advertiser: makeAdvertiser(), createdById: 'user-1', createdBy: makeUser(), status: 'DRAFT',
  propType: 'Comercial', propMonth: '08', propYear: '2026', showPeriod: true,
  overlayOpacity: 0, stats: [], products: [], createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z', viewerCanEdit: true, ...patch,
});
export const stationFixture = makeStation();
export const impactFixture = { stationId: stationFixture.id, canDelete: false, blockers: { proposals: 2, referencedProposalProducts: 1 }, removable: { products: 4, programs: 2, proposalTemplates: 1, presentationItems: 4, userAccesses: 3 } };
export const admin = makeUser({ id: 'admin-1', role: 'ADMIN' });
export const sellerA = makeUser({ id: 'seller-a' });
export const sellerB = makeUser({ id: 'seller-b', name: 'Bruno', email: 'bruno@example.com' });
export const sellerAProposal = makeProposal({ createdById: sellerA.id, createdBy: sellerA });
export const sellerBProposal = makeProposal({ id: 'proposal-b', createdById: sellerB.id, createdBy: sellerB });
export const olderProposal = makeProposal({ investValue: '100.00' });
export const newerProposal = makeProposal({ investValue: '200.00' });
export const stationBoardFixture: StationProposalBoard = {
  stations: [{
    id: stationFixture.id,
    name: stationFixture.name,
    primaryColor: stationFixture.primaryColor,
    usesPrograms: stationFixture.usesPrograms,
    proposalCount: 1,
    investmentTotal: 100,
    proposals: [{
      id: sellerAProposal.id,
      status: sellerAProposal.status,
      statusLabel: 'Em conversa',
      advertiserId: sellerAProposal.advertiserId,
      advertiserName: sellerAProposal.advertiser!.tradeName,
      advertiserStatus: sellerAProposal.advertiser?.status ?? null,
      proposalTypeName: sellerAProposal.propType,
      createdByName: sellerA.name,
      investValue: sellerAProposal.investValue ?? null,
      updatedAt: sellerAProposal.updatedAt,
      currentStep: 'IN_CONVERSATION',
      currentStepLabel: 'Em conversa',
      programNames: [],
      products: [],
    }],
  }],
};
export const leadFixture: AdvertiserWithProposals = { ...makeAdvertiser(), proposals: [] };
export const clientFixture: AdvertiserWithProposals = {
  ...makeAdvertiser({ id: 'client-1', status: 'CLIENT' }), proposals: [],
};
export const allowedStation = makeStation({ viewerCanViewCatalog: true });
export const productFixture: ProductTemplate = {
  id: 'product-1', stationId: allowedStation.id, title: 'Spot 30s', color: 'BLUE',
  suggestedValue: '1500.00', durationLabel: '30 segundos', active: true,
  createdAt: '2026-08-01T00:00:00.000Z',
};
export const ownContract: CommercialContract = {
  id: 'contract-1', ownerId: sellerA.id, ownerName: sellerA.name,
  advertiserId: clientFixture.id, advertiserName: clientFixture.tradeName,
  proposalId: sellerAProposal.id, proposalName: 'Proposta agosto', stationName: stationFixture.name,
  monthlyValue: '2500.00', saleDate: '2026-08-10', startDate: '2026-09-01',
  endDate: '2027-08-31', installmentDueDay: 10, status: 'ACTIVE',
  createdAt: '2026-08-10T00:00:00.000Z', updatedAt: '2026-08-10T00:00:00.000Z',
};
export const summaryFixture: CommercialContractSummary = {
  month: '2026-08', soldThisMonth: '2500.00', expectedRevenue: '2500.00',
  activeContracts: 1, endingIn30Days: 0,
};
export const forecastFixture: CommercialContractForecastResponse = {
  from: '2026-08', months: 2,
  data: [{ month: '2026-08', expectedRevenue: '2500.00' }, { month: '2026-09', expectedRevenue: '2500.00' }],
};
```

Adicionar fixtures válidas e inválidas a `schemas.test.ts`; cada fixture válida acima deve passar pelo schema correspondente.

- [x] **Step 6: Regenerate the official clients — omitido por escopo app-only**

Run: `pnpm --filter @workspace/api-spec run codegen` in `../Sistema-Propostas-kanban`  
Expected: generated React and Zod clients include the six paths above and compile without manual edits.

- [x] **Step 7: Run contract verification**

Run:

```bash
pnpm --filter @workspace/mobile test -- structuredErrors.test.ts schemas.test.ts --runInBand
pnpm --filter @workspace/mobile run typecheck
```

Expected: PASS.

- [x] **Step 8: Commit — omitido por instrução do usuário**

```bash
git add lib/api-spec lib/api-client-react/src/generated lib/api-zod/src/generated
git commit -m "docs(api): complete mobile parity contracts"
git add artifacts/mobile/src/api
git commit -m "feat(mobile): add structured parity contracts"
```

Não executar commits nesta entrega. O usuário determinou que `Sistema-Propostas-kanban` não deve receber alterações nem commits; o aplicativo também foi deixado sem commit para preservar o controle do workspace.

---

### Task 2: Criar confirmação destrutiva com digitação

**Files:**
- Create: `artifacts/mobile/src/ui/TypedConfirmDialog.tsx`
- Modify: `artifacts/mobile/src/ui/index.ts`
- Create: `artifacts/mobile/src/ui/__tests__/TypedConfirmDialog.test.tsx`

**Interfaces:**
- Produces: `TypedConfirmDialogProps { visible, title, resourceName, description, confirmLabel, pending, onCancel, onConfirm }`.
- Consumes: tokens e componentes `UIBottomSheet`, `UIInput`, `UIButton`.

- [ ] **Step 1: Write failing interaction tests**

```tsx
it('enables the destructive action only after an exact name match', () => {
  const onConfirm = jest.fn();
  const screen = render(
    <TypedConfirmDialog visible title="Excluir empresa" resourceName="Rádio Centro" description="A exclusão é permanente." confirmLabel="Excluir permanentemente" pending={false} onCancel={jest.fn()} onConfirm={onConfirm} />,
  );
  expect(screen.getByRole('button', { name: 'Excluir permanentemente' })).toBeDisabled();
  fireEvent.changeText(screen.getByLabelText('Digite Rádio Centro para confirmar'), 'Rádio Centro');
  fireEvent.press(screen.getByRole('button', { name: 'Excluir permanentemente' }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `pnpm --filter @workspace/mobile test -- TypedConfirmDialog.test.tsx --runInBand`  
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the dialog**

O componente deve limpar a confirmação ao abrir/trocar de recurso, usar comparação exata após `trim()`, manter alvo de toque de 44 pontos, bloquear fechamento durante mutation e anunciar o impacto com `accessibilityLiveRegion="polite"`.

- [ ] **Step 4: Run focused tests and typecheck**

Run:

```bash
pnpm --filter @workspace/mobile test -- TypedConfirmDialog.test.tsx --runInBand
pnpm --filter @workspace/mobile run typecheck
```

Expected: PASS.

- [x] **Step 5: Commit — omitido por instrução do usuário**

```bash
git add artifacts/mobile/src/ui
git commit -m "feat(mobile): add typed destructive confirmation"
```

---

### Task 3: Entregar ciclo administrativo de Empresa e `usesPrograms`

**Files:**
- Modify: `artifacts/mobile/src/types/index.ts`
- Create: `artifacts/mobile/src/features/admin/stations/api.ts`
- Create: `artifacts/mobile/src/features/admin/stations/__tests__/stationAdmin.test.ts`
- Modify: `artifacts/mobile/app/admin/stations/index.tsx`
- Modify: `artifacts/mobile/app/admin/stations/[id].tsx`

**Interfaces:**
- Consumes: `Station.usesPrograms`, `StationDeletionImpact`, `TypedConfirmDialog`.
- Produces: `parseStation(input)`, `parseStationDeletionImpact(input)`, `getStationDeletionImpact(id)`, `deactivateStation(id)`, `permanentlyDeleteStation(id)`.

- [ ] **Step 1: Add failing API mapping tests**

```ts
it('keeps usesPrograms and deletion counts', () => {
  expect(parseStation({ ...stationFixture, usesPrograms: false }).usesPrograms).toBe(false);
  expect(parseStationDeletionImpact(impactFixture).blockers.proposals).toBe(2);
});
```

- [ ] **Step 2: Run the focused test**

Run: `pnpm --filter @workspace/mobile test -- stationAdmin.test.ts --runInBand`  
Expected: FAIL because the station admin API module does not exist.

- [ ] **Step 3: Add station domain operations**

```ts
export const parseStation = (input: unknown): Station => stationSchema.parse(input);
export const parseStationDeletionImpact = (input: unknown): StationDeletionImpact =>
  stationDeletionImpactSchema.parse(input);

export const getStationDeletionImpact = async (id: string) =>
  parseStationDeletionImpact(await apiCall('GET', `/stations/${id}/deletion-impact`));

export const deactivateStation = (id: string) => apiCall<Station>('DELETE', `/stations/${id}`);
export const permanentlyDeleteStation = (id: string) =>
  apiCall<{ id: string; message: string }>('DELETE', `/stations/${id}/permanent`);
```

- [ ] **Step 4: Add the `usesPrograms` switch to create/edit**

Persistir `{ usesPrograms }` no POST/PATCH. Ao receber `409/STATION_PROGRAMS_IN_USE`, manter o valor anterior e exibir `activePrograms` e `products` retornados pela API.

- [ ] **Step 5: Add deactivate and permanent-delete actions**

Na Empresa existente:

- `Desativar` usa confirmação simples e preserva histórico;
- `Excluir permanentemente` busca o impacto antes de abrir o diálogo digitado;
- impacto bloqueado mostra propostas e produtos históricos;
- impacto permitido lista Produtos, Programas, Modelos, Apresentação e Acessos que serão removidos.

- [ ] **Step 6: Invalidate dependent caches**

Invalidar `stations.all`, catálogos administrativos, usuários, `proposals.stationBoard` e contratos após sucesso.

- [ ] **Step 7: Run tests and typecheck**

Run:

```bash
pnpm --filter @workspace/mobile test -- stationAdmin.test.ts TypedConfirmDialog.test.tsx --runInBand
pnpm --filter @workspace/mobile run typecheck
```

Expected: PASS.

- [x] **Step 8: Commit — omitido por instrução do usuário**

```bash
git add artifacts/mobile/src/types artifacts/mobile/src/features/admin/stations artifacts/mobile/app/admin/stations
git commit -m "feat(mobile): add admin station lifecycle"
```

---

### Task 4: Condicionar Programas e Produtos à Empresa

**Files:**
- Modify: `artifacts/mobile/src/features/admin/catalog/CatalogListScreen.tsx`
- Create: `artifacts/mobile/src/features/admin/catalog/catalogRules.ts`
- Create: `artifacts/mobile/src/features/admin/catalog/__tests__/catalogRules.test.ts`
- Modify: `artifacts/mobile/app/admin/programs/index.tsx`
- Modify: `artifacts/mobile/app/admin/products/index.tsx`

**Interfaces:**
- Consumes: `Station.usesPrograms`.
- Produces: `canManagePrograms(station)`, `normalizeProductProgram(station, programId)`.

- [ ] **Step 1: Write failing business-rule tests**

```ts
expect(canManagePrograms({ usesPrograms: false })).toBe(false);
expect(normalizeProductProgram({ usesPrograms: false }, 'program-1')).toBeNull();
expect(normalizeProductProgram({ usesPrograms: true }, 'program-1')).toBe('program-1');
```

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm --filter @workspace/mobile test -- catalogRules.test.ts --runInBand`  
Expected: FAIL because the rule module does not exist.

- [ ] **Step 3: Implement pure catalog rules**

Implementar as duas funções sem acessar UI ou rede.

- [ ] **Step 4: Apply rules to catalog forms**

- Produtos ocultam Programa quando `usesPrograms === false` e enviam `programId: null`.
- Programas bloqueiam o CTA `Novo` para Empresa sem Programas e explicam a configuração necessária.
- Trocar a Empresa de um Produto limpa `programId` incompatível.
- Erros `409` exibem a mensagem real da API.

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```bash
pnpm --filter @workspace/mobile test -- catalogRules.test.ts --runInBand
pnpm --filter @workspace/mobile run typecheck
```

Expected: PASS.

- [x] **Step 6: Commit — omitido por instrução do usuário**

```bash
git add artifacts/mobile/src/features/admin/catalog artifacts/mobile/app/admin/programs artifacts/mobile/app/admin/products
git commit -m "feat(mobile): respect station program configuration"
```

---

### Task 5: Criar visão ADMIN de propostas por Empresa

**Files:**
- Modify: `artifacts/mobile/src/api/contracts.ts`
- Modify: `artifacts/mobile/src/api/schemas.ts`
- Modify: `artifacts/mobile/src/features/proposals/api.ts`
- Create: `artifacts/mobile/src/features/proposals/board/ProposalStationBoardView.tsx`
- Create: `artifacts/mobile/src/features/proposals/board/StationSelector.tsx`
- Create: `artifacts/mobile/src/features/proposals/board/__tests__/stationBoard.test.ts`
- Modify: `artifacts/mobile/src/features/proposals/board/ProposalBoardScreen.tsx`

**Interfaces:**
- Produces: `getProposalStationBoard(filters): Promise<StationProposalBoard>`.
- Consumes: `BoardFilters`, `ProposalStagePager`, `ProposalListView`.
- Produces view modes for ADMIN: `stations | programs | stages | list`; initial mode `stations`.

- [ ] **Step 1: Add failing schema/no-duplication tests**

```ts
it('keeps one proposal under its station even with products from two programs', () => {
  const board = stationProposalBoardSchema.parse(stationBoardFixture);
  expect(board.stations[0].proposals.filter((item) => item.id === 'proposal-1')).toHaveLength(1);
  expect(board.stations[0].proposals[0].programNames).toEqual(['Jornal', 'Esporte']);
});
```

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm --filter @workspace/mobile test -- stationBoard.test.ts --runInBand`  
Expected: FAIL because `stationProposalBoardSchema` and view do not exist.

- [ ] **Step 3: Implement the endpoint adapter**

Enviar `search`, `stationId`, `programId`, `status` e `createdById` ao endpoint. Não enviar filtros locais com nomes incompatíveis.

- [ ] **Step 4: Implement the station selector and summary**

Cada Empresa exibe nome, cor, quantidade de propostas e investimento total. Empresa sem Programas não exibe filtro nem texto `Sem programa`.

- [ ] **Step 5: Make station mode the ADMIN default**

Ler o papel do `authStore`. COMERCIAL continua no modo de etapas até a Entrega 2. Preservar Programas e Lista como modos secundários.

- [ ] **Step 6: Verify loading, empty and error states**

Separar `Empresa sem propostas`, `Nenhuma Empresa encontrada` e `Falha ao carregar`. Retry deve refazer apenas a query ativa.

- [ ] **Step 7: Run tests and typecheck**

Run:

```bash
pnpm --filter @workspace/mobile test -- stationBoard.test.ts schemas.test.ts --runInBand
pnpm --filter @workspace/mobile run typecheck
```

Expected: PASS.

- [x] **Step 8: Commit — omitido por instrução do usuário**

```bash
git add artifacts/mobile/src/api artifacts/mobile/src/features/proposals
git commit -m "feat(mobile): add admin station proposal board"
```

---

### Task 6: Extrair autosave serializado com `flush()`

**Files:**
- Create: `artifacts/mobile/src/features/proposals/editor/proposalPayload.ts`
- Create: `artifacts/mobile/src/features/proposals/editor/useProposalAutosave.ts`
- Create: `artifacts/mobile/src/features/proposals/editor/__tests__/proposalPayload.test.ts`
- Create: `artifacts/mobile/src/features/proposals/editor/__tests__/useProposalAutosave.test.tsx`
- Modify: `artifacts/mobile/app/proposal/[id].tsx`

**Interfaces:**
- Produces: `cleanProposalPatch(patch: Partial<Proposal>): ProposalUpdatePayload`.
- Produces: `useProposalAutosave({ proposalId, save, onSaved, onError })` returning `{ schedule, flush, status, error, hasPendingChanges }`.

- [ ] **Step 1: Write failing payload allowlist test**

```ts
expect(cleanProposalPatch({
  investValue: '1500.00',
  station: stationFixture,
  createdBy: makeUser(),
} as Proposal)).toEqual({ investValue: '1500.00' });
```

- [ ] **Step 2: Write failing concurrency/flush test**

```tsx
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
};

it('flushes the newest revision and ignores an older response', async () => {
  const first = deferred<Proposal>();
  const save = jest.fn().mockReturnValueOnce(first.promise).mockResolvedValueOnce(newerProposal);
  const { result } = renderHook(() => useProposalAutosave({ proposalId: 'p1', save, onSaved: jest.fn(), onError: jest.fn(), delayMs: 20 }));
  act(() => result.current.schedule({ investValue: '100.00' }));
  await act(async () => jest.advanceTimersByTime(20));
  act(() => result.current.schedule({ investValue: '200.00' }));
  const flushing = result.current.flush();
  first.resolve(olderProposal);
  await flushing;
  expect(save).toHaveBeenLastCalledWith({ investValue: '200.00' });
});
```

- [ ] **Step 3: Run focused tests and verify failure**

Run: `pnpm --filter @workspace/mobile test -- proposalPayload.test.ts useProposalAutosave.test.tsx --runInBand`  
Expected: FAIL because both modules do not exist.

- [ ] **Step 4: Implement the payload allowlist and queue**

O hook deve:

- manter uma revisão em voo;
- mesclar alterações posteriores em uma revisão pendente;
- impedir resposta antiga de atualizar cache quando houver revisão nova;
- fazer `flush()` cancelar o debounce, iniciar a revisão pendente e aguardar toda a fila;
- preservar o payload em erro para nova tentativa;
- expor estados `idle | dirty | saving | saved | error`.

- [ ] **Step 5: Replace the inline editor queue**

Remover `saveTimeout`, `pendingSave`, `saveQueue` e `saveGeneration` da tela. Usar o hook e atualizar o indicador visual existente.

- [ ] **Step 6: Run tests and typecheck**

Run:

```bash
pnpm --filter @workspace/mobile test -- proposalPayload.test.ts useProposalAutosave.test.tsx --runInBand
pnpm --filter @workspace/mobile run typecheck
```

Expected: PASS.

- [x] **Step 7: Commit — omitido por instrução do usuário**

```bash
git add artifacts/mobile/src/features/proposals/editor artifacts/mobile/app/proposal
git commit -m "feat(mobile): add deterministic proposal autosave"
```

---

### Task 7: Separar rejeição, exclusão permanente e geração de PDF

**Files:**
- Modify: `artifacts/mobile/src/features/proposals/api.ts`
- Modify: `artifacts/mobile/app/proposal/[id].tsx`
- Create: `artifacts/mobile/src/features/proposals/editor/criticalActions.ts`
- Create: `artifacts/mobile/src/features/proposals/editor/__tests__/criticalActions.test.ts`
- Modify: `artifacts/mobile/src/features/proposals/print/useProposalPdf.ts`

**Interfaces:**
- Produces: `permanentlyDeleteProposal(id)` using `DELETE /proposals/:id/permanent`.
- Consumes: `autosave.flush(): Promise<Proposal | void>`.
- Produces: `runAfterProposalFlush(action)` to gate PDF, status and navigation.

- [ ] **Step 1: Write failing critical-action tests**

```ts
it('waits for flush before sharing the PDF', async () => {
  const order: string[] = [];
  await runAfterProposalFlush(
    async () => { order.push('flush'); },
    async () => { order.push('pdf'); },
  );
  expect(order).toEqual(['flush', 'pdf']);
});
```

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm --filter @workspace/mobile test -- criticalActions.test.ts --runInBand`  
Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Add explicit permanent-delete API**

```ts
export const permanentlyDeleteProposal = (proposalId: string) =>
  apiCall<{ id: string; message: string }>('DELETE', `/proposals/${proposalId}/permanent`);
```

Manter rejeição exclusivamente em `PATCH /proposals/:id/status` com `REJECTED`. Não usar mais `DELETE /proposals/:id` em ação de apagar.

- [ ] **Step 4: Gate critical actions with `flush()`**

PDF/compartilhamento, alteração de status, duplicação, voltar e exclusão aguardam `flush()`. Em erro, não prosseguem. O PDF usa a proposta confirmada ou refaz `GET /proposals/:id` antes de renderizar.

- [ ] **Step 5: Add ADMIN typed deletion**

Mostrar `Excluir permanentemente` para ADMIN em qualquer status permitido pela API. Exigir o nome visível da proposta/cliente; tratar `409 PROPOSAL_HAS_DEPENDENCIES` mantendo a tela aberta.

- [ ] **Step 6: Invalidate all affected domains**

Invalidar propostas, station board, dashboard, anunciante, recaptura e contratos depois da exclusão.

- [ ] **Step 7: Run tests and typecheck**

Run:

```bash
pnpm --filter @workspace/mobile test -- criticalActions.test.ts useProposalAutosave.test.tsx --runInBand
pnpm --filter @workspace/mobile run typecheck
```

Expected: PASS.

- [x] **Step 8: Commit — omitido por instrução do usuário**

```bash
git add artifacts/mobile/src/features/proposals artifacts/mobile/app/proposal
git commit -m "feat(mobile): add safe admin proposal actions"
```

---

### Task 8: Completar perfil comercial na gestão de usuários

**Files:**
- Modify: `artifacts/mobile/app/admin/users/index.tsx`
- Modify: `artifacts/mobile/app/admin/users/[id].tsx`
- Create: `artifacts/mobile/src/features/admin/users/userProfilePayload.ts`
- Create: `artifacts/mobile/src/features/admin/users/__tests__/userProfilePayload.test.ts`

**Interfaces:**
- Produces: `buildAdminUserPayload()` with `jobTitle`, `contactPhone`, `contactEmail`, `avatarBase64` and station accesses.
- Consumes: existing `ImagePickerField` and `User` type.

- [ ] **Step 1: Write failing payload tests**

```ts
expect(buildAdminUserPayload({
  name: 'Ana', email: 'ANA@EXAMPLE.COM', role: 'COMERCIAL', active: true,
  jobTitle: 'Executiva', contactPhone: '(11) 99999-0000', contactEmail: 'ana@empresa.com', avatarBase64: null, stationAccesses: [],
})).toMatchObject({ email: 'ana@example.com', jobTitle: 'Executiva', contactEmail: 'ana@empresa.com' });
```

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm --filter @workspace/mobile test -- userProfilePayload.test.ts --runInBand`  
Expected: FAIL because the payload builder does not exist.

- [ ] **Step 3: Implement payload builder and fields**

Adicionar Cargo/Função, Telefone, E-mail comercial e Avatar nos formulários de criação/edição. Manter e-mail de login separado de contato comercial.

- [ ] **Step 4: Expose profile data in the list**

Mostrar cargo e contato em conteúdo secundário sem exibir senha, tokens ou credenciais.

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
pnpm --filter @workspace/mobile test -- userProfilePayload.test.ts --runInBand
pnpm --filter @workspace/mobile run typecheck
```

Expected: PASS.

- [x] **Step 6: Commit — omitido por instrução do usuário**

```bash
git add artifacts/mobile/app/admin/users artifacts/mobile/src/features/admin/users
git commit -m "feat(mobile): complete admin commercial profiles"
```

---

### Task 9: Implementar Contratos na visão ADMIN

**Files:**
- Create: `artifacts/mobile/src/features/contracts/api.ts`
- Create: `artifacts/mobile/src/features/contracts/money.ts`
- Create: `artifacts/mobile/src/features/contracts/ContractSummary.tsx`
- Create: `artifacts/mobile/src/features/contracts/RevenueForecast.tsx`
- Create: `artifacts/mobile/src/features/contracts/ContractList.tsx`
- Create: `artifacts/mobile/src/features/contracts/ContractForm.tsx`
- Create: `artifacts/mobile/src/features/contracts/__tests__/money.test.ts`
- Create: `artifacts/mobile/src/features/contracts/__tests__/contractsApi.test.ts`
- Create: `artifacts/mobile/app/admin/contracts/index.tsx`
- Create: `artifacts/mobile/app/admin/contracts/new.tsx`
- Create: `artifacts/mobile/app/admin/contracts/[id].tsx`
- Modify: `artifacts/mobile/app/admin/_layout.tsx`
- Modify: `artifacts/mobile/app/(admin)/menu.tsx`

**Interfaces:**
- Produces: `listContracts`, `getContractSummary`, `getContractForecast`, `listEligibleProposals`, `createContract`, `updateContract`, `cancelContract`.
- Produces: `moneyToCents(value): number`, `formatCents(cents): string`.
- Consumes: canonical `/contracts` endpoints and ADMIN `ownerId` filter.

- [ ] **Step 1: Write failing money tests**

```ts
expect(moneyToCents('R$ 2.000,50')).toBe(200050);
expect(formatCents(200050)).toBe('2000.50');
expect(() => moneyToCents('valor inválido')).toThrow('Valor monetário inválido');
```

- [ ] **Step 2: Write failing API contract tests**

Validar fixtures de lista, resumo, forecast e propostas elegíveis com os schemas da Task 1.

- [ ] **Step 3: Run tests and verify failure**

Run: `pnpm --filter @workspace/mobile test -- money.test.ts contractsApi.test.ts --runInBand`  
Expected: FAIL because the contract modules do not exist.

- [ ] **Step 4: Implement API and money helpers**

Construir query strings com `ownerId`, `month`, `from` e `months`. Nunca usar `number` de ponto flutuante como fonte persistida.

- [ ] **Step 5: Implement ADMIN contract screens**

- Lista com busca, status, responsável, refresh e estados vazios.
- KPIs: Vendido no mês, Receita prevista, Contratos ativos e Encerrando em 30 dias.
- Previsão acessível de 12 meses em lista/gráfico simples sem dependência nova.
- Cadastro a partir de proposta aprovada e sem contrato.
- Edição de valor mensal, venda, início, fim, vencimento e observações.
- Cancelamento com confirmação destrutiva e histórico preservado.

- [ ] **Step 6: Register routes and menu**

Adicionar `Contratos` ao menu ADMIN. Guardar todas as rotas sob o layout administrativo; usuário COMERCIAL deve ser redirecionado pelo guard existente.

- [ ] **Step 7: Run tests and typecheck**

Run:

```bash
pnpm --filter @workspace/mobile test -- money.test.ts contractsApi.test.ts --runInBand
pnpm --filter @workspace/mobile run typecheck
```

Expected: PASS.

- [x] **Step 8: Commit — omitido por instrução do usuário**

```bash
git add artifacts/mobile/src/features/contracts artifacts/mobile/app/admin/contracts artifacts/mobile/app/admin/_layout.tsx 'artifacts/mobile/app/(admin)/menu.tsx'
git commit -m "feat(mobile): add admin contract management"
```

---

### Task 10: Robustez visual, navegação, documentação e homologação ADMIN

**Files:**
- Modify: `artifacts/mobile/src/features/proposals/print/proposalPrintHtml.ts`
- Modify: `artifacts/mobile/src/features/proposals/print/__tests__/proposalPrintHtml.test.ts`
- Modify: `artifacts/mobile/src/features/admin/stations/StationPresentationEditor.tsx`
- Modify: `artifacts/mobile/app/(admin)/menu.tsx`
- Modify: `docs-mobile/01-visao-geral-e-estado-atual.md`
- Modify: `docs-mobile/04-navegacao-perfis-e-telas.md`
- Modify: `docs-mobile/05-api-autenticacao-e-dados.md`
- Modify: `docs-mobile/06-padroes-ui-seguranca-qualidade.md`
- Modify: `docs-mobile/08-roadmap-lacunas-riscos.md`
- Modify: `docs-mobile/README.md`
- Modify: `plans-mobile/plan-mobile-011-paridade-integral-admin-planos-033-034.md`

**Interfaces:**
- Consumes all deliverables from Tasks 1–9.
- Produces documented ADMIN route inventory and completed implementation checklist.

- [x] **Step 1: Extend PDF long-content regression**

```ts
it('keeps four presentation cards isolated with long unbroken content', () => {
  const proposal = makePrintProposal({
    stats: Array.from({ length: 4 }, (_, index) => ({ num: `${index}${'9'.repeat(39)}`, suf: '', desc: 'PALAVRA'.repeat(20) })),
  });
  const html = renderProposalPrintHtml({ data: mapProposalToPrintData(proposal), pages: paginateProposalPrintProducts(mapProposalToPrintData(proposal)), fontFaceCss: '' });
  expect(html).toContain('overflow-wrap: anywhere');
  expect(html.match(/proposal-print-stat-card/g)?.length).toBeGreaterThanOrEqual(4);
});
```

- [x] **Step 2: Add character counters and safe wrapping**

O editor institucional deve indicar limites 40/140. O HTML do PDF deve aplicar `min-width: 0`, `overflow-wrap: anywhere` e altura/line-height compatíveis com quatro cards.

- [x] **Step 3: Add native home navigation from the ADMIN brand context**

A marca exibida no Menu navega para `/(admin)`, possui label acessível e não substitui o botão nativo de voltar em telas empilhadas.

- [x] **Step 4: Update mobile documentation**

Registrar rotas, contratos, exclusão versus desativação/rejeição, `usesPrograms`, quadro por Empresa, autosave/flush e Contratos ADMIN.

- [x] **Step 5: Run the complete automated gate**

Run:

```bash
pnpm --filter @workspace/mobile test
pnpm --filter @workspace/mobile run typecheck
EXPO_PUBLIC_API_URL=https://propostasmosaico-one.vercel.app/api pnpm --filter @workspace/mobile exec expo export --platform ios --platform android --output-dir /tmp/gtf-propostas-admin-parity
```

Expected: all Jest suites pass, typecheck exits 0, and both Expo exports finish successfully.

- [ ] **Step 6: Execute ADMIN functional QA**

Validar em iOS e Android:

1. criar Empresa com Programas e cadastrar Programa/Produto;
2. criar Empresa sem Programas e cadastrar Produto sem campo Programa;
3. receber bloqueio estruturado ao desligar Programas com vínculos;
4. desativar, reativar e excluir Empresa vazia;
5. impedir exclusão de Empresa com histórico;
6. abrir Propostas por Empresa sem duplicação;
7. rejeitar e excluir proposta como ações distintas;
8. editar campos comerciais de usuário;
9. gerar PDF imediatamente após uma edição e confirmar dados persistidos;
10. criar, editar, filtrar e cancelar contrato administrativo.

- [x] **Step 7: Record actual implementation status**

Preencher no fim deste plano itens concluídos, comandos executados, dispositivos usados e riscos residuais objetivos.

- [x] **Step 8: Commit — omitido por instrução do usuário**

```bash
git add artifacts/mobile docs-mobile plans-mobile/plan-mobile-011-paridade-integral-admin-planos-033-034.md
git commit -m "docs(mobile): complete admin parity delivery"
```

---

## Acceptance Criteria

1. ADMIN vê propostas por Empresa como visão inicial e nenhuma proposta é duplicada.
2. Empresa sem Programas não oferece Programa em Produtos nem filtros relacionados.
3. Desativar Empresa, excluir Empresa, rejeitar Proposta e excluir Proposta são ações distintas.
4. Empresa com histórico não pode ser excluída permanentemente.
5. PDF e saída do editor aguardam a última revisão persistida.
6. Gestão de usuários inclui cargo, telefone, e-mail comercial e avatar.
7. ADMIN possui visão global de contratos e filtro por responsável.
8. Apresentação com quatro textos longos não sobrepõe conteúdo no PDF.
9. Todos os testes, typecheck e exports iOS/Android passam.
10. Nenhuma regra de autorização é movida da API para o aplicativo.

## Rollback e Dependência da Entrega 2

- Cada task foi mantida como unidade de alteração independente e pode ser revertida sem remover migrations; nenhum commit foi criado por instrução do usuário.
- A Entrega 2 depende das interfaces das Tasks 1, 2, 6, 7 e 9.
- Não iniciar o plano mobile 012 enquanto os critérios 1–10 desta entrega não forem aprovados.

## Checklist da Implementação

- [x] Task 1 — Contratos e erros estruturados
- [x] Task 2 — Confirmação destrutiva digitada
- [x] Task 3 — Ciclo de Empresa e `usesPrograms`
- [x] Task 4 — Catálogo condicionado à Empresa
- [x] Task 5 — Quadro ADMIN por Empresa
- [x] Task 6 — Autosave determinístico
- [x] Task 7 — Exclusão permanente e PDF após flush
- [x] Task 8 — Perfil comercial na gestão de usuários
- [x] Task 9 — Contratos ADMIN
- [x] Task 10 — Robustez, documentação e homologação — homologação de dispositivo pendente

### Validações Executadas

- Baseline de planejamento: 20 suítes, 65 testes e typecheck aprovados em 17/08/2026.
- Após a implementação: 31 suítes, 78 testes, 0 snapshots e typecheck aprovados no aplicativo.
- Exportações iOS/Android concluídas em `/tmp/gtf-propostas-admin-parity`; QA em aparelhos reais permanece pendente.

### Pendências e Riscos Residuais

- Homologação funcional integrada à API oficial e de dispositivo iOS/Android permanece como risco residual; nenhum backend/web foi alterado nesta entrega.
