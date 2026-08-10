# Plano Mobile 001 — Ajuste da Tela de Login e Correções Críticas Iniciais

- **Projeto mobile:** `Sistema-PropostasGTF_App`
- **Aplicativo:** `artifacts/mobile`
- **Backend oficial:** `../Sistema-Propostas/artifacts/api-server`
- **Banco e Prisma oficiais:** `../Sistema-Propostas/lib/db`
- **Tipo:** React Native/Expo + integração com API compartilhada
- **Status:** Planejado
- **Prioridade:** Crítica

## 1. Agentes Selecionados

### Principal

- **Arquiteto Mobile:** consolidar autenticação, contratos, navegação e limites entre os dois projetos.

### Implementação

- **Engenheiro React Native/Expo:** telas, rotas, formulários, acessibilidade e estados visuais.
- **Engenheiro de Integração Mobile:** URL da API, endpoints, tokens, TanStack Query e erros.

### Apoio

- **Engenheiro de Segurança Mobile:** refresh token, SecureStore, redefinição de senha e deep links.
- **Designer UX/UI Mobile:** login, formulários, feedback e ergonomia.
- **QA Mobile:** iOS, Android, Admin, Comercial, rede e sessão.
- **Backend/API Engineer compartilhado:** incorporar na API oficial os contratos necessários ao mobile.
- **Technical Writer Mobile:** atualizar `docs-mobile` após a implementação.

Referências:

- `docs-mobile/README.md`
- `docs-mobile/00-api-banco-compartilhados.md`
- `docs-mobile/04-navegacao-perfis-e-telas.md`
- `docs-mobile/05-api-autenticacao-e-dados.md`
- `agents-mobile/README.md`
- `../Sistema-Propostas/docs/README.md`

## 2. Resultado da Varredura

### 2.1 Rotas públicas

| Tela | Estado encontrado | Correção |
|---|---|---|
| Login | Interface existente, porém chama endpoints ausentes na API oficial | Correção 1 |
| Cadastro comercial | Compatível com `/auth/register-commercial` | Manter e validar |
| Esqueci a senha | Solicitação implementada | Completar redefinição mobile |
| Redefinir senha | Tela e deep link ausentes | Correção 1 |

### 2.2 Comercial

| Tela | Estado encontrado | Observação |
|---|---|---|
| Propostas | Listagem e filtros básicos | Falta paridade com andamento por programa |
| Nova proposta | Cria rascunho com campos legados | Correção 2 |
| Detalhe da proposta | Editor parcial e autosave frágil | Plano posterior |
| Clientes e leads | Listagens funcionais | Cadastro permite criar Cliente diretamente |
| Cadastro de anunciante | Rótulos antigos e transição de status livre | Plano posterior |
| Avisos | Concluir e adiar disponíveis | Validar permissões |
| Perfil | Edição e logout existentes | Depende da correção de autenticação |

### 2.3 Admin

| Tela | Estado encontrado | Correção |
|---|---|---|
| Dashboard | Indicadores e recentes | Validar após autenticação |
| Propostas | Listagem básica | Plano posterior |
| Clientes/leads | Tela ainda usa conceitos antigos | Plano posterior |
| Avisos | Não oferece adiamento como no Comercial | Plano posterior |
| Menu | Programas, Produtos e Tipos apontam para rotas inexistentes | Correção 3 |
| Usuários | Não edita acessos por empresa | Correção 3 |
| Empresas | Edição chama `GET /stations/:id`, inexistente na API oficial | Correção 3 |

### 2.4 Infraestrutura de tela

- O cliente mobile usa `http://localhost:8080/api` como fallback.
- O Compose oficial publica a API em `localhost:8081`.
- Aparelho físico não pode usar `localhost` para alcançar o Mac.
- Há grupo `(tabs)` residual sem função de produto.
- Parte dos botões de ícone não possui `accessibilityLabel`.
- Estados de erro de rede são inconsistentes entre as listas.
- Não existe suíte automatizada de testes mobile.

## 3. Priorização

As três correções deste plano foram escolhidas nesta ordem:

