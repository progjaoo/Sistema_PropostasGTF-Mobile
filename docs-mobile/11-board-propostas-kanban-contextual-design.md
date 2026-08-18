# Design do Board Contextual de Propostas

**Data:** 18/08/2026  
**Estado:** Implementado em código; QA físico pendente  
**Agente principal:** UX/UI Designer  
**Apoios recomendados:** Frontend Engineer e QA Engineer

## Objetivo

Reestruturar a tela mobile de Propostas para que Empresa e Programa sejam os únicos contextos de organização. Depois que o usuário escolhe um contexto, as propostas são sempre apresentadas em um Kanban pelas etapas comerciais, com um modo focado de uma coluna por vez e um modo expandido com várias colunas lado a lado.

A experiência usa o Trello mobile como referência de interação, sem copiar identidade visual, textos ou elementos que não pertencem ao GTF Propostas.

## Resultado da implementação

O desenho foi aplicado no aplicativo Expo com um único Kanban contextual compartilhado por ADMIN e COMERCIAL. As Tasks 1–9 do plano mobile 013 foram implementadas em código, incluindo seleção Empresa/Programa, busca e filtros compactos, modos focado/expandido, deduplicação, permissões de movimentação e estados de erro/vazio. Permanecem como validação externa a homologação em simuladores/aparelhos iOS e Android com API local e usuários reais de cada perfil.

## Decisão aprovada

- **Modo recolhido/focado:** uma etapa por vez, swipe horizontal, snap e indicadores de página.
- **Modo sem recolher/expandido:** várias etapas lado a lado em uma superfície horizontal.
- **Agrupamento:** somente `Empresa` ou `Programa`.
- **Conteúdo do quadro:** as colunas continuam sendo as etapas do andamento comercial.
- **Filtro:** experiência compacta e dedicada, inspirada na busca de cartões do Trello.

## Agentes selecionados

### UX/UI Designer — principal

É o agente adequado porque o problema central é hierarquia visual, densidade operacional, organização de filtros, comportamento responsivo e clareza do fluxo de Propostas.

### Frontend Engineer — apoio técnico

Valida a decomposição em componentes React Native, integração com Expo Router, TanStack Query, listas horizontais/verticais e compatibilidade com os contratos atuais da API.

### QA Engineer — apoio de validação

Define os cenários de regressão para ADMIN e COMERCIAL, movimentação entre etapas, filtros, acessibilidade, telas pequenas e dispositivos iOS/Android.

## Diagnóstico do estado atual

`ProposalBoardScreen.tsx` concentra quatro visualizações concorrentes:

1. Empresas;
2. Etapas;
3. Programas;
4. Lista.

Além disso:

- o bloco de filtros permanece visível e consome altura útil do Kanban;
- Empresa e Programa aparecem como modo de visualização e também como filtros;
- os Programas são repetidos em chips na tela e no bottom sheet;
- a visão por Empresa é uma lista vertical, não um Kanban;
- a visão por Programa é uma lista vertical de propostas, não um Kanban;
- apenas a visão genérica de Etapas utiliza o pager Kanban;
- busca, modos, status, Empresa e Programa competem visualmente no mesmo bloco;
- o componente principal coordena consultas, filtros locais, seleção, renderização e movimentação, dificultando testes isolados.

O backend existente já fornece os dados necessários:

- `GET /stations?active=true` lista Empresas acessíveis;
- `GET /proposals/progress-board` retorna propostas com etapa atual;
- `stationId` limita o quadro a uma Empresa;
- `programId` limita o quadro a um Programa;
- `POST /proposals/:id/timeline` mantém a movimentação entre etapas;
- o backend continua aplicando ownership e acesso por Empresa.

Não é necessário criar um novo endpoint para esta reestruturação.

## Abordagens consideradas

### 1. Kanban contextual único — recomendada

Empresa e Programa selecionam o contexto, mas ambos alimentam o mesmo Kanban de etapas. O comportamento, os cards e a movimentação são compartilhados.

**Vantagens:** menor duplicação, navegação previsível, consistência entre perfis e reaproveitamento do endpoint de andamento.  
**Custo:** exige separar seleção, filtros e transformação dos dados hoje concentrados na tela.

