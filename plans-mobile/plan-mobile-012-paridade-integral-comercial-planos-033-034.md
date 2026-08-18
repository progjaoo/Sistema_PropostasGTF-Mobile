# Paridade Integral do COMERCIAL — Planos 033 e 034 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar no aplicativo todos os fluxos do perfil COMERCIAL definidos nos planos web 033 e 034, depois da aprovação integral da Entrega ADMIN.

**Execution scope:** Implementação somente em `Sistema-PropostasGTF_App`. Nenhum arquivo ou commit será criado em `Sistema-Propostas-kanban`; os passos de commit abaixo ficam omitidos.

**Architecture:** A entrega reutiliza contratos, erros estruturados, confirmação digitada, autosave e módulo de contratos criados no plano mobile 011. Ownership e autorização permanecem no backend; o aplicativo adapta navegação, formulários, catálogo, editor e contratos ao uso nativo sem duplicar regras de segurança.

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19, TypeScript 5.9, Expo Router 6, TanStack Query, Zustand, Zod, Jest, Testing Library React Native e API Express/Prisma compartilhada.

## Global Constraints

- Iniciar somente depois da aprovação dos dez critérios do plano mobile 011.
- COMERCIAL nunca recebe carteira, proposta ou contrato de outro vendedor por decisão de frontend; a API aplica default deny.
- Acesso ao catálogo de uma Empresa não concede acesso aos Leads/Clientes de outro vendedor.
- Conversão Lead → Cliente atualiza o mesmo `Advertiser`; não criar cópia.
- Andamento permanece no board e não volta ao editor.
- Apresentação institucional é automática e não editável pelo COMERCIAL.
- `qty` aceita somente inteiro de 1 a 9999.
- `unitValue` é snapshot do item; alteração posterior do catálogo não muda a proposta.
- Valores financeiros usam centavos inteiros em cálculos e string decimal no transporte.
- Cancelar contrato preserva histórico.
- Preservar compatibilidade das rotas antigas durante a migração da barra inferior.

---

## Dependências Recebidas do Plano Mobile 011

```ts
type ApiErrorPayload = {
  message: string;
  code?: string;
  blockers?: Record<string, number>;
  fields?: unknown;
  requiresConfirmation?: boolean;
  [key: string]: unknown;
};

type ProposalAutosave = {
  schedule(patch: Partial<Proposal>): void;
  flush(): Promise<Proposal | void>;
  status: 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
  error: Error | null;
  hasPendingChanges: boolean;
};
```

Também são dependências obrigatórias `TypedConfirmDialog`, schemas de contratos, query keys compartilhadas e `permanentlyDeleteProposal()`.

---

### Task 1: Reorganizar navegação COMERCIAL sem quebrar rotas existentes

**Files:**
- Modify: `artifacts/mobile/app/(comercial)/_layout.tsx`
- Modify: `artifacts/mobile/app/(comercial)/clients.tsx`
- Create: `artifacts/mobile/app/(comercial)/products.tsx`
- Create: `artifacts/mobile/app/(comercial)/contracts.tsx`
- Create: `artifacts/mobile/app/(comercial)/more.tsx`
- Modify: `artifacts/mobile/app/(comercial)/leads.tsx`
- Modify: `artifacts/mobile/app/(comercial)/alerts.tsx`
- Modify: `artifacts/mobile/app/(comercial)/profile.tsx`
- Create: `artifacts/mobile/src/navigation/commercialNavigation.ts`
- Create: `artifacts/mobile/src/navigation/__tests__/commercialNavigation.test.ts`

**Interfaces:**
- Produces tabs: `index`, `clients`, `products`, `contracts`, `more`.
- Produces: `getCommercialTabs()` and `getCommercialLegacyRedirect(path)` for `leads`, `alerts` and `profile`.
- Consumes: Classic Tabs and NativeTabs already supported by the app.

- [ ] **Step 1: Write failing navigation-map tests**

