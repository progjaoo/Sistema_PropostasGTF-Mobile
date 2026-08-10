# Plan Mobile 006 — Reestruturação Visual Completa (Front-End Only)

> **Objetivo:** Redesenhar toda a interface do aplicativo GTF Propostas com padrão visual premium nível SaaS (estilo Vercel/shadcn/Linear), **sem alterar nenhuma funcionalidade, rota, endpoint ou lógica de negócio**. Apenas FRONT-END puro — cores, tipografia, espaçamentos, componentes visuais e micro-animações.

---

## 1. Diagnóstico Visual Atual

### Problemas Identificados no Layout Atual (Gerado pelo Replit)

| # | Problema | Impacto Visual |
|---|---|---|
| **V1** | **Tokens de cor genéricos e hardcoded** — As cores estão definidas diretamente no `constants/colors.ts` sem suporte a dark mode, sem agrupamento semântico (brand, status, surface) e sem preparação para troca de marca | Quando a nova marca chegar, será necessário editar dezenas de arquivos manualmente |
| **V2** | **Estilos inline dispersos** — Cada tela define seus próprios `StyleSheet.create()` com valores absolutos repetidos (fontes, gaps, paddings, border-radius). Não há Design System central | Inconsistência visual entre telas (ex: cards do board vs cards de clientes) |
| **V3** | **Componentes visuais "crus"** — Os componentes `StatusBadge`, `ProposalCard`, `AdvertiserCard`, `EmptyState` foram criados com estilos mínimos sem refinamento visual | Visual genérico que não transmite confiança profissional |
| **V4** | **Headers e filtros sem padrão** — Cada tela reconstrói seu próprio header com padding/spacing diferente | A navegação parece "desconexa" ao transitar entre telas |
| **V5** | **Formulários sem consistência** — Os inputs em `new.tsx`, `[id].tsx`, `login.tsx`, `profile.tsx` têm estilos diferentes de altura, borda e foco | Experiência fragmentada |
| **V6** | **Modais e Bottom Sheets básicos** — O `MoveProposalSheet`, `ConfirmDialog` e `ProductCatalogSheet` usam Modal/View nativo sem animação de entrada/saída suave | Sensação de "app inacabado" |
| **V7** | **Sem micro-animações** — Sem transições de fade, scale ou slide nos cards, modais e tabs | O app parece estático e sem vida |
| **V8** | **Dark Mode inoperante** — O `useColors` prevê dark mode mas não existe paleta `dark` em `colors.ts` | Metade dos usuários corporativos usam dark mode |

---

## 2. Estratégia de Reestruturação

### Princípios

1. **Zero quebra funcional** — Nenhuma rota, endpoint, mutation, query ou lógica de negócio será alterada.
2. **Design Tokens centralizados** — Um único arquivo (`src/theme/tokens.ts`) controlará TODAS as cores, fontes, espaçamentos e raios do app.
3. **Preparado para a nova marca** — Ao receber o onboarding (logo, cores, tipografia), bastará editar o arquivo de tokens + trocar a imagem da logo.
4. **Componentes reutilizáveis padronizados** — Biblioteca interna de componentes visuais (`src/ui/`) que todas as telas usarão.

### Kit de UI Base: **Padrão shadcn/Vercel Mobile** (Manual)

