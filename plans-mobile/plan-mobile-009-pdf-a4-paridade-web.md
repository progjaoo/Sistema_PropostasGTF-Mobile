# PDF A4 Mobile com Paridade ao Sistema Web - Plano de Implementacao

> **Para agentes executores:** SUB-SKILL OBRIGATORIA: usar `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar este plano tarefa por tarefa. Aplicar TDD e atualizar os checkboxes somente depois de cada validacao real.

**Objetivo:** fazer o aplicativo Expo gerar e compartilhar a proposta em PDF A4 com a mesma estrutura, conteudo, identidade da empresa e regras de paginacao usadas pelo sistema web, sem rodape isolado, corte de cards ou pagina extra causada pelo formato Letter.

**Arquitetura:** o mobile continuara gerando o arquivo localmente com `expo-print` e compartilhando com `expo-sharing`, mas o HTML passara a usar um modelo normalizado, tokens A4 e um paginador deterministico alinhados ao layout web. A folha fisica sera informada ao SDK como A4 em pontos (`595 x 842`), e o HTML usara paginas explicitas de `210mm x 297mm`; assim, o WebView nativo e o CSS deixam de disputar o tamanho da folha.

**Stack:** TypeScript, React Native 0.81, Expo SDK 54, Expo Router 6, `expo-print`, `expo-sharing`, `expo-asset`, `expo-file-system`, HTML/CSS de impressao, Jest e PNPM Workspaces.

**Status:** Implementado em código; homologação visual iOS/Android pendente.

## Restricoes Globais

- O PDF deve preservar `Station.primaryColor` e `Station.logoBase64`; o rebrand Mosaico da interface nao pode substituir a identidade da empresa anunciada.
- O layout visual de referencia e o motor atual do web em `Sistema-Propostas/artifacts/proposta/src/components/proposal/print` e `Sistema-Propostas/artifacts/proposta/src/index.css`.
- O aplicativo nao deve abrir dialogo de impressao para gerar o arquivo: deve continuar usando `Print.printToFileAsync()` e depois `Sharing.shareAsync()`.
- Nao alterar API, OpenAPI, Prisma, migrations, Neon ou o sistema web neste plano.
- Nao persistir PDF, logo ou dados de proposta em um segundo backend.
- Nao depender da rede para carregar Montserrat durante a geracao do PDF.
- Nenhum card, bloco de investimento ou rodape pode ser dividido entre folhas.
- Investimento e contato aparecem juntos, uma unica vez, na ultima folha.
- Hero e Apresentacao aparecem apenas na primeira folha; continuacoes repetem cabecalho compacto e `Plano de Acoes - Continuacao`.
- A geracao deve funcionar em iOS e Android; Expo Go e build de desenvolvimento devem produzir o mesmo numero de folhas.
- O plano nao autoriza mudanca nas cores de PDF cadastradas por empresa.

---

## 1. Referencias e Agentes

### Referencias obrigatorias

- `docs-mobile/README.md`
- `docs-mobile/05-api-autenticacao-e-dados.md`
- `docs-mobile/06-padroes-ui-seguranca-qualidade.md`
- `docs-mobile/07-execucao-ambientes-publicacao.md`
- `plans-mobile/plan-mobile-004-correcao-propostas-board-pdf.md`
- `plans-mobile/plan-mobile-005-fluxo-propostas-paridade-total.md`
- `artifacts/mobile/src/features/proposals/print/proposalPrintHtml.ts`
- `artifacts/mobile/src/features/proposals/print/useProposalPdf.ts`
- `../Sistema-Propostas/artifacts/proposta/src/components/proposal/ProposalPrint.tsx`
- `../Sistema-Propostas/artifacts/proposta/src/components/proposal/print/ProposalPrintPage.tsx`
- `../Sistema-Propostas/artifacts/proposta/src/components/proposal/print/ProposalPrintSections.tsx`
- `../Sistema-Propostas/artifacts/proposta/src/components/proposal/print/proposal-print-pagination.ts`
- `../Sistema-Propostas/artifacts/proposta/src/components/proposal/print/proposal-print-utils.ts`
- `../Sistema-Propostas/artifacts/proposta/src/index.css`
- documentacao oficial do Expo Print SDK 54: `Print.printToFileAsync`, `FilePrintOptions.width`, `height`, `margins` e `textZoom`.

### Agente principal

**Arquiteto Mobile**

Responsavel por separar modelo, paginacao, renderizacao HTML e adaptacao ao SDK nativo, evitando que uma correcao visual crie um terceiro contrato de proposta.

### Agentes de apoio

| Agente | Responsabilidade |
|---|---|
| Engenheiro React Native/Expo | Implementar `expo-print`, fontes locais, compartilhamento e compatibilidade iOS/Android. |
| Designer UX/UI Mobile | Comparar hierarquia, proporcoes, tipografia, cores da empresa e densidade com o PDF web. |
| Engenheiro de Integracao Mobile | Confirmar que o DTO atual ja entrega empresa, logo, cor, vendedor, produtos e apresentacao sem alterar a API. |
| QA Mobile | Validar numero de paginas, renderizar os PDFs em PNG e comparar iOS, Android e web. |
| Technical Writer Mobile | Atualizar a documentacao de geracao, validacao e limitacoes conhecidas. |

### Conclusao da analise de integracao

O endpoint `GET /api/proposals/:id` ja retorna:

- `station.name`, `station.slogan`, `station.primaryColor` e `station.logoBase64`;
- `advertiser.tradeName`;
- `createdBy.name`, `createdBy.jobTitle` e `createdBy.contactPhone`;
- `proposalTypeName`, `periodicity`, datas, apresentacao, investimento e produtos.

Portanto, a correcao e integralmente mobile. Nao ha migration nem deploy de banco associado a este plano.

---

## 2. Diagnostico do Codigo Atual

### 2.1 Folha fisica divergente

`proposalPrintHtml.ts` declara `@page { size: A4 }`, mas `useProposalPdf.ts` chama:

```ts
Print.printToFileAsync({ html })
```

Sem `width` e `height`, o Expo Print usa por padrao `612 x 792`, correspondente a US Letter em 72 PPI. O HTML tenta ocupar `210mm x 297mm`, enquanto o arquivo nativo e criado em outra proporcao. O resultado observado e o rodape transferido para uma segunda folha.

### 2.2 Paginacao baseada em estimativa divergente do CSS

O mobile estima a altura por quantidade de caracteres:

```ts
108 + Math.ceil(descriptionLength / 55) * 12 + ...
```

Entretanto, o card renderizado possui `min-height`, `max-height`, `overflow: hidden` e grid em duas colunas. A estimativa nao representa a altura real. O web pagina por linhas e pelo espaco vertical efetivo de cada secao.

### 2.3 Logo sem o fundo da empresa

Quando existe `logoBase64`, o mobile renderiza a imagem diretamente:

```html
<img class="logo" src="...">
```

O web sempre renderiza um container com `backgroundColor: primaryColor` e posiciona a imagem dentro dele. Logos transparentes perdem, portanto, o bloco colorido no mobile.

### 2.4 Conteudo diferente entre web e mobile

- Mobile prioriza `proposal.contactName/contactRole/contactPhone`; web prioriza `proposal.createdBy.*`.
- Mobile usa `propType`; web prioriza `proposalTypeName`.
- Mobile pode imprimir datas ISO; web formata `dd/mm/aaaa`.
- Mobile inclui `detail` e `description`; web imprime a descricao no card segundo o contrato atual.
- Mobile formata investimento por concatenacao de string; web usa formatacao BRL consistente.
- Mobile importa Montserrat remotamente, sem garantia de carregamento antes de o WebView gerar o arquivo.

### 2.5 Ausencia de verificacao do resultado nativo

`Print.printToFileAsync()` retorna `numberOfPages`, mas o aplicativo ignora esse valor. Assim, uma pagina adicional criada pelo motor nativo e compartilhada sem deteccao.

---

## 3. Contratos da Solucao

### 3.1 Dimensoes A4

Criar constantes unicas:

```ts
export const A4_PRINT = {
  widthPt: 595,
  heightPt: 842,
  widthMm: 210,
  heightMm: 297,
  margins: { top: 0, right: 0, bottom: 0, left: 0 },
} as const;
```

O `expo-print` deve receber:

```ts
{
  html,
  width: A4_PRINT.widthPt,
  height: A4_PRINT.heightPt,
  margins: A4_PRINT.margins,
  useMarkupFormatter: false,
  textZoom: 100,
}
```

`595 x 842` e o A4 arredondado em pontos a 72 PPI. O CSS continua usando unidades fisicas `210mm x 297mm`.

### 3.2 Modelo normalizado de impressao

Criar um DTO interno independente da tela:

```ts
export type ProposalPrintData = {
  primaryColor: string;
  stationName: string;
  stationSlogan: string;
  stationLogoDataUrl: string | null;
  proposalTypeName: string;
  clientName: string;
  showPeriod: boolean;
  periodLabel: string;
  stats: Array<{ value: string; description: string }>;
  products: Array<{
    id: string;
    quantity: string;
    title: string;
    metadata: string;
    description: string;
    programName: string;
  }>;
  investmentDescription: string;
  investmentValue: string;
  sellerName: string;
  sellerRole: string;
  sellerPhone: string;
};
```

`mapProposalToPrintData(proposal)` deve replicar as prioridades do web:

- cor: hexadecimal valido de `station.primaryColor`, fallback `#427EFF`;
- empresa: `station.name`, fallback `Empresa`;
- cliente: `advertiser.tradeName`, depois `advertiser.legalName`, depois `clientLine1`;
- tipo: `proposalTypeName`, depois `propType`;
- vendedor: `createdBy.*`, depois os campos de contato legados da proposta;
- periodo: datas em `dd/mm/aaaa`; sem datas, `periodicity` em portugues; respeitar `showPeriod === false`;
- investimento: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` sobre valor normalizado;
- produto: quantidade com dois digitos, metadados na ordem `duracao - horario - sazonalidade`, descricao e programa.

### 3.3 Paginacao por linhas e espaco fisico

Remover `estimateProductHeight()`. Como os cards do layout web possuem altura visual limitada, o paginador mobile deve trabalhar com as mesmas medidas fisicas:

```ts
export type ProposalPrintPage = {
  kind: 'single' | 'first' | 'continuation' | 'last';
  products: ProposalPrintData['products'];
  startIndex: number;
  showHero: boolean;
  showStats: boolean;
  showInvestment: boolean;
  showFooter: boolean;
};
```

Tokens de layout a espelhar do web:

- pagina: `297mm`, padding vertical total `18mm`;
- cabecalho e margem: `19mm`;
- hero e margem: `55mm`;
- apresentacao completa: altura fixa medida pelos mesmos tokens de CSS;
- card: `39mm` de altura maxima;
- gap de linha: `4mm`;
- investimento + rodape + separacoes: bloco final reservado;
- grid: duas colunas; a altura da pagina aumenta por linha, nao por card.

Algoritmo:

1. tentar acomodar todos os produtos na primeira pagina reservando investimento e rodape;
2. se nao couber, criar primeira pagina sem bloco final, deixando pelo menos um produto para a ultima;
3. nas paginas seguintes, testar primeiro se todo o restante cabe junto do bloco final;
4. se nao couber, criar uma continuacao sem bloco final;
5. nunca criar uma pagina contendo apenas investimento/rodape;
6. nunca confiar em quebra automatica dentro de `.page`.

### 3.4 HTML de pagina explicita

Cada folha deve ser um elemento irmao:

```html
<main class="proposal-print-page proposal-print-page--first">...</main>
<main class="proposal-print-page proposal-print-page--last">...</main>
```

CSS obrigatorio:

```css
@page { size: A4 portrait; margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; }
.proposal-print-page {
  width: 210mm;
  height: 297mm;
  min-height: 297mm;
  max-height: 297mm;
  padding: 10mm 14mm 8mm;
  overflow: hidden;
  break-after: page;
  page-break-after: always;
  display: flex;
  flex-direction: column;
}
.proposal-print-page:last-child {
  break-after: auto;
  page-break-after: auto;
}
.proposal-print-product-card,
.proposal-print-investment,
.proposal-print-footer {
  break-inside: avoid;
  page-break-inside: avoid;
}
```

Nao aplicar `transform`, `scale`, margens externas ou altura automatica na pagina.

### 3.5 Logo com fundo da empresa

O wrapper sempre existe:

```html
<div class="proposal-print-logo" style="background-color: #427EFF">
  <img src="data:image/..." alt="Logo da empresa">
