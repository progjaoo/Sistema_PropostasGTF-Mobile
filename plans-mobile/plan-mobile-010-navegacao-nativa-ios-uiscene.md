# Plano Mobile 010 - Navegacao Nativa iOS e Compatibilidade UIScene

- Projeto: Mosaico Propostas Mobile
- Data: 12/08/2026
- Tipo: React Native + Expo, com impacto nativo iOS condicionado
- Status: Planejado
- Viabilidade: Viavel com adequacoes ao Expo Router e ao Continuous Native Generation
- Prioridade: Alta antes da proxima publicacao iOS

## 1. Agentes Selecionados

### Agente principal: Arquiteto Mobile

Responsavel por preservar a arquitetura Expo Router, decidir a fronteira entre codigo JavaScript e configuracao nativa e impedir a duplicacao de navegadores ou a manutencao manual de arquivos gerados.

### Agentes de apoio

- **Engenheiro React Native/Expo:** configura os stacks nativos, headers, gestos e rotas.
- **DevOps/Release Mobile:** audita o projeto iOS gerado, EAS Build, Xcode e a estrategia CNG/config plugin.
- **QA Mobile:** valida navegacao, swipe-to-back, cold start, background/foreground e dispositivo fisico.
- **Technical Writer:** atualiza as regras de navegacao, geracao nativa e publicacao.

Referencias internas:

- `docs-mobile/README.md`
- `docs-mobile/04-navegacao-perfis-e-telas.md`
- `docs-mobile/07-execucao-ambientes-publicacao.md`
- `agents-mobile/README.md`

Referencias oficiais:

