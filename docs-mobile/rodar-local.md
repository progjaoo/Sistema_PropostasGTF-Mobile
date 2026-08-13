# Rodar o Aplicativo Localmente

O aplicativo mobile consome a API oficial do projeto `Sistema-Propostas`. Ele nao executa uma API ou um banco proprios. Para desenvolvimento local, a mesma API pode ser executada de duas formas:

1. API e PostgreSQL no Docker;
2. PostgreSQL no Docker e API como processo Node.js no Mac.

Nos dois modos, os comandos mobile reservam a porta `8091` para a API. Em um aparelho fisico, o aplicativo usa o IP local do Mac, por exemplo `http://192.168.1.20:8091/api`. Essa separacao evita conflito com o Metro, que normalmente usa `8081` ou `8082`.

## Regra para Testes Locais

Durante desenvolvimento e validacao no Expo Go, **nao use a API de producao** (`https://propostasmosaico-one.vercel.app/api`). O web ja esta publicado e usa a API/banco de producao; testes do aplicativo devem apontar para a API local para evitar consumo indevido, dados de teste no ambiente real e erros causados por limite/plano de hospedagem.

Fluxo recomendado:

```bash
# Terminal 1: subir API local + Postgres local pelo Docker
cd /Users/joaomvalente/Projetos/Projetos-GTF/Sistema-Propostas
pnpm run api:docker
curl http://localhost:8091/api/healthz
```

```bash
# Terminal 2: iniciar Expo Go apontando para a API local do Mac
cd /Users/joaomvalente/Projetos/Projetos-GTF/Sistema-PropostasGTF_App/artifacts/mobile
EXPO_PUBLIC_API_URL="http://$(ipconfig getifaddr en0):8091/api" pnpm exec expo start --clear --lan --port 8082
```

Se `ipconfig getifaddr en0` nao retornar nada, descubra o IP do Mac e substitua manualmente:

```bash
ipconfig getifaddr en1
ifconfig | grep "inet "
EXPO_PUBLIC_API_URL="http://SEU_IP_LOCAL:8091/api" pnpm exec expo start --clear --lan --port 8082
```

No terminal do Expo, confira sempre que a URL da API comeca com `http://` e aponta para o IP local do Mac. Se aparecer `https://propostasmosaico-one.vercel.app/api`, pare o Metro com `Ctrl+C` e suba novamente com o comando acima.

## Pre-requisitos

- Docker Desktop aberto;
- Node.js e pnpm instalados;
- Expo Go instalado no celular;
- celular e Mac conectados na mesma rede Wi-Fi;
- dependencias instaladas nos dois repositorios com `pnpm install`.

## Opcao 1: API no Docker

No primeiro terminal, suba apenas o PostgreSQL e a API do projeto web:

```bash
cd /Users/joaomvalente/Projetos/Projetos-GTF/Sistema-Propostas
pnpm run api:docker
curl http://localhost:8091/api/healthz
```

Resultado esperado:

```json
{"status":"ok"}
```

No segundo terminal, inicie o aplicativo apontando para essa API:

```bash
cd /Users/joaomvalente/Projetos/Projetos-GTF/Sistema-PropostasGTF_App/artifacts/mobile
pnpm run start:api:docker
```

O launcher detecta o IP local do Mac, valida o healthcheck e inicia o Expo limpando o cache. Leia o QR Code com o Expo Go.

Para validar somente a conexao, sem iniciar outro Metro:

```bash
node ./scripts/start-local-api.mjs docker --check
```

## Opcao 2: API fora do Docker

Neste modo, somente o PostgreSQL fica no Docker. A API roda como processo Node.js e reflete um novo build a cada reinicializacao do comando.

No primeiro terminal, prepare o banco local:

```bash
cd /Users/joaomvalente/Projetos/Projetos-GTF/Sistema-Propostas
pnpm run db:local:up
pnpm run db:local:prepare
```

Depois, mantenha a API em execucao:

```bash
pnpm run api:local
```

Em outro terminal, valide:

```bash
curl http://localhost:8091/api/healthz
```

Por fim, inicie o aplicativo:

```bash
cd /Users/joaomvalente/Projetos/Projetos-GTF/Sistema-PropostasGTF_App/artifacts/mobile
pnpm run start:api:host
```

Para validar somente a conexao com a API executada no host:

```bash
node ./scripts/start-local-api.mjs host --check
```

Ao alterar o backend, interrompa `pnpm run api:local` com `Ctrl+C` e execute-o novamente. O script atual da API compila antes de iniciar, mas nao fica observando os arquivos.

## Simulador iOS ou Android

No simulador executado no mesmo Mac, e possivel forcar `localhost`:

```bash
LOCAL_API_HOST=localhost pnpm run start:api:docker
```

ou:

```bash
LOCAL_API_HOST=localhost pnpm run start:api:host
```

Para aparelho fisico, nao use `localhost`: nesse caso ele aponta para o proprio celular. Deixe o launcher detectar o IP ou informe-o manualmente:

```bash
LOCAL_API_HOST=192.168.1.20 pnpm run start:api:docker
```

## Porta diferente

Se a porta `8091` estiver ocupada, publique ou inicie a API em outra porta e informe a mesma porta ao mobile.

Docker:

```bash
cd /Users/joaomvalente/Projetos/Projetos-GTF/Sistema-Propostas
API_HOST_PORT=8092 docker compose up -d --build postgres api

cd /Users/joaomvalente/Projetos/Projetos-GTF/Sistema-PropostasGTF_App/artifacts/mobile
LOCAL_API_PORT=8092 pnpm run start:api:docker
```

API fora do Docker:

```bash
cd /Users/joaomvalente/Projetos/Projetos-GTF/Sistema-Propostas
PORT=8092 DATABASE_URL='postgresql://propostas:propostas@localhost:5433/propostas?schema=public' pnpm --filter @workspace/api-server run dev

cd /Users/joaomvalente/Projetos/Projetos-GTF/Sistema-PropostasGTF_App/artifacts/mobile
LOCAL_API_PORT=8092 pnpm run start:api:host
```

## URL explicita e API publicada

Para ignorar a deteccao automatica, defina a URL completa:

```bash
EXPO_PUBLIC_API_URL=https://seu-dominio-de-api.com/api pnpm exec expo start -c
```

O app possui um fallback para a API publicada quando `EXPO_PUBLIC_API_URL` nao e definida. Em desenvolvimento, prefira sempre os scripts acima: eles deixam claro qual ambiente esta sendo usado e falham cedo quando a API esta indisponivel.

Variaveis `EXPO_PUBLIC_*` ficam visiveis no bundle do aplicativo. Nunca coloque `DATABASE_URL`, chaves Resend, segredos JWT ou qualquer credencial nelas.

## Diagnostico rapido

Verifique nesta ordem:

```bash
curl http://localhost:8091/api/healthz
docker compose -f /Users/joaomvalente/Projetos/Projetos-GTF/Sistema-Propostas/docker-compose.yml ps
```

Se o healthcheck funciona no Mac, mas nao no celular:

- confirme que ambos estao na mesma rede;
- desative temporariamente VPN ou rede corporativa isolada;
- confirme que o firewall do macOS permite conexoes do Node/Docker;
- confirme no terminal do Expo qual `API selecionada` foi exibida;
- reinicie o Metro depois de alterar qualquer `EXPO_PUBLIC_*`.

Importante: nos scripts mobile, `8091` e a porta da API. O Metro continua livre para usar `8081` ou `8082`; a porta exibida no QR Code e do Metro e nao deve ser usada como URL da API.

## Encerrar

Interrompa Expo/API Node com `Ctrl+C`. Para encerrar os containers locais sem apagar o banco:

```bash
cd /Users/joaomvalente/Projetos/Projetos-GTF/Sistema-Propostas
docker compose stop api frontend postgres
```

Nao use `docker compose down -v`, pois `-v` remove o volume do PostgreSQL local.
