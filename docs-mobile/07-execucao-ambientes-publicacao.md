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

A API oficial pode rodar no Docker ou como processo Node.js no host. Os comandos completos e o fluxo para Expo Go estao em [rodar-local.md](rodar-local.md).

Para subir API e PostgreSQL pelo Compose do projeto principal:

```bash
cd ../Sistema-Propostas
pnpm run api:docker
```

Por padrão:

- sistema web: `http://localhost:21709`;
- API para o fluxo mobile local: `http://localhost:8091/api`;
- PostgreSQL para processos no host: `localhost:5433`;
- API dentro da rede Docker: `http://api:8080`.

Para rodar a API fora do Docker, mantenha apenas o PostgreSQL no Compose:

```bash
cd ../Sistema-Propostas
pnpm run db:local:up
pnpm run db:local:prepare
pnpm run api:local
```

O fallback do cliente e a API publicada. Em desenvolvimento local, use os scripts explicitos; eles detectam o IP do Mac e validam a API antes de iniciar o Expo:

```bash
cd artifacts/mobile
pnpm run start:api:docker
# ou
pnpm run start:api:host
```

Em aparelho fisico, `localhost` aponta para o celular, nao para o Mac. A URL deve usar o IP da rede local do computador. Em producao, usar sempre o dominio HTTPS oficial da API.

## Validação

```bash
pnpm --filter @workspace/mobile run typecheck
pnpm --filter @workspace/mobile test -- src/features/proposals/print --runInBand
```

Verificar a saúde da API oficial no projeto principal. O aplicativo não deve subir uma segunda API.

### Validar PDF no iOS e Android

Durante QA, use a API local e gere a mesma proposta no web e no aplicativo. Cubra 0, 1, 2, 4, 5, 12 e 20 produtos, com e sem Apresentação, período e logo.

Após compartilhar o arquivo para o Mac, valide dimensões e renderização:

```bash
mkdir -p tmp/pdfs
pdfinfo tmp/pdfs/proposta-mobile.pdf
pdftoppm -png tmp/pdfs/proposta-mobile.pdf tmp/pdfs/proposta-mobile
```

O `pdfinfo` deve indicar aproximadamente `595 x 842 pts`. Inspecione todas as imagens e confirme:

- nenhum card cortado ou sobreposto;
- nenhuma folha vazia;
- fundo da Empresa atrás do logo;
- Hero e indicadores somente na primeira folha;
- investimento e contato juntos na última folha;
- cor da Empresa preservada, sem herdar o laranja Mosaico;
- mesma empresa, cliente, produtos, vendedor e valores do PDF web.

Arquivos de QA permanecem em `tmp/pdfs/` e não devem ser versionados.

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

## Deep Link de Recuperação

O `app.json` declara o scheme `gtfpropostas`. Mudanças nesse campo exigem novo build nativo. O aceite final não deve usar o Expo Go, pois sua URI é dinâmica; use development build ou build de homologação.

```bash
pnpm exec uri-scheme open 'gtfpropostas://reset-password?token=token-de-teste-com-mais-de-vinte-caracteres' --ios
pnpm exec uri-scheme open 'gtfpropostas://reset-password?token=token-de-teste-com-mais-de-vinte-caracteres' --android
```

Teste com o app fechado e em segundo plano. Confirme que a rota de redefinição abre, que token inválido oferece `Solicitar novo link` e que nenhuma URL ou token aparece em logs. O app precisa somente de `EXPO_PUBLIC_API_URL`; todas as variáveis Resend permanecem no backend/Vercel.

## Observação sobre Docker

O aplicativo Expo não precisa ser reconstruído pelo Docker para refletir mudanças durante desenvolvimento. O Docker do projeto principal permanece responsável pela API única e pelo PostgreSQL único. O app é atualizado pelo Metro bundler e apenas consome a porta/domínio publicado pela API.
