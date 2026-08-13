# Plano Mobile 007 - Recuperacao de Senha por E-mail com Resend

> **Para agentes executores:** SUB-SKILL OBRIGATORIA: usar `superpowers:executing-plans` para executar este plano tarefa por tarefa, com checkpoints. A API compartilhada deve ser entregue primeiro pelo plano web `plan-028-recuperacao-senha-resend-web-api.md`.

**Objetivo:** concluir no aplicativo Expo o fluxo de solicitacao e redefinicao de senha por e-mail, consumindo a API unica do Sistema de Propostas e abrindo o link recebido diretamente na tela nativa de nova senha.

**Arquitetura:** o app envia somente o e-mail para `POST /api/auth/forgot-password` e a nova senha para `POST /api/auth/reset-password`. A API compartilhada gera, armazena e valida o token, envia o e-mail via Resend e monta o deep link mobile. Nenhum segredo do Resend entra no bundle Expo.

**Stack:** React Native, Expo SDK 54, Expo Router, TypeScript, Expo Linking, API Express compartilhada, Resend e PostgreSQL/Prisma compartilhado.

## Restricoes Globais

- A fonte de verdade da API e do banco permanece em `../Sistema-Propostas`.
- `RESEND_API_KEY` e `RESEND_FROM_EMAIL` existem somente no ambiente do backend; nunca usar `EXPO_PUBLIC_RESEND_*`.
- Remetente de producao: `GTF Propostas <nao-responda@resend.grupogtf.com.br>`.
- Deep link nativo de producao: `gtfpropostas://reset-password?token={token}`.
- O app nunca persiste o token de redefinicao; ele apenas o recebe pela URL e o envia uma vez para a API.
- A resposta de solicitacao deve ser identica para e-mail existente, inexistente ou usuario inativo, impedindo enumeracao de contas.
- Senha nova entre 8 e 128 caracteres e confirmacao obrigatoriamente igual.
- Token expira em 30 minutos, e de uso unico e revoga sessoes anteriores apos a troca.
- Expo Go nao oferece URI customizada estavel para este fluxo; o aceite final do deep link exige development build ou build de homologacao.

---

## 1. Agentes Selecionados

| Papel | Responsabilidade no plano |
|---|---|
| **Backend API Engineer (principal)** | Garantir o contrato compartilhado, a selecao do link mobile pelo header e a integracao Resend no projeto web. |
| **React Native/Expo Engineer** | Integrar telas existentes, deep link, navegacao, estados e acessibilidade no app. |
| **Mobile Security Engineer** | Impedir segredo no bundle, validar entrada do deep link, token e mensagens anti-enumeracao. |
| **Mobile API Integration Engineer** | Validar headers, payloads, erros e compatibilidade com a API publicada. |
| **QA Mobile** | Testar iOS, Android, app fechado/aberto, expiracao, reuso e falhas de rede. |
| **Mobile DevOps/Release Engineer** | Configurar scheme, development build e variaveis publicas permitidas por ambiente. |
| **Technical Writer** | Atualizar documentos de autenticacao, ambientes e publicacao. |

## 2. Estado Atual Confirmado

- Ja existe `app/(public)/forgot-password.tsx` chamando `POST /auth/forgot-password`.
- Ja existe `app/(public)/reset-password.tsx` lendo `token` da URL e chamando `POST /auth/reset-password`.
- `app.json` ja declara o scheme `gtfpropostas`.
- O cliente `src/api/client.ts` ja envia `X-Client-Platform: mobile`.
- A API compartilhada ja usa esse header para montar `MOBILE_APP_RESET_URL`.
- A lacuna principal e transformar estes elementos em um fluxo integrado e testado, incluindo deep link real, contrato tipado, tratamento de erros e configuracao segura de producao.

## 3. Fluxo Alvo