1. **Sem autenticação contra a API oficial nenhuma tela autenticada é utilizável.**
2. **Criar proposta é a principal jornada comercial do produto.**
3. **A área Admin contém rotas diretamente quebradas e não consegue configurar os acessos exigidos pela API.**

## 4. Fora de Escopo

- Paridade total do editor mobile com o editor web.
- PDF e compartilhamento.
- Tela mobile completa de Programas, Produtos e Tipos de Proposta.
- Redesign completo de dashboard e listas.
- Correção da transição livre Lead/Cliente.
- Refatoração completa do autosave da proposta.
- Push notifications.
- Publicação nas lojas.

Esses itens devem virar planos posteriores.

---

## Correção 1 — Acesso, Tela de Login e Recuperação de Senha

### 5. Diagnóstico

O aplicativo chama:

```text
POST /api/auth/mobile/login
POST /api/auth/mobile/refresh
POST /api/auth/mobile/logout
```

Essas rotas existem apenas na cópia de API contida em `Sistema-PropostasGTF_App`. A API oficial de `Sistema-Propostas` possui apenas os fluxos web baseados em cookie:

```text
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

Logo, o login mobile não funciona contra o backend único oficial.

O reset de senha também é incompleto: o aplicativo solicita o e-mail, mas não possui rota que receba o token e envie a nova senha.

### 6. Objetivo

Entregar autenticação mobile funcional, segura e conectada à API oficial, mantendo o fluxo web inalterado.

### 7. Backend Oficial

Arquivos previstos:

- `Sistema-Propostas/artifacts/api-server/src/routes/auth.ts`
- `Sistema-Propostas/artifacts/api-server/src/lib/jwt.ts`
- testes de autenticação, caso exista estrutura de testes
- `Sistema-Propostas/lib/api-spec/openapi.yaml`

Passos:

1. Portar para a API oficial os endpoints `/auth/mobile/login`, `/auth/mobile/refresh` e `/auth/mobile/logout`.
2. Reutilizar validação de credenciais, assinatura JWT, rotação e revogação já existentes.
3. Retornar `refreshToken` no corpo somente nas rotas mobile.
4. Manter refresh token web em cookie `httpOnly`.
5. Não criar outro model, banco ou migration; o model `RefreshToken` já existe.
6. Garantir que usuário inativo não faça login nem renove sessão.
7. Documentar os endpoints mobile no OpenAPI.
8. Não registrar tokens nos logs.

### 8. Configuração da API no Aplicativo

Arquivo principal:

- `artifacts/mobile/src/api/client.ts`

Passos:

1. Adotar `EXPO_PUBLIC_API_URL` como configuração principal.
2. Aceitar URL completa com `/api`.
3. Remover montagem implícita baseada apenas em `EXPO_PUBLIC_DOMAIN`.
4. Definir fallback de desenvolvimento coerente com o Compose: `http://localhost:8081/api`.
5. Documentar configuração para simulador e aparelho físico.
6. Validar e normalizar barra final para evitar URLs duplicadas.
7. Exibir erro de configuração compreensível em desenvolvimento.
8. Preservar single-flight refresh e apenas uma repetição após `401`.

Exemplos:

```env
# Simulador no Mac
EXPO_PUBLIC_API_URL=http://localhost:8081/api

# Aparelho físico
EXPO_PUBLIC_API_URL=http://192.168.0.10:8081/api

# Produção
EXPO_PUBLIC_API_URL=https://propostas.grupogtf.com.br/api
```

### 9. Ajuste da Tela de Login

Arquivo:

- `artifacts/mobile/app/(public)/login.tsx`

Requisitos:

1. Preservar `gtf-logo-completa.png` e “Sistema Comercial GTF”.
2. Desabilitar múltiplos envios enquanto a requisição estiver ativa.
3. Manter Enter no campo de senha como submit.
4. Diferenciar:
   - credencial inválida;
   - conta inativa;
   - limite de tentativas;
   - API indisponível;
   - dispositivo sem conexão.
