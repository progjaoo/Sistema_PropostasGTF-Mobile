# Paridade Funcional Entregue no Plano Mobile 002

## Arquitetura Preservada

O aplicativo continua sendo somente um cliente da API oficial do `Sistema-Propostas`. Não foram criados banco, Prisma, migrations ou regras de autorização no repositório mobile. As alterações compartilhadas ficaram limitadas ao contrato OpenAPI e à correção da duplicação de propostas na API principal.

## Entregas

- contratos críticos validados com Zod e query keys por domínio;
- sessão expirada centralizada e mutações bloqueadas quando o aparelho está offline;
- Clientes e Leads com origem, propostas vinculadas e `viewerCanEdit`;
- board de propostas por etapa, programa e movimentação explícita;
- filtro de status recebido do Dashboard e opção visível para removê-lo no board;
- criação vinculada a Empresa, Tipo e Cliente/Lead;
- editor em etapas com período, ocultação no PDF, produtos, investimento e revisão;
- catálogo de produtos, item avulso, duração, horário, sazonalidade e exclusão confirmada;
- sugestão de investimento sem sobrescrever automaticamente o valor negociado;
- timeline completa, duplicação e ações de enviar, aprovar e rejeitar;
- geração de PDF A4 paginado com Expo Print, investimento/contato na última folha e compartilhamento com Expo Sharing;
- recaptura com sheet após login, tratar e adiar;
- CRUDs administrativos de Empresas, apresentação, Programas, Produtos, Tipos e Origens;
- métricas resumidas de origem e manutenção da matriz de acesso dos usuários;
- guards de perfil nas árvores de rotas ADMIN e COMERCIAL;
- proteção reforçada na API: COMERCIAL cria somente Lead, não promove Lead manualmente para Cliente e não exclui Cliente/Lead;
- configuração EAS e identificadores `br.com.grupogtf.propostas`;
- testes Jest para contratos, guards e cálculo de investimento.

## Validação Automatizada

Executar na raiz de `Sistema-PropostasGTF_App`:

```bash
pnpm --filter @workspace/mobile test
pnpm --filter @workspace/mobile run typecheck
EXPO_PUBLIC_API_URL=https://propostasmosaico-one.vercel.app/api \
  pnpm --filter @workspace/mobile exec expo export \
  --platform ios --platform android --output-dir dist-test
```

O diretório `dist-test` é apenas artefato temporário de validação e não deve ser versionado.

No projeto principal, a suíte compartilhada também foi executada com o
PostgreSQL descartável de testes:

```bash
docker compose --profile test up -d postgres-test
DATABASE_URL='postgresql://propostas_test:propostas_test@localhost:5435/propostas_test?schema=public' \
  pnpm --filter @workspace/db exec prisma db push --schema ./prisma/schema.prisma --accept-data-loss
pnpm --filter @workspace/api-server run test
```

Resultado: 11 arquivos e 37 testes aprovados. O `db push` acima é exclusivo do
banco descartável local e nunca deve ser usado no Railway.

## Homologação Ainda Necessária

- iOS e Android em aparelhos reais;
- deep link de redefinição de senha;
- sessão expirada e recuperação de rede;
- PDF de propostas com 0, 1, 4, 5 e 12 produtos;
- builds EAS `preview`;
- revisão visual com texto ampliado e tela de 320 pontos;

## Riscos Residuais

- O PDF possui páginas A4 explícitas e teste automatizado de múltiplas folhas; o resultado visual ainda precisa ser homologado em aparelhos reais com descrições longas.
- A especificação OpenAPI contém os schemas consumidos pelo aplicativo, mas alguns paths operacionais ainda precisam ser formalizados para uma geração integral do cliente.
- Os cadastros administrativos mobile cobrem os campos essenciais. Configurações avançadas continuam disponíveis no sistema web.