```ts
expect(getCommercialTabs().map((tab) => tab.name)).toEqual([
  'index', 'clients', 'products', 'contracts', 'more',
]);
expect(getCommercialLegacyRedirect('leads')).toBe('/(comercial)/clients?segment=LEAD');
expect(getCommercialLegacyRedirect('alerts')).toBe('/(comercial)/more?section=alerts');
expect(getCommercialLegacyRedirect('profile')).toBe('/(comercial)/more?section=profile');
```

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm --filter @workspace/mobile test -- commercialNavigation.test.ts --runInBand`  
Expected: FAIL because the navigation module does not exist.

- [ ] **Step 3: Implement the navigation map**

Usar os mesmos cinco destinos no NativeTabs e Classic Tabs. Ícones: Propostas `doc.text`, Clientes `person.2`, Produtos `shippingbox`, Contratos `signature`, Mais `ellipsis.circle` com equivalentes Feather.

- [ ] **Step 4: Add segmented Clients/Leads navigation**

`clients.tsx` lê `segment=CLIENT|LEAD`, inicia em `CLIENT`, expõe chips acessíveis e mantém busca/filtros. As rotas antigas redirecionam para o segmento correto.

- [ ] **Step 5: Add the More hub**

`more.tsx` apresenta Avisos e Perfil com badge de avisos. `section` abre a seção pedida sem duplicar stores ou chamadas de autenticação.

- [ ] **Step 6: Run tests and typecheck**

Run:

```bash
pnpm --filter @workspace/mobile test -- commercialNavigation.test.ts profileNavigation.test.ts --runInBand
pnpm --filter @workspace/mobile run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add 'artifacts/mobile/app/(comercial)' artifacts/mobile/src/navigation
git commit -m "feat(mobile): reorganize commercial navigation"
```

---

### Task 2: Tornar ownership explícito nos contratos mobile

**Files:**
- Modify: `artifacts/mobile/src/types/index.ts`
- Modify: `artifacts/mobile/src/api/contracts.ts`
- Modify: `artifacts/mobile/src/api/schemas.ts`
- Modify: `artifacts/mobile/src/api/__tests__/schemas.test.ts`
- Modify: `artifacts/mobile/src/features/advertisers/api.ts`
- Modify: `artifacts/mobile/src/features/advertisers/AdvertiserListScreen.tsx`

**Interfaces:**
- Produces: `Advertiser.ownerId`, `Advertiser.owner` and `Advertiser.viewerCanEdit` when returned.
- Produces: `advertiserScopeLabel(advertiser, viewer)` for ADMIN-only diagnostics; COMERCIAL UI does not infer authorization from it.
- Consumes API-filtered `/advertisers` and `404` for resources outside the wallet.

- [ ] **Step 1: Extend failing advertiser schema tests**

```ts
const advertiser = advertiserWithProposalsSchema.parse({
  ...advertiserFixture,
  ownerId: 'seller-a',
  owner: { id: 'seller-a', name: 'Ana', email: 'ana@example.com' },
});
expect(advertiser.ownerId).toBe('seller-a');
expect(advertiser.owner?.name).toBe('Ana');
```

- [ ] **Step 2: Add the cross-wallet error expectation**

Criar teste do adapter garantindo que `ApiError(404)` seja mapeado para `Cadastro não encontrado ou sem acesso`, sem informar que o ID pertence a outro vendedor.

- [ ] **Step 3: Run focused tests and verify failure**

Run: `pnpm --filter @workspace/mobile test -- schemas.test.ts --runInBand`  
Expected: FAIL because the schema strips/does not type ownership.

- [ ] **Step 4: Implement ownership fields and safe messages**

Não enviar `ownerId` em POST/PATCH de COMERCIAL. O servidor continua definindo o usuário autenticado. Não adicionar filtros locais de segurança.

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
pnpm --filter @workspace/mobile test -- schemas.test.ts --runInBand
pnpm --filter @workspace/mobile run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add artifacts/mobile/src/types artifacts/mobile/src/api artifacts/mobile/src/features/advertisers
git commit -m "feat(mobile): align advertiser ownership contracts"
```

---

### Task 3: Implementar conversão manual Lead → Cliente

**Files:**
- Modify: `artifacts/mobile/src/features/advertisers/api.ts`
- Create: `artifacts/mobile/src/features/advertisers/LeadToClientSelector.tsx`
- Create: `artifacts/mobile/src/features/advertisers/__tests__/leadConversion.test.tsx`
- Modify: `artifacts/mobile/app/advertiser/[id].tsx`
- Modify: `artifacts/mobile/src/features/advertisers/AdvertiserListScreen.tsx`

**Interfaces:**
- Produces: `promoteAdvertiserToClient(id): Promise<AdvertiserWithProposals>`.
- Produces selector modes: `create | promote`.
- Consumes: `POST /advertisers/:id/promote-to-client` and `queryKeys.advertisers`.

