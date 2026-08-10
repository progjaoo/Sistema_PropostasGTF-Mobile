# Stack e Configuração

## Stack do Aplicativo

| Camada | Tecnologia |
|---|---|
| Runtime | Expo SDK 54 |
| Interface nativa | React Native 0.81 |
| React | React 19 |
| Linguagem | TypeScript |
| Navegação | Expo Router |
| Estado de servidor | TanStack Query |
| Estado de autenticação | Zustand |
| Armazenamento seguro | Expo SecureStore |
| Cache local | AsyncStorage |
| Imagens | Expo Image e Expo Image Picker |
| Formulários/teclado | React Native Keyboard Controller |
| Tipografia | Inter via Expo Google Fonts |
| API | A API REST oficial do projeto `Sistema-Propostas` |

O aplicativo está com a nova arquitetura do React Native habilitada em `app.json`.

## Identidade do Aplicativo

- Scheme atual: `gtfpropostas`
- Nome exibido: GTF Propostas
- Marca: Sistema Comercial GTF
- Assets de marca: `artifacts/mobile/assets/brand`

## Configuração de Ambiente

A URL da API é atualmente resolvida em `artifacts/mobile/src/api/client.ts`.

Comportamento atual:

1. Se `EXPO_PUBLIC_API_URL` estiver definido, usa esse valor como URL completa da API.
2. Se `EXPO_PUBLIC_DOMAIN` estiver definido, usa `https://<domínio>/api`.
3. Caso contrário, usa `http://localhost:8081/api`, alinhado ao Compose oficial do projeto principal.

Exemplos:

```env
# Simulador iOS/Android rodando no mesmo Mac
EXPO_PUBLIC_API_URL=http://localhost:8081/api

# Aparelho físico na mesma rede do Mac
EXPO_PUBLIC_API_URL=http://192.168.0.10:8081/api

# Produção
EXPO_PUBLIC_API_URL=https://propostas.grupogtf.com.br/api
```

Em aparelho físico, `localhost` aponta para o próprio aparelho. Use o IP local do computador ou um domínio/túnel HTTPS.

## Configurações Ainda Ausentes

- `ios.bundleIdentifier`
- `android.package`
- `eas.json`
- perfis de build development, preview e production
- política explícita de versionamento nativo
- configuração de atualização OTA
- arquivos locais da fonte para operação totalmente offline

## Dependências Compartilhadas

O `tsconfig.json` referencia bibliotecas copiadas do monorepo, incluindo o cliente de API React. Porém, em runtime, o aplicativo deve chamar somente a API implantada pelo projeto principal. Os endpoints mobile de autenticação são consumidos por um cliente manual e estão documentados no OpenAPI oficial.

Antes de separar o aplicativo em outro repositório, é necessário identificar e empacotar toda dependência de workspace usada por `artifacts/mobile`.