5. Adicionar `accessibilityLabel`, `accessibilityHint` e estado de ocupado onde necessário.
6. Garantir navegação por papel somente após tokens serem persistidos.
7. Limpar senha após falha de credencial, mantendo o e-mail.
8. Não revelar se um e-mail existe.
9. Validar teclado, autofill e gerenciador de senhas:
   - `textContentType="username"`/`emailAddress`;
   - `autoComplete="email"`;
   - senha com `textContentType="password"`.
10. Validar layout em telas pequenas e com fonte ampliada.

### 10. Redefinição de Senha Mobile

Arquivos previstos:

- `artifacts/mobile/app/(public)/reset-password.tsx`
- `artifacts/mobile/app/(public)/_layout.tsx`
- `artifacts/mobile/app.json`
- serviço de e-mail da API oficial

Passos:

1. Criar rota pública que receba `token`.
2. Implementar nova senha e confirmação com regra mínima de oito caracteres.
3. Chamar `POST /api/auth/reset-password`.
4. Tratar token inválido, expirado e já utilizado.
5. Após sucesso, redirecionar para login.
6. Configurar link HTTPS universal/app link para produção.
7. Manter fallback web para usuários sem o aplicativo.
8. Nunca registrar o token de redefinição.

### 11. Critérios de Aceite da Correção 1

- Login Admin e Comercial funciona usando a API oficial.
- Refresh token gira e a sessão permanece após reiniciar o app.
- Logout revoga o refresh token.
- Usuário inativo recebe acesso negado.
- API indisponível produz mensagem correta.
- Link de recuperação abre o fluxo válido e permite trocar a senha.
- O login web continua funcionando com cookie.
- Nenhum token aparece em log ou AsyncStorage.

---

## Correção 2 — Fluxo Inicial de Nova Proposta

### 12. Diagnóstico

`proposal/new.tsx` seleciona empresa e tipo, mas envia:

```json
{
  "stationId": "...",
  "propType": "nome do tipo",
  "propMonth": "MM",
  "propYear": "AAAA"
}
```

A API oficial suporta e espera a relação estável `proposalTypeId`. O payload atual cria apenas o texto legado, não garante a relação com o tipo selecionado e mantém período legado sem opção explícita.

Também faltam estados de erro para carregamento de empresas/tipos e invalidação consistente dos caches após criação.

### 13. Objetivo

Criar um rascunho válido e relacionado às entidades oficiais, sem implementar ainda o editor completo.

### 14. Alterações

Arquivos previstos:

- `artifacts/mobile/app/proposal/new.tsx`
- `artifacts/mobile/src/types/index.ts`
- `artifacts/mobile/src/api/client.ts`, somente se surgir contrato compartilhado

Passos:

1. Consultar somente empresas acessíveis e ativas.
2. Consultar tipos ativos com `active=true`.
3. Enviar:

```json
{
  "stationId": "station-id",
  "proposalTypeId": "proposal-type-id",
  "periodicity": "MONTHLY",
  "showPeriod": true
}
```

4. Não enviar `propType` manual quando `proposalTypeId` estiver disponível.
5. Deixar a API preencher o nome legado a partir da relação.
6. Exibir estados separados para:
   - carregando;
   - erro ao carregar;
   - nenhuma empresa permitida;
   - nenhum tipo ativo.
7. Oferecer “Tentar novamente”.
8. Preservar seleção ao ocorrer erro de criação.
9. Após sucesso:
   - invalidar propostas Comercial e Admin;
   - invalidar dashboard;
   - abrir o detalhe do novo rascunho.
10. Remover texto que promete edição de período enquanto essa edição não estiver disponível no detalhe.
11. Adicionar acessibilidade às opções e ao botão principal.
12. Impedir duplo submit.

### 15. Validações da Correção 2

- Admin cria proposta para qualquer empresa ativa.
- Comercial vê apenas empresas com `canCreateProposals`.
- Tipo de proposta fica persistido em `proposalTypeId`.
- Empresa sem permissão recebe `403`, mesmo manipulando o payload.
- Ausência de empresas ou tipos não deixa uma tela vazia.
- A nova proposta aparece nas listagens e dashboard sem reiniciar o app.