- [ ] **Step 1: Write failing idempotent conversion test**

```tsx
it('promotes the selected lead without creating another advertiser', async () => {
  const promote = jest.fn().mockResolvedValue({ ...leadFixture, status: 'CLIENT' });
  const screen = render(<LeadToClientSelector leads={[leadFixture]} onPromote={promote} pending={false} />);
  fireEvent.press(screen.getByText(leadFixture.tradeName));
  fireEvent.press(screen.getByRole('button', { name: 'Converter em cliente' }));
  await waitFor(() => expect(promote).toHaveBeenCalledWith(leadFixture.id));
});
```

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm --filter @workspace/mobile test -- leadConversion.test.tsx --runInBand`  
Expected: FAIL because the selector does not exist.

- [ ] **Step 3: Add the promote API operation**

```ts
export async function promoteAdvertiserToClient(id: string) {
  return advertiserWithProposalsSchema.parse(
    await apiCall('POST', `/advertisers/${id}/promote-to-client`),
  );
}
```

- [ ] **Step 4: Add `Novo cliente` entry point**

Na visão Clientes, oferecer `Cadastrar novo` e `Converter um lead`. A busca de conversão usa `GET /advertisers?status=LEAD&active=true`, já restrito pela API à carteira.

- [ ] **Step 5: Confirm preservation and invalidate caches**

Antes da mutation, mostrar nome, origem e contato preservados. Em sucesso, invalidar listas de Leads, Clientes, Dashboard e contratos; abrir o mesmo ID na tela de Cliente.

- [ ] **Step 6: Run tests and typecheck**

Run:

```bash
pnpm --filter @workspace/mobile test -- leadConversion.test.tsx --runInBand
pnpm --filter @workspace/mobile run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add artifacts/mobile/src/features/advertisers artifacts/mobile/app/advertiser
git commit -m "feat(mobile): add lead to client conversion"
```

---

### Task 4: Adicionar desativação explicativa de Lead/Cliente

**Files:**
- Modify: `artifacts/mobile/src/features/advertisers/api.ts`
- Create: `artifacts/mobile/src/features/advertisers/AdvertiserDeactivateAction.tsx`
- Modify: `artifacts/mobile/app/advertiser/[id].tsx`
- Create: `artifacts/mobile/src/features/advertisers/__tests__/advertiserDeactivation.test.tsx`

**Interfaces:**
- Produces: `deactivateAdvertiser(id, confirmWithProposals = false)`.
- Consumes: `TypedConfirmDialog`, `ApiError.code`, `ApiError.payload.requiresConfirmation`.

- [ ] **Step 1: Write failing confirmation test**

```tsx
it('requires the advertiser name and keeps a conflict visible', async () => {
  const deactivate = jest.fn().mockRejectedValue(new ApiError(409, 'Possui propostas', {
    message: 'Este cliente possui propostas vinculadas e não pode ser excluído.',
    code: 'ADVERTISER_HAS_PROPOSALS',
    requiresConfirmation: true,
  }));
  const screen = render(<AdvertiserDeactivateAction advertiser={clientFixture} deactivate={deactivate} />);
  fireEvent.press(screen.getByText('Excluir cadastro'));
  fireEvent.changeText(screen.getByLabelText(`Digite ${clientFixture.tradeName} para confirmar`), clientFixture.tradeName);
  fireEvent.press(screen.getByRole('button', { name: 'Desativar cadastro' }));
  await screen.findByText('Este cliente possui propostas vinculadas e não pode ser excluído.');
});
```

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm --filter @workspace/mobile test -- advertiserDeactivation.test.tsx --runInBand`  
Expected: FAIL because the action does not exist.

- [ ] **Step 3: Implement deactivation operation and UI**

Chamar `DELETE /advertisers/:id`. O texto deve explicar que a ação é desativação lógica. Não remover o card antes da resposta da API.

- [ ] **Step 4: Handle conflicts without leaking data**

