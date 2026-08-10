# Agentes do Aplicativo Mobile

Esta pasta define os papéis especializados para evolução do aplicativo React Native/Expo. Ela refina o material copiado em `.agents`, que continua válido para backend, banco, sistema web e funções compartilhadas.

## Como Escolher

| Agente | Usar quando |
|---|---|
| [Product Manager Mobile](agent-mobile-product-manager.md) | Definir jornada, escopo, regras e critérios de aceite |
| [Arquiteto Mobile](agent-mobile-software-architect.md) | Alterar arquitetura, navegação, estado, integração ou estratégia offline |
| [Engenheiro React Native/Expo](agent-react-native-expo-engineer.md) | Implementar telas, componentes, rotas e comportamento nativo |
| [Engenheiro de Integração Mobile](agent-mobile-api-integration-engineer.md) | Integrar endpoints, autenticação, cache e contratos |
| [Designer UX/UI Mobile](agent-mobile-ux-ui-designer.md) | Revisar ergonomia, visual, acessibilidade e interação |
| [Engenheiro de Segurança Mobile](agent-mobile-security-engineer.md) | Revisar tokens, deep links, dados pessoais e armazenamento |
| [QA Mobile](agent-mobile-qa-engineer.md) | Criar cenários e validar iOS, Android, rede e perfis |
| [DevOps e Release Mobile](agent-mobile-devops-release-engineer.md) | Configurar EAS, ambientes, builds e publicação |
| [Technical Writer Mobile](agent-mobile-technical-writer.md) | Atualizar documentação, guias e checklists |

## Composição Recomendada

### Ajuste visual simples

- React Native/Expo Engineer
- UX/UI Mobile
- QA Mobile

### Novo fluxo com API

- Product Manager Mobile
- Arquiteto Mobile
- React Native/Expo Engineer
- Mobile API Integration Engineer
- QA Mobile

### Autenticação ou recuperação de senha

- Arquiteto Mobile
- Mobile API Integration Engineer
- Mobile Security Engineer
- React Native/Expo Engineer
- QA Mobile

### Publicação

- DevOps e Release Mobile
- Mobile Security Engineer
- QA Mobile
- Technical Writer Mobile

## Referências Obrigatórias

Antes de atuar:

1. ler `docs-mobile/README.md`;
2. ler o documento específico da área;
3. inspecionar o código atual;
4. consultar `docs` e `.agents` quando houver alteração compartilhada;
5. seguir o plano correspondente em `plans-mobile`.

## Regra de Escopo

Agentes mobile não alteram API, schema ou sistema web silenciosamente. Quando uma mudança transversal for necessária, devem chamar também os papéis compartilhados adequados em `.agents` e registrar o impacto.

