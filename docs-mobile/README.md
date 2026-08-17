# Documentação do Aplicativo Mobile

## Produto

- **Nome:** GTF Propostas
- **Descrição institucional:** Sistema Comercial GTF
- **Tipo:** aplicativo mobile multiplataforma
- **Tecnologia principal:** React Native com Expo e Expo Router
- **Código do aplicativo:** `artifacts/mobile`
- **Backend e banco:** a única API Node.js e o único PostgreSQL/Prisma do projeto principal `Sistema-Propostas`

Esta pasta é a fonte de verdade para arquitetura, execução, regras, integração e evolução do aplicativo mobile. A pasta `docs` do projeto principal continua sendo referência para regras compartilhadas, API, banco e sistema web, mas não deve ser usada como documentação da interface nativa.

## Arquitetura Oficial

O aplicativo mobile **não possui API nem banco próprios**. Existem dois clientes para o mesmo backend:

```text
Sistema web (Sistema-Propostas/artifacts/proposta)
                         \
                          > API única (Sistema-Propostas/artifacts/api-server)
                         /                         |
Aplicativo mobile (Sistema-PropostasGTF_App/artifacts/mobile)
                                                   |
                                                   v
                              PostgreSQL único + Prisma/migrations
                              (Sistema-Propostas/lib/db)
```

O código de API e banco copiado para `Sistema-PropostasGTF_App` pelo Replit é apenas uma réplica de contexto. Ele não deve ser tratado, publicado ou migrado como um segundo backend.

## Índice

1. [API e banco compartilhados](00-api-banco-compartilhados.md)
2. [Visão geral e estado atual](01-visao-geral-e-estado-atual.md)
3. [Stack e configuração](02-stack-e-configuracao.md)
4. [Arquitetura e estrutura de pastas](03-arquitetura-e-pastas.md)
5. [Navegação, perfis e telas](04-navegacao-perfis-e-telas.md)
6. [API, autenticação e dados](05-api-autenticacao-e-dados.md)
7. [Padrões de UI, segurança e qualidade](06-padroes-ui-seguranca-qualidade.md)
8. [Execução local, ambientes e publicação](07-execucao-ambientes-publicacao.md)
9. [Roadmap, lacunas e riscos](08-roadmap-lacunas-riscos.md)
10. [Paridade funcional entregue no plano mobile 002](09-paridade-funcional-plano-002.md)
11. [Desenho de paridade integral dos planos 033 e 034](10-paridade-integral-planos-033-034-design.md)

## Hierarquia de Referências

Em caso de divergência, usar esta ordem:

1. Código executável e schema atual.
2. Contratos da API e migrations.
3. Documentação de `docs-mobile`.
4. Documentação compartilhada em `docs`.
5. PRDs e planos históricos.

## Diretórios Relacionados

| Diretório | Finalidade |
|---|---|
| `artifacts/mobile` | Aplicativo Expo/React Native |
| `../Sistema-Propostas/artifacts/api-server` | Fonte de verdade da API compartilhada |
| `../Sistema-Propostas/lib/db` | Fonte de verdade do Prisma, schema e migrations |
| `../Sistema-Propostas/lib/api-spec` | Fonte de verdade da especificação OpenAPI |
| `docs-mobile` | Documentação do aplicativo |
| `agents-mobile` | Papéis de IA especializados no mobile |
| `plans-mobile` | Planos incrementais de evolução do aplicativo |
| `../Sistema-Propostas/.agents` | Agentes compartilhados ou orientados ao sistema web/backend |
| `../Sistema-Propostas/docs` | Documentação oficial do sistema web, API e banco |

## Regras de Manutenção

- Toda nova tela deve atualizar o inventário de telas.
- Toda mudança de endpoint deve atualizar a documentação de integração.
- Todo plano implementado deve terminar com checklist do realizado, validações e pendências.
- Segredos, tokens e chaves nunca devem ser registrados em Markdown ou versionados.
- Alterações de schema e API devem ser documentadas também no projeto principal.
