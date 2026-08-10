# API e Banco Compartilhados

## Regra Arquitetural

Existe apenas:

- **uma API:** `Sistema-Propostas/artifacts/api-server`;
- **um schema Prisma:** `Sistema-Propostas/lib/db/prisma/schema.prisma`;
- **um histórico de migrations:** `Sistema-Propostas/lib/db/prisma/migrations`;
- **um banco PostgreSQL por ambiente**;
- **um contrato de endpoints** consumido pelo sistema web e pelo aplicativo mobile.

O aplicativo mobile nunca acessa o PostgreSQL diretamente. Ele envia requisições HTTP para a mesma API utilizada pelo frontend web.

## Fluxo Oficial

```text
                         ┌──────────────────────────┐
                         │ PostgreSQL               │
                         │ dados únicos por ambiente│
                         └────────────▲─────────────┘
                                      │ Prisma
                         ┌────────────┴─────────────┐
                         │ API Node.js/Express      │
                         │ /api/*                   │
                         └──────▲───────────▲───────┘
                                │           │
                   HTTP/JSON    │           │ HTTP/JSON
                                │           │
                 ┌──────────────┘           └──────────────┐
                 │                                         │
    ┌────────────┴────────────┐              ┌─────────────┴────────────┐
    │ Sistema web             │              │ Aplicativo mobile        │
    │ React/Vite              │              │ React Native/Expo        │
    └─────────────────────────┘              └──────────────────────────┘
```

## Docker Local do Projeto Principal

O `docker-compose.yml` de `Sistema-Propostas` contém:

| Serviço | Rede Docker | Acesso pelo host |
|---|---|---|
| PostgreSQL | `postgres:5432` | `localhost:5433` |
| API | `api:8080` | `localhost:8081` por padrão |
| Frontend web | `frontend:21709` | `localhost:21709` |

O frontend web chama caminhos relativos `/api`. O Vite encaminha essas chamadas internamente para `http://api:8080`.

O aplicativo mobile está fora da rede interna do Compose. Portanto, ele deve chamar a API por um endereço visível para o dispositivo:

| Execução do mobile | Base URL esperada |
|---|---|
| Simulador no mesmo Mac | `http://localhost:8081/api` |
| Aparelho físico na rede local | `http://<IP-DO-MAC>:8081/api` |
| Homologação | `https://<dominio-homologacao>/api` |
| Produção | `https://<dominio-oficial>/api` |

## Estado Atual que Exige Ajuste

O cliente mobile usa atualmente:

```text
EXPO_PUBLIC_DOMAIN definido -> https://<dominio>/api
sem variável                -> http://localhost:8080/api
```

O fallback `localhost:8080` não corresponde à porta padrão exposta pelo Compose (`8081`). Até o cliente ser corrigido:

- configure `EXPO_PUBLIC_DOMAIN` para um domínio HTTPS acessível; ou
- ajuste o ambiente local para alcançar a API pela porta publicada correta.

A evolução recomendada é aceitar uma variável explícita:

```env
EXPO_PUBLIC_API_URL=http://localhost:8081/api
```

Essa variável contém somente endereço público, nunca segredo.

## Migrations

O projeto principal já possui migrations versionadas em `Sistema-Propostas/lib/db/prisma/migrations`.

Entretanto, o Compose de desenvolvimento executa atualmente:

```text
prisma generate
prisma db push
seed
API
```

`db push` sincroniza o schema, mas não executa o histórico de migrations como uma implantação controlada. Para produção, o fluxo deve ser:

```text
prisma generate
prisma migrate deploy
API
```

O seed não deve ser executado automaticamente em produção sem uma decisão explícita.

## Cópia Presente no Repositório Mobile

O repositório `Sistema-PropostasGTF_App` contém cópias de `artifacts/api-server`, `lib/db` e outros módulos porque foi gerado com contexto do sistema existente.

Essas cópias:

- não representam uma segunda API;
- não devem apontar para outro PostgreSQL;
- não devem receber migrations independentes;
- não devem ser publicadas separadamente como backend do aplicativo;
- devem ser substituídas por integração com a API oficial ou mantidas sincronizadas apenas enquanto forem necessárias ao ambiente do Replit.

Toda mudança de endpoint ou banco deve nascer no projeto principal `Sistema-Propostas` e depois ser consumida pelo mobile.

## Regra de Compatibilidade

Uma mudança de API só está concluída quando:

1. schema e migration foram atualizados no projeto principal, quando aplicável;
2. API oficial foi atualizada;
3. contrato OpenAPI foi atualizado;
4. sistema web continuou funcional;
5. aplicativo mobile foi adaptado;
6. os dois clientes foram validados contra a mesma API e o mesmo banco do ambiente.