Exibir a mensagem estruturada em `409`. `403/404` usa mensagem neutra. Somente enviar `confirmWithProposals=true` se a API explicitamente retornar `requiresConfirmation: true` e o usuário confirmar uma segunda vez.

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
pnpm --filter @workspace/mobile test -- advertiserDeactivation.test.tsx --runInBand
pnpm --filter @workspace/mobile run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add artifacts/mobile/src/features/advertisers artifacts/mobile/app/advertiser
git commit -m "feat(mobile): add safe advertiser deactivation"
```

---

### Task 5: Criar catálogo read-only do COMERCIAL

**Files:**
- Create: `artifacts/mobile/src/features/products/api.ts`
- Create: `artifacts/mobile/src/features/products/CommercialProductCatalog.tsx`
- Create: `artifacts/mobile/src/features/products/__tests__/commercialCatalog.test.tsx`
- Modify: `artifacts/mobile/app/(comercial)/products.tsx`
- Modify: `artifacts/mobile/src/api/queryKeys.ts`

**Interfaces:**
- Produces: `listCommercialProducts(filters)` using `/product-templates`.
- Produces filters: `search`, `stationId`, `programId`, `active`.
- Consumes: `viewerCanViewCatalog`, `Station.usesPrograms`, product values and durations.

- [ ] **Step 1: Write failing authorization-presentation test**

```tsx
it('renders allowed products without administrative commands', () => {
  const screen = render(<CommercialProductCatalog stations={[allowedStation]} products={[productFixture]} loading={false} error={null} onRetry={jest.fn()} />);
  expect(screen.getByText(productFixture.title)).toBeTruthy();
  expect(screen.queryByText('Editar')).toBeNull();
  expect(screen.queryByText('Excluir')).toBeNull();
});
```

- [ ] **Step 2: Add failing no-program station test**

```tsx
const screen = render(
  <CommercialProductCatalog
    stations={[{ ...allowedStation, usesPrograms: false }]}
    products={[productFixture]}
    loading={false}
    error={null}
    onRetry={jest.fn()}
  />,
);
expect(screen.queryByText('Sem programa')).toBeNull();
expect(screen.getByText('Produtos da empresa')).toBeTruthy();
```

- [ ] **Step 3: Run tests and verify failure**

Run: `pnpm --filter @workspace/mobile test -- commercialCatalog.test.tsx --runInBand`  
Expected: FAIL because the catalog component does not exist.

- [ ] **Step 4: Implement endpoint adapter and catalog UI**

Listar somente dados retornados pela API. Agrupar por Empresa e por Programa quando `usesPrograms !== false`. Mostrar duração e valor sugerido em BRL. Oferecer busca e filtro de ativos.

- [ ] **Step 5: Cover loading, empty, denied and retry states**

Nenhuma Empresa autorizada gera estado vazio, não erro. `403` não lista nomes ou contagens de catálogos não permitidos.

- [ ] **Step 6: Run tests and typecheck**

Run:

```bash
pnpm --filter @workspace/mobile test -- commercialCatalog.test.tsx --runInBand
pnpm --filter @workspace/mobile run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add artifacts/mobile/src/features/products 'artifacts/mobile/app/(comercial)/products.tsx' artifacts/mobile/src/api/queryKeys.ts
git commit -m "feat(mobile): add commercial product catalog"
```

---

### Task 6: Alinhar editor COMERCIAL, quantidade e valores por item

**Files:**
- Modify: `artifacts/mobile/src/types/index.ts`
- Modify: `artifacts/mobile/src/api/schemas.ts`
- Create: `artifacts/mobile/src/features/proposals/products/proposalProductMoney.ts`
- Create: `artifacts/mobile/src/features/proposals/products/__tests__/proposalProductMoney.test.ts`
- Modify: `artifacts/mobile/src/features/proposals/products/ProposalProductForm.tsx`
- Modify: `artifacts/mobile/src/features/proposals/products/ProductCatalogSheet.tsx`
- Modify: `artifacts/mobile/src/features/proposals/editor/proposalPayload.ts`
- Modify: `artifacts/mobile/app/proposal/[id].tsx`
- Modify: `artifacts/mobile/src/features/proposals/print/proposalPrintModel.ts`

**Interfaces:**
- Produces: `ProposalProduct.unitValue?: string | null`.
- Produces: `parseQuantity(value): number`, `productSubtotalCents(product): number`, `proposalProductTotals(products, investValue)`.
- Consumes: `useProposalAutosave` and role from `authStore`.

- [ ] **Step 1: Write failing quantity/money tests**

```ts
expect(parseQuantity('0')).toBe(1);
expect(parseQuantity('10000')).toBe(9999);
expect(productSubtotalCents({ qty: '03', unitValue: '1500.50' })).toBe(450150);
expect(proposalProductTotals([{ qty: '02', unitValue: '100.00' }], '180.00')).toEqual({
  productTotalCents: 20000,
  finalInvestmentCents: 18000,
  differenceCents: -2000,
  differencePercent: 10,
});
```

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm --filter @workspace/mobile test -- proposalProductMoney.test.ts --runInBand`  
Expected: FAIL because the money module and `unitValue` do not exist.

