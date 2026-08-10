---
name: Mobile auth endpoints
description: Mobile-specific auth routes added to the API server that return tokens in JSON body instead of cookies
---

# Mobile Auth Endpoints

## Rule
The API server has three mobile-specific auth endpoints at `/api/auth/mobile/*` that exchange tokens in the JSON body instead of using httpOnly cookies (cookies don't work in React Native).

**Why:** React Native cannot read httpOnly cookies from the API server; tokens must be returned in the JSON response body and stored on-device using SecureStore.

## Endpoints added to `artifacts/api-server/src/routes/auth.ts`:
- `POST /api/auth/mobile/login` — same as `/login` but also returns `refreshToken` in response body
- `POST /api/auth/mobile/refresh` — accepts `{ refreshToken }` in request body, rotates and returns new token pair
- `POST /api/auth/mobile/logout` — accepts `{ refreshToken }` in request body, deletes from DB

## How to apply
When building mobile auth flows, always use `/api/auth/mobile/*` endpoints. Never use the cookie-based `/api/auth/refresh` from mobile code.

Token storage on mobile: access token in Zustand store (memory), refresh token in `expo-secure-store` via the platform-split `src/utils/secureStorage.ts`.