---

## Correção 3 — Integridade das Telas Administrativas

### 16. Diagnóstico

#### Menu

O menu Admin navega para:

```text
/admin/programs
/admin/products
/admin/proposal-types
```

Essas telas não existem.

#### Empresas

`admin/stations/[id].tsx` chama `GET /stations/:id`, mas a API oficial não possui essa rota.

#### Usuários

A API exige `stationAccesses` para um Comercial ativo. A tela mobile não carrega empresas e não envia:

- `canCreateProposals`;
- `canViewCatalog`;
- `active` por empresa.

Consequentemente, criar ou ativar Comercial pode falhar ou produzir uma gestão incompleta.

### 17. Objetivo

Eliminar navegação quebrada e tornar os CRUDs já expostos no mobile compatíveis com a API oficial.

### 18. Menu Administrativo

Arquivo:

- `artifacts/mobile/app/(admin)/menu.tsx`

Passos:

1. Não navegar para rotas inexistentes.
2. Na primeira entrega, ocultar itens não implementados ou mostrá-los desabilitados com “Em breve”.
3. Não criar telas vazias apenas para satisfazer links.
4. Manter somente Usuários, Empresas e Perfil como ações operacionais.
5. Adicionar proteção de papel nos stacks administrativos.
6. Remover grupo `(tabs)` residual se estiver comprovadamente sem uso.

### 19. Detalhe de Empresa

Arquivos previstos:

- `Sistema-Propostas/artifacts/api-server/src/routes/stations.ts`
- `Sistema-Propostas/lib/api-spec/openapi.yaml`
- `artifacts/mobile/app/admin/stations/[id].tsx`

Passos:

1. Criar `GET /api/stations/:id` na API oficial.
2. Exigir autenticação e respeitar acesso:
   - Admin pode consultar qualquer empresa;
   - Comercial somente empresa permitida, caso o endpoint seja reutilizado.
3. Retornar o mesmo DTO da listagem.
4. Tratar `404` e `403` separadamente no mobile.
5. Validar cor hexadecimal.
6. Preservar criação e atualização existentes.
7. Invalidar `stations`, `stations-for-new` e detalhe após salvar.

Nenhuma migration é necessária.

### 20. Gestão de Acessos do Usuário

Arquivos previstos:

- `artifacts/mobile/app/admin/users/[id].tsx`
- `artifacts/mobile/src/types/index.ts`
- componentes novos em `artifacts/mobile/components/admin`, se necessário

Passos:

1. Carregar empresas ativas.
2. Exibir seção “Acesso às empresas” para papel Comercial.
3. Para cada empresa, permitir:
   - acesso ativo;
   - criar propostas;
   - ver catálogo.
4. Enviar `stationAccesses` no `POST /users` e `PATCH /users/:id`.
5. Impedir ativação de Comercial sem pelo menos uma empresa com criação permitida.
6. Ao trocar de Admin para Comercial, exigir configuração de acesso antes de salvar.
7. Ao trocar para Admin, confirmar que acessos específicos deixam de limitar o usuário.
8. Mostrar o erro de validação da API próximo à seção de acessos.
9. Não permitir que o Admin remova acidentalmente o próprio acesso ou desative a si mesmo sem regra explícita.
10. Manter confirmação destrutiva para desativação.

### 21. Critérios de Aceite da Correção 3

- Nenhum item ativo do Menu Admin abre rota inexistente.
- Empresa existente abre e pode ser atualizada.
- `404` e falta de permissão possuem estados distintos.
- Admin cria Comercial ativo com acessos válidos.
- Comercial recebe somente empresas e catálogos autorizados.
- Mudança de acesso reflete na tela Nova Proposta após invalidar cache.

---

## 22. Estratégia de Testes

### API

- Login mobile válido, inválido e inativo.
- Refresh válido, expirado, revogado e concorrente.
- Logout revoga token.
- Reset válido, expirado e reutilizado.
- Detalhe de empresa com Admin, Comercial autorizado e Comercial não autorizado.
- Usuário Comercial ativo sem acesso deve falhar.
- Usuário Comercial com acesso válido deve salvar.
- Criação de proposta sem empresa ou sem permissão deve falhar.