</div>
```

Sem logo, o mesmo wrapper exibe monograma derivado do nome. A imagem usa `object-fit: contain` e padding interno, exatamente como no web.

### 3.6 Fonte local

Empacotar Montserrat 400, 500, 600, 700, 800 e 900. `loadProposalPrintAssets()` converte os arquivos locais para data URLs e produz regras `@font-face`. O HTML nao deve usar `@import` do Google Fonts.

Essa decisao evita alteracao de metrica ou fallback para Arial quando o aparelho estiver offline ou quando o WebView terminar o PDF antes do download remoto.

### 3.7 Invariante do numero de folhas

O gerador retorna:

```ts
type ProposalPrintDocument = {
  html: string;
  expectedPageCount: number;
};
```

Depois de `printToFileAsync`, comparar `result.numberOfPages` com `expectedPageCount`. Se divergirem, nao compartilhar silenciosamente o arquivo; registrar somente a contagem, sem dados pessoais, e mostrar:

```text
Nao foi possivel montar o PDF em A4. Tente novamente.
```

---

## 4. Mapa de Arquivos

### Criar

| Arquivo | Responsabilidade |
|---|---|
| `artifacts/mobile/src/features/proposals/print/proposalPrintModel.ts` | Normalizar o DTO da API para o contrato visual usado no PDF. |
| `artifacts/mobile/src/features/proposals/print/proposalPrintLayout.ts` | Centralizar dimensoes A4, alturas e configuracao do Expo Print. |
| `artifacts/mobile/src/features/proposals/print/proposalPrintPagination.ts` | Distribuir linhas de produtos em paginas explicitas. |
| `artifacts/mobile/src/features/proposals/print/proposalPrintAssets.ts` | Carregar Montserrat local e gerar `@font-face` embutido. |
| `artifacts/mobile/src/features/proposals/print/generateProposalPdfFile.ts` | Orquestrar assets, HTML, Expo Print e verificacao de paginas. |
| `artifacts/mobile/src/features/proposals/print/__tests__/proposalPrintModel.test.ts` | Testar prioridades e formatacao iguais ao web. |
| `artifacts/mobile/src/features/proposals/print/__tests__/proposalPrintPagination.test.ts` | Testar distribuicao e bloco final. |
| `artifacts/mobile/src/features/proposals/print/__tests__/proposalPrintLayout.test.ts` | Testar A4 e opcoes nativas. |
| `artifacts/mobile/src/features/proposals/print/__tests__/generateProposalPdfFile.test.ts` | Testar chamada ao SDK e divergencia de paginas. |
| `artifacts/mobile/assets/fonts/print/Montserrat-400.ttf` | Fonte regular local. |
| `artifacts/mobile/assets/fonts/print/Montserrat-500.ttf` | Fonte medium local. |
| `artifacts/mobile/assets/fonts/print/Montserrat-600.ttf` | Fonte semibold local. |
| `artifacts/mobile/assets/fonts/print/Montserrat-700.ttf` | Fonte bold local. |
| `artifacts/mobile/assets/fonts/print/Montserrat-800.ttf` | Fonte extrabold local. |
| `artifacts/mobile/assets/fonts/print/Montserrat-900.ttf` | Fonte black local. |

### Modificar

| Arquivo | Mudanca |
|---|---|
| `artifacts/mobile/src/features/proposals/print/proposalPrintHtml.ts` | Tornar renderizador puro do modelo e das paginas; remover estimativa e fonte remota. |
| `artifacts/mobile/src/features/proposals/print/useProposalPdf.ts` | Usar orquestrador A4, validar paginas e manter compartilhamento nativo. |
| `artifacts/mobile/src/features/proposals/print/__tests__/proposalPrintHtml.test.ts` | Cobrir estrutura, cor, logo, secoes e pagina final. |
| `artifacts/mobile/src/types/index.ts` | Acrescentar `proposalTypeName` e `periodicity` opcionais ao tipo `Proposal`. |
| `artifacts/mobile/package.json` | Declarar dependencias Expo usadas diretamente para assets e leitura local. |
| `pnpm-lock.yaml` | Registrar versoes compativeis instaladas por `pnpm exec expo install`. |
| `docs-mobile/04-navegacao-perfis-e-telas.md` | Documentar comportamento do botao de gerar/compartilhar PDF. |
| `docs-mobile/06-padroes-ui-seguranca-qualidade.md` | Documentar contrato A4, identidade por empresa e QA visual. |
| `docs-mobile/07-execucao-ambientes-publicacao.md` | Adicionar roteiro de teste de PDF no iOS e Android. |
| `plans-mobile/README.md` | Indexar o plano 009 e seu estado. |

### Preservar explicitamente

- `Sistema-Propostas/artifacts/proposta/src/components/proposal/print/*` como referencia somente leitura;
- API, rotas, OpenAPI, Prisma e Neon;
- `Station.primaryColor` e `Station.logoBase64`;
- editor, autosave, produtos, status e autorizacao da proposta;
- identidade Mosaico da interface do app, sem aplica-la ao PDF da empresa.

---

## 5. Execucao Passo a Passo

### Tarefa 1: Baseline de paridade e fixtures

**Arquivos:** modificar `proposalPrintHtml.test.ts`; criar testes de modelo e paginacao.

**Produz:** fixtures que representam o PDF correto antes de alterar o gerador.

- [x] Registrar `git branch --show-current` e `git status --short`; preservar as mudancas atuais do rebrand.
- [x] Criar fixture `Lead Recaptura 10 Meses` com empresa `Radio 88 FM`, logo data URL, `#427EFF`, quatro indicadores, dois produtos, `R$ 15.000,00` e vendedor Leonardo Salles.
- [x] Criar fixture curta com um produto e sem apresentacao para reproduzir o rodape isolado da captura mobile.
- [x] Criar fixtures de 0, 1, 2, 4, 5, 12 e 20 produtos, incluindo titulo e descricao longos.
- [x] Escrever testes que exijam uma pagina para as duas fixtures de regressao e bloco final somente na ultima pagina.
- [x] Escrever teste que exija wrapper colorido mesmo quando `logoBase64` existe.
- [x] Executar os testes e confirmar falha com o gerador atual.

Comando:

```bash
pnpm --filter @workspace/mobile test -- \
  src/features/proposals/print/__tests__/proposalPrintHtml.test.ts \
  src/features/proposals/print/__tests__/proposalPrintModel.test.ts \
  src/features/proposals/print/__tests__/proposalPrintPagination.test.ts
```

Commit sugerido:

```bash
git add artifacts/mobile/src/features/proposals/print
git commit -m "test(mobile): define web PDF parity fixtures"
```

### Tarefa 2: Modelo normalizado igual ao web

**Arquivos:** criar `proposalPrintModel.ts` e teste; modificar `src/types/index.ts`.

**Produz:** `mapProposalToPrintData(proposal: Proposal): ProposalPrintData`.

- [x] Testar cor valida e fallback para `#427EFF`.
- [x] Testar `proposalTypeName` antes de `propType`.
- [x] Testar cliente por `advertiser.tradeName` antes de campos legados.
- [x] Testar contato por `createdBy` antes de `contact*` legado.
- [x] Testar datas em `dd/mm/aaaa`, periodicidade traduzida e `showPeriod=false`.
- [x] Testar quantidade, linha de metadados e sazonalidade em portugues.
- [x] Testar investimento vindo como `15000.00`, `15.000,00` e `R$ 15.000,00`, sempre resultando em `R$ 15.000,00`.
- [x] Implementar o mapper reutilizando formatadores existentes quando produzirem exatamente a mesma saida.
- [x] Executar os testes e confirmar sucesso.

Commit sugerido:

```bash
git add artifacts/mobile/src/types/index.ts artifacts/mobile/src/features/proposals/print/proposalPrintModel.ts artifacts/mobile/src/features/proposals/print/__tests__/proposalPrintModel.test.ts
git commit -m "refactor(mobile): normalize proposal print data"
```

### Tarefa 3: Contrato A4 e paginacao fisica

**Arquivos:** criar `proposalPrintLayout.ts`, `proposalPrintPagination.ts` e respectivos testes.

**Produz:** `getProposalPrintOptions(html)` e `paginateProposalPrintProducts(data)`.

- [x] Escrever teste exato para `width=595`, `height=842`, margens zero, `useMarkupFormatter=false` e `textZoom=100`.
- [x] Escrever testes de paginacao por linhas, considerando a presenca ou ausencia de Apresentacao.
- [x] Garantir por teste que nenhum resultado possua pagina vazia.
- [x] Garantir por teste que `showInvestment` e `showFooter` ocorram uma vez e na mesma ultima pagina.
- [x] Garantir por teste que `showHero` e `showStats` ocorram somente na primeira pagina.
- [x] Garantir por teste que 20 produtos mantenham ordem e aparecam exatamente uma vez.
- [x] Implementar os tokens fisicos derivados do CSS web e o algoritmo first/continuation/last.
- [x] Remover qualquer dependencia de comprimento textual na decisao de pagina.
- [x] Executar os testes e confirmar sucesso.

Commit sugerido:

```bash
git add artifacts/mobile/src/features/proposals/print/proposalPrintLayout.ts artifacts/mobile/src/features/proposals/print/proposalPrintPagination.ts artifacts/mobile/src/features/proposals/print/__tests__
git commit -m "fix(mobile): paginate proposal PDF in A4 rows"
```

### Tarefa 4: Montserrat local e assets de impressao

**Arquivos:** criar `proposalPrintAssets.ts`, adicionar fontes e modificar dependencias.

**Produz:** `loadProposalPrintAssets(): Promise<{ fontFaceCss: string }>`.

- [x] Instalar versoes compativeis com Expo SDK 54 usando `pnpm exec expo install expo-asset expo-file-system @expo-google-fonts/montserrat`.
- [x] Versionar somente os pesos 400, 500, 600, 700, 800 e 900 usados pelo documento.
- [x] Carregar cada arquivo com `Asset.fromModule`, garantir download local e ler em base64 via API `expo-file-system/legacy` compativel com SDK 54.
- [x] Gerar `@font-face` com `data:font/ttf;base64,...`, `font-display:block` e pesos corretos.
- [x] Criar cache em memoria da Promise para nao reler seis arquivos em cada toque.
- [x] Testar a geracao do CSS com leitores de arquivo mockados, sem incluir bytes reais no snapshot.
- [x] Remover `@import url('https://fonts.googleapis.com/...')` do HTML.
- [x] Confirmar que a geracao nao faz requisicao de rede.

Commit sugerido:

```bash
git add artifacts/mobile/package.json pnpm-lock.yaml artifacts/mobile/assets/fonts/print artifacts/mobile/src/features/proposals/print/proposalPrintAssets.ts artifacts/mobile/src/features/proposals/print/__tests__
git commit -m "feat(mobile): embed Montserrat in proposal PDF"
```

### Tarefa 5: Renderizador HTML com paridade visual

**Arquivos:** reescrever `proposalPrintHtml.ts` e ampliar seu teste.

**Consome:** modelo normalizado, paginas e `fontFaceCss`.

**Produz:** `renderProposalPrintHtml({ data, pages, fontFaceCss }): string`.

- [x] Renderizar uma tag `<main>` por pagina fornecida pelo paginador.
- [x] Portar os seletores e medidas relevantes do CSS web, mantendo A4 fixo e sem `transform`.
- [x] Renderizar cabecalho normal na primeira pagina e cabecalho compacto com `CONTINUACAO` nas demais.
- [x] Renderizar logo dentro de wrapper com `background-color: primaryColor`; usar monograma no fallback.
- [x] Renderizar Hero e Apresentacao apenas conforme flags da pagina.
- [x] Renderizar produtos em grid de duas colunas, `39mm`, borda esquerda na cor da empresa e conteudo limitado igual ao web.
- [x] Renderizar `duration - airTime - seasonality`, descricao e programa na mesma ordem do web.
- [x] Inserir spacer flexivel somente na ultima pagina antes do investimento.
- [x] Renderizar investimento e contato juntos na ultima pagina.
- [x] Aplicar `-webkit-print-color-adjust: exact` e `print-color-adjust: exact` a todos os elementos.
- [x] Escapar texto e atributos; permitir apenas data URL validada para logo/banner.
- [x] Testar que o HTML nao contem `fonts.googleapis.com`, `page-break` inesperado ou contato legado quando `createdBy` existe.
- [x] Executar testes e typecheck.

Commit sugerido:

```bash
git add artifacts/mobile/src/features/proposals/print/proposalPrintHtml.ts artifacts/mobile/src/features/proposals/print/__tests__/proposalPrintHtml.test.ts
git commit -m "fix(mobile): match web proposal PDF layout"
```

### Tarefa 6: Geracao nativa e compartilhamento seguro

**Arquivos:** criar `generateProposalPdfFile.ts` e teste; modificar `useProposalPdf.ts`.

**Produz:** arquivo PDF A4 validado antes do compartilhamento.

- [x] Criar teste com mocks de `Print.printToFileAsync` e assets.
- [x] Confirmar que a funcao recebe HTML, `595 x 842`, margens zero e `textZoom=100`.
- [x] Confirmar que `numberOfPages === expectedPageCount` retorna URI valida.
- [x] Confirmar que divergencia de paginas lanca `ProposalPdfLayoutError` sem expor dados da proposta.
- [x] Implementar fluxo `map -> paginate -> assets -> render -> print -> validate`.
- [x] Manter `Sharing.isAvailableAsync()` e `Sharing.shareAsync()` no hook.
- [x] Exibir toast de erro especifico para falha de layout e toast generico para falha de sistema.
- [x] Evitar dois toques simultaneos com `isGenerating` e manter botao desabilitado durante todo o fluxo.
- [x] Executar testes e typecheck.

Commit sugerido:

```bash
git add artifacts/mobile/src/features/proposals/print/generateProposalPdfFile.ts artifacts/mobile/src/features/proposals/print/useProposalPdf.ts artifacts/mobile/src/features/proposals/print/__tests__
git commit -m "fix(mobile): generate validated A4 proposal PDF"
```

### Tarefa 7: QA visual comparativo iOS, Android e web

**Arquivos:** nenhum codigo funcional; registrar resultados neste plano.

- [ ] Subir API local pelo fluxo documentado, sem consumir producao durante QA.
- [ ] Iniciar Expo com cache limpo e API local.
- [ ] Gerar no web e no mobile a mesma proposta `Lead Recaptura 10 Meses` com dois produtos e quatro indicadores.
- [ ] Confirmar uma pagina em ambos, logo com fundo da empresa, datas iguais, produtos iguais, vendedor Leonardo Salles, investimento e contato no final.
- [ ] Repetir no iOS com 0, 1, 2, 4, 5, 12 e 20 produtos.
- [ ] Repetir no Android com 0, 1, 2, 4, 5, 12 e 20 produtos.
- [ ] Salvar os PDFs de QA em `tmp/pdfs/`, fora do Git.
- [ ] Rodar `pdfinfo` e confirmar A4 (`595 x 842 pts`, tolerancia de arredondamento de 1 ponto) e numero esperado de paginas.
- [ ] Renderizar todas as paginas com `pdftoppm -png`.
- [ ] Inspecionar PNGs e rejeitar qualquer card cortado, texto sobreposto, fundo ausente, rodape isolado ou pagina vazia.
- [ ] Validar com textos longos, logo transparente, sem logo, `showPeriod=false`, sem stats e sem produtos.
- [ ] Confirmar que a cor Mosaico do app nao substitui a cor da empresa no PDF.

Comandos:

```bash
cd /Users/joaomvalente/Projetos/Projetos-GTF/Sistema-Propostas
pnpm run api:docker
```

```bash
cd /Users/joaomvalente/Projetos/Projetos-GTF/Sistema-PropostasGTF_App/artifacts/mobile
pnpm run start:api:docker
```

```bash
pdfinfo tmp/pdfs/proposta-mobile-ios.pdf
pdftoppm -png tmp/pdfs/proposta-mobile-ios.pdf tmp/pdfs/proposta-mobile-ios
```

Commit sugerido somente se houver registro/documentacao:

```bash
git add plans-mobile/plan-mobile-009-pdf-a4-paridade-web.md docs-mobile
git commit -m "docs(mobile): record proposal PDF visual QA"
```

### Tarefa 8: Regressao, documentacao e fechamento

**Arquivos:** atualizar documentos e checklist final deste plano.

- [x] Executar testes direcionados do PDF.
- [x] Executar suite mobile completa.
- [x] Executar typecheck.
- [x] Executar `git diff --check` nos arquivos alterados.
- [x] Atualizar documentacao de telas, qualidade e execucao.
- [ ] Registrar dispositivos, SO, quantidade de paginas e cenarios validados.
- [x] Atualizar o status do plano 009 em `plans-mobile/README.md`.
- [x] Confirmar que nao existem alteracoes em backend, schema ou migration.

Comandos:

```bash
pnpm --filter @workspace/mobile test -- src/features/proposals/print --runInBand
pnpm --filter @workspace/mobile test
pnpm --filter @workspace/mobile run typecheck
git diff --check
```

Commit sugerido:

```bash
git add artifacts/mobile docs-mobile plans-mobile pnpm-lock.yaml
git commit -m "docs(mobile): complete A4 PDF parity rollout"
```

---

## 6. Estrategia de Testes

### Testes unitarios

- normalizacao de empresa, cliente, periodo, contato, produto e moeda;
- validacao de cor hexadecimal e fallback;
- paginacao por linhas e reserva do bloco final;
- ordem e unicidade de 20 produtos;
- HTML com paginas explicitas e secoes condicionais;
- wrapper colorido para logo presente e monograma para logo ausente;
- opcoes A4 passadas ao Expo Print;
- divergencia entre paginas planejadas e paginas produzidas.

### Testes de integracao

- mock de assets -> HTML -> `printToFileAsync` -> validacao -> URI;
- compartilhamento somente depois de PDF valido;
- falha de fonte, falha de impressao e compartilhamento indisponivel;
- botao bloqueado durante geracao.

### QA visual obrigatorio

| Cenario | Resultado esperado |
|---|---|
| 1 produto, sem stats | Uma folha; investimento e contato na mesma folha. |
| 2 produtos, 4 stats | Uma folha igual a referencia web enviada. |
| 4 produtos, 4 stats | Uma folha quando couber nos mesmos limites do web. |
| Conteudo excedente | Paginas explicitas; nenhuma quebra dentro de card. |
| Ultima pagina | Ultimos produtos + investimento + contato, sem pagina exclusiva de rodape. |
| Logo transparente | Fundo do container na `primaryColor` da empresa. |
| Sem logo | Monograma legivel sobre a `primaryColor`. |
| Sem periodo | Nenhum pill ou texto de periodo. |
| Textos longos | Clamp consistente; sem aumentar card alem do limite. |
| iOS e Android | Mesmo tamanho A4 e mesmo numero de paginas. |

---

## 7. Criterios de Aceite

1. A proposta `Lead Recaptura 10 Meses` usada na comparacao gera uma unica pagina tanto no web quanto no mobile.
2. O PDF mobile mede A4 (`595 x 842 pts`, tolerancia de 1 ponto), nao US Letter.
3. O logo da empresa aparece dentro de um bloco cuja cor e `station.primaryColor`.
4. O PDF mobile usa empresa, cliente, tipo, periodo, indicadores, produtos, investimento e contato com as mesmas prioridades do web.
5. O vendedor exibido vem de `createdBy`, como no web.
6. Nenhum produto, investimento ou rodape e cortado ou dividido.
7. Investimento e contato aparecem juntos e somente na ultima pagina.
8. Nenhuma pagina vazia ou contendo apenas contato e gerada.
9. Montserrat e carregada de assets locais, sem requisicao ao Google Fonts.
10. O PDF conserva a cor cadastrada da empresa e nao herda o laranja Mosaico da interface.
11. iOS e Android passam pelos cenarios de 0, 1, 2, 4, 5, 12 e 20 produtos.
12. Testes, suite completa e typecheck passam sem erros.

---

## 8. Riscos e Mitigacoes

| Risco | Mitigacao |
|---|---|
| WebView nativo interpretar A4 como Letter | Informar `595 x 842` ao `expo-print` e `210mm x 297mm` no CSS; verificar com `pdfinfo`. |
| iOS adicionar margem propria | Passar margens zero no SDK e manter `@page margin: 0`. |
| Android aplicar zoom diferente | Fixar `textZoom: 100` e validar em aparelho/emulador. |
| Fonte remota nao carregar a tempo | Embutir Montserrat local como data URL. |
| Logo base64 transparente perder identidade | Wrapper sempre colorido pela empresa. |
| Descricao longa alterar paginacao | Card com altura fixa e clamp igual ao web; paginacao por linhas. |
| Layout mudar no web no futuro | Documentar tokens espelhados e manter fixture de paridade para detectar divergencia. |
| `numberOfPages` divergir entre motores | Bloquear compartilhamento do arquivo inconsistente e informar tentativa novamente. |
| Aumento do bundle pelas fontes | Incluir somente seis pesos efetivamente usados e medir impacto no build. |
| Mudancas mobile em andamento se misturarem | Trabalhar na branch atual preservando `git status`; commits pequenos por tarefa. |

---

## 9. Fora de Escopo

- gerar PDF no backend;
- Puppeteer, Playwright ou Chromium em Vercel;
- salvar PDFs no Neon ou em storage remoto;
- alterar o PDF web;
- alterar cadastro de empresa ou logo;
- alterar proposta, produtos ou apresentacao no banco;
- redesenhar a identidade visual do documento;
- aplicar a cor Mosaico ao PDF de todas as empresas.

---

## 10. Checklist da Implementacao

Preencher ao executar o plano:

- [x] Modelo de impressao normalizado conforme o web.
- [x] A4 explicito configurado no `expo-print`.
- [x] Paginacao por linhas e medidas fisicas implementada.
- [x] HTML por paginas explicitas implementado.
- [x] Logo com fundo da empresa corrigido.
- [x] Montserrat local embutida pelo pacote oficial Expo Google Fonts.
- [x] Numero de paginas validado antes do compartilhamento.
- [x] Testes unitarios e de integracao aprovados.
- [ ] PDF iOS renderizado e inspecionado.
- [ ] PDF Android renderizado e inspecionado.
- [ ] Comparacao visual com o PDF web aprovada.
- [x] Documentacao atualizada.

### Validacoes Executadas

- `pnpm --filter @workspace/mobile test -- src/features/proposals/print --runInBand`: 6 suites e 23 testes aprovados.
- `pnpm --filter @workspace/mobile test`: 20 suites e 65 testes aprovados.
- `pnpm --filter @workspace/mobile run typecheck`: aprovado.
- `git diff --check`: aprovado.
- `expo-print` e `expo-sharing` alinhados as versoes esperadas pelo Expo SDK 54 antes da homologacao nativa.
- Fixtures automatizadas cobrem 0, 1, 2, 4, 5, 12 e 20 produtos, A4, logo colorido, contato, moeda e bloco final.

### Pendencias e Riscos Residuais

- Homologacao visual em dispositivo iOS e Android.
- Comparacao final dos PDFs renderizados com a mesma proposta no sistema web.
- Confirmar o impacto dos seis pesos locais de Montserrat no tamanho do bundle de producao.
