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

## Definition of Done

- Critérios do plano atendidos.
- Sem rota quebrada nova.
- Typecheck aprovado.
- Estados de UI cobertos.
- Permissões testadas.
- Documentação atualizada.
- Checklist final registrado no plano.
- Nenhum segredo versionado.