> Não adicionaremos dependências externas de UI kit. Construiremos componentes internos **inspirados** no padrão visual do [React Native Reusables (native-cn)](https://rnr-docs.vercel.app/) e do [shadcn/ui](https://ui.shadcn.com), mantendo o projeto leve e 100% customizável.

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
| `<UIBottomSheet />` | `src/ui/BottomSheet.tsx` | Wrapper de modal deslizante com animação suave (usando Animated API nativo) |
| `<UIChip />` | `src/ui/Chip.tsx` | Pills de filtro (status, programa) com variante `active`/`inactive` |
| `<UIEmptyState />` | `src/ui/EmptyState.tsx` | Estado vazio padronizado com ícone, título, descrição e ação |
| `<UIAvatar />` | `src/ui/Avatar.tsx` | Avatar circular com iniciais coloridas (para vendedores e clientes) |
| `<UISeparator />` | `src/ui/Separator.tsx` | Linha separadora fina e consistente |
| `<BrandLogo />` | `src/ui/BrandLogo.tsx` | Componente de logo centralizado — placeholder atual + slot para nova logo |

### 3.3 Telas a Redesenhar (Apenas Visual)

| Tela | Arquivo | Mudanças Visuais |
|---|---|---|
| **Login** | `app/(public)/login.tsx` | Card centralizado, inputs com ícone, botão gradient sutil, logo no topo |
| **Registro** | `app/(public)/register.tsx` | Idem login, com stepper visual de progresso |
| **Esqueci Senha** | `app/(public)/forgot-password.tsx` | Idem login |
| **Reset Senha** | `app/(public)/reset-password.tsx` | Idem login |
| **Dashboard Admin** | `app/(admin)/index.tsx` | Cards de métricas com sombra suave, ícones coloridos, gráficos com cantos arredondados |
| **Dashboard Comercial** | `app/(comercial)/index.tsx` | Idem admin adaptado para vendedor |
| **Board de Propostas** | `src/features/proposals/board/ProposalBoardScreen.tsx` | Header padronizado, chips de filtro com `UIChip`, search com `UIInput` |
| **Kanban Columns** | `src/features/proposals/board/ProposalStagePager.tsx` | Cards com sombra sutil, badge de contagem redesenhado |
| **Cards do Board** | `src/features/proposals/board/ProposalBoardCard.tsx` | `UICard` com avatar do vendedor, badge de status, valor de investimento em destaque |
| **Lista de Propostas** | `src/features/proposals/board/ProposalListView.tsx` | `UICard` com layout de lista compacta |
| **Mover Etapa** | `src/features/proposals/board/MoveProposalSheet.tsx` | `UIBottomSheet` com animação |
| **Nova Proposta** | `app/proposal/new.tsx` | `UIHeader` + `UICard` para seleções + `UIButton` primário para criar |
| **Editor de Proposta** | `app/proposal/[id].tsx` | Stepper visual no topo, seções com `UICard`, inputs com `UIInput` |
| **Catálogo de Produtos** | `src/features/proposals/products/ProductCatalogSheet.tsx` | `UIBottomSheet` com busca e cards de produto redesenhados |
| **Form de Produto** | `src/features/proposals/products/ProposalProductForm.tsx` | Inputs padronizados, seletor de cor visual |
| **Clientes** | `app/(comercial)/clients.tsx` | Lista com `UICard`, avatar, badge de status |
| **Leads** | `app/(comercial)/leads.tsx` | Idem clientes |
| **Clientes Admin** | `app/(admin)/clients.tsx` | Idem com controles admin |
| **Detalhe Cliente** | `app/advertiser/[id].tsx` | Card de perfil, seções colapsáveis |
| **Avisos** | `app/(comercial)/alerts.tsx` e `app/(admin)/alerts.tsx` | Cards de notificação com ícone de severidade e data relativa |
| **Perfil** | `app/(comercial)/profile.tsx` | Avatar grande, seções de dados com `UICard` |
| **Menu Admin** | `app/(admin)/menu.tsx` | Lista de opções com ícones, separadores, versão do app |
| **Tab Bars** | `app/(comercial)/_layout.tsx` e `app/(admin)/_layout.tsx` | Refinamento visual dos ícones e cores ativa/inativa |

---

## 4. Plano de Implementação em Sprints

### Sprint 1 — Infraestrutura de Design System 🏗️
**Duração:** 3 dias | **Impacto:** Fundação para todo o redesign

- [ ] Criar `src/theme/tokens.ts` com paletas `light` e `dark` completas (brand, surface, status, text)
- [ ] Criar `src/theme/spacing.ts` com escala de espaçamentos
- [ ] Criar `src/theme/typography.ts` com mapa tipográfico
- [ ] Criar `src/theme/shadows.ts` com sombras reutilizáveis
- [ ] Refatorar `constants/colors.ts` para importar os tokens (mantendo backward compatibility)
- [ ] Refatorar `hooks/useColors.ts` para dark mode funcional
- [ ] Criar `src/ui/BrandLogo.tsx` (placeholder para nova logo)

### Sprint 2 — Componentes UI Padronizados 🧩
**Duração:** 5 dias | **Impacto:** Biblioteca interna reutilizável

- [ ] Criar `src/ui/Card.tsx` com variantes (`default`, `outlined`, `elevated`)
- [ ] Criar `src/ui/Badge.tsx` com variantes de status e cor
- [ ] Criar `src/ui/Button.tsx` com variantes (`primary`, `secondary`, `outline`, `destructive`, `ghost`)
- [ ] Criar `src/ui/Input.tsx` padronizado (48px, borda fina, ícone, foco azul)
- [ ] Criar `src/ui/Header.tsx` (título + subtítulo + ações)
- [ ] Criar `src/ui/BottomSheet.tsx` com animação de slide-up suave
- [ ] Criar `src/ui/Chip.tsx` para filtros
- [ ] Criar `src/ui/EmptyState.tsx` redesenhado
- [ ] Criar `src/ui/Avatar.tsx` com iniciais coloridas
- [ ] Criar `src/ui/Separator.tsx`

### Sprint 3 — Redesign das Telas Públicas e de Navegação 🎨
**Duração:** 4 dias | **Impacto:** Primeira impressão do app

- [ ] Redesenhar `login.tsx` — Card centralizado, logo, inputs com ícone, botão primário
- [ ] Redesenhar `register.tsx` — Idem com stepper de progresso
- [ ] Redesenhar `forgot-password.tsx` e `reset-password.tsx`
- [ ] Refinar Tab Bar — Cores ativa/inativa, ícones e tipografia
- [ ] Redesenhar `profile.tsx` — Avatar grande, seções com `UICard`
- [ ] Redesenhar `menu.tsx` (admin) — Lista padronizada com ícones

### Sprint 4 — Redesign do Módulo de Propostas 📋
**Duração:** 5 dias | **Impacto:** Tela mais usada do app

- [ ] Redesenhar `ProposalBoardScreen` — `UIHeader`, `UIChip`, `UIInput`
- [ ] Redesenhar `ProposalBoardCard` — `UICard` com `UIBadge`, `UIAvatar`, valor em destaque
- [ ] Redesenhar `ProposalStagePager` — Colunas com header estilizado e contagem
- [ ] Redesenhar `ProposalListView` — Cards compactos
- [ ] Redesenhar `MoveProposalSheet` — `UIBottomSheet` animado
- [ ] Redesenhar `proposal/new.tsx` — Seleções com `UICard`, busca com `UIInput`
- [ ] Redesenhar `proposal/[id].tsx` — Stepper visual, seções com `UICard`
- [ ] Redesenhar `ProductCatalogSheet` — `UIBottomSheet` com busca
- [ ] Redesenhar `ProposalProductForm` — Inputs padronizados

### Sprint 5 — Redesign de Clientes, Leads e Avisos 👥
**Duração:** 4 dias | **Impacto:** Consistência total

- [ ] Redesenhar `clients.tsx` (comercial e admin) — `UICard` com `UIAvatar` e `UIBadge`
- [ ] Redesenhar `leads.tsx` — Idem
- [ ] Redesenhar `advertiser/[id].tsx` — Card de perfil, seções colapsáveis
- [ ] Redesenhar `alerts.tsx` (comercial e admin) — Cards com ícone de severidade
- [ ] Redesenhar Dashboard Admin (`(admin)/index.tsx`) — Cards de métricas
- [ ] Redesenhar Dashboard Comercial (`(comercial)/index.tsx`) — Métricas do vendedor

### Sprint 6 — Micro-Animações, Dark Mode e Polimento Final ✨
**Duração:** 3 dias | **Impacto:** Sensação de app premium

- [ ] Adicionar animações de entrada (fade-in + slide-up) nos cards ao carregar
- [ ] Adicionar animação de pressionar nos botões (scale: 0.97)
- [ ] Adicionar transição suave de cores na Tab Bar
- [ ] Testar e validar Dark Mode em todas as telas
- [ ] Verificar contraste de acessibilidade (WCAG AA)
- [ ] Executar `pnpm --filter @workspace/mobile run typecheck`
- [ ] Executar `pnpm --filter @workspace/mobile test`

---

## 5. Preparação para o Onboarding da Nova Marca

Quando o manual da marca (logo, cores, tipografia) chegar, o processo será:

```
1. Abrir src/theme/tokens.ts
2. Substituir os valores de brand.primary, brand.secondary, brand.accent
3. Trocar a imagem em src/ui/BrandLogo.tsx
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
    // Dark mode será espelhada aqui
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
    sm: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    md: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
    lg: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  },
};
```

---

## 6. Arquivos Completos a Criar e Modificar

### Novos Arquivos (17)
| Arquivo | Sprint |
|---|---|
| `src/theme/tokens.ts` | Sprint 1 |
| `src/theme/spacing.ts` | Sprint 1 |
| `src/theme/typography.ts` | Sprint 1 |
| `src/theme/shadows.ts` | Sprint 1 |
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
| `src/ui/BrandLogo.tsx` | Sprint 1 |
| `src/ui/index.ts` | Sprint 2 |
| `src/theme/index.ts` | Sprint 1 |

### Arquivos a Modificar (Visual Only) (27)
| Arquivo | Sprint |
|---|---|
| `constants/colors.ts` | Sprint 1 |
| `hooks/useColors.ts` | Sprint 1 |
| `app/(public)/login.tsx` | Sprint 3 |
| `app/(public)/register.tsx` | Sprint 3 |
| `app/(public)/forgot-password.tsx` | Sprint 3 |
| `app/(public)/reset-password.tsx` | Sprint 3 |
| `app/(comercial)/_layout.tsx` | Sprint 3 |
| `app/(admin)/_layout.tsx` | Sprint 3 |
| `app/(comercial)/profile.tsx` | Sprint 3 |
| `app/(admin)/menu.tsx` | Sprint 3 |
| `src/features/proposals/board/ProposalBoardScreen.tsx` | Sprint 4 |
| `src/features/proposals/board/ProposalBoardCard.tsx` | Sprint 4 |
| `src/features/proposals/board/ProposalStagePager.tsx` | Sprint 4 |
| `src/features/proposals/board/ProposalListView.tsx` | Sprint 4 |
| `src/features/proposals/board/MoveProposalSheet.tsx` | Sprint 4 |
| `app/proposal/new.tsx` | Sprint 4 |
| `app/proposal/[id].tsx` | Sprint 4 |
| `src/features/proposals/products/ProductCatalogSheet.tsx` | Sprint 4 |
| `src/features/proposals/products/ProposalProductForm.tsx` | Sprint 4 |
| `app/(comercial)/clients.tsx` | Sprint 5 |
| `app/(comercial)/leads.tsx` | Sprint 5 |
| `app/(admin)/clients.tsx` | Sprint 5 |
| `app/advertiser/[id].tsx` | Sprint 5 |
| `app/(comercial)/alerts.tsx` | Sprint 5 |
| `app/(admin)/alerts.tsx` | Sprint 5 |
| `app/(admin)/index.tsx` | Sprint 5 |
| `app/(comercial)/index.tsx` | Sprint 5 |

### Componentes Existentes a Redesenhar (6)
| Componente | Sprint |
|---|---|
| `components/StatusBadge.tsx` | Sprint 2 (substituir por `src/ui/Badge.tsx`) |
| `components/ProposalCard.tsx` | Sprint 4 (migrar para `UICard`) |
| `components/AdvertiserCard.tsx` | Sprint 5 (migrar para `UICard`) |
| `components/EmptyState.tsx` | Sprint 2 (substituir por `src/ui/EmptyState.tsx`) |
| `components/FormInput.tsx` | Sprint 2 (substituir por `src/ui/Input.tsx`) |
| `components/ConfirmDialog.tsx` | Sprint 2 (migrar para `UIBottomSheet`) |

---

## 7. Validação e Qualidade

```bash
# Comandos de verificação obrigatórios a cada Sprint
pnpm --filter @workspace/mobile run typecheck
pnpm --filter @workspace/mobile test
```

### Checklist de Qualidade Visual
- [ ] Todas as telas usam tokens do Design System (nenhum valor hardcoded)
- [ ] Dark Mode funcional em todas as telas
- [ ] Contraste WCAG AA em todos os textos
- [ ] Touch targets ≥ 44px em todos os botões/links
- [ ] Animações de entrada suaves (fade + slide)
- [ ] Consistência de espaçamento entre todas as telas
- [ ] App testado no simulador iOS e Android

---

## 8. Resumo

| Métrica | Valor |
|---|---|
| **Total de Sprints** | 6 |
| **Duração Estimada** | ~4 semanas |
| **Novos arquivos** | 17 (theme + ui components) |
| **Arquivos modificados** | 27 telas + 6 componentes |
| **Funcionalidades alteradas** | 0 (zero) |
| **Dependências adicionadas** | 0 (zero) |
| **Preparado para nova marca** | ✅ Troca de 1 arquivo = app inteiro recolorido |
