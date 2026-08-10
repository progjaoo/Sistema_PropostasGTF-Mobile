# Visão Geral e Estado Atual

## Objetivo do Aplicativo

O aplicativo leva os fluxos comerciais do Sistema de Propostas GTF para dispositivos móveis. Ele consome a API oficial localizada no projeto principal `Sistema-Propostas`, que por sua vez acessa o mesmo banco PostgreSQL usado pelo sistema web. O mobile nunca acessa o banco diretamente.

O foco atual é permitir acompanhamento comercial, consulta de clientes e leads, avisos de recaptura, edição de perfil e operações essenciais sobre propostas.

## Escopo Implementado

### Compartilhado

- Login mobile com access token e refresh token.
- Recuperação de sessão.
- Cadastro de usuário comercial pendente de ativação.
- Solicitação de recuperação de senha.
- Perfil do usuário.
- Logout com revogação do refresh token.
- Feedback visual por toast.
- Confirmações com diálogo nativo.

### Comercial

- Board de propostas por etapas e programas, adaptado para navegação horizontal.
- Criação de proposta vinculada a Empresa, Tipo e Cliente/Lead.
- Consulta de clientes e leads.
- Cadastro e edição de cliente/lead com origem obrigatória para novos Leads.
- Avisos de recaptura com conclusão, adiamento e aviso após login.
- Consulta do detalhe da proposta.
- Editor em etapas para contexto, período, produtos, investimento e revisão.
- Catálogo, produto avulso, metadados, sugestão de investimento e exclusão confirmada.
- Alteração de status, andamento completo, duplicação, PDF e compartilhamento.

### Admin

- Dashboard com indicadores e propostas recentes.
- Listagem de propostas, clientes/leads e avisos.
- Gestão de usuários e acessos por Empresa.
- Gestão de Empresas e apresentação padrão.
- Gestão de Programas, Produtos, Tipos de Proposta e Origens de Lead.
- Métricas resumidas de captação por origem.
- Edição do próprio perfil.

## Estado por Área

| Área | Estado | Observação |
|---|---|---|
| Autenticação mobile | Implementada | Tokens seguros no nativo e renovação automática |
| Login | Implementado | Será o primeiro fluxo revisado em `plans-mobile` |
| Recuperação de senha | Implementada em código | Deep link requer homologação nos builds |
| Propostas | Implementada em código | Board, editor em etapas, produtos, andamento, PDF e ações terminais |
| Clientes e leads | Implementada | Inclui origem e propostas vinculadas com redação por permissão |
| Avisos de recaptura | Implementada | Ações 7/15/30 dias e aviso após login |
| Usuários | Implementada | Inclui matriz de acesso por Empresa |
| Empresas | Implementada | Inclui cor e apresentação padrão; upload de logo permanece evolução |
| Programas | Implementada | CRUD administrativo compacto |
| Produtos | Implementada | CRUD com Empresa e valor sugerido |
| Tipos de proposta | Implementada | CRUD administrativo |
| Origens de Lead | Implementada | CRUD e métricas resumidas |
| Preview/PDF/compartilhamento | Implementada em código | Requer validação visual em iOS e Android reais |
| Testes automatizados | Base implementada | Schemas, guards e cálculo de investimento |
| Distribuição EAS | Configurada | IDs e perfis existem; builds dependem de autenticação Expo |

## Decisão de Organização

Os arquivos de API e banco copiados pelo Replit não serão removidos nesta etapa porque servem como contexto. Eles não são uma segunda implantação. Para evitar confusão:

- alterações nativas usam `docs-mobile`, `agents-mobile` e `plans-mobile`;
- alterações exclusivas de web continuam no projeto principal;
- alterações de API, Prisma e migrations são feitas primeiro em `Sistema-Propostas`;
- o sistema web e o aplicativo mobile devem ser validados contra a mesma API oficial.
