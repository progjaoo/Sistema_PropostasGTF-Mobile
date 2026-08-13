# Rebrand Mosaico no Aplicativo Mobile - Plano de Implementacao

> **Para agentes executores:** SUB-SKILL OBRIGATORIA: usar `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar este plano tarefa por tarefa. Todas as etapas usam checkboxes para acompanhamento.

**Objetivo:** alinhar o aplicativo React Native/Expo a identidade Mosaico ja aplicada no sistema web, centralizando nome, ativos e cores institucionais sem alterar funcionalidades, API, autenticacao, cores semanticas ou o PDF das propostas.

**Arquitetura:** criar uma configuracao de marca compartilhada e evoluir o `BrandLogo` existente com compatibilidade retroativa. O tema mobile continuara centralizado em `src/theme/tokens.ts`; apenas os tokens institucionais serao alterados para Mosaico. Metadados e imagens nativas usarao derivados PNG dos SVGs oficiais, enquanto a interface usara os ativos oficiais sem duplicar logica por tela.

**Stack:** TypeScript, React Native 0.81, Expo SDK 54, Expo Router 6, Expo Image, React Native StyleSheet, Jest e PNPM Workspaces.

**Status:** Em execucao - tarefas 1 a 6 implementadas parcialmente; aguardando validacao visual no Expo Go para liberar fechamento/documentacao.

## Restricoes Globais

- A cor institucional primaria e `#F25017`; hover/press usa `#D6440F` quando necessario para contraste.
- A marca visivel e `Mosaico Propostas`; a assinatura e `Sistema Comercial Mosaico`.
- Nao exibir a frase `Grupo Torre Forte agora e Mosaico` nas telas publicas.
- Verde permanece sucesso/aprovacao; vermelho permanece erro/rejeicao/destrutivo; ambar permanece alerta; azul pode permanecer informativo.
- `Station.primaryColor`, logos de empresas e cores cadastradas por empresa nao podem ser alterados.
- `src/features/proposals/print/*` e o PDF da proposta ficam fora do escopo.
- Nao alterar endpoints, payloads, tokens, SecureStore, API compartilhada, Prisma, migrations ou Neon.
- Manter `scheme: "gtfpropostas"`, bundle identifier, package Android e slug neste plano para preservar deep links e instalacoes existentes.
- Toda prop publica atual permanece compativel ate todos os consumidores serem migrados e validados.

---

## 1. Referencias e Agentes

### Referencias obrigatorias

- `docs-mobile/README.md`
- `docs-mobile/01-visao-geral-e-estado-atual.md`
- `docs-mobile/03-arquitetura-e-pastas.md`
- `docs-mobile/04-navegacao-perfis-e-telas.md`
- `docs-mobile/06-padroes-ui-seguranca-qualidade.md`
- `plans-mobile/plan-mobile-006-reestruturacao-visual-frontend.md`
- `../Sistema-Propostas/plans/plan-030-rebrand-mosaico-identidade-login.md`
- `../Sistema-Propostas/artifacts/proposta/src/config/brand.ts`
- `../Sistema-Propostas/artifacts/proposta/public/brand/mosaico-icon_bg.svg`
- `../Sistema-Propostas/artifacts/proposta/public/brand/mosaico-logo_bg.svg`

### Agente principal

**Engenheiro React Native/Expo**

Responsavel por ativos nativos, componentes, tema, Expo Router, safe areas e comportamento consistente no Expo Go, iOS e Android.

### Agentes de apoio

| Agente | Responsabilidade |
|---|---|
| Designer UX/UI Mobile | Validar proporcoes dos ativos, contraste, light/dark mode e hierarquia das telas publicas. |
| QA Mobile | Testar iOS/Android, Expo Go, perfis, temas, texto ampliado e regressao funcional. |
| Technical Writer Mobile | Atualizar identidade, inventario de telas, execucao e checklist real do plano. |
| Engenheiro de Seguranca Mobile | Confirmar que scheme, SecureStore, tokens e recuperacao de senha nao foram alterados. |

Nao ha necessidade de alterar backend, banco ou contratos de API.

## 2. Diagnostico do Codigo Atual

