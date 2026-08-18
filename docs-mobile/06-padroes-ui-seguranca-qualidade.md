# Padrões de UI, Segurança e Qualidade

## Identidade Visual

- Nome do produto: **GTF Propostas**
- Assinatura: **Sistema Comercial GTF**
- Fonte principal: Inter
- Cards operacionais com raio contido e hierarquia de leitura clara
- Cores semânticas distintas para sucesso, erro, alerta e informação
- Layouts devem respeitar safe areas, teclado e tamanhos de toque

## Componentes

Reutilizar os componentes existentes antes de criar variantes:

- `ProposalCard`
- `AdvertiserCard`
- `StatusBadge`
- `EmptyState`
- `LoadingSpinner`
- `ToastProvider`
- `ConfirmDialog`

Novos componentes devem contemplar:

- carregamento;
- vazio;
- erro e repetição;
- desabilitado;
- acessibilidade;
- telas pequenas;
- conteúdo longo.

## Feedback

- Criação e atualização concluídas: sucesso/verde.
- Exclusão ou operação destrutiva concluída: erro/vermelho.
- Atenção não destrutiva: warning/âmbar.
- Informação neutra: info/azul.
- Ações destrutivas exigem confirmação.
- Mensagens devem explicar o resultado e, em erro, orientar o próximo passo.

## Acessibilidade

- Alvos de toque com pelo menos 44 pontos.
- `accessibilityLabel` em botões de ícone.
- Ordem lógica de foco.
- Contraste suficiente.
- Texto com suporte a escala do sistema.
- Não comunicar estado apenas por cor.
- Formulários devem associar rótulo, ajuda e erro.

## Segurança

- Nunca armazenar senha.
- Tokens apenas no SecureStore em plataformas nativas.
- Nunca incluir chaves privadas em variáveis `EXPO_PUBLIC_*`.
- Não registrar tokens, senhas ou dados pessoais em logs.
- Usar HTTPS em homologação e produção.
- Revogar refresh token no logout.
- Validar deep links de redefinição de senha.
- Manter autorização no servidor.

## Qualidade de Código

Antes de concluir uma tarefa:

```bash
pnpm --filter @workspace/mobile run typecheck
```

Também validar:

- Android e iOS;
- estado autenticado e não autenticado;
- Admin e Comercial;
- internet lenta, erro e offline;
- rotação de token;
- navegação de retorno;
- teclado aberto;
- textos grandes;
- ausência de warning relevante no console.

## Contrato de PDF A4

- folha física: A4 retrato, `595 x 842 pt` no SDK e `210 x 297 mm` no HTML;
- margens do SDK: zero; as margens visuais pertencem ao container da folha;
- páginas são criadas pelo paginador antes da renderização, nunca por quebra automática do navegador;
- Hero e Apresentação aparecem somente na primeira folha;
- páginas intermediárias repetem cabeçalho compacto e identificam continuação;
- investimento e contato aparecem juntos, uma vez, na última folha;
- cards, investimento e contato usam `break-inside: avoid` e altura controlada;
- Montserrat é embutida a partir de assets locais do bundle;
- logo transparente permanece dentro de um wrapper com `Station.primaryColor`;
- o compartilhamento é bloqueado se `expo-print` produzir quantidade diferente das folhas planejadas;
- logs de erro podem conter contagens de páginas, mas nunca dados pessoais da proposta.

Os testes do pipeline ficam em `src/features/proposals/print/__tests__`. Mudanças visuais no PDF web devem atualizar também as fixtures de paridade mobile.

## Definition of Done

- Critérios do plano atendidos.
- Sem rota quebrada nova.
- Typecheck aprovado.
- Estados de UI cobertos.
- Permissões testadas.
- Documentação atualizada.
- Checklist final registrado no plano.
- Nenhum segredo versionado.

## Padrões aplicados na Entrega 1

- Operações destrutivas de Empresa e Proposta usam `TypedConfirmDialog` com comparação exata do nome, alvo mínimo de 44 pontos e região de anúncio acessível.
- Rejeição de proposta, desativação de Empresa, exclusão permanente de Empresa e exclusão permanente de Proposta permanecem ações distintas.
- O autosave aceita somente campos mutáveis, serializa revisões e expõe `flush()` para PDF, navegação, status, duplicação e exclusão.
- PDF aplica `min-width: 0` e `overflow-wrap: anywhere` em cards de apresentação e produtos.
- Valores de Contratos são convertidos para centavos inteiros no cliente e enviados como strings decimais.

## Padrões aplicados no Kanban contextual de Propostas

- Empresa e Programa são os únicos contextos de organização; não existem modos concorrentes de Lista, Empresas ou Programas.
- O board sempre monta as sete etapas e deduplica propostas por `proposal.id` no contexto Empresa.
- O modo focado usa paginação horizontal; o modo expandido usa colunas compactas e rolagem livre.
- Busca e filtros avançados ficam fora do topo permanente e não duplicam a seleção de contexto.
- Cards respeitam `viewerCanEdit`, estados vazios, refresh por coluna e alvos de toque acessíveis.
- Listas usam `FlatList` com janela de renderização controlada para evitar renderização excessiva em boards grandes.

## Padrões aplicados na Entrega 2

- A navegação COMERCIAL mantém cinco destinos e redirects para rotas legadas.
- Nenhum comando administrativo aparece no catálogo COMERCIAL.
- Conversão Lead → Cliente preserva o mesmo ID; desativação é lógica e usa confirmação digitada.
- O editor COMERCIAL aceita quantidade inteira de 1 a 9999, valor unitário e subtotal por item.
- Apresentação institucional e alteração de andamento permanecem fora do editor COMERCIAL; andamento continua no board.
- Exclusão permanente fica visível apenas para ADMIN ou proprietário editável; a API continua sendo a autoridade final.
