# Navegação, Perfis e Telas

## Inicialização

`app/_layout.tsx` configura providers globais, fontes, tratamento de erro, toast, teclado e cache de consultas. `app/index.tsx` restaura a sessão e direciona:

- `ADMIN` para o grupo administrativo;
- `COMERCIAL` para o grupo comercial;
- usuário sem sessão para login.

## Rotas Públicas

| Rota | Estado | Função |
|---|---|---|
| `/(public)/login` | Implementada | Entrar com e-mail e senha |
| `/(public)/register` | Implementada | Solicitar conta comercial inativa |
| `/(public)/forgot-password` | Implementada | Solicitar link de redefinição |
| `/(public)/reset-password` | Implementada | Receber token do link e salvar nova senha |

## Perfil Comercial

| Rota | Estado | Função |
|---|---|---|
| `/(comercial)` | Implementada | Kanban contextual por Empresa ou Programa, com modos focado/expandido |
| `/(comercial)/clients` | Implementada | Clientes |
| `/(comercial)/leads` | Implementada | Leads |
| `/(comercial)/alerts` | Implementada | Avisos de recaptura |
| `/(comercial)/profile` | Implementada | Perfil e logout |
| `/proposal/new` | Implementada | Cria rascunho com Empresa, Tipo e Cliente/Lead |
| `/proposal/[id]` | Implementada | Editor em etapas, produtos, andamento, PDF e ações |
| `/advertiser/new` | Implementada | Novo Lead com origem; Cliente direto apenas no fluxo Admin |
| `/advertiser/[id]` | Implementada | Edição e propostas vinculadas com regras de visibilidade |

## Perfil Admin

| Rota | Estado | Função |
|---|---|---|
| `/(admin)` | Implementada | Dashboard |
| `/(admin)/proposals` | Implementada | Mesmo Kanban contextual nativo da operação comercial |
| `/(admin)/clients` | Implementada | Clientes e Leads conforme regras da API |
| `/(admin)/alerts` | Implementada | Tratar e adiar 7/15/30 dias |
| `/(admin)/menu` | Implementada | Acesso aos cadastros administrativos |
| `/admin/users` | Implementada | CRUD de usuários |
| `/admin/users/[id]` | Implementada | Edição e matriz de acesso por Empresa |
| `/admin/stations` | Implementada | Listagem e criação de Empresas |
| `/admin/stations/[id]` | Implementada | Dados, cor e apresentação padrão |
| `/admin/profile` | Implementada | Reutiliza o perfil comercial |
| `/admin/programs` | Implementada | CRUD compacto de Programas |
| `/admin/products` | Implementada | CRUD compacto de Produtos |
| `/admin/proposal-types` | Implementada | CRUD de Tipos de Proposta |
| `/admin/lead-sources` | Implementada | CRUD de Origens e métricas resumidas |

## Fluxo de Proposta no Mobile

O fluxo seleciona Empresa, Tipo e Cliente/Lead antes de criar o rascunho. O detalhe usa etapas horizontais de Contexto, Período, Produtos, Investimento e Revisão. Produtos podem vir do catálogo ou existir apenas na proposta; duração, horário e sazonalidade são editáveis. A revisão concentra andamento, duplicação, status terminal e geração/compartilhamento de PDF.

### PDF da proposta

O botão **Gerar e compartilhar PDF** monta o documento localmente, sem abrir o diálogo de impressão. O aplicativo:

1. normaliza os dados da proposta com as mesmas prioridades do sistema web;
2. distribui os produtos em folhas A4 explícitas;
3. embute Montserrat localmente;
4. gera o arquivo com `expo-print` em `595 x 842 pt`;
5. valida a quantidade produzida de folhas;
6. abre o compartilhamento nativo somente quando o arquivo está consistente.

O Hero, o logo e as bordas usam a cor cadastrada na Empresa. A identidade Mosaico da interface não substitui `Station.primaryColor` no documento comercial. Investimento e contato aparecem juntos apenas na última folha.

## Regra de Navegação

Links só devem ser exibidos se a tela existir e se o usuário tiver permissão. Rotas administrativas também devem validar o perfil ao montar a tela, sem depender apenas da visibilidade do menu.

## Rotas ADMIN da Entrega 1

| Rota | Estado | Função |
|---|---|---|
| `/admin/contracts` | Implementada | Lista global, filtro por responsável, KPIs e previsão |
| `/admin/contracts/new` | Implementada | Contrato a partir de proposta aprovada elegível |
| `/admin/contracts/[id]` | Implementada | Edição e cancelamento com histórico |

`/(admin)/proposals` inicia na visão por Empresa para ADMIN. O menu administrativo apresenta Contratos. A marca no menu retorna ao Dashboard com label acessível.

## Rotas COMERCIAL da Entrega 2

| Rota | Estado | Função |
|---|---|---|
| `/(comercial)` | Implementada | Propostas próprias e board com andamento |
| `/(comercial)/clients` | Implementada | Clientes e Leads segmentados |
| `/(comercial)/products` | Implementada | Catálogo autorizado read-only |
| `/(comercial)/contracts` | Implementada | Meus Contratos, resumo e forecast |
| `/(comercial)/more` | Implementada | Hub de Avisos e Perfil |
| `/contracts/new`, `/contracts/[id]` | Implementada | Criação, edição e cancelamento de contrato próprio |

`/(comercial)/leads`, `/(comercial)/alerts` e `/(comercial)/profile` preservam compatibilidade e redirecionam para os novos destinos.

## Kanban contextual de Propostas

A tela de Propostas possui um único caminho de renderização para ADMIN e COMERCIAL. O usuário escolhe `Empresa` ou `Programa` na barra de contexto; essa seleção define o board e não aparece novamente nos filtros avançados.

- **Focado:** uma etapa por vez, swipe horizontal com snap e indicadores das sete etapas.
- **Expandido:** colunas lado a lado, rolagem horizontal livre e cards compactos.
- **Etapas:** Lead criado, Em conversa, Proposta enviada, Cliente analisando, Negociação, Aprovada e Rejeitada.
- **Contexto:** seleção de Empresa e Programa fica preservada separadamente durante a sessão da tela; `Sem programa` é tratado como grupo sintético.
- **Filtros:** busca em overlay; status, responsável (somente ADMIN), tipo e período no sheet avançado; chips ativos removíveis.
- **Permissões:** o movimento só é exibido quando `viewerCanEdit` permite; a API continua sendo a autoridade final.
