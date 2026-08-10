# Arquitetura e Estrutura de Pastas

## Arquitetura Geral

```text
Aplicativo Expo
    |
    | HTTPS / JSON
    v
API Node.js compartilhada
    |
    | Prisma
    v
PostgreSQL
```

O aplicativo não acessa o banco diretamente. Toda leitura e escrita deve passar pela API autenticada.

## Estrutura do Aplicativo

```text
artifacts/mobile/
├── app/                    # Rotas do Expo Router
│   ├── (public)/           # Login, cadastro e recuperação
│   ├── (admin)/            # Navegação e telas do ADMIN
│   ├── (comercial)/        # Navegação e telas do COMERCIAL
│   ├── admin/              # CRUDs administrativos
│   ├── advertiser/         # Cadastro/detalhe de cliente ou lead
│   └── proposal/           # Criação e detalhe de proposta
├── assets/                 # Logos e recursos estáticos
├── components/             # Componentes visuais reutilizáveis
├── src/
│   ├── api/                # Cliente HTTP e gestão de tokens
│   ├── store/              # Estado global de autenticação
│   ├── types/              # Tipos do domínio mobile
│   └── utils/              # Formatação e utilitários
├── app.json                # Configuração Expo
├── package.json            # Scripts e dependências
└── tsconfig.json           # Configuração TypeScript
```

## Responsabilidades

### `app`

Define rotas, grupos de navegação e composição das telas. Os grupos `(admin)` e `(comercial)` devem conter apenas experiências permitidas para cada perfil.

### `components`

Contém peças reutilizáveis, como cards de proposta/anunciante, badges, estados vazios, carregamento, toast e confirmações.

### `src/api`

Centraliza:

- URL base;
- headers;
- access token;
- refresh token;
- renovação single-flight;
- repetição única após `401`;
- normalização de erros.

Nenhuma tela deve implementar renovação de token por conta própria.

### `src/store`

Mantém o usuário autenticado e a restauração de sessão. O perfil pode ser armazenado em cache local para inicialização offline, mas tokens devem permanecer no armazenamento seguro.

### Fonte de Verdade da API e do Banco

No projeto principal `Sistema-Propostas`:

- API: `Sistema-Propostas/artifacts/api-server`
- schema e migrations: `Sistema-Propostas/lib/db`
- contrato OpenAPI: `Sistema-Propostas/lib/api-spec`

Pastas equivalentes copiadas para o repositório mobile são contexto de desenvolvimento, não um backend independente.

## Convenções

- Rotas em arquivos seguem Expo Router.
- Componentes usam `PascalCase`.
- Hooks começam com `use`.
- Tipos de payload devem ser explícitos.
- Dados remotos usam TanStack Query.
- Estado de autenticação usa Zustand.
- Segredos nunca usam `EXPO_PUBLIC_*`.
- Não duplicar regra de autorização no app como fonte de verdade; a API sempre valida permissões.