- [ ] **Step 3: Implement cent-based calculations**

Normalizar entrada BRL sem usar `float` como fonte final. Percentual usa `Math.abs(differenceCents / productTotalCents * 100)` apenas para exibição.

- [ ] **Step 4: Persist `unitValue` in every proposal payload**

Adicionar `unitValue` em criação, edição, restauração de versão e products mutation. Produto do catálogo inicia com valor sugerido; produto avulso inicia com `null`.

- [ ] **Step 5: Update the product form**

Quantidade usa teclado numérico e stepper −/+. Valor unitário usa máscara BRL. Mostrar subtotal por item.

- [ ] **Step 6: Update investment summary**

Mostrar Total dos produtos, Investimento final e Desconto/Acréscimo com valor e percentual. Nunca substituir automaticamente `investValue`.

- [ ] **Step 7: Remove commercial presentation editing and timeline mutation**

Para COMERCIAL, a etapa Contexto mostra apenas `A apresentação institucional desta empresa será aplicada automaticamente.`. Na Revisão, remover controles de alteração de andamento e direcionar para Propostas. Histórico pode permanecer somente leitura. ADMIN mantém o comportamento concluído na Entrega 1.

- [ ] **Step 8: Keep PDF compatibility**

Não adicionar subtotais ao layout A4. Garantir apenas que o novo campo não quebre mapeamento, paginação ou fixtures.

- [ ] **Step 9: Run focused and PDF tests**

Run:

```bash
pnpm --filter @workspace/mobile test -- proposalProductMoney.test.ts proposalPrintModel.test.ts proposalPrintHtml.test.ts --runInBand
pnpm --filter @workspace/mobile run typecheck
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add artifacts/mobile/src/types artifacts/mobile/src/api artifacts/mobile/src/features/proposals artifacts/mobile/app/proposal
git commit -m "feat(mobile): align commercial proposal editor"
```

---

### Task 7: Disponibilizar exclusão permanente da proposta própria

**Files:**
- Create: `artifacts/mobile/src/features/proposals/permissions.ts`
- Create: `artifacts/mobile/src/features/proposals/__tests__/permissions.test.ts`
- Modify: `artifacts/mobile/app/proposal/[id].tsx`
- Modify: `artifacts/mobile/src/features/proposals/board/ProposalBoardCard.tsx`
- Modify: `artifacts/mobile/src/features/proposals/board/ProposalListView.tsx`

**Interfaces:**
- Produces: `canPermanentlyDeleteProposal({ user, proposal }): boolean`.
- Consumes: `proposal.viewerCanEdit`, `proposal.createdById`, ADMIN override and `permanentlyDeleteProposal()` from plan 011.

- [ ] **Step 1: Write failing permission matrix tests**

