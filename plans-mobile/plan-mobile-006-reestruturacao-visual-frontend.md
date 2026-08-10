# Plan Mobile 006 — Reestruturação Visual Completa (Front-End Only)

> **Objetivo:** Redesenhar toda a interface do aplicativo GTF Propostas com padrão visual premium nível SaaS (estilo Vercel/shadcn/Linear), **sem alterar nenhuma funcionalidade, rota, endpoint ou lógica de negócio**. Apenas FRONT-END puro — cores, tipografia, espaçamentos, componentes visuais e micro-animações.

> **Branch exclusiva de execução:** `visual-teste` (confirmada no remoto e configurada localmente para acompanhar `origin/visual-teste` em 10/08/2026).

> **Regra de liberação:** executar somente um sprint por vez. O sprint seguinte permanece bloqueado até o usuário testar no Expo Go/simulador e aprovar visualmente o sprint anterior de forma explícita.

---

## 1. Diagnóstico Visual Atual

### Problemas Identificados no Layout Atual (Gerado pelo Replit)

| # | Problema | Impacto Visual |
|---|---|---|
| **V1** | **Tokens de cor genéricos e hardcoded** — As cores estão definidas diretamente no `constants/colors.ts` sem suporte a dark mode, sem agrupamento semântico (brand, status, surface) e sem preparação para evolução da marca | Uma atualização da identidade visual exigiria editar dezenas de arquivos manualmente |
| **V2** | **Estilos inline dispersos** — Cada tela define seus próprios `StyleSheet.create()` com valores absolutos repetidos (fontes, gaps, paddings, border-radius). Não há Design System central | Inconsistência visual entre telas (ex: cards do board vs cards de clientes) |
| **V3** | **Componentes visuais "crus"** — Os componentes `StatusBadge`, `ProposalCard`, `AdvertiserCard`, `EmptyState` foram criados com estilos mínimos sem refinamento visual | Visual genérico que não transmite confiança profissional |
| **V4** | **Headers e filtros sem padrão** — Cada tela reconstrói seu próprio header com padding/spacing diferente | A navegação parece "desconexa" ao transitar entre telas |
| **V5** | **Formulários sem consistência** — Os inputs em `new.tsx`, `[id].tsx`, `login.tsx`, `profile.tsx` têm estilos diferentes de altura, borda e foco | Experiência fragmentada |
| **V6** | **Bottom Sheets sem padrão compartilhado** — `MoveProposalSheet`, `ProductCatalogSheet`, `ProposalFiltersSheet` e `ProposalVersionSheet` repetem estruturas de `Modal`/backdrop/sheet | Aparência e comportamento visual podem divergir; `ConfirmDialog` usa `Alert` nativo e deve permanecer assim |
| **V7** | **Sem micro-animações** — Sem transições de fade, scale ou slide nos cards, modais e tabs | O app parece estático e sem vida |
| **V8** | **Dark Mode inoperante** — O `useColors` prevê dark mode mas não existe paleta `dark` em `colors.ts` | O app volta silenciosamente para a paleta clara e perde coerência com a preferência do dispositivo |

---

## 2. Estratégia de Reestruturação

### Princípios

1. **Zero quebra funcional** — Nenhuma rota, endpoint, mutation, query ou lógica de negócio será alterada.
2. **Design Tokens centralizados** — Um único arquivo (`src/theme/tokens.ts`) controlará TODAS as cores, fontes, espaçamentos e raios do app.
3. **Marca GTF centralizada** — Logos, cores e tipografia terão uma única fonte de verdade para permitir futuras evoluções sem retrabalho nas telas.
4. **Componentes reutilizáveis padronizados** — Biblioteca interna de componentes visuais (`src/ui/`) que todas as telas usarão.
5. **Compatibilidade progressiva** — Componentes novos não podem obrigar a migração simultânea de todas as telas. Os contratos públicos atuais permanecem válidos até a conclusão e aprovação do sprint que migra todos os consumidores.
6. **Padrões nativos preservados** — Manter Expo Router, Native Tabs quando disponíveis, `Pressable`, áreas seguras, acessibilidade e gestos nativos. O redesign não cria uma navegação paralela.

### Kit de UI Base: **Padrão shadcn/Vercel Mobile** (Manual)