```text
Tela Login
  -> Esqueceu a senha?
  -> POST /api/auth/forgot-password + X-Client-Platform: mobile
  -> API cria token hash e envia e-mail Resend
  -> usuario toca em gtfpropostas://reset-password?token=...
  -> Expo Router abre /(public)/reset-password
  -> POST /api/auth/reset-password
  -> API altera senha, consome token e revoga sessoes
  -> app volta ao login
```

## 4. Contratos Consumidos

### Solicitacao

```http
POST /api/auth/forgot-password
X-Client-Platform: mobile
Content-Type: application/json

{"email":"usuario@grupogtf.com.br"}
```

Resposta esperada, sempre generica:

```json
{
  "message": "Se o e-mail estiver cadastrado, enviaremos as instrucoes de recuperacao."
}
```

### Redefinicao

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "token-recebido-no-deep-link",
  "newPassword": "nova-senha-segura",
  "confirmPassword": "nova-senha-segura"
}
```

Respostas relevantes:

- `200`: senha redefinida;
- `400`: token invalido, expirado, usado ou payload invalido;
- `429`: limite de tentativas excedido;
- falha de rede: manter formulario e permitir nova tentativa.

## 5. Arquivos Afetados

### Aplicativo mobile

- Modificar: `artifacts/mobile/app/(public)/forgot-password.tsx`
- Modificar: `artifacts/mobile/app/(public)/reset-password.tsx`
- Modificar: `artifacts/mobile/app/(public)/login.tsx` somente se o link para recuperacao nao estiver acessivel ou consistente.
- Modificar: `artifacts/mobile/app/(public)/_layout.tsx` somente para opcoes de navegacao sem header duplicado.
- Modificar: `artifacts/mobile/src/api/client.ts` para preservar explicitamente `X-Client-Platform: mobile` nos endpoints publicos.
- Criar: `artifacts/mobile/src/features/auth/passwordReset.ts`
- Criar: `artifacts/mobile/src/features/auth/__tests__/passwordReset.test.ts`
- Criar: `artifacts/mobile/src/features/auth/__tests__/passwordResetScreens.test.tsx`
- Verificar/modificar: `artifacts/mobile/app.json`
- Atualizar: `docs-mobile/05-api-autenticacao-e-dados.md`
- Atualizar: `docs-mobile/07-execucao-ambientes-publicacao.md`

### Dependencia no projeto principal

- O backend, o template de e-mail, as variaveis Resend e os testes da API pertencem ao plano web 028 e nao devem ser copiados para este repositorio mobile.

## 6. Tarefas de Implementacao

### Tarefa 1 - Fixar o contrato do cliente mobile

**Interfaces:**

- Produz `requestPasswordReset(email: string): Promise<void>`.
- Produz `resetPassword(input: { token: string; newPassword: string; confirmPassword: string }): Promise<void>`.
- Consome `apiCall` de `src/api/client.ts`.

- [ ] Criar testes unitarios que confirmem normalizacao do e-mail com `trim().toLowerCase()` e payload exato.
- [ ] Criar testes que confirmem o envio do header `X-Client-Platform: mobile` inclusive sem sessao autenticada.
- [ ] Criar `src/features/auth/passwordReset.ts` centralizando as duas chamadas, sem regra de Resend no app.
- [ ] Substituir chamadas inline das telas pelas funcoes do modulo.
- [ ] Executar `pnpm run test -- passwordReset.test.ts` e confirmar sucesso.

### Tarefa 2 - Consolidar a tela de solicitacao

**Comportamento esperado:**

- validar formato basico do e-mail antes da chamada;
- desabilitar envio enquanto a requisicao estiver em andamento;
- impedir duplo toque;
- exibir a mesma confirmacao generica para qualquer e-mail aceito pela API;
- em `429`, informar para aguardar e tentar novamente;
- em falha de rede, preservar o e-mail digitado;
- permitir voltar ao login.

- [ ] Escrever teste da tela para e-mail invalido sem chamada de rede.
- [ ] Escrever teste de sucesso com mensagem anti-enumeracao.
- [ ] Escrever teste de `429` e falha de rede.
- [ ] Ajustar `forgot-password.tsx` usando componentes e tokens atuais, sem alterar a identidade visual validada.
- [ ] Garantir `keyboardType="email-address"`, `autoCapitalize="none"`, `autoCorrect={false}` e labels acessiveis.
- [ ] Executar o teste isolado da tela.

### Tarefa 3 - Validar o deep link e a tela de nova senha

**Rota alvo:** `gtfpropostas://reset-password?token={token}` deve resolver para a rota Expo Router `/(public)/reset-password`.