### Mobile

- iOS e Android.
- Simulador e aparelho físico.
- Admin e Comercial.
- API local, homologação e indisponível.
- Reabertura do app com sessão válida e expirada.
- Teclado, autofill e fonte ampliada.
- Estado vazio e erro nas seleções.
- Rotas administrativas sem dead links.

### Comandos Esperados

No projeto principal:

```bash
pnpm --filter @workspace/db run generate
pnpm --filter @workspace/api-server run typecheck
```

No projeto mobile:

```bash
pnpm install
pnpm --filter @workspace/mobile run typecheck
```

Executar a API/PostgreSQL pelo Compose oficial e o aplicativo pelo Metro/Expo.

## 23. Ordem de Implementação

1. Instalar dependências e registrar baseline.
2. Incorporar autenticação mobile na API oficial.
3. Corrigir URL e cliente HTTP mobile.
4. Ajustar Login.
5. Implementar redefinição por link.
6. Corrigir Nova Proposta.
7. Corrigir menu Admin.
8. Adicionar detalhe de empresa na API e ajustar tela.
9. Implementar acessos por empresa em Usuários.
10. Executar QA integrado web + mobile.
11. Atualizar documentação.

## 24. Riscos

| Risco | Mitigação |
|---|---|
| Quebrar login web ao adicionar mobile | Manter rotas e estratégia de cookie web separadas |
| Expor refresh token | Corpo somente em endpoints mobile; SecureStore no app |
| Link de senha abrir navegador em vez do app | Universal link HTTPS com fallback web |
| Aparelho físico não acessar API local | `EXPO_PUBLIC_API_URL` com IP ou domínio acessível |
| Cache manter permissões antigas | Invalidar empresas, usuário e sessão após alteração |
| Escopo crescer para paridade total | Restringir Correção 2 ao rascunho inicial |

## 25. Documentação a Atualizar

- `docs-mobile/02-stack-e-configuracao.md`
- `docs-mobile/04-navegacao-perfis-e-telas.md`
- `docs-mobile/05-api-autenticacao-e-dados.md`
- `docs-mobile/07-execucao-ambientes-publicacao.md`
- documentação da API no projeto principal
- OpenAPI

## 26. Checklist da Implementação

Este checklist deve ser preenchido somente após a implementação.

### Correção 1

- [x] Endpoints mobile incorporados à API oficial
- [x] `EXPO_PUBLIC_API_URL` implementada
- [x] Tela de Login revisada
- [x] Refresh e logout implementados no contrato oficial
- [x] Redefinição de senha mobile implementada
- [x] Login web preservado no código, sem alteração das rotas web existentes

### Correção 2

- [x] Nova Proposta envia `proposalTypeId`
- [x] Permissões por empresa respeitadas via API e filtro mobile `viewerCanCreateProposals`
- [x] Estados de erro e vazio implementados
- [x] Caches invalidados após criação
- [ ] Fluxo validado manualmente para Admin e Comercial em dispositivo/simulador

### Correção 3

- [x] Menu sem rotas quebradas
- [x] `GET /stations/:id` implementado
- [x] Detalhe de empresa funcional contra a API oficial
- [x] Acessos por empresa implementados em Usuários
- [x] Ativação de Comercial validada antes do envio e também pela API

### Validações Executadas

- [x] Typecheck API
- [x] Typecheck mobile
- [ ] Testes automatizados de autenticação
- [ ] QA iOS
- [ ] QA Android
- [ ] Regressão manual do sistema web

### Pendências e Riscos Residuais

- Falta QA manual em Expo Go/dev client com Admin e Comercial reais.
- Falta validar o link de recuperação com `MOBILE_APP_RESET_URL` em ambiente de homologação/produção.
- O refresh token ainda é armazenado em texto no banco; recomendação futura: persistir hash do refresh token.
- Programas, Produtos e Tipos de Proposta no Admin mobile seguem fora do escopo e aparecem como "Em breve".