### 2. Uma tela independente para Empresa e outra para Programa

Cada agrupamento teria componentes e estados próprios.

**Vantagem:** implementação inicial direta.  
**Desvantagens:** duplica Kanban, filtros, estados vazios, movimentação e testes; aumenta o risco de divergência. Não recomendada.

### 3. Alterar a API para devolver um payload visual pronto

O servidor receberia modo de densidade e agrupamento e devolveria colunas prontas.

**Vantagem:** reduz transformação local.  
**Desvantagens:** mistura decisão visual com contrato de domínio, exige alteração de backend sem necessidade e aumenta o impacto transversal. Não recomendada.

## Arquitetura de interface

```text
ProposalBoardScreen
├── ProposalBoardHeader
│   ├── título + Nova proposta
│   └── BoardContextToolbar
│       ├── Empresa | Programa
│       ├── contexto selecionado
│       ├── buscar/filtrar
│       └── recolher/expandir
├── ActiveProposalFilters
├── ContextualProposalKanban
│   ├── modo focused -> uma StageColumn por página
│   └── modo overview -> várias StageColumn lado a lado
├── ProposalContextSheet
├── ProposalSearchOverlay
├── ProposalFiltersSheet
└── MoveProposalSheet
```

### Tipos de estado

```ts
type BoardGroupingMode = 'station' | 'program';
type BoardDensityMode = 'focused' | 'overview';

type ProposalBoardSelection = {
  stationId?: string;
  programId?: string;
};

type ProposalBoardUiState = {
  grouping: BoardGroupingMode;
  density: BoardDensityMode;
  selection: ProposalBoardSelection;
  search: string;
  filters: BoardFilters;
};
```

O estado permanece local à tela. A seleção de Empresa e a seleção de Programa são preservadas separadamente enquanto a tela estiver montada, de forma que alternar o agrupamento não descarte a última escolha do usuário.

## Fluxo principal

### Entrada na tela

1. Carregar as Empresas acessíveis ao perfil autenticado.
2. Iniciar no agrupamento `Empresa` para ADMIN e COMERCIAL.
3. Selecionar automaticamente a primeira Empresa acessível se não houver seleção anterior válida.
4. Buscar o `progress-board` com `stationId` da Empresa selecionada.
5. Transformar as propostas recebidas nas sete colunas de andamento.

Se não existir Empresa acessível, apresentar estado vazio orientando o usuário a solicitar acesso. O botão Nova proposta fica oculto ou desabilitado quando nenhuma Empresa permite criação.

### Alternância para Programa

1. Trocar o segmento para `Programa`.
2. Exibir somente Programas acessíveis retornados pelo board.
3. Selecionar o primeiro Programa válido, preservando uma escolha anterior quando possível.
4. Buscar `progress-board?programId=<id>`.
5. Renderizar o mesmo Kanban pelas etapas.

`Sem programa` é uma opção explícita. Como a API atual não aceita esse identificador como filtro real, o cliente consulta o board sem `programId` e mantém somente o grupo sintético `sem-programa` antes de montar as colunas.

### Empresa sem Programas

Empresas com `usesPrograms=false` continuam funcionando no agrupamento Empresa. Suas propostas entram nas etapas normalmente e não dependem de um Programa para aparecer.

## Kanban por etapas

As sete colunas permanecem:

1. Lead criado;
2. Em conversa;
3. Proposta enviada;
4. Cliente analisando;
5. Negociação;
6. Aprovada;
7. Rejeitada.

Cada coluna apresenta:

- título da etapa;
- quantidade de propostas filtradas;
- lista vertical independente;
- estado vazio compacto;
- pull-to-refresh no modo focado;
- cards que abrem `/proposal/[id]`;
- ação existente para mover a proposta, quando `viewerCanEdit` permitir.

Uma proposta aparece somente uma vez em cada contexto. No agrupamento Empresa, propostas com produtos de mais de um Programa são deduplicadas pelo `proposal.id`. No agrupamento Programa, a proposta aparece no Programa selecionado uma única vez.

## Modo recolhido/focado