> Não adicionaremos dependências externas de UI kit. Construiremos componentes internos **inspirados** no padrão visual do [React Native Reusables (native-cn)](https://rnr-docs.vercel.app/) e do [shadcn/ui](https://ui.shadcn.com), mantendo o projeto leve e 100% customizável.

### 2.1 Fluxo obrigatório da branch e dos gates visuais

1. Toda alteração deste plano deve ocorrer em `visual-teste`; não executar nenhum sprint diretamente em `main`.
2. Antes de iniciar cada sprint, confirmar `git branch --show-current` = `visual-teste` e `git status --short` sem alterações inesperadas.
3. Ao finalizar o sprint, executar typecheck e testes, abrir o app no Expo Go/simulador e entregar ao usuário o roteiro visual daquele sprint.
4. Registrar no checklist do sprint: commit de checkpoint, plataformas testadas, telas verificadas e resultado da aprovação do usuário.
5. Não iniciar, preparar ou adiantar arquivos do sprint seguinte enquanto o gate estiver com status `AGUARDANDO VALIDAÇÃO`.
6. Se o usuário reprovar, corrigir dentro do mesmo sprint e gerar novo checkpoint. Somente a resposta explícita de aprovação libera o próximo sprint.
7. Nenhum merge em `main` faz parte deste plano. A integração será decidida somente após a aprovação visual do último sprint.

Comandos de preparação já validados para a branch:

```bash
git fetch origin visual-teste
git switch visual-teste
git pull --ff-only origin visual-teste
git branch --show-current
git status --short
```

### 2.2 Regra de compatibilidade de props

Os componentes em `src/ui/` serão a implementação visual nova. Os componentes existentes em `components/` continuarão como adaptadores durante a migração. É proibido remover, renomear ou tornar obrigatória uma prop já opcional antes de todos os consumidores terem sido migrados e validados.

| Contrato legado que deve continuar funcionando | Props obrigatoriamente preservadas | Estratégia |
|---|---|---|
| `StatusBadge` | `status: ProposalStatus`, `size?: 'sm' | 'md'` | Renderizar `UIBadge` internamente e manter os mesmos labels/fallbacks de status |
| `ProposalCard` | `proposal: ProposalSummary`, `showOwner?: boolean` | Manter navegação para `/proposal/${proposal.id}` e apenas trocar a composição visual |
| `AdvertiserCard` | `advertiser: Advertiser`, `onPress: () => void`, `badge?: string`, `badgeColor?: string` | Compor `UICard`, `UIAvatar` e `UIBadge` sem alterar callback ou dados exibidos |
| `EmptyState` | `icon?`, `title`, `description?`, `actionLabel?`, `onAction?` | Adaptar para `UIEmptyState`; ação só aparece quando label e callback existirem, como hoje |
| `FormInput` | Todas as `TextInputProps` + `label?`, `error?`, `hint?`, `required?`, `leftIcon?`, `rightIcon?`, `onRightIconPress?`, `isPassword?` | Encaminhar todas as props ao `UIInput`, preservar máscara/teclado/secureTextEntry e a precedência de `error` sobre `hint` |
| `showConfirm` | `title`, `message`, `confirmText?`, `cancelText?`, `destructive?`, `onConfirm`, `onCancel?` | Manter a função e a semântica do `Alert` nativo; não converter confirmações destrutivas em sheet apenas por estética |
| `useColors()` | Todas as chaves atuais de `colors.light` e `radius` | Os tokens novos podem acrescentar chaves, mas não remover ou mudar o tipo das chaves consumidas pelas telas existentes |

Regras adicionais:

- Todo novo componente deve aceitar `style` e props nativas aplicáveis (`ViewProps`, `PressableProps` ou `TextInputProps`) sem engolir handlers, atributos de acessibilidade ou `testID`.
- Wrappers interativos devem usar `Pressable`; consumidores antigos não precisam mudar a assinatura de callbacks.
- Cada adaptador legado terá teste de contrato renderizando as props atuais. A remoção dos adaptadores fica fora deste plano e só poderá ocorrer em uma tarefa posterior.
- Componentes de sheet existentes mantêm seus contratos atuais (`visible`, `onClose`, callbacks e estados `pending/loading`). O novo `UIBottomSheet` será usado internamente.

---

## 3. Inventário de Arquivos a Refatorar

### 3.1 Infraestrutura de Tema (Criar/Refatorar)

| Arquivo | Ação | Descrição |
|---|---|---|
| `constants/colors.ts` | **REFATORAR** | Migrar para estrutura semântica com paletas `light` e `dark` completas, agrupadas por `brand`, `surface`, `status`, `text` |
| `hooks/useColors.ts` | **REFATORAR** | Manter interface atual mas conectar aos novos tokens para backward compatibility |
| `src/theme/tokens.ts` | **CRIAR** | Fonte de verdade central: cores, tipografia, espaçamentos, raios, sombras, animações |
| `src/theme/spacing.ts` | **CRIAR** | Escala de espaçamentos (4, 8, 12, 16, 20, 24, 32, 40, 48) |
| `src/theme/typography.ts` | **CRIAR** | Mapa tipográfico: `heading.xl`, `heading.lg`, `body.md`, `body.sm`, `caption`, `label` |
| `src/theme/shadows.ts` | **CRIAR** | Sombras reutilizáveis: `shadow.sm`, `shadow.md`, `shadow.lg` |

### 3.2 Componentes UI Padronizados (Criar)

| Componente | Arquivo | Substitui / Padroniza |
|---|---|---|
| `<UICard />` | `src/ui/Card.tsx` | Cards usados em ProposalBoardCard, AdvertiserCard, ProposalCard, Dashboard |
| `<UIBadge />` | `src/ui/Badge.tsx` | StatusBadge com variantes (`draft`, `sent`, `approved`, `rejected`, `lead`, `client`) |
| `<UIButton />` | `src/ui/Button.tsx` | Botões com variantes (`primary`, `secondary`, `outline`, `destructive`, `ghost`) |
| `<UIInput />` | `src/ui/Input.tsx` | TextInput padronizado com altura 48px, borda fina, foco suave e ícone opcional |
| `<UIHeader />` | `src/ui/Header.tsx` | Header padrão de tela com título, subtítulo e ações à direita |
| `<UIBottomSheet />` | `src/ui/BottomSheet.tsx` | Wrapper de modal deslizante com animação em `transform`/`opacity`, usando Reanimated já instalado |
| `<UIChip />` | `src/ui/Chip.tsx` | Pills de filtro (status, programa) com variante `active`/`inactive` |
| `<UIEmptyState />` | `src/ui/EmptyState.tsx` | Estado vazio padronizado com ícone, título, descrição e ação |
| `<UIAvatar />` | `src/ui/Avatar.tsx` | Avatar circular com iniciais coloridas (para vendedores e clientes) |
| `<UISeparator />` | `src/ui/Separator.tsx` | Linha separadora fina e consistente |
| `<BrandLogo />` | `src/ui/BrandLogo.tsx` | Componente centralizado para `gtf-logo-completa.png` e `gtf-logo-horizontal.png` já existentes |

### 3.3 Superfícies reais a redesenhar (apenas visual)

O inventário original estava incompleto. A árvore real possui telas administrativas, sheets e estados globais que também precisam consumir o design system para que o objetivo de “interface completa” seja verdadeiro.

| Grupo | Arquivos reais | Mudanças visuais |
|---|---|---|
| **Shell e estados globais** | `app/_layout.tsx`, `app/index.tsx`, `app/+not-found.tsx`, `src/components/NetworkBanner.tsx`, `components/LoadingSpinner.tsx`, `components/ErrorFallback.tsx`, `components/ToastProvider.tsx` | Tokens globais, status bar/splash coerentes, loading, offline, erro e toast nos dois temas |
| **Acesso público** | `app/(public)/login.tsx`, `register.tsx`, `forgot-password.tsx`, `reset-password.tsx` | Logo, hierarquia tipográfica, inputs, ações e estados de envio consistentes |
| **Navegação autenticada** | `app/(admin)/_layout.tsx`, `app/(comercial)/_layout.tsx`, `app/(admin)/menu.tsx`, `app/(comercial)/profile.tsx` | Preservar Native Tabs/fallback atual; atualizar somente tokens, ícones, espaçamento e superfícies |
| **Dashboards** | `app/(admin)/index.tsx` | Métricas e propostas recentes com componentes padronizados. `app/(comercial)/index.tsx` é apenas um re-export do board e não exige estilo próprio |
| **Board de propostas** | `ProposalBoardScreen.tsx`, `ProposalBoardCard.tsx`, `ProposalStagePager.tsx`, `ProposalProgramBoardView.tsx`, `ProposalListView.tsx`, `ProposalFiltersSheet.tsx`, `MoveProposalSheet.tsx` | Header, modos de visão, filtros, cards, colunas e sheets com contratos atuais preservados |
| **Criação/edição de proposta** | `app/proposal/new.tsx`, `app/proposal/[id].tsx`, `ProposalEditorStepper.tsx`, `ProductCatalogSheet.tsx`, `ProposalProductForm.tsx`, `ProposalVersionSheet.tsx` | Stepper, seções, catálogo, formulário, versões e ações sem alterar mutations ou payloads |
| **Clientes e leads** | `app/(admin)/clients.tsx`, `app/(comercial)/clients.tsx`, `app/(comercial)/leads.tsx`, `app/advertiser/[id].tsx`, `AdvertiserProposalList.tsx`, `LeadSourcePicker.tsx` | Listas, detalhe, origem e propostas vinculadas com cards/avatares/badges padronizados |
| **Avisos de recaptura** | `app/(admin)/alerts.tsx`, `app/(comercial)/alerts.tsx`, `RecallReminderSheet.tsx` | Severidade, vencimento, ações e modal de entrada com contraste correto |
| **Administração: catálogo** | `app/admin/lead-sources/index.tsx`, `product-durations/index.tsx`, `products/index.tsx`, `programs/index.tsx`, `proposal-templates/index.tsx`, `proposal-types/index.tsx`, `CatalogListScreen.tsx` | Listagens e formulários administrativos reutilizando header, input, card, badge e botões |
| **Administração: empresas** | `app/admin/stations/index.tsx`, `app/admin/stations/[id].tsx`, `StationPresentationEditor.tsx`, `components/ImagePickerField.tsx` | Lista, formulário, picker de imagem/cor e itens de apresentação no mesmo padrão |
| **Administração: usuários** | `app/admin/users/index.tsx`, `app/admin/users/[id].tsx` | Lista, formulário, permissões e estados ativo/inativo com hierarquia clara |
| **Componentes compartilhados legados** | `StatusBadge.tsx`, `ProposalCard.tsx`, `AdvertiserCard.tsx`, `EmptyState.tsx`, `FormInput.tsx`, `ConfirmDialog.tsx` | Tornar adaptadores compatíveis sobre os novos componentes, sem quebrar imports existentes |

Todos os caminhos da tabela são relativos a `artifacts/mobile/`; os componentes sem prefixo estão em `src/features/...` conforme detalhado na seção 6.

### 3.4 Arquivos auditados que não devem ser alterados por este plano

| Arquivo/grupo | Motivo |
|---|---|
| `app/(admin)/proposals.tsx` | Re-exporta `ProposalBoardScreen`; o visual é alterado na origem |
| `app/(comercial)/index.tsx` | Re-exporta `ProposalBoardScreen`; o visual é alterado na origem |
| `app/admin/profile.tsx` | Re-exporta o perfil comercial |
| `app/(tabs)/*` | Rotas legadas mantidas apenas para compatibilidade do scaffold e redirecionamento |
| `app/(public)/_layout.tsx`, `app/admin/_layout.tsx`, `app/admin/stations/_layout.tsx`, `app/admin/users/_layout.tsx`, `app/proposal/_layout.tsx`, `app/advertiser/_layout.tsx` | Navegação/guards já usam Stack nativo e não precisam de redesign estrutural |
| `src/features/proposals/print/*` | PDF possui identidade e paginação próprias; mudanças no PDF estão fora do escopo visual do app |
| `src/api/*`, `src/store/*`, `src/features/**/api.ts`, `lib/*`, `artifacts/api-server/*` | API, autenticação, contratos e banco estão expressamente fora do escopo |

---

## 4. Plano de Implementação em Sprints

### Sprint 1 — Infraestrutura de Design System

**Status inicial:** `LIBERADO`

**Impacto:** fundação sem migração em massa de telas.

- [ ] Confirmar branch `visual-teste` e registrar baseline visual de Login, Propostas, Clientes e Menu Admin.
- [ ] Criar `src/theme/tokens.ts`, `spacing.ts`, `typography.ts`, `shadows.ts` e `index.ts`.
- [ ] Implementar paletas `light` e `dark` completas com as chaves legadas preservadas.
- [ ] Refatorar `constants/colors.ts` e `hooks/useColors.ts` sem alterar o tipo retornado aos consumidores atuais.
- [ ] Criar `src/ui/BrandLogo.tsx` usando os assets reais em `assets/brand/` e `expo-image`.
- [ ] Adicionar testes de contrato para `useColors()` cobrindo todas as chaves atuais e os dois temas.
- [ ] Executar typecheck/testes e validar no Expo: splash, login e troca light/dark sem regressão visual.
- [ ] Criar commit de checkpoint do Sprint 1.
- [ ] **GATE DO USUÁRIO:** `AGUARDANDO VALIDAÇÃO VISUAL` — Sprint 2 bloqueado até aprovação explícita.

### Sprint 2 — Componentes UI e adaptadores legados

**Status inicial:** `BLOQUEADO PELO SPRINT 1`

- [ ] Criar `Card.tsx`, `Badge.tsx`, `Button.tsx`, `Input.tsx`, `Header.tsx`, `BottomSheet.tsx`, `Chip.tsx`, `EmptyState.tsx`, `Avatar.tsx`, `Separator.tsx` e `src/ui/index.ts`.
- [ ] Usar `Pressable`, `StyleSheet.create`, `gap`, `borderCurve: 'continuous'`, áreas de toque mínimas de 44px e props de acessibilidade.
- [ ] Manter o `Alert` nativo de `showConfirm`; `UIBottomSheet` será aplicado somente aos sheets já existentes.
- [ ] Converter `StatusBadge`, `EmptyState` e `FormInput` em adaptadores sobre a nova UI, preservando integralmente as props da seção 2.2.
- [ ] Preparar `ProposalCard` e `AdvertiserCard` para composição com a nova UI sem alterar navegação ou callbacks.
- [ ] Criar testes de contrato para os seis componentes legados, incluindo `style`, `testID`, callbacks e props opcionais.
- [ ] Executar typecheck/testes e validar no Expo: inputs, senhas, estados vazios, badges e confirmação destrutiva.
- [ ] Criar commit de checkpoint do Sprint 2.
- [ ] **GATE DO USUÁRIO:** `BLOQUEADO` até Sprint 1 ser aprovado; depois passa a `AGUARDANDO VALIDAÇÃO VISUAL`.

### Sprint 3 — Telas públicas, shell e navegação

**Status inicial:** `BLOQUEADO PELO SPRINT 2`

- [ ] Redesenhar Login, Registro, Esqueci Senha e Reset Senha sem alterar validação, requests ou rotas.
- [ ] Aplicar tokens ao shell (`app/_layout.tsx`, `app/index.tsx`, `+not-found.tsx`) e aos estados globais de rede, erro, loading e toast.
- [ ] Refinar os layouts `(admin)` e `(comercial)` preservando Native Tabs quando disponíveis e o fallback clássico atual.
- [ ] Redesenhar Perfil Comercial/Admin e Menu Admin com os novos componentes.
- [ ] Validar teclado, safe area, telas pequenas, orientação suportada, loading de sessão e redirecionamentos por role.
- [ ] Executar typecheck/testes e roteiro visual nos fluxos público, ADMIN e COMERCIAL.
- [ ] Criar commit de checkpoint do Sprint 3.
- [ ] **GATE DO USUÁRIO:** `BLOQUEADO` até Sprint 2 ser aprovado; depois passa a `AGUARDANDO VALIDAÇÃO VISUAL`.

### Sprint 4 — Módulo de propostas

**Status inicial:** `BLOQUEADO PELO SPRINT 3`

- [ ] Redesenhar os três modos do board: Etapas, Programas e Lista.
- [ ] Redesenhar cards, colunas, busca, chips, filtros avançados e sheet de mudança de etapa.
- [ ] Redesenhar Nova Proposta, Editor, stepper, catálogo, formulário de produto e histórico de versões.
- [ ] Preservar deduplicação de propostas, filtros, mutations, status, permissões, PDF e contratos dos sheets.
- [ ] Validar listas com 0, 1 e muitas propostas, textos longos, loading/error/empty, mudança de etapa e edição completa.
- [ ] Executar typecheck/testes e roteiro visual ADMIN/COMERCIAL.
- [ ] Criar commit de checkpoint do Sprint 4.
- [ ] **GATE DO USUÁRIO:** `BLOQUEADO` até Sprint 3 ser aprovado; depois passa a `AGUARDANDO VALIDAÇÃO VISUAL`.

### Sprint 5 — Clientes, leads, avisos e dashboard

**Status inicial:** `BLOQUEADO PELO SPRINT 4`

- [ ] Redesenhar Clientes ADMIN/COMERCIAL, Leads, detalhe de cliente, origem e propostas vinculadas.
- [ ] Finalizar a migração visual de `AdvertiserCard` e `ProposalCard` mantendo as props legadas.
- [ ] Redesenhar Avisos ADMIN/COMERCIAL e `RecallReminderSheet`.
- [ ] Redesenhar Dashboard Admin; o dashboard comercial continua sendo o board compartilhado já validado no Sprint 4.
- [ ] Validar listas extensas, busca, criação/edição, promoção Lead/Cliente, avisos e cards de propostas vinculadas.
- [ ] Executar typecheck/testes e roteiro visual ADMIN/COMERCIAL.
- [ ] Criar commit de checkpoint do Sprint 5.
- [ ] **GATE DO USUÁRIO:** `BLOQUEADO` até Sprint 4 ser aprovado; depois passa a `AGUARDANDO VALIDAÇÃO VISUAL`.

### Sprint 6 — Administração completa

**Status inicial:** `BLOQUEADO PELO SPRINT 5`

- [ ] Redesenhar fontes de lead, durações, produtos, programas, modelos e tipos de proposta.
- [ ] Redesenhar empresas: lista, edição, imagem/cor e apresentação padrão.
- [ ] Redesenhar usuários: lista, criação/edição, papel, status e acessos por empresa.
- [ ] Consolidar `CatalogListScreen`, `StationPresentationEditor` e `ImagePickerField` no design system.
- [ ] Validar CRUDs, confirmações destrutivas, campos longos, teclado, seleção e permissões sem mudar payloads.
- [ ] Executar typecheck/testes e roteiro visual de todas as rotas administrativas.
- [ ] Criar commit de checkpoint do Sprint 6.
- [ ] **GATE DO USUÁRIO:** `BLOQUEADO` até Sprint 5 ser aprovado; depois passa a `AGUARDANDO VALIDAÇÃO VISUAL`.

### Sprint 7 — Microanimações, acessibilidade e polimento

**Status inicial:** `BLOQUEADO PELO SPRINT 6`

- [ ] Aplicar animações somente em `transform` e `opacity`, respeitando Reduce Motion e evitando animação indiscriminada em listas longas.
- [ ] Adicionar feedback de pressão nos comandos sem alterar callbacks ou bloquear gestos de scroll.
- [ ] Revisar dark mode, contraste WCAG AA, Dynamic Type, labels de acessibilidade e touch targets.
- [ ] Revisar iOS/Android em larguras pequenas e grandes, incluindo teclado, sheets, safe areas e listas.
- [ ] Executar typecheck, suíte completa e inspeção de valores visuais hardcoded restantes.
- [ ] Criar commit de checkpoint do Sprint 7.
- [ ] **GATE FINAL DO USUÁRIO:** `BLOQUEADO` até Sprint 6 ser aprovado; após validação, considerar o redesign concluído na `visual-teste`. Merge em `main` exige autorização separada.

---

## 5. Manutenção da Marca GTF

Os assets reais já existem em `assets/brand/gtf-logo-completa.png` e `assets/brand/gtf-logo-horizontal.png`. Mudanças futuras de marca devem seguir este fluxo:

```
1. Abrir src/theme/tokens.ts
2. Substituir os valores de brand.primary, brand.secondary, brand.accent
3. Trocar os arquivos em assets/brand sem alterar a API de BrandLogo
4. (Opcional) Trocar a font-family se o manual exigir uma fonte específica
5. Pronto — o app inteiro se recolore automaticamente
```

### Estrutura do `src/theme/tokens.ts` (Esqueleto)

```typescript
export const tokens = {
  colors: {
    brand: {
      primary: '#1B4A8A',        // ← Substituir pela cor primária da marca
      primaryForeground: '#FFFFFF',
      secondary: '#0F172A',      // ← Substituir pela cor secundária
      accent: '#EFF6FF',         // ← Substituir pela cor de destaque
    },
    surface: {
      background: '#F8F9FC',
      card: '#FFFFFF',
      muted: '#F1F5F9',
      border: '#E2E8F0',
    },
    text: {
      primary: '#0F172A',
      secondary: '#334155',
      muted: '#64748B',
      inverse: '#FFFFFF',
    },
    status: {
      draft: '#64748B',
      sent: '#0284C7',
      approved: '#16A34A',
      rejected: '#DC2626',
      warning: '#D97706',
    },
    // A paleta dark deve expor os mesmos nomes semânticos.
  },
  typography: {
    headingXl: { fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 34 },
    headingLg: { fontFamily: 'Inter_700Bold', fontSize: 22, lineHeight: 28 },
    headingMd: { fontFamily: 'Inter_600SemiBold', fontSize: 18, lineHeight: 24 },
    bodySm: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
    caption: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 14 },
    label: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 16 },
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
  radius: { sm: 6, md: 10, lg: 14, xl: 20, full: 999 },
  shadow: {
    sm: { boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)' },
    md: { boxShadow: '0 2px 8px rgba(15, 23, 42, 0.10)' },
    lg: { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.14)' },
  },
};
```

---

## 6. Arquivos Completos a Criar e Modificar

Todos os caminhos abaixo são relativos a `artifacts/mobile/`.

### Novos arquivos (19)

| Arquivo | Sprint |
|---|---|
| `src/theme/tokens.ts` | Sprint 1 |
| `src/theme/spacing.ts` | Sprint 1 |
| `src/theme/typography.ts` | Sprint 1 |
| `src/theme/shadows.ts` | Sprint 1 |
| `src/theme/index.ts` | Sprint 1 |
| `src/theme/__tests__/tokens.test.ts` | Sprint 1 |
| `src/ui/BrandLogo.tsx` | Sprint 1 |
| `src/ui/Card.tsx` | Sprint 2 |
| `src/ui/Badge.tsx` | Sprint 2 |
| `src/ui/Button.tsx` | Sprint 2 |
| `src/ui/Input.tsx` | Sprint 2 |
| `src/ui/Header.tsx` | Sprint 2 |
| `src/ui/BottomSheet.tsx` | Sprint 2 |
| `src/ui/Chip.tsx` | Sprint 2 |
| `src/ui/EmptyState.tsx` | Sprint 2 |
| `src/ui/Avatar.tsx` | Sprint 2 |
| `src/ui/Separator.tsx` | Sprint 2 |
| `src/ui/index.ts` | Sprint 2 |
| `src/ui/__tests__/legacyContracts.test.tsx` | Sprint 2 |

### Infraestrutura, shell e componentes legados a modificar (23)

| Arquivo | Sprint |
|---|---|
| `constants/colors.ts` | Sprint 1 |
| `hooks/useColors.ts` | Sprint 1 |
| `components/StatusBadge.tsx` | Sprint 2 |
| `components/ProposalCard.tsx` | Sprint 2 e 5 |
| `components/AdvertiserCard.tsx` | Sprint 2 e 5 |
| `components/EmptyState.tsx` | Sprint 2 |
| `components/FormInput.tsx` | Sprint 2 |
| `components/ConfirmDialog.tsx` | Sprint 2, apenas teste de contrato; manter `Alert` nativo |
| `app/_layout.tsx` | Sprint 3 |
| `app/index.tsx` | Sprint 3 |
| `app/+not-found.tsx` | Sprint 3 |
| `app/(public)/login.tsx` | Sprint 3 |
| `app/(public)/register.tsx` | Sprint 3 |
| `app/(public)/forgot-password.tsx` | Sprint 3 |
| `app/(public)/reset-password.tsx` | Sprint 3 |
| `app/(comercial)/_layout.tsx` | Sprint 3 |
| `app/(admin)/_layout.tsx` | Sprint 3 |
| `app/(comercial)/profile.tsx` | Sprint 3 |
| `app/(admin)/menu.tsx` | Sprint 3 |
| `src/components/NetworkBanner.tsx` | Sprint 3 |
| `components/LoadingSpinner.tsx` | Sprint 3 |
| `components/ErrorFallback.tsx` | Sprint 3 |
| `components/ToastProvider.tsx` | Sprint 3 |

### Módulo de propostas a modificar (13)

| Arquivo | Sprint |
|---|---|
| `src/features/proposals/board/ProposalBoardScreen.tsx` | Sprint 4 |
| `src/features/proposals/board/ProposalBoardCard.tsx` | Sprint 4 |
| `src/features/proposals/board/ProposalStagePager.tsx` | Sprint 4 |
| `src/features/proposals/board/ProposalProgramBoardView.tsx` | Sprint 4 |
| `src/features/proposals/board/ProposalListView.tsx` | Sprint 4 |
| `src/features/proposals/board/ProposalFiltersSheet.tsx` | Sprint 4 |
| `src/features/proposals/board/MoveProposalSheet.tsx` | Sprint 4 |
| `app/proposal/new.tsx` | Sprint 4 |
| `app/proposal/[id].tsx` | Sprint 4 |
| `src/features/proposals/editor/ProposalEditorStepper.tsx` | Sprint 4 |
| `src/features/proposals/products/ProductCatalogSheet.tsx` | Sprint 4 |
| `src/features/proposals/products/ProposalProductForm.tsx` | Sprint 4 |
| `src/features/proposals/versions/ProposalVersionSheet.tsx` | Sprint 4 |

### Clientes, leads, avisos e dashboard a modificar (10)

| Arquivo | Sprint |
|---|---|
| `app/(comercial)/clients.tsx` | Sprint 5 |
| `app/(comercial)/leads.tsx` | Sprint 5 |
| `app/(admin)/clients.tsx` | Sprint 5 |
| `app/advertiser/[id].tsx` | Sprint 5 |
| `app/(comercial)/alerts.tsx` | Sprint 5 |
| `app/(admin)/alerts.tsx` | Sprint 5 |
| `app/(admin)/index.tsx` | Sprint 5 |
| `src/features/advertisers/AdvertiserProposalList.tsx` | Sprint 5 |
| `src/features/advertisers/LeadSourcePicker.tsx` | Sprint 5 |
| `src/features/recall/RecallReminderSheet.tsx` | Sprint 5 |

### Administração a modificar (13)

| Arquivo | Sprint |
|---|---|
| `app/admin/lead-sources/index.tsx` | Sprint 6 |
| `app/admin/product-durations/index.tsx` | Sprint 6 |
| `app/admin/products/index.tsx` | Sprint 6 |
| `app/admin/programs/index.tsx` | Sprint 6 |
| `app/admin/proposal-templates/index.tsx` | Sprint 6 |
| `app/admin/proposal-types/index.tsx` | Sprint 6 |
| `app/admin/stations/index.tsx` | Sprint 6 |
| `app/admin/stations/[id].tsx` | Sprint 6 |
| `app/admin/users/index.tsx` | Sprint 6 |
| `app/admin/users/[id].tsx` | Sprint 6 |
| `src/features/admin/catalog/CatalogListScreen.tsx` | Sprint 6 |
| `src/features/admin/stations/StationPresentationEditor.tsx` | Sprint 6 |
| `components/ImagePickerField.tsx` | Sprint 6 |

### Resultado da auditoria da lista original

- A lista original citava 27 arquivos modificados, mas omitira 22 superfícies visuais ativas.
- A lista corrigida possui 19 arquivos novos e 59 arquivos existentes potencialmente modificados ao longo dos sete sprints.
- Re-exports, guards/layouts sem UI, PDF, API, store e banco foram explicitamente excluídos na seção 3.4.
- O número final pode diminuir se um arquivo já ficar visualmente correto apenas por consumir tokens; qualquer redução deve ser registrada no checklist do sprint, sem criar arquivos artificiais para cumprir contagem.

---

## 7. Validação e Qualidade

```bash
# Comandos de verificação obrigatórios a cada Sprint
pnpm --filter @workspace/mobile run typecheck
pnpm --filter @workspace/mobile test

# Execução visual local; usar a URL da API homologada pelo projeto
cd artifacts/mobile
EXPO_PUBLIC_API_URL=https://propostasmosaico-one.vercel.app/api pnpm exec expo start -c
```

### Checklist de Qualidade Visual

- [ ] Todas as telas usam tokens do Design System (nenhum valor hardcoded)
- [ ] Dark Mode funcional em todas as telas
- [ ] Contraste WCAG AA em todos os textos
- [ ] Touch targets ≥ 44px em todos os botões/links
- [ ] Animações usam apenas `transform`/`opacity` e respeitam Reduce Motion
- [ ] Consistência de espaçamento entre todas as telas
- [ ] App testado no Expo Go/simulador iOS e Android nas telas tocadas pelo sprint
- [ ] Nenhuma rota, request, mutation, payload, permissão ou PDF foi alterado
- [ ] Props legadas continuam compilando e respondendo aos mesmos callbacks

### Registro obrigatório por sprint

Preencher apenas ao terminar o sprint correspondente:

| Sprint | Commit de checkpoint | Typecheck | Testes | iOS | Android | Validação do usuário |
|---|---|---|---|---|---|---|
| 1 | `aa77e2e` | `OK` | `OK` | `OK USUARIO` | `OK USUARIO` | `APROVADO` |
| 2 | Nao criado | `OK` | `OK` | `PENDENTE USUARIO` | `PENDENTE USUARIO` | `AGUARDANDO VALIDACAO VISUAL` |
| 3 | — | — | — | — | — | `BLOQUEADO` |
| 4 | — | — | — | — | — | `BLOQUEADO` |
| 5 | — | — | — | — | — | `BLOQUEADO` |
| 6 | — | — | — | — | — | `BLOQUEADO` |
| 7 | — | — | — | — | — | `BLOQUEADO` |

Ao entregar um sprint para validação, informar exatamente:

1. Quais telas mudaram.
2. Como abrir cada tela com ADMIN e COMERCIAL.
3. O que observar visualmente.
4. Quais comportamentos funcionais foram retestados.
5. O hash do commit de checkpoint em `visual-teste`.

Não marcar a coluna “Validação do usuário” como aprovada por inferência. Ela só muda para `APROVADO` após confirmação explícita do usuário.

### Checklist de Execucao — Sprint 1

- [x] Branch `visual-teste` confirmada antes da implementacao.
- [x] Criados `src/theme/tokens.ts`, `spacing.ts`, `typography.ts`, `shadows.ts` e `index.ts`.
- [x] Implementadas paletas `light` e `dark` completas, preservando todas as chaves legadas usadas por `useColors()`.
- [x] Refatorados `constants/colors.ts` e `hooks/useColors.ts` mantendo compatibilidade com consumidores atuais.
- [x] Criado `src/ui/BrandLogo.tsx` usando os assets reais de `assets/brand/`.
- [x] Criado teste de contrato em `src/theme/__tests__/tokens.test.ts`.
- [x] Validado: `pnpm run typecheck`.
- [x] Validado: `pnpm test`.
- [x] Commit de checkpoint: `aa77e2e`.
- [x] Validacao visual no Expo Go/simulador: aprovada pelo usuario.
- [x] Liberacao do Sprint 2: aprovada pelo usuario.

### Checklist de Execucao — Sprint 2

- [x] Branch de teste `visual-teste-sprint-2` confirmada antes da implementacao.
- [x] Criados componentes UI: `Card.tsx`, `Badge.tsx`, `Button.tsx`, `Input.tsx`, `Header.tsx`, `BottomSheet.tsx`, `Chip.tsx`, `EmptyState.tsx`, `Avatar.tsx`, `Separator.tsx` e `src/ui/index.ts`.
- [x] Componentes novos usam `Pressable`, `StyleSheet.create`, `gap`, `borderCurve: 'continuous'`, areas minimas de toque e props de acessibilidade quando interativos.
- [x] `showConfirm` mantido com `Alert` nativo, sem conversao para sheet.
- [x] `StatusBadge`, `EmptyState` e `FormInput` convertidos para adaptadores sobre a nova UI.
- [x] `ProposalCard` e `AdvertiserCard` preparados para composicao com a nova UI sem alterar navegacao ou callbacks.
- [x] Criado teste de contrato em `src/ui/__tests__/legacyContracts.test.tsx`.
- [x] Validado: `pnpm run typecheck`.
- [x] Validado: `pnpm test`.
- [ ] Commit de checkpoint: pendente ate validacao visual do usuario.
- [ ] Validacao visual no Expo Go/simulador: pendente com o usuario.
- [ ] Liberacao do Sprint 3: bloqueada ate aprovacao visual explicita.

---

## 8. Resumo

| Métrica | Valor |
|---|---|
| **Branch de trabalho** | `visual-teste` |
| **Total de Sprints** | 7, com gate visual obrigatório entre eles |
| **Duração Estimada** | ~4 semanas |
| **Novos arquivos previstos** | 19 (theme, UI e testes de contrato) |
| **Arquivos existentes auditados** | 59 superfícies potenciais, distribuídas por sprint |
| **Funcionalidades alteradas** | 0 (zero) |
| **Dependências adicionadas** | 0 (zero) |
| **Compatibilidade de props** | Adaptadores legados obrigatórios até tarefa posterior |
| **Merge em `main`** | Fora do escopo e proibido sem autorização explícita |