1. `src/theme/tokens.ts` ainda usa azul GTF (`#1B4A8A`, `#2563EB`, `#7BA7FF`) como marca e acao primaria.
2. `src/ui/BrandLogo.tsx` referencia somente `gtf-logo-completa.png` e `gtf-logo-horizontal.png` e anuncia `GTF Propostas` na acessibilidade.
3. `AuthScaffold.tsx`, `app/index.tsx` e `reset-password.tsx` ainda exibem textos GTF.
4. `app.json` usa `GTF Propostas Mobile` e o icone/splash legados.
5. O design system do plano 006 ja centraliza cores e componentes; nao e necessario refazer telas nem criar outro kit visual.
6. O PDF mobile resolve a cor pelo cadastro da empresa. Esse comportamento e correto e deve permanecer isolado do rebrand.

## 3. Contratos da Solucao

### 3.1 Configuracao central de marca

**Criar:** `artifacts/mobile/src/config/brand.ts`

```ts
export const BRAND = {
  name: 'Mosaico',
  productName: 'Mosaico Propostas',
  systemName: 'Sistema Comercial Mosaico',
  accessibilityLabel: 'Mosaico Propostas',
  assets: {
    icon: require('../../assets/brand/mosaico-icon_bg.svg'),
    logo: require('../../assets/brand/mosaico-logo_bg.svg'),
  },
} as const;
```

Se o Metro/Expo Go nao processar SVG local via `expo-image`, manter os SVGs como fonte oficial e gerar PNGs equivalentes, sem editar o desenho. A decisao deve ser comprovada no Expo Go antes de migrar consumidores.

### 3.2 Compatibilidade de `BrandLogo`

O contrato atual nao pode quebrar:

```ts
type BrandLogoVariant = 'complete' | 'horizontal' | 'logo' | 'icon';
```

- `complete` continua valido e funciona como alias de `logo`.
- `horizontal` continua valido e funciona como alias de `logo` enquanto nao existir um ativo horizontal Mosaico aprovado.
- `logo` renderiza `mosaico-logo_bg`.
- `icon` renderiza `mosaico-icon_bg`.
- `size`, `width`, `height`, `contentFit`, `style` e `testID` continuam opcionais com o mesmo comportamento.
- O componente continua repassando estilo e `testID`, mantendo area estavel e `contentFit="contain"`.
- O `accessibilityLabel` passa a vir de `BRAND.accessibilityLabel`.

### 3.3 Tema institucional

Alterar somente os papeis de marca em light e dark mode:

| Papel | Light | Dark |
|---|---|---|
| `primary` / `tint` | `#F25017` | `#FF6B2B` |
| `primaryLight` | `#FF6B2B` | `#FF8A5C` |
| `primaryForeground` | branco ou cor aprovada por teste AA | branco ou cor aprovada por teste AA |
| `accent` | `#FFF1EB` | `#35170D` |
| `accentForeground` | `#D6440F` | `#FFB394` |
| `brand.primaryStrong` | `#D6440F` | `#FF8A5C` |

Nao fazer substituicao global de azul. Cada literal deve ser classificado como marca, informacao ou cor de proposta.

### 3.4 Identidade nativa

- Nome visivel do app: `Mosaico Propostas`.
- Icone do app e favicon Expo web: PNG quadrado derivado de `mosaico-icon_bg.svg`.
- Splash: icone Mosaico centralizado, sem deformacao, sobre fundo claro coerente.
- Manter `slug`, `scheme`, `ios.bundleIdentifier` e `android.package` inalterados.
- Alteracoes em icon/splash exigem rebuild EAS para aparecer no app instalado; no Expo Go, validar as telas e o tema.

## 4. Mapa de Arquivos

### Criar

| Arquivo | Responsabilidade |
|---|---|
| `artifacts/mobile/src/config/brand.ts` | Fonte unica de textos e ativos Mosaico. |
| `artifacts/mobile/src/config/__tests__/brand.test.ts` | Contrato de nome, assinatura e ativos. |
| `artifacts/mobile/assets/brand/mosaico-icon_bg.svg` | Copia versionada do ativo oficial web. |
| `artifacts/mobile/assets/brand/mosaico-logo_bg.svg` | Copia versionada do ativo oficial web. |
| `artifacts/mobile/assets/images/mosaico-icon.png` | Derivado 1024x1024 para app icon/favicon. |
| `artifacts/mobile/assets/images/mosaico-splash.png` | Derivado para splash, sem redesenho da marca. |

### Modificar