- [Expo Router - Stack](https://docs.expo.dev/router/advanced/stack/)
- [Expo - Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)
- [Apple TN3187 - Migrating to the UIKit scene-based life cycle](https://developer.apple.com/documentation/technotes/tn3187-migrating-to-the-uikit-scene-based-life-cycle)
- [Apple - UISceneDelegate](https://developer.apple.com/documentation/uikit/uiscenedelegate)

## 2. Inventario Real do Projeto

O inventario abaixo foi realizado antes de qualquer implementacao deste plano.

### 2.1 Stack e entrada do aplicativo

- Aplicativo em `artifacts/mobile`.
- Expo SDK `54.0.27`.
- React Native `0.81.5`.
- Expo Router `6.0.x`.
- Entry point: `expo-router/entry`, definido em `package.json`.
- Nao existe `index.js` proprio no projeto.
- `app/_layout.tsx` ja usa `Stack` do Expo Router.
- O Expo Router ja cria e gerencia o `NavigationContainer` internamente.
- `SafeAreaProvider` e `GestureHandlerRootView` ja envolvem a aplicacao.

### 2.2 Dependencias de navegacao

Ja instaladas diretamente:

- `react-native-gesture-handler ~2.28.0`
- `react-native-safe-area-context ~5.6.0`
- `react-native-screens ~4.16.0`

Resolvidas pelo Expo Router:

- `@react-navigation/native 7.x`
- `@react-navigation/native-stack 7.x`

Nao deve ser feita instalacao duplicada dessas dependencias sem que `npx expo install --check` identifique incompatibilidade.

### 2.3 Navegacao atual

- O root stack esta em `app/_layout.tsx`, com `headerShown: false`.
- Os grupos `(admin)` e `(comercial)` usam tabs nativas quando disponiveis e tabs classicas como fallback.
- Os fluxos `proposal`, `advertiser` e `admin` possuem stacks aninhados, tambem com header oculto.
- Existem botoes de voltar customizados em proposta, anunciante, perfil e cadastros administrativos.
- O swipe nativo pode existir no stack, mas a interface nao oferece o header padrao do iOS porque todos os headers estao ocultos.

### 2.4 Estado nativo iOS

- `app.json` usa `ios.bundleIdentifier = br.com.grupogtf.propostas`.
- `ios/` e `android/` estao ignorados pelo Git.
- Nao existe no repositorio um `.xcodeproj`, `AppDelegate`, `Info.plist` ou `SceneDelegate` versionado.
- O projeto usa Continuous Native Generation: os arquivos nativos sao gerados pelo Expo Prebuild/EAS.

Foi gerado um projeto iOS temporario, fora do repositorio, com o Expo SDK atual. O resultado encontrado foi:

- `AppDelegate.swift` estende `ExpoAppDelegate`.
- O `AppDelegate` cria `UIWindow` e inicia a factory React Native em `didFinishLaunchingWithOptions`.
- O `Info.plist` gerado nao possui `UIApplicationSceneManifest`.
- Nao foi gerado `SceneDelegate.swift`.
- Nao existe `application:configurationForConnectingSceneSession:` no template atual.

### 2.5 Push notifications

- Nao foi encontrada integracao atual com `expo-notifications` nem plugin de notificacao no `app.json`.
- Portanto, nao ha fluxo de push existente para regredir neste momento.
- Se push for adicionado antes desta implementacao, ele passa a ser item obrigatorio de regressao em dispositivo fisico.

## 3. Avaliacao de Viabilidade do PRD Recebido

### 3.1 Tarefa 1 - Navegacao nativa

**Viavel e recomendada**, mas o PRD original deve ser adaptado:

| Pedido original | Decisao para este projeto |
|---|---|
| Instalar React Navigation e native stack | Nao instalar novamente; o Expo Router ja usa o native stack e resolve essas dependencias. |
| Adicionar gesture-handler na primeira linha de `index.js` | Nao aplicavel: nao existe entry file proprio. Manter `GestureHandlerRootView` no root e seguir o entry do Expo Router. |
| Adicionar `NavigationContainer` | Nao fazer: criaria um container aninhado e poderia quebrar linking, typed routes e historico. |
| Criar `createNativeStackNavigator` manual | Nao fazer: usar `Stack` do Expo Router, que e baseado no native stack. |
| Usar seta e swipe padrao do iOS | Fazer ativando o header do native stack e removendo `headerLeft`/botoes customizados dos fluxos hierarquicos. |
| Rodar `pod install` | Apenas em development build/prebuild local; nao se aplica ao Expo Go e nao deve versionar `ios/` por acidente. |

### 3.2 Tarefa 2 - UIScene lifecycle

**Viavel e importante para release**, mas nao deve ser executada como uma edicao manual do `ios/`:

- O projeto usa CNG; uma alteracao manual em `ios/` seria descartada no proximo `prebuild --clean` ou EAS Build.
- A solucao preferencial e atualizar para uma versao do Expo cujo template oficial ja suporte `UIScene`, quando disponivel e compativel.
- Se a versao adotada ainda nao gerar `UIScene`, usar um config plugin local, versionado e testado, para aplicar as mudancas de forma reproduzivel.
- A migracao deve respeitar `ExpoAppDelegate` e `ExpoReactNativeFactory`; nao se deve copiar literalmente um `SceneDelegate` de um projeto UIKit puro.
- Expo Go nao valida essa mudanca. Sera obrigatorio um development/preview build proprio.

### 3.3 Decisao final

O PRD agrega valor e deve seguir, dividido em duas entregas independentes:

1. **Entrega A:** navegacao nativa e UX de retorno, sem mudanca de build nativo obrigatoria.
2. **Entrega B:** compatibilidade `UIScene`, com gate tecnico antes de qualquer patch nativo.

Nao misturar as duas entregas no mesmo commit. A Entrega A pode ser validada primeiro; a Entrega B exige build iOS dedicado.

## 4. Objetivos

- Usar o header e a seta nativos do iOS nos fluxos hierarquicos.
- Preservar tabs como raizes de navegacao, sem seta de voltar indevida.
- Habilitar o gesto padrao de voltar pela borda esquerda.
- Remover botoes de voltar customizados apenas nas telas cobertas pelo native stack.
- Tornar a geracao iOS compativel com o ciclo de vida `UIScene` de forma reproduzivel pelo EAS/CNG.
- Preservar autenticacao, deep links, PDF, API, temas e navegacao Android.

## 5. Fora de Escopo

- Trocar Expo Router por React Navigation configurado manualmente.
- Adicionar um segundo `NavigationContainer`.
- Criar um `index.js` somente para importar gesture-handler.
- Alterar identidade visual, tab bar, regras de negocio, API ou banco.
- Implementar push notifications.
- Versionar toda a pasta `ios/` sem uma decisao arquitetural separada.
- Forcar texto de back em telas onde o iOS o reduz por falta de espaco.

## 6. Entrega A - Navegacao Nativa com Expo Router

### Fase A1 - Mapear hierarquia e contratos de retorno

1. Registrar a origem e o destino de cada `router.push`, `router.navigate`, `router.replace` e link.
2. Separar as rotas em:
   - raizes de tabs: sem botao de voltar;
   - detalhes/edicao: header nativo e swipe;
   - autenticacao: header proprio apenas quando necessario;
   - modais: fechamento conforme semantica de modal, nao back de stack.
3. Confirmar que rotas abertas por deep link possuem fallback seguro quando nao ha historico.
4. Definir titulos curtos para a tela atual e para a tela anterior.

Fluxos prioritarios:

- Propostas -> Nova Proposta.
- Propostas -> Detalhe/Editor da Proposta.
- Clientes/Leads -> Novo registro.
- Clientes/Leads -> Detalhe do registro.
- Menu Admin -> Usuarios -> Usuario.
- Menu Admin -> Empresas -> Empresa.
- Menu Admin -> Produtos, Programas, Tipos, Duracoes e Origens.
- Menu -> Meu Perfil.

### Fase A2 - Centralizar opcoes do native stack

Criar:

- `artifacts/mobile/src/navigation/nativeStackTheme.ts`
- `artifacts/mobile/src/navigation/nativeStackTheme.test.ts`

Responsabilidades:

- usar cores do tema atual;
- `headerBackButtonDisplayMode: 'default'` no iOS;
- `gestureEnabled: true`;
- manter `fullScreenGestureEnabled: false` para preservar o gesto nativo da borda;
- nao fornecer `headerLeft` customizado;
- definir header opaco/translucido conforme o layout real, sem sobrepor conteudo;
- oferecer opcoes equivalentes e legiveis no Android.

Teste inicial:

- garantir que a politica nao substitui o back nativo;
- garantir gesto habilitado no iOS;
- garantir que tela raiz possa ocultar header sem alterar os detalhes.

### Fase A3 - Configurar os stacks por fluxo

Arquivos principais:

- `artifacts/mobile/app/_layout.tsx`
- `artifacts/mobile/app/proposal/_layout.tsx`
- `artifacts/mobile/app/advertiser/_layout.tsx`
- `artifacts/mobile/app/admin/_layout.tsx`
- `artifacts/mobile/app/admin/users/_layout.tsx`
- `artifacts/mobile/app/admin/stations/_layout.tsx`
- `artifacts/mobile/app/(public)/_layout.tsx`

Passos:

1. Manter `(admin)` e `(comercial)` como raizes com header oculto.
2. Configurar `proposal`, `advertiser` e `admin` como rotas empilhadas no root native stack.
3. Evitar duplo header em stacks aninhados.
4. Definir no nivel que realmente possui o historico:
   - `headerShown: true` para detalhe/criacao;
   - titulo da rota;
   - texto anterior quando suportado;
   - animacao padrao do sistema;
   - gesto habilitado.
5. Se um stack aninhado impedir o back nativo na primeira tela, mover a responsabilidade do header ao stack pai; nao adicionar um botao customizado como atalho.
6. Preservar redirects de ADMIN/COMERCIAL existentes nos layouts protegidos.

### Fase A4 - Remover controles redundantes das telas

Revisar, no minimo:

- `artifacts/mobile/app/proposal/new.tsx`
- `artifacts/mobile/app/proposal/[id].tsx`
- `artifacts/mobile/app/advertiser/[id].tsx`
- `artifacts/mobile/app/(comercial)/profile.tsx`
- `artifacts/mobile/app/admin/users/index.tsx`
- `artifacts/mobile/app/admin/users/[id].tsx`
- `artifacts/mobile/app/admin/stations/index.tsx`
- `artifacts/mobile/app/admin/stations/[id].tsx`
- `artifacts/mobile/app/admin/product-durations/index.tsx`
- `artifacts/mobile/app/admin/proposal-templates/index.tsx`
- `artifacts/mobile/src/features/admin/catalog/CatalogListScreen.tsx`
- `artifacts/mobile/src/features/auth/AuthScaffold.tsx`

Regras:

- remover seta customizada quando o header nativo estiver ativo;
- manter acoes de cancelar/fechar quando representam descarte de formulario, nao simples navegacao;
- manter botoes `Voltar` de estados de erro apenas como fallback de recuperacao;
- quando nao houver historico, redirecionar para a raiz correta por perfil, sem tela vazia;
- nao alterar props publicas de componentes compartilhados sem camada de compatibilidade.

### Fase A5 - Compatibilidade de props

Componentes que substituirem headers ou scaffolds antigos devem aceitar temporariamente as props existentes (`onBack`, `title`, `subtitle`, `rightAction`) e traduzi-las para a nova configuracao.

Regras:

- nao quebrar chamadas existentes em um unico commit;
- marcar props obsoletas com `@deprecated`;
- remover a compatibilidade apenas em plano posterior, depois de zerar os usos;
- adicionar testes para fallback de `onBack` somente quando nao houver native back disponivel.

## 7. Entrega B - UIScene Reproduzivel no Expo/CNG

### Gate B0 - Atualizar a decisao com o toolchain real

Antes de alterar qualquer arquivo:

1. Registrar versoes efetivas de Expo, React Native, Xcode e iOS SDK.
2. Executar `pnpm exec expo-doctor`.
3. Executar `pnpm exec expo install --check`.
4. Gerar iOS em diretorio temporario ou worktree descartavel com `expo prebuild --platform ios --no-install`.
5. Verificar no resultado:
   - `UIApplicationSceneManifest`;
   - `SceneDelegate`;
   - `configurationForConnecting`;
   - local em que `ExpoReactNativeFactory` cria a window/root view.
6. Verificar release notes do Expo SDK adotado para suporte oficial ao `UIScene`.

Decisao:

- **Se o template oficial ja suportar UIScene:** atualizar Expo/RN pelo guia oficial e nao criar plugin proprio.
- **Se o template nao suportar:** seguir Fase B1 com config plugin, desde que o spike compile.
- **Se ExpoAppDelegate ainda for incompativel:** bloquear a publicacao com SDK que exija UIScene e abrir tarefa de upgrade; nao aplicar patch fragil.

### Fase B1 - Config plugin local, somente se necessario

Arquivos previstos:

- `artifacts/mobile/plugins/withIosSceneLifecycle.js`
- `artifacts/mobile/plugins/__tests__/withIosSceneLifecycle.test.js`
- `artifacts/mobile/app.json`

O plugin deve ser idempotente e:

1. Adicionar ao `Info.plist`:
   - `UIApplicationSceneManifest`;
   - `UIApplicationSupportsMultipleScenes = false`;
   - configuracao `UIWindowSceneSessionRoleApplication`;
   - `UISceneConfigurationName = Default Configuration`;
   - classe do delegate gerado.
2. Criar `SceneDelegate.swift` dentro do target iOS.
3. Adicionar o arquivo ao target no `.xcodeproj` gerado.
4. Transferir a criacao de `UIWindow`/root React Native do `AppDelegate` para `scene(_:willConnectTo:options:)`, usando as APIs Expo da versao instalada.
5. Adicionar `application(_:configurationForConnecting:options:)` ao `AppDelegate`.
6. Manter linking, universal links e futuros callbacks de notificacao no `AppDelegate`.
7. Nao duplicar window, factory ou root view quando o plugin roda mais de uma vez.

### Fase B2 - Testes do plugin e do projeto gerado

1. Testar transformacao do plist em fixture.
2. Testar idempotencia: duas execucoes geram o mesmo resultado.
3. Gerar o projeto duas vezes com `prebuild --clean` e comparar os artefatos relevantes.
4. Confirmar que `SceneDelegate.swift` pertence ao target correto.
5. Confirmar que existe apenas uma origem para a window principal.
6. Rodar `pod install` apenas dentro do projeto gerado.
7. Compilar Debug e Release no simulador.

## 8. Estrategia de Testes

### 8.1 Automatizados

```bash
cd artifacts/mobile
pnpm run typecheck
pnpm test -- --runInBand
pnpm exec expo-doctor
pnpm exec expo install --check
```

Adicionar testes para:

- politica compartilhada do native stack;
- compatibilidade temporaria de props;
- fallback sem historico;
- config plugin/idempotencia, se a Fase B1 for necessaria.

### 8.2 Expo Go - somente Entrega A

Validar:

- navegacao visual entre lista e detalhe;
- ausencia de dois headers;
- ausencia de dois botoes de voltar;
- Android continua com retorno coerente;
- rotas publicas e redirects de permissao continuam funcionando.

Expo Go nao valida `AppDelegate`, `Info.plist`, `SceneDelegate` ou comportamento de cold start nativo.

### 8.3 Development/preview build iOS

Obrigatorio para as Entregas A e B juntas:

- abrir pelo icone com app encerrado;
- login e restauracao de sessao;
- voltar por seta nativa;
- voltar por swipe da borda esquerda;
- cancelar um swipe parcial sem corromper a tela;
- abrir proposta por deep link;
- ir para background e retornar;
- encerrar e reabrir;
- tema claro e escuro;
- simulador em versao minima suportada e versao mais recente.

### 8.4 Dispositivo fisico

Obrigatorio antes de aceitar a Entrega B:

- instalar build de preview;
- validar cold start e warm start;
- validar scene connect/disconnect ao bloquear e desbloquear;
- validar linking com app fechado e em segundo plano;
- validar login, logout, PDF e compartilhamento;
- validar que nao existe crash ou tela branca;
- se notificacoes existirem nessa data, validar token e recebimento real.

## 9. Criterios de Aceite

### Navegacao

- [ ] O aplicativo continua usando Expo Router, sem `NavigationContainer` manual.
- [ ] Nenhuma dependencia de navegacao e duplicada fora da matriz do Expo SDK.
- [ ] Tabs raiz nao exibem seta de voltar.
- [ ] Detalhes e formularios empilhados exibem chevron nativo do iOS.
- [ ] O iOS exibe o titulo anterior quando houver espaco, usando o comportamento padrao.
- [ ] Swipe pela borda esquerda retorna para a tela anterior.
- [ ] Nenhuma tela mostra simultaneamente seta nativa e seta customizada.
- [ ] Deep links sem historico possuem destino de retorno seguro.
- [ ] Android e web continuam navegaveis.

### UIScene

- [ ] O iOS gerado contem `UIApplicationSceneManifest` valido.
- [ ] Existe delegate de scene associado ao target, quando exigido pelo template/toolchain.
- [ ] O `AppDelegate` fornece a configuracao da nova scene.
- [ ] A window/root React Native e criada uma unica vez.
- [ ] A configuracao sobrevive a `expo prebuild --clean` e ao EAS Build.
- [ ] Debug e Release compilam.
- [ ] O app abre no simulador e em dispositivo fisico.
- [ ] Linking e callbacks mantidos no AppDelegate continuam funcionando.

## 10. Riscos e Mitigacoes

| Risco | Mitigacao |
|---|---|
| Duplicar `NavigationContainer` e quebrar Expo Router | Proibir container manual; usar somente `Stack` do Expo Router. |
| Stack aninhado nao possuir historico para mostrar back | Configurar o header no stack pai que recebeu o push e testar cada fluxo. |
| Duplo header | Definir um unico owner do header por fluxo. |
| Botao customizado removido antes do native back funcionar | Migrar rota por rota, com teste antes da remocao. |
| Edicao manual do `ios/` sumir no EAS | Usar template oficial ou config plugin versionado. |
| Plugin quebrar `ExpoAppDelegate` | Gate B0, fixture, prebuild limpo, Debug/Release e dispositivo fisico. |
| Expo Go dar falsa seguranca sobre UIScene | Exigir development/preview build. |
| Upgrade do Expo afetar outras libs | Fazer upgrade em branch propria e executar expo-doctor, testes e QA completo. |
| Push futuro regredir | Manter callbacks de notificacao no AppDelegate e adicionar teste quando a feature existir. |

## 11. Arquivos Afetados Previstos

### Entrega A

- `artifacts/mobile/app/_layout.tsx`
- `artifacts/mobile/app/(public)/_layout.tsx`
- `artifacts/mobile/app/proposal/_layout.tsx`
- `artifacts/mobile/app/advertiser/_layout.tsx`
- `artifacts/mobile/app/admin/_layout.tsx`
- `artifacts/mobile/app/admin/users/_layout.tsx`
- `artifacts/mobile/app/admin/stations/_layout.tsx`
- telas listadas na Fase A4
- `artifacts/mobile/src/navigation/nativeStackTheme.ts`
- `artifacts/mobile/src/navigation/nativeStackTheme.test.ts`

### Entrega B, condicionada ao Gate B0

- `artifacts/mobile/app.json`
- `artifacts/mobile/package.json`, apenas se houver upgrade oficial
- `artifacts/mobile/plugins/withIosSceneLifecycle.js`, apenas se o plugin for necessario
- testes/fixtures do plugin
- `pnpm-lock.yaml`, apenas se dependencias mudarem

Nao incluir `artifacts/mobile/ios/` no commit sem uma decisao explicita de abandonar CNG.

## 12. Documentacao a Atualizar Depois da Implementacao

- `docs-mobile/04-navegacao-perfis-e-telas.md`
  - ownership dos stacks;
  - regra de back nativo;
  - fallback de deep links.
- `docs-mobile/07-execucao-ambientes-publicacao.md`
  - diferenca entre Expo Go e development build;
  - auditoria `UIScene`;
  - comandos de prebuild, pods, build e dispositivo fisico.
- `docs-mobile/09-convencoes-codigo-testes-e-git.md`
  - proibicao de `NavigationContainer` adicional;
  - regra para config plugins e arquivos nativos gerados.

## 13. Ordem de Implementacao Recomendada

1. Implementar e homologar a Entrega A em commit proprio.
2. Criar build de desenvolvimento e validar navegacao nativa no iPhone.
3. Executar Gate B0 em branch separada.
4. Priorizar upgrade oficial do Expo/template.
5. Criar config plugin apenas se o suporte oficial ainda nao estiver disponivel.
6. Validar Entrega B em simulador e dispositivo fisico.
7. Somente depois promover para preview/production iOS.

## 14. Checklist de Implementacao

### Inventario e decisoes

- [x] Stack, entry point e providers inventariados.
- [x] Dependencias de navegacao conferidas.
- [x] Ausencia de projeto iOS versionado confirmada.
- [x] Projeto iOS temporario gerado e auditado.
- [x] Ausencia atual de UIScene confirmada no template Expo SDK 54.
- [x] PRD adaptado para Expo Router/CNG.

### Entrega A

- [ ] Criar politica compartilhada de native stack.
- [ ] Configurar ownership dos headers por fluxo.
- [ ] Migrar proposta e anunciante.
- [ ] Migrar perfil e administracao.
- [ ] Remover controles customizados redundantes.
- [ ] Preservar compatibilidade de props.
- [ ] Validar Expo Go, Android e web.
- [ ] Validar development build no iOS.

### Entrega B

- [ ] Executar Gate B0 com toolchain da data de implementacao.
- [ ] Decidir entre upgrade oficial e config plugin.
- [ ] Implementar UIScene de forma reproduzivel.
- [ ] Validar `prebuild --clean` e idempotencia.
- [ ] Compilar Debug e Release.
- [ ] Homologar em simulador.
- [ ] Homologar em dispositivo fisico.

### Estado atual

- Planejamento concluido.
- Nenhuma alteracao funcional ou nativa foi executada.
- Proxima acao: aprovar o inicio da Entrega A; a Entrega B permanece condicionada ao Gate B0.