- [ ] Escrever teste para token como string, token como array e token ausente.
- [ ] Escrever teste para senha menor que 8, confirmacao divergente e formulario valido.
- [ ] Ajustar a leitura de `useLocalSearchParams` para aceitar apenas um token string nao vazio e com tamanho plausivel.
- [ ] Para token ausente/invalido, mostrar estado de link invalido com acao `Solicitar novo link`, sem habilitar o envio.
- [ ] Para `400`, apresentar `Link invalido, expirado ou ja utilizado` e oferecer nova solicitacao.
- [ ] Para `429`, mostrar espera; para erro de rede, preservar as senhas e permitir repetir.
- [ ] No sucesso, limpar os campos, exibir confirmacao e substituir a pilha por `/(public)/login`.
- [ ] Nao registrar URL, token ou senha em console, analytics ou toast.

### Tarefa 4 - Testar abertura do link no app

- [ ] Confirmar `"scheme": "gtfpropostas"` em `artifacts/mobile/app.json`.
- [ ] Gerar ou usar development build; uma mudanca de scheme exige novo build nativo.
- [ ] Com o app fechado no iOS, executar:

```bash
pnpm exec uri-scheme open 'gtfpropostas://reset-password?token=token-de-teste-com-mais-de-vinte-caracteres' --ios
```

- [ ] Com o app em segundo plano no Android, executar:

```bash
pnpm exec uri-scheme open 'gtfpropostas://reset-password?token=token-de-teste-com-mais-de-vinte-caracteres' --android
```

- [ ] Confirmar que ambos abrem a tela correta e que voltar nao revela tela autenticada.
- [ ] No Expo Go, testar navegacao manual pela rota; nao usar Expo Go como evidencia final do custom scheme.

### Tarefa 5 - Validar integracao ponta a ponta

Pre-condicoes do ambiente da API, entregues pelo plano web 028:

```env
EMAIL_PROVIDER=resend
RESEND_FROM_EMAIL=GTF Propostas <nao-responda@resend.grupogtf.com.br>
MOBILE_APP_RESET_URL=gtfpropostas://reset-password
PASSWORD_RESET_TTL_MINUTES=30
```

- [ ] Solicitar recuperacao para usuario ADMIN ativo.
- [ ] Confirmar entrega do e-mail e remetente no subdominio verificado.
- [ ] Abrir o link em dispositivo com o development build instalado.
- [ ] Definir nova senha e autenticar com ela.
- [ ] Confirmar que o link nao funciona pela segunda vez.
- [ ] Confirmar que token expirado e rejeitado.
- [ ] Confirmar que sessoes antigas do mesmo usuario foram revogadas.
- [ ] Solicitar e-mail inexistente e verificar resposta indistinguivel, sem envio.
- [ ] Validar o mesmo fluxo para usuario COMERCIAL ativo.

### Tarefa 6 - Documentacao e verificacao final

- [ ] Documentar em `docs-mobile/05-api-autenticacao-e-dados.md` que o envio e responsabilidade exclusiva da API compartilhada.
- [ ] Documentar em `docs-mobile/07-execucao-ambientes-publicacao.md` o custom scheme, o development build e os testes iOS/Android.
- [ ] Registrar que `RESEND_API_KEY` nao pode existir em `.env` do Expo nem em variavel `EXPO_PUBLIC_*`.
- [ ] Executar:

```bash
cd artifacts/mobile
pnpm run typecheck
pnpm test
```

- [ ] Fazer busca de seguranca antes do commit:

```bash
rg -n 're_[A-Za-z0-9_]+|RESEND_API_KEY|RESEND_FROM_EMAIL' artifacts/mobile docs-mobile
```

Resultado esperado: nenhum valor de chave; apenas documentacao explicando que o segredo pertence ao backend.

## 7. Criterios de Aceite

- [ ] Link `Esqueceu a senha?` abre a tela correta.
- [ ] Solicitacao envia header mobile e recebe resposta generica.
- [ ] E-mail usa `nao-responda@resend.grupogtf.com.br` via API compartilhada.
- [ ] Tocar no link abre a tela nativa em development/production build.
- [ ] Token ausente, expirado, usado ou alterado nao redefine senha.
- [ ] Nova senha permite login e sessoes antigas deixam de funcionar.
- [ ] Nenhuma API key ou segredo esta no app, bundle, logs ou repositorio.
- [ ] Fluxo funciona para ADMIN e COMERCIAL no iOS e Android.
- [ ] Typecheck e testes passam.

## 8. Riscos e Mitigacoes

| Risco | Mitigacao |
|---|---|
| Chave Resend adicionada ao `.env` mobile | Remover do app, rotacionar se foi exposta e manter somente no backend/Vercel. |
| Custom scheme nao abrir no Expo Go | Usar development build para aceite; Expo Go possui URL dinamica. |
| App nao instalado | Para o MVP, orientar uso da tela web; Universal Links/App Links ficam como evolucao posterior. |
| Enumeracao de e-mails | Mensagem e status genericos para conta existente e inexistente. |
| Reuso ou vazamento de token | Hash no banco, TTL de 30 minutos, uso unico, sem logs e revogacao de sessoes. |
| E-mail duplicado por duplo toque | Botao bloqueado durante request e rate limit no backend. |

## 9. Ordem Recomendada e Checkpoint

1. Executar `plan-028-recuperacao-senha-resend-web-api.md` no projeto principal.
2. Validar a API publicada e o dominio Resend.
3. Executar este plano mobile.
4. Validar visualmente e funcionalmente antes do commit.

## 10. Checklist de Execucao

- [x] Contrato mobile centralizado e coberto por testes de e-mail, token e senha.
- [x] Header `X-Client-Platform: mobile` extraido para helper testavel e preservado em requisicoes publicas/autenticadas.
- [x] Tela de solicitacao integrada, com bloqueio de duplo toque, e-mail preservado e tratamento de `429`/rede.
- [x] Tela de redefinicao com token plausivel, estado invalido/expirado, nova solicitacao e confirmacao de sucesso.
- [x] Scheme `gtfpropostas` confirmado no `app.json`.
- [x] Documentacao mobile atualizada sem segredo Resend no app.
- [x] Verificacao automatizada: `8 suites/31 testes` e typecheck aprovados.
- [ ] Pendente QA nativo: abrir custom scheme em development build no iOS e Android, app fechado e em segundo plano.
- [ ] Pendente ponta a ponta: envio real pela API publicada para ADMIN/COMERCIAL e validacao de expiracao, reuso e revogacao.

### Registro de Implementacao - 10/08/2026

- O aplicativo consome somente a API compartilhada; nao foi adicionada dependencia ou chave do Resend ao bundle Expo.
- Expo Go pode validar as telas manualmente, mas nao e criterio final para o custom scheme.
- Nenhum commit foi criado; a entrega permanece na branch atual para validacao visual do usuario.

## Referencias Oficiais

- Resend, remetente em dominio verificado: <https://resend.com/docs/knowledge-base/how-do-I-create-an-email-address-or-sender-in-resend>
- Expo, links para dentro do app: <https://docs.expo.dev/linking/into-your-app/>
- Expo Router, navegacao e deep links: <https://docs.expo.dev/router/basics/navigation/>