| Arquivo | Mudanca |
|---|---|
| `artifacts/mobile/src/theme/tokens.ts` | Tokens institucionais Mosaico em light/dark. |
| `artifacts/mobile/src/theme/__tests__/tokens.test.ts` | Expectativas de paleta e preservacao semantica. |
| `artifacts/mobile/src/ui/BrandLogo.tsx` | Ativos Mosaico e aliases retrocompativeis. |
| `artifacts/mobile/src/ui/__tests__/legacyContracts.test.tsx` | Contrato antigo e novas variantes. |
| `artifacts/mobile/src/features/auth/AuthScaffold.tsx` | Textos centralizados e logo Mosaico. |
| `artifacts/mobile/app/index.tsx` | Estado inicial com marca centralizada. |
| `artifacts/mobile/app/(public)/reset-password.tsx` | Remover referencia GTF do subtitulo. |
| `artifacts/mobile/app.json` | Nome, icon, splash e favicon Mosaico; preservar IDs e scheme. |
| `docs-mobile/01-visao-geral-e-estado-atual.md` | Nome atual do produto. |
| `docs-mobile/06-padroes-ui-seguranca-qualidade.md` | Paleta e regras semanticas Mosaico. |
| `docs-mobile/04-navegacao-perfis-e-telas.md` | Identidade das telas publicas. |
| `plans-mobile/README.md` | Registrar plano 008 e estado. |

### Preservar explicitamente

- `artifacts/mobile/src/features/proposals/print/*`
- `artifacts/mobile/src/api/*`
- `artifacts/mobile/src/store/authStore.ts`
- rotas e handlers de login, cadastro e recuperacao de senha;
- `scheme: gtfpropostas`, bundle ID e Android package;
- backend, OpenAPI, Prisma e Neon.

---

## 5. Execucao Passo a Passo

### Tarefa 1: Baseline e contrato da marca

**Arquivos:** criar `src/config/brand.ts`, `src/config/__tests__/brand.test.ts`; copiar os dois SVGs oficiais.

**Produz:** `BRAND` como fonte unica e ativos locais versionados.

- [x] Registrar branch atual e `git status --short`, sem descartar mudancas existentes.
- [x] Copiar os SVGs oficiais do projeto web preservando bytes e nomes.
- [x] Escrever teste que exige `Mosaico`, `Mosaico Propostas`, `Sistema Comercial Mosaico` e caminhos dos ativos.
- [x] Executar o teste e confirmar falha pela ausencia da configuracao.
- [x] Implementar `BRAND` sem variaveis de ambiente e sem frase de transicao.
- [x] Executar o teste e confirmar sucesso.
- [ ] Commit sugerido: `feat(mobile): centralize Mosaico brand contract`.

Comando:

```bash
pnpm --filter @workspace/mobile test -- src/config/__tests__/brand.test.ts
```

### Tarefa 2: `BrandLogo` retrocompativel

**Arquivos:** modificar `src/ui/BrandLogo.tsx` e `src/ui/__tests__/legacyContracts.test.tsx`.

**Consome:** `BRAND.assets.icon` e `BRAND.assets.logo`.

**Produz:** variantes `complete`, `horizontal`, `logo` e `icon` sem quebrar consumidores.

- [x] Criar teste para as props legadas `complete` e `horizontal`.
- [x] Criar teste para `logo`, `icon`, `style`, `testID`, dimensoes e label acessivel.
- [x] Confirmar falha das novas variantes antes da implementacao.
- [x] Implementar aliases e dimensoes proporcionais com `contentFit="contain"`.
- [ ] Validar os SVGs no Expo Go; se houver incompatibilidade, gerar PNGs derivados e manter a mesma API do componente.
- [x] Rodar testes e typecheck.
- [ ] Commit sugerido: `feat(mobile): apply Mosaico brand assets`.

### Tarefa 3: Tema laranja Mosaico

**Arquivos:** modificar `src/theme/tokens.ts` e `src/theme/__tests__/tokens.test.ts`.

**Produz:** paletas light/dark institucionais, mantendo todas as chaves legadas.

- [x] Escrever testes para `primary`, `primaryLight`, `accent` e `accentForeground` nos dois temas.
- [x] Escrever testes que mantenham `success`, `warning`, `destructive`, `approved`, `rejected` e `info` semanticamente distintos.
- [x] Confirmar falha com a paleta azul atual.
- [x] Alterar somente tokens de marca e acao.
- [x] Auditar literais azuis e classificar antes de alterar.
- [x] Validar contraste de botao, texto, foco, chip ativo e tab ativa por contrato de token e revisao visual pendente no Expo Go.
- [x] Rodar testes e typecheck.
- [ ] Commit sugerido: `feat(mobile): apply Mosaico theme tokens`.

Auditoria:

```bash
grep -RInE '#1B4A8A|#2563EB|#7BA7FF|#93C5FD' artifacts/mobile \
  --exclude-dir=node_modules --exclude-dir=.expo
```

### Tarefa 4: Telas publicas e estado inicial

**Arquivos:** modificar `AuthScaffold.tsx`, `app/index.tsx` e `app/(public)/reset-password.tsx`.

**Consome:** `BRAND` e `BrandLogo`.

- [x] Criar/ajustar testes para garantir ausencia de `GTF Propostas`, `Sistema Comercial GTF` e da frase de transicao nas telas ativas.
- [x] Atualizar o lockup para Mosaico sem alterar estrutura, teclado ou safe area.
- [x] Atualizar textos visiveis por meio de `BRAND`, sem strings duplicadas.
- [x] Preservar handlers, endpoint `/auth/mobile/login`, cadastro e recuperacao de senha.
- [ ] Validar loading, erro, senha visivel, retorno e teclado em iPhone pequeno e Android.
- [ ] Validar light/dark mode sem sobreposicao.
- [ ] Commit sugerido: `feat(mobile): rebrand public access screens`.

### Tarefa 5: Icone, splash e metadados Expo

**Arquivos:** gerar imagens em `assets/images/` e modificar `app.json`.

- [x] Gerar PNG 1024x1024 a partir do SVG oficial com fundo integral, sem recorte do monograma. JÁ TEM AS IMAGENS PRONTAS 
- [x] Gerar imagem de splash com margem segura e proporcao aprovada. GERE A SPLASH COM O FUNDO LARANJA + mosaico-icon.svg 
- [x] Atualizar `expo.name`, `icon`, `splash.image`, `splash.backgroundColor` e `web.favicon`.
- [x] Manter `slug`, `scheme`, bundle ID e package exatamente como estao.
- [x] Executar `pnpm exec expo config --type public` e verificar caminhos resolvidos.
- [ ] Validar splash no Expo Go; registrar que app icon real exige novo build EAS.
- [ ] Commit sugerido: `feat(mobile): update Mosaico app metadata`.

### Tarefa 6: Auditoria de regressao e isolamento do PDF

**Arquivos:** nenhum arquivo funcional novo fora dos ajustes de navegacao/CTA solicitados; somente correcoes estritamente relacionadas se um teste falhar.

- [x] Ajustar cor da tab selecionada em `NativeTabs` e tabs classicas para usar o laranja Mosaico, removendo o azul institucional residual da tab `Propostas`.
- [x] Ajustar botao `Nova Proposta` da tela de Propostas para padrao mobile legivel, com area de toque maior, icone proporcional e texto curto `Nova`.
- [x] Adicionar seta de retorno em `Meu Perfil`, com fallback por papel do usuario quando nao houver historico de navegacao.
- [ ] Buscar strings GTF remanescentes e classificar identificadores tecnicos versus texto visivel.
- [ ] Confirmar que `proposalPrintHtml.ts` continua usando `station.primaryColor`.
- [ ] Confirmar que nenhum arquivo em `src/features/proposals/print/` mudou no diff.
- [ ] Validar login ADMIN e COMERCIAL, logout, restauracao de sessao e reset de senha.
- [ ] Validar Dashboard, Propostas, Clientes, Avisos e Menu nos dois temas.
- [ ] Validar iOS Expo Go e pelo menos um Android/simulador antes de release.
- [x] Executar testes direcionados da tab laranja, CTA Nova Proposta e retorno do Perfil.
- [x] Executar typecheck.
- [x] Executar suite completa.

Comandos:

```bash
pnpm --filter @workspace/mobile run typecheck
pnpm --filter @workspace/mobile test
git diff -- artifacts/mobile/src/features/proposals/print
grep -RInE 'GTF Propostas|Sistema Comercial GTF|gtf-logo' artifacts/mobile \
  --exclude-dir=node_modules --exclude-dir=.expo
```

### Tarefa 7: Documentacao e fechamento

**Arquivos:** atualizar `docs-mobile` e o indice `plans-mobile/README.md`.

- [ ] Atualizar nome, assinatura, paleta e local dos ativos oficiais.
- [ ] Registrar que API e banco continuam compartilhados e inalterados.
- [ ] Registrar a compatibilidade temporaria de scheme e identificadores tecnicos GTF.
- [ ] Atualizar o checklist final deste plano somente com evidencias reais.
- [ ] Commit sugerido: `docs(mobile): document Mosaico identity`.

---

## 6. Checkpoints de Validacao Visual

