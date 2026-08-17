# Desenho de Paridade Integral dos Planos 033 e 034

**Data:** 17/08/2026  
**Estado:** Aprovado  
**Agente principal:** Software Architect / Arquiteto Mobile  
**Revisores recomendados:** Product Manager Mobile, Mobile API Integration Engineer e QA Mobile

## Objetivo

Levar ao aplicativo React Native/Expo todas as regras e capacidades entregues no sistema web pelos planos 033 e 034. A implementação será dividida em duas macroentregas sequenciais: primeiro ADMIN e depois COMERCIAL.

Paridade significa preservar comportamento, autorização, persistência e critérios de aceite. A interface será nativa e orientada a toque; não será uma reprodução mecânica das telas desktop.

## Fonte de Verdade

1. Código executável do sistema web e da API em `../Sistema-Propostas-kanban`.
2. Schema Prisma, migrations e rotas da API oficial.
3. Contrato OpenAPI oficial.
4. Código atual em `artifacts/mobile`.
5. Documentação em `docs-mobile`.
6. Planos históricos 033 e 034.

O aplicativo continuará sem banco, migrations ou API próprios. As cópias de backend presentes no repositório mobile não serão alteradas como fonte de verdade.

## Diagnóstico Consolidado

O baseline atual possui 20 suítes e 65 testes aprovados, além de typecheck sem erros. O app já oferece autenticação, board por etapas e programas, editor em cinco etapas, PDF A4, clientes/leads, recaptura e CRUDs administrativos essenciais.

As principais lacunas são:

- contratos críticos ainda manuais e incompletos no mobile;
- OpenAPI sem todos os paths e schemas já existentes na API;
- ausência de `Station.usesPrograms` no tipo e nas telas mobile;
- ausência do quadro administrativo por Empresa;
- exclusão de proposta usando o endpoint legado de rejeição;
- inexistência de exclusão permanente de Empresa e de confirmação digitada;
- autosave sem operação pública `flush()` antes do PDF e da navegação;
- ausência de ownership nos DTOs de anunciante e de conversão manual Lead → Cliente;
- ausência de catálogo read-only dedicado ao COMERCIAL;
- ausência de `unitValue`, subtotais, desconto e acréscimo no editor;
- gestão administrativa de usuário sem os campos comerciais;
- inexistência do domínio de contratos no mobile.

## Arquitetura Recomendada

### Fundação contratual

A Entrega 1 começa com uma fundação compartilhada:

- completar o OpenAPI oficial com os endpoints e schemas realmente existentes;
- manter o `apiCall` central como transporte HTTP;
- validar respostas críticas com Zod;
- ampliar `ApiError` para transportar payload estruturado;
- centralizar query keys e invalidações por domínio;
- introduzir componentes compartilhados de confirmação digitada;
- extrair o autosave da proposta para um hook com fila serial e `flush()`.

Essa fundação será reutilizada pela Entrega 2. Não será feita uma migração ampla e não relacionada de todo o cliente manual para outro gerador.

### Entrega 1 — ADMIN

A entrega administrativa cobre:

- configuração de Empresa com ou sem Programas;
- bloqueios estruturados ao desligar Programas;
- desativação e exclusão permanente de Empresa;
- Produtos e Programas condicionados à Empresa;
- quadro de propostas por Empresa como visão inicial do ADMIN;
- exclusão permanente de proposta separada de rejeição;
- campos comerciais na gestão de usuários;
- snapshot institucional somente leitura no editor;
- persistência confirmada antes de PDF e saída;
- contratos com visão global e filtro por responsável;
- validação do PDF e dos quatro cards de apresentação com conteúdo longo.

### Entrega 2 — COMERCIAL

A entrega comercial cobre:

- carteira de Leads/Clientes isolada pelo backend;
- conversão manual do mesmo Lead em Cliente;
- desativação com confirmação digitada e tratamento de vínculos;
- catálogo read-only conforme `canViewCatalog`;
- editor sem apresentação editável e sem alteração de andamento;
- quantidade, valor unitário, subtotal, total, desconto e acréscimo;
- exclusão permanente somente de proposta própria editável;
- Meus Contratos e métricas restritas ao proprietário.

## Navegação Mobile

### ADMIN

A barra inferior permanece com Dashboard, Propostas, Clientes, Avisos e Menu. Contratos será adicionado ao Menu administrativo para evitar uma sexta aba. A marca exibida em contextos de menu deve navegar ao Dashboard.

### COMERCIAL

A barra inferior passa a conter:

1. Propostas;
2. Clientes;
3. Produtos;
4. Contratos;
5. Mais.

Clientes terá segmentos Clientes/Leads. Mais conterá Avisos e Perfil. As rotas existentes permanecerão redirecionáveis durante a transição para não quebrar deep links internos.

## Fluxo de Dados

```text
Tela Expo Router
  -> hook de domínio / TanStack Query
  -> apiCall autenticado
  -> API oficial Sistema-Propostas-kanban
  -> Prisma/PostgreSQL único
  -> schema Zod no retorno crítico
  -> cache por query key de domínio
  -> UI nativa com loading, vazio, erro e retry
```

Mutações invalidarão apenas domínios afetados. Exclusões de proposta invalidarão propostas, dashboard, anunciante, recaptura e contratos. Alterações de Empresa invalidarão Empresas, Programas, Produtos, usuários e boards.

## Persistência e Concorrência

O autosave será serializado. Apenas uma requisição ficará em voo; alterações posteriores formarão a próxima revisão. Respostas antigas não substituirão estado novo. `flush()` drenará debounce, requisição em voo e revisão pendente.

PDF, compartilhamento, saída do editor, mudança de status e exclusão deverão aguardar `flush()`. Em falha, a ação será interrompida e o usuário permanecerá no editor.

## Erros e Segurança

- `401`: renovação single-flight existente; sessão rejeitada encerra autenticação.
- `403/404`: não revelar recursos fora do escopo comercial.
- `409`: apresentar motivo e bloqueadores estruturados.
- mutação offline: permanecer bloqueada pelo cliente atual.
- operações destrutivas: exigir digitação exata do nome.
- autorização: sempre validada pela API; flags mobile apenas controlam apresentação.
- valores financeiros: strings decimais na API e inteiros em centavos nos cálculos locais.

## Estratégia de Testes

- testes de schemas e normalizadores de respostas;
- testes de `ApiError` estruturado;
- testes do hook de autosave com alterações concorrentes e `flush()`;
- testes de cálculo monetário em centavos;
- testes de navegação e guards por perfil;
- testes de confirmação digitada;
- testes dos boards sem duplicação;
- regressão do PDF com 0, 1, 4, 5 e 12 produtos e textos longos;
- testes em iOS e Android, rede lenta, offline e sessão expirada;
- homologação com um ADMIN e dois COMERCIAIS com dados distintos.

## Fora de Escopo

- criar backend ou banco no repositório mobile;
- alterar regras financeiras definidas no plano 034;
- compartilhar carteira entre vendedores;
- comissionamento, cobrança, nota fiscal ou integração bancária;
- alterar o layout comercial A4 além das correções de robustez;
- copiar layouts desktop sem adaptação nativa.

## Critério de Conclusão

A paridade estará concluída quando os critérios funcionais dos planos 033 e 034 estiverem disponíveis no aplicativo para o perfil correto, a API continuar sendo a fonte de verdade, testes/typecheck/export passarem e a matriz ADMIN/COMERCIAL for homologada em iOS e Android.
