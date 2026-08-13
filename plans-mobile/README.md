# Planos do Aplicativo Mobile

Esta pasta organiza exclusivamente os planos de evolução do aplicativo em `artifacts/mobile`.

## Convenção de Nome

```text
plan-mobile-NNN-nome-da-tarefa.md
```

Exemplo:

```text
plan-mobile-001-ajuste-tela-login.md
```

## Planos

| Número | Título | Estado | Arquivo |
|---|---|---|---|
| 001 | Ajuste da Tela de Login e Correções Críticas Iniciais | Implementado parcialmente; QA de dispositivo pendente | [plan-mobile-001-correcoes-iniciais-telas.md](plan-mobile-001-correcoes-iniciais-telas.md) |
| 002 | Paridade Funcional e Adaptação Nativa do GTF Propostas | Implementado em código; homologação de dispositivos pendente | [plan-mobile-002-paridade-funcional-adaptacao-nativa.md](plan-mobile-002-paridade-funcional-adaptacao-nativa.md) |
| 008 | Rebrand Mosaico no Aplicativo Mobile | Planejado | [plan-mobile-008-rebrand-mosaico-identidade-visual.md](plan-mobile-008-rebrand-mosaico-identidade-visual.md) |
| 009 | PDF A4 Mobile com Paridade ao Sistema Web | Implementado em código; homologação visual iOS/Android pendente | [plan-mobile-009-pdf-a4-paridade-web.md](plan-mobile-009-pdf-a4-paridade-web.md) |

## Três Correções Priorizadas

1. **Acesso e Tela de Login:** conectar o app à API oficial, incorporar os endpoints mobile de autenticação no backend principal e completar a recuperação de senha.
2. **Nova Proposta:** alinhar seleção, payload e pós-criação ao contrato oficial da API.
3. **Administração:** eliminar navegação quebrada e corrigir empresa/usuário com permissões por empresa.

Os demais achados da varredura estão registrados como backlog no plano 001 e serão detalhados em planos posteriores.

## Fluxo dos Planos

1. Ler `docs-mobile/README.md`.
2. Selecionar os agentes em `agents-mobile/README.md`.
3. Inspecionar o código afetado.
4. Registrar diagnóstico e escopo.
5. Definir fases, arquivos, testes e critérios de aceite.
6. Implementar somente após solicitação explícita.
7. Atualizar o plano ao final com o checklist real.

## Estrutura Obrigatória

Todo plano deve incluir:

- contexto e problema;
- agentes selecionados;
- diagnóstico do código atual;
- objetivo e fora de escopo;
- requisitos funcionais;
- requisitos técnicos e de segurança;
- arquivos afetados;
- execução passo a passo;
- estratégia de testes;
- critérios de aceite;
- riscos e mitigação;
- documentação a atualizar;
- checklist final de implementação.

## Estados

- **Reservado:** número e título definidos, sem plano criado.
- **Planejado:** arquivo detalhado criado.
- **Em implementação:** trabalho iniciado.
- **Implementado:** código concluído e validado.
- **Bloqueado:** depende de decisão ou recurso externo.

## Regra de Checklist Final

Depois da implementação, acrescentar ao fim do plano:

```markdown
## Checklist da Implementação

- [x] Item entregue
- [ ] Item pendente

### Validações Executadas

- comando ou cenário validado

### Pendências e Riscos Residuais

- pendência objetiva, ou "Nenhuma conhecida"
```
