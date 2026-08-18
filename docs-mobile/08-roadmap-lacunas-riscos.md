# Roadmap, Lacunas e Riscos

## Prioridade Imediata

Homologar o plano mobile 002 em aparelhos iOS e Android, com os dois perfis, rede lenta/offline, sessão expirada, deep link de senha e propostas com diferentes quantidades de produtos.

## Lacunas Funcionais

### Críticas

- Completar no OpenAPI os endpoints operacionais mais novos, mesmo já existentes na API.
- Homologar PDF e compartilhamento no iOS e Android.
- Validar builds EAS preview depois de autenticar a conta Expo.
- Ampliar testes de integração do cliente HTTP, formulários e permissões.
- Validar upload de avatar/logo em aparelho antes de incluí-lo no fluxo principal.

### Plataforma

- Configuração EAS.
- IDs de pacote.
- ambientes explícitos.
- testes automatizados.
- observabilidade e captura de falhas.
- política de atualização OTA.

## Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Contrato manual divergir da API | Erros em runtime | Atualizar OpenAPI e gerar tipos |
| `localhost` em aparelho físico | App sem conexão | URL explícita por ambiente |
| CRUDs administrativos compactos | Campos avançados podem exigir web | Manter operação essencial no app e evoluir formulários por uso real |
| Paridade visual confundida com cópia do web | Interface ruim no toque | Preservar regras, adaptando navegação e densidade |
| Tokens em logs ou armazenamento inadequado | Incidente de segurança | SecureStore, revisão e sanitização |
| Dependências de workspace ao mover repositório | Build quebrado | Inventariar e empacotar dependências |
| Sem testes de dispositivo | Regressões específicas de plataforma | Matriz iOS/Android e aparelhos reais |

## Ordem Recomendada

1. Homologação em aparelhos e correção de regressões.
2. Completar OpenAPI e ampliar testes de integração.
3. Build EAS preview e distribuição interna.
4. Upload de imagens e observabilidade.
5. Preparação de publicação nas lojas.

## Estado após a Entrega 1

As lacunas funcionais ADMIN dos planos 033 e 034 foram implementadas no aplicativo: ciclo de Empresa, catálogo condicionado por `usesPrograms`, board por Empresa, autosave/flush, ações destrutivas seguras, perfil comercial de usuários e Contratos ADMIN. A exportação Expo para iOS/Android foi concluída em `/tmp/gtf-propostas-admin-parity`; permanecem como homologação a validação em aparelhos reais e a confirmação de comportamento contra a API oficial em ambiente integrado.

## Estado após a Entrega 2

Os fluxos COMERCIAL de navegação, ownership, conversão, desativação, catálogo autorizado, editor com valores por item, exclusão própria e Meus Contratos foram implementados. A exportação Expo da Entrega 2 e a homologação com dois vendedores em iOS/Android permanecem como próximos gates.
