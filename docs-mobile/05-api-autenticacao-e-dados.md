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

- O editor mobile de proposta ainda não possui paridade com o editor web.
- A tela mobile de Admin ainda não implementa Programas, Produtos e Tipos de Proposta; o menu marca esses itens como "Em breve".
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