```ts
expect(canPermanentlyDeleteProposal({ user: admin, proposal: otherProposal })).toBe(true);
expect(canPermanentlyDeleteProposal({ user: sellerA, proposal: sellerAProposal })).toBe(true);
expect(canPermanentlyDeleteProposal({ user: sellerA, proposal: sellerBProposal })).toBe(false);
expect(canPermanentlyDeleteProposal({ user: sellerA, proposal: { ...sellerAProposal, viewerCanEdit: false } })).toBe(false);
```

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm --filter @workspace/mobile test -- permissions.test.ts --runInBand`  
Expected: FAIL because the permission helper does not exist.

- [ ] **Step 3: Implement presentation guard**

O helper controla apenas a visibilidade. A API continua autorizando a exclusão.

- [ ] **Step 4: Add the action to detail and board cards**

Usar `TypedConfirmDialog`, aguardar autosave `flush()` quando a tela de detalhe estiver aberta e tratar `404/409`. Não limitar visualmente a ação apenas a DRAFT, pois o endpoint permanente define a regra real.

- [ ] **Step 5: Invalidate affected domains**

Propostas, dashboard, anunciante, recaptura e contratos devem refletir a exclusão sem reiniciar o app.

- [ ] **Step 6: Run tests and typecheck**

Run:

```bash
pnpm --filter @workspace/mobile test -- permissions.test.ts criticalActions.test.ts --runInBand
pnpm --filter @workspace/mobile run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add artifacts/mobile/src/features/proposals artifacts/mobile/app/proposal
git commit -m "feat(mobile): allow owned proposal deletion"
```

---

### Task 8: Entregar Meus Contratos para COMERCIAL

**Files:**
- Modify: `artifacts/mobile/src/features/contracts/api.ts`
- Modify: `artifacts/mobile/src/features/contracts/ContractList.tsx`
- Modify: `artifacts/mobile/src/features/contracts/ContractForm.tsx`
- Create: `artifacts/mobile/src/features/contracts/CommercialContractsScreen.tsx`
- Create: `artifacts/mobile/src/features/contracts/__tests__/commercialContracts.test.tsx`
- Modify: `artifacts/mobile/app/(comercial)/contracts.tsx`
- Create: `artifacts/mobile/app/contracts/_layout.tsx`
- Create: `artifacts/mobile/app/contracts/new.tsx`
- Create: `artifacts/mobile/app/contracts/[id].tsx`

**Interfaces:**
- Consumes shared contract API and components from plan 011.
- Produces COMERCIAL screen without `ownerId` controls.
- Consumes `/contracts/eligible-proposals`, already scoped by authenticated user.

- [ ] **Step 1: Write failing role-specific UI test**

```tsx
it('shows only own-contract controls and no owner filter', () => {
  const screen = render(<CommercialContractsScreen contracts={[ownContract]} summary={summaryFixture} forecast={forecastFixture} />);
  expect(screen.getByText('Meus Contratos')).toBeTruthy();
  expect(screen.queryByText('Todos os responsáveis')).toBeNull();
  expect(screen.getByText(ownContract.advertiserName!)).toBeTruthy();
});
```

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm --filter @workspace/mobile test -- commercialContracts.test.tsx --runInBand`  
Expected: FAIL because the commercial screen is not connected.

- [ ] **Step 3: Connect the shared contract module**

Listar contratos, resumo do mês corrente e forecast de 12 meses sem enviar `ownerId`. Expor busca e status.

- [ ] **Step 4: Implement create/edit flows**

Nova contratação lista somente propostas retornadas por `/contracts/eligible-proposals`. Após selecionar, cliente, Empresa e proposta são somente leitura. Exigir valor mensal, data da venda, início, encerramento e vencimento 1–31.

- [ ] **Step 5: Implement cancellation**

Usar confirmação destrutiva; explicar que histórico será preservado e receitas futuras serão removidas conforme a API.

- [ ] **Step 6: Invalidate contract and proposal queries**

Após criar/editar/cancelar, invalidar lista, resumo, forecast, elegíveis e proposta vinculada.

- [ ] **Step 7: Run tests and typecheck**

Run:

```bash
pnpm --filter @workspace/mobile test -- commercialContracts.test.tsx money.test.ts contractsApi.test.ts --runInBand
pnpm --filter @workspace/mobile run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add artifacts/mobile/src/features/contracts 'artifacts/mobile/app/(comercial)/contracts.tsx' artifacts/mobile/app/contracts
git commit -m "feat(mobile): add commercial contracts"
```

---

### Task 9: Documentar e homologar a paridade COMERCIAL

**Files:**
- Modify: `docs-mobile/01-visao-geral-e-estado-atual.md`
- Modify: `docs-mobile/04-navegacao-perfis-e-telas.md`
- Modify: `docs-mobile/05-api-autenticacao-e-dados.md`
- Modify: `docs-mobile/06-padroes-ui-seguranca-qualidade.md`
- Modify: `docs-mobile/08-roadmap-lacunas-riscos.md`
- Modify: `docs-mobile/README.md`
- Modify: `plans-mobile/plan-mobile-012-paridade-integral-comercial-planos-033-034.md`

**Interfaces:**
- Consumes all deliverables from Tasks 1–8 and plan mobile 011.
- Produces final ADMIN/COMERCIAL route and authorization matrix.

- [ ] **Step 1: Add regression coverage for legacy redirects**

Garantir por teste que links antigos de Leads, Avisos e Perfil chegam aos novos destinos e preservam parâmetros relevantes.

- [ ] **Step 2: Update mobile documentation**

Documentar ownership, conversão, desativação, catálogo, novo editor, navegação, contratos e matriz por perfil. Remover declarações antigas de que conversão, contratos ou CRUDs atuais não existem.

- [ ] **Step 3: Run the complete automated gate**

Run:

```bash
pnpm --filter @workspace/mobile test
pnpm --filter @workspace/mobile run typecheck
EXPO_PUBLIC_API_URL=https://propostasmosaico-one.vercel.app/api pnpm --filter @workspace/mobile exec expo export --platform ios --platform android --output-dir /tmp/gtf-propostas-commercial-parity
```

Expected: all Jest suites pass, typecheck exits 0, and both Expo exports finish successfully.

- [ ] **Step 4: Execute two-seller security QA**

Com Comercial A, Comercial B e ADMIN:

1. confirmar que A não lista, abre, edita, converte ou desativa dados de B;
2. testar acesso direto por ID e confirmar resposta neutra;
3. confirmar que Empresa autorizada não libera carteira alheia;
4. confirmar que ADMIN continua com visão global.

- [ ] **Step 5: Execute commercial functional QA**

Em iOS e Android:

1. criar Lead e confirmar owner do usuário autenticado;
2. converter Lead em Cliente sem trocar ID;
3. desativar cadastro sem vínculos e tratar `409` com vínculos;
4. navegar por Produtos autorizados sem comandos administrativos;
5. editar quantidade e valor unitário, conferir subtotal/total/desconto;
6. confirmar que a apresentação não é editável;
7. alterar andamento somente no board;
8. excluir proposta própria e impedir exclusão de outra carteira;
9. criar, editar e cancelar contrato próprio;
10. conferir venda mensal e receita prevista em três competências;
11. testar rede lenta, offline, refresh rejeitado e retorno do background.

- [ ] **Step 6: Record actual implementation status**

Preencher o checklist abaixo, comandos, aparelhos, versões de sistema e riscos residuais.

- [ ] **Step 7: Commit**

```bash
git add artifacts/mobile docs-mobile plans-mobile/plan-mobile-012-paridade-integral-comercial-planos-033-034.md
git commit -m "docs(mobile): complete commercial parity delivery"
```

---

## Acceptance Criteria

1. COMERCIAL vê somente Leads, Clientes, Propostas e Contratos próprios.
2. Lead é convertido no mesmo registro e preserva origem, contato, propostas e histórico.
3. Desativação de anunciante exige o nome e explica vínculos impeditivos.
4. Produtos mostra somente catálogos autorizados e nenhuma ação administrativa.
5. Apresentação não é editável e Andamento não é alterado dentro do editor.
6. Quantidade, valor unitário, subtotal, total, desconto e acréscimo são corretos.
7. Mudança futura de preço do catálogo não altera proposta salva.
8. COMERCIAL exclui somente proposta própria editável.
9. Meus Contratos não oferece filtro de responsável e não vaza contratos de terceiros.
10. Venda mensal, receita prevista e cancelamento seguem as regras do plano 034.
11. Rotas antigas continuam navegáveis por redirecionamento.
12. Testes, typecheck, exports e QA com dois vendedores passam.

## Rollback

- Reverter cada task pelo próprio commit.
- Manter os contratos e migrations já publicados; rollback mobile não remove dados.
- Em regressão da nova barra inferior, reativar temporariamente o mapa anterior mantendo as novas rotas acessíveis pelo hub Mais.
- Em regressão do editor, preservar os campos `unitValue` recebidos e ocultar somente o controle visual até correção; nunca remover o valor do payload.

## Checklist da Implementação

- [x] Task 1 — Navegação COMERCIAL
- [x] Task 2 — Ownership explícito
- [x] Task 3 — Conversão Lead → Cliente
- [x] Task 4 — Desativação explicativa
- [x] Task 5 — Catálogo read-only
- [x] Task 6 — Editor, quantidade e valores
- [x] Task 7 — Exclusão da proposta própria
- [x] Task 8 — Meus Contratos
- [x] Task 9 — Documentação e homologação — QA de dois vendedores/dispositivo pendente

### Validações Executadas

- Baseline: plano mobile 011 aprovado com 31 suítes, 78 testes, typecheck e exportações Expo iOS/Android.
- Após a implementação: 39 suítes e 91 testes aprovados; typecheck aprovado.
- Exportação iOS/Android concluída em `/tmp/gtf-propostas-commercial-parity-final`; QA com dois vendedores/dispositivos permanece pendente.

### Pendências e Riscos Residuais

- Homologação integrada com dois usuários COMERCIAIS distintos, rede/offline e aparelhos iOS/Android permanece pendente; nenhum backend/web foi alterado.
