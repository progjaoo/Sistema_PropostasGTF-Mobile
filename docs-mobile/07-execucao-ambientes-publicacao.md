# Execução Local, Ambientes e Publicação

## Pré-requisitos

- Node.js compatível com Expo SDK 54
- pnpm
- Xcode para simulador iOS
- Android Studio para emulador Android
- API e PostgreSQL disponíveis
- Dispositivo e computador na mesma rede, quando aplicável

## Instalação

Na raiz do repositório:

```bash
pnpm install
```

## Executar o Aplicativo

O script atual do pacote mobile foi preparado para o ambiente do Replit:

```bash
pnpm --filter @workspace/mobile run dev
```

Para desenvolvimento local, pode ser necessário executar o Expo diretamente no diretório do app:

```bash
cd artifacts/mobile
pnpm exec expo start
```

Depois, escolher:

- `i` para simulador iOS;
- `a` para emulador Android;
- leitura do QR Code para aparelho físico.

## API Local Compartilhada

Suba API e PostgreSQL pelo Compose do projeto principal:

```bash
cd ../Sistema-Propostas
docker compose up -d --build
```

Por padrão:

- sistema web: `http://localhost:21709`;
- API para processos no host: `http://localhost:8081/api`;
- PostgreSQL para processos no host: `localhost:5433`;
- API dentro da rede Docker: `http://api:8080`.

O cliente mobile usa `http://localhost:8081/api` como fallback local. Em aparelho físico, configurar `EXPO_PUBLIC_API_URL` com um domínio acessível ou o IP local do computador com a porta `8081`. Em produção, usar sempre o mesmo domínio HTTPS da API oficial.

Exemplo para desenvolvimento local:

```bash
EXPO_PUBLIC_API_URL=http://localhost:8081/api pnpm --filter @workspace/mobile run dev
```

## Validação

```bash
pnpm --filter @workspace/mobile run typecheck
```

Verificar a saúde da API oficial no projeto principal. O aplicativo não deve subir uma segunda API.

## Ambientes Recomendados

| Ambiente | API | Uso |
|---|---|---|
| development | local ou túnel seguro | desenvolvimento |
| preview | domínio de homologação HTTPS | QA interno |
| production | domínio oficial HTTPS | lojas |

Dados e tokens de cada ambiente devem ser isolados.

## Preparação para EAS

Antes da primeira publicação:

1. definir `ios.bundleIdentifier`;
2. definir `android.package`;
3. criar `eas.json`;
4. configurar perfis development, preview e production;
5. revisar ícones, splash e permissões;
6. criar política de privacidade;
7. configurar deep links de redefinição de senha;
8. configurar secrets no EAS;
9. validar build em dispositivos reais;
10. preparar metadados das lojas.

## Observação sobre Docker

O aplicativo Expo não precisa ser reconstruído pelo Docker para refletir mudanças durante desenvolvimento. O Docker do projeto principal permanece responsável pela API única e pelo PostgreSQL único. O app é atualizado pelo Metro bundler e apenas consome a porta/domínio publicado pela API.