- uma coluna ocupa a largura útil da tela;
- `FlatList` horizontal usa snap/paginação;
- a coluna vizinha pode aparecer discretamente como indicação de continuidade;
- indicadores mostram a posição entre as sete etapas;
- o título da etapa e sua contagem permanecem fixos no topo da coluna;
- cada coluna mantém sua própria rolagem vertical;
- ao mudar de agrupamento ou contexto, o pager retorna para a primeira etapa com propostas; se nenhuma etapa tiver propostas, retorna para a primeira etapa.

## Modo sem recolher/expandido

- as sete colunas ficam em uma superfície horizontal contínua;
- a largura compacta de coluna usa `clamp` responsivo, com mínimo suficiente para leitura;
- em telefones, aproximadamente uma coluna e meia fica visível; em telas largas, duas ou mais;
- os cards usam uma variante compacta com cliente, tipo, valor e responsável, sem esconder informações necessárias para identificar a proposta;
- não há indicadores de página nem snap obrigatório;
- o usuário pode rolar horizontalmente livremente e verticalmente dentro de cada coluna;
- o botão de expandir/recolher tem label acessível e não depende apenas do ícone.

O modo de densidade é uma preferência visual da sessão e não altera filtros nem chamadas da API.

## Barra de contexto e filtros

O grande card atual de filtros será substituído por uma barra compacta:

1. controle segmentado `Empresa | Programa`;
2. botão com o contexto selecionado, abrindo um bottom sheet de escolha;
3. botão de busca/filtros com contador ativo;
4. botão recolher/expandir.

Filtros ativos aparecem em uma faixa horizontal removível abaixo da barra. A faixa não é renderizada quando não há filtros.

### Seleção de contexto

O `ProposalContextSheet` apresenta:

- título `Selecionar Empresa` ou `Selecionar Programa`;
- campo de busca local;
- lista com nome, cor e quantidade quando disponível;
- marcação clara do item selecionado;
- estado vazio e botão de fechar;
- alvos de toque de no mínimo 44 pontos.

Empresa e Programa deixam de existir dentro do sheet de filtros avançados, evitando duas fontes para a mesma seleção.

### Busca de propostas

O botão de busca abre `ProposalSearchOverlay`:

- campo `Filtrar propostas...` em destaque;
- botão fechar;
- teclado aberto automaticamente;
- busca com `useDeferredValue`;
- resultado aplicado simultaneamente às sete etapas;
- contador de propostas encontradas;
- ação Limpar quando houver texto;
- nenhuma alteração de contexto ao abrir ou fechar.

### Filtros avançados

O sheet avançado mantém:

- status da proposta;
- responsável, somente para ADMIN;
- tipo de proposta;
- data inicial e final;
- Limpar;
- Aplicar filtros.

Datas devem usar seletor nativo ou entrada validada no formato documentado; valores inválidos não podem disparar consulta. O contador inclui busca e filtros avançados, mas não conta Empresa/Programa, pois eles definem o contexto do board.

## Cards de proposta

O mesmo componente atende os dois modos por uma prop explícita:

```ts
type ProposalBoardCardDensity = 'comfortable' | 'compact';
```

### Comfortable

- cliente/anunciante;
- tipo de proposta;
- Empresa ou Programa conforme o agrupamento;
- responsável;
- investimento;
- última atualização;
- ação de mover quando permitida.

### Compact

- cliente/anunciante;
- tipo;
- valor;
- responsável em uma linha secundária;
- indicador acessível de ação disponível.

Status e contexto não podem ser comunicados apenas por cor. Textos longos usam limites de linha e acessibilidade mantém o conteúdo identificador no label do card.

## Dados, cache e segurança

```text
Empresa selecionada -> GET /proposals/progress-board?stationId=...
Programa selecionado -> GET /proposals/progress-board?programId=...
Busca/filtros        -> mesmos endpoints com parâmetros permitidos
Mover proposta       -> POST /proposals/:id/timeline
                         -> invalidar queryKeys.proposals.all
```

- a API continua sendo a autoridade para ownership e acesso por Empresa;
- COMERCIAL recebe somente propostas próprias e Empresas autorizadas;
- ADMIN mantém o filtro avançado por responsável;
- respostas `403/404` usam mensagem neutra;
- nenhuma proposta de outro vendedor é reintroduzida por combinação local de arrays;
- filtros e contexto fazem parte da query key;
- somente a consulta do contexto selecionado fica ativa;
- troca rápida de contexto não deve permitir que resposta antiga substitua a seleção atual;
- a movimentação otimista só será considerada se houver rollback confiável; a implementação inicial pode invalidar e recarregar após sucesso.

