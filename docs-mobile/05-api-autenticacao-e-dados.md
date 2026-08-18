# API, Autenticação e Dados

## API Única

Todos os endpoints descritos neste documento pertencem à API oficial do projeto `Sistema-Propostas`. O sistema web e o aplicativo mobile consomem essa mesma API e persistem dados no mesmo PostgreSQL do ambiente.

O aplicativo não executa Prisma, SQL ou migrations.

## Cliente HTTP

O cliente está em `artifacts/mobile/src/api/client.ts` e envia cabeçalhos de identificação do aplicativo. Ele centraliza erros e autenticação.

## Autenticação Mobile

Endpoints existentes:

```text
POST /api/auth/mobile/login
POST /api/auth/mobile/refresh
POST /api/auth/mobile/logout
```

Fluxo:

1. Login retorna access token, refresh token e usuário.
2. No nativo, ambos os tokens são guardados no Expo SecureStore.
3. O access token acompanha as requisições autenticadas.
4. No primeiro `401`, o cliente executa uma única renovação.
5. Requisições simultâneas compartilham a mesma renovação.
6. A chamada original é repetida apenas uma vez.
7. Logout revoga o refresh token e limpa o dispositivo.

## Recuperação de Senha

O aplicativo usa os endpoints públicos da mesma API compartilhada:

```text
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

O cliente normaliza o e-mail e envia `X-Client-Platform: mobile`, fazendo a API produzir `gtfpropostas://reset-password?token=...`. O Expo Router extrai um token plausível, valida a senha entre 8 e 128 caracteres e envia o token uma única vez à API.

O envio via Resend é responsabilidade exclusiva do backend em `Sistema-Propostas`. `RESEND_API_KEY` e `RESEND_FROM_EMAIL` não podem existir no `.env` do Expo nem em variáveis `EXPO_PUBLIC_*`. Conta existente, inexistente ou inativa recebe a mesma resposta pública para impedir enumeração.

No build web do Expo, há fallback para `sessionStorage`. Esse fallback não deve ser tratado como equivalente ao armazenamento seguro nativo.

## Restauração e Offline

O usuário pode ser mantido no AsyncStorage para restauração visual da sessão em falhas temporárias de rede. Isso não substitui validação do token pelo servidor.

Estratégia recomendada:

- permitir leitura de cache não sensível;
- sinalizar claramente estado offline;
- impedir mutações sem confirmação do servidor;
- invalidar a sessão quando refresh for rejeitado.

## Autorização

Regras críticas são responsabilidade da API:

- Comercial acessa e edita apenas propostas permitidas.
- Admin possui escopo administrativo.
- Acesso a empresas deve respeitar a matriz do usuário.
- Campos sensíveis devem ser redigidos pelo backend.
- IDs enviados pelo app nunca são prova de autorização.

## Contratos e Tipagem

Os endpoints mobile de autenticação estão representados em `Sistema-Propostas/lib/api-spec/openapi.yaml`. O cliente mobile ainda usa tipagem manual, mas o contrato oficial já cobre login, refresh e logout mobile.

Prioridades:

1. gerar tipos compartilhados a partir do OpenAPI;
2. remover duplicações de DTOs;
3. validar respostas em pontos críticos.

## Incompatibilidades Conhecidas

- A paridade funcional ADMIN desta entrega foi implementada no aplicativo; a validação visual e de dispositivo ainda depende de homologação iOS/Android.
- A geração de tipos a partir do OpenAPI oficial continua sendo uma evolução do backend compartilhado; os contratos críticos desta entrega possuem schemas Zod locais para evitar respostas inválidas em runtime.
- O refresh token é revogável, porém a estratégia atual do backend deve ser revisada para armazenamento por hash.

## Banco de Dados

O aplicativo não executa SQL e não possui migrations próprias. Mudanças de dados seguem:

1. alterar o schema Prisma em `Sistema-Propostas/lib/db`;
2. criar a migration no projeto principal;
3. atualizar a API em `Sistema-Propostas/artifacts/api-server`;
4. atualizar OpenAPI;
5. atualizar cliente mobile;
6. validar sistema web e mobile contra a mesma API.

Em produção, migrations devem ser aplicadas com `prisma migrate deploy`. O `db push` presente no Compose atual é adequado apenas ao fluxo local controlado e não substitui migrations de produção.

## Contratos mobile da Entrega 1

`src/api/client.ts` preserva o payload completo de erros HTTP em `ApiError.payload`, incluindo `code`, `blockers`, `fields` e `requiresConfirmation`. As respostas críticas são validadas com Zod para impacto de Empresa, quadro `station-board`, Contratos, resumo, forecast e propostas elegíveis.

O aplicativo consome, sem duplicar autorização, os endpoints `/stations/:id/deletion-impact`, `/stations/:id/permanent`, `/proposals/station-board`, `/proposals/:id/permanent` e `/contracts/*`. Nenhum endpoint ou regra de servidor é implementado no mobile.

## Contratos mobile da Entrega 2

Advertisers carregam `ownerId`, `owner` e `viewerCanEdit` quando fornecidos pela API. O app não envia `ownerId` ao criar/editar como COMERCIAL e apresenta mensagens neutras para `403/404` fora da carteira. Conversão usa `POST /advertisers/:id/promote-to-client`; desativação usa `DELETE /advertisers/:id` com `confirmWithProposals=true` somente após conflito estruturado.

O catálogo COMERCIAL consome `GET /product-templates` e `GET /stations`, exibindo apenas dados autorizados. Propostas persistem `unitValue` por item; cálculos de subtotal e diferença são feitos em centavos inteiros. Contratos COMERCIAL não enviam `ownerId`, pois a API restringe a carteira ao usuário autenticado.