### Checkpoint A - Marca e tema

- Login e estado inicial exibem Mosaico.
- Botoes, tabs, chips, foco e links usam laranja.
- Status semanticamente verdes, vermelhos, amarelos e azuis permanecem corretos.
- Light e dark mode estao legiveis.

### Checkpoint B - Navegacao autenticada

- ADMIN e COMERCIAL autenticam e veem tabs ativas em laranja.
- Dashboard, Propostas, Clientes, Avisos e Menu nao apresentam azul institucional residual.
- Conteudo longo, teclado e safe areas nao sobrepoem controles.

### Checkpoint C - Metadados nativos

- Splash Mosaico aparece sem deformacao.
- `expo config` aponta para os novos assets.
- Novo build EAS apresenta nome e icone Mosaico na home do dispositivo.

## 7. Estrategia de Testes

### Automatizados

- Contrato `BRAND`.
- Props legadas e novas de `BrandLogo`.
- Tokens light/dark e cores semanticas preservadas.
- Suite existente de componentes e autenticacao.
- Typecheck integral.

### Manuais

| Plataforma | Cenarios minimos |
|---|---|
| iOS Expo Go | Login, cadastro, forgot/reset, ADMIN, COMERCIAL, light/dark, texto ampliado. |
| Android Expo Go/emulador | Mesmos fluxos, splash, teclado e botao voltar. |
| Expo web | Favicon, tela publica e responsividade basica. |

## 8. Riscos e Mitigacoes

| Risco | Mitigacao |
|---|---|
| SVG local nao renderizar em Expo Go | Validar antes da migracao; usar PNG derivado mantendo SVG como fonte oficial. |
| Troca global de azul recolorir status/PDF | Alterar tokens institucionais e auditar literais individualmente. |
| Texto branco nao atingir contraste sobre laranja | Usar `#D6440F` no fundo da acao quando o teste AA exigir. |
| Renomear scheme quebrar reset de senha | Preservar `gtfpropostas` neste plano. |
| Icone nao mudar no Expo Go | Diferenciar validacao visual do app de validacao do binario; gerar novo EAS build. |
| Props antigas quebrarem telas | Manter aliases e testes de contrato ate migracao completa. |
| Identidade GTF permanecer na documentacao | Atualizar docs atuais sem apagar historico tecnico ou nomes de repositorio. |

## 9. Criterios de Aceite

1. O aplicativo exibe `Mosaico Propostas` e `Sistema Comercial Mosaico` nas superficies publicas.
2. Nenhuma tela ativa exibe a frase de transicao da marca.
3. Logo e icone Mosaico usam os ativos oficiais sem corte ou deformacao.
4. Acoes e selecoes institucionais usam a paleta laranja Mosaico em light e dark mode.
5. Cores de status, empresas, propostas e PDFs permanecem inalteradas.
6. Login, cadastro, forgot/reset, sessao e perfis funcionam como antes.
7. `BrandLogo` continua aceitando as props e variantes legadas.
8. Scheme, bundle IDs, package, API e banco nao mudam.
9. Testes e typecheck passam.
10. iOS e Android sao validados antes do build de producao.

## 10. Checklist da Implementacao

### Implementacao

- [x] Contrato `BRAND` criado e testado.
- [x] Ativos oficiais Mosaico adicionados ao app.
- [x] `BrandLogo` atualizado com compatibilidade retroativa.
- [ ] Tema light/dark atualizado para Mosaico.
- [ ] Telas publicas e estado inicial atualizados.
- [ ] Icone, splash e metadados atualizados.
- [ ] PDF e cores por empresa comprovadamente preservados.
- [x] Tab selecionada e CTA principal de Propostas ajustados para Mosaico.
- [x] Tela Meu Perfil recebeu seta de retorno.
- [ ] Documentacao mobile atualizada.

### Validacoes Executadas

- [x] Testes direcionados.
- [x] Suite mobile completa.
- [x] Typecheck.
- [ ] Expo Go no iOS.
- [ ] Expo Go/emulador no Android.
- [ ] Light e dark mode.
- [ ] ADMIN e COMERCIAL.

### Pendencias e Riscos Residuais

- Tarefas 3 a 7 permanecem pendentes por decisao de execucao em lotes de duas tarefas.
- A renderizacao dos SVGs oficiais no Expo Go aguarda validacao visual do usuario neste checkpoint.
- As telas ainda podem exibir textos e cores GTF porque sua migracao pertence as tarefas 3 e 4.