## Estados de interface

### Loading

Skeleton da barra de contexto e das colunas, preservando o layout para evitar salto visual.

### Vazio de acesso

Nenhuma Empresa acessível: explicar que é necessário acesso a uma Empresa.

### Vazio de contexto

Empresa ou Programa sem propostas: manter as sete etapas visíveis com contagem zero e mensagem geral discreta.

### Vazio após filtros

Mostrar `Nenhuma proposta encontrada` e ações `Limpar busca` ou `Limpar filtros`, sem apagar o contexto selecionado.

Nas colunas do Kanban sem propostas, manter somente o cabeçalho da etapa e a contagem `0`; não exibir mensagens repetitivas dentro de cada coluna.

### Erro

Mensagem curta, botão `Tentar novamente` e preservação da seleção atual.

### Offline

Dados já armazenados no cache podem permanecer visíveis. Movimentações continuam bloqueadas pelo tratamento central de mutações offline.

## Acessibilidade e ergonomia

- alvos de toque com no mínimo 44 pontos;
- labels explícitos para buscar, filtrar, expandir, recolher e mudar contexto;
- `accessibilityState.selected` no agrupamento e no contexto;
- anúncio da etapa atual no modo focado;
- anúncio da quantidade após aplicar filtros;
- suporte a texto ampliado sem sobrepor botões;
- contraste validado em temas claro e escuro;
- gesto horizontal não pode bloquear a rolagem vertical dos cards;
- teclado não pode cobrir contagem ou ação de fechar a busca;
- overlay de busca deve aplicar os insets superior e inferior do dispositivo antes de posicionar o campo;
- safe areas respeitadas no header, sheets e indicadores inferiores.

## Performance

- `FlatList` para etapas e cards;
- callbacks e transformações memoizados por contexto;
- deduplicação em função pura testável;
- evitar renderizar simultaneamente as antigas quatro visualizações;
- desativar queries de Empresa ou Programa que não correspondam ao agrupamento atual;
- manter chaves estáveis por `proposal.id` e `currentStep`;
- testar listas com pelo menos 100 propostas distribuídas entre as etapas.

## Arquivos previstos

### Modificar

- `artifacts/mobile/src/features/proposals/board/ProposalBoardScreen.tsx`
- `artifacts/mobile/src/features/proposals/board/ProposalStagePager.tsx`
- `artifacts/mobile/src/features/proposals/board/ProposalBoardCard.tsx`
- `artifacts/mobile/src/features/proposals/board/ProposalFiltersSheet.tsx`
- `artifacts/mobile/src/features/proposals/api.ts`
- `artifacts/mobile/src/api/contracts.ts`
- `artifacts/mobile/src/api/schemas.ts`
- `artifacts/mobile/src/api/queryKeys.ts`
- `docs-mobile/04-navegacao-perfis-e-telas.md`
- `docs-mobile/06-padroes-ui-seguranca-qualidade.md`
- `plans-mobile/README.md`
- `plans-mobile/PROGRESS.md`

### Criar

- `artifacts/mobile/src/features/proposals/board/BoardContextToolbar.tsx`
- `artifacts/mobile/src/features/proposals/board/ProposalContextSheet.tsx`
- `artifacts/mobile/src/features/proposals/board/ProposalSearchOverlay.tsx`
- `artifacts/mobile/src/features/proposals/board/ContextualProposalKanban.tsx`
- `artifacts/mobile/src/features/proposals/board/ProposalStageColumn.tsx`
- `artifacts/mobile/src/features/proposals/board/proposalBoardModel.ts`
- testes unitários e de componente correspondentes em `board/__tests__`.

### Remover após migração confirmada

- `ProposalStationBoardView.tsx`, se não houver outro consumidor;
- `ProposalProgramBoardView.tsx`, se não houver outro consumidor;
- `ProposalListView.tsx`, somente depois de confirmar que nenhuma rota ou requisito depende da lista.

A remoção deve acontecer em uma tarefa separada, depois que os testes provarem que o Kanban contextual substituiu os três fluxos.

## Estratégia de testes

### Unidade

- transformação de Empresa em colunas;
- transformação de Programa em colunas;
- deduplicação por proposta;
- tratamento de `sem-programa`;
- primeira etapa com propostas;
- contador de filtros;
- preservação das seleções por agrupamento;
- filtros locais de responsável, tipo e datas.

### Componentes

- alternância Empresa/Programa;
- seleção de contexto;
- modo focado com snap e indicadores;
- modo expandido sem snap;
- abertura, aplicação e limpeza da busca;
- chips removíveis de filtros ativos;
- card confortável e compacto;
- loading, vazio, erro e retry;
- movimento disponível somente quando autorizado.

### Integração

- ADMIN alterna Empresas e filtra por responsável;
- COMERCIAL vê somente Empresas e propostas autorizadas;
- Empresa sem Programas exibe seu Kanban;
- Programa com proposta compartilhada não duplica o card;
- mudança de etapa invalida e atualiza o board;
- deep link com `status` continua aplicando o filtro;
- retorno do editor preserva agrupamento, seleção e densidade enquanto a tela permanece montada.

### Dispositivos

- iPhone compacto e grande;
- Android compacto e grande;
- orientação retrato como obrigatória;
- modo expandido em tela larga/tablet;
- teclado aberto durante busca;
- texto do sistema ampliado;
- tema claro e escuro;
- rede lenta, erro e offline.

## Critérios de aceite

1. Empresa e Programa são as únicas formas de agrupar a tela de Propostas.
2. Cada Empresa selecionada abre um Kanban completo pelas etapas.
3. Cada Programa selecionado abre o mesmo Kanban pelas etapas.
4. Empresa sem Programas continua exibindo propostas.
5. Propostas não são duplicadas dentro de uma etapa.
6. O modo recolhido mostra uma etapa por vez com swipe, snap e indicadores.
7. O modo expandido mostra várias etapas lado a lado e permite rolagem horizontal livre.
8. Busca e filtros não ocupam permanentemente uma área grande do topo.
9. Empresa e Programa não aparecem duplicados dentro dos filtros avançados.
10. Movimentação, abertura e atualização das propostas continuam funcionando.
11. ADMIN e COMERCIAL preservam suas permissões atuais.
12. Loading, vazio, erro, retry e offline possuem tratamento explícito.
13. A tela funciona com texto ampliado e alvos mínimos de 44 pontos.
14. Testes, typecheck e exportações Expo iOS/Android são aprovados.
15. Documentação e progresso dos planos são atualizados após a implementação.

## Fora de escopo

- drag-and-drop livre entre colunas;
- reordenação manual persistida no agrupamento Empresa;
- alteração de endpoints ou banco de dados;
- reprodução visual exata do Trello;
- mudanças no editor, PDF, contratos, clientes ou catálogo;
- novas permissões de usuário;
- filtros salvos entre reinstalações do aplicativo.

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Conflito entre rolagem horizontal e vertical | Separar superfície horizontal e listas verticais; validar gestos em dispositivos reais |
| Propostas duplicadas por múltiplos Programas | Deduplicar por `proposal.id` no modelo antes de criar as colunas |
| Resposta antiga após troca rápida de contexto | Incluir agrupamento, seleção e filtros na query key e renderizar somente a query ativa |
| Muitas colunas/cards renderizados no modo expandido | Virtualização, largura compacta e memoização |
| Perda de propostas sem Programa | Manter grupo sintético `sem-programa` com cobertura de teste |
| Regressão de permissões COMERCIAL | Testes com dois vendedores e validação de acesso direto por ID |
| Remoção prematura das visões antigas | Excluir componentes somente depois da cobertura de regressão e busca de consumidores |

## Validação do design

- não existem placeholders ou decisões pendentes;
- os dois comportamentos visuais enviados como referência estão especificados;
- Empresa, Programa, etapas, busca e filtros possuem uma única fonte de estado;
- o desenho reutiliza os endpoints existentes e não cria um segundo backend;
- os critérios de aceite cobrem UX, autorização, dados, desempenho e dispositivos.
